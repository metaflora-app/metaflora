BEGIN;

CREATE TABLE IF NOT EXISTS neuro.crm_user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE
    CHECK (char_length(idempotency_key) BETWEEN 1 AND 200),
  telegram_user_id bigint NOT NULL CHECK (telegram_user_id > 0),
  kind text NOT NULL CHECK (kind IN ('metacoins_adjusted', 'subscription_changed')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(payload) = 'object'),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  locked_until timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_user_notifications_queue_idx
  ON neuro.crm_user_notifications(status, created_at)
  WHERE status IN ('pending', 'sending');

CREATE OR REPLACE FUNCTION neuro.enqueue_crm_metacoin_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status <> 'succeeded' THEN
    RETURN NEW;
  END IF;

  INSERT INTO neuro.crm_user_notifications (
    idempotency_key,
    telegram_user_id,
    kind,
    payload
  )
  SELECT
    'crm:metacoins:' || NEW.idempotency_key,
    app_user.telegram_user_id,
    'metacoins_adjusted',
    jsonb_build_object(
      'actionId', NEW.id,
      'delta', NEW.delta,
      'balanceBefore', NEW.balance_before,
      'balanceAfter', NEW.balance_after,
      'reason', NEW.reason
    )
  FROM neuro.users AS app_user
  WHERE app_user.id = NEW.target_user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crm_metacoin_user_notification ON neuro.crm_admin_actions;
CREATE TRIGGER crm_metacoin_user_notification
  AFTER INSERT ON neuro.crm_admin_actions
  FOR EACH ROW
  EXECUTE FUNCTION neuro.enqueue_crm_metacoin_notification();

CREATE OR REPLACE FUNCTION neuro.claim_crm_user_notifications(
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  telegram_user_id bigint,
  kind text,
  payload jsonb,
  attempt_count integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH candidates AS (
    SELECT queue.id
    FROM neuro.crm_user_notifications AS queue
    WHERE (
      queue.status = 'pending'
      OR (queue.status = 'sending' AND queue.locked_until < now())
    )
    ORDER BY queue.created_at, queue.id
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50)
  )
  UPDATE neuro.crm_user_notifications AS queue
  SET status = 'sending',
      attempt_count = queue.attempt_count + 1,
      locked_until = now() + interval '5 minutes',
      updated_at = now()
  FROM candidates
  WHERE queue.id = candidates.id
  RETURNING queue.id, queue.telegram_user_id, queue.kind, queue.payload, queue.attempt_count;
$$;

CREATE OR REPLACE FUNCTION neuro.mark_crm_user_notification_sent(
  p_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE neuro.crm_user_notifications
  SET status = 'sent',
      locked_until = NULL,
      sent_at = now(),
      updated_at = now()
  WHERE id = p_id AND status = 'sending'
  RETURNING true;
$$;

CREATE OR REPLACE FUNCTION neuro.mark_crm_user_notification_failed(
  p_id uuid,
  p_error text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE neuro.crm_user_notifications
  SET status = CASE WHEN attempt_count >= 10 THEN 'failed' ELSE 'pending' END,
      locked_until = NULL,
      last_error = left(coalesce(p_error, 'delivery failed'), 1_000),
      updated_at = now()
  WHERE id = p_id AND status = 'sending'
  RETURNING true;
$$;

ALTER TABLE neuro.crm_user_notifications DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE neuro.crm_user_notifications FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE neuro.crm_user_notifications TO service_role;

REVOKE ALL ON FUNCTION neuro.enqueue_crm_metacoin_notification() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION neuro.claim_crm_user_notifications(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION neuro.mark_crm_user_notification_sent(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION neuro.mark_crm_user_notification_failed(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.claim_crm_user_notifications(integer) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.mark_crm_user_notification_sent(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION neuro.mark_crm_user_notification_failed(uuid, text) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
