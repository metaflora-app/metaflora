BEGIN;

CREATE TABLE IF NOT EXISTS neuro.legal_consent_status (
  user_id uuid PRIMARY KEY REFERENCES neuro.users(id) ON DELETE CASCADE,
  terms_accepted boolean NOT NULL DEFAULT false,
  terms_version text,
  terms_accepted_at timestamptz,
  personal_data_accepted boolean NOT NULL DEFAULT false,
  personal_data_version text,
  personal_data_accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS neuro.legal_consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE CASCADE,
  telegram_user_id bigint NOT NULL,
  consent_kind text NOT NULL CHECK (consent_kind IN ('terms', 'personal_data', 'gate_check')),
  document_version text NOT NULL,
  requested_acceptance boolean NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('accepted', 'duplicate', 'failed', 'blocked')),
  success boolean NOT NULL,
  failure_code text,
  telegram_update_id bigint,
  telegram_message_id bigint,
  telegram_callback_id text,
  request_key text NOT NULL UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS legal_consent_events_user_time_idx
  ON neuro.legal_consent_events (user_id, occurred_at DESC);

ALTER TABLE neuro.legal_consent_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.legal_consent_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE neuro.legal_consent_status FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE neuro.legal_consent_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE neuro.legal_consent_status TO service_role;
GRANT SELECT, INSERT ON TABLE neuro.legal_consent_events TO service_role;

CREATE OR REPLACE FUNCTION neuro.record_legal_consent(
  p_telegram_user_id bigint,
  p_consent_kind text,
  p_document_version text,
  p_request_key text,
  p_telegram_update_id bigint DEFAULT NULL,
  p_telegram_message_id bigint DEFAULT NULL,
  p_telegram_callback_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  terms_accepted boolean,
  personal_data_accepted boolean,
  completed boolean,
  duplicate boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = neuro, public
AS $$
DECLARE
  v_user_id uuid;
  v_existing_event neuro.legal_consent_events%ROWTYPE;
  v_status neuro.legal_consent_status%ROWTYPE;
  v_duplicate boolean := false;
BEGIN
  IF p_consent_kind NOT IN ('terms', 'personal_data') THEN
    RAISE EXCEPTION 'invalid consent kind';
  END IF;
  IF p_document_version IS NULL OR length(p_document_version) > 64 THEN
    RAISE EXCEPTION 'invalid document version';
  END IF;
  IF p_request_key IS NULL OR length(p_request_key) > 200 THEN
    RAISE EXCEPTION 'invalid request key';
  END IF;

  SELECT id INTO v_user_id
  FROM neuro.users
  WHERE telegram_user_id = p_telegram_user_id;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'history user is missing';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_telegram_user_id::text, 90427));

  SELECT * INTO v_existing_event
  FROM neuro.legal_consent_events
  WHERE request_key = p_request_key;
  IF FOUND THEN
    IF v_existing_event.user_id <> v_user_id
      OR v_existing_event.consent_kind <> p_consent_kind
      OR v_existing_event.document_version <> p_document_version THEN
      RAISE EXCEPTION 'legal consent idempotency conflict';
    END IF;
    v_duplicate := true;
  END IF;

  INSERT INTO neuro.legal_consent_status (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  IF NOT v_duplicate THEN
    IF p_consent_kind = 'terms' THEN
      UPDATE neuro.legal_consent_status SET
        terms_accepted = true,
        terms_version = p_document_version,
        terms_accepted_at = COALESCE(terms_accepted_at, now()),
        updated_at = now()
      WHERE user_id = v_user_id;
    ELSE
      UPDATE neuro.legal_consent_status SET
        personal_data_accepted = true,
        personal_data_version = p_document_version,
        personal_data_accepted_at = COALESCE(personal_data_accepted_at, now()),
        updated_at = now()
      WHERE user_id = v_user_id;
    END IF;

    UPDATE neuro.legal_consent_status AS consent_status SET
      completed_at = CASE
        WHEN consent_status.terms_accepted AND consent_status.personal_data_accepted
          THEN COALESCE(consent_status.completed_at, now())
        ELSE consent_status.completed_at
      END,
      updated_at = now()
    WHERE consent_status.user_id = v_user_id;

    INSERT INTO neuro.legal_consent_events (
      user_id, telegram_user_id, consent_kind, document_version,
      requested_acceptance, outcome, success, telegram_update_id,
      telegram_message_id, telegram_callback_id, request_key, metadata
    ) VALUES (
      v_user_id, p_telegram_user_id, p_consent_kind, p_document_version,
      true, 'accepted', true, p_telegram_update_id,
      p_telegram_message_id, left(p_telegram_callback_id, 200),
      p_request_key, COALESCE(p_metadata, '{}'::jsonb)
    )
    ON CONFLICT (request_key) DO NOTHING;
  END IF;

  SELECT * INTO v_status
  FROM neuro.legal_consent_status
  WHERE user_id = v_user_id;

  RETURN QUERY SELECT
    v_status.terms_accepted,
    v_status.personal_data_accepted,
    v_status.terms_accepted AND v_status.personal_data_accepted,
    v_duplicate;
END;
$$;

CREATE OR REPLACE FUNCTION neuro.get_legal_consent_status(
  p_telegram_user_id bigint
)
RETURNS TABLE (
  terms_accepted boolean,
  terms_version text,
  personal_data_accepted boolean,
  personal_data_version text,
  completed boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = neuro, public
AS $$
  SELECT
    COALESCE(s.terms_accepted, false),
    s.terms_version,
    COALESCE(s.personal_data_accepted, false),
    s.personal_data_version,
    COALESCE(s.terms_accepted AND s.personal_data_accepted, false)
  FROM neuro.users u
  LEFT JOIN neuro.legal_consent_status s ON s.user_id = u.id
  WHERE u.telegram_user_id = p_telegram_user_id
$$;

REVOKE ALL ON FUNCTION neuro.record_legal_consent(
  bigint, text, text, text, bigint, bigint, text, jsonb
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION neuro.get_legal_consent_status(bigint)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.record_legal_consent(
  bigint, text, text, text, bigint, bigint, text, jsonb
) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.get_legal_consent_status(bigint)
  TO service_role;

COMMIT;
