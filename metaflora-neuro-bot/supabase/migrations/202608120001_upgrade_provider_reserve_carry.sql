BEGIN;

ALTER TABLE neuro.subscription_upgrade_audit
  ADD COLUMN IF NOT EXISTS previous_source_payment_id text;

CREATE OR REPLACE FUNCTION neuro.capture_upgrade_previous_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.previous_source_payment_id IS NULL THEN
    SELECT payment.payment_id
    INTO NEW.previous_source_payment_id
    FROM neuro.subscriptions AS subscription
    JOIN neuro.payments AS payment ON payment.id = subscription.source_payment_id
    WHERE subscription.id = NEW.expected_subscription_id;
  END IF;
  IF NEW.previous_source_payment_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'upgrade previous payment is missing';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capture_upgrade_previous_payment
  ON neuro.subscription_upgrade_audit;
CREATE TRIGGER capture_upgrade_previous_payment
BEFORE INSERT ON neuro.subscription_upgrade_audit
FOR EACH ROW EXECUTE FUNCTION neuro.capture_upgrade_previous_payment();

CREATE TABLE IF NOT EXISTS neuro.finance_reserve_reclassifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reclassification_key text NOT NULL UNIQUE,
  source_allocation_key text NOT NULL
    REFERENCES neuro.finance_allocations(allocation_key) ON DELETE RESTRICT,
  target_payment_id text NOT NULL,
  amount_kopecks bigint NOT NULL CHECK (amount_kopecks > 0),
  reason text NOT NULL CHECK (reason = 'subscription_upgrade'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS finance_reserve_reclassifications_target_idx
  ON neuro.finance_reserve_reclassifications(target_payment_id, created_at);

ALTER TABLE neuro.finance_reserve_reclassifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON neuro.finance_reserve_reclassifications FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON neuro.finance_reserve_reclassifications TO service_role;

CREATE OR REPLACE FUNCTION neuro.reclassify_upgrade_provider_reserve(
  p_target_payment_id text,
  p_amount_kopecks bigint
)
RETURNS TABLE (
  reclassification_id uuid,
  duplicate boolean,
  previous_source_payment_id text,
  reserve_carry_in_kopecks bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_previous_payment_id text;
  v_source neuro.finance_allocations%ROWTYPE;
  v_existing neuro.finance_reserve_reclassifications%ROWTYPE;
  v_used bigint;
  v_key text;
  v_id uuid := gen_random_uuid();
BEGIN
  IF p_target_payment_id IS NULL OR char_length(p_target_payment_id) NOT BETWEEN 1 AND 128
    OR p_amount_kopecks IS NULL OR p_amount_kopecks <= 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid upgrade reserve carry';
  END IF;
  v_key := 'subscription-upgrade:' || p_target_payment_id;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_key, 64197));

  SELECT audit.previous_source_payment_id
  INTO v_previous_payment_id
  FROM neuro.subscription_upgrade_audit AS audit
  WHERE audit.payment_id = p_target_payment_id;
  IF v_previous_payment_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'upgrade audit is missing';
  END IF;

  SELECT reclassification.* INTO v_existing
  FROM neuro.finance_reserve_reclassifications AS reclassification
  WHERE reclassification.reclassification_key = v_key;
  IF FOUND THEN
    IF v_existing.amount_kopecks IS DISTINCT FROM p_amount_kopecks THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'upgrade reserve carry conflicts';
    END IF;
    RETURN QUERY SELECT v_existing.id, true, v_previous_payment_id, v_existing.amount_kopecks;
    RETURN;
  END IF;

  SELECT allocation.* INTO v_source
  FROM neuro.finance_allocations AS allocation
  WHERE allocation.external_payment_id = v_previous_payment_id
    AND allocation.category = 'owner_share'
    AND allocation.status = 'reserved'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'upgrade source owner allocation is missing';
  END IF;

  SELECT COALESCE(sum(reclassification.amount_kopecks), 0)
  INTO v_used
  FROM neuro.finance_reserve_reclassifications AS reclassification
  WHERE reclassification.source_allocation_key = v_source.allocation_key;
  IF v_source.amount_kopecks - v_used < p_amount_kopecks THEN
    RAISE EXCEPTION USING ERRCODE = '22003', MESSAGE = 'upgrade source owner allocation is insufficient';
  END IF;

  INSERT INTO neuro.finance_reserve_reclassifications (
    id, reclassification_key, source_allocation_key, target_payment_id,
    amount_kopecks, reason
  ) VALUES (
    v_id, v_key, v_source.allocation_key, p_target_payment_id,
    p_amount_kopecks, 'subscription_upgrade'
  );
  RETURN QUERY SELECT v_id, false, v_previous_payment_id, p_amount_kopecks;
END;
$$;

REVOKE ALL ON FUNCTION neuro.reclassify_upgrade_provider_reserve(text, bigint)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.reclassify_upgrade_provider_reserve(text, bigint)
  TO service_role;

COMMIT;
