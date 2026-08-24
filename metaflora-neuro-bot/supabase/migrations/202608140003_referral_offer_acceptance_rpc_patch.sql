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
  SELECT app_user.id INTO v_user
  FROM neuro.users AS app_user
  WHERE app_user.telegram_user_id=p_telegram_id;
  IF v_user IS NULL THEN RAISE EXCEPTION 'referral user not found'; END IF;

  INSERT INTO neuro.referral_offer_acceptances(
    user_id,offer_version,document_sha256,source_event_id,telegram_update_id,accepted_at,metadata
  ) VALUES(
    v_user,p_offer_version,p_document_sha256,p_source_event_id,p_telegram_update_id,p_accepted_at,COALESCE(p_metadata,'{}')
  )
  ON CONFLICT ON CONSTRAINT referral_offer_acceptances_user_id_offer_version_key DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  SELECT acceptance.* INTO v_row
  FROM neuro.referral_offer_acceptances AS acceptance
  WHERE acceptance.user_id=v_user AND acceptance.offer_version=p_offer_version;

  RETURN QUERY SELECT
    v_row.offer_version,
    v_row.accepted_at,
    CASE WHEN v_inserted=1 THEN 'accepted' ELSE 'already_accepted' END;
END; $$;

REVOKE ALL ON FUNCTION neuro.accept_referral_offer_v2(bigint,text,text,timestamptz,bigint,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION neuro.accept_referral_offer_v2(bigint,text,text,timestamptz,bigint,text,jsonb) TO service_role;
