import { randomUUID } from 'node:crypto';

import { informalizeText } from './tone.js';

const telegramBaseUrl = 'https://api.telegram.org';
const invalidEntityPattern = /ENTITY_TEXT_INVALID/u;
const customEmojiTagPattern = /<tg-emoji\b[^>]*>(.*?)<\/tg-emoji>/gu;
const defaultDownloadLimit = 20 * 1024 * 1024;
const mediaRules = Object.freeze({
  photo: Object.freeze({
    maxBytes: 10 * 1024 * 1024,
    mimeTypes: Object.freeze(['image/jpeg', 'image/png', 'image/webp'])
  }),
  video: Object.freeze({
    maxBytes: 50 * 1024 * 1024,
    mimeTypes: Object.freeze(['video/mp4', 'video/quicktime', 'video/webm'])
  }),
  audio: Object.freeze({
    maxBytes: 50 * 1024 * 1024,
    mimeTypes: Object.freeze([
      'audio/mpeg',
      'audio/mp4',
      'audio/ogg',
      'audio/wav',
      'audio/x-wav'
    ])
  }),
  document: Object.freeze({
    maxBytes: 50 * 1024 * 1024,
    mimeTypes: null
  })
});

function positiveByteLimit(value, fallback) {
  const limit = value ?? fallback;
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new TypeError('File size limit must be a positive integer.');
  }
  return limit;
}

function normalizedMimeType(value) {
  const mimeType = String(value ?? '').split(';', 1)[0].trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/u.test(mimeType)) {
    throw new TypeError('File MIME type is invalid.');
  }
  return mimeType;
}

function validateMimeType(value, allowedMimeTypes) {
  const mimeType = normalizedMimeType(value);
  if (allowedMimeTypes) {
    const allowed = allowedMimeTypes.map(normalizedMimeType);
    if (!allowed.includes(mimeType)) throw new TypeError('File MIME type is not allowed.');
  }
  return mimeType;
}

function validateSize(value, maxBytes) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError('File size is invalid.');
  if (value > maxBytes) throw new RangeError(`File exceeds the ${maxBytes} byte limit.`);
  return value;
}

function safeFilePath(value) {
  const path = String(value ?? '');
  const segments = path.split('/');
  if (
    path.length === 0
    || path.length > 1024
    || path.startsWith('/')
    || segments.some((segment) => !segment || segment === '.' || segment === '..')
    || /[\\?#\u0000-\u001f]/u.test(path)
  ) {
    throw new TypeError('Telegram returned an invalid file path.');
  }
  return segments.map(encodeURIComponent).join('/');
}

function safeFileId(value) {
  const fileId = String(value ?? '');
  if (!/^[A-Za-z0-9_-]{1,512}$/u.test(fileId)) throw new TypeError('Invalid Telegram file id.');
  return fileId;
}

function safeTelegramUserId(value) {
  const id = String(value ?? '');
  if (!/^[1-9]\d{0,19}$/u.test(id)) throw new TypeError('Invalid Telegram user id.');
  return id;
}

function safePhotoDimension(value) {
  const dimension = Number(value);
  if (!Number.isSafeInteger(dimension) || dimension < 1 || dimension > 20_000) {
    throw new TypeError('Invalid Telegram photo dimension.');
  }
  return dimension;
}

function normalizedProfilePhoto(photo) {
  const fileSize = photo?.file_size === undefined
    ? null
    : validateSize(photo.file_size, defaultDownloadLimit);
  return Object.freeze({
    fileId: safeFileId(photo?.file_id),
    fileUniqueId: safeFileId(photo?.file_unique_id),
    width: safePhotoDimension(photo?.width),
    height: safePhotoDimension(photo?.height),
    fileSize
  });
}

function mediaBlob(source, mimeType) {
  if (source instanceof Blob) return source;
  if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
    return new Blob([source], { type: mimeType });
  }
  return null;
}

function remoteMediaUrl(source) {
  if (typeof source !== 'string') return null;
  let url;
  try {
    url = new URL(source);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new TypeError('Telegram remote media URL must be credential-free HTTPS.');
  }
  return url;
}

function safeFileName(value) {
  const fileName = String(value ?? '');
  if (!/^[^/\\\u0000-\u001f]{1,255}$/u.test(fileName)) {
    throw new TypeError('File name is invalid.');
  }
  return fileName;
}

