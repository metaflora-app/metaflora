import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildModelCard,
  buildModelConfiguredMessage,
  buildModelSelectedMessage,
  defaultModelSettings,
  getModelById,
  listCatalogModels
} from '../src/model-catalog.js';

const PROVIDER_NAME = /router\s*ai/iu;

test('removed FLUX Video Upscale is not published in the bot catalogue', () => {
  assert.equal(getModelById('flux_video_upscale'), null);
  assert.equal(
    listCatalogModels().some(({ id }) => id === 'flux_video_upscale'),
    false
  );
});

test('public model messages never expose the infrastructure provider name', () => {
  for (const model of listCatalogModels()) {
    const settings = defaultModelSettings(model);
    const publicMessages = [
      buildModelCard(model),
      buildModelConfiguredMessage(model, settings),
      buildModelSelectedMessage(model)
    ];

    for (const message of publicMessages) {
      assert.doesNotMatch(message.text ?? '', PROVIDER_NAME, model.id);
    }
  }
});
