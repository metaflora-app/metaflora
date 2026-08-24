import { providerCostUsdToMetacoins } from './model-pricing.js';
import { TOOL_CATALOG } from './tool-catalog.js';

const CATEGORY_MAP = Object.freeze({
  photo: 'image',
  video: 'video',
  audio: 'audio',
  document: 'document',
  '3d': '3d'
});

export const TOOL_MODEL_CATEGORIES = deepFreeze([
  { id: 'image', name: 'фото' },
  { id: 'video', name: 'видео' },
  { id: 'audio', name: 'аудио' },
  { id: 'document', name: 'документы и данные' },
  { id: '3d', name: '3D' }
]);

const INPUT_LABELS = Object.freeze({
  image: 'фото',
  images: 'одно или несколько фото',
  text: 'текст или описание',
  person_image: 'фото человека',
  garment_image: 'фото одежды',
  video: 'видео',
  audio: 'аудиофайл',
  reference_images: 'референсные изображения',
  keyterms: 'слова и имена для точного распознавания',
  reference_audio: 'образец голоса',
  reference_text: 'расшифровка образца голоса',
  media: 'аудио- или видеофайл',
  document: 'документ',
  documents: 'один или несколько документов',
  file: 'файл',
  files: 'один или несколько файлов',
  spreadsheet: 'таблица',
  url: 'ссылка',
  urls: 'одна или несколько ссылок',
  masks: 'маски нужных областей',
  points: 'точки на объекте',
  boxes: 'рамки вокруг объектов'
});

const VALUE_LABELS = Object.freeze({
  jpeg: 'JPEG',
  png: 'PNG',
  wav: 'WAV',
  mp3: 'MP3',
  pcm_44100: 'PCM · 44,1 кГц',
  mp3_44100_128: 'MP3 · 128 кбит/с',
  opus_48000_128: 'Opus · 128 кбит/с',
  low_quality: 'быстрое',
  medium_quality: 'обычное',
  high_quality: 'высокое',
  best_quality: 'максимальное',
  upper_body: 'верхняя часть одежды',
  lower_body: 'нижняя часть одежды',
  dresses: 'платье',
  standard: 'обычная сетка',
  lowpoly: 'мало полигонов',
  quad: 'четырёхугольники',
  triangle: 'треугольники',
  off: 'выключена',
  auto: 'автоматически',
  on: 'включена',
  preview: 'предпросмотр',
  full: 'готовая модель',
  all: 'все дорожки',
  vocals: 'вокал',
  drums: 'ударные',
  bass: 'бас',
  other: 'остальное',
  guitar: 'гитара',
  piano: 'фортепиано',
  Transparent: 'прозрачный',
  Black: 'чёрный',
  White: 'белый',
  Gray: 'серый',
  Red: 'красный',
  Green: 'зелёный',
  Blue: 'синий',
  Yellow: 'жёлтый',
  Cyan: 'голубой',
  Magenta: 'пурпурный',
  Orange: 'оранжевый',
  mp4_h265: 'MP4 · H.265',
  mp4_h264: 'MP4 · H.264',
  webm_vp9: 'WebM · VP9',
  mov_h264: 'MOV · H.264',
  mov_h265: 'MOV · H.265',
  mov_proresks: 'MOV · ProRes',
  mkv_h264: 'MKV · H.264',
  mkv_h265: 'MKV · H.265',
  mkv_vp9: 'MKV · VP9',
  mkv_mpeg4: 'MKV · MPEG-4',
  gif: 'GIF',
  F5_TTS: 'F5-TTS',
  E2_TTS: 'E2-TTS',
  htdemucs: 'Demucs · стандартный',
  htdemucs_ft: 'Demucs · точный',
  htdemucs_6s: 'Demucs · 6 дорожек',
  hdemucs_mmi: 'Demucs · MMI',
  mdx: 'MDX · стандартный',
  mdx_extra: 'MDX · расширенный',
  mdx_q: 'MDX · быстрый',
  mdx_extra_q: 'MDX · расширенный быстрый'
});

const toolsById = new Map(TOOL_CATALOG.map((tool) => [tool.id, tool]));

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

