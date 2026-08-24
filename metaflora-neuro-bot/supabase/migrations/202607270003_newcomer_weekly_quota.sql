BEGIN;

CREATE TABLE IF NOT EXISTS neuro.free_weekly_usage (
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  used integer NOT NULL DEFAULT 0 CHECK (used BETWEEN 0 AND 50),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_start)
);

CREATE TABLE IF NOT EXISTS neuro.free_request_claims (
  request_key text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (char_length(request_key) BETWEEN 1 AND 200)
);

CREATE INDEX IF NOT EXISTS free_request_claims_user_week_idx
  ON neuro.free_request_claims(user_id, week_start);

ALTER TABLE neuro.free_weekly_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.free_request_claims ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON neuro.free_weekly_usage, neuro.free_request_claims FROM PUBLIC, anon, authenticated;
GRANT ALL ON neuro.free_weekly_usage, neuro.free_request_claims TO service_role;

CREATE OR REPLACE FUNCTION neuro.claim_free_weekly_request(
  p_telegram_user_id bigint,
  p_request_key text
)
RETURNS TABLE (
  allowed boolean,
  used integer,
  request_limit integer,
  remaining integer,
  duplicate boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_week_start date := date_trunc('week', timezone('UTC', now()))::date;
  v_used integer;
  v_existing_user_id uuid;
BEGIN
  IF p_telegram_user_id <= 0 THEN
    RAISE EXCEPTION 'invalid telegram user id';
  END IF;
  IF p_request_key IS NULL OR char_length(p_request_key) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'invalid request key';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_key, 0));

  INSERT INTO neuro.users (telegram_user_id)
  VALUES (p_telegram_user_id)
  ON CONFLICT (telegram_user_id) DO NOTHING;

  SELECT id INTO v_user_id
  FROM neuro.users
  WHERE telegram_user_id = p_telegram_user_id;

  SELECT user_id INTO v_existing_user_id
  FROM neuro.free_request_claims
  WHERE request_key = p_request_key;

  IF v_existing_user_id IS NOT NULL THEN
    IF v_existing_user_id <> v_user_id THEN
      RAISE EXCEPTION 'request key belongs to another user';
    END IF;
    SELECT usage.used INTO v_used
    FROM neuro.free_weekly_usage AS usage
    WHERE usage.user_id = v_user_id AND usage.week_start = v_week_start;
    RETURN QUERY SELECT true, COALESCE(v_used, 0), 50, GREATEST(50 - COALESCE(v_used, 0), 0), true;
    RETURN;
  END IF;

  INSERT INTO neuro.free_weekly_usage (user_id, week_start, used)
  VALUES (v_user_id, v_week_start, 0)
  ON CONFLICT (user_id, week_start) DO NOTHING;

  UPDATE neuro.free_weekly_usage AS usage
  SET used = usage.used + 1, updated_at = now()
  WHERE usage.user_id = v_user_id
    AND usage.week_start = v_week_start
    AND usage.used < 50
  RETURNING usage.used INTO v_used;

  IF v_used IS NULL THEN
    RETURN QUERY SELECT false, 50, 50, 0, false;
    RETURN;
  END IF;

  INSERT INTO neuro.free_request_claims (request_key, user_id, week_start)
  VALUES (p_request_key, v_user_id, v_week_start);

  RETURN QUERY SELECT true, v_used, 50, 50 - v_used, false;
END;
$$;

CREATE OR REPLACE FUNCTION neuro.release_free_weekly_request(
  p_telegram_user_id bigint,
  p_request_key text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_week_start date;
BEGIN
  IF p_telegram_user_id <= 0 THEN
    RAISE EXCEPTION 'invalid telegram user id';
  END IF;
  IF p_request_key IS NULL OR char_length(p_request_key) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'invalid request key';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_key, 0));

  SELECT id INTO v_user_id
  FROM neuro.users
  WHERE telegram_user_id = p_telegram_user_id;
  IF v_user_id IS NULL THEN RETURN false; END IF;

  DELETE FROM neuro.free_request_claims
  WHERE request_key = p_request_key AND user_id = v_user_id
  RETURNING week_start INTO v_week_start;
  IF v_week_start IS NULL THEN RETURN false; END IF;

  UPDATE neuro.free_weekly_usage AS usage
  SET used = GREATEST(usage.used - 1, 0), updated_at = now()
  WHERE usage.user_id = v_user_id AND usage.week_start = v_week_start;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION neuro.claim_free_weekly_request(bigint, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION neuro.release_free_weekly_request(bigint, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.claim_free_weekly_request(bigint, text) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.release_free_weekly_request(bigint, text) TO service_role;

COMMIT;
