BEGIN;

CREATE TABLE IF NOT EXISTS neuro.subscription_upgrade_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text NOT NULL UNIQUE
    CHECK (char_length(payment_id) BETWEEN 1 AND 128),
  user_id uuid NOT NULL REFERENCES neuro.users(id) ON DELETE RESTRICT,
  telegram_user_id bigint NOT NULL CHECK (telegram_user_id > 0),
  expected_subscription_id uuid NOT NULL REFERENCES neuro.subscriptions(id) ON DELETE RESTRICT,
  expected_subscription_updated_at timestamptz NOT NULL,
  activated_subscription_id uuid NOT NULL UNIQUE REFERENCES neuro.subscriptions(id) ON DELETE RESTRICT,
  ledger_id uuid NOT NULL UNIQUE REFERENCES neuro.metacoin_ledger(id) ON DELETE RESTRICT,
  from_plan_id text NOT NULL CHECK (from_plan_id ~ '^[a-z][a-z0-9_]{1,63}$'),
  to_plan_id text NOT NULL CHECK (to_plan_id ~ '^[a-z][a-z0-9_]{1,63}$'),
  duration_months integer NOT NULL CHECK (duration_months IN (1, 3)),
  before_subscription_total integer NOT NULL CHECK (before_subscription_total >= 0),
  before_subscription_remaining integer NOT NULL CHECK (before_subscription_remaining >= 0),
  target_subscription_total integer NOT NULL CHECK (target_subscription_total > 0),
  credited_delta integer NOT NULL CHECK (credited_delta >= 0),
  after_subscription_total integer NOT NULL CHECK (after_subscription_total > 0),
  after_subscription_remaining integer NOT NULL CHECK (after_subscription_remaining >= 0),
  before_general_balance integer NOT NULL CHECK (before_general_balance >= 0),
  after_general_balance integer NOT NULL CHECK (after_general_balance >= 0),
  payment_amount_kopecks integer NOT NULL CHECK (payment_amount_kopecks > 0),
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (from_plan_id <> to_plan_id),
  CHECK (before_subscription_remaining <= before_subscription_total),
  CHECK (target_subscription_total >= before_subscription_remaining),
  CHECK (credited_delta = target_subscription_total - before_subscription_remaining),
  CHECK (after_subscription_total = target_subscription_total),
  CHECK (after_subscription_remaining = target_subscription_total),
  CHECK (after_general_balance = before_general_balance + credited_delta)
);

CREATE INDEX IF NOT EXISTS subscription_upgrade_audit_user_time_idx
  ON neuro.subscription_upgrade_audit(user_id, occurred_at DESC);

ALTER TABLE neuro.subscription_upgrade_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE neuro.subscription_upgrade_audit
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE neuro.subscription_upgrade_audit TO service_role;

