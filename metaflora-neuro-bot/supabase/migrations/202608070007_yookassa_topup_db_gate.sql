BEGIN;

-- The application records the finance split first, but an executable provider
-- top-up may only be created after YooKassa has confirmed payment.succeeded.
-- This replacement also makes the rule true for direct service-role writes.
CREATE OR REPLACE FUNCTION neuro.record_yookassa_payment_confirmation(
  p_external_event_id text,
  p_payment_id text,
  p_amount_kopecks bigint,
  p_currency text,
  p_event text,
  p_confirmed_at timestamptz,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  confirmation_id uuid,
  duplicate boolean,
  payment_id text,
  payment_amount_kopecks bigint,
  provider_reserve_kopecks bigint,
  topup_count bigint,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing neuro.finance_yookassa_confirmations%ROWTYPE;
  v_payment neuro.payments%ROWTYPE;
  v_confirmation_id uuid;
  v_reserve bigint;
  v_topup_count bigint;
  v_currency text := upper(trim(p_currency));
BEGIN
  IF p_external_event_id IS NULL OR p_external_event_id !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{7,219}$'
    OR p_payment_id IS NULL OR p_payment_id !~ '^[A-Za-z0-9_-]{1,128}$'
    OR p_amount_kopecks IS NULL OR p_amount_kopecks <= 0
    OR v_currency !~ '^[A-Z]{3}$'
    OR p_event <> 'payment.succeeded'
    OR p_confirmed_at IS NULL
    OR p_metadata IS NULL OR jsonb_typeof(p_metadata) <> 'object' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid YooKassa confirmation payload';
  END IF;

  -- Lock the payment before checking either idempotency key. This serializes
  -- retries with different webhook event ids for the same YooKassa payment.
  SELECT payment.* INTO v_payment
  FROM neuro.payments AS payment
  WHERE payment.payment_id = p_payment_id
  FOR UPDATE;
  IF NOT FOUND
    OR v_payment.provider <> 'yookassa'
    OR v_payment.status <> 'succeeded'
    OR v_payment.currency <> v_currency
    OR v_payment.amount_kopecks::bigint <> p_amount_kopecks THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'YooKassa payment is not a successful matching payment';
  END IF;

  SELECT confirmation.* INTO v_existing
  FROM neuro.finance_yookassa_confirmations AS confirmation
  WHERE confirmation.external_event_id = p_external_event_id
  FOR UPDATE;
  IF NOT FOUND THEN
    SELECT confirmation.* INTO v_existing
    FROM neuro.finance_yookassa_confirmations AS confirmation
    WHERE confirmation.payment_id = p_payment_id
    FOR UPDATE;
  END IF;

  IF FOUND THEN
    IF v_existing.payment_id <> p_payment_id
      OR v_existing.amount_kopecks <> p_amount_kopecks
      OR v_existing.currency <> v_currency
      OR v_existing.event <> p_event
      OR v_existing.status <> 'succeeded' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'YooKassa confirmation idempotency payload conflicts';
    END IF;
    v_confirmation_id := v_existing.id;
  ELSE
    INSERT INTO neuro.finance_yookassa_confirmations (
      external_event_id, payment_id, amount_kopecks, currency, event,
      status, source, metadata, confirmed_at
    ) VALUES (
      p_external_event_id, p_payment_id, p_amount_kopecks, v_currency, p_event,
      'succeeded', 'yookassa', p_metadata, p_confirmed_at
    )
    RETURNING id INTO v_confirmation_id;
  END IF;

  SELECT COALESCE(SUM(allocation.amount_kopecks), 0)::bigint INTO v_reserve
  FROM neuro.finance_allocations AS allocation
  WHERE allocation.external_payment_id = p_payment_id
    AND allocation.category = 'api_reserve'
    AND allocation.provider IS NOT NULL
    AND allocation.currency = v_currency;
  IF v_reserve <= 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'payment has no provider reserve';
  END IF;

  -- This is the only automatic queue writer. The confirmation row exists
  -- before the INSERT, so the trigger below also protects this path.
  INSERT INTO neuro.provider_topup_requests (
    allocation_key, provider, amount_kopecks, currency, status, metadata, updated_at
  )
  SELECT allocation.allocation_key,
    allocation.provider,
    allocation.amount_kopecks,
    allocation.currency,
    'queued',
    allocation.metadata || p_metadata || jsonb_build_object(
      'paymentId', p_payment_id,
      'autoTopUp', true,
      'funding_source', 'yookassa',
      'confirmation_event', p_event,
      'confirmation_status', 'posted',
      'confirmation_event_id', p_external_event_id,
      'confirmed_amount_kopecks', p_amount_kopecks,
      'confirmed_at', p_confirmed_at,
      'topupMode', 'yookassa_payment_queue',
      'providerFundingStatus', 'queued_for_gateway'
    ),
    now()
  FROM neuro.finance_allocations AS allocation
  WHERE allocation.external_payment_id = p_payment_id
    AND allocation.category = 'api_reserve'
    AND allocation.provider IS NOT NULL
    AND allocation.currency = v_currency
  ON CONFLICT (allocation_key) DO UPDATE
  SET status = CASE
      WHEN neuro.provider_topup_requests.status IN ('manual', 'queued') THEN 'queued'
      ELSE neuro.provider_topup_requests.status
    END,
    metadata = neuro.provider_topup_requests.metadata || EXCLUDED.metadata,
    updated_at = now();

  GET DIAGNOSTICS v_topup_count = ROW_COUNT;
  RETURN QUERY SELECT
    v_confirmation_id,
    (v_existing.id IS NOT NULL),
    p_payment_id,
    v_payment.amount_kopecks::bigint,
    v_reserve,
    v_topup_count,
    'succeeded'::text;
END;
$$;

CREATE OR REPLACE FUNCTION neuro.guard_queued_provider_topup_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'queued' AND NOT EXISTS (
    SELECT 1
    FROM neuro.finance_allocations AS allocation
    JOIN neuro.finance_yookassa_confirmations AS confirmation
      ON confirmation.payment_id = allocation.external_payment_id
    WHERE allocation.allocation_key = NEW.allocation_key
      AND allocation.category = 'api_reserve'
      AND allocation.provider = NEW.provider
      AND allocation.amount_kopecks = NEW.amount_kopecks
      AND allocation.currency = NEW.currency
      AND confirmation.status = 'succeeded'
      AND confirmation.source = 'yookassa'
      AND confirmation.currency = NEW.currency
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514',
      MESSAGE = 'queued provider top-up requires a successful YooKassa confirmation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS provider_topup_confirmation_guard
  ON neuro.provider_topup_requests;
CREATE TRIGGER provider_topup_confirmation_guard
  BEFORE INSERT OR UPDATE OF status, amount_kopecks, currency, provider, allocation_key
  ON neuro.provider_topup_requests
  FOR EACH ROW
  EXECUTE FUNCTION neuro.guard_queued_provider_topup_confirmation();

-- Quarantine rows created by the pre-gate application version. They must not
-- be picked up by the worker without a YooKassa confirmation.
UPDATE neuro.provider_topup_requests AS topup
SET status = 'manual',
  error_code = 'yookassa_confirmation_required',
  claim_token = NULL,
  claimed_at = NULL,
  lease_until = NULL,
  updated_at = now(),
  metadata = topup.metadata || jsonb_build_object(
    'confirmation_status', 'blocked_unconfirmed',
    'providerFundingStatus', 'awaiting_yookassa_confirmation'
  )
WHERE topup.status IN ('queued', 'processing')
  AND NOT EXISTS (
    SELECT 1
    FROM neuro.finance_allocations AS allocation
    JOIN neuro.finance_yookassa_confirmations AS confirmation
      ON confirmation.payment_id = allocation.external_payment_id
    WHERE allocation.allocation_key = topup.allocation_key
      AND allocation.category = 'api_reserve'
      AND allocation.provider = topup.provider
      AND allocation.amount_kopecks = topup.amount_kopecks
      AND allocation.currency = topup.currency
      AND confirmation.status = 'succeeded'
      AND confirmation.source = 'yookassa'
  );

REVOKE ALL ON FUNCTION neuro.record_yookassa_payment_confirmation(
  text, text, bigint, text, text, timestamptz, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.record_yookassa_payment_confirmation(
  text, text, bigint, text, text, timestamptz, jsonb
) TO service_role;
REVOKE ALL ON FUNCTION neuro.guard_queued_provider_topup_confirmation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.guard_queued_provider_topup_confirmation() TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
