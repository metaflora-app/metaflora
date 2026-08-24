import test from 'node:test';
import assert from 'node:assert/strict';

import { listCatalogModels, defaultModelSettings } from '../src/model-catalog.js';
import { inputProfileFor } from '../src/model-profiles.js';
import {
  calculateMetacoinPrice,
  confirmedProviderModelMetacoinRange,
  formatMetacoinPrice,
  getMetacoinPriceRange,
  METACOIN_PRICING_POLICY,
  minimumTariffRublesPerMetacoin,
  providerCostRublesToMetacoins,
  providerCostUsdToMetacoins,
  repriceLegacyMetacoins
} from '../src/model-pricing.js';
import {
  confirmedProviderCostRangeRubles,
  confirmedProviderPriceFor,
  routeraiImageOutputTokensForSettings
} from '../src/provider-pricing.js';

test('provider cost is converted through the least expensive tariff metacoin', () => {
  const floor = minimumTariffRublesPerMetacoin();
  assert.ok(floor > 2.49 && floor < 2.50);
  assert.equal(providerCostRublesToMetacoins(0), 0);
  assert.equal(providerCostUsdToMetacoins(0), 0);
  assert.ok(providerCostUsdToMetacoins(0.15) > providerCostUsdToMetacoins(0.05));
});

test('a RouterAI route always uses the live RouterAI rate before a stale Polza snapshot', () => {
  const price = confirmedProviderPriceFor('qwen/qwen3-coder');

  assert.equal(price.provider, 'routerai');
  assert.equal(price.providerModelId, 'qwen/qwen3-coder');
  assert.equal(price.inputRublesPerMillion, 32.339229);
  assert.equal(price.outputRublesPerMillion, 107.79743);
});

test('RouterAI image-output pricing follows the provider model schedule, not a shared resolution multiplier', () => {
  assert.equal(
    routeraiImageOutputTokensForSettings({ resolution: '0.5K' }, 'google/gemini-3.1-flash-image'),
    747
  );
  assert.equal(
    routeraiImageOutputTokensForSettings({ resolution: '1K' }, 'google/gemini-3.1-flash-image'),
    1_120
  );
  assert.equal(
    routeraiImageOutputTokensForSettings({ resolution: '2K' }, 'google/gemini-3.1-flash-image'),
    1_680
  );
  assert.equal(
    routeraiImageOutputTokensForSettings({ resolution: '4K' }, 'google/gemini-3.1-flash-image'),
    2_520
  );
  assert.equal(
    routeraiImageOutputTokensForSettings({ resolution: '2K' }, 'google/gemini-3-pro-image'),
    1_120
  );
  assert.equal(
    routeraiImageOutputTokensForSettings({ resolution: '4K' }, 'google/gemini-3-pro-image'),
    2_000
  );
  assert.equal(
    routeraiImageOutputTokensForSettings({}, 'google/gemini-3.1-flash-lite-image'),
    1_120
  );
  assert.equal(
    routeraiImageOutputTokensForSettings({}, 'google/gemini-2.5-flash-image'),
    1_290
  );
  assert.equal(
    routeraiImageOutputTokensForSettings(
      { quality: 'low', aspect_ratio: '1:1' },
      'openai/gpt-5.4-image-2'
    ),
    272
  );
  assert.equal(
    routeraiImageOutputTokensForSettings(
      { quality: 'high', aspect_ratio: '16:9' },
      'openai/gpt-5.4-image-2'
    ),
    6_208
  );
});

test('FLUX.2 reserves RouterAI’s documented input and output megapixel billing', () => {
  const models = Object.fromEntries(listCatalogModels().map((model) => [model.id, model]));
  const model = models.polza_black_forest_labs_flux_2_pro_03wfchj;
  const price = confirmedProviderPriceFor(model.providerModelId);
  const range = confirmedProviderCostRangeRubles(price);

  assert.equal(range.kind, 'image_megapixels');
  assert.equal(price.provider, 'routerai');
  assert.equal(price.maxOutputMegapixels, 4);
  assert.equal(price.maxInputReferences, 8);
  assert.equal(
    calculateMetacoinPrice(model, {}, { imageReferences: 0 }),
    providerCostRublesToMetacoins(price.outputRublesPerMegapixel * 4)
  );
  assert.equal(
    calculateMetacoinPrice(model, {}, { imageReferences: 8 }),
    providerCostRublesToMetacoins(
      (price.outputRublesPerMegapixel * 4)
      + (price.inputRublesPerMegapixel * 4 * 8)
    )
  );
  assert.ok(range.maxRubles > range.minRubles);
});

