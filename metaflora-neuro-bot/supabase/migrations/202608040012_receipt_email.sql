BEGIN;

ALTER TABLE neuro.users
  ADD COLUMN IF NOT EXISTS receipt_email text;

ALTER TABLE neuro.users
  DROP CONSTRAINT IF EXISTS users_receipt_email_format;

ALTER TABLE neuro.users
  ADD CONSTRAINT users_receipt_email_format
  CHECK (
    receipt_email IS NULL
    OR (
      char_length(receipt_email) BETWEEN 3 AND 254
      AND receipt_email = lower(receipt_email)
      AND receipt_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )
  );

COMMENT ON COLUMN neuro.users.receipt_email IS
  'Customer email saved after explicit consent for YooKassa fiscal receipts.';

NOTIFY pgrst, 'reload schema';

COMMIT;