CREATE OR REPLACE FUNCTION neuro.activate_subscription_upgrade(
  p_payment_id text,
  p_telegram_user_id bigint,
  p_expected_subscription_id uuid,
  p_expected_subscription_updated_at timestamptz,
  p_from_plan_id text,
  p_to_plan_id text,
  p_duration_months integer,
  p_starts_at timestamptz,
  p_expires_at timestamptz,
  p_before_subscription_total integer,
  p_before_subscription_remaining integer,
  p_target_subscription_total integer,
  p_credited_delta integer,
  p_after_subscription_total integer,
  p_after_subscription_remaining integer,
  p_before_general_balance integer,
  p_after_general_balance integer,
  p_payment_amount_kopecks integer,
  p_occurred_at timestamptz
)
RETURNS TABLE (
  audit_id uuid,
  subscription_id uuid,
  ledger_id uuid,
  duplicate boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_payment neuro.payments%ROWTYPE;
  v_current neuro.subscriptions%ROWTYPE;
  v_existing neuro.subscription_upgrade_audit%ROWTYPE;
  v_audit_id uuid := gen_random_uuid();
  v_subscription_id uuid := gen_random_uuid();
  v_ledger_id uuid;
BEGIN
  IF p_payment_id IS NULL OR char_length(p_payment_id) NOT BETWEEN 1 AND 128
    OR p_telegram_user_id IS NULL OR p_telegram_user_id <= 0
    OR p_expected_subscription_id IS NULL
    OR p_expected_subscription_updated_at IS NULL
    OR p_from_plan_id IS NULL OR p_from_plan_id !~ '^[a-z][a-z0-9_]{1,63}$'
    OR p_to_plan_id IS NULL OR p_to_plan_id !~ '^[a-z][a-z0-9_]{1,63}$'
    OR p_from_plan_id = p_to_plan_id
    OR p_duration_months IS NULL OR p_duration_months NOT IN (1, 3)
    OR p_starts_at IS NULL OR p_expires_at IS NULL
    OR p_expires_at <= p_starts_at
    OR p_expires_at > p_starts_at + interval '370 days'
    OR p_before_subscription_total IS NULL OR p_before_subscription_total < 0
    OR p_before_subscription_remaining IS NULL OR p_before_subscription_remaining < 0
    OR p_before_subscription_remaining > p_before_subscription_total
    OR p_target_subscription_total IS NULL
    OR p_target_subscription_total < p_before_subscription_remaining
    OR p_credited_delta IS NULL OR p_credited_delta <= 0
    OR p_credited_delta <> p_target_subscription_total - p_before_subscription_remaining
    OR p_after_subscription_total IS DISTINCT FROM p_target_subscription_total
    OR p_after_subscription_remaining IS DISTINCT FROM p_target_subscription_total
    OR p_before_general_balance IS NULL OR p_before_general_balance < 0
    OR p_after_general_balance IS DISTINCT FROM p_before_general_balance + p_credited_delta
    OR p_payment_amount_kopecks IS NULL OR p_payment_amount_kopecks <= 0
    OR p_occurred_at IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid subscription upgrade activation payload';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('subscription-upgrade-audit:' || p_payment_id, 64197)
  );

  SELECT audit.*
  INTO v_existing
  FROM neuro.subscription_upgrade_audit AS audit
  WHERE audit.payment_id = p_payment_id;

  IF FOUND THEN
    IF v_existing.telegram_user_id IS DISTINCT FROM p_telegram_user_id
      OR v_existing.expected_subscription_id IS DISTINCT FROM p_expected_subscription_id
      OR v_existing.expected_subscription_updated_at IS DISTINCT FROM p_expected_subscription_updated_at
      OR v_existing.from_plan_id IS DISTINCT FROM p_from_plan_id
      OR v_existing.to_plan_id IS DISTINCT FROM p_to_plan_id
      OR v_existing.duration_months IS DISTINCT FROM p_duration_months
      OR v_existing.before_subscription_total IS DISTINCT FROM p_before_subscription_total
      OR v_existing.before_subscription_remaining IS DISTINCT FROM p_before_subscription_remaining
      OR v_existing.target_subscription_total IS DISTINCT FROM p_target_subscription_total
      OR v_existing.credited_delta IS DISTINCT FROM p_credited_delta
      OR v_existing.after_subscription_total IS DISTINCT FROM p_after_subscription_total
      OR v_existing.after_subscription_remaining IS DISTINCT FROM p_after_subscription_remaining
      OR v_existing.before_general_balance IS DISTINCT FROM p_before_general_balance
      OR v_existing.after_general_balance IS DISTINCT FROM p_after_general_balance
      OR v_existing.payment_amount_kopecks IS DISTINCT FROM p_payment_amount_kopecks
      OR v_existing.occurred_at IS DISTINCT FROM p_occurred_at THEN
      RAISE EXCEPTION USING ERRCODE = '22023',
        MESSAGE = 'subscription upgrade audit idempotency payload conflicts';
    END IF;
    RETURN QUERY SELECT
      v_existing.id, v_existing.activated_subscription_id,
      v_existing.ledger_id, true;
    RETURN;
  END IF;

  SELECT app_user.id
  INTO v_user_id
  FROM neuro.users AS app_user
  WHERE app_user.telegram_user_id = p_telegram_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'subscription upgrade user does not exist';
  END IF;

  SELECT payment.*
  INTO v_payment
  FROM neuro.payments AS payment
  WHERE payment.payment_id = p_payment_id
  FOR UPDATE;
  IF NOT FOUND
    OR v_payment.user_id IS DISTINCT FROM v_user_id
    OR v_payment.product_type IS DISTINCT FROM 'subscription'
    OR v_payment.product_id IS DISTINCT FROM p_to_plan_id
    OR v_payment.status IS DISTINCT FROM 'succeeded'
    OR v_payment.amount_kopecks IS DISTINCT FROM p_payment_amount_kopecks THEN
    RAISE EXCEPTION USING ERRCODE = '22023',
      MESSAGE = 'subscription upgrade payment payload conflicts';
  END IF;

  SELECT subscription.*
  INTO v_current
  FROM neuro.subscriptions AS subscription
  WHERE subscription.id = p_expected_subscription_id
  FOR UPDATE;
  IF NOT FOUND
    OR v_current.user_id IS DISTINCT FROM v_user_id
    OR v_current.plan_id IS DISTINCT FROM p_from_plan_id
    OR v_current.metacoins_total IS DISTINCT FROM p_before_subscription_total
    OR v_current.metacoins_remaining IS DISTINCT FROM p_before_subscription_remaining
    OR v_current.updated_at IS DISTINCT FROM p_expected_subscription_updated_at
    OR v_current.cancelled_at IS NOT NULL
    OR v_current.expires_at <= p_occurred_at THEN
    RAISE EXCEPTION USING ERRCODE = '40001',
      MESSAGE = 'subscription upgrade expected state changed';
  END IF;

  IF COALESCE((
    SELECT ledger.balance_after
    FROM neuro.metacoin_ledger AS ledger
    WHERE ledger.user_id = v_user_id
    ORDER BY ledger.created_at DESC, ledger.id DESC
    LIMIT 1
  ), 0) IS DISTINCT FROM p_before_general_balance THEN
    RAISE EXCEPTION USING ERRCODE = '40001',
      MESSAGE = 'subscription upgrade balance changed';
  END IF;

  UPDATE neuro.subscriptions
  SET status = 'cancelled', cancelled_at = p_occurred_at, updated_at = p_occurred_at
  WHERE id = v_current.id;

  INSERT INTO neuro.subscriptions (
    id, user_id, plan_id, status, source_payment_id, price_kopecks,
    metacoins_total, metacoins_remaining, starts_at, expires_at
  ) VALUES (
    v_subscription_id, v_user_id, p_to_plan_id,
    CASE WHEN p_starts_at > p_occurred_at THEN 'pending' ELSE 'active' END,
    v_payment.id, p_payment_amount_kopecks,
    p_target_subscription_total, p_target_subscription_total,
    p_starts_at, p_expires_at
  );

  INSERT INTO neuro.metacoin_ledger (
    user_id, idempotency_key, delta, balance_after, source,
    reference_type, reference_id, description, metadata, created_at
  ) VALUES (
    v_user_id, 'subscription-upgrade:' || p_payment_id,
    p_credited_delta, p_after_general_balance, 'subscription',
    'subscription_upgrade', v_subscription_id::text,
    'дельта метакоинов при апгрейде тарифа',
    jsonb_build_object(
      'payment_id', p_payment_id,
      'from_plan_id', p_from_plan_id,
      'to_plan_id', p_to_plan_id,
      'before_subscription_remaining', p_before_subscription_remaining,
      'target_subscription_total', p_target_subscription_total
    ),
    p_occurred_at
  ) RETURNING id INTO v_ledger_id;

  INSERT INTO neuro.subscription_upgrade_audit (
    id, payment_id, user_id, telegram_user_id,
    expected_subscription_id, expected_subscription_updated_at,
    activated_subscription_id, ledger_id, from_plan_id, to_plan_id,
    duration_months, before_subscription_total, before_subscription_remaining,
    target_subscription_total, credited_delta, after_subscription_total,
    after_subscription_remaining, before_general_balance, after_general_balance,
    payment_amount_kopecks, occurred_at
  ) VALUES (
    v_audit_id, p_payment_id, v_user_id, p_telegram_user_id,
    p_expected_subscription_id, p_expected_subscription_updated_at,
    v_subscription_id, v_ledger_id,
    p_from_plan_id, p_to_plan_id, p_duration_months,
    p_before_subscription_total, p_before_subscription_remaining,
    p_target_subscription_total, p_credited_delta, p_after_subscription_total,
    p_after_subscription_remaining, p_before_general_balance,
    p_after_general_balance, p_payment_amount_kopecks, p_occurred_at
  );

  RETURN QUERY SELECT v_audit_id, v_subscription_id, v_ledger_id, false;
