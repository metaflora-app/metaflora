BEGIN;

ALTER TABLE neuro.provider_webhooks
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz;

ALTER TABLE neuro.provider_webhooks
  DROP CONSTRAINT IF EXISTS provider_webhooks_processing_status_check;
ALTER TABLE neuro.provider_webhooks
  ADD CONSTRAINT provider_webhooks_processing_status_check
  CHECK (processing_status IN ('received', 'processing', 'processed', 'failed', 'ignored'));

CREATE OR REPLACE FUNCTION neuro.claim_provider_webhook(
  p_provider text,
  p_provider_event_id text,
  p_event_type text,
  p_signature_valid boolean,
  p_payload jsonb,
  p_lease_seconds integer DEFAULT 300
)
RETURNS TABLE (claimed boolean, processing_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row neuro.provider_webhooks%ROWTYPE;
  v_now timestamptz := now();
BEGIN
  IF p_provider IS NULL OR length(trim(p_provider)) < 2
    OR p_provider_event_id IS NULL OR length(p_provider_event_id) > 256
    OR p_event_type IS NULL OR length(p_event_type) > 120
    OR p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object'
    OR p_lease_seconds < 30 OR p_lease_seconds > 3600 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid provider webhook claim';
  END IF;

  INSERT INTO neuro.provider_webhooks (
    provider, provider_event_id, event_type, signature_valid, payload,
    processing_status, processing_started_at, processed_at
  ) VALUES (
    lower(trim(p_provider)), p_provider_event_id, p_event_type,
    p_signature_valid, p_payload, 'processing', v_now, NULL
  )
  ON CONFLICT (provider, provider_event_id) DO NOTHING
  RETURNING * INTO v_row;

  IF FOUND THEN
    RETURN QUERY SELECT true, 'processing'::text;
    RETURN;
  END IF;

  SELECT webhook.* INTO v_row
  FROM neuro.provider_webhooks AS webhook
  WHERE webhook.provider = lower(trim(p_provider))
    AND webhook.provider_event_id = p_provider_event_id
  FOR UPDATE;

  IF v_row.processing_status IN ('processed', 'ignored') THEN
    RETURN QUERY SELECT false, v_row.processing_status;
    RETURN;
  END IF;

  IF v_row.processing_status = 'processing'
    AND v_row.processing_started_at > v_now - make_interval(secs => p_lease_seconds) THEN
    RETURN QUERY SELECT false, 'processing'::text;
    RETURN;
  END IF;

  UPDATE neuro.provider_webhooks
  SET event_type = p_event_type,
      signature_valid = p_signature_valid,
      payload = p_payload,
      processing_status = 'processing',
      processing_started_at = v_now,
      processed_at = NULL,
      error_message = NULL
  WHERE id = v_row.id;

  RETURN QUERY SELECT true, 'processing'::text;
END;
$$;

REVOKE ALL ON FUNCTION neuro.claim_provider_webhook(text, text, text, boolean, jsonb, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.claim_provider_webhook(text, text, text, boolean, jsonb, integer)
  TO service_role;

COMMIT;
