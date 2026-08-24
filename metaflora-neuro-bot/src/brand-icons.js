import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { freeEntitlementFor, isFreeModelId } from './generation-access.js';

export const brandAssets = Object.freeze({
  openai: 'openai.svg',
  anthropic: 'claude-color.svg',
  google: 'gemini-color.svg',
  grok: 'grok.svg',
  kimi: 'kimi-color.svg',
  deepseek: 'deepseek-color.svg',
  qwen: 'qwen-color.svg',
  mistral: 'mistral-color.svg',
  minimax: 'minimax-color.svg',
  meta: 'metaai-color.svg',
  cohere: 'cohere-color.svg',
  nvidia: 'nvidia-color.svg',
  perplexity: 'perplexity-color.svg',
  bytedance: 'bytedance-color.svg',
  kling: 'kling-color.svg',
  sora: 'sora-color.svg',
  alibaba: 'alibaba-color.svg',
  runway: 'runway.svg',
  luma: 'luma-color.svg',
  hailuo: 'hailuo-color.svg',
  pika: 'pika.svg',
  suno: 'suno.svg',
  udio: 'udio-color.svg',
  elevenlabs: 'elevenlabs.svg',
  stability: 'stability-color.svg',
  yandex: 'yandex.svg',
  recraft: 'recraft.svg',
  midjourney: 'midjourney.svg',
  ideogram: 'ideogram.svg',
  flux: 'flux.svg',
  nanobanana: 'nanobanana-color.svg',
  topaz: 'topazlabs.svg',
  assemblyai: 'assemblyai-color.svg',
  vidu: 'vidu-color.svg',
  hunyuan: 'hunyuan-color.svg',
  happyhorse: 'happyhorse.svg',
  gigachat: 'local:gigachat.svg',
  kandinsky: 'local:kandinsky.png',
  ltx: 'local:ltx.png',
  genmo: 'local:genmo.png',
  higgsfield: 'local:higgsfield.png',
  heygen: 'local:heygen.png',
  longcat: 'longcat-color.svg',
  aion: 'aionlabs-color.svg',
  kwaikat: 'kwaikat.svg',
  zhipu: 'zhipu-color.svg',
  tencent: 'tencent-color.svg',
  openrouter: 'openrouter-color.svg',
  stepfun: 'stepfun-color.svg',
  deepgram: 'local:deepgram.png',
  cartesia: 'local:cartesia.png',
  magnific: 'local:magnific.svg',
  thinkingmachines: 'local:thinkingmachines.png',
  musespark: 'local:musespark.png',
  inclusionai: 'local:inclusionai.png',
  reka: 'local:reka.jpg',
  nexagi: 'local:nexagi.svg',
  sakana: 'local:sakana-symbol.png',
  dolphin: 'dolphin.svg',
  sourceful: 'local:sourceful.png',
  canopylabs: 'local:canopylabs.svg',
  hexgrad: 'local:hexgrad.png',
  sesame: 'local:sesame.svg',
  huggingface: 'huggingface-color.svg',
  ollama: 'ollama.svg',
  fal: 'fal-color.svg',
  metacoin: 'local:metacoin.png',
  krea: 'krea.svg',
  reve: 'reve.svg',
  microsoft: 'microsoft-color.svg',
  baidu: 'baidu-brand-color.svg',
  bria: 'briaai-color.svg',
  sync: 'sync.svg',
  pixverse: 'pixverse-color.svg',
  xiaomi: 'xiaomimimo.svg',
  arcee: 'arcee-color.svg',
  inception: 'inception.svg',
  upstage: 'upstage-color.svg',
  ibm: 'ibm.svg',
  meshy: 'meshy-color.svg',
  tripo: 'tripo-color.svg',
  imagineart: 'local:imagineart.svg',
  decart: 'local:decart.png',
  veed: 'local:veed.png',
  mirelo: 'local:mirelo.svg',
  sonilo: 'local:sonilo.png',
  perceptron: 'local:perceptron.png',
  hyper3d: 'local:hyper3d.png',
  yandexcolor: 'local:yandex-color.svg',
  sber: 'local:sber.svg',
  // Keep new brands appended: Telegram custom-emoji IDs are positional in the
  // existing pack, so inserting Fugu beside Sakana would remap every later ID.
  fugu: 'local:fugu-ultra.png'
});

