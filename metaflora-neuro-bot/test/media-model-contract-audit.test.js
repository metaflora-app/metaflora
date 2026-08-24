import assert from 'node:assert/strict';
import test from 'node:test';

import { createMediaModelExecutor } from '../src/media-model-executor.js';
import { listCatalogModels } from '../src/model-catalog.js';
import { inputProfileFor } from '../src/model-profiles.js';
import { getProviderAdapter } from '../src/provider-adapters.js';

const mediaModels = listCatalogModels().filter((model) => (
  model.source !== 'tool'
  && ['image', 'video', 'audio', 'voice', 'music'].includes(model.category)
  && ['polza', 'kie'].includes(model.provider)
));

function offlineTelegramInput(model) {
  const providerModelId = String(model.providerModelId ?? '').toLowerCase();
  if (model.category === 'voice' && /transcrib|whisper|asr|gigaam|parakeet|chirp|voxtral/.test(providerModelId)) {
    return { voice: { file_id: 'https://uploads.example.test/input.mp3' } };
  }
  return { text: 'проверка контракта' };
}

test('all catalog media provider routes build only contract-approved inputs', async () => {
  const failures = [];

  for (const model of mediaModels) {
    try {
      let captured;
      const executor = createMediaModelExecutor({
        telegram: null,
        providerKeys: { polza: 'polza-secret', kie: 'kie-secret' },
        invoke: async (request, { config }) => {
          const route = config.routes.model[0];
          captured = {
            route,
            body: await getProviderAdapter(route.provider).submissionBody(route, request, {
              fetchImpl: async () => new Response(new Uint8Array([1, 2, 3]), {
                status: 200,
                headers: { 'content-type': 'audio/mpeg' }
              })
            })
          };
          return captured;
        }
      });
      await executor({
        model,
        settings: Object.fromEntries(inputProfileFor(model).map((field) => [field.key, field.defaultValue])),
        telegramInput: offlineTelegramInput(model)
      });

      if (captured.route.provider === 'polza') {
        assert.ok(Array.isArray(captured.route.providerParameters), `${model.id}: missing provider contract`);
        const allowed = new Set(captured.route.providerParameters.map(({ key }) => key));
        if (captured.body instanceof FormData) {
          const scalarKeys = [...captured.body.keys()].filter((key) => !['model', 'file', 'prompt'].includes(key));
          assert.deepEqual(
            scalarKeys.filter((key) => !allowed.has(key)),
            [],
            `${model.id}: unsupported multipart fields ${scalarKeys.filter((key) => !allowed.has(key)).join(', ')}`
          );
        } else if (captured.route.runtime?.operation === 'speech') {
          const scalarKeys = Object.keys(captured.body).filter((key) => !['model', 'input'].includes(key));
          assert.deepEqual(
            scalarKeys.filter((key) => !allowed.has(key)),
            [],
            `${model.id}: unsupported speech fields ${scalarKeys.filter((key) => !allowed.has(key)).join(', ')}`
          );
        } else {
          const scalarKeys = Object.keys(captured.body.input).filter((key) => (
            !['prompt', 'images', 'videos', 'audio_urls'].includes(key)
          ));
          assert.deepEqual(
            scalarKeys.filter((key) => !allowed.has(key)),
            [],
            `${model.id}: unsupported fields ${scalarKeys.filter((key) => !allowed.has(key)).join(', ')}`
          );
        }
      }
    } catch (error) {
      failures.push(`${model.id}: ${error.message}`);
    }
  }

  assert.deepEqual(failures, [], failures.join('\n'));
});
