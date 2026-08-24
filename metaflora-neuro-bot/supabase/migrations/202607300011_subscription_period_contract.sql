BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_source_payment_unique_idx
  ON neuro.subscriptions(source_payment_id)
  WHERE source_payment_id IS NOT NULL;

CREATE OR REPLACE FUNCTION neuro.record_subscription_activation(
  p_telegram_user_id bigint,
  p_payment_id text,
  p_plan_id text,
  p_starts_at timestamptz,
  p_expires_at timestamptz,
  p_price_kopecks integer,
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
  v_subscription_id uuid := gen_random_uuid();
  v_ledger_id uuid;
  v_existing_ledger neuro.metacoin_ledger%ROWTYPE;
  v_status text;
  v_ledger_key text;
  v_duplicate boolean := false;
BEGIN
  IF p_telegram_user_id IS NULL OR p_telegram_user_id <= 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid telegram user id';
  END IF;
  IF p_payment_id IS NULL OR char_length(p_payment_id) NOT BETWEEN 1 AND 128 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid payment id';
  END IF;
  IF p_plan_id IS NULL OR p_plan_id !~ '^[a-z][a-z0-9_]{1,63}$' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid plan id';
  END IF;
  IF p_starts_at IS NULL
    OR p_expires_at IS NULL
    OR p_expires_at <= p_starts_at
    OR p_expires_at > p_starts_at + interval '370 days' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid subscription period';
  END IF;
  IF p_price_kopecks IS NULL OR p_price_kopecks <= 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid subscription price';
  END IF;
  IF p_metacoins IS NULL OR p_metacoins <= 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid subscription metacoins';
  END IF;
  IF p_balance_after IS NULL OR p_balance_after < p_metacoins THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid resulting metacoin balance';
  END IF;

  SELECT app_user.id
  INTO v_user_id
  FROM neuro.users AS app_user
  WHERE app_user.telegram_user_id = p_telegram_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'subscription user does not exist';
  END IF;

  SELECT payment.*
  INTO v_payment
  FROM neuro.payments AS payment
  WHERE payment.payment_id = p_payment_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'subscription payment does not exist';
  END IF;
  IF v_payment.user_id <> v_user_id
    OR v_payment.product_type <> 'subscription'
    OR v_payment.product_id <> p_plan_id
    OR v_payment.status <> 'succeeded'
    OR v_payment.amount_kopecks <> p_price_kopecks
    OR v_payment.base_metacoins <> p_metacoins THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'subscription payment payload conflicts';
  END IF;

  SELECT subscription.*
  INTO v_existing
  FROM neuro.subscriptions AS subscription
  WHERE subscription.source_payment_id = v_payment.id;

  IF FOUND THEN
    IF v_existing.user_id <> v_user_id
      OR v_existing.plan_id <> p_plan_id
      OR v_existing.price_kopecks <> p_price_kopecks
      OR v_existing.metacoins_total <> p_metacoins
      OR v_existing.starts_at <> p_starts_at
      OR v_existing.expires_at <> p_expires_at THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'subscription activation idempotency payload conflicts';
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
      id,
      user_id,
      plan_id,
      status,
      source_payment_id,
      price_kopecks,
      metacoins_total,
      metacoins_remaining,
      starts_at,
      expires_at
    ) VALUES (
      v_subscription_id,
      v_user_id,
      p_plan_id,
      v_status,
      v_payment.id,
      p_price_kopecks,
      p_metacoins,
      p_metacoins,
      p_starts_at,
      p_expires_at
    );
  END IF;

  v_ledger_key := 'subscription:' || p_payment_id;
  SELECT ledger.*
  INTO v_existing_ledger
  FROM neuro.metacoin_ledger AS ledger
  WHERE ledger.idempotency_key = v_ledger_key;

  IF FOUND THEN
    IF v_existing_ledger.user_id <> v_user_id
      OR v_existing_ledger.delta <> p_metacoins
      OR v_existing_ledger.balance_after <> p_balance_after
      OR v_existing_ledger.source <> 'subscription'
      OR v_existing_ledger.reference_id <> v_subscription_id::text THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'subscription ledger idempotency payload conflicts';
    END IF;
    v_ledger_id := v_existing_ledger.id;
  ELSE
    INSERT INTO neuro.metacoin_ledger (
      user_id,
      idempotency_key,
      delta,
      balance_after,
      source,
      reference_type,
      reference_id,
      description,
      metadata
    ) VALUES (
      v_user_id,
      v_ledger_key,
      p_metacoins,
      p_balance_after,
      'subscription',
      'subscription',
      v_subscription_id::text,
      'начисление по платному тарифу',
      jsonb_build_object(
        'plan_id', p_plan_id,
        'payment_id', p_payment_id,
        'starts_at', p_starts_at,
        'expires_at', p_expires_at,
        'metacoins_expire', false
      )
    )
    RETURNING id INTO v_ledger_id;
  END IF;

  RETURN QUERY SELECT
    v_subscription_id,
    v_ledger_id,
    v_duplicate,
    p_starts_at,
    p_expires_at;
END;
$$;

CREATE OR REPLACE VIEW neuro.crm_subscription_overview
WITH (security_invoker = true)
AS
SELECT
  subscription.id,
  subscription.user_id,
  app_user.telegram_user_id,
  app_user.username,
  subscription.plan_id,
  CASE
    WHEN subscription.cancelled_at IS NOT NULL THEN 'cancelled'
    WHEN subscription.expires_at <= now() THEN 'expired'
    WHEN subscription.starts_at > now() THEN 'scheduled'
    ELSE 'active'
  END AS effective_status,
  subscription.starts_at,
  subscription.expires_at AS ends_at,
  subscription.price_kopecks,
  subscription.metacoins_total AS metacoins_credited,
  false AS metacoins_expire,
  (
    subscription.starts_at <= now()
    AND subscription.expires_at > now()
    AND subscription.cancelled_at IS NULL
  ) AS paid_access_active,
  latest_ledger.balance_after AS current_metacoin_balance,
  subscription.created_at,
  subscription.updated_at
FROM neuro.subscriptions AS subscription
JOIN neuro.users AS app_user ON app_user.id = subscription.user_id
LEFT JOIN LATERAL (
  SELECT ledger.balance_after
  FROM neuro.metacoin_ledger AS ledger
  WHERE ledger.user_id = subscription.user_id
  ORDER BY ledger.created_at DESC, ledger.id DESC
  LIMIT 1
) AS latest_ledger ON true;

REVOKE ALL ON FUNCTION neuro.record_subscription_activation(
  bigint, text, text, timestamptz, timestamptz, integer, integer, integer
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.record_subscription_activation(
  bigint, text, text, timestamptz, timestamptz, integer, integer, integer
) TO service_role;

REVOKE ALL ON TABLE neuro.crm_subscription_overview
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE neuro.crm_subscription_overview TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
