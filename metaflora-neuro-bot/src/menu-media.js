import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const MAX_TELEGRAM_PHOTO_BYTES = 10 * 1024 * 1024;

export const MENU_MEDIA_FILES = Object.freeze({
  menu: 'main-menu.jpg',
  profile: 'profile.jpg',
  balance: 'balance.jpg',
  support: 'support.jpg',
  invite: 'invite.jpg',
  founder: 'founder.jpg',
  llm: 'llm.jpg',
  image: 'image.jpg',
  video: 'video.jpg',
  music: 'music.jpg',
  voice: 'voice.jpg',
  beta: 'beta.jpg',
  tools: 'tools.jpg',
  agents: 'agents.jpg',
  entertainment: 'entertainment.jpg'
});

export const MENU_MEDIA_KEYS = Object.freeze(Object.keys(MENU_MEDIA_FILES));

function mediaEntry(fileName, data) {
  if (!Buffer.isBuffer(data) || data.byteLength === 0) {
    throw new TypeError(`Menu media file ${fileName} is empty.`);
  }
  if (data.byteLength > MAX_TELEGRAM_PHOTO_BYTES) {
    throw new RangeError(`Menu media file ${fileName} exceeds Telegram's photo limit.`);
  }
  return Object.freeze({
    data,
    mimeType: 'image/jpeg',
    size: data.byteLength,
    fileName
  });
}

export async function loadMenuMedia({ rootPath = resolve(process.cwd(), 'assets', 'menu-media') } = {}) {
  const entries = await Promise.all(
    Object.entries(MENU_MEDIA_FILES).map(async ([key, fileName]) => [
      key,
      mediaEntry(fileName, await readFile(join(rootPath, fileName)))
    ])
  );
  return Object.freeze(Object.fromEntries(entries));
}

export function markMenuMedia(message, mediaKey) {
  if (!message || typeof message !== 'object' || !MENU_MEDIA_FILES[mediaKey]) return message;
  return Object.freeze({ ...message, menuMediaKey: mediaKey });
}