function extensionForMimeType(mimeType) {
  const extensions = {
    'image/jpeg': 'jpg',
    'audio/mpeg': 'mp3',
    'model/gltf-binary': 'glb',
    'application/octet-stream': 'bin'
  };
  return extensions[mimeType] ?? mimeType.split('/')[1];
}

function inferredRemoteFileName(url, mimeType) {
  let candidate = url.pathname.split('/').at(-1) ?? '';
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    throw new TypeError('Remote media file name is invalid.');
  }
  if (candidate) return safeFileName(candidate);
  return `upload.${extensionForMimeType(mimeType)}`;
}

async function readLimitedBody(response, limit) {
  if (!response.body?.getReader) {
    const data = Buffer.from(await response.arrayBuffer());
    validateSize(data.byteLength, limit);
    return data;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      validateSize(size, limit);
      chunks.push(Buffer.from(value));
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }
  return Buffer.concat(chunks, size);
}

function publicMediaOptions(options) {
  const {
    mimeType,
    size,
    fileName,
    maxBytes,
    timeoutMs,
    ...payload
  } = options;
  return payload;
}

function stripCustomEmoji(value) {
  if (Array.isArray(value)) return value.map(stripCustomEmoji);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'icon_custom_emoji_id')
      .map(([key, item]) => [key, stripCustomEmoji(item)])
  );
}

function withoutTextCustomEmoji(payload) {
  return {
    ...payload,
    ...(typeof payload.text === 'string'
      ? { text: payload.text.replace(customEmojiTagPattern, '$1') }
      : {}),
    ...(typeof payload.caption === 'string'
      ? { caption: payload.caption.replace(customEmojiTagPattern, '$1') }
      : {})
  };
}

function withoutCustomEmoji(payload) {
  return {
    ...withoutTextCustomEmoji(payload),
    reply_markup: stripCustomEmoji(payload.reply_markup)
  };
}

function multipartAuditPayload(formData) {
  const chatId = formData.get?.('chat_id');
  const messageId = formData.get?.('message_id');
  return {
    ...(typeof chatId === 'string' || typeof chatId === 'number' ? { chat_id: chatId } : {}),
    ...(typeof messageId === 'string' || typeof messageId === 'number' ? { message_id: messageId } : {}),
    bodyType: 'multipart',
    fields: [...formData.entries()].map(([name, value]) => ({
      name,
      ...(typeof value === 'string'
        ? { value: value.slice(0, 10_000) }
        : { fileName: value.name || null, mimeType: value.type || null, byteLength: value.size })
    }))
  };
}

export class TelegramClient {
  constructor(token, fetchImpl = fetch, { auditRepository = null, onAuditError = () => {} } = {}) {
    if (typeof token !== 'string' || token.length === 0 || token.length > 512 || /[\u0000-\u001f]/u.test(token)) {
      throw new TypeError('Invalid Telegram bot token.');
    }
    this.token = token;
    this.fetchImpl = fetchImpl;
    this.auditRepository = auditRepository;
    this.onAuditError = onAuditError;
    this.shutdownController = new AbortController();
  }

  close() {
    this.shutdownController.abort();
  }

  async startApiAudit(method, payload) {
    if (!this.auditRepository?.startTelegramApiCall) return null;
    try {
      return await this.auditRepository.startTelegramApiCall({
        requestKey: `telegram:${randomUUID()}`,
        method,
        telegramChatId: payload?.chat_id ?? null,
        telegramMessageId: payload?.message_id ?? null,
        requestPayload: payload ?? {}
      });
    } catch (error) {
      this.onAuditError(error, { action: 'history.telegram_api.start', method });
      return null;
    }
  }

  async completeApiAudit(callId, value) {
    if (!callId || !this.auditRepository?.completeTelegramApiCall) return;
    try {
      await this.auditRepository.completeTelegramApiCall({ callId, ...value });
    } catch (error) {
      this.onAuditError(error, { action: 'history.telegram_api.complete' });
    }
  }