END;
$$;

REVOKE ALL ON FUNCTION neuro.activate_subscription_upgrade(
  text, bigint, uuid, timestamptz, text, text, integer, timestamptz, timestamptz,
  integer, integer, integer, integer, integer, integer, integer, integer, integer,
  timestamptz
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.activate_subscription_upgrade(
  text, bigint, uuid, timestamptz, text, text, integer, timestamptz, timestamptz,
  integer, integer, integer, integer, integer, integer, integer, integer, integer,
  timestamptz
) TO service_role;

CREATE OR REPLACE FUNCTION neuro.sync_subscription_remaining_from_ledger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_subscription_id uuid;
BEGIN
  IF NEW.source = 'generation' AND NEW.delta < 0 THEN
    SELECT subscription.id
    INTO v_subscription_id
    FROM neuro.subscriptions AS subscription
    WHERE subscription.user_id = NEW.user_id
      AND subscription.cancelled_at IS NULL
      AND subscription.status IN ('active', 'pending')
      AND subscription.starts_at <= NEW.created_at
      AND subscription.expires_at > NEW.created_at
    ORDER BY subscription.starts_at DESC, subscription.created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF v_subscription_id IS NOT NULL THEN
      UPDATE neuro.subscriptions
      SET metacoins_remaining = GREATEST(0, metacoins_remaining + NEW.delta),
          updated_at = GREATEST(updated_at, NEW.created_at)
      WHERE id = v_subscription_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS metacoin_ledger_subscription_remaining_sync
  ON neuro.metacoin_ledger;
CREATE TRIGGER metacoin_ledger_subscription_remaining_sync
  AFTER INSERT ON neuro.metacoin_ledger
  FOR EACH ROW
  EXECUTE FUNCTION neuro.sync_subscription_remaining_from_ledger();

REVOKE ALL ON FUNCTION neuro.sync_subscription_remaining_from_ledger()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE VIEW neuro.crm_subscription_overview
WITH (security_invoker = true)
AS
SELECT
  subscription.id,
  subscription.user_id,
  app_user.telegram_user_id,
  app_user.username,
  subscription.plan_id,
  CASE
    WHEN subscription.cancelled_at IS NOT NULL THEN 'cancelled'
    WHEN subscription.expires_at <= now() THEN 'expired'
    WHEN subscription.starts_at > now() THEN 'scheduled'
    ELSE 'active'
  END AS effective_status,
  subscription.starts_at,
  subscription.expires_at AS ends_at,
  subscription.price_kopecks,
  subscription.metacoins_total AS metacoins_credited,
  false AS metacoins_expire,
  (
    subscription.starts_at <= now()
    AND subscription.expires_at > now()
    AND subscription.cancelled_at IS NULL
  ) AS paid_access_active,
  COALESCE(latest_ledger.balance_after, 0) AS current_metacoin_balance,
  subscription.created_at,
  subscription.updated_at,
  subscription.metacoins_total AS subscription_metacoins_total,
  subscription.metacoins_remaining AS subscription_metacoins_remaining,
  COALESCE(latest_ledger.balance_after, 0) AS general_metacoin_balance,
  GREATEST(
    COALESCE(latest_ledger.balance_after, 0) - subscription.metacoins_remaining,
    0
  ) AS package_metacoin_balance
FROM neuro.subscriptions AS subscription
JOIN neuro.users AS app_user ON app_user.id = subscription.user_id
LEFT JOIN LATERAL (
  SELECT ledger.balance_after
  FROM neuro.metacoin_ledger AS ledger
  WHERE ledger.user_id = subscription.user_id
  ORDER BY ledger.created_at DESC, ledger.id DESC
  LIMIT 1
) AS latest_ledger ON true;

CREATE OR REPLACE VIEW neuro.crm_provider_funding_overview
WITH (security_invoker = true)
AS
SELECT
  allocation.allocation_key,
  allocation.external_payment_id,
  allocation.user_id,
  allocation.provider,
  allocation.amount_kopecks AS allocated_kopecks,
  CASE
    WHEN topup.status = 'succeeded' THEN LEAST(topup.amount_kopecks, allocation.amount_kopecks)
    ELSE 0
  END AS funded_kopecks,
  GREATEST(
    allocation.amount_kopecks - CASE
      WHEN topup.status = 'succeeded' THEN LEAST(topup.amount_kopecks, allocation.amount_kopecks)
      ELSE 0
    END,
    0
  ) AS remaining_kopecks,
  allocation.currency,
  COALESCE(topup.status, 'not_queued') AS funding_status,
  allocation.occurred_at,
  GREATEST(allocation.updated_at, COALESCE(topup.updated_at, allocation.updated_at)) AS updated_at
FROM neuro.finance_allocations AS allocation
LEFT JOIN neuro.provider_topup_requests AS topup
  ON topup.allocation_key = allocation.allocation_key
WHERE allocation.category = 'api_reserve'
  AND allocation.provider IS NOT NULL
  AND allocation.status <> 'reversed';

REVOKE ALL ON TABLE neuro.crm_subscription_overview,
  neuro.crm_provider_funding_overview
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE neuro.crm_subscription_overview TO service_role;
GRANT SELECT ON TABLE neuro.crm_provider_funding_overview TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
