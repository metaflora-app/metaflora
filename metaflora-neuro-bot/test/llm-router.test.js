import test from 'node:test';
import assert from 'node:assert/strict';

import { invokeFreeLlm } from '../src/llm-router.js';
import { listCatalogModels } from '../src/model-catalog.js';

test('free LLM request falls back from OpenRouter to Requesty without exposing credentials', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('openrouter')) return new Response('{"error":"temporary"}', { status: 503 });
    return new Response(JSON.stringify({ choices: [{ message: { content: 'Готово' } }] }), { status: 200 });
  };

  const result = await invokeFreeLlm({
    prompt: 'Привет',
    providerKeys: { openrouter: 'or-secret', requesty: 'rq-secret' },
    fetchImpl
  });

  assert.deepEqual(result, { text: 'Готово', provider: 'requesty' });
  assert.equal(calls.length, 2);
  assert.match(calls[0].options.body, /:free/);
  assert.ok(calls.every(({ url }) => !url.includes('secret')));
  assert.doesNotMatch(JSON.stringify(result), /secret/);
});

test('free LLM request reports an unavailable route when no key is configured', async () => {
  await assert.rejects(
    () => invokeFreeLlm({ prompt: 'Привет', providerKeys: {}, fetchImpl: async () => null }),
    /No free LLM provider is configured/ 
  );
});

test('free LLM request rejects a successful response without usable text', async () => {
  await assert.rejects(
    () => invokeFreeLlm({
      prompt: 'Привет',
      providerKeys: { openrouter: 'or-secret' },
      fetchImpl: async () => new Response('{"choices":[{"message":{"content":null}}]}', { status: 200 })
    }),
    /did not contain text/
  );
});

test('free LLM request rejects oversized provider responses before parsing them', async () => {
  await assert.rejects(
    () => invokeFreeLlm({
      prompt: 'Привет',
      providerKeys: { openrouter: 'or-secret' },
      fetchImpl: async () => new Response('x', {
        status: 200,
        headers: { 'content-length': '1000001' }
      })
    }),
    /exceeded the size limit/
  );
});

test('free LLM request forwards validated native settings', async () => {
  let requestBody;
  await invokeFreeLlm({
    prompt: 'Реши задачу',
    providerKeys: { openrouter: 'or-secret' },
    settings: {
      temperature: '0.2',
      max_tokens: '4096',
      reasoning_effort: 'high',
      ignored: 'secret'
    },
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return new Response(JSON.stringify({ choices: [{ message: { content: 'Готово' } }] }), { status: 200 });
    }
  });

  assert.equal(requestBody.temperature, 0.2);
  assert.equal(requestBody.max_tokens, 4096);
  assert.equal(requestBody.reasoning_effort, 'high');
  assert.equal(requestBody.ignored, undefined);
});

test('chat route sends bounded image input as OpenAI-compatible multimodal content', async () => {
  let requestBody;
  await invokeFreeLlm({
    prompt: 'разбери изображение',
    provider: 'routerai',
    providerModel: 'qwen/qwen3-vl-235b-a22b-instruct',
    providerKeys: { routerai: 'secret' },
    media: [{ type: 'image', url: 'https://fal.media/safe.png' }],
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return new Response(JSON.stringify({ choices: [{ message: { content: 'готово' } }] }), { status: 200 });
    }
  });
  assert.deepEqual(requestBody.messages.at(-1).content, [
    { type: 'text', text: 'разбери изображение' },
    { type: 'image_url', image_url: { url: 'https://fal.media/safe.png' } }
  ]);
});

test('advanced response controls are mapped only onto a provider allowlist', async () => {
  let requestBody;
  await invokeFreeLlm({
    prompt: 'Реши задачу',
    provider: 'routerai',
    providerModel: 'openai/gpt-5.6-terra',
    providerKeys: { routerai: 'router-secret' },
    settings: {
      response_length: 'detailed',
      reasoning_effort: 'high',
      reasoning_summary: 'brief',
      documents: 'always',
      context: 'fresh',
      hidden_chain_of_thought: true
    },
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return new Response(JSON.stringify({ choices: [{ message: { content: 'Готово' } }] }), { status: 200 });
    }
  });

  assert.equal(requestBody.max_tokens, 2400);
  assert.equal(requestBody.reasoning_effort, 'high');
  assert.equal(requestBody.reasoning_summary, undefined);
  assert.equal(requestBody.documents, undefined);
  assert.equal(requestBody.context, undefined);
  assert.equal(requestBody.hidden_chain_of_thought, undefined);
});

