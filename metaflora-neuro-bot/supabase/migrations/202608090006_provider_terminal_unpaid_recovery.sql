BEGIN;

-- Recover only a provider payment that Polza has already marked terminal and
-- unpaid. The payment id and terminal status are required so an uncertain card
-- charge can never be retried by this path.
CREATE OR REPLACE FUNCTION neuro.recover_provider_topup_terminal_unpaid(
  p_id uuid,
  p_provider_payment_id text,
  p_provider_status text,
  p_retry_after_seconds integer DEFAULT 3600
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_id IS NULL
    OR p_provider_payment_id IS NULL
    OR p_provider_payment_id !~ '^dep_[A-Za-z0-9_-]{6,128}$'
    OR lower(COALESCE(p_provider_status, '')) NOT IN (
      'error', 'failed', 'canceled', 'cancelled', 'declined', 'not_paid'
    )
    OR p_retry_after_seconds IS NULL
    OR p_retry_after_seconds < 300
    OR p_retry_after_seconds > 86400 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid terminal unpaid recovery';
  END IF;

  UPDATE neuro.provider_topup_requests AS topup
  SET status = 'processing',
      error_code = 'payment_declined',
      charge_started_at = NULL,
      claim_token = NULL,
      claimed_at = NULL,
      lease_until = now() + make_interval(secs => p_retry_after_seconds),
      processed_at = NULL,
      metadata = topup.metadata || jsonb_build_object(
        'external_charge_started', false,
        'provider_payment_id', p_provider_payment_id,
        'provider_payment_status', lower(p_provider_status),
        'terminal_unpaid_verified', true,
        'retry_after_seconds', p_retry_after_seconds
      ),
      updated_at = now()
  WHERE topup.id = p_id
    AND topup.status IN ('processing', 'manual')
    AND topup.external_id IS NULL
    AND topup.observed_transaction_id IS NULL
    AND topup.charge_started_at IS NOT NULL;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION neuro.recover_provider_topup_terminal_unpaid(uuid, text, text, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.recover_provider_topup_terminal_unpaid(uuid, text, text, integer)
  TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