test('RouterAI cards expose only supported MAI controls and the actual OpenAI image controls', () => {
  const models = Object.fromEntries(listCatalogModels().map((model) => [model.id, model]));
  const keys = (model) => inputProfileFor(model).map(({ key }) => key);

  assert.deepEqual(keys(models.mai_image_25), ['aspect_ratio']);
  assert.deepEqual(keys(models.mai_image_25_pro), ['aspect_ratio']);
  assert.deepEqual(keys(models.gpt_5_image), ['aspect_ratio', 'quality', 'num_images']);
  assert.deepEqual(keys(models.gpt_5_image_mini), ['aspect_ratio', 'quality', 'num_images']);
});

test('all catalog prices use the production 40 percent gross-margin policy', () => {
  assert.deepEqual(METACOIN_PRICING_POLICY, {
    usdRubRate: 90,
    failoverReservePercent: 2,
    polzaReservePercent: 6,
    paymentFeePercent: 3.5,
    targetGrossMarginPercent: 40
  });
  assert.equal(providerCostRublesToMetacoins(100), 82);
});

test('active Polza LLM routes use confirmed ruble token prices', () => {
  const models = Object.fromEntries(listCatalogModels().map((model) => [model.id, model]));
  const providerModelId = 'openai/gpt-5.6-terra';
  const price = confirmedProviderPriceFor(providerModelId);
  const expected = {
    min: providerCostRublesToMetacoins(
      (price.inputRublesPerMillion + price.outputRublesPerMillion) * 1_000 / 1_000_000
    ),
    max: providerCostRublesToMetacoins(
      (price.inputRublesPerMillion + price.outputRublesPerMillion) * 4_096 / 1_000_000
    )
  };

  assert.deepEqual(confirmedProviderModelMetacoinRange(providerModelId), expected);
  assert.deepEqual(getMetacoinPriceRange(models.gpt_56_terra), expected);
  assert.equal(calculateMetacoinPrice(models.gpt_56_terra), expected.max);
});

test('LLM pricing reserves the prompt upper bound and configured output ceiling', () => {
  const model = listCatalogModels().find(({ id }) => id === 'gpt_56_terra');
  const price = confirmedProviderPriceFor(model.providerModelId);
  const short = calculateMetacoinPrice(model, {}, { inputTokens: 100, outputTokens: 100 });
  const long = calculateMetacoinPrice(model, {}, { inputTokens: 8_000, outputTokens: 900 });

  assert.ok(long > short);
  assert.equal(
    long,
    providerCostRublesToMetacoins(
      ((price.inputRublesPerMillion * 8_000) + (price.outputRublesPerMillion * 900)) / 1_000_000
    )
  );
});

test('Seedance 2.0 uses the current RouterAI route price instead of the stale Polza ceiling', () => {
  const price = confirmedProviderPriceFor('bytedance/seedance-2');

  assert.equal(price.type, 'video_seconds');
  assert.equal(price.provider, 'routerai');
  assert.match(price.source, /routerai\.ru/u);
  assert.ok(price.minRublesPerSecond > 0);
  assert.equal(price.minRublesPerSecond, price.maxRublesPerSecond);
});

test('approved Seedance 2.0 retail tiers react once to duration and resolution', () => {
  const models = Object.fromEntries(listCatalogModels().map((model) => [model.id, model]));
  const seedance = models.seedance_20;

  const price = confirmedProviderPriceFor(seedance.providerModelId);
  assert.equal(
    calculateMetacoinPrice(seedance, { duration: '4', resolution: '720p' }),
    providerCostRublesToMetacoins(price.minRublesPerSecond * 4)
  );
  const range = getMetacoinPriceRange(seedance);
  assert.equal(range.min, providerCostRublesToMetacoins(price.minRublesPerSecond * 4));
  assert.ok(range.max > range.min);
});