  async request(method, payload = {}, timeoutMs = 15_000) {
    const started = performance.now();
    const auditCallId = await this.startApiAudit(method, payload);
    let response;
    try {
      response = await this.fetchImpl(`${telegramBaseUrl}/bot${this.token}/${method}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.any([
          AbortSignal.timeout(timeoutMs),
          this.shutdownController.signal
        ])
      });
    } catch (error) {
      await this.completeApiAudit(auditCallId, {
        status: error?.name === 'TimeoutError' ? 'cancelled' : 'failed',
        errorMessage: error?.message ?? 'network failure',
        durationMs: Math.round(performance.now() - started)
      });
      throw new Error(`Telegram ${method} network failure.`);
    }

    let body;
    try {
      body = await response.json();
    } catch {
      await this.completeApiAudit(auditCallId, {
        status: 'failed',
        httpStatus: response.status,
        errorMessage: 'invalid JSON response',
        durationMs: Math.round(performance.now() - started)
      });
      throw new Error(`Telegram ${method} returned an invalid response.`);
    }
    if (!response.ok || !body.ok) {
      const description = typeof body.description === 'string'
        ? `: ${body.description.replaceAll(this.token, '[redacted]')}`
        : '';
      await this.completeApiAudit(auditCallId, {
        status: 'failed',
        httpStatus: response.status,
        telegramErrorCode: Number.isInteger(body.error_code) ? body.error_code : null,
        errorMessage: typeof body.description === 'string' ? body.description : null,
        responsePayload: body,
        durationMs: Math.round(performance.now() - started)
      });
      throw new Error(`Telegram ${method} failed${description}.`);
    }
    await this.completeApiAudit(auditCallId, {
      status: 'succeeded',
      httpStatus: response.status,
      responsePayload: { result: body.result },
      durationMs: Math.round(performance.now() - started)
    });
    return body.result;
  }

  async requestMultipart(method, formData, timeoutMs = 60_000) {
    const started = performance.now();
    const auditCallId = await this.startApiAudit(method, multipartAuditPayload(formData));
    let response;
    try {
      response = await this.fetchImpl(`${telegramBaseUrl}/bot${this.token}/${method}`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.any([
          AbortSignal.timeout(timeoutMs),
          this.shutdownController.signal
        ])
      });
    } catch (error) {
      await this.completeApiAudit(auditCallId, {
        status: error?.name === 'TimeoutError' ? 'cancelled' : 'failed',
        errorMessage: error?.message ?? 'network failure',
        durationMs: Math.round(performance.now() - started)
      });
      throw new Error(`Telegram ${method} network failure.`);
    }

    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.ok) {
      const description = typeof body?.description === 'string'
        ? `: ${body.description.replaceAll(this.token, '[redacted]')}`
        : '';
      await this.completeApiAudit(auditCallId, {
        status: 'failed',
        httpStatus: response.status,
        telegramErrorCode: Number.isInteger(body?.error_code) ? body.error_code : null,
        errorMessage: typeof body?.description === 'string' ? body.description : 'invalid response',
        responsePayload: body ?? {},
        durationMs: Math.round(performance.now() - started)
      });
      throw new Error(`Telegram ${method} failed${description}.`);
    }
    await this.completeApiAudit(auditCallId, {
      status: 'succeeded',
      httpStatus: response.status,
      responsePayload: { result: body.result },
      durationMs: Math.round(performance.now() - started)
    });
    return body.result;
  }

  async requestWithCustomEmojiFallback(method, payload) {
    try {
      return await this.request(method, payload);
    } catch (error) {
      if (!invalidEntityPattern.test(error.message)) throw error;
    }

    try {
      return await this.request(method, withoutTextCustomEmoji(payload));
    } catch (error) {
      if (!invalidEntityPattern.test(error.message)) throw error;
      return this.request(method, withoutCustomEmoji(payload));
    }
  }

  sendMessage(chatId, message) {
    return this.requestWithCustomEmojiFallback('sendMessage', {
      chat_id: chatId,
      text: informalizeText(message.text),
      reply_markup: message.reply_markup,
      parse_mode: message.parse_mode,
      link_preview_options: message.link_preview_options
    });
  }

  editMessageText(chatId, messageId, message) {
    return this.requestWithCustomEmojiFallback('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: informalizeText(message.text),
      reply_markup: message.reply_markup,
      parse_mode: message.parse_mode,
      link_preview_options: message.link_preview_options
    });
  }

  editMessageCaption(chatId, messageId, message) {
    return this.requestWithCustomEmojiFallback('editMessageCaption', {
      chat_id: chatId,
      message_id: messageId,
      caption: informalizeText(message.caption),
      reply_markup: message.reply_markup,
      parse_mode: message.parse_mode
    });
  }

  deleteMessage(chatId, messageId) {
    return this.request('deleteMessage', { chat_id: chatId, message_id: messageId });
  }

  getUpdates(offset) {
    return this.request(
      'getUpdates',
      { offset, timeout: 25, allowed_updates: ['message', 'callback_query'] },
      40_000
    );
  }

  answerCallbackQuery(callbackQueryId) {
    return this.request('answerCallbackQuery', { callback_query_id: callbackQueryId });
  }

  setMyCommands(commands) {
    return this.request('setMyCommands', { commands });
  }

  async getFile(fileId, { maxBytes = defaultDownloadLimit, timeoutMs = 15_000 } = {}) {
    const limit = positiveByteLimit(maxBytes, defaultDownloadLimit);
    const file = await this.request('getFile', { file_id: safeFileId(fileId) }, timeoutMs);
    const fileSize = file?.file_size === undefined
      ? null
      : validateSize(file.file_size, limit);
    return Object.freeze({
      fileId: safeFileId(file.file_id ?? fileId),
      filePath: safeFilePath(file.file_path),
      fileSize
    });
  }

  async getUserProfilePhotos(
    userId,
    { offset = 0, limit = 1, timeoutMs = 5_000 } = {}
  ) {
    if (!Number.isSafeInteger(offset) || offset < 0) {
      throw new TypeError('Invalid Telegram profile photo offset.');
    }
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw new TypeError('Invalid Telegram profile photo limit.');
    }
    const result = await this.request('getUserProfilePhotos', {
      user_id: safeTelegramUserId(userId),
      offset,
      limit
    }, timeoutMs);
    const totalCount = Number(result?.total_count ?? 0);
    if (!Number.isSafeInteger(totalCount) || totalCount < 0) {
      throw new TypeError('Invalid Telegram profile photo count.');
    }
    const photos = Array.isArray(result?.photos)
      ? result.photos.map((sizes) => {
          if (!Array.isArray(sizes)) throw new TypeError('Invalid Telegram profile photo.');
          return Object.freeze(sizes.map(normalizedProfilePhoto));
        })
      : [];
    return Object.freeze({
      totalCount,
      photos: Object.freeze(photos)
    });
  }

  async downloadFile(
    file,
    {
      allowedMimeTypes,
      maxBytes = defaultDownloadLimit,
      timeoutMs = 60_000
    } = {}
  ) {
    if (!Array.isArray(allowedMimeTypes) || allowedMimeTypes.length === 0) {
      throw new TypeError('At least one allowed MIME type is required.');
    }
    const limit = positiveByteLimit(maxBytes, defaultDownloadLimit);
    const filePath = safeFilePath(file?.filePath ?? file?.file_path);
    const declaredSize = file?.fileSize ?? file?.file_size;
    if (declaredSize !== undefined) validateSize(declaredSize, limit);

    let response;
    try {
      response = await this.fetchImpl(
        `${telegramBaseUrl}/file/bot${this.token}/${filePath}`,
        {
          method: 'GET',
          signal: AbortSignal.any([
            AbortSignal.timeout(timeoutMs),
            this.shutdownController.signal
          ])
        }
      );
    } catch {
      throw new Error('Telegram file download network failure.');
    }
    if (!response.ok) throw new Error(`Telegram file download failed with HTTP ${response.status}.`);

    const contentLength = response.headers.get('content-length');
    if (contentLength !== null && !/^\d+$/u.test(contentLength)) {
      throw new Error('Telegram file download returned an invalid size.');
    }
    if (contentLength !== null) validateSize(Number(contentLength), limit);
    const mimeType = validateMimeType(response.headers.get('content-type'), allowedMimeTypes);

    let data;
    try {
      data = Buffer.from(await response.arrayBuffer());
    } catch {
      throw new Error('Telegram file download returned an invalid response.');
    }
    validateSize(data.byteLength, limit);
    if (contentLength !== null && data.byteLength !== Number(contentLength)) {
      throw new Error('Telegram file download size does not match its response headers.');
    }
    if (declaredSize !== undefined && data.byteLength !== declaredSize) {
      throw new Error('Telegram file download size does not match Telegram metadata.');
    }
    return Object.freeze({
      data,
      mimeType,
      size: data.byteLength,
      fileName: filePath.split('/').at(-1)
    });
  }

  sendPhoto(chatId, source, options = {}) {
    return this.sendMedia('photo', chatId, source, options);
  }

  sendVideo(chatId, source, options = {}) {
    return this.sendMedia('video', chatId, source, options);
  }

  sendAudio(chatId, source, options = {}) {
    return this.sendMedia('audio', chatId, source, options);
  }

  sendDocument(chatId, source, options = {}) {
    return this.sendMedia('document', chatId, source, options);
  }

  async downloadRemoteMedia(url, rule, { mimeType, size, maxBytes, timeoutMs }) {
    const declaredMimeType = mimeType === undefined
      ? null
      : validateMimeType(mimeType, rule.mimeTypes);
    const declaredSize = size === undefined ? null : validateSize(size, maxBytes);

    let response;
    try {
      response = await this.fetchImpl(url.toString(), {
        method: 'GET',
        redirect: 'error',
        signal: AbortSignal.any([
          AbortSignal.timeout(timeoutMs),
          this.shutdownController.signal
        ])
      });
    } catch {
      throw new Error('Remote media download network failure.');
    }
    if (!response.ok) {
      throw new Error(`Remote media download failed with HTTP ${response.status}.`);
    }
    if (response.url) remoteMediaUrl(response.url);

    const contentLength = response.headers.get('content-length');
    if (contentLength !== null && !/^\d+$/u.test(contentLength)) {
      throw new Error('Remote media download returned an invalid size.');
    }
    if (contentLength !== null) validateSize(Number(contentLength), maxBytes);
    const actualMimeType = validateMimeType(
      response.headers.get('content-type'),
      rule.mimeTypes
    );
    if (declaredMimeType && actualMimeType !== declaredMimeType) {
      throw new TypeError('Remote media MIME type does not match its declaration.');
    }

    let data;
    try {
      data = await readLimitedBody(response, maxBytes);
    } catch (error) {
      if (error instanceof RangeError) throw error;
      throw new Error('Remote media download returned an invalid response.');
    }
    if (contentLength !== null && data.byteLength !== Number(contentLength)) {
      throw new Error('Remote media download size does not match its response headers.');
    }
    if (declaredSize !== null && data.byteLength !== declaredSize) {
      throw new Error('Remote media download size does not match its declaration.');
    }
    return {
      blob: new Blob([data], { type: actualMimeType }),
      mimeType: actualMimeType
    };
  }

  async sendMedia(kind, chatId, source, options) {
    const preparedOptions = options;
    const rule = mediaRules[kind];
    const limit = positiveByteLimit(preparedOptions.maxBytes, rule.maxBytes);
    if (limit > rule.maxBytes) throw new RangeError(`File exceeds the ${rule.maxBytes} byte limit.`);

    let blob = mediaBlob(source, preparedOptions.mimeType);
    let remoteUrl = null;
    if (!blob) remoteUrl = remoteMediaUrl(source);
    let mimeType;
    let inferredFileName;
    if (remoteUrl) {
      const downloaded = await this.downloadRemoteMedia(remoteUrl, rule, {
        ...preparedOptions,
        maxBytes: limit,
        timeoutMs: preparedOptions.timeoutMs ?? 60_000
      });
      blob = downloaded.blob;
      mimeType = downloaded.mimeType;
      inferredFileName = inferredRemoteFileName(remoteUrl, mimeType);
    } else {
      mimeType = validateMimeType(blob?.type || preparedOptions.mimeType, rule.mimeTypes);
      if (blob && !blob.type) blob = new Blob([blob], { type: mimeType });
      const size = blob ? blob.size : validateSize(preparedOptions.size, limit);
      validateSize(size, limit);
    }
    const payload = { chat_id: chatId, ...publicMediaOptions(preparedOptions) };
    const timeoutMs = preparedOptions.timeoutMs ?? 60_000;

    if (blob) {
      const formData = new FormData();
      for (const [key, value] of Object.entries(payload)) {
        if (value === undefined) continue;
        formData.set(
          key,
          typeof value === 'object' ? JSON.stringify(value) : String(value)
        );
      }
      const fileName = safeFileName(
        preparedOptions.fileName ?? inferredFileName ?? `upload.${extensionForMimeType(mimeType)}`
      );
      formData.set(kind, blob, fileName);
      return this.requestMultipart(`send${kind[0].toUpperCase()}${kind.slice(1)}`, formData, timeoutMs);
    }

    const media = String(source ?? '').trim();
    if (!media || media.length > 4096) throw new TypeError('Telegram media reference is invalid.');
    return this.request(
      `send${kind[0].toUpperCase()}${kind.slice(1)}`,
      { ...payload, [kind]: media },
      timeoutMs
    );
  }
}