const fallbackIcons = Object.freeze({
  openai: '🌀', anthropic: '✳️', google: '✦', grok: '◉', kimi: '🌙', deepseek: '🐋', qwen: '☁️',
  mistral: '🌬', minimax: '〽️', meta: '♾️', cohere: '◐', nvidia: '◩', perplexity: '⌘', bytedance: '📊',
  kling: '🌐', sora: '🌀', alibaba: '☁️', runway: '🎞', luma: '🌑', hailuo: '🌊', pika: '⚡', suno: '🎸', udio: '🎧',
  elevenlabs: '🎙', stability: '◒', yandex: 'Я', recraft: '🎨', midjourney: '⛵', ideogram: '🔤', flux: '🌈',
  nanobanana: '🍌', topaz: '🔎', assemblyai: '◫', vidu: '▶️', hunyuan: '🧊', happyhorse: '◉',
  gigachat: '🟢', kandinsky: '🎨', ltx: 'LTX', genmo: 'G', higgsfield: 'H', heygen: 'H',
  longcat: 'L', aion: 'A', kwaikat: 'K', zhipu: 'Z', tencent: 'T', openrouter: '↗', stepfun: 'S',
  deepgram: 'D', cartesia: 'C', magnific: 'M', thinkingmachines: 'T', musespark: 'M',
  inclusionai: 'I', reka: 'R', nexagi: 'N', sakana: '🐟', fugu: '🐡', dolphin: '🐬',
  sourceful: 'S', canopylabs: 'C', hexgrad: 'H', sesame: 'S',
  huggingface: '🤗', ollama: '🦙', fal: '▲', krea: 'K', reve: 'R', microsoft: '⊞', baidu: 'B',
  bria: 'B', sync: 'S', pixverse: 'P', xiaomi: 'M', arcee: 'A', inception: 'I', upstage: 'U', ibm: 'IBM',
  meshy: 'M', tripo: 'T', imagineart: 'I', decart: 'D', veed: 'V', mirelo: 'M', sonilo: 'S',
  perceptron: 'P', hyper3d: 'H', yandexcolor: 'Я', sber: '🟢', polza: 'P', generic: '🤖'
});

function includes(name, parts) {
  return parts.some((part) => name.includes(part));
}