test('image cards use vetted per-generation prices instead of snapshot ceilings', () => {
  const nanoBanana2 = confirmedProviderPriceFor('google/gemini-3.1-flash-image');
  const nanoBanana2Lite = confirmedProviderPriceFor('google/gemini-3.1-flash-lite-image');
  const gptImage2 = confirmedProviderPriceFor('openai/gpt-5.4-image-2');

  for (const price of [nanoBanana2, nanoBanana2Lite, gptImage2]) {
    const range = confirmedProviderCostRangeRubles(price);
    assert.equal(range.kind, 'image_output_tokens');
    assert.ok(range.minRubles > 0);
    assert.ok(range.maxRubles >= range.minRubles);
  }
});

test('technical price ceilings and ambiguous units are not billable request prices', () => {
  assert.equal(confirmedProviderCostRangeRubles({
    type: 'video_seconds',
    minRublesPerSecond: 12.825,
    maxRublesPerSecond: 1080
  }), null);
  assert.equal(confirmedProviderCostRangeRubles({
    type: 'unit_rubles',
    unit: 'minute_or_1000_characters',
    minRubles: 3278.47,
    maxRubles: 3278.47
  }), null);
});

test('RouterAI speech pricing uses the actual character count', () => {
  const model = listCatalogModels().find(({ id }) => id === 'grok_voice_tts_10');
  assert.ok(model);
  assert.equal(
    calculateMetacoinPrice(model, {}, { characters: 1_000 }),
    providerCostRublesToMetacoins(1.6062969)
  );
  assert.ok(
    calculateMetacoinPrice(model, {}, { characters: 2_000 })
      > calculateMetacoinPrice(model, {}, { characters: 1_000 })
  );
});

test('every active Polza alias has a confirmed static provider price', () => {
  const missing = listCatalogModels()
    .filter((model) => model.provider === 'polza')
    .flatMap((model) => model.providerModels ?? [])
    .filter((providerModelId) => !providerModelId.endsWith(':free'))
    .filter((providerModelId) => !confirmedProviderPriceFor(providerModelId));

  assert.deepEqual(missing, []);
});

test('MiniMax H3 price follows duration and extra reference images without a resolution multiplier', () => {
  const model = listCatalogModels().find(({ id }) => id === 'minimax_h3');
  assert.ok(model);
  const fiveSeconds = calculateMetacoinPrice(model, { duration: '5', resolution: '768P' });
  const fifteenSeconds = calculateMetacoinPrice(model, { duration: '15', resolution: '2K' });

  assert.equal(fiveSeconds, providerCostRublesToMetacoins(14 * 5));
  assert.equal(fifteenSeconds, providerCostRublesToMetacoins(14 * 15));
  assert.equal(
    calculateMetacoinPrice(model, { duration: '5', resolution: '768P' }),
    calculateMetacoinPrice(model, { duration: '5', resolution: '2K' })
  );
});

test('legacy fixed prices include the dedicated Polza reserve under the 40 percent production margin', () => {
  assert.equal(repriceLegacyMetacoins(12), 14);
  assert.equal(repriceLegacyMetacoins(0), 0);
  assert.throws(() => repriceLegacyMetacoins(-1), /non-negative/u);
});

test('every catalog model has a non-negative metacoin price', () => {
  const zeroPriced = [];
  for (const model of listCatalogModels()) {
    const range = getMetacoinPriceRange(model);
    assert.ok(Number.isInteger(range.min), `${model.id} has an integer minimum`);
    assert.ok(Number.isInteger(range.max), `${model.id} has an integer maximum`);
    assert.ok(range.min >= 0, `${model.id} has a non-negative minimum`);
    assert.ok(range.max >= range.min, `${model.id} has an ordered range`);
    assert.match(formatMetacoinPrice(model), /\d/);
    if (range.max === 0) zeroPriced.push(model.id);
  }
  assert.deepEqual(zeroPriced.sort(), [
    'gemma_4_31b_free',
    'gpt_oss_20b_free',
    'nemotron_3_nano_omni_free',
    'nemotron_3_super_free',
    'nemotron_3_ultra_free',
    'north_mini_code_free',
    'ox_alpha',
    'polza_google_lyria_3_clip_preview_067fyr0',
    'polza_google_lyria_3_pro_preview_190ii7b'
  ]);
});

