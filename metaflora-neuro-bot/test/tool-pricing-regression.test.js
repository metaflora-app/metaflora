import assert from 'node:assert/strict';
import test from 'node:test';

import { defaultModelSettings, getModelById } from '../src/model-catalog.js';
import {
  calculateMetacoinPrice,
  providerCostRublesToMetacoins,
  providerCostUsdToMetacoins
} from '../src/model-pricing.js';
import { confirmedProviderPriceFor } from '../src/provider-pricing.js';
import {
  calculateToolMetacoinPrice,
  getToolModelById
} from '../src/tool-model-adapter.js';

function toolPrice(id, settings = {}, usage = {}) {
  return calculateToolMetacoinPrice(getToolModelById(id), settings, usage);
}

test('output_second prices Kling 3 Pro and Topaz video by generated duration', () => {
  const klingFiveSeconds = toolPrice('video_generate', {
    duration: '5',
    generate_audio: false
  });
  assert.equal(klingFiveSeconds, providerCostUsdToMetacoins(0.112 * 5));
  assert.equal(klingFiveSeconds, 41, `Kling 3 Pro 5s costs ${klingFiveSeconds}`);
  assert.equal(
    toolPrice('video_generate', { duration: '5', generate_audio: true }),
    providerCostUsdToMetacoins(0.168 * 5)
  );

  assert.equal(
    toolPrice(
      'video_upscale',
      { model: 'Gaia 2', upscale_factor: 8 },
      { durationSeconds: 12 }
    ),
    providerCostUsdToMetacoins(0.16 * 12)
  );
});

test('input_second multiplies provider cost by source duration', () => {
  assert.equal(
    toolPrice('video_remove_bg', {}, { durationSeconds: 12 }),
    providerCostUsdToMetacoins(0.0042 * 12)
  );
});

test('5_input_seconds converts source duration into five-second units', () => {
  assert.equal(
    toolPrice('video_understand', {}, { durationSeconds: 12 }),
    providerCostUsdToMetacoins(0.01 * (12 / 5))
  );
});

test('input_minute converts STT source seconds into minutes', () => {
  assert.equal(
    toolPrice('audio_stt', {}, { durationSeconds: 150 }),
    providerCostUsdToMetacoins(0.008 * 2.5)
  );
});

test('1000_characters prices TTS for all 2500 input characters', () => {
  assert.equal(
    toolPrice('audio_tts', {}, { characters: 2500 }),
    providerCostUsdToMetacoins(0.1 * 2.5)
  );
});

test('output_audio_minute converts generated audio seconds into minutes', () => {
  assert.equal(
    toolPrice('audio_music', {}, { durationSeconds: 150 }),
    providerCostUsdToMetacoins(0.15 * 2.5)
  );
});

test('output_audio_minute converts the requested ElevenLabs music length from milliseconds', () => {
  assert.equal(
    toolPrice('audio_music', { music_length_ms: 600_000 }),
    providerCostUsdToMetacoins(0.15 * 10)
  );
});

test('video_up_to_40_seconds charges once for every generated video', () => {
  assert.equal(
    toolPrice('video_lipsync', {}, { quantity: 2 }),
    providerCostUsdToMetacoins(0.2 * 2)
  );
});

test('generation multiplies provider cost by generation count', () => {
  assert.equal(
    toolPrice('three_d_image', {}, { quantity: 3 }),
    providerCostUsdToMetacoins(0.8 * 3)
  );
});

test('reconstruction multiplies provider cost by reconstruction count', () => {
  assert.equal(
    toolPrice('three_d_extract', {}, { quantity: 3 }),
    providerCostUsdToMetacoins(0.02 * 3)
  );
});

test('Nano Banana 2 uses the selected resolution tier', () => {
  assert.equal(
    toolPrice('photo_generate', { resolution: '0.5K' }),
    providerCostUsdToMetacoins(0.06)
  );
  assert.equal(
    toolPrice('photo_generate', { resolution: '4K' }),
    providerCostUsdToMetacoins(0.16)
  );
  assert.equal(
    toolPrice('photo_edit', { resolution: '2K' }),
    providerCostUsdToMetacoins(0.12)
  );
  assert.equal(
    toolPrice('photo_generate', { resolution: '1K', num_images: 3 }),
    providerCostUsdToMetacoins(0.08 * 3)
  );
});

test('image multiplies provider cost by image count', () => {
  assert.equal(
    toolPrice('document_ocr', {}, { images: 3 }),
    providerCostUsdToMetacoins(0.05 * 3)
  );
});

test('Seedance 2 Fast five-second generation follows the live RouterAI per-second tariff', () => {
  const model = getModelById('seedance_20_fast');
  const settings = {
    ...defaultModelSettings(model),
    duration: '5',
    resolution: '720p',
    generate_audio: 'true'
  };
  const price = calculateMetacoinPrice(model, settings);

  const providerPrice = confirmedProviderPriceFor(model.providerModelId);
  assert.equal(providerPrice.type, 'video_seconds');
  assert.equal(
    price,
    providerCostRublesToMetacoins(providerPrice.minRublesPerSecond * 5),
    `Seedance 2 Fast 5s costs ${price}`
  );
});