export function brandForModel(model) {
  const id = model?.id ?? '';
  const name = model?.name?.toLowerCase() ?? '';
  if (includes(name, ['nano banana'])) return 'nanobanana';
  if (includes(name, ['krea'])) return 'krea';
  if (includes(name, ['reve'])) return 'reve';
  if (includes(name, ['microsoft mai', 'mai image'])) return 'microsoft';
  if (includes(name, ['ernie'])) return 'baidu';
  if (includes(name, ['imagineart'])) return 'imagineart';
  if (includes(name, ['hidream'])) return 'huggingface';
  if (includes(name, ['bria'])) return 'bria';
  if (includes(name, ['control light', 'controllight'])) return 'fal';
  if (includes(name, ['claude'])) return 'anthropic';
  if (includes(name, ['gemini', 'veo', 'lyria', 'chirp'])) return 'google';
  if (includes(name, ['yandex', 'alice'])) return 'yandexcolor';
  if (includes(name, ['gigachat', 'gigaam', 'kandinsky'])) return 'sber';
  if (includes(name, ['gpt', 'openai', 'o3', 'o4-mini'])) return 'openai';
  if (includes(name, ['whisper'])) return 'openai';
  if (includes(name, ['grok'])) return 'grok';
  if (includes(name, ['kimi'])) return 'kimi';
  if (includes(name, ['deepseek'])) return 'deepseek';
  if (includes(name, ['qwen'])) return 'qwen';
  if (includes(name, ['glm'])) return 'zhipu';
  if (includes(name, ['tencent'])) return 'tencent';
  if (includes(name, ['openrouter'])) return 'openrouter';
  if (includes(name, ['step 3', 'stepfun'])) return 'stepfun';
  if (includes(name, ['gemma'])) return 'google';
  if (includes(name, ['dolphin mistral'])) return 'dolphin';
  if (includes(name, ['mistral', 'devstral', 'codestral', 'voxtral'])) return 'mistral';
  if (includes(name, ['minimax'])) return 'minimax';
  if (includes(name, ['llama'])) return 'meta';
  if (includes(name, ['cohere', 'command', 'north mini'])) return 'cohere';
  if (includes(name, ['nvidia', 'nemotron', 'parakeet'])) return 'nvidia';
  if (includes(name, ['perplexity', 'sonar'])) return 'perplexity';
  if (includes(name, ['seedance', 'seedream'])) return 'bytedance';
  if (includes(name, ['seed 2.0'])) return 'bytedance';
  if (/\bkling\b/.test(name) || includes(name, ['kolors'])) return 'kling';
  if (includes(name, ['sora'])) return 'sora';
  if (includes(name, ['wan ', 'alibaba'])) return 'alibaba';
  if (includes(name, ['runway'])) return 'runway';
  if (includes(name, ['luma'])) return 'luma';
  if (includes(name, ['hailuo'])) return 'hailuo';
  if (includes(name, ['pika'])) return 'pika';
  if (includes(name, ['vidu'])) return 'vidu';
  if (includes(name, ['hunyuan'])) return 'hunyuan';
  if (includes(name, ['happyhorse'])) return 'happyhorse';
  if (includes(name, ['lucy 2.5'])) return 'decart';
  if (includes(name, ['veed lipsync'])) return 'veed';
  if (includes(name, ['sync 3 avatar'])) return 'sync';
  if (includes(name, ['scail'])) return 'fal';
  if (includes(name, ['pixverse'])) return 'pixverse';
  if (includes(name, ['ltx'])) return 'ltx';
  if (includes(name, ['mochi'])) return 'genmo';
  if (includes(name, ['higgsfield'])) return 'higgsfield';
  if (includes(name, ['heygen'])) return 'heygen';
  if (includes(name, ['longcat'])) return 'longcat';
  if (includes(name, ['aion'])) return 'aion';
  if (includes(name, ['kat-coder'])) return 'kwaikat';
  if (includes(name, ['suno'])) return 'suno';
  if (includes(name, ['udio'])) return 'udio';
  if (includes(name, ['elevenlabs'])) return 'elevenlabs';
  if (includes(name, ['генератор звуков'])) return 'elevenlabs';
  if (includes(name, ['клонирование голоса', 'voice clone'])) return 'elevenlabs';
  if (includes(name, ['stable audio'])) return 'stability';
  if (includes(name, ['mirelo'])) return 'mirelo';
  if (includes(name, ['controlfoley'])) return 'fal';
  if (includes(name, ['sonilo'])) return 'sonilo';
  if (includes(name, ['zonos'])) return 'huggingface';
  if (includes(name, ['async tts'])) return 'fal';
  if (includes(name, ['recraft'])) return 'recraft';
  if (includes(name, ['riverflow', 'sourceful'])) return 'sourceful';
  if (includes(name, ['midjourney'])) return 'midjourney';
  if (includes(name, ['ideogram'])) return 'ideogram';
  if (includes(name, ['flux'])) return 'flux';
  if (includes(name, ['topaz'])) return 'topaz';
  if (includes(name, ['assemblyai'])) return 'assemblyai';
  if (includes(name, ['deepgram'])) return 'deepgram';
  if (includes(name, ['orpheus'])) return 'canopylabs';
  if (includes(name, ['kokoro'])) return 'hexgrad';
  if (includes(name, ['sesame', 'csm 1b'])) return 'sesame';
  if (includes(name, ['cartesia'])) return 'cartesia';
  if (includes(name, ['magnific'])) return 'magnific';
  if (includes(name, ['thinking machines', 'inkling'])) return 'thinkingmachines';
  if (includes(name, ['muse spark'])) return 'musespark';
  if (includes(name, ['inclusionai', 'ring 2.6', 'ling 2.6', 'ling 3.0'])) return 'inclusionai';
  if (includes(name, ['xiaomi', 'mimo 2.5'])) return 'xiaomi';
  if (includes(name, ['perceptron'])) return 'perceptron';
  if (includes(name, ['trinity large', 'arcee'])) return 'arcee';
  if (includes(name, ['reka'])) return 'reka';
  if (includes(name, ['mercury 2', 'inception'])) return 'inception';
  if (includes(name, ['solar pro'])) return 'upstage';
  if (includes(name, ['granite', 'ibm'])) return 'ibm';
  if (includes(name, ['meshy'])) return 'meshy';
  if (includes(name, ['hyper3d', 'rodin'])) return 'hyper3d';
  if (includes(name, ['trellis'])) return 'huggingface';
  if (includes(name, ['tripo'])) return 'tripo';
  if (includes(name, ['pixal3d'])) return 'fal';
  if (includes(name, ['nex n2'])) return 'nexagi';
  if (includes(name, ['fugu'])) return 'fugu';
  if (includes(name, ['sakana', 'namazu'])) return 'sakana';
  if (includes(name, ['clarity', 'laguna'])) return 'huggingface';
  if (includes(name, ['ollama'])) return 'ollama';
  if (includes(name, ['удалить фон', 'замена лица', 'дорисовка', 'расширить кадр', 'редактор', 'фото-мастер'])) return 'fal';
  if (model?.brand && brandAssets[model.brand]) return model.brand;
  if (model?.family === 'openai') return 'openai';
  if (model?.family === 'anthropic') return 'anthropic';
  if (model?.family === 'google') return 'google';
  if (model?.family === 'xai') return 'grok';
  if (model?.family === 'kimi') return 'kimi';
  if (model?.family === 'deepseek') return 'deepseek';
  if (model?.family === 'qwen') return 'qwen';
  if (model?.family === 'search') return 'perplexity';
  if (id.startsWith('ru_')) return 'yandexcolor';
  const providerSlug = String(model?.iconProviderSlug ?? '').toLowerCase().replaceAll(/[^a-z0-9]/gu, '');
  if (providerSlug && (brandAssets[providerSlug] || fallbackIcons[providerSlug])) return providerSlug;
  const providerNamespace = String(model?.providerModelId ?? '').split('/')[0].toLowerCase().replaceAll(/[^a-z0-9]/gu, '');
  if (providerNamespace && (brandAssets[providerNamespace] || fallbackIcons[providerNamespace])) return providerNamespace;
  return 'huggingface';
}

