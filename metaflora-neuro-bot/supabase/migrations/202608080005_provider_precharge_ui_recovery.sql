BEGIN;

-- A failed browser selector is a pre-charge failure.  The existing smoke row
-- is safe to recover only while the at-most-once marker says that no external
-- charge started and the provider transaction fields are still empty.
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
    OR p_error_code NOT IN (
      'tool_call_failed',
      'provider_rate_limited',
      'balance_topup_control_missing',
      'balance_amount_input_missing',
      'balance_submit_control_missing'
    )
    OR p_metadata IS NULL
    OR jsonb_typeof(p_metadata) <> 'object' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid provider pre-charge recovery';
  END IF;

  UPDATE neuro.provider_topup_requests AS topup
  SET status = 'queued',
      error_code = p_error_code,
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
    AND topup.external_id IS NULL
    AND topup.observed_transaction_id IS NULL
    AND (
      topup.charge_started_at IS NOT NULL
      OR topup.metadata->>'external_charge_started' = 'false'
    )
    AND topup.metadata->>'chargeState' = 'started_before_external_call';
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION neuro.requeue_provider_topup_precharge(uuid, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.requeue_provider_topup_precharge(uuid, text, jsonb)
  TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
