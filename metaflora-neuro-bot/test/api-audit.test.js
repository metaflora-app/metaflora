import test from 'node:test';
import assert from 'node:assert/strict';

import { createProviderAuditedFetch } from '../src/api-audit.js';

function repositoryDouble() {
  const started = [];
  const completed = [];
  return {
    started,
    completed,
    async startProviderApiCall(value) {
      started.push(value);
      return 'call-id';
    },
    async completeProviderApiCall(value) {
      completed.push(value);
      return value.callId;
    }
  };
}

test('provider fetch audit records sanitized request and response without changing the response', async () => {
  const repository = repositoryDouble();
  const auditedFetch = createProviderAuditedFetch({
    repository,
    fetchImpl: async () => new Response(JSON.stringify({
      id: 'req-1',
      choices: [{ message: { content: 'готово' } }]
    }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'req-1'
      }
    })
  });

  const response = await auditedFetch('https://openrouter.ai/api/v1/chat/completions?api_key=secret', {
    method: 'POST',
    headers: { authorization: 'Bearer secret' },
    body: JSON.stringify({ model: 'test', prompt: 'привет', apiKey: 'secret' })
  });

  assert.equal(await response.json().then((value) => value.id), 'req-1');
  assert.equal(repository.started.length, 1);
  assert.equal(repository.started[0].provider, 'openrouter');
  assert.equal(repository.started[0].endpointPath, '/api/v1/chat/completions');
  assert.equal(JSON.stringify(repository.started[0]).includes('secret'), false);
  assert.equal(JSON.stringify(repository.started[0].requestPayload).includes('привет'), false);
  assert.equal(JSON.stringify(repository.started[0].requestPayload).includes('messages'), false);
  assert.equal(JSON.stringify(repository.completed[0].responsePayload).includes('готово'), false);
  assert.equal(JSON.stringify(repository.completed[0].responsePayload).includes('choices'), false);
  assert.equal(repository.completed[0].status, 'succeeded');
  assert.equal(repository.completed[0].providerRequestId, 'req-1');
});

test('provider fetch audit records safe metadata for chat payloads', async () => {
  const repository = repositoryDouble();
  const auditedFetch = createProviderAuditedFetch({
    repository,
    fetchImpl: async () => new Response(JSON.stringify({
      choices: [{ message: { content: 'raw provider answer' } }],
      usage: { prompt_tokens: 11, completion_tokens: 7, total_tokens: 18 }
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  });

  await auditedFetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({
      model: 'openai/gpt-test',
      messages: [
        { role: 'system', content: 'raw system instruction' },
        { role: 'user', content: 'raw user prompt' }
      ],
      temperature: 0.7
    })
  });

  assert.deepEqual(repository.started[0].requestPayload, {
    bodyType: 'json',
    rootType: 'object',
    byteLength: 155,
    model: 'openai/gpt-test',
    bodyFieldNames: ['model', 'temperature'],
    chatMessageCount: 2,
    chatRoles: ['system', 'user']
  });
  assert.deepEqual(repository.completed[0].responsePayload.body, {
    rootType: 'object',
    completionChoiceCount: 1,
    tokenUsage: {
      inputTokens: 11,
      outputTokens: 7,
      totalTokens: 18
    }
  });
});

test('provider fetch audit maps provider HTTP statuses to normalized error codes', async () => {
  const cases = [
    [401, 'provider_auth_failed'],
    [403, 'provider_auth_failed'],
    [402, 'provider_payment_required'],
    [429, 'provider_rate_limited'],
    [500, 'provider_unavailable'],
    [503, 'provider_unavailable']
  ];

  for (const [status, errorCode] of cases) {
    const repository = repositoryDouble();
    const auditedFetch = createProviderAuditedFetch({
      repository,
      fetchImpl: async () => new Response(JSON.stringify({ error: { message: 'raw error' } }), {
        status,
        headers: { 'content-type': 'application/json' }
      })
    });

    await auditedFetch('https://polza.ai/api/v1/run', { method: 'POST' });

    assert.equal(repository.completed[0].status, 'failed');
    assert.equal(repository.completed[0].httpStatus, status);
    assert.equal(repository.completed[0].errorCode, errorCode);
  }
});

test('provider fetch audit keeps a safe upstream error code alongside HTTP status', async () => {
  const repository = repositoryDouble();
  const auditedFetch = createProviderAuditedFetch({
    repository,
    fetchImpl: async () => new Response(JSON.stringify({
      error: {
        code: 'INVALID_INPUT',
        message: 'private prompt and payload are hidden',
      },
    }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    }),
  });

  await auditedFetch('https://polza.ai/api/v1/media', { method: 'POST' });

  assert.equal(repository.completed[0].httpStatus, 422);
  assert.equal(repository.completed[0].errorCode, 'INVALID_INPUT');
  assert.equal(repository.completed[0].responsePayload.body.providerErrorCode, 'INVALID_INPUT');
  assert.equal(JSON.stringify(repository.completed[0]).includes('private prompt'), false);
});

test('provider fetch audit records failures and never replaces the provider error', async () => {
  const repository = repositoryDouble();
  const expected = new Error('network down Bearer sk-secret-token https://api.example.test/run?api_key=hidden prompt="raw prompt"');
  expected.name = 'TimeoutError';
  const auditedFetch = createProviderAuditedFetch({
    repository,
    fetchImpl: async () => {
      throw expected;
    }
  });

  await assert.rejects(
    auditedFetch('https://api.elevenlabs.io/v1/text-to-speech/voice', {
      method: 'POST',
      body: new Uint8Array([1, 2, 3])
    }),
    (error) => error === expected
  );
  assert.equal(repository.completed[0].status, 'timeout');
  assert.equal(repository.completed[0].errorCode, 'provider_timeout');
  assert.equal(repository.completed[0].errorMessage.includes('sk-secret-token'), false);
  assert.equal(repository.completed[0].errorMessage.includes('api_key=hidden'), false);
  assert.equal(repository.completed[0].errorMessage.includes('raw prompt'), false);
});

test('provider fetch audit propagates generation and user context safely', async () => {
  const repository = repositoryDouble();
  const auditedFetch = createProviderAuditedFetch({
    repository,
    fetchImpl: async () => new Response('{}', { status: 200 })
  });

  await auditedFetch('https://fal.run/models/test', {
    method: 'POST',
    audit: {
      generationId: '00000000-0000-4000-8000-000000000001',
      telegramUserId: '12345',
      requestKey: 'message:12345:777',
      operation: 'media.submit'
    },
    body: JSON.stringify({ input: { prompt: 'raw image prompt' } })
  });

  assert.equal(repository.started[0].generationId, '00000000-0000-4000-8000-000000000001');
  assert.equal(repository.started[0].telegramUserId, '12345');
  assert.match(repository.started[0].requestKey, /^message:12345:777:provider:/);
  assert.equal(repository.started[0].operation, 'media.submit');
  assert.equal(JSON.stringify(repository.started[0].requestPayload).includes('raw image prompt'), false);
});

test('audit storage failure does not break the provider call', async () => {
  const auditedFetch = createProviderAuditedFetch({
    repository: {
      async startProviderApiCall() {
        throw new Error('database unavailable');
      },
      async completeProviderApiCall() {
        throw new Error('database unavailable');
      }
    },
    fetchImpl: async () => new Response('ok', { status: 200 }),
    onError: () => {}
  });

  const response = await auditedFetch('https://polza.ai/api/v1/run');
  assert.equal(await response.text(), 'ok');
});