export const defaultCustomEmojiPath = fileURLToPath(
  new URL('../config/model-emoji-ids.json', import.meta.url)
);

export function customEmojiPaths(environment = process.env) {
  const persistentPath = environment.RAILWAY_VOLUME_MOUNT_PATH
    ? resolve(environment.RAILWAY_VOLUME_MOUNT_PATH, 'model-emoji-ids.json')
    : null;
  const read = [...new Set([
    persistentPath,
    environment.METAFLORA_CUSTOM_EMOJI_FILE,
    defaultCustomEmojiPath
  ].filter(Boolean))];
  return {
    read,
    write: persistentPath ?? environment.METAFLORA_CUSTOM_EMOJI_FILE ?? defaultCustomEmojiPath
  };
}

let configuredIds = Object.freeze({});

const UI_EMOJI_FALLBACKS = Object.freeze({
  menu: '🏠',
  profile: '👤',
  models: '🤖',
  text: '💬',
  image: '🎨',
  video: '🎬',
  audio: '🎧',
  speech: '🎙',
  experimental: '🧪',
  tools: '🪄',
  settings: '⚙️',
  dialogs: '💬',
  support: '🧯',
  invite: '👥',
  three_d: '🧊',
  russian: '🇷🇺',
  back: '‹',
  generation: '✨',
  task: '📝',
  new: '🆕',
  metacoin: '🪙',
  sbp: '🔺',
  base: '🟦'
});

