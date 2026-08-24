import test from 'node:test';
import assert from 'node:assert/strict';

import { TelegramClient } from '../src/telegram.js';

function recordingFetch(requests) {
  return async (url, options) => {
    requests.push({ url, payload: JSON.parse(options.body) });
    return {
      ok: true,
      async json() { return { ok: true, result: { message_id: 1 } }; }
    };
  };
}

test('Telegram polling subscribes only to active non-payment update types', async () => {
  const requests = [];
  const telegram = new TelegramClient('test-token', recordingFetch(requests));

  await telegram.getUpdates(42);

  assert.deepEqual(requests[0].payload.allowed_updates, ['message', 'callback_query']);
});

test('Telegram client forwards disabled link previews when sending and editing', async () => {
  const requests = [];
  const telegram = new TelegramClient('test-token', recordingFetch(requests));
  const message = {
    text: 'ссылка без карточки',
    link_preview_options: { is_disabled: true }
  };

  await telegram.sendMessage(10, message);
  await telegram.editMessageText(10, 20, message);

  assert.deepEqual(requests.map(({ payload }) => payload.link_preview_options), [
    { is_disabled: true },
    { is_disabled: true }
  ]);
});

function invalidEntityThenSuccessFetch(requests, failuresPerMethod = 1) {
  let failures = 0;
  return async (url, options) => {
    requests.push({ url, payload: JSON.parse(options.body) });
    if (failures < failuresPerMethod) {
      failures += 1;
      return {
        ok: false,
        async json() {
          return { ok: false, description: 'Bad Request: ENTITY_TEXT_INVALID' };
        }
      };
    }
    return {
      ok: true,
      async json() { return { ok: true, result: { message_id: 2 } }; }
    };
  };
}

test('Telegram client retries send and edit without custom emoji after invalid entity', async () => {
  const requests = [];
  const telegram = new TelegramClient('test-token', invalidEntityThenSuccessFetch(requests, 1));
  const message = {
    text: '<tg-emoji emoji-id="invalid-id">🪙</tg-emoji> <b>текст</b>',
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[{
        text: 'модель',
        callback_data: 'model:test',
        icon_custom_emoji_id: 'invalid-id'
      }]]
    }
  };

  await telegram.sendMessage(10, message);

  assert.equal(requests.length, 2);
  assert.equal(requests[1].payload.text, '🪙 <b>текст</b>');
  assert.equal(
    requests[1].payload.reply_markup.inline_keyboard[0][0].icon_custom_emoji_id,
    'invalid-id'
  );
});

test('Telegram client removes button icons only when text-only fallback is also rejected', async () => {
  const requests = [];
  const telegram = new TelegramClient('test-token', invalidEntityThenSuccessFetch(requests, 2));
  const message = {
    text: '<tg-emoji emoji-id="invalid-id">🪙</tg-emoji> <b>текст</b>',
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[{
        text: 'модель',
        callback_data: 'model:test',
        icon_custom_emoji_id: 'invalid-id'
      }]]
    }
  };

  await telegram.sendMessage(10, message);

  assert.equal(requests.length, 3);
  assert.equal(requests[1].payload.text, '🪙 <b>текст</b>');
  assert.equal(
    requests[1].payload.reply_markup.inline_keyboard[0][0].icon_custom_emoji_id,
    'invalid-id'
  );
  assert.equal(
    requests[2].payload.reply_markup.inline_keyboard[0][0].icon_custom_emoji_id,
    undefined
  );
});

test('Telegram client does not retry unrelated API errors', async () => {
  let calls = 0;
  const telegram = new TelegramClient('test-token', async () => {
    calls += 1;
    return {
      ok: false,
      async json() {
        return { ok: false, description: 'Bad Request: message is too long' };
      }
    };
  });

  await assert.rejects(
    telegram.sendMessage(10, { text: 'текст' }),
    /message is too long/
  );
  assert.equal(calls, 1);
});