function modelFor(tool) {
  return deepFreeze({
    id: tool.id,
    name: tool.name,
    category: CATEGORY_MAP[tool.category],
    subcategory: tool.subcategory,
    brand: tool.brand,
    customEmojiKey: tool.customEmojiKey,
    customEmojiFallback: tool.customEmojiFallback,
    logoFallback: tool.logoFallback,
    source: 'tool',
    availability: tool.active ? 'available' : 'unavailable',
    active: tool.active
  });
}

export const TOOL_MODELS = deepFreeze(TOOL_CATALOG.map(modelFor));
const modelsById = new Map(TOOL_MODELS.map((model) => [model.id, model]));

function resolveTool(toolOrModel) {
  const id = typeof toolOrModel === 'string' ? toolOrModel : toolOrModel?.id;
  const tool = toolsById.get(id);
  if (!tool) throw new TypeError('Unknown tool model.');
  return tool;
}

export function getToolModelById(id) {
  return modelsById.get(id) ?? null;
}

export function listToolModels() {
  return TOOL_MODELS.filter(({ active }) => active);
}

function decimalLabel(value) {
  return String(value).replace('.', ',');
}

function enumLabel(value) {
  const mappedKey = String(value).replaceAll('-', '_');
  if (VALUE_LABELS[value] || VALUE_LABELS[mappedKey]) {
    return VALUE_LABELS[value] ?? VALUE_LABELS[mappedKey];
  }
  if (/^\d+:\d+$/.test(String(value))) return String(value);
  return String(value).replaceAll('_', ' ');
}

function alignedValue(min, max, step, ratio) {
  const raw = min + ((max - min) * ratio);
  const aligned = min + (Math.round((raw - min) / step) * step);
  return Number(Math.min(max, Math.max(min, aligned)).toFixed(8));
}

function numberValues(key, setting) {
  const { min, max, step, default: defaultValue } = setting;
  const known = {
    seed: [0, 1, 42, 100, 1000],
    mask_expansion: [0, 5, 10, 15, 20, 30, 40, 50],
    duration_seconds: [0.5, 1, 2, 3, 5, 8, 10, 15, 22],
    target_polycount: [1000, 10000, 30000, 50000, 100000, 200000, 300000]
  }[key];
  if (known) return known;

  const count = Math.floor((max - min) / step) + 1;
  if (count <= 12) {
    return Array.from({ length: count }, (_, index) =>
      Number((min + (index * step)).toFixed(8))
    );
  }
  return [min, alignedValue(min, max, step, 0.25), defaultValue,
    alignedValue(min, max, step, 0.75), max];
}

function optionsFor(key, setting) {
  if (setting.type === 'boolean') {
    return [
      { value: false, label: 'нет' },
      { value: true, label: 'да' }
    ];
  }
  if (setting.type === 'enum') {
    return setting.values.map((value) => ({ value, label: enumLabel(value) }));
  }
  if (setting.type === 'number') {
    return [...new Set(numberValues(key, setting))]
      .sort((left, right) => left - right)
      .map((value) => ({ value, label: decimalLabel(value) }));
  }
  return [];
}

function settingProfile(key, setting) {
  return deepFreeze({
    key,
    label: setting.label,
    type: setting.type,
    defaultValue: setting.default,
    ...(setting.type === 'number'
      ? { min: setting.min, max: setting.max, step: setting.step }
      : {}),
    values: optionsFor(key, setting)
  });
}

const settingsById = new Map(TOOL_CATALOG.map((tool) => [
  tool.id,
  deepFreeze(Object.entries(tool.settings).map(([key, setting]) =>
    settingProfile(key, setting)
  ))
]));

export function toolSettingsProfileFor(toolOrModel) {
  const tool = resolveTool(toolOrModel);
  return settingsById.get(tool.id);
}

export function defaultToolSettings(toolOrModel) {
  return Object.fromEntries(
    toolSettingsProfileFor(toolOrModel).map(({ key, defaultValue }) => [key, defaultValue])
  );
}

