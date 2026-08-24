BEGIN;

-- XTR is a Telegram platform unit, not a subdivision of RUB. Keep it out of
-- every *_kopecks column until Telegram's fiat settlement is actually known.
ALTER TABLE neuro.payments
  ADD COLUMN IF NOT EXISTS amount_xtr bigint
    CHECK (amount_xtr IS NULL OR amount_xtr > 0),
  ALTER COLUMN amount_kopecks DROP NOT NULL;

UPDATE neuro.payments
SET amount_xtr = amount_kopecks,
    amount_kopecks = NULL
WHERE currency = 'XTR'
  AND amount_xtr IS NULL;

DO $$
BEGIN
  ALTER TABLE neuro.payments
    ADD CONSTRAINT payments_currency_amount_unit_check CHECK (
      (currency = 'XTR' AND amount_xtr IS NOT NULL AND amount_kopecks IS NULL)
      OR
      (currency <> 'XTR' AND amount_xtr IS NULL AND amount_kopecks IS NOT NULL AND amount_kopecks > 0)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

ALTER TABLE neuro.subscriptions
  ADD COLUMN IF NOT EXISTS price_xtr bigint
    CHECK (price_xtr IS NULL OR price_xtr > 0),
  ALTER COLUMN price_kopecks DROP NOT NULL;

UPDATE neuro.subscriptions AS subscription
SET price_xtr = payment.amount_xtr,
    price_kopecks = NULL
FROM neuro.payments AS payment
WHERE subscription.source_payment_id = payment.id
  AND payment.currency = 'XTR'
  AND subscription.price_xtr IS NULL;

DO $$
BEGIN
  ALTER TABLE neuro.subscriptions
    ADD CONSTRAINT subscriptions_price_unit_check CHECK (
      (price_xtr IS NOT NULL AND price_kopecks IS NULL)
      OR
      (price_xtr IS NULL AND price_kopecks IS NOT NULL AND price_kopecks >= 0)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS neuro.telegram_stars_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_key text NOT NULL UNIQUE,
  charge_id text NOT NULL UNIQUE,
  payment_id uuid NOT NULL UNIQUE REFERENCES neuro.payments(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  entry_type text NOT NULL DEFAULT 'payment'
    CHECK (entry_type IN ('payment', 'refund', 'adjustment')),
  xtr_delta bigint NOT NULL CHECK (xtr_delta <> 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS telegram_stars_ledger_user_idx
  ON neuro.telegram_stars_ledger(user_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS neuro.telegram_stars_receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charge_id text NOT NULL UNIQUE,
  payment_id uuid NOT NULL UNIQUE REFERENCES neuro.payments(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  xtr_amount bigint NOT NULL CHECK (xtr_amount > 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'settled', 'reversed')),
  settlement_id text UNIQUE,
  settlement_currency text,
  settlement_amount_kopecks bigint
    CHECK (settlement_amount_kopecks IS NULL OR settlement_amount_kopecks > 0),
  settled_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (status = 'pending' AND settlement_id IS NULL AND settlement_currency IS NULL
      AND settlement_amount_kopecks IS NULL AND settled_at IS NULL)
    OR
    (status = 'settled' AND settlement_id IS NOT NULL AND settlement_currency = 'RUB'
      AND settlement_amount_kopecks IS NOT NULL AND settled_at IS NOT NULL)
    OR
    (status = 'reversed' AND settlement_amount_kopecks IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS telegram_stars_receivables_status_idx
  ON neuro.telegram_stars_receivables(status, created_at);

INSERT INTO neuro.telegram_stars_ledger (
  ledger_key, charge_id, payment_id, user_id, entry_type, xtr_delta, metadata, occurred_at
)
SELECT
  'stars:payment:' || payment.payment_id,
  payment.payment_id,
  payment.id,
  payment.user_id,
  'payment',
  payment.amount_xtr,
  jsonb_build_object('backfilled', true),
  COALESCE(payment.paid_at, payment.created_at)
FROM neuro.payments AS payment
WHERE payment.currency = 'XTR'
ON CONFLICT (charge_id) DO NOTHING;

INSERT INTO neuro.telegram_stars_receivables (
  charge_id, payment_id, user_id, xtr_amount, status, metadata, created_at, updated_at
)
SELECT
  payment.payment_id,
  payment.id,
  payment.user_id,
  payment.amount_xtr,
  'pending',
  jsonb_build_object('backfilled', true),
  COALESCE(payment.paid_at, payment.created_at),
  now()
FROM neuro.payments AS payment
WHERE payment.currency = 'XTR'
ON CONFLICT (charge_id) DO NOTHING;

CREATE OR REPLACE FUNCTION neuro.record_telegram_stars_payment(
  p_telegram_user_id bigint,
  p_charge_id text,
  p_product_type text,
  p_product_id text,
  p_amount_xtr bigint,
  p_base_metacoins integer,
  p_paid_at timestamptz,
  p_provider_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (payment_id uuid, duplicate boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_payment neuro.payments%ROWTYPE;
  v_payment_id uuid;
  v_ledger neuro.telegram_stars_ledger%ROWTYPE;
  v_receivable neuro.telegram_stars_receivables%ROWTYPE;
  v_duplicate boolean := false;
BEGIN
  IF p_telegram_user_id IS NULL OR p_telegram_user_id <= 0
    OR p_charge_id IS NULL OR p_charge_id !~ '^[A-Za-z0-9_-]{1,128}$'
    OR p_product_type IS NULL OR p_product_type NOT IN ('metacoins', 'subscription')
    OR p_product_id IS NULL OR char_length(p_product_id) NOT BETWEEN 1 AND 80
    OR p_amount_xtr IS NULL OR p_amount_xtr <= 0
    OR p_base_metacoins IS NULL OR p_base_metacoins <= 0
    OR p_paid_at IS NULL
    OR p_provider_payload IS NULL OR jsonb_typeof(p_provider_payload) <> 'object' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid Telegram Stars payment payload';
  END IF;

  SELECT app_user.id INTO v_user_id
  FROM neuro.users AS app_user
  WHERE app_user.telegram_user_id = p_telegram_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Telegram Stars payment user does not exist';
  END IF;

  SELECT payment.* INTO v_payment
  FROM neuro.payments AS payment
  WHERE payment.payment_id = p_charge_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_payment.user_id <> v_user_id
      OR v_payment.provider <> 'telegram_stars'
      OR v_payment.product_type <> p_product_type
      OR v_payment.product_id <> p_product_id
      OR v_payment.amount_xtr <> p_amount_xtr
      OR v_payment.amount_kopecks IS NOT NULL
      OR v_payment.currency <> 'XTR'
      OR v_payment.payment_method <> 'telegram_stars'
      OR v_payment.status <> 'succeeded'
      OR v_payment.base_metacoins <> p_base_metacoins THEN
      RAISE EXCEPTION USING ERRCODE = '22023',
        MESSAGE = 'Telegram Stars payment idempotency payload conflicts';
    END IF;
    v_payment_id := v_payment.id;
    v_duplicate := true;
  ELSE
    INSERT INTO neuro.payments (
      user_id, payment_id, provider, product_type, product_id,
      amount_kopecks, amount_xtr, currency, payment_method, status,
      base_metacoins, receipt_registration, provider_payload, paid_at, updated_at
    ) VALUES (
      v_user_id, p_charge_id, 'telegram_stars', p_product_type, p_product_id,
      NULL, p_amount_xtr, 'XTR', 'telegram_stars', 'succeeded',
      p_base_metacoins, 'unknown', p_provider_payload, p_paid_at, now()
    )
    RETURNING id INTO v_payment_id;
  END IF;

  INSERT INTO neuro.telegram_stars_ledger (
    ledger_key, charge_id, payment_id, user_id, entry_type, xtr_delta, metadata, occurred_at
  ) VALUES (
    'stars:payment:' || p_charge_id, p_charge_id, v_payment_id, v_user_id,
    'payment', p_amount_xtr, p_provider_payload, p_paid_at
  )
  ON CONFLICT (charge_id) DO NOTHING;

  SELECT ledger.* INTO v_ledger
  FROM neuro.telegram_stars_ledger AS ledger
  WHERE ledger.charge_id = p_charge_id;
  IF NOT FOUND OR v_ledger.payment_id <> v_payment_id OR v_ledger.user_id <> v_user_id
    OR v_ledger.entry_type <> 'payment' OR v_ledger.xtr_delta <> p_amount_xtr THEN
    RAISE EXCEPTION USING ERRCODE = '22023',
      MESSAGE = 'Telegram Stars ledger idempotency payload conflicts';
  END IF;

  INSERT INTO neuro.telegram_stars_receivables (
    charge_id, payment_id, user_id, xtr_amount, status, metadata
  ) VALUES (
    p_charge_id, v_payment_id, v_user_id, p_amount_xtr, 'pending',
    jsonb_build_object('source', 'telegram_stars_payment')
  )
  ON CONFLICT (charge_id) DO NOTHING;

  SELECT receivable.* INTO v_receivable
  FROM neuro.telegram_stars_receivables AS receivable
  WHERE receivable.charge_id = p_charge_id;
  IF NOT FOUND OR v_receivable.payment_id <> v_payment_id OR v_receivable.user_id <> v_user_id
    OR v_receivable.xtr_amount <> p_amount_xtr THEN
    RAISE EXCEPTION USING ERRCODE = '22023',
      MESSAGE = 'Telegram Stars receivable idempotency payload conflicts';
  END IF;

  RETURN QUERY SELECT v_payment_id, v_duplicate;
END;
$$;

CREATE OR REPLACE FUNCTION neuro.record_stars_subscription_activation(
  p_telegram_user_id bigint,
  p_payment_id text,
  p_plan_id text,
  p_starts_at timestamptz,
  p_expires_at timestamptz,
  p_price_xtr bigint,
  p_metacoins integer,
  p_balance_after integer
)
RETURNS TABLE (
  subscription_id uuid,
  ledger_id uuid,
  duplicate boolean,
  starts_at timestamptz,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_payment neuro.payments%ROWTYPE;
  v_existing neuro.subscriptions%ROWTYPE;
  v_existing_ledger neuro.metacoin_ledger%ROWTYPE;
  v_subscription_id uuid := gen_random_uuid();
  v_ledger_id uuid;
  v_ledger_key text;
  v_status text;
  v_duplicate boolean := false;
BEGIN
  IF p_telegram_user_id IS NULL OR p_telegram_user_id <= 0
    OR p_payment_id IS NULL OR char_length(p_payment_id) NOT BETWEEN 1 AND 128
    OR p_plan_id IS NULL OR p_plan_id !~ '^[a-z][a-z0-9_]{1,63}$'
    OR p_starts_at IS NULL OR p_expires_at IS NULL OR p_expires_at <= p_starts_at
    OR p_expires_at > p_starts_at + interval '370 days'
    OR p_price_xtr IS NULL OR p_price_xtr <= 0
    OR p_metacoins IS NULL OR p_metacoins <= 0
    OR p_balance_after IS NULL OR p_balance_after < 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid Stars subscription activation payload';
  END IF;

  SELECT app_user.id INTO v_user_id
  FROM neuro.users AS app_user
  WHERE app_user.telegram_user_id = p_telegram_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Stars subscription user does not exist';
  END IF;

  SELECT payment.* INTO v_payment
  FROM neuro.payments AS payment
  WHERE payment.payment_id = p_payment_id
  FOR UPDATE;
  IF NOT FOUND OR v_payment.user_id <> v_user_id
    OR v_payment.provider <> 'telegram_stars'
    OR v_payment.product_type <> 'subscription'
    OR v_payment.product_id <> p_plan_id
    OR v_payment.status <> 'succeeded'
    OR v_payment.amount_xtr <> p_price_xtr
    OR v_payment.amount_kopecks IS NOT NULL
    OR v_payment.base_metacoins <> p_metacoins THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Stars subscription payment payload conflicts';
  END IF;

  SELECT subscription.* INTO v_existing
  FROM neuro.subscriptions AS subscription
  WHERE subscription.source_payment_id = v_payment.id;
  IF FOUND THEN
    IF v_existing.user_id <> v_user_id OR v_existing.plan_id <> p_plan_id
      OR v_existing.price_xtr <> p_price_xtr OR v_existing.price_kopecks IS NOT NULL
      OR v_existing.metacoins_total <> p_metacoins
      OR v_existing.starts_at <> p_starts_at OR v_existing.expires_at <> p_expires_at THEN
      RAISE EXCEPTION USING ERRCODE = '22023',
        MESSAGE = 'Stars subscription activation idempotency payload conflicts';
    END IF;
    v_subscription_id := v_existing.id;
    v_duplicate := true;
  ELSE
    v_status := CASE
      WHEN p_expires_at <= now() THEN 'expired'
      WHEN p_starts_at > now() THEN 'pending'
      ELSE 'active'
    END;
    INSERT INTO neuro.subscriptions (
      id, user_id, plan_id, status, source_payment_id, price_kopecks, price_xtr,
      metacoins_total, metacoins_remaining, starts_at, expires_at
    ) VALUES (
      v_subscription_id, v_user_id, p_plan_id, v_status, v_payment.id, NULL, p_price_xtr,
      p_metacoins, p_metacoins, p_starts_at, p_expires_at
    );
  END IF;

  v_ledger_key := 'subscription:' || p_payment_id;
  SELECT ledger.* INTO v_existing_ledger
  FROM neuro.metacoin_ledger AS ledger
  WHERE ledger.idempotency_key = v_ledger_key;
  IF FOUND THEN
    IF v_existing_ledger.user_id <> v_user_id OR v_existing_ledger.delta <> p_metacoins
      OR v_existing_ledger.source <> 'subscription'
      OR v_existing_ledger.reference_id <> v_subscription_id::text THEN
      RAISE EXCEPTION USING ERRCODE = '22023',
        MESSAGE = 'Stars subscription ledger idempotency payload conflicts';
    END IF;
    v_ledger_id := v_existing_ledger.id;
  ELSE
    IF p_balance_after < p_metacoins THEN
      RAISE EXCEPTION USING ERRCODE = '22023',
        MESSAGE = 'Stars subscription balance is below the credited amount';
    END IF;
    INSERT INTO neuro.metacoin_ledger (
      user_id, idempotency_key, delta, balance_after, source,
      reference_type, reference_id, description, metadata
    ) VALUES (
      v_user_id, v_ledger_key, p_metacoins, p_balance_after, 'subscription',
      'subscription', v_subscription_id::text, 'начисление по тарифу Telegram Stars',
      jsonb_build_object('plan_id', p_plan_id, 'payment_id', p_payment_id,
        'price_xtr', p_price_xtr, 'metacoins_expire', false)
    ) RETURNING id INTO v_ledger_id;
  END IF;

  RETURN QUERY SELECT v_subscription_id, v_ledger_id, v_duplicate, p_starts_at, p_expires_at;
END;
$$;

ALTER TABLE neuro.telegram_stars_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.telegram_stars_receivables ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON neuro.telegram_stars_ledger, neuro.telegram_stars_receivables FROM anon, authenticated;
GRANT ALL ON neuro.telegram_stars_ledger, neuro.telegram_stars_receivables TO service_role;

REVOKE ALL ON FUNCTION neuro.record_telegram_stars_payment(
  bigint, text, text, text, bigint, integer, timestamptz, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.record_telegram_stars_payment(
  bigint, text, text, text, bigint, integer, timestamptz, jsonb
) TO service_role;
REVOKE ALL ON FUNCTION neuro.record_stars_subscription_activation(
  bigint, text, text, timestamptz, timestamptz, bigint, integer, integer
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.record_stars_subscription_activation(
  bigint, text, text, timestamptz, timestamptz, bigint, integer, integer
) TO service_role;

COMMENT ON TABLE neuro.telegram_stars_receivables IS
  'XTR collected from users and awaiting an actual fiat settlement. Pending rows are not RUB cash.';
COMMENT ON COLUMN neuro.payments.amount_xtr IS
  'Telegram Stars amount in whole XTR units; never kopecks.';

NOTIFY pgrst, 'reload schema';

COMMIT;
