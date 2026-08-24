BEGIN;

CREATE TABLE IF NOT EXISTS neuro.crm_subscription_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE
    CHECK (char_length(idempotency_key) BETWEEN 1 AND 200),
  request_id text
    CHECK (request_id IS NULL OR char_length(request_id) BETWEEN 1 AND 200),
  actor_subject text NOT NULL
    CHECK (char_length(actor_subject) BETWEEN 1 AND 200),
  target_user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  action_type text NOT NULL DEFAULT 'subscription.change'
    CHECK (action_type = 'subscription.change'),
  plan_id text NOT NULL,
  duration_months integer NOT NULL CHECK (duration_months IN (1, 3)),
  metacoins integer NOT NULL CHECK (metacoins >= 0),
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 1_000),
  status text NOT NULL CHECK (status IN ('succeeded', 'rejected')),
  balance_before integer NOT NULL CHECK (balance_before >= 0),
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  subscription_id uuid REFERENCES neuro.subscriptions(id) ON DELETE RESTRICT,
  ledger_id uuid REFERENCES neuro.metacoin_ledger(id) ON DELETE RESTRICT,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (status = 'succeeded'
      AND subscription_id IS NOT NULL
      AND error_code IS NULL
      AND expires_at > starts_at
      AND balance_after = balance_before + metacoins)
    OR
    (status = 'rejected'
      AND subscription_id IS NULL
      AND error_code IS NOT NULL
      AND balance_after = balance_before)
  )
);

CREATE INDEX IF NOT EXISTS crm_subscription_actions_target_time_idx
  ON neuro.crm_subscription_actions(target_user_id, created_at DESC);

CREATE OR REPLACE FUNCTION neuro.enqueue_crm_subscription_notification()
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
    'crm:subscription:' || NEW.idempotency_key,
    app_user.telegram_user_id,
    'subscription_changed',
    jsonb_build_object(
      'actionId', NEW.id,
      'planId', NEW.plan_id,
      'planName', CASE NEW.plan_id
        WHEN 'newcomer' THEN 'новичок'
        WHEN 'amateur' THEN 'любитель'
        WHEN 'author' THEN 'автор'
        WHEN 'researcher' THEN 'исследователь'
        WHEN 'expert' THEN 'эксперт'
        ELSE NEW.plan_id
      END,
      'durationMonths', NEW.duration_months,
      'metacoins', NEW.metacoins,
      'balanceBefore', NEW.balance_before,
      'balanceAfter', NEW.balance_after,
      'expiresAt', NEW.expires_at,
      'reason', NEW.reason
    )
  FROM neuro.users AS app_user
  WHERE app_user.id = NEW.target_user_id
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crm_subscription_user_notification
  ON neuro.crm_subscription_actions;
CREATE TRIGGER crm_subscription_user_notification
  AFTER INSERT ON neuro.crm_subscription_actions
  FOR EACH ROW
  EXECUTE FUNCTION neuro.enqueue_crm_subscription_notification();

