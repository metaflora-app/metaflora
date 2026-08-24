BEGIN;

ALTER TABLE neuro.payments
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'unknown';

DO $$
BEGIN
  ALTER TABLE neuro.payments
    ADD CONSTRAINT payments_payment_method_check
    CHECK (payment_method IN ('card', 'sbp', 'telegram_stars', 'unknown'));
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

CREATE INDEX IF NOT EXISTS payments_payment_method_idx
  ON neuro.payments(payment_method, created_at DESC);

COMMENT ON COLUMN neuro.payments.payment_method IS
  'Normalized method used to settle the payment: Russian card, SBP, Telegram Stars, or unknown.';

NOTIFY pgrst, 'reload schema';

COMMIT;
