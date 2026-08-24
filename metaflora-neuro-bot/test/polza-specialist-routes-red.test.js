import assert from 'node:assert/strict';
import test from 'node:test';

import { getModelById, listCatalogModels } from '../src/model-catalog.js';
import { exactProviderRoutesFor } from '../src/provider-route-matrix.js';
import { TOOL_CATALOG } from '../src/tool-catalog.js';

const POLZA_SPECIALISTS = Object.freeze({
  polza_suno_generate_1xai46g: 'suno/generate',
  polza_suno_mashup_0e1mpc3: 'suno/mashup',
  polza_suno_sounds_1lwz9xr: 'suno/sounds',
  polza_topaz_image_upscale_1qyj2i9: 'topaz/image-upscale',
  polza_topaz_video_upscale_11v3tgv: 'topaz/video-upscale'
});

test('Suno and Topaz cards stay public and execute only through their Polza contracts', () => {
  const visibleIds = new Set(listCatalogModels().map(({ id }) => id));

  for (const [cardId, providerModelId] of Object.entries(POLZA_SPECIALISTS)) {
    const model = getModelById(cardId);
    assert.equal(visibleIds.has(cardId), true, `${cardId}: card must be public`);
    assert.ok(model, `${cardId}: card must resolve by id`);
    assert.equal(model.provider, 'polza', `${cardId}: card provider`);
    assert.equal(model.providerModelId, providerModelId, `${cardId}: provider model id`);
    assert.deepEqual(
      exactProviderRoutesFor(providerModelId).map(({ provider }) => provider),
      ['polza'],
      `${cardId}: executable providers`
    );
  }
});

test('Topaz has no fal.ai execution contract after restoring the Polza cards', () => {
  const serializedTools = JSON.stringify(TOOL_CATALOG);
  assert.doesNotMatch(serializedTools, /fal-ai\/topaz/iu);
});

test('ElevenLabs capabilities keep the official direct API as their primary route', () => {
  for (const toolId of [
    'audio_stt',
    'audio_tts',
    'audio_isolation',
    'audio_sfx',
    'audio_music',
    'audio_voice_change'
  ]) {
    const tool = TOOL_CATALOG.find(({ id }) => id === toolId);
    assert.ok(tool, `${toolId}: tool is missing`);
    assert.equal(tool.brand, 'elevenlabs', `${toolId}: brand`);
    assert.equal(tool.runtime.adapter, 'elevenlabs.direct', `${toolId}: runtime adapter`);
    assert.deepEqual(
      tool.routes.filter(({ role }) => role === 'primary').map(({ provider }) => provider),
      ['elevenlabs'],
      `${toolId}: primary provider`
    );
    assert.match(tool.routes[0].endpoint, /^\/v1\//u, `${toolId}: official API endpoint`);
  }
});