CREATE OR REPLACE FUNCTION neuro.crm_change_subscription(
  p_user_id uuid,
  p_plan_id text,
  p_duration_months integer,
  p_actor_subject text,
  p_reason text,
  p_idempotency_key text,
  p_request_id text DEFAULT NULL
)
RETURNS TABLE (
  action_id uuid,
  subscription_id uuid,
  ledger_id uuid,
  applied boolean,
  duplicate boolean,
  plan_id text,
  metacoins integer,
  balance_before integer,
  balance_after integer,
  starts_at timestamptz,
  expires_at timestamptz,
  error_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing neuro.crm_subscription_actions%ROWTYPE;
  v_action_id uuid := gen_random_uuid();
  v_subscription_id uuid := gen_random_uuid();
  v_ledger_id uuid;
  v_user_id uuid;
  v_metacoins integer;
  v_balance_before integer := 0;
  v_balance_after integer;
  v_starts_at timestamptz := now();
  v_expires_at timestamptz;
  v_ledger_key text;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'user id is required';
  END IF;
  IF p_plan_id IS NULL OR p_plan_id NOT IN ('newcomer', 'amateur', 'author', 'researcher', 'expert') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid plan id';
  END IF;
  IF p_duration_months IS NULL OR p_duration_months NOT IN (1, 3) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid subscription duration';
  END IF;
  IF p_actor_subject IS NULL OR char_length(p_actor_subject) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid actor subject';
  END IF;
  IF p_reason IS NULL OR char_length(p_reason) NOT BETWEEN 3 AND 1000 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'reason must contain between 3 and 1000 characters';
  END IF;
  IF p_idempotency_key IS NULL OR char_length(p_idempotency_key) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid idempotency key';
  END IF;
  IF p_request_id IS NOT NULL AND char_length(p_request_id) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid request id';
  END IF;

  v_metacoins := CASE p_plan_id
    WHEN 'newcomer' THEN 0
    WHEN 'amateur' THEN 130
    WHEN 'author' THEN 300
    WHEN 'researcher' THEN 850
    WHEN 'expert' THEN 1300
  END;
  v_expires_at := v_starts_at + CASE
    WHEN p_duration_months = 3 THEN interval '90 days'
    ELSE interval '30 days'
  END;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('crm:subscription:' || p_idempotency_key, 90731)
  );

  SELECT action.*
  INTO v_existing
  FROM neuro.crm_subscription_actions AS action
  WHERE action.idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF v_existing.target_user_id IS DISTINCT FROM p_user_id
      OR v_existing.plan_id IS DISTINCT FROM p_plan_id
      OR v_existing.duration_months IS DISTINCT FROM p_duration_months
      OR v_existing.actor_subject IS DISTINCT FROM p_actor_subject
      OR v_existing.reason IS DISTINCT FROM p_reason
      OR v_existing.request_id IS DISTINCT FROM p_request_id THEN
      RAISE EXCEPTION USING ERRCODE = '22023',
        MESSAGE = 'crm subscription idempotency payload conflicts';
    END IF;

    RETURN QUERY SELECT
      v_existing.id,
      v_existing.subscription_id,
      v_existing.ledger_id,
      v_existing.status = 'succeeded',
      true,
      v_existing.plan_id,
      v_existing.metacoins,
      v_existing.balance_before,
      v_existing.balance_after,
      v_existing.starts_at,
      v_existing.expires_at,
      v_existing.error_code;
    RETURN;
  END IF;

  SELECT app_user.id
  INTO v_user_id
  FROM neuro.users AS app_user
  WHERE app_user.id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'target user does not exist';
  END IF;

  SELECT ledger.balance_after
  INTO v_balance_before
  FROM neuro.metacoin_ledger AS ledger
  WHERE ledger.user_id = p_user_id
  ORDER BY ledger.created_at DESC, ledger.id DESC
  LIMIT 1;
  v_balance_before := COALESCE(v_balance_before, 0);
  v_balance_after := v_balance_before + v_metacoins;

  UPDATE neuro.subscriptions
  SET status = 'cancelled',
      cancelled_at = now(),
      updated_at = now()
  WHERE user_id = p_user_id
    AND status IN ('active', 'pending')
    AND expires_at > now();

  INSERT INTO neuro.subscriptions (
    id, user_id, plan_id, status, source_payment_id,
    price_kopecks, metacoins_total, metacoins_remaining,
    starts_at, expires_at
  ) VALUES (
    v_subscription_id, p_user_id, p_plan_id, 'active', NULL,
    0, v_metacoins, v_metacoins, v_starts_at, v_expires_at
  );

  IF v_metacoins > 0 THEN
    v_ledger_key := 'crm:subscription:' || p_idempotency_key;
    INSERT INTO neuro.metacoin_ledger (
      user_id, idempotency_key, delta, balance_after, source,
      reference_type, reference_id, description, metadata
    ) VALUES (
      p_user_id, v_ledger_key, v_metacoins, v_balance_after, 'admin',
      'crm_subscription_action', v_action_id::text,
      'ручное начисление по тарифу',
      jsonb_strip_nulls(jsonb_build_object(
        'actor_subject', p_actor_subject,
        'plan_id', p_plan_id,
        'duration_months', p_duration_months,
        'request_id', p_request_id
      ))
    )
    RETURNING id INTO v_ledger_id;
  END IF;

  INSERT INTO neuro.crm_subscription_actions (
    id, idempotency_key, request_id, actor_subject, target_user_id,
    plan_id, duration_months, metacoins, reason, status,
    balance_before, balance_after, starts_at, expires_at,
    subscription_id, ledger_id
  ) VALUES (
    v_action_id, p_idempotency_key, p_request_id, p_actor_subject, p_user_id,
    p_plan_id, p_duration_months, v_metacoins, p_reason, 'succeeded',
    v_balance_before, v_balance_after, v_starts_at, v_expires_at,
    v_subscription_id, v_ledger_id
  );

  RETURN QUERY SELECT
    v_action_id,
    v_subscription_id,
    v_ledger_id,
    true,
    false,
    p_plan_id,
    v_metacoins,
    v_balance_before,
    v_balance_after,
    v_starts_at,
    v_expires_at,
    NULL::text;
END;
$$;

ALTER TABLE neuro.crm_subscription_actions DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE neuro.crm_subscription_actions
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE neuro.crm_subscription_actions TO service_role;

REVOKE ALL ON FUNCTION neuro.enqueue_crm_subscription_notification()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION neuro.crm_change_subscription(
  uuid, text, integer, text, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.crm_change_subscription(
  uuid, text, integer, text, text, text, text
) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
