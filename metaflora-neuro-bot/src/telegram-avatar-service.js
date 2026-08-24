const avatarBucket = 'neuro-user-avatars';
const avatarMaxBytes = 5 * 1024 * 1024;
const avatarMimeTypes = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);
const defaultRefreshMs = 24 * 60 * 60 * 1000;

function telegramUserId(value) {
  const id = String(value ?? '');
  if (!/^[1-9]\d{0,19}$/u.test(id)) throw new TypeError('Invalid Telegram user id.');
  return id;
}

function telegramFileId(value, { optional = false } = {}) {
  if (optional && (value === null || value === undefined || value === '')) return null;
  const fileId = String(value ?? '');
  if (!/^[A-Za-z0-9_-]{1,512}$/u.test(fileId)) {
    throw new TypeError('Invalid Telegram avatar file id.');
  }
  return fileId;
}

function extensionForMimeType(mimeType) {
  const extensions = Object.freeze({
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  });
  const extension = extensions[mimeType];
  if (!extension) throw new TypeError('Unsupported Telegram avatar MIME type.');
  return extension;
}

function largestPhoto(photos) {
  if (!Array.isArray(photos) || photos.length === 0) return null;
  return photos.reduce((largest, photo) => {
    const area = Number(photo?.width ?? 0) * Number(photo?.height ?? 0);
    const largestArea = Number(largest?.width ?? 0) * Number(largest?.height ?? 0);
    return area > largestArea ? photo : largest;
  }, photos[0]);
}

function frozenResult(value) {
  return Object.freeze(value);
}

export function createTelegramAvatarService({
  telegram,
  repository,
  storage = null,
  onError = () => {},
  now = () => new Date(),
  refreshMs = defaultRefreshMs
}) {
  if (!telegram?.getUserProfilePhotos) throw new TypeError('Telegram client is required.');
  if (!repository?.updateUserAvatarReference) {
    throw new TypeError('Avatar repository is required.');
  }
  if (!Number.isSafeInteger(refreshMs) || refreshMs < 0) {
    throw new TypeError('Avatar refresh interval is invalid.');
  }
  let attempts = new Map();

  const record = async (event) => {
    try {
      await repository.recordEvent?.(event);
    } catch {
      // Avatar observability must never interrupt the bot update path.
    }
  };

  const reportFailure = async (id, eventName, errorCode) => {
    await record({
      eventName,
      category: 'telegram',
      telegramUserId: id,
      metadata: { errorCode }
    });
    onError(new Error('Telegram avatar sync failed.'), {
      action: 'telegram.avatar.sync',
      telegramUserId: id,
      errorCode
    });
  };

  return Object.freeze({
    async sync(actor, { force = false } = {}) {
      let id;
      try {
        id = telegramUserId(actor?.id);
      } catch (error) {
        onError(new Error('Telegram avatar sync rejected invalid input.'), {
          action: 'telegram.avatar.sync',
          errorCode: 'invalid_telegram_user'
        });
        return frozenResult({ status: 'failed' });
      }

      const timestamp = now().getTime();
      const lastAttempt = attempts.get(id);
      if (!force && lastAttempt !== undefined && timestamp - lastAttempt < refreshMs) {
        return frozenResult({ status: 'throttled' });
      }
      attempts = new Map(attempts).set(id, timestamp);

      try {
        const catalog = await telegram.getUserProfilePhotos(id, {
          limit: 1,
          timeoutMs: 5_000
        });
        const photo = largestPhoto(catalog?.photos?.[0]);
        if (!photo) {
          await repository.updateUserAvatarReference({
            telegramUserId: id,
            fileId: null,
            fileUniqueId: null,
            storagePath: null
          });
          return frozenResult({ status: 'no_photo' });
        }

        const fileId = telegramFileId(photo.fileId);
        const fileUniqueId = telegramFileId(photo.fileUniqueId);
        await repository.updateUserAvatarReference({
          telegramUserId: id,
          fileId,
          fileUniqueId,
          storagePath: null
        });

        if (!storage?.upload) {
          return frozenResult({
            status: 'reference_only',
            storagePath: null,
            fileUniqueId
          });
        }

        try {
          const file = await telegram.getFile(fileId, {
            maxBytes: avatarMaxBytes,
            timeoutMs: 5_000
          });
          const downloaded = await telegram.downloadFile(file, {
            allowedMimeTypes: [...avatarMimeTypes],
            maxBytes: avatarMaxBytes,
            timeoutMs: 10_000
          });
          const storagePath = `${id}/${fileUniqueId}.${extensionForMimeType(downloaded.mimeType)}`;
          await storage.upload({
            bucket: avatarBucket,
            path: storagePath,
            data: downloaded.data,
            contentType: downloaded.mimeType
          });
          await repository.updateUserAvatarReference({
            telegramUserId: id,
            fileId,
            fileUniqueId,
            storagePath
          });
          await record({
            eventName: 'telegram.avatar.synced',
            category: 'telegram',
            telegramUserId: id,
            metadata: {
              storageBucket: avatarBucket,
              sizeBytes: downloaded.size
            }
          });
          return frozenResult({ status: 'stored', storagePath, fileUniqueId });
        } catch {
          await reportFailure(
            id,
            'telegram.avatar.storage_failed',
            'telegram_avatar_storage_failed'
          );
          return frozenResult({
            status: 'reference_only',
            storagePath: null,
            fileUniqueId
          });
        }
      } catch {
        await reportFailure(id, 'telegram.avatar.sync_failed', 'telegram_avatar_sync_failed');
        return frozenResult({ status: 'failed' });
      }
    }
  });
}