test('catalog LLM routes never send settings outside the provider supported-parameter contract', async () => {
  const failures = [];
  const models = listCatalogModels().filter((model) => (
    model.source !== 'tool' && ['llm', 'beta'].includes(model.category)
  ));

  for (const model of models) {
    let requestBody;
    try {
      await invokeFreeLlm({
        prompt: 'проверка контракта',
        provider: model.provider,
        providerModel: model.providerModelId,
        providerKeys: { polza: 'polza-secret', routerai: 'routerai-secret', openrouter: 'openrouter-secret' },
        settings: {
          temperature: '0.7',
          max_tokens: '900',
          reasoning_effort: 'medium'
        },
        fetchImpl: async (_url, options) => {
          requestBody = JSON.parse(options.body);
          return new Response(JSON.stringify({
            choices: [{ message: { content: 'ok' } }]
          }), { status: 200 });
        }
      });

      const supported = new Set(
        model.provider === 'openrouter' && model.providerModelId.endsWith(':free')
          ? ['max_tokens', 'temperature', 'reasoning_effort']
          : model.supportedParameters ?? []
      );
      const mappedKeys = Object.keys(requestBody)
        .filter((key) => !['model', 'messages', 'system', 'input', 'stream', 'max_output_tokens', 'reasoning'].includes(key));
      const unsupported = mappedKeys.filter((key) => !supported.has(key));
      if (unsupported.length) {
        failures.push(`${model.id}: ${unsupported.join(', ')}`);
      }
    } catch (error) {
      failures.push(`${model.id}: ${error.message}`);
    }
  }

  assert.deepEqual(failures, [], failures.join('\n'));
});

test('free LLM request places saved user instructions in a bounded system message', async () => {
  let requestBody;
  await invokeFreeLlm({
    prompt: 'Проверь текст',
    providerKeys: { openrouter: 'or-secret' },
    settings: { instructions: 'отвечай кратко и по-русски' },
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return new Response(JSON.stringify({ choices: [{ message: { content: 'Готово' } }] }), { status: 200 });
    }
  });

  assert.deepEqual(requestBody.messages, [
    { role: 'system', content: 'отвечай кратко и по-русски' },
    { role: 'user', content: 'Проверь текст' }
  ]);
});

test('a trusted caller can raise the system-instruction limit for full product knowledge', async () => {
  let requestBody;
  const instructions = 'з'.repeat(80_000);
  await invokeFreeLlm({
    prompt: 'Проверь каталог',
    provider: 'openrouter',
    providerModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    providerKeys: { openrouter: 'or-secret' },
    systemInstructionsLimit: 200_000,
    settings: { instructions },
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return new Response(JSON.stringify({
        choices: [{ message: { content: 'готово' } }]
      }), { status: 200 });
    }
  });

  assert.equal(requestBody.messages[0].content.length, 80_000);
});

test('agent safety instructions survive the full runtime prompt limit', async () => {
  let requestBody;
  const tail = 'обязательная защита в конце';
  const instructions = `${'а'.repeat(8_000)}${tail}`;
  await invokeFreeLlm({
    prompt: 'Проверь',
    providerModel: 'openai/gpt-5.6-terra',
    providerKeys: { routerai: 'routerai-secret' },
    settings: { instructions },
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return new Response(JSON.stringify({ choices: [{ message: { content: 'Готово' } }] }), { status: 200 });
    }
  });

  assert.equal(requestBody.messages[0].content, instructions);
  assert.match(requestBody.messages[0].content, new RegExp(`${tail}$`));
});

