import { createClient } from '@supabase/supabase-js';

function storagePath(value) {
  const path = String(value ?? '');
  if (
    path.length < 1
    || path.length > 512
    || path.startsWith('/')
    || path.split('/').some((segment) => !segment || segment === '.' || segment === '..')
    || /[\\?#\u0000-\u001f]/u.test(path)
  ) {
    throw new TypeError('Invalid avatar storage path.');
  }
  return path;
}

function bucketName(value) {
  const bucket = String(value ?? '');
  if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/u.test(bucket)) {
    throw new TypeError('Invalid avatar storage bucket.');
  }
  return bucket;
}

function mimeType(value) {
  const type = String(value ?? '').toLowerCase();
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
    throw new TypeError('Invalid avatar MIME type.');
  }
  return type;
}

export function createAvatarStorage(config, {
  createSupabaseClient = createClient
} = {}) {
  if (!config?.storageUrl || !config?.serviceRoleKey) return null;
  const client = createSupabaseClient(config.storageUrl, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
  return Object.freeze({
    async upload({ bucket, path, data, contentType }) {
      const result = await client.storage
        .from(bucketName(bucket))
        .upload(storagePath(path), data, {
          contentType: mimeType(contentType),
          upsert: true,
          cacheControl: '86400'
        });
      if (result.error) throw result.error;
      return Object.freeze({ path: String(result.data?.path ?? storagePath(path)) });
    }
  });
}