test('RouterAI-only video prices use the verified per-second catalog contracts', () => {
  const models = Object.fromEntries(listCatalogModels().map((model) => [model.id, model]));

  for (const providerModelId of ['bytedance/seedance-2.5', 'black-forest-labs/flux-3-video']) {
    const price = confirmedProviderPriceFor(providerModelId);
    assert.equal(price.type, 'video_seconds');
    assert.equal(price.provider, 'routerai');
    assert.ok(price.minRublesPerSecond > 0);
    assert.equal(price.minRublesPerSecond, price.maxRublesPerSecond);
  }

  for (const model of [models.seedance_25, models.flux_3]) {
    const range = getMetacoinPriceRange(model);
    assert.ok(range.min > 0);
    assert.ok(range.max > range.min);
    assert.equal(formatMetacoinPrice(model), `${range.min}–${range.max}`);
  }
});

test('Seedance retail pricing preserves the approved 40 percent owner margin', () => {
  const models = Object.fromEntries(listCatalogModels().map((model) => [model.id, model]));

  for (const model of [models.seedance_20, models.seedance_25]) {
    const price = confirmedProviderPriceFor(model.providerModelId);
    const metacoins = calculateMetacoinPrice(model, { duration: '10', resolution: '720p' });
    assert.ok(metacoins >= providerCostRublesToMetacoins(price.minRublesPerSecond * 10));
  }
});

test('media price reacts to quantity, duration and resolution', () => {
  const models = Object.fromEntries(listCatalogModels().map((model) => [model.id, model]));
  const image = models.qwen_image_3;
  const video = models.seedance_20;

  const imageDefault = defaultModelSettings(image);
  const imageExpensive = { ...imageDefault, resolution: '4K', num_images: '4' };
  assert.ok(calculateMetacoinPrice(image, imageExpensive) > calculateMetacoinPrice(image, imageDefault));

  const videoDefault = { ...defaultModelSettings(video), duration: '4' };
  const videoExpensive = { ...videoDefault, duration: '15' };
  assert.ok(calculateMetacoinPrice(video, videoExpensive) > calculateMetacoinPrice(video, videoDefault));
});

test('displayed media range contains every supported settings combination', () => {
  const models = Object.fromEntries(listCatalogModels().map((model) => [model.id, model]));
  for (const id of ['seedance_20', 'gpt_image_2', 'polza_google_veo3_0n9pka0']) {
    const model = models[id];
    const range = getMetacoinPriceRange(model);
    const combinations = inputProfileFor(model).reduce(
      (items, definition) => items.flatMap((settings) => definition.values.map(
        ({ value }) => ({ ...settings, [definition.key]: value })
      )),
      [{}]
    );
    const prices = combinations.map((settings) => calculateMetacoinPrice(model, settings));
    assert.ok(range.min <= Math.min(...prices));
    assert.ok(range.max >= Math.max(...prices));
  }
});

test('all public cards have a confirmed paid price range', () => {
  const models = Object.fromEntries(listCatalogModels().map((model) => [model.id, model]));
  assert.match(formatMetacoinPrice(models.gpt_56_terra_pro), /–/);
  assert.match(formatMetacoinPrice(models.seedance_20), /–/);
});

test('tiered provider media prices follow the selected duration, resolution and sound', () => {
  const model = listCatalogModels().find(({ id }) => id === 'polza_bytedance_seedance_1_5_pro_1oqdnek');
  assert.ok(model);
  const cheap = calculateMetacoinPrice(model, { resolution: '480p', duration: '4', generate_audio: 'false' });
  const expensive = calculateMetacoinPrice(model, { resolution: '1080p', duration: '12', generate_audio: 'true' });
  assert.ok(cheap > 0);
  assert.ok(expensive > cheap);
});

test('fresh provider image and video tariffs use confirmed request units', () => {
  const models = Object.fromEntries(listCatalogModels().map((model) => [model.id, model]));

  for (const id of [
    'polza_google_veo3_0n9pka0',
    'polza_google_veo3_fast_0js3z3z',
    'polza_black_forest_labs_flux_2_pro_03wfchj',
    'polza_google_gemini_3_1_flash_image_preview_0dr952r',
    'polza_seedream_5_pro_text_to_image_14hhcqr'
  ]) {
    const model = models[id];
    const price = confirmedProviderPriceFor(model.providerModelId);
    assert.equal(price.provider, 'routerai', id);
    assert.ok(calculateMetacoinPrice(model) > 0, id);
  }
});
