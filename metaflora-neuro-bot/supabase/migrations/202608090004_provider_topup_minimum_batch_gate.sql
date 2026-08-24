BEGIN;

-- Polza accepts a card charge from 100 RUB. Keep smaller confirmed reserves
-- queued until their combined value can be charged once by the funding worker.
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
    AND topup.attempt_count >= p_max_attempts
    AND topup.charge_started_at IS NULL;

  RETURN QUERY
  WITH eligible_small_total AS (
    SELECT COALESCE(SUM(candidate.amount_kopecks), 0)::bigint AS total_kopecks
    FROM neuro.provider_topup_requests AS candidate
    JOIN neuro.finance_allocations AS candidate_allocation
      ON candidate_allocation.allocation_key = candidate.allocation_key
    WHERE candidate.provider = p_provider
      AND candidate.currency = 'RUB'
      AND candidate.amount_kopecks < 10000
      AND candidate.charge_started_at IS NULL
      AND candidate.attempt_count < p_max_attempts
      AND candidate_allocation.external_payment_id IS NOT NULL
      AND (
        candidate.status = 'queued'
        OR (candidate.status = 'processing' AND candidate.lease_until < now())
      )
  ), candidates AS (
    SELECT topup.id
    FROM neuro.provider_topup_requests AS topup
    JOIN neuro.finance_allocations AS allocation
      ON allocation.allocation_key = topup.allocation_key
    WHERE topup.provider = p_provider
      AND allocation.external_payment_id IS NOT NULL
      AND topup.attempt_count < p_max_attempts
      AND (
        topup.amount_kopecks >= 10000
        OR (SELECT small.total_kopecks FROM eligible_small_total AS small) >= 10000
      )
      AND (
        topup.status = 'queued'
        OR (
          topup.status = 'processing'
          AND topup.lease_until < now()
          AND topup.charge_started_at IS NULL
        )
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

REVOKE ALL ON FUNCTION neuro.claim_provider_topup_requests(text, integer, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.claim_provider_topup_requests(text, integer, integer, integer)
  TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