const topModelIds = new Set([
  'gpt_56_luna', 'gpt_56_luna_pro', 'gpt_56_terra', 'gpt_56_terra_pro',
  'claude_opus_5', 'claude_sonnet_5', 'gemini_36_flash', 'kimi_k3',
  'deepseek_v4_pro', 'qwen_37_max', 'sonar_research', 'minimax_m3',
  'nano_banana_pro', 'nano_banana_2', 'gpt_image_2', 'seedream_50_pro', 'ideogram_4', 'flux_2_pro', 'higgsfield_soul', 'midjourney',
  'seedream_50_lite',
  'seedance_20', 'seedance_25', 'flux_3', 'kling_30', 'polza_kling_v3_0r3wzac', 'veo_31_fast', 'sora_2', 'higgsfield_video',
  'suno_55', 'suno_sounds', 'polza_suno_sounds_1lwz9xr', 'eleven_music', 'udio',
  'eleven_voice', 'gpt_4o_transcribe', 'whisper_1',
  'topaz_image', 'topaz_video', 'remove_bg',
  'yandexgpt_51_pro', 'gigachat_2_max', 'kandinsky'
]);

// Confirmed provider release dates are audited before this list is changed.
// The rolling window is evaluated at deployment time so an old release does
// not keep the badge forever. Twenty-five days matches the product catalog policy.
const modelReleaseDates = Object.freeze({
  gpt_56_sol: '2026-07-09T00:00:00.000Z',
  gpt_56_sol_pro: '2026-07-09T00:00:00.000Z',
  ox_alpha: '2026-08-20T00:00:00.000Z',
  nemotron_35_asr_streaming: '2026-08-13T00:00:00.000Z',
  glm_53: '2026-08-18T00:00:00.000Z',
  gemini_37_flash: '2026-08-13T00:00:00.000Z',
  qwen_38_27b: '2026-08-14T00:00:00.000Z',
  hy_mt2_30b_a3b: '2026-08-20T00:00:00.000Z',
  hy_mt2_18b: '2026-08-20T00:00:00.000Z',
  grok_46: '2026-08-13T00:00:00.000Z',
  seedance_25: '2026-08-08T00:00:00.000Z',
  flux_3: '2026-08-04T00:00:00.000Z',
  seedream_50_pro: '2026-08-11T00:00:00.000Z',
  seedream_50_lite: '2026-08-11T00:00:00.000Z',
  claude_opus_5: '2026-07-24T17:29:40.000Z',
  minimax_h3: '2026-08-04T00:00:00.000Z',
  qwen_37_flash: '2026-07-27T22:16:01.000Z',
  ling_30_flash: '2026-07-23T14:56:20.000Z',
  longcat_20: '2026-07-20T13:37:38.000Z',
  seed_20_code: '2026-07-30T22:48:39.000Z',
  nemotron_35_lightning: '2026-08-11T12:52:31.000Z',
  solar_pro_4: '2026-08-10T14:20:36.000Z',
  muse_glimmer_30b: '2026-08-09T19:06:34.000Z',
  muse_spark_12: '2026-08-05T19:48:07.000Z',
  sakana_namazu: '2026-08-11T01:02:09.000Z',
  inkling_small: '2026-07-30T20:25:17.000Z',
  mai_image_25_pro: '2026-07-23T17:28:21.000Z',
  krea_2_large: '2026-07-20T19:15:31.000Z',
  krea_2_medium: '2026-07-20T19:15:28.000Z',
  krea_2_turbo: '2026-07-20T19:15:23.000Z',
  qwen_image_3: '2026-08-05T01:49:08.000Z',
  qwen_image_3_pro: '2026-08-05T01:49:08.000Z',
  grok_image_20: '2026-08-11T22:07:24.000Z',
  runway_gen_45: '2026-07-29T15:38:03.000Z',
  runway_aleph_2: '2026-07-29T15:38:04.000Z',
  grok_imagine_video_15: '2026-07-20T11:48:20.000Z',
  mai_voice_2_flash: '2026-07-23T15:54:40.000Z',
  qwen_audio_tts_flash: '2026-07-23T14:33:27.000Z',
  qwen_audio_tts_plus: '2026-07-23T14:33:27.000Z',
  fish_audio_s21_pro: '2026-07-29T19:35:32.000Z'
});

const NEW_MODEL_WINDOW_MS = 25 * 24 * 60 * 60 * 1000;
const textOnlyBrandIcons = new Set(['sakana', 'fugu']);

