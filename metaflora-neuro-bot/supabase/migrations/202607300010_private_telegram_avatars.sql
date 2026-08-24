BEGIN;

ALTER TABLE neuro.users
  ADD COLUMN IF NOT EXISTS avatar_file_id text,
  ADD COLUMN IF NOT EXISTS avatar_file_unique_id text,
  ADD COLUMN IF NOT EXISTS avatar_storage_path text,
  ADD COLUMN IF NOT EXISTS avatar_updated_at timestamptz;

ALTER TABLE neuro.users
  DROP CONSTRAINT IF EXISTS users_avatar_file_id_safe,
  DROP CONSTRAINT IF EXISTS users_avatar_file_unique_id_safe,
  DROP CONSTRAINT IF EXISTS users_avatar_storage_path_safe;

ALTER TABLE neuro.users
  ADD CONSTRAINT users_avatar_file_id_safe
    CHECK (
      avatar_file_id IS NULL
      OR avatar_file_id ~ '^[A-Za-z0-9_-]{1,512}$'
    ),
  ADD CONSTRAINT users_avatar_file_unique_id_safe
    CHECK (
      avatar_file_unique_id IS NULL
      OR avatar_file_unique_id ~ '^[A-Za-z0-9_-]{1,512}$'
    ),
  ADD CONSTRAINT users_avatar_storage_path_safe
    CHECK (
      avatar_storage_path IS NULL
      OR avatar_storage_path ~ '^[1-9][0-9]{0,19}/[A-Za-z0-9_-]{1,512}\.(jpg|png|webp)$'
    );

CREATE INDEX IF NOT EXISTS users_avatar_unique_id_idx
  ON neuro.users(avatar_file_unique_id)
  WHERE avatar_file_unique_id IS NOT NULL;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'neuro-user-avatars',
  'neuro-user-avatars',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMIT;