function constraintHints(tool) {
  const hints = [];
  const { constraints } = tool.input;
  if (constraints.durationSeconds?.max) {
    hints.push(`видео длительностью до ${constraints.durationSeconds.max} секунд`);
  }
  for (const [key, constraint] of Object.entries(constraints)) {
    if (key === 'durationSeconds') continue;
    if (constraint.exactlyOne && constraint.types?.includes('audio') && constraint.types?.includes('video')) {
      hints.push('один аудио- или видеофайл');
    } else if (constraint.min) {
      hints.push(`${INPUT_LABELS[key] ?? 'файлы'}: не меньше ${constraint.min}`);
    }
  }
  return hints;
}

export function toolInputHints(toolOrModel) {
  const tool = resolveTool(toolOrModel);
  return {
    required: tool.input.required.map((key) => INPUT_LABELS[key] ?? 'файл'),
    optional: tool.input.optional.map((key) => INPUT_LABELS[key] ?? 'дополнительный файл'),
    constraints: constraintHints(tool)
  };
}

function numeric(value, fallback) {
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function durationSeconds(tool, settings, usage, fallback = 1) {
  return numeric(
    usage.durationSeconds ?? settings.duration_seconds ?? settings.duration,
    fallback
  );
}

function unitFactor(tool, settings, usage) {
  switch (tool.pricing.unit) {
    case 'image':
      return Math.max(
        1,
        numeric(usage.images ?? usage.quantity ?? settings.num_images, 1)
      );
    case 'megapixel':
      return Math.max(0.01, numeric(usage.megapixels ?? settings.megapixels, 1));
    case '5_input_seconds':
      return Math.max(0.01, durationSeconds(tool, settings, usage) / 5);
    case 'input_second':
    case 'output_second':
    case 'compute_second':
      return Math.max(0.01, durationSeconds(tool, settings, usage));
    case 'input_minute':
      if (usage.durationSeconds !== undefined) {
        return Math.max(0.01, numeric(usage.durationSeconds, 60) / 60);
      }
      return Math.max(0.01, numeric(usage.durationMinutes, 1));
    case 'output_audio_minute':
      if (usage.durationSeconds !== undefined) {
        return Math.max(0.01, numeric(usage.durationSeconds, 60) / 60);
      }
      if (settings.music_length_ms !== undefined) {
        return Math.max(0.01, numeric(settings.music_length_ms, 60_000) / 60_000);
      }
      return Math.max(0.01, numeric(usage.durationMinutes, 1));
    case '1000_characters':
      return Math.max(0.001, numeric(usage.characters, 1000) / 1000);
    case 'million_input_or_output_tokens':
      return Math.max(
        0.000001,
        numeric(usage.inputTokens, 0) / 1_000_000
          + numeric(usage.outputTokens, 0) / 1_000_000
      );
    case 'video':
    case 'video_up_to_40_seconds':
    case 'generation':
    case 'reconstruction':
      return Math.max(1, numeric(usage.quantity, 1));
    default:
      return 1;
  }
}

function rangePosition(tool, settings) {
  const candidates = ['model', 'upscale_factor', 'resolution', 'quality', 'generate_audio']
    .map((key) => [key, tool.settings[key], settings[key]])
    .filter(([, definition, value]) => definition && value !== undefined);
  if (candidates.length === 0) return 0;

  const positions = candidates.map(([, definition, value]) => {
    if (definition.type === 'boolean') return value ? 1 : 0;
    if (definition.type === 'enum') {
      const index = definition.values.indexOf(value);
      return index < 0 ? 0 : index / Math.max(1, definition.values.length - 1);
    }
    return (numeric(value, definition.default) - definition.min)
      / Math.max(definition.step, definition.max - definition.min);
  });
  return Math.min(1, Math.max(0, positions.reduce((sum, value) => sum + value, 0) / positions.length));
}

function priceAmount(tool, settings) {
  if (tool.pricing.type === 'fixed') return tool.pricing.amount;
  if (tool.pricing.type === 'tiered') {
    const selected = String(settings[tool.pricing.setting]);
    const amount = tool.pricing.amounts[selected] ?? tool.pricing.amounts.default;
    if (!Number.isFinite(amount)) {
      throw new TypeError(`Tool pricing has no tier for "${selected}".`);
    }
    return amount;
  }
  const position = rangePosition(tool, settings);
  return tool.pricing.min + ((tool.pricing.max - tool.pricing.min) * position);
}

export function calculateToolMetacoinPrice(toolOrModel, settings = {}, usage = {}) {
  const tool = resolveTool(toolOrModel);
  const completeSettings = { ...defaultToolSettings(tool), ...settings };
  const providerCost = priceAmount(tool, completeSettings)
    * unitFactor(tool, completeSettings, usage);
  return providerCostUsdToMetacoins(providerCost);
}

function unitRange(tool) {
  const quantity = tool.settings.num_images;
  if (tool.pricing.unit === 'image' && quantity?.type === 'number') {
    return { min: quantity.min, max: quantity.max };
  }
  const duration = tool.settings.duration_seconds ?? tool.settings.duration;
  if (duration?.type === 'number') return { min: duration.min, max: duration.max };
  if (duration?.type === 'enum') {
    const values = duration.values
      .map((value) => numeric(value, Number.NaN))
      .filter(Number.isFinite);
    if (values.length > 0) return { min: Math.min(...values), max: Math.max(...values) };
  }
  const maximum = tool.input.constraints.durationSeconds?.max;
  if (maximum && ['input_second', 'output_second', 'compute_second'].includes(tool.pricing.unit)) {
    return { min: 1, max: maximum };
  }
  if (maximum && tool.pricing.unit === '5_input_seconds') {
    return { min: 0.2, max: maximum / 5 };
  }
  return { min: 1, max: 1 };
}

export function getToolMetacoinPriceRange(toolOrModel) {
  const tool = resolveTool(toolOrModel);
  const factor = unitRange(tool);
  const amounts = tool.pricing.type === 'tiered'
    ? Object.values(tool.pricing.amounts).filter(Number.isFinite)
    : [];
  const minimum = tool.pricing.type === 'fixed'
    ? tool.pricing.amount
    : tool.pricing.type === 'tiered'
      ? Math.min(...amounts)
      : tool.pricing.min;
  const maximum = tool.pricing.type === 'fixed'
    ? tool.pricing.amount
    : tool.pricing.type === 'tiered'
      ? Math.max(...amounts)
      : tool.pricing.max;
  const minUsd = minimum * factor.min;
  const maxUsd = maximum * factor.max;
  return {
    min: providerCostUsdToMetacoins(minUsd),
    max: providerCostUsdToMetacoins(maxUsd)
  };
}

export function formatToolMetacoinPrice(toolOrModel, settings, usage) {
  if (settings || usage) {
    return String(calculateToolMetacoinPrice(toolOrModel, settings, usage));
  }
  const { min, max } = getToolMetacoinPriceRange(toolOrModel);
  return min === max ? String(min) : `${min}–${max}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function highlightedDescription(card) {
  const source = String(card.description);
  const highlights = Array.isArray(card.highlights)
    ? card.highlights.filter((phrase) => source.includes(phrase))
    : [];
  if (highlights.length === 0) return escapeHtml(source);

  const ordered = [...highlights].sort((left, right) => right.length - left.length);
  const pattern = new RegExp(
    ordered.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
    'g'
  );
  let cursor = 0;
  let result = '';
  for (const match of source.matchAll(pattern)) {
    result += escapeHtml(source.slice(cursor, match.index));
    result += `<b>${escapeHtml(match[0])}</b>`;
    cursor = match.index + match[0].length;
  }
  return result + escapeHtml(source.slice(cursor));
}

function launchPrompt(instruction) {
  const normalized = String(instruction)
    .trim()
    .replace(/[.!?…]+$/u, '');
  return `${normalized}👇`;
}

export function buildToolCard(toolOrModel) {
  const tool = resolveTool(toolOrModel);

  return {
    text: `<b>${escapeHtml(tool.card.title)}</b>\n\n${highlightedDescription(tool.card)}\n\n${escapeHtml(launchPrompt(tool.card.instruction))}\n\n<b>стоимость:</b> ${formatToolMetacoinPrice(tool)} метакоинов`,
    parse_mode: 'HTML'
  };
}

export const adaptToolToModel = modelFor;
export const calculateMetacoinPriceForTool = calculateToolMetacoinPrice;
export const getMetacoinPriceRangeForTool = getToolMetacoinPriceRange;