test('Telegram client gets and downloads a validated file without exposing the bot token', async () => {
  const token = 'secret-bot-token';
  const requests = [];
  const telegram = new TelegramClient(token, async (url, options) => {
    requests.push({ url, options });
    if (url.includes('/getFile')) {
      return {
        ok: true,
        async json() {
          return {
            ok: true,
            result: { file_id: 'file-1', file_path: 'photos/file-1.jpg', file_size: 4 }
          };
        }
      };
    }
    return new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), {
      headers: {
        'content-type': 'image/jpeg',
        'content-length': '4'
      }
    });
  });

  const file = await telegram.getFile('file-1', { maxBytes: 10 });
  const downloaded = await telegram.downloadFile(file, {
    allowedMimeTypes: ['image/jpeg'],
    maxBytes: 10
  });

  assert.equal(downloaded.mimeType, 'image/jpeg');
  assert.equal(downloaded.size, 4);
  assert.deepEqual([...downloaded.data], [0xff, 0xd8, 0xff, 0xd9]);
  assert.equal(requests[0].options.signal instanceof AbortSignal, true);
  assert.equal(requests[1].options.signal instanceof AbortSignal, true);
  assert.match(requests[1].url, /\/file\/botsecret-bot-token\/photos\/file-1\.jpg$/);

  const failing = new TelegramClient(token, async () => {
    throw new Error(`request failed for ${token}`);
  });
  await assert.rejects(
    failing.downloadFile(file, { allowedMimeTypes: ['image/jpeg'] }),
    (error) => !error.message.includes(token) && /download network failure/i.test(error.message)
  );
});

test('Telegram client validates and normalizes profile photos', async () => {
  const requests = [];
  const telegram = new TelegramClient('test-token', async (url, options) => {
    requests.push({ url, payload: JSON.parse(options.body) });
    return {
      ok: true,
      async json() {
        return {
          ok: true,
          result: {
            total_count: 1,
            photos: [[
              {
                file_id: 'profile_file',
                file_unique_id: 'profile_unique',
                width: 320,
                height: 320,
                file_size: 42
              }
            ]]
          }
        };
      }
    };
  });

  const result = await telegram.getUserProfilePhotos('123', { limit: 1, timeoutMs: 5_000 });

  assert.deepEqual(requests[0].payload, { user_id: '123', offset: 0, limit: 1 });
  assert.deepEqual(result, {
    totalCount: 1,
    photos: [[{
      fileId: 'profile_file',
      fileUniqueId: 'profile_unique',
      width: 320,
      height: 320,
      fileSize: 42
    }]]
  });
  await assert.rejects(
    telegram.getUserProfilePhotos('not-an-id'),
    /Telegram user id/
  );
});

test('Telegram client rejects oversized files and unapproved MIME types', async () => {
  const oversized = new TelegramClient('token', async () => ({
    ok: true,
    async json() {
      return {
        ok: true,
        result: { file_id: 'file-1', file_path: 'video/file.mp4', file_size: 11 }
      };
    }
  }));
  await assert.rejects(
    oversized.getFile('file-1', { maxBytes: 10 }),
    /exceeds the 10 byte limit/
  );

  const wrongMime = new TelegramClient('token', async () => new Response('script', {
    headers: { 'content-type': 'text/html', 'content-length': '6' }
  }));
  await assert.rejects(
    wrongMime.downloadFile(
      { file_path: 'documents/file.bin', file_size: 6 },
      { allowedMimeTypes: ['application/pdf'], maxBytes: 10 }
    ),
    /MIME type is not allowed/
  );

  const mismatchedSize = new TelegramClient('token', async () => new Response('1234', {
    headers: { 'content-type': 'application/pdf', 'content-length': '4' }
  }));
  await assert.rejects(
    mismatchedSize.downloadFile(
      { file_path: 'documents/file.pdf', file_size: 5 },
      { allowedMimeTypes: ['application/pdf'], maxBytes: 10 }
    ),
    /does not match Telegram metadata/
  );
});

