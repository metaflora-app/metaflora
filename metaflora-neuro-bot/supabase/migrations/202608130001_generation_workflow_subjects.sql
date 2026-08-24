ALTER TABLE neuro.generations
  DROP CONSTRAINT IF EXISTS generations_subject_type_check;

ALTER TABLE neuro.generations
  ADD CONSTRAINT generations_subject_type_check
  CHECK (
    subject_type IS NULL
    OR subject_type IN ('model', 'tool', 'agent', 'entertainment', 'music')
  );

CREATE INDEX IF NOT EXISTS generations_user_subject_recent_idx
  ON neuro.generations(user_id, subject_type, created_at DESC);
