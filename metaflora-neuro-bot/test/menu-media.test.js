import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  MENU_MEDIA_FILES,
  MENU_MEDIA_KEYS,
  loadMenuMedia,
  markMenuMedia
} from '../src/menu-media.js';

test('menu media manifest contains the approved screens including entertainment', () => {
  assert.deepEqual(MENU_MEDIA_KEYS, [
    'menu', 'profile', 'balance', 'support', 'invite', 'founder',
    'llm', 'image', 'video', 'music', 'voice', 'beta', 'tools', 'agents', 'entertainment'
  ]);
  assert.equal(new Set(Object.values(MENU_MEDIA_FILES)).size, 15);
  assert.ok(Object.values(MENU_MEDIA_FILES).every((fileName) => fileName.endsWith('.jpg')));
});

test('menu media loader returns Telegram-ready photo payloads', async () => {
  const rootPath = await mkdtemp(join(tmpdir(), 'metaflora-menu-media-'));
  try {
    await Promise.all(Object.values(MENU_MEDIA_FILES).map((fileName) => (
      writeFile(join(rootPath, fileName), Buffer.from(fileName))
    )));
    const loaded = await loadMenuMedia({ rootPath });
    assert.deepEqual(Object.keys(loaded), MENU_MEDIA_KEYS);
    for (const key of MENU_MEDIA_KEYS) {
      assert.equal(loaded[key].mimeType, 'image/jpeg');
      assert.equal(loaded[key].size, Buffer.byteLength(MENU_MEDIA_FILES[key]));
      assert.deepEqual(loaded[key].data, Buffer.from(MENU_MEDIA_FILES[key]));
    }
  } finally {
    await rm(rootPath, { recursive: true, force: true });
  }
});

test('marking a screen keeps the Telegram message text and adds only an internal media key', () => {
  const message = Object.freeze({ text: '<b>экран</b>', parse_mode: 'HTML' });
  const marked = markMenuMedia(message, 'profile');
  assert.equal(marked.text, message.text);
  assert.equal(marked.menuMediaKey, 'profile');
  assert.equal(markMenuMedia(message, 'unknown'), message);
});