test('Telegram media methods download remote media and use multipart for validated uploads', async () => {
  const requests = [];
  const telegram = new TelegramClient('token', async (url, options) => {
    requests.push({ url, options });
    if (url === 'https://cdn.example.test/image.jpg') {
      return new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), {
        headers: {
          'content-type': 'image/jpeg',
          'content-length': '4'
        }
      });
    }
    return {
      ok: true,
      async json() { return { ok: true, result: { message_id: requests.length } }; }
    };
  });

  await telegram.sendPhoto(10, 'https://cdn.example.test/image.jpg', {
    mimeType: 'image/jpeg',
    size: 4,
    caption: 'photo'
  });
  await telegram.sendVideo(10, new Blob(['video'], { type: 'video/mp4' }), {
    fileName: 'clip.mp4',
    caption: 'video'
  });
  await telegram.sendAudio(10, 'telegram-file-id', {
    mimeType: 'audio/mpeg',
    size: 100
  });
  await telegram.sendDocument(10, new Blob(['document'], { type: 'application/pdf' }), {
    fileName: 'guide.pdf'
  });

  assert.equal(requests[0].options.method, 'GET');
  assert.equal(requests[0].options.redirect, 'error');
  assert.equal(requests[1].options.body instanceof FormData, true);
  assert.equal(requests[1].options.body.get('photo').type, 'image/jpeg');
  assert.equal(requests[1].options.body.get('photo').name, 'image.jpg');
  assert.equal(requests[2].options.body instanceof FormData, true);
  assert.equal(requests[2].options.body.get('video').name, 'clip.mp4');
  assert.equal(requests[3].url.endsWith('/sendAudio'), true);
  assert.equal(requests[4].options.body.get('document').type, 'application/pdf');
});

test('Telegram sendDocument applies a declared MIME type to an untyped Blob', async () => {
  let uploadedDocument;
  const telegram = new TelegramClient('token', async (url, options) => {
    uploadedDocument = options.body.get('document');
    return {
      ok: true,
      async json() { return { ok: true, result: { message_id: 1 } }; }
    };
  });

  await telegram.sendDocument(10, new Blob(['document']), {
    mimeType: 'application/pdf',
    fileName: 'guide.pdf'
  });

  assert.equal(uploadedDocument.type, 'application/pdf');
  assert.equal(uploadedDocument.name, 'guide.pdf');
});

test('Telegram media methods reject invalid MIME and size before making a request', async () => {
  let calls = 0;
  const telegram = new TelegramClient('token', async () => {
    calls += 1;
    throw new Error('must not be called');
  });

  await assert.rejects(
    telegram.sendPhoto(10, new Blob(['bad'], { type: 'text/html' })),
    /MIME type is not allowed/
  );
  await assert.rejects(
    telegram.sendVideo(10, 'https://cdn.example.test/video.mp4', {
      mimeType: 'video/mp4',
      size: 51 * 1024 * 1024
    }),
    /exceeds/
  );
  assert.equal(calls, 0);
});

test('Telegram client records every API call without exposing the bot token', async () => {
  const started = [];
  const completed = [];
  const token = 'private-bot-token';
  const telegram = new TelegramClient(token, async () => new Response(JSON.stringify({
    ok: true,
    result: { message_id: 77 }
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  }), {
    auditRepository: {
      async startTelegramApiCall(value) {
        started.push(value);
        return 'call-id';
      },
      async completeTelegramApiCall(value) {
        completed.push(value);
      }
    }
  });

  await telegram.sendMessage(10, { text: 'готово' });

  assert.equal(started[0].method, 'sendMessage');
  assert.equal(started[0].telegramChatId, 10);
  assert.equal(JSON.stringify(started).includes(token), false);
  assert.equal(completed[0].status, 'succeeded');
  assert.equal(completed[0].responsePayload.result.message_id, 77);
});

test('Telegram multipart audit keeps the chat correlation for generated media', async () => {
  const started = [];
  const telegram = new TelegramClient('private-bot-token', async () => new Response(JSON.stringify({
    ok: true,
    result: { message_id: 78 }
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  }), {
    auditRepository: {
      async startTelegramApiCall(value) {
        started.push(value);
        return 'multipart-call-id';
      },
      async completeTelegramApiCall() {}
    }
  });

  await telegram.sendPhoto(10, new Blob(['image'], { type: 'image/jpeg' }), {
    fileName: 'result.jpg'
  });

  assert.equal(started[0].method, 'sendPhoto');
  assert.equal(started[0].telegramChatId, '10');
  assert.equal(started[0].telegramMessageId, null);
  assert.equal(JSON.stringify(started).includes('private-bot-token'), false);
});
