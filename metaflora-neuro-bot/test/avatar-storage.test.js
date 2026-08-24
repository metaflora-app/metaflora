import test from 'node:test';
import assert from 'node:assert/strict';

import { createAvatarStorage } from '../src/avatar-storage.js';

test('avatar storage is disabled without both private Supabase credentials', () => {
  assert.equal(createAvatarStorage({ storageUrl: '', serviceRoleKey: '' }), null);
  assert.equal(createAvatarStorage({
    storageUrl: 'https://project.supabase.co',
    serviceRoleKey: ''
  }), null);
});

test('avatar storage uploads only validated images to a private bucket path', async () => {
  const calls = [];
  const storage = createAvatarStorage({
    storageUrl: 'https://project.supabase.co',
    serviceRoleKey: 'service-role-key'
  }, {
    createSupabaseClient(url, key, options) {
      calls.push({ url, key, options });
      return {
        storage: {
          from(bucket) {
            calls.push({ bucket });
            return {
              async upload(path, data, uploadOptions) {
                calls.push({ path, data, uploadOptions });
                return { data: { path }, error: null };
              }
            };
          }
        }
      };
    }
  });

  const result = await storage.upload({
    bucket: 'neuro-user-avatars',
    path: '123/unique.jpg',
    data: Buffer.from([1, 2, 3]),
    contentType: 'image/jpeg'
  });

  assert.deepEqual(result, { path: '123/unique.jpg' });
  assert.equal(calls[0].url, 'https://project.supabase.co');
  assert.equal(calls[0].key, 'service-role-key');
  assert.equal(calls[0].options.auth.persistSession, false);
  assert.deepEqual(calls[1], { bucket: 'neuro-user-avatars' });
  assert.deepEqual(calls[2].uploadOptions, {
    contentType: 'image/jpeg',
    upsert: true,
    cacheControl: '86400'
  });
  await assert.rejects(
    storage.upload({
      bucket: 'neuro-user-avatars',
      path: '../secret',
      data: Buffer.from([1]),
      contentType: 'image/jpeg'
    }),
    /storage path/
  );
});
