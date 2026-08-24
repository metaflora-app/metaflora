import test from 'node:test';
import assert from 'node:assert/strict';

import { createTelegramAvatarService } from '../src/telegram-avatar-service.js';

function repositoryDouble() {
  const references = [];
  const events = [];
  return {
    references,
    events,
    async updateUserAvatarReference(value) {
      references.push(value);
      return true;
    },
    async recordEvent(value) {
      events.push(value);
      return 'event-id';
    }
  };
}

test('avatar sync stores a Telegram photo in a private bucket without tokenized URLs', async () => {
  const repository = repositoryDouble();
  const uploads = [];
  const telegram = {
    async getUserProfilePhotos(userId, options) {
      assert.equal(userId, '123');
      assert.deepEqual(options, { limit: 1, timeoutMs: 5_000 });
      return {
        totalCount: 1,
        photos: [[
          { fileId: 'small_file', fileUniqueId: 'unique_small', width: 80, height: 80, fileSize: 100 },
          { fileId: 'large_file', fileUniqueId: 'unique_large', width: 320, height: 320, fileSize: 4 }
        ]]
      };
    },
    async getFile(fileId, options) {
      assert.equal(fileId, 'large_file');
      assert.deepEqual(options, { maxBytes: 5_242_880, timeoutMs: 5_000 });
      return { fileId, filePath: 'photos/avatar.jpg', fileSize: 4 };
    },
    async downloadFile(file, options) {
      assert.equal(file.filePath, 'photos/avatar.jpg');
      assert.deepEqual(options, {
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxBytes: 5_242_880,
        timeoutMs: 10_000
      });
      return {
        data: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
        mimeType: 'image/jpeg',
        size: 4,
        fileName: 'avatar.jpg'
      };
    }
  };
  const storage = {
    async upload({ bucket, path, data, contentType }) {
      uploads.push({ bucket, path, data, contentType });
      return { path };
    }
  };
  const service = createTelegramAvatarService({ telegram, repository, storage });

  const result = await service.sync({ id: 123 }, { force: true });

  assert.deepEqual(result, {
    status: 'stored',
    storagePath: '123/unique_large.jpg',
    fileUniqueId: 'unique_large'
  });
  assert.equal(uploads.length, 1);
  assert.equal(uploads[0].bucket, 'neuro-user-avatars');
  assert.equal(uploads[0].path, '123/unique_large.jpg');
  assert.equal(uploads[0].contentType, 'image/jpeg');
  assert.equal(repository.references.length, 2);
  assert.deepEqual(repository.references[0], {
    telegramUserId: '123',
    fileId: 'large_file',
    fileUniqueId: 'unique_large',
    storagePath: null
  });
  assert.deepEqual(repository.references[1], {
    telegramUserId: '123',
    fileId: 'large_file',
    fileUniqueId: 'unique_large',
    storagePath: '123/unique_large.jpg'
  });
  const serialized = JSON.stringify({ uploads, references: repository.references, events: repository.events });
  assert.doesNotMatch(serialized, /bot[A-Za-z0-9:_-]+\/|api\.telegram\.org\/file/i);
});

test('avatar sync preserves safe Telegram references when storage is unavailable', async () => {
  const repository = repositoryDouble();
  const telegram = {
    async getUserProfilePhotos() {
      return {
        totalCount: 1,
        photos: [[{
          fileId: 'file_id',
          fileUniqueId: 'file_unique_id',
          width: 160,
          height: 160,
          fileSize: 100
        }]]
      };
    }
  };
  const service = createTelegramAvatarService({ telegram, repository });

  const result = await service.sync({ id: '123' }, { force: true });

  assert.deepEqual(result, {
    status: 'reference_only',
    storagePath: null,
    fileUniqueId: 'file_unique_id'
  });
  assert.deepEqual(repository.references, [{
    telegramUserId: '123',
    fileId: 'file_id',
    fileUniqueId: 'file_unique_id',
    storagePath: null
  }]);
});

test('avatar sync is throttled and failures stay non-fatal with sanitized audit data', async () => {
  const repository = repositoryDouble();
  const errors = [];
  let calls = 0;
  const service = createTelegramAvatarService({
    telegram: {
      async getUserProfilePhotos() {
        calls += 1;
        throw new Error('request failed for bot-secret-token');
      }
    },
    repository,
    onError(error, context) {
      errors.push({ error, context });
    },
    now: () => new Date('2026-07-30T00:00:00.000Z')
  });

  const failed = await service.sync({ id: 123 });
  const throttled = await service.sync({ id: 123 });

  assert.deepEqual(failed, { status: 'failed' });
  assert.deepEqual(throttled, { status: 'throttled' });
  assert.equal(calls, 1);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].context.action, 'telegram.avatar.sync');
  assert.equal(repository.events[0].eventName, 'telegram.avatar.sync_failed');
  assert.deepEqual(repository.events[0].metadata, { errorCode: 'telegram_avatar_sync_failed' });
  assert.doesNotMatch(JSON.stringify(repository.events), /secret|token/i);
});

test('avatar sync clears stale references when Telegram reports no profile photo', async () => {
  const repository = repositoryDouble();
  const service = createTelegramAvatarService({
    telegram: {
      async getUserProfilePhotos() {
        return { totalCount: 0, photos: [] };
      }
    },
    repository
  });

  const result = await service.sync({ id: 123 }, { force: true });

  assert.deepEqual(result, { status: 'no_photo' });
  assert.deepEqual(repository.references, [{
    telegramUserId: '123',
    fileId: null,
    fileUniqueId: null,
    storagePath: null
  }]);
});