test('agent request sends the requested Terra model to RouterAI', async () => {
  let request;
  const result = await invokeFreeLlm({
    prompt: 'Собери план',
    providerModel: 'openai/gpt-5.6-terra',
    providerKeys: {
      routerai: 'routerai-secret',
      openrouter: 'openrouter-secret'
    },
    settings: {
      instructions: 'ты стратег. верни план с ответственными и сроками.',
      reasoning_effort: 'medium'
    },
    fetchImpl: async (url, options) => {
      request = { url, body: JSON.parse(options.body) };
      return new Response(JSON.stringify({
        choices: [{ message: { content: 'план готов' } }]
      }), { status: 200 });
    }
  });

  assert.equal(request.url, 'https://routerai.ru/api/v1/chat/completions');
  assert.equal(request.body.model, 'openai/gpt-5.6-terra');
  assert.deepEqual(request.body.messages, [
    { role: 'system', content: 'ты стратег. верни план с ответственными и сроками.' },
    { role: 'user', content: 'Собери план' }
  ]);
  assert.deepEqual(result, {
    text: 'план готов',
    provider: 'routerai',
    model: 'openai/gpt-5.6-terra'
  });
});

test('an explicitly requested agent model is not removed by the free-route secondary-provider switch', async () => {
  let called = false;
  const result = await invokeFreeLlm({
    prompt: 'проверь маршрут',
    providerModel: 'openai/gpt-5.6-terra',
    providerKeys: { routerai: 'routerai-secret' },
    allowSecondaryProviders: false,
    fetchImpl: async () => {
      called = true;
      return new Response(JSON.stringify({
        choices: [{ message: { content: 'маршрут работает' } }]
      }), { status: 200 });
    }
  });

  assert.equal(called, true);
  assert.equal(result.provider, 'routerai');
});

test('an explicitly requested OpenRouter free model keeps its validated :free suffix', async () => {
  let requestBody;
  const result = await invokeFreeLlm({
    prompt: 'Покажи раздел',
    providerModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    providerKeys: { openrouter: 'or-secret' },
    allowSecondaryProviders: false,
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return new Response(JSON.stringify({
        choices: [{ message: { content: 'готово' } }]
      }), { status: 200 });
    }
  });

  assert.equal(requestBody.model, 'nvidia/nemotron-3-ultra-550b-a55b:free');
  assert.equal(result.model, 'nvidia/nemotron-3-ultra-550b-a55b:free');
});

test('an explicitly pinned provider never sends a requested model to another configured provider', async () => {
  const calls = [];
  const result = await invokeFreeLlm({
    prompt: 'Покажи раздел',
    provider: 'openrouter',
    providerModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    providerKeys: {
      polza: 'polza-secret',
      openrouter: 'openrouter-secret',
      requesty: 'requesty-secret'
    },
    fetchImpl: async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) });
      return new Response(JSON.stringify({
        choices: [{ message: { content: 'готово' } }]
      }), { status: 200 });
    }
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(calls[0].body.model, 'nvidia/nemotron-3-ultra-550b-a55b:free');
  assert.equal(result.provider, 'openrouter');
});

test('requested-provider pin is validated even when no model is supplied', async () => {
  await assert.rejects(
    () => invokeFreeLlm({
      prompt: 'Покажи раздел',
      provider: 'unknown',
      providerKeys: { openrouter: 'openrouter-secret' }
    }),
    /Unsupported requested-model provider/
  );
});

test('agent routing advances to the next verified model after a provider failure', async () => {
  const models = [];
  const result = await invokeFreeLlm({
    prompt: 'проверь резерв',
    providerModels: [
      'anthropic/claude-sonnet-5',
      'openai/gpt-5.6-terra'
    ],
    providerKeys: { routerai: 'routerai-secret' },
    fetchImpl: async (_url, options) => {
      const { model } = JSON.parse(options.body);
      models.push(model);
      if (model.startsWith('anthropic/')) {
        return new Response('{"error":"temporary"}', { status: 503 });
      }
      return new Response(JSON.stringify({
        choices: [{ message: { content: 'резерв сработал' } }]
      }), { status: 200 });
    }
  });

  assert.deepEqual(models, [
    'anthropic/claude-sonnet-5',
    'openai/gpt-5.6-terra'
  ]);
  assert.deepEqual(result, {
    text: 'резерв сработал',
    provider: 'routerai',
    model: 'openai/gpt-5.6-terra'
  });
});

