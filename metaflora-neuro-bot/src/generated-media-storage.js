import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const tokenPattern = /^[A-Za-z0-9_-]{32}$/u;
const shortCodePattern = /^[A-Za-z0-9_-]{8}$/u;
const mimePattern = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/u;
const defaultMaxBytes = 100 * 1024 * 1024;
const defaultTimeoutMs = 60_000;
const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'application/pdf',
  'application/zip',
  'application/octet-stream',
  'model/gltf-binary'
]);

const extensionByMimeType = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'model/gltf-binary': 'glb',
  'application/octet-stream': 'bin'
});

function positiveInteger(value, fallback, label) {
  const result = value ?? fallback;
  if (!Number.isSafeInteger(result) || result <= 0) {
    throw new TypeError(`${label} must be a positive integer.`);
  }
  return result;
}

function normalizedMimeType(value) {
  const result = String(value ?? '').split(';', 1)[0].trim().toLowerCase();
  if (!mimePattern.test(result) || !allowedMimeTypes.has(result)) {
    throw new TypeError('Generated media MIME type is not allowed.');
  }
  return result;
}

function validatedSize(value, maxBytes) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError('Generated media size is invalid.');
  }
  if (value > maxBytes) throw new RangeError('Generated media exceeds the storage limit.');
  return value;
}

function validatedPublicBaseUrl(value) {
  let url;
  try {
    url = new URL(String(value ?? ''));
  } catch {
    throw new TypeError('A valid HTTPS public base URL is required for generated media.');
  }
  if (
    url.protocol !== 'https:'
    || url.username
    || url.password
    || url.search
    || url.hash
    || /(?:^|\.)supabase\.co$/iu.test(url.hostname)
  ) {
    throw new TypeError('A valid HTTPS public base URL is required for generated media.');
  }
  return url.toString().replace(/\/+$/u, '');
}

function validatedFileName(value, mimeType) {
  const fileName = String(value ?? '').trim();
  if (fileName && !/^[^/\\\u0000-\u001f]{1,255}$/u.test(fileName)) {
    throw new TypeError('Generated media file name is invalid.');
  }
  return fileName || `metaflora-generation.${extensionByMimeType[mimeType] ?? 'bin'}`;
}

function mediaBuffer(source) {
  if (Buffer.isBuffer(source)) return source;
  if (source instanceof ArrayBuffer) return Buffer.from(source);
  if (ArrayBuffer.isView(source)) {
    return Buffer.from(source.buffer, source.byteOffset, source.byteLength);
  }
  return null;
}

function remoteUrl(source) {
  let url;
  try {
    url = new URL(String(source ?? ''));
  } catch {
    throw new TypeError('Generated media source URL is invalid.');
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new TypeError('Generated media source URL must use credential-free HTTPS.');
  }
  return url;
}

async function readRemoteBody(response, maxBytes) {
  if (!response.body?.getReader) {
    const data = Buffer.from(await response.arrayBuffer());
    validatedSize(data.byteLength, maxBytes);
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
      validatedSize(size, maxBytes);
      chunks.push(Buffer.from(value));
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }
  return Buffer.concat(chunks, size);
}

async function sourceBytes(source, { declaredMimeType, declaredSize, fetchImpl, maxBytes, timeoutMs }) {
  const direct = mediaBuffer(source);
  if (direct) {
    const mimeType = normalizedMimeType(declaredMimeType);
    validatedSize(direct.byteLength, maxBytes);
    if (declaredSize !== undefined && direct.byteLength !== validatedSize(declaredSize, maxBytes)) {
      throw new TypeError('Generated media size does not match its declaration.');
    }
    return Object.freeze({ data: direct, mimeType });
  }

  if (typeof Blob !== 'undefined' && source instanceof Blob) {
    const mimeType = normalizedMimeType(declaredMimeType || source.type);
    const data = Buffer.from(await source.arrayBuffer());
    validatedSize(data.byteLength, maxBytes);
    if (declaredSize !== undefined && data.byteLength !== validatedSize(declaredSize, maxBytes)) {
      throw new TypeError('Generated media size does not match its declaration.');
    }
    return Object.freeze({ data, mimeType });
  }

  const url = remoteUrl(source);
  let response;
  try {
    response = await fetchImpl(url.toString(), {
      method: 'GET',
      redirect: 'error',
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    throw new Error('Generated media source download failed.');
  }
  if (!response.ok) throw new Error(`Generated media source returned HTTP ${response.status}.`);
  if (response.url) remoteUrl(response.url);

  const contentLength = response.headers.get('content-length');
  if (contentLength !== null) {
    if (!/^\d+$/u.test(contentLength)) throw new TypeError('Generated media source size is invalid.');
    validatedSize(Number(contentLength), maxBytes);
  }
  const responseMimeType = normalizedMimeType(response.headers.get('content-type'));
  const mimeType = declaredMimeType
    ? normalizedMimeType(declaredMimeType)
    : responseMimeType;
  if (declaredMimeType && mimeType !== responseMimeType) {
    throw new TypeError('Generated media MIME type does not match its declaration.');
  }
  const data = await readRemoteBody(response, maxBytes);
  if (contentLength !== null && data.byteLength !== Number(contentLength)) {
    throw new TypeError('Generated media source size does not match its response headers.');
  }
  if (declaredSize !== undefined && data.byteLength !== validatedSize(declaredSize, maxBytes)) {
    throw new TypeError('Generated media size does not match its declaration.');
  }
  return Object.freeze({ data, mimeType });
}

function validatedToken(value) {
  const token = String(value ?? '');
  if (!tokenPattern.test(token)) throw new TypeError('Generated media token is invalid.');
  return token;
}

function validatedShortCode(value) {
  const shortCode = String(value ?? '');
  if (!shortCodePattern.test(shortCode)) throw new TypeError('Generated media short code is invalid.');
  return shortCode;
}

function tokenForFile() {
  return randomBytes(24).toString('base64url');
}

function shortCodeForFile() {
  return randomBytes(6).toString('base64url').slice(0, 8);
}

async function reserveShortCode(rootPath, token) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const shortCode = shortCodeForFile();
    try {
      await writeFile(
        join(rootPath, `${shortCode}.link`),
        JSON.stringify({ token }),
        { mode: 0o640, flag: 'wx' }
      );
      return shortCode;
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
    }
  }
  throw new Error('Could not allocate a generated media short code.');
}

