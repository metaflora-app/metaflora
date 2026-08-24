BEGIN;

ALTER TABLE neuro.crypto_usdc_finance_requests
  ADD COLUMN IF NOT EXISTS claim_token uuid,
  ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS charge_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS openrouter_external_id text,
  ADD COLUMN IF NOT EXISTS openrouter_funded_usdc_micros bigint,
  ADD COLUMN IF NOT EXISTS owner_transaction_hash text,
  ADD COLUMN IF NOT EXISTS owner_paid_usdc_micros bigint,
  ADD COLUMN IF NOT EXISTS error_code text,
  ADD COLUMN IF NOT EXISTS processing_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE neuro.crypto_usdc_finance_requests
  DROP CONSTRAINT IF EXISTS crypto_usdc_finance_requests_status_check;
ALTER TABLE neuro.crypto_usdc_finance_requests
  ADD CONSTRAINT crypto_usdc_finance_requests_status_check
  CHECK (status IN ('recorded', 'processing', 'completed', 'manual')),
  ADD CONSTRAINT crypto_usdc_owner_transaction_check
  CHECK (owner_transaction_hash IS NULL OR owner_transaction_hash ~ '^0x[0-9a-f]{64}$'),
  ADD CONSTRAINT crypto_usdc_completed_evidence_check CHECK (
    status <> 'completed' OR (
      openrouter_external_id IS NOT NULL
      AND openrouter_funded_usdc_micros = openrouter_usdc_micros
      AND owner_transaction_hash IS NOT NULL
      AND owner_paid_usdc_micros = owner_usdc_micros
    )
  );

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
    SELECT request.id
    FROM neuro.crypto_usdc_finance_requests AS request
    WHERE request.charge_started_at IS NULL
      AND (request.status = 'recorded'
        OR (request.status = 'processing' AND request.lease_expires_at < now()))
    ORDER BY request.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT p_limit
  ), claimed AS (
    UPDATE neuro.crypto_usdc_finance_requests AS request
    SET status = 'processing', claim_token = gen_random_uuid(),
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      attempt_count = request.attempt_count + 1, updated_at = now()
    FROM candidates WHERE request.id = candidates.id
    RETURNING request.*
  )
  SELECT claimed.id, claimed.claim_token, claimed.request_key, claimed.order_id,
    payment.transaction_hash, claimed.amount_usdc_micros,
    claimed.openrouter_credit_microusd, claimed.openrouter_usdc_micros,
    claimed.gas_reserve_usdc_micros, claimed.owner_usdc_micros,
    claimed.currency, claimed.chain
  FROM claimed
  JOIN neuro.crypto_usdc_payments AS payment ON payment.order_id = claimed.order_id
  WHERE payment.status = 'fulfilled' AND payment.transaction_hash IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION neuro.mark_crypto_usdc_funding_started(p_id uuid, p_claim_token uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_updated integer;
BEGIN
  IF p_metadata IS NULL OR jsonb_typeof(p_metadata) <> 'object' THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='invalid metadata'; END IF;
  UPDATE neuro.crypto_usdc_finance_requests SET charge_started_at = now(),
    processing_metadata = processing_metadata || p_metadata, updated_at = now()
  WHERE id = p_id AND claim_token = p_claim_token AND status = 'processing'
    AND charge_started_at IS NULL AND lease_expires_at > now();
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated = 1;
END;
$$;

CREATE OR REPLACE FUNCTION neuro.mark_crypto_usdc_funding_completed(
  p_id uuid, p_claim_token uuid, p_openrouter_external_id text,
  p_openrouter_funded_usdc_micros bigint, p_owner_transaction_hash text,
  p_owner_paid_usdc_micros bigint, p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_updated integer;
BEGIN
  UPDATE neuro.crypto_usdc_finance_requests SET status = 'completed',
    openrouter_external_id = p_openrouter_external_id,
    openrouter_funded_usdc_micros = p_openrouter_funded_usdc_micros,
    owner_transaction_hash = lower(p_owner_transaction_hash),
    owner_paid_usdc_micros = p_owner_paid_usdc_micros,
    processing_metadata = processing_metadata || COALESCE(p_metadata, '{}'::jsonb),
    lease_expires_at = NULL, updated_at = now()
  WHERE id = p_id AND claim_token = p_claim_token AND status = 'processing'
    AND charge_started_at IS NOT NULL
    AND p_openrouter_external_id IS NOT NULL
    AND p_openrouter_funded_usdc_micros = openrouter_usdc_micros
    AND lower(p_owner_transaction_hash) ~ '^0x[0-9a-f]{64}$'
    AND p_owner_paid_usdc_micros = owner_usdc_micros;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated = 1;
END;
$$;

CREATE OR REPLACE FUNCTION neuro.mark_crypto_usdc_funding_manual(
  p_id uuid, p_claim_token uuid, p_error_code text, p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_updated integer;
BEGIN
  UPDATE neuro.crypto_usdc_finance_requests SET status = 'manual',
    error_code = left(p_error_code, 80),
    processing_metadata = processing_metadata || COALESCE(p_metadata, '{}'::jsonb),
    lease_expires_at = NULL, updated_at = now()
  WHERE id = p_id AND claim_token = p_claim_token AND status = 'processing';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated = 1;
END;
$$;

REVOKE ALL ON FUNCTION neuro.claim_crypto_usdc_funding_requests(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION neuro.mark_crypto_usdc_funding_started(uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION neuro.mark_crypto_usdc_funding_completed(uuid, uuid, text, bigint, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION neuro.mark_crypto_usdc_funding_manual(uuid, uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.claim_crypto_usdc_funding_requests(integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.mark_crypto_usdc_funding_started(uuid, uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.mark_crypto_usdc_funding_completed(uuid, uuid, text, bigint, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.mark_crypto_usdc_funding_manual(uuid, uuid, text, jsonb) TO service_role;

COMMIT;