test('requested agent models use OpenRouter when Polza is not configured', async () => {
  let request;
  const result = await invokeFreeLlm({
    prompt: 'проверь openrouter',
    providerModels: ['openai/gpt-5.6-terra'],
    providerKeys: { openrouter: 'openrouter-secret' },
    fetchImpl: async (url, options) => {
      request = { url, body: JSON.parse(options.body) };
      return new Response(JSON.stringify({
        choices: [{ message: { content: 'openrouter работает' } }]
      }), { status: 200 });
    }
  });

  assert.equal(request.url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(request.body.model, 'openai/gpt-5.6-terra');
  assert.deepEqual(result, {
    text: 'openrouter работает',
    provider: 'openrouter',
    model: 'openai/gpt-5.6-terra'
  });
});

test('requested agent models can use Requesty as the last configured provider', async () => {
  let url;
  const result = await invokeFreeLlm({
    prompt: 'проверь requesty',
    providerModels: ['openai/gpt-5.6-terra'],
    providerKeys: { requesty: 'requesty-secret' },
    fetchImpl: async (requestUrl) => {
      url = requestUrl;
      return new Response(JSON.stringify({
        choices: [{ message: { content: 'requesty работает' } }]
      }), { status: 200 });
    }
  });

  assert.equal(url, 'https://router.requesty.ai/v1/chat/completions');
  assert.equal(result.provider, 'requesty');
  assert.equal(result.model, 'openai/gpt-5.6-terra');
});

test('agent can fall back to a free route without pretending it used Terra', async () => {
  const models = [];
  const result = await invokeFreeLlm({
    prompt: 'проверь резерв',
    providerModels: ['openai/gpt-5.6-terra'],
    providerKeys: { openrouter: 'openrouter-secret' },
    allowFreeFallback: true,
    fetchImpl: async (_url, options) => {
      const { model } = JSON.parse(options.body);
      models.push(model);
      if (model === 'openai/gpt-5.6-terra') {
        return new Response('{"error":"insufficient credits"}', { status: 402 });
      }
      return new Response(JSON.stringify({
        choices: [{ message: { content: 'резерв работает' } }]
      }), { status: 200 });
    }
  });

  assert.deepEqual(models, ['openai/gpt-5.6-terra', 'openai/gpt-oss-20b:free']);
  assert.deepEqual(result, {
    text: 'резерв работает',
    provider: 'openrouter',
    billingTier: 'free'
  });
});

test('RouterAI-only agent route never invents a Polza fallback', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    if (url === 'https://routerai.ru/api/v1/chat/completions') {
      return new Response('{"error":"temporary outage"}', { status: 503 });
    }
    return new Response(JSON.stringify({
      choices: [{ message: { content: 'RouterAI ответ' } }]
    }), { status: 200 });
  };

  await assert.rejects(() => invokeFreeLlm({
    prompt: 'Собери план',
    providerModels: ['openai/gpt-5.6-terra'],
    providerKeys: { polza: 'polza-secret', routerai: 'routerai-secret' },
    settings: {
      instructions: 'ты стратег',
      max_tokens: 321,
      reasoning_effort: 'high'
    },
    fetchImpl
  }), /Provider routerai is unavailable/);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://routerai.ru/api/v1/chat/completions');
  assert.deepEqual(calls[0].body, {
    model: 'openai/gpt-5.6-terra',
    messages: [
      { role: 'system', content: 'ты стратег' },
      { role: 'user', content: 'Собери план' }
    ],
    max_tokens: 321,
    reasoning_effort: 'high'
  });
});

test('RouterAI chat adapter sends Gemini messages and extracts chat completion text', async () => {
  let request;
  const result = await invokeFreeLlm({
    prompt: 'Проверь факты',
    providerModels: ['google/gemini-3.1-pro-preview'],
    providerKeys: { polza: 'polza-secret', routerai: 'routerai-secret' },
    settings: { instructions: 'отвечай с источниками' },
    fetchImpl: async (url, options) => {
      if (url.includes('polza.ai')) return new Response('{"error":"down"}', { status: 502 });
      request = { url, body: JSON.parse(options.body) };
      return new Response(JSON.stringify({
        choices: [{ message: { content: 'Gemini ответ' } }]
      }), { status: 200 });
    }
  });

  assert.equal(request.url, 'https://routerai.ru/api/v1/chat/completions');
  assert.deepEqual(request.body, {
    model: 'google/gemini-3.1-pro-preview',
    messages: [
      { role: 'system', content: 'отвечай с источниками' },
      { role: 'user', content: 'Проверь факты' }
    ],
    max_tokens: 900
  });
  assert.deepEqual(result, {
    text: 'Gemini ответ',
    provider: 'routerai',
    model: 'google/gemini-3.1-pro-preview'
  });
});

