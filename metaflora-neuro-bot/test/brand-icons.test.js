import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

import {
  brandForModel,
  buildMetacoinButton,
  buildModelButton,
  customEmojiPaths,
  defaultCustomEmojiPath,
  isNewModel,
  metacoinHtml,
  buildUiButton,
  uiEmojiHtml,
  modelLogoHtml,
  setCustomEmojiIds
} from '../src/brand-icons.js';

const DIAMOND_PLACEHOLDER = /[◆◇◈◊⬥⬦♦▫�]/u;

test('bundled custom emoji config is resolved inside the bot package', () => {
  assert.match(defaultCustomEmojiPath, /\/config\/model-emoji-ids\.json$/);
  assert.equal(existsSync(defaultCustomEmojiPath), true);
});

test('a cold import loads the bundled custom emoji ids without an environment override', () => {
  const environment = { ...process.env };
  delete environment.METAFLORA_CUSTOM_EMOJI_FILE;
  delete environment.RAILWAY_VOLUME_MOUNT_PATH;
  delete environment.RAILWAY_PROJECT_ID;
  const result = spawnSync(process.execPath, [
    '--input-type=module',
    '--eval',
    "import { buildModelButton } from './src/brand-icons.js'; console.log(buildModelButton({ id: 'gemini_36_flash', name: 'Gemini 3.6 Flash', family: 'google' }).icon_custom_emoji_id ?? '')"
  ], {
    cwd: process.cwd(),
    env: environment,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr);
  const bundled = JSON.parse(readFileSync(defaultCustomEmojiPath, 'utf8'));
  assert.equal(result.stdout.trim(), bundled.google);
});

test('Railway reads updates from its writable volume before bundled config', () => {
  assert.deepEqual(customEmojiPaths({
    RAILWAY_VOLUME_MOUNT_PATH: '/data',
    METAFLORA_CUSTOM_EMOJI_FILE: '/app/config/model-emoji-ids.json'
  }), {
    read: [
      '/data/model-emoji-ids.json',
      '/app/config/model-emoji-ids.json',
      defaultCustomEmojiPath
    ],
    write: '/data/model-emoji-ids.json'
  });
});

test('brand icons are shared by model families and become Telegram custom emoji icons', () => {
  const model = { id: 'gemini_36_flash', name: 'Gemini 3.6 Flash', category: 'llm', family: 'google' };
  assert.equal(brandForModel(model), 'google');

  setCustomEmojiIds({ google: 'custom-google-id' });
  assert.deepEqual(buildModelButton(model), {
    text: '★ Gemini 3.6 Flash',
    callback_data: 'model:gemini_36_flash',
    icon_custom_emoji_id: 'custom-google-id'
  });
  setCustomEmojiIds({});
});

test('top models keep their brand logo and use a star instead of navigation colors', () => {
  setCustomEmojiIds({ openai: 'custom-openai-id', minimax: 'custom-minimax-id' });
  const top = buildModelButton({ id: 'gpt_56_terra', name: 'GPT-5.6 Terra', category: 'llm', family: 'openai' });
  const minimax = buildModelButton({ id: 'minimax_m3', name: 'MiniMax M3', category: 'llm', family: 'other' });
  const regular = buildModelButton({ id: 'gpt_54', name: 'GPT-5.4', category: 'llm', family: 'openai' });

  assert.equal(top.text, '★ GPT-5.6 Terra');
  assert.equal(top.icon_custom_emoji_id, 'custom-openai-id');
  assert.equal(top.style, undefined);
  assert.equal(minimax.text, '★ MiniMax M3');
  assert.equal(minimax.icon_custom_emoji_id, 'custom-minimax-id');
  assert.equal(regular.text, 'GPT-5.4');
  setCustomEmojiIds({});
});

test('Suno Sounds keeps the popular-model star', () => {
  assert.match(buildModelButton({
    id: 'suno_sounds',
    name: 'Suno Sounds',
    category: 'audio'
  }).text, /★ Suno Sounds/u);
});

test('confirmed releases get a new badge inside the rolling window without inventing unavailable models', () => {
  setCustomEmojiIds({ anthropic: 'custom-anthropic-id', thinkingmachines: 'custom-thinking-id' });
  const badgeNow = Date.parse('2026-08-12T00:00:00.000Z');
  const minimaxBadgeNow = Date.parse('2026-08-06T00:00:00.000Z');

  assert.equal(isNewModel('claude_opus_5', badgeNow), true);
  assert.equal(isNewModel('inkling_small', badgeNow), true);
  assert.equal(isNewModel('seedance_25', badgeNow), true);
  assert.equal(isNewModel('flux_3', badgeNow), true);
  assert.equal(isNewModel('seedream_50_pro', badgeNow), true);
  assert.equal(isNewModel('minimax_h3', minimaxBadgeNow), true);
  assert.equal(
    buildModelButton({ id: 'claude_opus_5', name: 'Claude Opus 5', category: 'llm', family: 'anthropic' }, badgeNow).text,
    '★ Claude Opus 5 🆕'
  );
  assert.equal(
    buildModelButton({ id: 'inkling_small', name: 'Thinking Machines Inkling', category: 'beta' }, badgeNow).text,
    'Thinking Machines Inkling 🆕'
  );

  setCustomEmojiIds({});
});

test('metacoin buttons preserve an explicit Telegram style', () => {
  setCustomEmojiIds({ metacoin: 'metacoin-id' });
  assert.deepEqual(buildMetacoinButton('пополнить баланс', { style: 'primary' }), {
    text: 'пополнить баланс',
    style: 'primary',
    icon_custom_emoji_id: 'metacoin-id'
  });
  assert.equal(metacoinHtml(), '<tg-emoji emoji-id="metacoin-id">🪙</tg-emoji>');
  setCustomEmojiIds({});
});

test('classic interface symbols have a custom-emoji path without changing model logos', () => {
  setCustomEmojiIds({ ui_profile: 'ui-profile-id', google: 'brand-google-id' });
  assert.deepEqual(buildUiButton('profile', 'профиль', { callback_data: 'task:profile' }), {
    text: 'профиль',
    callback_data: 'task:profile',
    icon_custom_emoji_id: 'ui-profile-id'
  });
  assert.equal(uiEmojiHtml('profile'), '<tg-emoji emoji-id="ui-profile-id">👤</tg-emoji>');
  assert.equal(
    modelLogoHtml({ id: 'gemini_36_flash', name: 'Gemini 3.6 Flash', family: 'google' }),
    '<tg-emoji emoji-id="brand-google-id">🤖</tg-emoji>'
  );
  setCustomEmojiIds({});
});

test('unknown provider models use the Hugging Face mark instead of a robot or provider placeholder', () => {
  setCustomEmojiIds({ huggingface: 'huggingface-id' });
  const model = { id: 'unknown_polza_model', name: 'Aiesa Mini', category: 'llm', provider: 'polza' };
  assert.equal(brandForModel(model), 'huggingface');
  assert.equal(buildModelButton(model).icon_custom_emoji_id, 'huggingface-id');
  setCustomEmojiIds({});
});

test('RouterAI direct releases use their verified publisher marks instead of Hugging Face', () => {
  const releases = [
    [{ id: 'glm_53', name: 'GLM 5.3', providerModelId: 'z-ai/glm-5.3' }, 'zhipu'],
    [{ id: 'qwen_37_flash', name: 'Qwen 3.7 Flash', providerModelId: 'qwen/qwen3.7-flash' }, 'qwen'],
    [{ id: 'ling_30_flash', name: 'InclusionAI Ling 3.0 Flash', providerModelId: 'inclusionai/ling-3.0-flash' }, 'inclusionai'],
    [{ id: 'longcat_20', name: 'LongCat 2.0', providerModelId: 'meituan/longcat-2.0' }, 'longcat'],
    [{ id: 'reka_flash_3', name: 'Reka Flash 3', providerModelId: 'rekaai/reka-flash-3' }, 'reka'],
    [{ id: 'seed_20_code', name: 'ByteDance Seed 2.0 Code', providerModelId: 'bytedance-seed/seed-2.0-code' }, 'bytedance'],
    [{ id: 'nemotron_35_lightning', name: 'NVIDIA Nemotron 3.5 Lightning', providerModelId: 'nvidia/nemotron-3.5-lightning' }, 'nvidia'],
    [{ id: 'solar_pro_4', name: 'Solar Pro 4', providerModelId: 'upstage/solar-pro4' }, 'upstage'],
    [{ id: 'muse_glimmer_30b', name: 'Meta Muse Glimmer 30B', providerModelId: 'meta/muse-glimmer-30b' }, 'meta'],
    [{ id: 'muse_spark_12', name: 'Meta Muse Spark 1.2', providerModelId: 'meta/muse-spark-1.2' }, 'musespark'],
    [{ id: 'dolphin_mistral_venice', name: 'Dolphin Mistral Venice', providerModelId: 'cognitivecomputations/dolphin-mistral-24b-venice-edition' }, 'dolphin'],
    [{ id: 'sakana_namazu', name: 'Sakana Namazu', providerModelId: 'sakana/namazu' }, 'sakana'],
    [{ id: 'inkling_small', name: 'Thinking Machines Inkling Small', providerModelId: 'thinkingmachines/inkling-small' }, 'thinkingmachines']
  ];

  for (const [model, expectedBrand] of releases) {
    assert.equal(brandForModel(model), expectedBrand, model.id);
  }
});

test('GLM 5.3 receives the rolling new badge from its verified release date', () => {
  assert.equal(isNewModel('glm_53', Date.parse('2026-08-20T00:00:00.000Z')), true);
  assert.equal(isNewModel('glm_53', Date.parse('2026-09-13T00:00:00.000Z')), false);
});

test('Fugu uses a clean pufferfish mark instead of the outlined Sakana print', () => {
  const model = { id: 'fugu_ultra', name: 'Fugu Ultra', providerModelId: 'sakana/fugu-ultra' };
  assert.equal(brandForModel(model), 'fugu');
  setCustomEmojiIds({ sakana: 'outlined-sakana-id', fugu: 'outlined-fugu-id' });
  const button = buildModelButton(model);
  assert.equal(button.icon_custom_emoji_id, undefined);
  assert.match(button.text, /^🐡 /u);
  assert.equal(modelLogoHtml(model), '🐡');
  setCustomEmojiIds({});
});

test('Sakana Namazu uses a clean fish mark instead of the outlined local print', () => {
  const model = { id: 'sakana_namazu', name: 'Sakana Namazu', providerModelId: 'sakana/namazu' };
  assert.equal(brandForModel(model), 'sakana');
  setCustomEmojiIds({ sakana: 'outlined-sakana-id' });
  const button = buildModelButton(model);
  assert.equal(button.icon_custom_emoji_id, undefined);
  assert.match(button.text, /^🐟 /u);
  assert.equal(modelLogoHtml(model), '🐟');
  setCustomEmojiIds({});
});

test('RouterAI media releases keep official publisher branding across adapters', () => {
  const releases = [
    [{ id: 'flux_2_max', name: 'FLUX.2 Max', providerModelId: 'black-forest-labs/flux.2-max' }, 'flux'],
    [{ id: 'mai_image_25', name: 'MAI Image 2.5', providerModelId: 'microsoft/mai-image-2.5' }, 'microsoft'],
    [{ id: 'riverflow_25_pro', name: 'Riverflow 2.5 Pro', providerModelId: 'sourceful/riverflow-v2.5-pro' }, 'sourceful'],
    [{ id: 'wan_27', name: 'Wan 2.7', providerModelId: 'alibaba/wan-2.7' }, 'alibaba'],
    [{ id: 'veo_31_lite', name: 'Veo 3.1 Lite', providerModelId: 'google/veo-3.1-lite' }, 'google'],
    [{ id: 'kling_video_o1', name: 'Kling Video O1', providerModelId: 'kwaivgi/kling-video-o1' }, 'kling'],
    [{ id: 'orpheus_3b', name: 'Orpheus 3B', providerModelId: 'canopylabs/orpheus-3b-0.1-ft' }, 'canopylabs'],
    [{ id: 'kokoro_82m', name: 'Kokoro 82M', providerModelId: 'hexgrad/kokoro-82m' }, 'hexgrad'],
    [{ id: 'sesame_csm_1b', name: 'Sesame CSM 1B', providerModelId: 'sesame/csm-1b' }, 'sesame']
  ];

  for (const [model, expectedBrand] of releases) {
    assert.equal(brandForModel(model), expectedBrand, model.id);
  }
});

test('text custom emoji always uses a Telegram-valid emoji fallback', () => {
  setCustomEmojiIds({ higgsfield: 'custom-higgsfield-id' });
  assert.equal(
    modelLogoHtml({ id: 'higgsfield_video', name: 'Higgsfield Video', category: 'video' }),
    '<tg-emoji emoji-id="custom-higgsfield-id">🤖</tg-emoji>'
  );
  setCustomEmojiIds({});
});

test('model fallbacks never expose geometric diamond placeholders', () => {
  setCustomEmojiIds({});
  const models = [
    { id: 'deepseek_v4_pro', name: 'DeepSeek V4 Pro', category: 'llm', family: 'deepseek' },
    { id: 'recraft_41', name: 'Recraft 4.1', category: 'image' },
    { id: 'flux_2_pro', name: 'FLUX 2 Pro', category: 'image' },
    { id: 'unknown', name: 'Неизвестная модель', category: 'experimental' }
  ];

  for (const model of models) {
    assert.doesNotMatch(buildModelButton(model).text, DIAMOND_PLACEHOLDER);
    assert.doesNotMatch(modelLogoHtml(model), DIAMOND_PLACEHOLDER);
  }
});
