BEGIN;

ALTER TABLE neuro.payments
  ADD COLUMN IF NOT EXISTS receipt_phone text;

ALTER TABLE neuro.payments
  DROP CONSTRAINT IF EXISTS payments_receipt_phone_format_check;

ALTER TABLE neuro.payments
  ADD CONSTRAINT payments_receipt_phone_format_check
  CHECK (
    receipt_phone IS NULL
    OR (
      length(receipt_phone) BETWEEN 11 AND 16
      AND receipt_phone ~ '^\+[1-9][0-9]{9,14}$'
    )
  );

COMMENT ON COLUMN neuro.payments.receipt_phone IS
  'Normalized E.164 customer phone used for a fiscal receipt.';

COMMIT;