test('RouterAI chat adapter sends Claude system instructions and extracts completion text', async () => {
  let request;
  const result = await invokeFreeLlm({
    prompt: 'Разбери договор',
    providerModels: ['anthropic/claude-sonnet-5'],
    providerKeys: { polza: 'polza-secret', routerai: 'routerai-secret' },
    settings: { instructions: 'не давай юридическое заключение' },
    fetchImpl: async (url, options) => {
      if (url.includes('polza.ai')) return new Response('{"error":"down"}', { status: 502 });
      request = { url, body: JSON.parse(options.body) };
      return new Response(JSON.stringify({
        choices: [{ message: { content: 'Claude ответ' } }]
      }), { status: 200 });
    }
  });

  assert.equal(request.url, 'https://routerai.ru/api/v1/chat/completions');
  assert.deepEqual(request.body, {
    model: 'anthropic/claude-sonnet-5',
    messages: [
      { role: 'system', content: 'не давай юридическое заключение' },
      { role: 'user', content: 'Разбери договор' }
    ],
    max_tokens: 900
  });
  assert.deepEqual(result, {
    text: 'Claude ответ',
    provider: 'routerai',
    model: 'anthropic/claude-sonnet-5'
  });
});

test('an accepted RouterAI request with an unusable response is never duplicated to Polza', async () => {
  const calls = [];
  await assert.rejects(
    () => invokeFreeLlm({
      prompt: 'Не повторяй',
      providerModels: ['openai/gpt-5.6-terra'],
      providerKeys: { polza: 'polza-secret', routerai: 'routerai-secret' },
      fetchImpl: async (url) => {
        calls.push(url);
        return new Response('{"choices":[{"message":{"content":null}}]}', { status: 200 });
      }
    }),
    /did not contain text/
  );
  assert.deepEqual(calls, ['https://routerai.ru/api/v1/chat/completions']);
});

test('an unknown RouterAI request outcome is never duplicated to Polza', async () => {
  const calls = [];
  await assert.rejects(
    () => invokeFreeLlm({
      prompt: 'Не повторяй',
      providerModels: ['openai/gpt-5.6-terra'],
      providerKeys: { polza: 'polza-secret', routerai: 'routerai-secret' },
      fetchImpl: async (url) => {
        calls.push(url);
        throw new Error('socket reset');
      }
    }),
    /outcome is unknown/
  );
  assert.deepEqual(calls, ['https://routerai.ru/api/v1/chat/completions']);
});

test('the confirmed Yandex alias uses RouterAI without inventing a Polza fallback', async () => {
  const calls = [];
  await assert.rejects(
    () => invokeFreeLlm({
      prompt: 'Проверь маршрут',
      providerModels: ['yandex/yandexgpt-5.1-pro'],
      providerKeys: { polza: 'polza-secret', routerai: 'routerai-secret' },
      fetchImpl: async (url) => {
        calls.push(url);
        return new Response('{"error":"down"}', { status: 503 });
      }
    }),
    /Provider routerai is unavailable/
  );
  assert.deepEqual(calls, [
    'https://routerai.ru/api/v1/chat/completions'
  ]);
});

test('the legacy Polza provider pin follows the confirmed RouterAI-only route', async () => {
  const calls = [];
  await assert.rejects(() => invokeFreeLlm({
    prompt: 'Проверь закреплённый маршрут',
    provider: 'polza',
    providerModel: 'openai/gpt-5.6-terra',
    providerKeys: { polza: 'polza-secret', routerai: 'routerai-secret' },
    fetchImpl: async (url) => {
      calls.push(url);
      if (url.includes('routerai.ru')) return new Response('{"error":"down"}', { status: 503 });
      return new Response(JSON.stringify({
        choices: [{ message: { content: 'закреплённый резерв' } }]
      }), { status: 200 });
    }
  }), /Provider routerai is unavailable/);

  assert.deepEqual(calls, [
    'https://routerai.ru/api/v1/chat/completions'
  ]);
});