function notFound(error) {
  return error?.code === 'ENOENT';
}

export function createGeneratedMediaStorage({
  rootPath,
  publicBaseUrl,
  shortBaseUrl = publicBaseUrl,
  fetchImpl = fetch,
  maxBytes = defaultMaxBytes,
  timeoutMs = defaultTimeoutMs
} = {}) {
  if (typeof rootPath !== 'string' || !rootPath.trim()) {
    throw new TypeError('Generated media storage path is required.');
  }
  const resolvedRootPath = resolve(rootPath);
  if (resolvedRootPath === resolve('/')) {
    throw new TypeError('Generated media storage path is too broad.');
  }
  if (typeof fetchImpl !== 'function') throw new TypeError('Generated media fetcher is required.');
  const limit = positiveInteger(maxBytes, defaultMaxBytes, 'Generated media max bytes');
  const timeout = positiveInteger(timeoutMs, defaultTimeoutMs, 'Generated media timeout');
  const baseUrl = validatedPublicBaseUrl(publicBaseUrl);
  const shortBase = validatedPublicBaseUrl(shortBaseUrl);

  async function readStored(value) {
    const token = validatedToken(value);
    let metadata;
    try {
      metadata = JSON.parse(await readFile(join(resolvedRootPath, `${token}.json`), 'utf8'));
    } catch (error) {
      if (notFound(error)) return null;
      throw error;
    }
    const contentType = normalizedMimeType(metadata?.contentType);
    const size = validatedSize(metadata?.size, limit);
    const fileName = validatedFileName(metadata?.fileName, contentType);
    let data;
    try {
      data = await readFile(join(resolvedRootPath, `${token}.data`));
    } catch (error) {
      if (notFound(error)) return null;
      throw error;
    }
    if (data.byteLength !== size) throw new Error('Generated media manifest is inconsistent.');
    return Object.freeze({ data, contentType, size, fileName, token });
  }

  return Object.freeze({
    async persist({ source, mimeType, size, fileName } = {}) {
      const resolved = await sourceBytes(source, {
        declaredMimeType: mimeType,
        declaredSize: size,
        fetchImpl,
        maxBytes: limit,
        timeoutMs: timeout
      });
      const token = tokenForFile();
      const dataPath = join(resolvedRootPath, `${token}.data`);
      const manifestPath = join(resolvedRootPath, `${token}.json`);
      const dataTempPath = join(resolvedRootPath, `.${token}.data.tmp`);
      const manifestTempPath = join(resolvedRootPath, `.${token}.json.tmp`);
      const metadata = Object.freeze({
        contentType: resolved.mimeType,
        size: resolved.data.byteLength,
        fileName: validatedFileName(fileName, resolved.mimeType),
        createdAt: new Date().toISOString()
      });

      await mkdir(resolvedRootPath, { recursive: true, mode: 0o750 });
      await writeFile(dataTempPath, resolved.data, { mode: 0o640 });
      await rename(dataTempPath, dataPath);
      await writeFile(manifestTempPath, JSON.stringify(metadata), { mode: 0o640 });
      await rename(manifestTempPath, manifestPath);
      const shortCode = await reserveShortCode(resolvedRootPath, token);

      return Object.freeze({
        token,
        url: `${baseUrl}/media/${token}`,
        shortCode,
        shortUrl: `${shortBase}/f/${shortCode}`,
        data: resolved.data,
        mimeType: resolved.mimeType,
        contentType: resolved.mimeType,
        size: resolved.data.byteLength,
        fileName: metadata.fileName
      });
    },

    read: readStored,

    async readShort(value) {
      const shortCode = validatedShortCode(value);
      let link;
      try {
        link = JSON.parse(await readFile(join(resolvedRootPath, `${shortCode}.link`), 'utf8'));
      } catch (error) {
        if (notFound(error)) return null;
        throw error;
      }
      return readStored(link?.token);
    }
  });
}
