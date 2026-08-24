BEGIN;

-- Provider funding is a leased, auditable queue. The existing allocation_key
-- remains the idempotency anchor; payment_id is always read from the related
-- finance allocation so a caller cannot substitute another payment.
ALTER TABLE neuro.provider_topup_requests
  ADD COLUMN IF NOT EXISTS claim_token uuid,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS lease_until timestamptz,
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0
    CHECK (attempt_count >= 0),
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS observed_transaction_id text,
  ADD COLUMN IF NOT EXISTS observed_amount_kopecks bigint
    CHECK (observed_amount_kopecks IS NULL OR observed_amount_kopecks > 0),
  ADD COLUMN IF NOT EXISTS observed_balance_kopecks bigint
    CHECK (observed_balance_kopecks IS NULL OR observed_balance_kopecks >= 0),
  ADD COLUMN IF NOT EXISTS observed_at timestamptz,
  ADD COLUMN IF NOT EXISTS processed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS provider_topup_requests_allocation_provider_idx
  ON neuro.provider_topup_requests(allocation_key, provider);

CREATE INDEX IF NOT EXISTS provider_topup_requests_claim_idx
  ON neuro.provider_topup_requests(provider, status, lease_until, created_at)
  WHERE status IN ('queued', 'processing');

CREATE OR REPLACE FUNCTION neuro.claim_provider_topup_requests(
  p_provider text,
  p_limit integer DEFAULT 10,
  p_lease_seconds integer DEFAULT 300,
  p_max_attempts integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  allocation_key text,
  payment_id text,
  provider text,
  amount_kopecks bigint,
  currency text,
  status text,
  attempt_count integer,
  claim_token uuid,
  lease_until timestamptz,
  external_id text,
  observed_transaction_id text,
  observed_amount_kopecks bigint,
  observed_balance_kopecks bigint,
  observed_at timestamptz,
  error_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_provider IS NULL OR p_provider !~ '^[a-z][a-z0-9_-]{1,63}$'
    OR p_limit IS NULL OR p_limit < 1 OR p_limit > 50
    OR p_lease_seconds IS NULL OR p_lease_seconds < 30 OR p_lease_seconds > 3600
    OR p_max_attempts IS NULL OR p_max_attempts < 1 OR p_max_attempts > 10 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid provider topup claim options';
  END IF;

  UPDATE neuro.provider_topup_requests AS topup
  SET status = 'failed',
      error_code = 'max_attempts_exceeded',
      claim_token = NULL,
      claimed_at = NULL,
      lease_until = NULL,
      processed_at = COALESCE(processed_at, now()),
      updated_at = now()
  WHERE topup.provider = p_provider
    AND topup.status = 'processing'
    AND topup.lease_until < now()
    AND topup.attempt_count >= p_max_attempts;

  RETURN QUERY
  WITH candidates AS (
    SELECT topup.id
    FROM neuro.provider_topup_requests AS topup
    JOIN neuro.finance_allocations AS allocation
      ON allocation.allocation_key = topup.allocation_key
    WHERE topup.provider = p_provider
      AND allocation.external_payment_id IS NOT NULL
      AND topup.attempt_count < p_max_attempts
      AND (
        topup.status = 'queued'
        OR (topup.status = 'processing' AND topup.lease_until < now())
      )
    ORDER BY topup.created_at, topup.id
    FOR UPDATE OF topup SKIP LOCKED
    LIMIT p_limit
  ), claimed AS (
    UPDATE neuro.provider_topup_requests AS topup
    SET status = 'processing',
        claim_token = gen_random_uuid(),
        claimed_at = now(),
        lease_until = now() + make_interval(secs => p_lease_seconds),
        attempt_count = topup.attempt_count + 1,
        last_attempt_at = now(),
        updated_at = now()
    FROM candidates
    WHERE topup.id = candidates.id
    RETURNING topup.*
  )
  SELECT claimed.id,
    claimed.allocation_key,
    allocation.external_payment_id,
    claimed.provider,
    claimed.amount_kopecks,
    claimed.currency,
    claimed.status,
    claimed.attempt_count,
    claimed.claim_token,
    claimed.lease_until,
    claimed.external_id,
    claimed.observed_transaction_id,
    claimed.observed_amount_kopecks,
    claimed.observed_balance_kopecks,
    claimed.observed_at,
    claimed.error_code
  FROM claimed
  JOIN neuro.finance_allocations AS allocation
    ON allocation.allocation_key = claimed.allocation_key;
END;
$$;

CREATE OR REPLACE FUNCTION neuro.get_provider_topup_request(
  p_allocation_key text,
  p_payment_id text,
  p_provider text
)
RETURNS TABLE (
  id uuid,
  allocation_key text,
  payment_id text,
  provider text,
  amount_kopecks bigint,
  currency text,
  status text,
  attempt_count integer,
  claim_token uuid,
  lease_until timestamptz,
  external_id text,
  observed_transaction_id text,
  observed_amount_kopecks bigint,
  observed_balance_kopecks bigint,
  observed_at timestamptz,
  error_code text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT topup.id,
    topup.allocation_key,
    allocation.external_payment_id,
    topup.provider,
    topup.amount_kopecks,
    topup.currency,
    topup.status,
    topup.attempt_count,
    topup.claim_token,
    topup.lease_until,
    topup.external_id,
    topup.observed_transaction_id,
    topup.observed_amount_kopecks,
    topup.observed_balance_kopecks,
    topup.observed_at,
    topup.error_code
  FROM neuro.provider_topup_requests AS topup
  JOIN neuro.finance_allocations AS allocation
    ON allocation.allocation_key = topup.allocation_key
  WHERE topup.allocation_key = p_allocation_key
    AND allocation.external_payment_id = p_payment_id
    AND topup.provider = p_provider
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION neuro.complete_provider_topup_request(
  p_id uuid,
  p_claim_token uuid,
  p_external_id text,
  p_observed_transaction_id text,
  p_observed_amount_kopecks bigint,
  p_observed_balance_kopecks bigint,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_expected_amount bigint;
BEGIN
  IF p_id IS NULL OR p_claim_token IS NULL
    OR p_external_id IS NULL OR p_external_id !~ '^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,254}$'
    OR p_observed_transaction_id IS NULL
    OR p_observed_transaction_id !~ '^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,254}$'
    OR p_observed_amount_kopecks IS NULL OR p_observed_amount_kopecks <= 0
    OR p_observed_balance_kopecks IS NULL OR p_observed_balance_kopecks < 0
    OR p_metadata IS NULL OR jsonb_typeof(p_metadata) <> 'object' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid provider topup completion';
  END IF;

  SELECT topup.amount_kopecks INTO v_expected_amount
  FROM neuro.provider_topup_requests AS topup
  WHERE topup.id = p_id
    AND topup.status = 'processing'
    AND topup.claim_token = p_claim_token
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  IF v_expected_amount <> p_observed_amount_kopecks THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'observed provider amount does not match allocation';
  END IF;

  UPDATE neuro.provider_topup_requests AS topup
  SET status = 'succeeded',
      external_id = p_external_id,
      error_code = NULL,
      claim_token = NULL,
      claimed_at = NULL,
      lease_until = NULL,
      observed_transaction_id = p_observed_transaction_id,
      observed_amount_kopecks = p_observed_amount_kopecks,
      observed_balance_kopecks = p_observed_balance_kopecks,
      observed_at = now(),
      processed_at = now(),
      metadata = topup.metadata || p_metadata,
      updated_at = now()
  WHERE topup.id = p_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION neuro.fail_provider_topup_request(
  p_id uuid,
  p_claim_token uuid,
  p_error_code text,
  p_retryable boolean DEFAULT false,
  p_max_attempts integer DEFAULT 5,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_id IS NULL OR p_claim_token IS NULL
    OR p_error_code IS NULL OR p_error_code !~ '^[a-z][a-z0-9_-]{1,63}$'
    OR p_max_attempts IS NULL OR p_max_attempts < 1 OR p_max_attempts > 10
    OR p_metadata IS NULL OR jsonb_typeof(p_metadata) <> 'object' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid provider topup failure';
  END IF;

  UPDATE neuro.provider_topup_requests AS topup
  SET status = CASE
        WHEN p_retryable AND topup.attempt_count < p_max_attempts THEN 'queued'
        ELSE 'failed'
      END,
      error_code = p_error_code,
      claim_token = NULL,
      claimed_at = NULL,
      lease_until = NULL,
      processed_at = CASE
        WHEN p_retryable AND topup.attempt_count < p_max_attempts THEN NULL
        ELSE now()
      END,
      metadata = topup.metadata || p_metadata,
      updated_at = now()
  WHERE topup.id = p_id
    AND topup.status = 'processing'
    AND topup.claim_token = p_claim_token;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION neuro.claim_provider_topup_requests(text, integer, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.claim_provider_topup_requests(text, integer, integer, integer)
  TO service_role;
REVOKE ALL ON FUNCTION neuro.get_provider_topup_request(text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.get_provider_topup_request(text, text, text)
  TO service_role;
REVOKE ALL ON FUNCTION neuro.complete_provider_topup_request(uuid, uuid, text, text, bigint, bigint, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.complete_provider_topup_request(uuid, uuid, text, text, bigint, bigint, jsonb)
  TO service_role;
REVOKE ALL ON FUNCTION neuro.fail_provider_topup_request(uuid, uuid, text, boolean, integer, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.fail_provider_topup_request(uuid, uuid, text, boolean, integer, jsonb)
  TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
