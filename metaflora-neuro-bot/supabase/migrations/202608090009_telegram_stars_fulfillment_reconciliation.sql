BEGIN;

-- A successful Telegram update can be interrupted after the durable payment
-- row is stored but before the purchased entitlement reaches every ledger.
-- Returning the original provider payload makes replay validation identical
-- to the live successful_payment path; all downstream writes are idempotent.
CREATE OR REPLACE FUNCTION neuro.list_pending_telegram_stars_fulfillments(
  p_limit integer DEFAULT 25
)
RETURNS TABLE (
  payment_id text,
  telegram_user_id bigint,
  provider_payload jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100 THEN
    RAISE EXCEPTION USING ERRCODE = '22023',
      MESSAGE = 'invalid Telegram Stars reconciliation limit';
  END IF;

  RETURN QUERY
  SELECT
    payment.payment_id,
    app_user.telegram_user_id,
    payment.provider_payload
  FROM neuro.payments AS payment
  JOIN neuro.users AS app_user ON app_user.id = payment.user_id
  WHERE payment.provider = 'telegram_stars'
    AND payment.currency = 'XTR'
    AND payment.status = 'succeeded'
    AND (
      (
        payment.product_type = 'metacoins'
        AND NOT EXISTS (
          SELECT 1
          FROM neuro.metacoin_ledger AS ledger
          WHERE ledger.idempotency_key = 'package:' || payment.payment_id
        )
      )
      OR
      (
        payment.product_type = 'subscription'
        AND NOT EXISTS (
          SELECT 1
          FROM neuro.subscriptions AS subscription
          WHERE subscription.source_payment_id = payment.id
        )
      )
    )
  ORDER BY COALESCE(payment.paid_at, payment.created_at), payment.id
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION neuro.list_pending_telegram_stars_fulfillments(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION neuro.list_pending_telegram_stars_fulfillments(integer)
  TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