let configuredIdCount = -1;
for (const emojiPath of customEmojiPaths().read) {
  try {
    const parsed = JSON.parse(readFileSync(emojiPath, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue;
    const parsedIdCount = Object.keys(parsed).length;
    if (parsedIdCount > configuredIdCount) {
      configuredIds = Object.freeze(parsed);
      configuredIdCount = parsedIdCount;
    }
  } catch (error) {
    if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
  }
}

export function setCustomEmojiIds(ids) {
  configuredIds = Object.freeze({ ...ids });
}

export function customEmojiIdForBrand(brand) {
  const value = configuredIds[String(brand ?? '').trim()];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function uiEmojiId(key) {
  const normalized = String(key ?? '').trim();
  const value = configuredIds[`ui_${normalized}`];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function uiEmojiHtml(key, fallback = UI_EMOJI_FALLBACKS[key] ?? '✨') {
  const customEmojiId = uiEmojiId(key);
  return customEmojiId
    ? `<tg-emoji emoji-id="${customEmojiId}">${fallback}</tg-emoji>`
    : fallback;
}

export function buildUiButton(key, label, properties = {}) {
  const fallback = UI_EMOJI_FALLBACKS[key] ?? '✨';
  const customEmojiId = uiEmojiId(key);
  return {
    text: customEmojiId ? label : `${fallback} ${label}`,
    ...properties,
    ...(customEmojiId ? { icon_custom_emoji_id: customEmojiId } : {})
  };
}

export function isTopModel(modelId) {
  return topModelIds.has(modelId);
}

export function isNewModel(modelId, now = Date.now()) {
  const releasedAt = Date.parse(modelReleaseDates[modelId] ?? '');
  return Number.isFinite(releasedAt)
    && now >= releasedAt
    && now - releasedAt < NEW_MODEL_WINDOW_MS;
}

export function buildMetacoinButton(text, properties = {}) {
  const customEmojiId = configuredIds.metacoin;
  return {
    text: customEmojiId ? text : `🪙 ${text}`,
    ...properties,
    ...(customEmojiId ? { icon_custom_emoji_id: customEmojiId } : {})
  };
}

export function metacoinHtml() {
  return configuredIds.metacoin
    ? `<tg-emoji emoji-id="${configuredIds.metacoin}">🪙</tg-emoji>`
    : '🪙';
}

export function modelLogoHtml(model) {
  const brand = brandForModel(model);
  const customEmojiId = textOnlyBrandIcons.has(brand) ? null : configuredIds[brand];
  return customEmojiId
    ? `<tg-emoji emoji-id="${customEmojiId}">🤖</tg-emoji>`
    : fallbackIcons[brand] ?? fallbackIcons.generic;
}

export function buildModelButton(model, now = Date.now()) {
  const brand = brandForModel(model);
  const customEmojiId = textOnlyBrandIcons.has(brand) ? null : configuredIds[brand];
  const label = [
    `${isTopModel(model.id) ? '★ ' : ''}${model.name}`,
    isNewModel(model.id, now) ? '🆕' : '',
    isFreeModelId(model.id) ? '🆓' : '',
    !isFreeModelId(model.id) && freeEntitlementFor(model.id) ? '🎁' : ''
  ].filter(Boolean).join(' ');
  return {
    text: customEmojiId ? label : `${fallbackIcons[brand] ?? fallbackIcons.generic} ${label}`,
    callback_data: `model:${model.id}`,
    ...(customEmojiId ? { icon_custom_emoji_id: customEmojiId } : {})
  };
}

export function buildFamilyButton(familyId, name) {
  const familyBrands = {
    openai: 'openai', anthropic: 'anthropic', google: 'google', xai: 'grok', kimi: 'kimi',
    deepseek: 'deepseek', qwen: 'qwen', glm: 'zhipu', other: 'mistral', search: 'perplexity',
    russian: 'yandexcolor'
  };
  const brand = familyBrands[familyId] ?? 'generic';
  const customEmojiId = configuredIds[brand];
  return {
    text: customEmojiId ? name : `${fallbackIcons[brand] ?? fallbackIcons.generic} ${name}`,
    callback_data: `family:${familyId}`,
    ...(customEmojiId ? { icon_custom_emoji_id: customEmojiId } : {})
  };
}
