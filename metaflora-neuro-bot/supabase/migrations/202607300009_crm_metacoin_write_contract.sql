BEGIN;

CREATE TABLE IF NOT EXISTS neuro.crm_admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE
    CHECK (char_length(idempotency_key) BETWEEN 1 AND 160),
  request_id text
    CHECK (request_id IS NULL OR char_length(request_id) BETWEEN 1 AND 200),
  actor_subject text NOT NULL
    CHECK (char_length(actor_subject) BETWEEN 1 AND 200),
  action_type text NOT NULL DEFAULT 'metacoins.adjust'
    CHECK (action_type = 'metacoins.adjust'),
  target_user_id uuid NOT NULL
    REFERENCES neuro.users(id) ON DELETE RESTRICT,
  delta integer NOT NULL
    CHECK (delta <> 0 AND abs(delta::bigint) <= 1000000000),
  reason text NOT NULL
    CHECK (char_length(reason) BETWEEN 3 AND 1000),
  status text NOT NULL
    CHECK (status IN ('succeeded', 'rejected')),
  balance_before integer NOT NULL CHECK (balance_before >= 0),
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  ledger_id uuid
    REFERENCES neuro.metacoin_ledger(id) ON DELETE RESTRICT,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (
      status = 'succeeded'
      AND ledger_id IS NOT NULL
      AND error_code IS NULL
      AND balance_after = balance_before + delta
    )
    OR
    (
      status = 'rejected'
      AND ledger_id IS NULL
      AND error_code IS NOT NULL
      AND balance_after = balance_before
    )
  )
);

