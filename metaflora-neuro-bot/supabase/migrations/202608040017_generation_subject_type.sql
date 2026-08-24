ALTER TABLE neuro.generations
  ADD COLUMN IF NOT EXISTS subject_type text;

ALTER TABLE neuro.generations
  DROP CONSTRAINT IF EXISTS generations_subject_type_check;

ALTER TABLE neuro.generations
  ADD CONSTRAINT generations_subject_type_check
  CHECK (subject_type IS NULL OR subject_type IN ('model', 'tool', 'agent'));

UPDATE neuro.generations AS g
SET subject_type = events.subject_type
FROM (
  SELECT DISTINCT ON (request_key)
    request_key,
    subject_type
  FROM neuro.product_events
  WHERE event_name = 'generation.started'
    AND subject_type IN ('model', 'tool', 'agent')
    AND request_key IS NOT NULL
  ORDER BY request_key, occurred_at DESC
) AS events
WHERE g.request_key = events.request_key
  AND g.subject_type IS NULL;

UPDATE neuro.generations
SET subject_type = CASE
  WHEN kind = 'agent' THEN 'agent'
  WHEN kind IN ('image', 'video') THEN 'model'
  WHEN kind = 'tool' THEN 'tool'
  ELSE NULL
END
WHERE subject_type IS NULL;

CREATE INDEX IF NOT EXISTS generations_user_subject_recent_idx
  ON neuro.generations(user_id, subject_type, created_at DESC);
