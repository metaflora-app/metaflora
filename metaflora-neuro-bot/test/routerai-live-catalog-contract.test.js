import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildModelButton, isNewModel } from '../src/brand-icons.js';
import { buildModelCard, getModelById, listCatalogModels } from '../src/model-catalog.js';
import { cardProfileFor } from '../src/model-profiles.js';
import { exactProviderRoutesFor } from '../src/provider-route-matrix.js';

const liveRouterAiModelIds = new Set(readFileSync(
  new URL('./fixtures/routerai-model-ids-2026-08-20.txt', import.meta.url),
  'utf8'
).trim().split(/\s+/u));

// These specialist cards were explicitly retained even though RouterAI does
// not currently expose an equivalent model. Everything else must execute via
// a model id present in the pinned live RouterAI catalogue snapshot.
const allowedNonRouterAiModelIds = new Set([
  // Fully free text cards intentionally execute through OpenRouter's :free
  // routes, so they remain usable without consuming a paid RouterAI balance.
  'gpt_oss_20b_free',
  'nemotron_3_ultra_free',
  'nemotron_3_super_free',
  'gemma_4_31b_free',
  'north_mini_code_free',
  'nemotron_3_nano_omni_free',
  'polza_suno_generate_1xai46g',
  'polza_suno_mashup_0e1mpc3',
  'polza_suno_sounds_1lwz9xr',
  'polza_topaz_image_upscale_1qyj2i9',
  'polza_topaz_video_upscale_11v3tgv'
]);

function routerAiRoutesFor(model) {
  const providerModelIds = new Set([
    model.providerModelId,
    ...(model.providerModels ?? [])
  ].filter(Boolean));
  return [...providerModelIds]
    .flatMap((providerModelId) => exactProviderRoutesFor(providerModelId))
    .filter(({ provider }) => provider === 'routerai');
}

test('every public non-tool card executes through an exact live RouterAI model unless explicitly retained', () => {
  const violations = listCatalogModels()
    .filter(({ source }) => source !== 'tool')
    .filter(({ id }) => !allowedNonRouterAiModelIds.has(id))
    .flatMap((model) => {
      const routes = routerAiRoutesFor(model);
      const liveRoutes = routes.filter(({ providerModelId }) => (
        liveRouterAiModelIds.has(providerModelId)
      ));
      const executableRoutes = liveRoutes.filter(({ endpoint }) => (
        typeof endpoint === 'string' && endpoint.startsWith('https://routerai.ru/api/v1/')
      ));
      return executableRoutes.length > 0 ? [] : [{
        id: model.id,
        name: model.name,
        providerModelIds: [model.providerModelId, ...(model.providerModels ?? [])].filter(Boolean),
        routerAiRouteIds: routes.map(({ providerModelId }) => providerModelId)
      }];
    });

  assert.deepEqual(violations, []);
});

test('GLM 5.3 is a live RouterAI card with a NEW badge and substantive HTML formatting', () => {
  const now = Date.parse('2026-08-20T12:00:00.000Z');
  const model = getModelById('glm_53');

  assert.ok(model);
  assert.equal(model.name, 'GLM 5.3');
  assert.equal(model.category, 'llm');
  assert.equal(model.provider, 'routerai');
  assert.equal(model.providerModelId, 'z-ai/glm-5.3');
  assert.equal(liveRouterAiModelIds.has(model.providerModelId), true);
  assert.equal(isNewModel(model.id, now), true);
  assert.match(buildModelButton(model, now).text, /🆕/u);

  const profile = cardProfileFor(model);
  assert.ok(profile.description.length >= 120);
  assert.ok(profile.highlights.length >= 1);
  assert.ok(profile.highlights.every((highlight) => profile.description.includes(highlight)));
  assert.match(profile.instruction, /напиши|пришли|опиши|задай/iu);

  const card = buildModelCard(model, now);
  assert.equal(card.parse_mode, 'HTML');
  assert.match(card.text, /^<b>GLM 5\.3<\/b> 🆕/u);
  assert.match(card.text, /<b>[^<]+<\/b>/u);
  assert.match(card.text, /<b>стоимость:.*метакоинов<\/b>/iu);
});
