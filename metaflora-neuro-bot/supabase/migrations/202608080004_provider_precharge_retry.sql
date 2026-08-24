BEGIN;

-- A provider can reject a checkout before a browser payment exists. Those
-- failures are safe to defer; they must not become a permanent manual row or
-- make the worker hammer a provider rate limit every five seconds.
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
        WHEN p_retryable
          AND topup.attempt_count < p_max_attempts
          AND (
            topup.charge_started_at IS NULL
            OR p_metadata->>'external_charge_started' = 'false'
          )
          THEN CASE
            WHEN p_metadata->>'external_charge_started' = 'false' THEN 'processing'
            ELSE 'queued'
          END
        WHEN topup.charge_started_at IS NOT NULL THEN 'manual'
        ELSE 'failed'
      END,
      error_code = p_error_code,
      charge_started_at = CASE
        WHEN p_metadata->>'external_charge_started' = 'false' THEN NULL
        ELSE topup.charge_started_at
      END,
      claim_token = NULL,
      claimed_at = NULL,
      lease_until = CASE
        WHEN p_retryable
          AND p_metadata->>'external_charge_started' = 'false'
          AND topup.attempt_count < p_max_attempts
          THEN now() + make_interval(secs => CASE
            WHEN (p_metadata->>'retry_after_seconds') ~ '^[0-9]{1,5}$'
              THEN LEAST(GREATEST((p_metadata->>'retry_after_seconds')::integer, 5), 86400)
            WHEN p_error_code = 'provider_rate_limited' THEN 3600
            ELSE 30
          END)
        ELSE NULL
      END,
      processed_at = CASE
        WHEN p_retryable
          AND topup.attempt_count < p_max_attempts
          AND (
            topup.charge_started_at IS NULL
            OR p_metadata->>'external_charge_started' = 'false'
          ) THEN NULL
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

-- Controlled recovery for the real smoke row that failed before the checkout
-- link was created. It is intentionally narrow: only an existing manual row
-- with the at-most-once pre-charge marker can be moved back to a deferred
-- processing state. No generic manual retry endpoint is exposed.
CREATE OR REPLACE FUNCTION neuro.requeue_provider_topup_precharge(
  p_id uuid,
  p_error_code text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_id IS NULL
    OR p_error_code IS NULL
    OR p_error_code NOT IN ('tool_call_failed', 'provider_rate_limited')
    OR p_metadata IS NULL
    OR jsonb_typeof(p_metadata) <> 'object' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid provider pre-charge recovery';
  END IF;

  UPDATE neuro.provider_topup_requests AS topup
  SET status = 'queued',
      error_code = 'provider_rate_limited',
      charge_started_at = NULL,
      claim_token = NULL,
      claimed_at = NULL,
      lease_until = NULL,
      processed_at = NULL,
      metadata = topup.metadata || p_metadata || jsonb_build_object(
        'external_charge_started', false,
        'precharge_recovered', true,
        'recovery_mode', 'manual_verified_precharge'
      ),
      updated_at = now()
  WHERE topup.id = p_id
    AND topup.status = 'manual'
    AND topup.error_code = p_error_code
    AND topup.charge_started_at IS NOT NULL
    AND topup.metadata->>'chargeState' = 'started_before_external_call';
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION neuro.fail_provider_topup_request(uuid, uuid, text, boolean, integer, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.fail_provider_topup_request(uuid, uuid, text, boolean, integer, jsonb)
  TO service_role;
REVOKE ALL ON FUNCTION neuro.requeue_provider_topup_precharge(uuid, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.requeue_provider_topup_precharge(uuid, text, jsonb)
  TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
