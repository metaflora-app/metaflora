CREATE TABLE IF NOT EXISTS neuro.referral_offer_open_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE CASCADE,
  offer_version text NOT NULL CHECK (offer_version ~ '^[a-z0-9][a-z0-9._-]{0,79}$'),
  document_sha256 text NOT NULL CHECK (document_sha256 ~ '^[a-f0-9]{64}$'),
  source_event_id text NOT NULL UNIQUE,
  opened_at timestamptz NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, offer_version, document_sha256)
);

ALTER TABLE neuro.referral_offer_open_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON neuro.referral_offer_open_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON neuro.referral_offer_open_events TO service_role;

DROP TRIGGER IF EXISTS referral_offer_open_events_immutable ON neuro.referral_offer_open_events;
CREATE TRIGGER referral_offer_open_events_immutable
BEFORE UPDATE OR DELETE ON neuro.referral_offer_open_events
FOR EACH ROW EXECUTE FUNCTION neuro.reject_referral_finance_mutation();

CREATE OR REPLACE FUNCTION neuro.record_referral_offer_open_v2(
  p_telegram_id bigint,
  p_offer_version text,
  p_document_sha256 text,
  p_opened_at timestamptz,
  p_source_event_id text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(offer_version text,opened_at timestamptz,outcome text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
DECLARE
  v_user uuid;
  v_row neuro.referral_offer_open_events%ROWTYPE;
  v_inserted integer;
BEGIN
  SELECT app_user.id INTO v_user FROM neuro.users AS app_user
  WHERE app_user.telegram_user_id=p_telegram_id;
  IF v_user IS NULL THEN RAISE EXCEPTION 'referral user not found'; END IF;

  INSERT INTO neuro.referral_offer_open_events(
    user_id,offer_version,document_sha256,source_event_id,opened_at,metadata
  ) VALUES(
    v_user,p_offer_version,p_document_sha256,p_source_event_id,p_opened_at,COALESCE(p_metadata,'{}')
  ) ON CONFLICT (user_id,offer_version,document_sha256) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  SELECT event.* INTO v_row FROM neuro.referral_offer_open_events AS event
  WHERE event.user_id=v_user AND event.offer_version=p_offer_version
    AND event.document_sha256=p_document_sha256;
  RETURN QUERY SELECT v_row.offer_version,v_row.opened_at,
    CASE WHEN v_inserted=1 THEN 'opened' ELSE 'already_opened' END;
END; $$;

REVOKE ALL ON FUNCTION neuro.record_referral_offer_open_v2(bigint,text,text,timestamptz,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION neuro.record_referral_offer_open_v2(bigint,text,text,timestamptz,text,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION neuro.accept_referral_offer_v2(
  p_telegram_id bigint,
  p_offer_version text,
  p_document_sha256 text,
  p_accepted_at timestamptz,
  p_telegram_update_id bigint,
  p_source_event_id text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(offer_version text,accepted_at timestamptz,outcome text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=neuro,pg_temp AS $$
DECLARE
  v_user uuid;
  v_row neuro.referral_offer_acceptances%ROWTYPE;
  v_inserted integer;
BEGIN
  SELECT app_user.id INTO v_user FROM neuro.users AS app_user
  WHERE app_user.telegram_user_id=p_telegram_id;
  IF v_user IS NULL THEN RAISE EXCEPTION 'referral user not found'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM neuro.referral_offer_open_events AS event
    WHERE event.user_id=v_user AND event.offer_version=p_offer_version
      AND event.document_sha256=p_document_sha256 AND event.opened_at<=p_accepted_at
  ) THEN
    RAISE EXCEPTION 'partner offer must be opened first' USING ERRCODE='P0001';
  END IF;

  INSERT INTO neuro.referral_offer_acceptances(
    user_id,offer_version,document_sha256,source_event_id,telegram_update_id,accepted_at,metadata
  ) VALUES(
    v_user,p_offer_version,p_document_sha256,p_source_event_id,p_telegram_update_id,p_accepted_at,COALESCE(p_metadata,'{}')
  ) ON CONFLICT ON CONSTRAINT referral_offer_acceptances_user_id_offer_version_key DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  SELECT acceptance.* INTO v_row FROM neuro.referral_offer_acceptances AS acceptance
  WHERE acceptance.user_id=v_user AND acceptance.offer_version=p_offer_version;
  RETURN QUERY SELECT v_row.offer_version,v_row.accepted_at,
    CASE WHEN v_inserted=1 THEN 'accepted' ELSE 'already_accepted' END;
END; $$;

REVOKE ALL ON FUNCTION neuro.accept_referral_offer_v2(bigint,text,text,timestamptz,bigint,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION neuro.accept_referral_offer_v2(bigint,text,text,timestamptz,bigint,text,jsonb) TO service_role;
