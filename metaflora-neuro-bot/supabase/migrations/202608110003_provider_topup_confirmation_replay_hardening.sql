BEGIN;

-- A charge-started request has an unknown or completed external side effect and
-- must never re-enter the claim queue. Preserve charge evidence for reconciliation.
UPDATE neuro.provider_topup_requests
SET status = 'manual',
  error_code = COALESCE(error_code, 'charge_result_unknown'),
  claim_token = NULL,
  claimed_at = NULL,
  lease_until = NULL,
  processed_at = COALESCE(processed_at, now()),
  updated_at = now(),
  metadata = metadata || jsonb_build_object(
    'providerFundingStatus', 'manual_reconciliation_required',
    'recoveryReason', 'queued_after_charge_started'
  )
WHERE status = 'queued'
  AND charge_started_at IS NOT NULL;

ALTER TABLE neuro.provider_topup_requests
  DROP CONSTRAINT IF EXISTS provider_topup_requests_queued_not_started_check;
ALTER TABLE neuro.provider_topup_requests
  ADD CONSTRAINT provider_topup_requests_queued_not_started_check
  CHECK (status <> 'queued' OR charge_started_at IS NULL)
  NOT VALID;
ALTER TABLE neuro.provider_topup_requests
  VALIDATE CONSTRAINT provider_topup_requests_queued_not_started_check;

-- Confirmation retries are idempotent queue writes. Once an allocation has a
-- top-up request, a replay must not mutate its lifecycle state or charge data.
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
  ON CONFLICT (allocation_key) DO NOTHING;

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

