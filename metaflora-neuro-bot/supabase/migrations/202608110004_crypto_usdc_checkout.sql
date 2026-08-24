BEGIN;

CREATE TABLE IF NOT EXISTS neuro.crypto_usdc_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL UNIQUE CHECK (order_id ~ '^mfc_[a-f0-9]{32}$'),
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  telegram_chat_id bigint NOT NULL CHECK (telegram_chat_id > 0),
  product_kind text NOT NULL CHECK (product_kind IN ('package', 'tariff')),
  product_code text NOT NULL CHECK (product_code ~ '^[a-z][a-z0-9_]{1,63}$'),
  product_name text NOT NULL CHECK (length(product_name) BETWEEN 1 AND 200),
  duration_months integer NOT NULL CHECK (duration_months IN (1, 3)),
  metacoins integer NOT NULL CHECK (metacoins > 0),
  amount_usdc_micros bigint NOT NULL CHECK (amount_usdc_micros > 0),
  currency text NOT NULL DEFAULT 'USDC' CHECK (currency = 'USDC'),
  chain text NOT NULL DEFAULT 'base' CHECK (chain = 'base'),
  payment_method text NOT NULL DEFAULT 'crypto_usdc' CHECK (payment_method = 'crypto_usdc'),
  immutable_snapshot jsonb NOT NULL CHECK (jsonb_typeof(immutable_snapshot) = 'object'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'fulfilled')),
  external_payment_id text,
  transaction_hash text CHECK (transaction_hash IS NULL OR transaction_hash ~ '^0x[0-9a-f]{64}$'),
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'pending' AND confirmed_at IS NULL) OR (status IN ('confirmed', 'fulfilled') AND confirmed_at IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS neuro.crypto_usdc_callbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  callback_id text NOT NULL UNIQUE,
  order_id text NOT NULL REFERENCES neuro.crypto_usdc_payments(order_id) ON DELETE RESTRICT,
  external_payment_id text NOT NULL,
  transaction_hash text NOT NULL CHECK (transaction_hash ~ '^0x[0-9a-f]{64}$'),
  amount_usdc_micros bigint NOT NULL CHECK (amount_usdc_micros > 0),
  openrouter_credit_microusd bigint NOT NULL CHECK (openrouter_credit_microusd >= 5000000),
  openrouter_usdc_micros bigint NOT NULL CHECK (openrouter_usdc_micros >= 5250000),
  gas_reserve_usdc_micros bigint NOT NULL CHECK (gas_reserve_usdc_micros >= 10000),
  owner_usdc_micros bigint NOT NULL CHECK (owner_usdc_micros >= 0),
  currency text NOT NULL DEFAULT 'USDC' CHECK (currency = 'USDC'),
  chain text NOT NULL DEFAULT 'base' CHECK (chain = 'base'),
  chain_status text NOT NULL CHECK (chain_status = 'confirmed'),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS neuro.crypto_usdc_finance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_key text NOT NULL UNIQUE,
  order_id text NOT NULL UNIQUE REFERENCES neuro.crypto_usdc_payments(order_id) ON DELETE RESTRICT,
  amount_usdc_micros bigint NOT NULL CHECK (amount_usdc_micros > 0),
  openrouter_credit_microusd bigint NOT NULL CHECK (openrouter_credit_microusd >= 5000000),
  openrouter_usdc_micros bigint NOT NULL CHECK (openrouter_usdc_micros >= 5250000),
  gas_reserve_usdc_micros bigint NOT NULL CHECK (gas_reserve_usdc_micros >= 10000),
  owner_usdc_micros bigint NOT NULL CHECK (owner_usdc_micros >= 0),
  currency text NOT NULL DEFAULT 'USDC' CHECK (currency = 'USDC'),
  chain text NOT NULL DEFAULT 'base' CHECK (chain = 'base'),
  status text NOT NULL DEFAULT 'recorded' CHECK (status IN ('recorded', 'processing', 'completed', 'manual')),
  allocation_snapshot jsonb NOT NULL CHECK (jsonb_typeof(allocation_snapshot) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (openrouter_usdc_micros + gas_reserve_usdc_micros + owner_usdc_micros = amount_usdc_micros)
);

CREATE TABLE IF NOT EXISTS neuro.crypto_usdc_entitlement_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL UNIQUE REFERENCES neuro.crypto_usdc_payments(order_id) ON DELETE RESTRICT,
  payment_rail text NOT NULL DEFAULT 'crypto_usdc' CHECK (payment_rail = 'crypto_usdc'),
  funding_provider text NOT NULL DEFAULT 'openrouter' CHECK (funding_provider = 'openrouter'),
  entitlement_status text NOT NULL CHECK (entitlement_status IN ('fulfilled', 'duplicate')),
  immutable_snapshot jsonb NOT NULL CHECK (jsonb_typeof(immutable_snapshot) = 'object'),
  fulfilled_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crypto_usdc_payments_user_idx
  ON neuro.crypto_usdc_payments(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS crypto_usdc_payments_transaction_idx
  ON neuro.crypto_usdc_payments(lower(transaction_hash))
  WHERE transaction_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS crypto_usdc_callbacks_transaction_idx
  ON neuro.crypto_usdc_callbacks(lower(transaction_hash));
CREATE INDEX IF NOT EXISTS crypto_usdc_finance_requests_status_idx
  ON neuro.crypto_usdc_finance_requests(status, created_at);

ALTER TABLE neuro.crypto_usdc_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.crypto_usdc_callbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.crypto_usdc_finance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.crypto_usdc_entitlement_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON neuro.crypto_usdc_payments, neuro.crypto_usdc_callbacks,
  neuro.crypto_usdc_finance_requests, neuro.crypto_usdc_entitlement_audit FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON neuro.crypto_usdc_payments TO service_role;
GRANT SELECT ON neuro.crypto_usdc_callbacks, neuro.crypto_usdc_finance_requests,
  neuro.crypto_usdc_entitlement_audit TO service_role;

CREATE OR REPLACE FUNCTION neuro.record_crypto_usdc_callback(
  p_callback_id text,
  p_order_id text,
  p_external_payment_id text,
  p_transaction_hash text,
  p_amount_usdc_micros bigint,
  p_currency text,
  p_chain text,
  p_chain_status text,
  p_confirmed_at timestamptz,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  status text, duplicate boolean, finance_request_created boolean,
  telegram_user_id text, telegram_chat_id text, product_kind text,
  product_id text, duration_months integer, duration_days integer,
  metacoins integer, confirmed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payment neuro.crypto_usdc_payments%ROWTYPE;
  v_existing neuro.crypto_usdc_callbacks%ROWTYPE;
  v_inserted_callback uuid;
  v_inserted_request uuid;
BEGIN
  IF p_callback_id IS NULL OR p_callback_id !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{7,219}$'
    OR p_order_id IS NULL OR p_order_id !~ '^mfc_[a-f0-9]{32}$'
    OR p_external_payment_id IS NULL OR length(p_external_payment_id) NOT BETWEEN 2 AND 128
    OR p_transaction_hash IS NULL OR lower(p_transaction_hash) !~ '^0x[0-9a-f]{64}$'
    OR p_amount_usdc_micros IS NULL OR p_amount_usdc_micros <= 0
    OR p_currency <> 'USDC' OR p_chain <> 'base'
    OR p_chain_status <> 'confirmed'
    OR p_confirmed_at IS NULL
    OR p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid confirmed Crypto USDC callback';
  END IF;

  SELECT payment.* INTO v_payment
  FROM neuro.crypto_usdc_payments AS payment
  WHERE payment.order_id = p_order_id
  FOR UPDATE;
  IF NOT FOUND
    OR v_payment.amount_usdc_micros <> p_amount_usdc_micros
    OR v_payment.currency <> p_currency
    OR v_payment.chain <> p_chain THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Crypto USDC callback does not match checkout';
  END IF;

  INSERT INTO neuro.crypto_usdc_callbacks (
    callback_id, order_id, external_payment_id, transaction_hash,
    amount_usdc_micros, openrouter_credit_microusd, openrouter_usdc_micros,
    gas_reserve_usdc_micros, owner_usdc_micros,
    currency, chain, chain_status, payload, processed_at
  ) VALUES (
    p_callback_id, p_order_id, p_external_payment_id, lower(p_transaction_hash),
    p_amount_usdc_micros,
    (v_payment.immutable_snapshot->'allocation'->>'openrouterCreditMicrousd')::bigint,
    (v_payment.immutable_snapshot->'allocation'->>'openrouterUsdcMicros')::bigint,
    (v_payment.immutable_snapshot->'allocation'->>'gasReserveUsdcMicros')::bigint,
    (v_payment.immutable_snapshot->'allocation'->>'ownerUsdcMicros')::bigint,
    p_currency, p_chain, p_chain_status, p_payload, p_confirmed_at
  )
  ON CONFLICT (callback_id) DO NOTHING
  RETURNING id INTO v_inserted_callback;

  IF v_inserted_callback IS NULL THEN
    SELECT callback.* INTO v_existing
    FROM neuro.crypto_usdc_callbacks AS callback
    WHERE callback.callback_id = p_callback_id;
    IF v_existing.order_id <> p_order_id
      OR v_existing.external_payment_id <> p_external_payment_id
      OR v_existing.transaction_hash <> lower(p_transaction_hash)
      OR v_existing.amount_usdc_micros <> p_amount_usdc_micros THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Crypto USDC callback idempotency payload conflicts';
    END IF;
  END IF;

  IF v_payment.status IN ('confirmed', 'fulfilled') AND (
    v_payment.external_payment_id <> p_external_payment_id
    OR v_payment.transaction_hash <> lower(p_transaction_hash)
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Crypto USDC payment confirmation conflicts';
  END IF;

  UPDATE neuro.crypto_usdc_payments
  SET status = CASE WHEN status = 'fulfilled' THEN 'fulfilled' ELSE 'confirmed' END,
    external_payment_id = p_external_payment_id,
    transaction_hash = lower(p_transaction_hash),
    confirmed_at = COALESCE(confirmed_at, p_confirmed_at),
    updated_at = now()
  WHERE order_id = p_order_id;

  INSERT INTO neuro.crypto_usdc_finance_requests (
    request_key, order_id, amount_usdc_micros, openrouter_credit_microusd,
    openrouter_usdc_micros, gas_reserve_usdc_micros, owner_usdc_micros, currency, chain,
    status, allocation_snapshot, created_at, updated_at
  ) VALUES (
    'crypto_usdc:' || p_order_id,
    p_order_id,
    p_amount_usdc_micros,
    (v_payment.immutable_snapshot->'allocation'->>'openrouterCreditMicrousd')::bigint,
    (v_payment.immutable_snapshot->'allocation'->>'openrouterUsdcMicros')::bigint,
    (v_payment.immutable_snapshot->'allocation'->>'gasReserveUsdcMicros')::bigint,
    (v_payment.immutable_snapshot->'allocation'->>'ownerUsdcMicros')::bigint,
    p_currency,
    p_chain,
    'recorded',
    v_payment.immutable_snapshot->'allocation',
    p_confirmed_at,
    now()
  )
  ON CONFLICT (order_id) DO NOTHING
  RETURNING id INTO v_inserted_request;

  RETURN QUERY SELECT
    CASE WHEN v_payment.status = 'fulfilled' THEN 'fulfilled' ELSE 'confirmed' END,
    (v_inserted_callback IS NULL),
    (v_inserted_request IS NOT NULL),
    user_row.telegram_user_id::text,
    v_payment.telegram_chat_id::text,
    v_payment.product_kind,
    v_payment.product_code,
    v_payment.duration_months,
    CASE WHEN v_payment.product_kind = 'tariff' THEN v_payment.duration_months * 30 ELSE 0 END,
    v_payment.metacoins,
    COALESCE(v_payment.confirmed_at, p_confirmed_at)
  FROM neuro.users AS user_row
  WHERE user_row.id = v_payment.user_id;
END;
$$;

REVOKE ALL ON FUNCTION neuro.record_crypto_usdc_callback(
  text, text, text, text, bigint, text, text, text, timestamptz, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.record_crypto_usdc_callback(
  text, text, text, text, bigint, text, text, text, timestamptz, jsonb
) TO service_role;

CREATE OR REPLACE FUNCTION neuro.complete_crypto_usdc_fulfillment(
  p_order_id text,
  p_entitlement_status text,
  p_fulfilled_at timestamptz
)
RETURNS TABLE (status text, duplicate boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payment neuro.crypto_usdc_payments%ROWTYPE;
  v_inserted uuid;
BEGIN
  IF p_order_id IS NULL OR p_order_id !~ '^mfc_[a-f0-9]{32}$'
    OR p_entitlement_status NOT IN ('fulfilled', 'duplicate')
    OR p_fulfilled_at IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid Crypto USDC fulfillment';
  END IF;
  SELECT payment.* INTO v_payment
  FROM neuro.crypto_usdc_payments AS payment
  WHERE payment.order_id = p_order_id
  FOR UPDATE;
  IF NOT FOUND OR v_payment.status NOT IN ('confirmed', 'fulfilled') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Crypto USDC payment is not fulfillable';
  END IF;
  INSERT INTO neuro.crypto_usdc_entitlement_audit (
    order_id, payment_rail, funding_provider, entitlement_status,
    immutable_snapshot, fulfilled_at
  ) VALUES (
    p_order_id, 'crypto_usdc', 'openrouter', p_entitlement_status,
    v_payment.immutable_snapshot, p_fulfilled_at
  )
  ON CONFLICT (order_id) DO NOTHING
  RETURNING id INTO v_inserted;
  UPDATE neuro.crypto_usdc_payments
  SET status = 'fulfilled', updated_at = now()
  WHERE order_id = p_order_id;
  RETURN QUERY SELECT 'fulfilled'::text, (v_inserted IS NULL);
END;
$$;

REVOKE ALL ON FUNCTION neuro.complete_crypto_usdc_fulfillment(text, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.complete_crypto_usdc_fulfillment(text, text, timestamptz)
  TO service_role;

COMMIT;
