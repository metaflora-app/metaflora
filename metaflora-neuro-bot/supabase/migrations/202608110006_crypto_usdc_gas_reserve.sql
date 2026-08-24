BEGIN;

ALTER TABLE neuro.crypto_usdc_callbacks
  ADD COLUMN IF NOT EXISTS openrouter_credit_microusd bigint,
  ADD COLUMN IF NOT EXISTS gas_reserve_usdc_micros bigint;
ALTER TABLE neuro.crypto_usdc_finance_requests
  ADD COLUMN IF NOT EXISTS openrouter_credit_microusd bigint,
  ADD COLUMN IF NOT EXISTS gas_reserve_usdc_micros bigint;

UPDATE neuro.crypto_usdc_callbacks AS callback
SET openrouter_credit_microusd = (payment.immutable_snapshot->'allocation'->>'openrouterCreditMicrousd')::bigint,
  gas_reserve_usdc_micros = (payment.immutable_snapshot->'allocation'->>'gasReserveUsdcMicros')::bigint
FROM neuro.crypto_usdc_payments AS payment
WHERE payment.order_id = callback.order_id
  AND (callback.openrouter_credit_microusd IS NULL OR callback.gas_reserve_usdc_micros IS NULL);

UPDATE neuro.crypto_usdc_finance_requests
SET openrouter_credit_microusd = (allocation_snapshot->>'openrouterCreditMicrousd')::bigint,
  gas_reserve_usdc_micros = (allocation_snapshot->>'gasReserveUsdcMicros')::bigint
WHERE openrouter_credit_microusd IS NULL OR gas_reserve_usdc_micros IS NULL;

ALTER TABLE neuro.crypto_usdc_callbacks
  ALTER COLUMN openrouter_credit_microusd SET NOT NULL,
  ALTER COLUMN gas_reserve_usdc_micros SET NOT NULL;
ALTER TABLE neuro.crypto_usdc_finance_requests
  ALTER COLUMN openrouter_credit_microusd SET NOT NULL,
  ALTER COLUMN gas_reserve_usdc_micros SET NOT NULL;

ALTER TABLE neuro.crypto_usdc_callbacks
  DROP CONSTRAINT IF EXISTS crypto_usdc_callbacks_openrouter_credit_check,
  DROP CONSTRAINT IF EXISTS crypto_usdc_callbacks_gas_reserve_check;
ALTER TABLE neuro.crypto_usdc_callbacks
  ADD CONSTRAINT crypto_usdc_callbacks_openrouter_credit_check
    CHECK (openrouter_credit_microusd >= 5000000),
  ADD CONSTRAINT crypto_usdc_callbacks_gas_reserve_check
    CHECK (gas_reserve_usdc_micros >= 10000);

ALTER TABLE neuro.crypto_usdc_finance_requests
  DROP CONSTRAINT IF EXISTS crypto_usdc_finance_requests_check,
  DROP CONSTRAINT IF EXISTS crypto_usdc_finance_exact_sum_check,
  DROP CONSTRAINT IF EXISTS crypto_usdc_finance_openrouter_credit_check,
  DROP CONSTRAINT IF EXISTS crypto_usdc_finance_gas_reserve_check;
ALTER TABLE neuro.crypto_usdc_finance_requests
  ADD CONSTRAINT crypto_usdc_finance_openrouter_credit_check
    CHECK (openrouter_credit_microusd >= 5000000),
  ADD CONSTRAINT crypto_usdc_finance_gas_reserve_check
    CHECK (gas_reserve_usdc_micros >= 10000),
  ADD CONSTRAINT crypto_usdc_finance_exact_sum_check
    CHECK (openrouter_usdc_micros + gas_reserve_usdc_micros + owner_usdc_micros = amount_usdc_micros);

