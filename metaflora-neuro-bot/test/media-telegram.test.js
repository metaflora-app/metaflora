import test from 'node:test';
import assert from 'node:assert/strict';

import { TelegramClient } from '../src/telegram.js';

function telegramResponse(result = { message_id: 1 }) {
  return {
    ok: true,
    async json() {
      return { ok: true, result };
    }
  };
}

test('Telegram downloads a remote GLB, validates it, and uploads it as multipart', async () => {
  const requests = [];
  const telegram = new TelegramClient('token', async (url, options = {}) => {
    requests.push({ url, options });
    if (url === 'https://media.example.test/model.glb') {
      return new Response(new Uint8Array([0x67, 0x6c, 0x54, 0x46]), {
        headers: {
          'content-type': 'model/gltf-binary',
          'content-length': '4'
        }
      });
    }
    return telegramResponse();
  });

  await telegram.sendDocument(10, 'https://media.example.test/model.glb', {
    mimeType: 'model/gltf-binary',
    size: 4,
    fileName: 'model.glb',
    caption: '3D model'
  });

  assert.equal(requests.length, 2);
  assert.equal(requests[0].options.method, 'GET');
  assert.equal(requests[0].options.redirect, 'error');
  assert.match(requests[1].url, /\/sendDocument$/u);
  assert.equal(requests[1].options.body instanceof FormData, true);
  assert.equal(requests[1].options.body.get('document').type, 'model/gltf-binary');
  assert.equal(requests[1].options.body.get('document').name, 'model.glb');
});

test('Telegram reuses a cached photo file id without uploading multipart data', async () => {
  const requests = [];
  const telegram = new TelegramClient('token', async (url, options = {}) => {
    requests.push({ url, options });
    return telegramResponse();
  });

  await telegram.sendPhoto(10, 'AgAC-cached-file-id', {
    mimeType: 'image/jpeg',
    size: 4,
    caption: 'меню'
  });

  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /\/sendPhoto$/u);
  assert.equal(requests[0].options.body instanceof FormData, false);
  assert.equal(JSON.parse(requests[0].options.body).photo, 'AgAC-cached-file-id');
});

test('Telegram rejects a remote response with a mismatched MIME before upload', async () => {
  let telegramRequests = 0;
  const telegram = new TelegramClient('token', async (url) => {
    if (url.startsWith('https://api.telegram.org/')) telegramRequests += 1;
    return new Response('not an image', {
      headers: {
        'content-type': 'text/html',
        'content-length': '12'
      }
    });
  });

  await assert.rejects(
    telegram.sendPhoto(10, 'https://media.example.test/image.jpg', {
      mimeType: 'image/jpeg',
      size: 12
    }),
    /MIME type is not allowed|does not match/u
  );
  assert.equal(telegramRequests, 0);
});

test('Telegram enforces declared and actual size limits while downloading remote media', async () => {
  const oversizedHeader = new TelegramClient('token', async () => new Response('tiny', {
    headers: {
      'content-type': 'video/mp4',
      'content-length': String(51 * 1024 * 1024)
    }
  }));
  await assert.rejects(
    oversizedHeader.sendVideo(10, 'https://media.example.test/video.mp4', {
      mimeType: 'video/mp4'
    }),
    /exceeds/u
  );

  const oversizedBody = new TelegramClient('token', async () => new Response(
    new Uint8Array(11),
    { headers: { 'content-type': 'application/octet-stream' } }
  ));
  await assert.rejects(
    oversizedBody.sendDocument(10, 'https://media.example.test/file.bin', {
      mimeType: 'application/octet-stream',
      maxBytes: 10
    }),
    /exceeds/u
  );
});
