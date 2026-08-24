\set ON_ERROR_STOP on

BEGIN;

DO $verification$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_first record;
  v_duplicate record;
  v_debit record;
  v_rejected record;
  v_count bigint;
  v_immutable boolean := false;
BEGIN
  IF to_regprocedure(
    'neuro.crm_adjust_metacoins(uuid,integer,text,text,text,text)'
  ) IS NULL THEN
    RAISE EXCEPTION 'crm_adjust_metacoins RPC is missing';
  END IF;

  IF has_table_privilege('anon', 'neuro.crm_admin_actions', 'SELECT')
    OR has_table_privilege('authenticated', 'neuro.crm_admin_actions', 'SELECT')
    OR has_table_privilege('anon', 'neuro.crm_admin_audit_log', 'SELECT')
    OR has_table_privilege('authenticated', 'neuro.crm_admin_audit_log', 'SELECT') THEN
    RAISE EXCEPTION 'CRM write tables are exposed to client roles';
  END IF;

  IF NOT has_function_privilege(
    'service_role',
    'neuro.crm_adjust_metacoins(uuid,integer,text,text,text,text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'service_role cannot execute crm_adjust_metacoins';
  END IF;

  INSERT INTO neuro.users (
    id,
    telegram_user_id,
    username,
    first_name
  ) VALUES (
    v_user_id,
    9223372036854775000,
    'crm_verification',
    'crm verification'
  );

  SELECT * INTO v_first
  FROM neuro.crm_adjust_metacoins(
    v_user_id,
    100,
    'verification:owner',
    'проверка начисления',
    'verify-credit',
    'verify-request-credit'
  );

  IF NOT v_first.applied
    OR v_first.duplicate
    OR v_first.balance_before <> 0
    OR v_first.balance_after <> 100
    OR v_first.ledger_id IS NULL THEN
    RAISE EXCEPTION 'credit verification failed: %', row_to_json(v_first);
  END IF;

  SELECT * INTO v_duplicate
  FROM neuro.crm_adjust_metacoins(
    v_user_id,
    100,
    'verification:owner',
    'проверка начисления',
    'verify-credit',
    'verify-request-credit'
  );

  IF NOT v_duplicate.applied
    OR NOT v_duplicate.duplicate
    OR v_duplicate.action_id <> v_first.action_id
    OR v_duplicate.ledger_id <> v_first.ledger_id
    OR v_duplicate.balance_after <> 100 THEN
    RAISE EXCEPTION 'idempotency verification failed: %', row_to_json(v_duplicate);
  END IF;

  SELECT * INTO v_debit
  FROM neuro.crm_adjust_metacoins(
    v_user_id,
    -40,
    'verification:owner',
    'проверка списания',
    'verify-debit',
    'verify-request-debit'
  );

  IF NOT v_debit.applied
    OR v_debit.balance_before <> 100
    OR v_debit.balance_after <> 60 THEN
    RAISE EXCEPTION 'debit verification failed: %', row_to_json(v_debit);
  END IF;

  SELECT * INTO v_rejected
  FROM neuro.crm_adjust_metacoins(
    v_user_id,
    -1000,
    'verification:owner',
    'проверка защиты баланса',
    'verify-insufficient',
    'verify-request-insufficient'
  );

  IF v_rejected.applied
    OR v_rejected.error_code <> 'insufficient_balance'
    OR v_rejected.balance_before <> 60
    OR v_rejected.balance_after <> 60
    OR v_rejected.ledger_id IS NOT NULL THEN
    RAISE EXCEPTION 'negative-balance guard failed: %', row_to_json(v_rejected);
  END IF;

  SELECT count(*) INTO v_count
  FROM neuro.metacoin_ledger
  WHERE user_id = v_user_id;
  IF v_count <> 2 THEN
    RAISE EXCEPTION 'expected 2 ledger rows, got %', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM neuro.crm_admin_actions
  WHERE target_user_id = v_user_id;
  IF v_count <> 3 THEN
    RAISE EXCEPTION 'expected 3 admin actions, got %', v_count;
  END IF;

  SELECT count(*) INTO v_count
  FROM neuro.crm_admin_audit_log
  WHERE target_user_id = v_user_id;
  IF v_count <> 3 THEN
    RAISE EXCEPTION 'expected 3 audit rows, got %', v_count;
  END IF;

  BEGIN
    UPDATE neuro.crm_admin_audit_log
    SET reason = 'this update must fail'
    WHERE action_id = v_first.action_id;
  EXCEPTION
    WHEN SQLSTATE '55000' THEN
      v_immutable := true;
  END;

  IF NOT v_immutable THEN
    RAISE EXCEPTION 'audit immutability trigger did not reject UPDATE';
  END IF;
END;
$verification$;

ROLLBACK;