CREATE OR REPLACE FUNCTION neuro.record_crypto_usdc_callback(
  p_callback_id text, p_order_id text, p_external_payment_id text,
  p_transaction_hash text, p_amount_usdc_micros bigint, p_currency text,
  p_chain text, p_chain_status text, p_confirmed_at timestamptz,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  status text, duplicate boolean, finance_request_created boolean,
  telegram_user_id text, telegram_chat_id text, product_kind text,
  product_id text, duration_months integer, duration_days integer,
  metacoins integer, confirmed_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_payment neuro.crypto_usdc_payments%ROWTYPE;
  v_existing neuro.crypto_usdc_callbacks%ROWTYPE;
  v_inserted_callback uuid;
  v_inserted_request uuid;
  v_openrouter_credit bigint;
  v_openrouter_amount bigint;
  v_gas_reserve bigint;
  v_owner_amount bigint;
BEGIN
  IF p_callback_id IS NULL OR p_callback_id !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{7,219}$'
    OR p_order_id IS NULL OR p_order_id !~ '^mfc_[a-f0-9]{32}$'
    OR p_external_payment_id IS NULL OR length(p_external_payment_id) NOT BETWEEN 2 AND 128
    OR p_transaction_hash IS NULL OR lower(p_transaction_hash) !~ '^0x[0-9a-f]{64}$'
    OR p_amount_usdc_micros IS NULL OR p_amount_usdc_micros <= 0
    OR p_currency <> 'USDC' OR p_chain <> 'base' OR p_chain_status <> 'confirmed'
    OR p_confirmed_at IS NULL OR p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid confirmed Crypto USDC callback';
  END IF;

  SELECT payment.* INTO v_payment FROM neuro.crypto_usdc_payments AS payment
  WHERE payment.order_id = p_order_id FOR UPDATE;
  IF NOT FOUND OR v_payment.amount_usdc_micros <> p_amount_usdc_micros
    OR v_payment.currency <> p_currency OR v_payment.chain <> p_chain THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Crypto USDC callback does not match checkout';
  END IF;

  v_openrouter_credit := (v_payment.immutable_snapshot->'allocation'->>'openrouterCreditMicrousd')::bigint;
  v_openrouter_amount := (v_payment.immutable_snapshot->'allocation'->>'openrouterUsdcMicros')::bigint;
  v_gas_reserve := (v_payment.immutable_snapshot->'allocation'->>'gasReserveUsdcMicros')::bigint;
  v_owner_amount := (v_payment.immutable_snapshot->'allocation'->>'ownerUsdcMicros')::bigint;
  IF v_openrouter_credit < 5000000 OR v_openrouter_amount < 5250000 OR v_gas_reserve < 10000
    OR v_owner_amount < 0 OR v_openrouter_amount + v_gas_reserve + v_owner_amount <> p_amount_usdc_micros THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Crypto USDC allocation is invalid';
  END IF;

  INSERT INTO neuro.crypto_usdc_callbacks (
    callback_id, order_id, external_payment_id, transaction_hash,
    amount_usdc_micros, openrouter_credit_microusd, openrouter_usdc_micros,
    gas_reserve_usdc_micros, owner_usdc_micros, currency, chain,
    chain_status, payload, processed_at
  ) VALUES (
    p_callback_id, p_order_id, p_external_payment_id, lower(p_transaction_hash),
    p_amount_usdc_micros, v_openrouter_credit, v_openrouter_amount,
    v_gas_reserve, v_owner_amount, p_currency, p_chain,
    p_chain_status, p_payload, p_confirmed_at
  ) ON CONFLICT (callback_id) DO NOTHING RETURNING id INTO v_inserted_callback;

  IF v_inserted_callback IS NULL THEN
    SELECT callback.* INTO v_existing FROM neuro.crypto_usdc_callbacks AS callback
    WHERE callback.callback_id = p_callback_id;
    IF v_existing.order_id <> p_order_id OR v_existing.external_payment_id <> p_external_payment_id
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
    confirmed_at = COALESCE(confirmed_at, p_confirmed_at), updated_at = now()
  WHERE order_id = p_order_id;

  INSERT INTO neuro.crypto_usdc_finance_requests (
    request_key, order_id, amount_usdc_micros, openrouter_credit_microusd,
    openrouter_usdc_micros, gas_reserve_usdc_micros, owner_usdc_micros,
    currency, chain, status, allocation_snapshot, created_at, updated_at
  ) VALUES (
    'crypto_usdc:' || p_order_id, p_order_id, p_amount_usdc_micros,
    v_openrouter_credit, v_openrouter_amount, v_gas_reserve, v_owner_amount,
    p_currency, p_chain, 'recorded', v_payment.immutable_snapshot->'allocation',
    p_confirmed_at, now()
  ) ON CONFLICT (order_id) DO NOTHING RETURNING id INTO v_inserted_request;

  RETURN QUERY SELECT
    CASE WHEN v_payment.status = 'fulfilled' THEN 'fulfilled' ELSE 'confirmed' END,
    (v_inserted_callback IS NULL), (v_inserted_request IS NOT NULL),
    user_row.telegram_user_id::text, v_payment.telegram_chat_id::text,
    v_payment.product_kind, v_payment.product_code, v_payment.duration_months,
    CASE WHEN v_payment.product_kind = 'tariff' THEN v_payment.duration_months * 30 ELSE 0 END,
    v_payment.metacoins, COALESCE(v_payment.confirmed_at, p_confirmed_at)
  FROM neuro.users AS user_row WHERE user_row.id = v_payment.user_id;
END;
$$;

CREATE OR REPLACE FUNCTION neuro.claim_crypto_usdc_funding_requests(p_limit integer, p_lease_seconds integer)
RETURNS TABLE (
  id uuid, claim_token uuid, request_key text, order_id text,
  source_transaction_hash text, amount_usdc_micros bigint,
  openrouter_credit_microusd bigint, openrouter_usdc_micros bigint,
  gas_reserve_usdc_micros bigint, owner_usdc_micros bigint,
  currency text, chain text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_limit NOT BETWEEN 1 AND 32 OR p_lease_seconds NOT BETWEEN 30 AND 900 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid Crypto USDC claim limits';
  END IF;
  RETURN QUERY
  WITH candidates AS (
    SELECT request.id FROM neuro.crypto_usdc_finance_requests AS request
    WHERE request.charge_started_at IS NULL
      AND (request.status = 'recorded'
        OR (request.status = 'processing' AND request.lease_expires_at < now()))
    ORDER BY request.created_at FOR UPDATE SKIP LOCKED LIMIT p_limit
  ), claimed AS (
    UPDATE neuro.crypto_usdc_finance_requests AS request
    SET status = 'processing', claim_token = gen_random_uuid(),
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      attempt_count = request.attempt_count + 1, updated_at = now()
    FROM candidates WHERE request.id = candidates.id RETURNING request.*
  )
  SELECT claimed.id, claimed.claim_token, claimed.request_key, claimed.order_id,
    payment.transaction_hash, claimed.amount_usdc_micros,
    claimed.openrouter_credit_microusd, claimed.openrouter_usdc_micros,
    claimed.gas_reserve_usdc_micros, claimed.owner_usdc_micros,
    claimed.currency, claimed.chain
  FROM claimed JOIN neuro.crypto_usdc_payments AS payment ON payment.order_id = claimed.order_id
  WHERE payment.status = 'fulfilled' AND payment.transaction_hash IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION neuro.record_crypto_usdc_callback(
  text, text, text, text, bigint, text, text, text, timestamptz, jsonb
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION neuro.claim_crypto_usdc_funding_requests(integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.record_crypto_usdc_callback(
  text, text, text, text, bigint, text, text, text, timestamptz, jsonb
) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.claim_crypto_usdc_funding_requests(integer, integer)
  TO service_role;

COMMIT;