CREATE OR REPLACE FUNCTION neuro.record_tbank_payment_confirmation(
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
  v_existing neuro.finance_tbank_confirmations%ROWTYPE;
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
    OR p_event <> 'CONFIRMED'
    OR p_confirmed_at IS NULL
    OR p_metadata IS NULL OR jsonb_typeof(p_metadata) <> 'object' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid T-Bank confirmation payload';
  END IF;

  SELECT payment.* INTO v_payment
  FROM neuro.payments AS payment
  WHERE payment.payment_id = p_payment_id
  FOR UPDATE;
  IF NOT FOUND
    OR v_payment.provider <> 'tbank'
    OR v_payment.status <> 'succeeded'
    OR v_payment.currency <> v_currency
    OR v_payment.amount_kopecks::bigint <> p_amount_kopecks THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'T-Bank payment is not a successful matching payment';
  END IF;

  SELECT confirmation.* INTO v_existing
  FROM neuro.finance_tbank_confirmations AS confirmation
  WHERE confirmation.external_event_id = p_external_event_id
  FOR UPDATE;
  IF NOT FOUND THEN
    SELECT confirmation.* INTO v_existing
    FROM neuro.finance_tbank_confirmations AS confirmation
    WHERE confirmation.payment_id = p_payment_id
    FOR UPDATE;
  END IF;

  IF FOUND THEN
    IF v_existing.payment_id <> p_payment_id
      OR v_existing.amount_kopecks <> p_amount_kopecks
      OR v_existing.currency <> v_currency
      OR v_existing.event <> p_event
      OR v_existing.status <> 'succeeded' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'T-Bank confirmation idempotency payload conflicts';
    END IF;
    v_confirmation_id := v_existing.id;
  ELSE
    INSERT INTO neuro.finance_tbank_confirmations (
      external_event_id, payment_id, amount_kopecks, currency, event,
      status, source, metadata, confirmed_at
    ) VALUES (
      p_external_event_id, p_payment_id, p_amount_kopecks, v_currency, p_event,
      'succeeded', 'tbank', p_metadata, p_confirmed_at
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
      'funding_source', 'tbank',
      'confirmation_event', p_event,
      'confirmation_status', 'posted',
      'confirmation_event_id', p_external_event_id,
      'confirmed_amount_kopecks', p_amount_kopecks,
      'confirmed_at', p_confirmed_at,
      'topupMode', 'tbank_payment_queue',
      'providerFundingStatus', 'queued_for_gateway'
    ),
    now()
  FROM neuro.finance_allocations AS allocation
  WHERE allocation.external_payment_id = p_payment_id
    AND allocation.category = 'api_reserve'
    AND allocation.provider IS NOT NULL
    AND allocation.currency = v_currency
  ON CONFLICT (allocation_key) DO NOTHING;

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

-- Re-assert the current claim contract with a global pre-charge predicate.
CREATE OR REPLACE FUNCTION neuro.claim_provider_topup_requests(
  p_provider text,
  p_limit integer DEFAULT 10,
  p_lease_seconds integer DEFAULT 300,
  p_max_attempts integer DEFAULT 5
)
RETURNS TABLE (
  id uuid, allocation_key text, payment_id text, provider text,
  amount_kopecks bigint, currency text, status text, attempt_count integer,
  claim_token uuid, lease_until timestamptz, external_id text,
  observed_transaction_id text, observed_amount_kopecks bigint,
  observed_balance_kopecks bigint, observed_at timestamptz, error_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_provider IS NULL OR p_provider !~ '^[a-z][a-z0-9_-]{1,63}$'
    OR p_limit IS NULL OR p_limit < 1 OR p_limit > 50
    OR p_lease_seconds IS NULL OR p_lease_seconds < 30 OR p_lease_seconds > 3600
    OR p_max_attempts IS NULL OR p_max_attempts < 1 OR p_max_attempts > 10 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid provider topup claim options';
  END IF;

  UPDATE neuro.provider_topup_requests AS topup
  SET status = 'failed', error_code = 'max_attempts_exceeded',
      claim_token = NULL, claimed_at = NULL, lease_until = NULL,
      processed_at = COALESCE(processed_at, now()), updated_at = now()
  WHERE topup.provider = p_provider
    AND topup.status = 'processing'
    AND topup.lease_until < now()
    AND topup.attempt_count >= p_max_attempts
    AND topup.charge_started_at IS NULL;

  RETURN QUERY
  WITH eligible_small_total AS (
    SELECT COALESCE(SUM(candidate.amount_kopecks), 0)::bigint AS total_kopecks
    FROM neuro.provider_topup_requests AS candidate
    JOIN neuro.finance_allocations AS candidate_allocation
      ON candidate_allocation.allocation_key = candidate.allocation_key
    WHERE candidate.provider = p_provider
      AND candidate.currency = 'RUB'
      AND candidate.amount_kopecks < 10000
      AND candidate.charge_started_at IS NULL
      AND candidate.attempt_count < p_max_attempts
      AND candidate_allocation.external_payment_id IS NOT NULL
      AND (
        candidate.status = 'queued'
        OR (candidate.status = 'processing' AND candidate.lease_until < now())
      )
  ), candidates AS (
    SELECT topup.id
    FROM neuro.provider_topup_requests AS topup
    JOIN neuro.finance_allocations AS allocation
      ON allocation.allocation_key = topup.allocation_key
    WHERE topup.provider = p_provider
      AND allocation.external_payment_id IS NOT NULL
      AND topup.attempt_count < p_max_attempts
      -- A queued row is claimable only before any external charge begins.
      -- This global predicate also protects against legacy/corrupt queued rows.
      AND topup.charge_started_at IS NULL
      AND (
        p_provider = 'gptunnel'
        OR topup.amount_kopecks >= 10000
        OR (SELECT small.total_kopecks FROM eligible_small_total AS small) >= 10000
      )
      AND (
        topup.status = 'queued'
        OR (
          topup.status = 'processing'
          AND topup.lease_until < now()
          AND topup.charge_started_at IS NULL
        )
      )
    ORDER BY topup.created_at, topup.id
    FOR UPDATE OF topup SKIP LOCKED
    LIMIT p_limit
  ), claimed AS (
    UPDATE neuro.provider_topup_requests AS topup
    SET status = 'processing', claim_token = gen_random_uuid(), claimed_at = now(),
        lease_until = now() + make_interval(secs => p_lease_seconds),
        attempt_count = topup.attempt_count + 1, last_attempt_at = now(), updated_at = now()
    FROM candidates
    WHERE topup.id = candidates.id
    RETURNING topup.*
  )
  SELECT claimed.id, claimed.allocation_key, allocation.external_payment_id,
    claimed.provider, claimed.amount_kopecks, claimed.currency, claimed.status,
    claimed.attempt_count, claimed.claim_token, claimed.lease_until,
    claimed.external_id, claimed.observed_transaction_id,
    claimed.observed_amount_kopecks, claimed.observed_balance_kopecks,
    claimed.observed_at, claimed.error_code
  FROM claimed
  JOIN neuro.finance_allocations AS allocation
    ON allocation.allocation_key = claimed.allocation_key;
END;
$$;

REVOKE ALL ON FUNCTION neuro.record_yookassa_payment_confirmation(
  text, text, bigint, text, text, timestamptz, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.record_yookassa_payment_confirmation(
  text, text, bigint, text, text, timestamptz, jsonb
) TO service_role;

REVOKE ALL ON FUNCTION neuro.record_tbank_payment_confirmation(
  text, text, bigint, text, text, timestamptz, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.record_tbank_payment_confirmation(
  text, text, bigint, text, text, timestamptz, jsonb
) TO service_role;

REVOKE ALL ON FUNCTION neuro.claim_provider_topup_requests(text, integer, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.claim_provider_topup_requests(text, integer, integer, integer)
  TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;

