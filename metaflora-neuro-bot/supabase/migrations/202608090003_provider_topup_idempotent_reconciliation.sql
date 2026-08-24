BEGIN;

-- A connector interruption can leave the external result unknown. Requeue it
-- only when the durable browser adapter has the exact idempotency key needed
-- to reconcile the prior attempt without creating a second payment.
CREATE OR REPLACE FUNCTION neuro.requeue_provider_topup_reconciliation(
  p_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_id IS NULL
    OR p_metadata IS NULL
    OR jsonb_typeof(p_metadata) <> 'object' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid provider reconciliation recovery';
  END IF;

  UPDATE neuro.provider_topup_requests AS topup
  SET status = 'queued',
      attempt_count = 0,
      claim_token = NULL,
      claimed_at = NULL,
      lease_until = NULL,
      processed_at = NULL,
      metadata = topup.metadata || p_metadata || jsonb_build_object(
        'recovery_mode', 'idempotent_external_reconciliation'
      ),
      updated_at = now()
  WHERE topup.id = p_id
    AND topup.status = 'manual'
    AND topup.error_code = 'crm_funding_unavailable'
    AND topup.external_id IS NULL
    AND topup.observed_transaction_id IS NULL
    AND length(COALESCE(topup.metadata->>'charge_idempotency_key', '')) >= 8;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION neuro.requeue_provider_topup_reconciliation(uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.requeue_provider_topup_reconciliation(uuid, jsonb)
  TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
