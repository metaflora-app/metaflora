import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createGeneratedMediaStorage } from '../src/generated-media-storage.js';

function responseFor(data, { contentType = 'image/png', url = 'https://provider.example/result.png' } = {}) {
  const body = Buffer.from(data);
  return {
    ok: true,
    status: 200,
    url,
    headers: new Headers({
      'content-type': contentType,
      'content-length': String(body.byteLength)
    }),
    async arrayBuffer() {
      return body;
    }
  };
}

test('generated media is persisted and exposed through an opaque bot URL', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'metaflora-generated-media-'));
  try {
    const storage = createGeneratedMediaStorage({
      rootPath: directory,
      publicBaseUrl: 'https://metaflora.example.test'
    });
    const persisted = await storage.persist({
      source: Buffer.from('png-bytes'),
      mimeType: 'image/png',
      fileName: 'provider-result.png'
    });

    assert.match(persisted.url, /^https:\/\/metaflora\.example\.test\/media\/[A-Za-z0-9_-]{32}$/u);
    assert.match(persisted.shortUrl, /^https:\/\/metaflora\.example\.test\/f\/[A-Za-z0-9_-]{8}$/u);
    assert.doesNotMatch(persisted.url, /supabase|provider\.example/u);
    assert.doesNotMatch(persisted.shortUrl, /supabase|provider\.example/u);
    assert.deepEqual(persisted.data, Buffer.from('png-bytes'));

    const token = persisted.url.split('/').at(-1);
    const shortCode = persisted.shortUrl.split('/').at(-1);
    const stored = await storage.read(token);
    const shortStored = await storage.readShort(shortCode);
    assert.equal(stored.contentType, 'image/png');
    assert.equal(stored.size, 9);
    assert.deepEqual(stored.data, Buffer.from('png-bytes'));
    assert.deepEqual(shortStored.data, Buffer.from('png-bytes'));
    assert.deepEqual(await readFile(join(directory, `${token}.data`)), Buffer.from('png-bytes'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('provider output is downloaded once and stored without retaining the provider URL', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'metaflora-generated-remote-'));
  const requests = [];
  try {
    const storage = createGeneratedMediaStorage({
      rootPath: directory,
      publicBaseUrl: 'https://metaflora.example.test',
      fetchImpl: async (url, options) => {
        requests.push({ url, options });
        return responseFor('remote-png');
      }
    });
    const persisted = await storage.persist({
      source: 'https://provider.example/result.png',
      mimeType: 'image/png',
      size: 10
    });

    assert.equal(requests.length, 1);
    assert.equal(requests[0].options.redirect, 'error');
    assert.deepEqual(persisted.data, Buffer.from('remote-png'));
    assert.doesNotMatch(persisted.url, /provider\.example/u);
    assert.match(persisted.shortUrl, /\/f\/[A-Za-z0-9_-]{8}$/u);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('generated media storage rejects insecure provider URLs and unsafe public hosts', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'metaflora-generated-invalid-'));
  try {
    assert.throws(
      () => createGeneratedMediaStorage({
        rootPath: directory,
        publicBaseUrl: 'https://project.supabase.co'
      }),
      /public base URL/i
    );
    const storage = createGeneratedMediaStorage({
      rootPath: directory,
      publicBaseUrl: 'https://metaflora.example.test'
    });
    await assert.rejects(
      storage.persist({ source: 'http://provider.example/result.png', mimeType: 'image/png' }),
      /HTTPS/u
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
