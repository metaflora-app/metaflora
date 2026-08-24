BEGIN;

-- A webhook can fail after the local entitlement was activated but before all
-- CRM writes finished. The user may spend the credits before YooKassa retries
-- the webhook, so a duplicate fulfillment must return the balance stored by
-- its original ledger row instead of comparing it with the new live balance.

CREATE OR REPLACE FUNCTION neuro.record_metacoin_purchase(
  p_telegram_user_id bigint,
  p_payment_id text,
  p_metacoins integer,
  p_bonus_metacoins integer,
  p_balance_after integer
)
RETURNS TABLE (
  ledger_id uuid,
  duplicate boolean,
  balance_after integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_payment neuro.payments%ROWTYPE;
  v_existing neuro.metacoin_ledger%ROWTYPE;
  v_ledger_id uuid;
  v_key text;
  v_duplicate boolean := false;
BEGIN
  IF p_telegram_user_id IS NULL OR p_telegram_user_id <= 0
    OR p_payment_id IS NULL OR char_length(p_payment_id) NOT BETWEEN 1 AND 128
    OR p_metacoins IS NULL OR p_metacoins <= 0
    OR p_bonus_metacoins IS NULL OR p_bonus_metacoins < 0
    OR p_balance_after IS NULL OR p_balance_after < p_metacoins THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid metacoin purchase payload';
  END IF;

  SELECT app_user.id INTO v_user_id
  FROM neuro.users AS app_user
  WHERE app_user.telegram_user_id = p_telegram_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'metacoin purchase user does not exist';
  END IF;

  SELECT payment.* INTO v_payment
  FROM neuro.payments AS payment
  WHERE payment.payment_id = p_payment_id
  FOR UPDATE;
  IF NOT FOUND
    OR v_payment.user_id <> v_user_id
    OR v_payment.product_type <> 'metacoins'
    OR v_payment.status <> 'succeeded'
    OR v_payment.base_metacoins + p_bonus_metacoins <> p_metacoins THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'metacoin purchase payload conflicts';
  END IF;

  UPDATE neuro.payments
  SET bonus_metacoins = p_bonus_metacoins, updated_at = now()
  WHERE id = v_payment.id;

  v_key := 'package:' || p_payment_id;
  SELECT ledger.* INTO v_existing
  FROM neuro.metacoin_ledger AS ledger
  WHERE ledger.idempotency_key = v_key;
  IF FOUND THEN
    IF v_existing.user_id <> v_user_id
      OR v_existing.delta <> p_metacoins
      OR v_existing.source <> 'package'
      OR v_existing.reference_id <> p_payment_id THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'metacoin purchase idempotency payload conflicts';
    END IF;
    v_ledger_id := v_existing.id;
    v_duplicate := true;
    RETURN QUERY SELECT v_ledger_id, v_duplicate, v_existing.balance_after AS balance_after;
    RETURN;
  END IF;

  INSERT INTO neuro.metacoin_ledger (
    user_id, idempotency_key, delta, balance_after, source,
    reference_type, reference_id, description, metadata
  ) VALUES (
    v_user_id, v_key, p_metacoins, p_balance_after, 'package',
    'payment', p_payment_id, 'начисление пакета метакоинов',
    jsonb_build_object('payment_id', p_payment_id, 'bonus_metacoins', p_bonus_metacoins)
  )
  RETURNING id INTO v_ledger_id;

  RETURN QUERY SELECT v_ledger_id, v_duplicate, p_balance_after;
END;
$$;

CREATE OR REPLACE FUNCTION neuro.record_subscription_activation(
  p_telegram_user_id bigint,
  p_payment_id text,
  p_plan_id text,
  p_starts_at timestamptz,
  p_expires_at timestamptz,
  p_price_kopecks integer,
  p_metacoins integer,
  p_balance_after integer
)
RETURNS TABLE (
  subscription_id uuid,
  ledger_id uuid,
  duplicate boolean,
  starts_at timestamptz,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_payment neuro.payments%ROWTYPE;
  v_existing neuro.subscriptions%ROWTYPE;
  v_subscription_id uuid := gen_random_uuid();
  v_ledger_id uuid;
  v_existing_ledger neuro.metacoin_ledger%ROWTYPE;
  v_status text;
  v_ledger_key text;
  v_duplicate boolean := false;
BEGIN
  IF p_telegram_user_id IS NULL OR p_telegram_user_id <= 0
    OR p_payment_id IS NULL OR char_length(p_payment_id) NOT BETWEEN 1 AND 128
    OR p_plan_id IS NULL OR p_plan_id !~ '^[a-z][a-z0-9_]{1,63}$'
    OR p_starts_at IS NULL OR p_expires_at IS NULL
    OR p_expires_at <= p_starts_at
    OR p_expires_at > p_starts_at + interval '370 days'
    OR p_price_kopecks IS NULL OR p_price_kopecks <= 0
    OR p_metacoins IS NULL OR p_metacoins <= 0
    OR p_balance_after IS NULL OR p_balance_after < p_metacoins THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid subscription activation payload';
  END IF;

  SELECT app_user.id INTO v_user_id
  FROM neuro.users AS app_user
  WHERE app_user.telegram_user_id = p_telegram_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'subscription user does not exist';
  END IF;

  SELECT payment.* INTO v_payment
  FROM neuro.payments AS payment
  WHERE payment.payment_id = p_payment_id
  FOR UPDATE;
  IF NOT FOUND
    OR v_payment.user_id <> v_user_id
    OR v_payment.product_type <> 'subscription'
    OR v_payment.product_id <> p_plan_id
    OR v_payment.status <> 'succeeded'
    OR v_payment.amount_kopecks <> p_price_kopecks
    OR v_payment.base_metacoins <> p_metacoins THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'subscription payment payload conflicts';
  END IF;

  SELECT subscription.* INTO v_existing
  FROM neuro.subscriptions AS subscription
  WHERE subscription.source_payment_id = v_payment.id;

  IF FOUND THEN
    IF v_existing.user_id <> v_user_id
      OR v_existing.plan_id <> p_plan_id
      OR v_existing.price_kopecks <> p_price_kopecks
      OR v_existing.metacoins_total <> p_metacoins
      OR v_existing.starts_at <> p_starts_at
      OR v_existing.expires_at <> p_expires_at THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'subscription activation idempotency payload conflicts';
    END IF;
    v_subscription_id := v_existing.id;
    v_duplicate := true;
  ELSE
    v_status := CASE
      WHEN p_expires_at <= now() THEN 'expired'
      WHEN p_starts_at > now() THEN 'pending'
      ELSE 'active'
    END;
    INSERT INTO neuro.subscriptions (
      id, user_id, plan_id, status, source_payment_id, price_kopecks,
      metacoins_total, metacoins_remaining, starts_at, expires_at
    ) VALUES (
      v_subscription_id, v_user_id, p_plan_id, v_status, v_payment.id,
      p_price_kopecks, p_metacoins, p_metacoins, p_starts_at, p_expires_at
    );
  END IF;

  v_ledger_key := 'subscription:' || p_payment_id;
  SELECT ledger.* INTO v_existing_ledger
  FROM neuro.metacoin_ledger AS ledger
  WHERE ledger.idempotency_key = v_ledger_key;

  IF FOUND THEN
    IF v_existing_ledger.user_id <> v_user_id
      OR v_existing_ledger.delta <> p_metacoins
      OR v_existing_ledger.source <> 'subscription'
      OR v_existing_ledger.reference_id <> v_subscription_id::text THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'subscription ledger idempotency payload conflicts';
    END IF;
    v_ledger_id := v_existing_ledger.id;
    RETURN QUERY SELECT
      v_subscription_id, v_ledger_id, v_duplicate,
      p_starts_at, p_expires_at;
    RETURN;
  END IF;

  INSERT INTO neuro.metacoin_ledger (
    user_id, idempotency_key, delta, balance_after, source,
    reference_type, reference_id, description, metadata
  ) VALUES (
    v_user_id, v_ledger_key, p_metacoins, p_balance_after, 'subscription',
    'subscription', v_subscription_id::text, 'начисление по платному тарифу',
    jsonb_build_object(
      'plan_id', p_plan_id,
      'payment_id', p_payment_id,
      'starts_at', p_starts_at,
      'expires_at', p_expires_at,
      'metacoins_expire', false
    )
  )
  RETURNING id INTO v_ledger_id;

  RETURN QUERY SELECT
    v_subscription_id, v_ledger_id, v_duplicate,
    p_starts_at, p_expires_at;
END;
$$;

REVOKE ALL ON FUNCTION neuro.record_metacoin_purchase(bigint, text, integer, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.record_metacoin_purchase(bigint, text, integer, integer, integer)
  TO service_role;
REVOKE ALL ON FUNCTION neuro.record_subscription_activation(
  bigint, text, text, timestamptz, timestamptz, integer, integer, integer
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.record_subscription_activation(
  bigint, text, text, timestamptz, timestamptz, integer, integer, integer
) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
