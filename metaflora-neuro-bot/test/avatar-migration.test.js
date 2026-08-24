import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  new URL('../supabase/migrations/202607300010_private_telegram_avatars.sql', import.meta.url),
  'utf8'
);

test('Telegram avatar migration adds safe references and a private storage bucket', () => {
  assert.match(migration, /ADD COLUMN IF NOT EXISTS avatar_file_id text/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS avatar_file_unique_id text/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS avatar_storage_path text/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS avatar_updated_at timestamptz/);
  assert.match(migration, /'neuro-user-avatars'/);
  assert.match(migration, /public,\s*file_size_limit,\s*allowed_mime_types/);
  assert.match(migration, /false,\s*5242880/);
  assert.match(migration, /image\/jpeg/);
  assert.match(migration, /image\/png/);
  assert.match(migration, /image\/webp/);
  assert.doesNotMatch(migration, /CREATE POLICY[\s\S]+anon/i);
});
