BEGIN;

ALTER TABLE neuro.payments
  ADD COLUMN IF NOT EXISTS receipt_email text,
  ADD COLUMN IF NOT EXISTS receipt_registration text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS receipt_sent_at timestamptz;

UPDATE neuro.payments
SET receipt_registration = 'unknown'
WHERE receipt_registration IS NULL;

DO $$
BEGIN
  ALTER TABLE neuro.payments
    ADD CONSTRAINT payments_receipt_email_format_check
    CHECK (
      receipt_email IS NULL
      OR (
        length(receipt_email) <= 254
        AND receipt_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE neuro.payments
    ADD CONSTRAINT payments_receipt_registration_check
    CHECK (receipt_registration IN ('pending', 'succeeded', 'canceled', 'failed', 'unknown'));
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

CREATE INDEX IF NOT EXISTS payments_receipt_status_idx
  ON neuro.payments(receipt_registration, receipt_sent_at DESC);

COMMENT ON COLUMN neuro.payments.receipt_email IS
  'E-mail used for the fiscal receipt for this payment.';
COMMENT ON COLUMN neuro.payments.receipt_registration IS
  'YooKassa receipt_registration status for this payment.';

NOTIFY pgrst, 'reload schema';

COMMIT;
