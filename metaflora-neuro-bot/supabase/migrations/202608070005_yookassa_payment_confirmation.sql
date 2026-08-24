BEGIN;

-- YooKassa's payment.succeeded webhook is the only funding confirmation used
-- by this contour. A bank-card statement webhook is intentionally not used:
-- the business card is configured in the provider dashboards, while this row
-- records the exact YooKassa payment that authorizes the queued top-ups.
CREATE TABLE IF NOT EXISTS neuro.finance_yookassa_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_event_id text NOT NULL UNIQUE,
  payment_id text NOT NULL UNIQUE,
  amount_kopecks bigint NOT NULL CHECK (amount_kopecks > 0),
  currency text NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  event text NOT NULL CHECK (event = 'payment.succeeded'),
  status text NOT NULL CHECK (status = 'succeeded'),
  source text NOT NULL DEFAULT 'yookassa' CHECK (source = 'yookassa'),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  confirmed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS finance_yookassa_confirmations_payment_idx
  ON neuro.finance_yookassa_confirmations(payment_id, confirmed_at DESC);

ALTER TABLE neuro.finance_yookassa_confirmations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON neuro.finance_yookassa_confirmations FROM anon, authenticated;
GRANT ALL ON neuro.finance_yookassa_confirmations TO service_role;

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

  SELECT confirmation.* INTO v_existing
  FROM neuro.finance_yookassa_confirmations AS confirmation
  WHERE confirmation.external_event_id = p_external_event_id
  FOR UPDATE;
  IF FOUND THEN
    IF v_existing.payment_id <> p_payment_id
      OR v_existing.amount_kopecks <> p_amount_kopecks
      OR v_existing.currency <> v_currency
      OR v_existing.event <> p_event
      OR v_existing.status <> 'succeeded' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'YooKassa confirmation idempotency payload conflicts';
    END IF;
    SELECT COALESCE(SUM(allocation.amount_kopecks), 0)::bigint INTO v_reserve
    FROM neuro.finance_allocations AS allocation
    WHERE allocation.external_payment_id = p_payment_id
      AND allocation.category = 'api_reserve'
      AND allocation.currency = v_currency;
    SELECT COUNT(*)::bigint INTO v_topup_count
    FROM neuro.provider_topup_requests AS topup
    WHERE topup.allocation_key IN (
      SELECT allocation.allocation_key
      FROM neuro.finance_allocations AS allocation
      WHERE allocation.external_payment_id = p_payment_id
        AND allocation.category = 'api_reserve'
    );
    RETURN QUERY SELECT
      v_existing.id, true, v_existing.payment_id,
      (SELECT payment.amount_kopecks::bigint FROM neuro.payments AS payment WHERE payment.payment_id = p_payment_id),
      v_reserve, v_topup_count, v_existing.status;
    RETURN;
  END IF;

  SELECT payment.* INTO v_payment
  FROM neuro.payments AS payment
  WHERE payment.payment_id = p_payment_id
  FOR UPDATE;
  IF NOT FOUND
    OR v_payment.status <> 'succeeded'
    OR v_payment.currency <> v_currency
    OR v_payment.amount_kopecks::bigint <> p_amount_kopecks THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'YooKassa payment is not a successful matching payment';
  END IF;

  SELECT COALESCE(SUM(allocation.amount_kopecks), 0)::bigint INTO v_reserve
  FROM neuro.finance_allocations AS allocation
  WHERE allocation.external_payment_id = p_payment_id
    AND allocation.category = 'api_reserve'
    AND allocation.currency = v_currency;
  IF v_reserve <= 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'payment has no provider reserve';
  END IF;

  INSERT INTO neuro.finance_yookassa_confirmations (
    external_event_id, payment_id, amount_kopecks, currency, event,
    status, source, metadata, confirmed_at
  ) VALUES (
    p_external_event_id, p_payment_id, p_amount_kopecks, v_currency, p_event,
    'succeeded', 'yookassa', p_metadata, p_confirmed_at
  )
  RETURNING id INTO v_confirmation_id;

  UPDATE neuro.provider_topup_requests AS topup
  SET status = CASE WHEN topup.status = 'manual' THEN 'queued' ELSE topup.status END,
    metadata = topup.metadata || jsonb_build_object(
      'funding_source', 'yookassa',
      'confirmation_event', p_event,
      'confirmation_status', 'posted',
      'confirmation_event_id', p_external_event_id,
      'confirmed_amount_kopecks', p_amount_kopecks,
      'confirmed_at', p_confirmed_at
    ),
    updated_at = now()
  WHERE topup.allocation_key IN (
    SELECT allocation.allocation_key
    FROM neuro.finance_allocations AS allocation
    WHERE allocation.external_payment_id = p_payment_id
      AND allocation.category = 'api_reserve'
  );

  GET DIAGNOSTICS v_topup_count = ROW_COUNT;
  RETURN QUERY SELECT
    v_confirmation_id, false, p_payment_id, v_payment.amount_kopecks::bigint,
    v_reserve, v_topup_count, 'succeeded'::text;
END;
$$;

REVOKE ALL ON FUNCTION neuro.record_yookassa_payment_confirmation(
  text, text, bigint, text, text, timestamptz, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.record_yookassa_payment_confirmation(
  text, text, bigint, text, text, timestamptz, jsonb
) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
