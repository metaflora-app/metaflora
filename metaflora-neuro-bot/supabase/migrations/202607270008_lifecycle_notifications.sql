BEGIN;

CREATE TABLE IF NOT EXISTS neuro.lifecycle_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_key text NOT NULL UNIQUE CHECK (char_length(notification_key) BETWEEN 1 AND 200),
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE CASCADE,
  telegram_chat_id bigint NOT NULL CHECK (telegram_chat_id > 0),
  payment_id text,
  scenario text NOT NULL CHECK (scenario IN (
    'payment_abandoned_20m',
    'payment_abandoned_24h',
    'newcomer_after_24h'
  )),
  due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'cancelled')),
  lease_until timestamptz,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  sent_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((scenario LIKE 'payment_%' AND payment_id IS NOT NULL) OR (scenario = 'newcomer_after_24h' AND payment_id IS NULL))
);

CREATE INDEX IF NOT EXISTS lifecycle_notifications_due_idx
  ON neuro.lifecycle_notifications(status, due_at, id)
  WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS lifecycle_notifications_user_idx
  ON neuro.lifecycle_notifications(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION neuro.schedule_payment_abandonment_reminders(
  p_payment_id text,
  p_telegram_user_id bigint,
  p_telegram_chat_id bigint,
  p_first_due_at timestamptz,
  p_second_due_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = neuro, public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_payment_id IS NULL OR p_payment_id !~ '^[A-Za-z0-9_-]{1,128}$' THEN
    RAISE EXCEPTION 'invalid payment id';
  END IF;
  IF p_telegram_user_id IS NULL OR p_telegram_user_id <= 0
    OR p_telegram_chat_id IS NULL OR p_telegram_chat_id <= 0 THEN
    RAISE EXCEPTION 'invalid telegram identifiers';
  END IF;
  IF p_first_due_at IS NULL OR p_second_due_at IS NULL OR p_second_due_at <= p_first_due_at THEN
    RAISE EXCEPTION 'invalid notification schedule';
  END IF;

  SELECT id INTO v_user_id
  FROM neuro.users
  WHERE telegram_user_id = p_telegram_user_id;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'history user is missing';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_telegram_user_id::text, 90241));

  UPDATE neuro.lifecycle_notifications
  SET status = 'cancelled',
      cancelled_at = now(),
      cancellation_reason = 'newer_payment_selected',
      updated_at = now()
  WHERE user_id = v_user_id
    AND scenario IN ('payment_abandoned_20m', 'payment_abandoned_24h')
    AND payment_id <> p_payment_id
    AND status IN ('pending', 'processing');

  INSERT INTO neuro.lifecycle_notifications (
    notification_key, user_id, telegram_chat_id, payment_id, scenario, due_at
  ) VALUES
    ('payment:' || p_payment_id || ':abandoned:20m', v_user_id, p_telegram_chat_id, p_payment_id, 'payment_abandoned_20m', p_first_due_at),
    ('payment:' || p_payment_id || ':abandoned:24h', v_user_id, p_telegram_chat_id, p_payment_id, 'payment_abandoned_24h', p_second_due_at)
  ON CONFLICT (notification_key) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION neuro.schedule_newcomer_reminder(
  p_telegram_user_id bigint,
  p_telegram_chat_id bigint,
  p_due_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = neuro, public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_telegram_user_id IS NULL OR p_telegram_user_id <= 0
    OR p_telegram_chat_id IS NULL OR p_telegram_chat_id <= 0 OR p_due_at IS NULL THEN
    RAISE EXCEPTION 'invalid newcomer reminder input';
  END IF;
  SELECT id INTO v_user_id
  FROM neuro.users
  WHERE telegram_user_id = p_telegram_user_id;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'history user is missing';
  END IF;

  INSERT INTO neuro.lifecycle_notifications (
    notification_key, user_id, telegram_chat_id, payment_id, scenario, due_at
  ) VALUES (
    'newcomer:' || p_telegram_user_id || ':after24h',
    v_user_id,
    p_telegram_chat_id,
    NULL,
    'newcomer_after_24h',
    p_due_at
  ) ON CONFLICT (notification_key) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION neuro.claim_due_lifecycle_notifications(
  p_limit integer DEFAULT 20,
  p_lease_seconds integer DEFAULT 300
)
RETURNS TABLE (
  id uuid,
  scenario text,
  telegram_user_id bigint,
  telegram_chat_id bigint,
  payment_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = neuro, public
AS $$
BEGIN
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 50 THEN
    RAISE EXCEPTION 'invalid lifecycle notification claim limit';
  END IF;
  IF p_lease_seconds IS NULL OR p_lease_seconds < 30 OR p_lease_seconds > 900 THEN
    RAISE EXCEPTION 'invalid lifecycle notification lease';
  END IF;

  RETURN QUERY
  WITH due AS (
    SELECT notification.id
    FROM neuro.lifecycle_notifications AS notification
    WHERE (
      notification.status = 'pending' AND notification.due_at <= now()
    ) OR (
      notification.status = 'processing' AND notification.lease_until < now()
    )
    ORDER BY notification.due_at ASC, notification.id ASC
    FOR UPDATE SKIP LOCKED
    LIMIT p_limit
  ), claimed AS (
    UPDATE neuro.lifecycle_notifications AS notification
    SET status = 'processing',
        lease_until = now() + make_interval(secs => p_lease_seconds),
        attempt_count = notification.attempt_count + 1,
        updated_at = now()
    FROM due
    WHERE notification.id = due.id
    RETURNING notification.id, notification.scenario, notification.telegram_chat_id, notification.payment_id, notification.user_id
  )
  SELECT claimed.id, claimed.scenario, user_record.telegram_user_id, claimed.telegram_chat_id, claimed.payment_id
  FROM claimed
  JOIN neuro.users AS user_record ON user_record.id = claimed.user_id;
END;
$$;

CREATE OR REPLACE FUNCTION neuro.mark_lifecycle_notification_sent(p_notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = neuro, public
AS $$
BEGIN
  UPDATE neuro.lifecycle_notifications
  SET status = 'sent', sent_at = now(), lease_until = NULL, updated_at = now()
  WHERE id = p_notification_id AND status = 'processing';
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION neuro.cancel_lifecycle_notification(
  p_notification_id uuid,
  p_reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = neuro, public
AS $$
BEGIN
  UPDATE neuro.lifecycle_notifications
  SET status = 'cancelled',
      cancelled_at = now(),
      cancellation_reason = left(COALESCE(p_reason, 'cancelled'), 500),
      lease_until = NULL,
      updated_at = now()
  WHERE id = p_notification_id
    AND status IN ('pending', 'processing', 'sent');
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION neuro.get_newcomer_reminder_eligibility(
  p_telegram_user_id bigint
)
RETURNS TABLE (eligible boolean, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = neuro, public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id
  FROM neuro.users
  WHERE telegram_user_id = p_telegram_user_id;
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'missing_user'::text;
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1 FROM neuro.payments
    WHERE user_id = v_user_id AND product_type = 'subscription' AND status = 'succeeded'
  ) THEN
    RETURN QUERY SELECT false, 'paid_plan'::text;
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1 FROM neuro.generations
    WHERE user_id = v_user_id
  ) THEN
    RETURN QUERY SELECT false, 'already_used_catalog'::text;
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1 FROM neuro.user_preferences
    WHERE user_id = v_user_id
      AND (selected_model_id IS NOT NULL OR selected_agent_id IS NOT NULL)
  ) THEN
    RETURN QUERY SELECT false, 'already_selected'::text;
    RETURN;
  END IF;
  RETURN QUERY SELECT true, 'newcomer'::text;
END;
$$;

ALTER TABLE neuro.lifecycle_notifications DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE neuro.lifecycle_notifications FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE neuro.lifecycle_notifications TO service_role;

REVOKE ALL ON FUNCTION neuro.schedule_payment_abandonment_reminders(text, bigint, bigint, timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION neuro.schedule_newcomer_reminder(bigint, bigint, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION neuro.claim_due_lifecycle_notifications(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION neuro.mark_lifecycle_notification_sent(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION neuro.cancel_lifecycle_notification(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION neuro.get_newcomer_reminder_eligibility(bigint) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION neuro.schedule_payment_abandonment_reminders(text, bigint, bigint, timestamptz, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.schedule_newcomer_reminder(bigint, bigint, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.claim_due_lifecycle_notifications(integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.mark_lifecycle_notification_sent(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.cancel_lifecycle_notification(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.get_newcomer_reminder_eligibility(bigint) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