CREATE INDEX IF NOT EXISTS crm_admin_actions_target_time_idx
  ON neuro.crm_admin_actions(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS crm_admin_actions_actor_time_idx
  ON neuro.crm_admin_actions(actor_subject, created_at DESC);

CREATE TABLE IF NOT EXISTS neuro.crm_admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL UNIQUE
    REFERENCES neuro.crm_admin_actions(id) ON DELETE RESTRICT,
  actor_subject text NOT NULL
    CHECK (char_length(actor_subject) BETWEEN 1 AND 200),
  action_type text NOT NULL
    CHECK (action_type = 'metacoins.adjust'),
  target_user_id uuid NOT NULL
    REFERENCES neuro.users(id) ON DELETE RESTRICT,
  outcome text NOT NULL
    CHECK (outcome IN ('succeeded', 'rejected')),
  delta integer NOT NULL
    CHECK (delta <> 0 AND abs(delta::bigint) <= 1000000000),
  balance_before integer NOT NULL CHECK (balance_before >= 0),
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  ledger_id uuid
    REFERENCES neuro.metacoin_ledger(id) ON DELETE RESTRICT,
  reason text NOT NULL
    CHECK (char_length(reason) BETWEEN 3 AND 1000),
  request_id text
    CHECK (request_id IS NULL OR char_length(request_id) BETWEEN 1 AND 200),
  error_code text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_admin_audit_target_time_idx
  ON neuro.crm_admin_audit_log(target_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS crm_admin_audit_actor_time_idx
  ON neuro.crm_admin_audit_log(actor_subject, occurred_at DESC);
CREATE INDEX IF NOT EXISTS crm_admin_audit_outcome_time_idx
  ON neuro.crm_admin_audit_log(outcome, occurred_at DESC);

CREATE OR REPLACE FUNCTION neuro.reject_crm_admin_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = '55000',
    MESSAGE = 'crm admin audit log is append-only';
END;
$$;

DO $trigger$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'neuro.crm_admin_audit_log'::regclass
      AND tgname = 'crm_admin_audit_immutable'
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER crm_admin_audit_immutable
      BEFORE UPDATE OR DELETE ON neuro.crm_admin_audit_log
      FOR EACH ROW
      EXECUTE FUNCTION neuro.reject_crm_admin_audit_mutation();
  END IF;
END;
$trigger$;

CREATE OR REPLACE FUNCTION neuro.crm_adjust_metacoins(
  p_user_id uuid,
  p_delta integer,
  p_actor_subject text,
  p_reason text,
  p_idempotency_key text,
  p_request_id text DEFAULT NULL
)
RETURNS TABLE (
  action_id uuid,
  ledger_id uuid,
  applied boolean,
  duplicate boolean,
  balance_before integer,
  balance_after integer,
  error_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing neuro.crm_admin_actions%ROWTYPE;
  v_action_id uuid := gen_random_uuid();
  v_ledger_id uuid;
  v_balance_before integer := 0;
  v_balance_after integer;
  v_ledger_idempotency_key text;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'user id is required';
  END IF;
  IF p_delta IS NULL
    OR p_delta = 0
    OR abs(p_delta::bigint) > 1000000000 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'delta must be between -1000000000 and 1000000000 and cannot be zero';
  END IF;
  IF p_actor_subject IS NULL
    OR char_length(p_actor_subject) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'invalid actor subject';
  END IF;
  IF p_reason IS NULL
    OR char_length(p_reason) NOT BETWEEN 3 AND 1000 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'reason must contain between 3 and 1000 characters';
  END IF;
  IF p_idempotency_key IS NULL
    OR char_length(p_idempotency_key) NOT BETWEEN 1 AND 160 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'invalid idempotency key';
  END IF;
  IF p_request_id IS NOT NULL
    AND char_length(p_request_id) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'invalid request id';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('crm:metacoins:' || p_idempotency_key, 90731)
  );

  SELECT admin_action.*
  INTO v_existing
  FROM neuro.crm_admin_actions AS admin_action
  WHERE admin_action.idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF v_existing.target_user_id IS DISTINCT FROM p_user_id
      OR v_existing.delta IS DISTINCT FROM p_delta
      OR v_existing.actor_subject IS DISTINCT FROM p_actor_subject
      OR v_existing.reason IS DISTINCT FROM p_reason
      OR v_existing.request_id IS DISTINCT FROM p_request_id THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'crm metacoin idempotency payload conflicts';
    END IF;

    RETURN QUERY SELECT
      v_existing.id,
      v_existing.ledger_id,
      v_existing.status = 'succeeded',
      true,
      v_existing.balance_before,
      v_existing.balance_after,
      v_existing.error_code;
    RETURN;
  END IF;

  PERFORM 1
  FROM neuro.users AS target_user
  WHERE target_user.id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0002',
      MESSAGE = 'target user does not exist';
  END IF;

  SELECT ledger.balance_after
  INTO v_balance_before
  FROM neuro.metacoin_ledger AS ledger
  WHERE ledger.user_id = p_user_id
  ORDER BY ledger.created_at DESC, ledger.id DESC
  LIMIT 1;

  v_balance_before := COALESCE(v_balance_before, 0);

  IF p_delta < 0 AND v_balance_before < abs(p_delta::bigint) THEN
    INSERT INTO neuro.crm_admin_actions (
      id,
      idempotency_key,
      request_id,
      actor_subject,
      target_user_id,
      delta,
      reason,
      status,
      balance_before,
      balance_after,
      error_code
    ) VALUES (
      v_action_id,
      p_idempotency_key,
      p_request_id,
      p_actor_subject,
      p_user_id,
      p_delta,
      p_reason,
      'rejected',
      v_balance_before,
      v_balance_before,
      'insufficient_balance'
    );

    INSERT INTO neuro.crm_admin_audit_log (
      action_id,
      actor_subject,
      action_type,
      target_user_id,
      outcome,
      delta,
      balance_before,
      balance_after,
      reason,
      request_id,
      error_code
    ) VALUES (
      v_action_id,
      p_actor_subject,
      'metacoins.adjust',
      p_user_id,
      'rejected',
      p_delta,
      v_balance_before,
      v_balance_before,
      p_reason,
      p_request_id,
      'insufficient_balance'
    );

    RETURN QUERY SELECT
      v_action_id,
      NULL::uuid,
      false,
      false,
      v_balance_before,
      v_balance_before,
      'insufficient_balance'::text;
    RETURN;
  END IF;

  v_balance_after := v_balance_before + p_delta;
  v_ledger_idempotency_key := 'crm:metacoins:' || p_idempotency_key;

  INSERT INTO neuro.metacoin_ledger (
    user_id,
    idempotency_key,
    delta,
    balance_after,
    source,
    reference_type,
    reference_id,
    description,
    metadata
  ) VALUES (
    p_user_id,
    v_ledger_idempotency_key,
    p_delta,
    v_balance_after,
    'admin',
    'crm_admin_action',
    v_action_id::text,
    p_reason,
    jsonb_strip_nulls(jsonb_build_object(
      'actor_subject', p_actor_subject,
      'request_id', p_request_id
    ))
  )
  RETURNING id INTO v_ledger_id;

  INSERT INTO neuro.crm_admin_actions (
    id,
    idempotency_key,
    request_id,
    actor_subject,
    target_user_id,
    delta,
    reason,
    status,
    balance_before,
    balance_after,
    ledger_id
  ) VALUES (
    v_action_id,
    p_idempotency_key,
    p_request_id,
    p_actor_subject,
    p_user_id,
    p_delta,
    p_reason,
    'succeeded',
    v_balance_before,
    v_balance_after,
    v_ledger_id
  );

  INSERT INTO neuro.crm_admin_audit_log (
    action_id,
    actor_subject,
    action_type,
    target_user_id,
    outcome,
    delta,
    balance_before,
    balance_after,
    ledger_id,
    reason,
    request_id
  ) VALUES (
    v_action_id,
    p_actor_subject,
    'metacoins.adjust',
    p_user_id,
    'succeeded',
    p_delta,
    v_balance_before,
    v_balance_after,
    v_ledger_id,
    p_reason,
    p_request_id
  );

  RETURN QUERY SELECT
    v_action_id,
    v_ledger_id,
    true,
    false,
    v_balance_before,
    v_balance_after,
    NULL::text;
END;
$$;

ALTER TABLE neuro.crm_admin_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE neuro.crm_admin_audit_log DISABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE neuro.crm_admin_actions
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE neuro.crm_admin_audit_log
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE neuro.crm_admin_actions TO service_role;
GRANT SELECT ON TABLE neuro.crm_admin_audit_log TO service_role;

REVOKE ALL ON FUNCTION neuro.reject_crm_admin_audit_mutation()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION neuro.crm_adjust_metacoins(
  uuid, integer, text, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.crm_adjust_metacoins(
  uuid, integer, text, text, text, text
) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
