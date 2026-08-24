\set ON_ERROR_STOP on

BEGIN;

DO $verification$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_payment_id uuid := gen_random_uuid();
  v_external_payment_id text := 'verify-subscription-' || gen_random_uuid()::text;
  v_result record;
  v_duplicate record;
BEGIN
  INSERT INTO neuro.users (id, telegram_user_id, username, first_name)
  VALUES (v_user_id, 9223372036854774999, 'subscription_verification', 'verification');

  INSERT INTO neuro.payments (
    id,
    user_id,
    payment_id,
    provider,
    product_type,
    product_id,
    amount_kopecks,
    status,
    base_metacoins,
    paid_at
  ) VALUES (
    v_payment_id,
    v_user_id,
    v_external_payment_id,
    'yookassa',
    'subscription',
    'author',
    74900,
    'succeeded',
    300,
    now()
  );

  SELECT * INTO v_result
  FROM neuro.record_subscription_activation(
    9223372036854774999,
    v_external_payment_id,
    'author',
    '2026-08-01T00:00:00.000Z',
    '2026-08-31T00:00:00.000Z',
    74900,
    300,
    460
  );

  SELECT * INTO v_duplicate
  FROM neuro.record_subscription_activation(
    9223372036854774999,
    v_external_payment_id,
    'author',
    '2026-08-01T00:00:00.000Z',
    '2026-08-31T00:00:00.000Z',
    74900,
    300,
    460
  );

  IF v_result.subscription_id IS NULL
    OR v_result.ledger_id IS NULL
    OR v_result.duplicate
    OR NOT v_duplicate.duplicate
    OR v_duplicate.subscription_id <> v_result.subscription_id
    OR v_duplicate.ledger_id <> v_result.ledger_id THEN
    RAISE EXCEPTION 'subscription activation idempotency failed';
  END IF;

  IF (
    SELECT count(*)
    FROM neuro.subscriptions
    WHERE source_payment_id = v_payment_id
  ) <> 1 THEN
    RAISE EXCEPTION 'subscription activation created an invalid row count';
  END IF;

  IF (
    SELECT count(*)
    FROM neuro.metacoin_ledger
    WHERE idempotency_key = 'subscription:' || v_external_payment_id
  ) <> 1 THEN
    RAISE EXCEPTION 'subscription activation created an invalid ledger row count';
  END IF;
END;
$verification$;

ROLLBACK;
