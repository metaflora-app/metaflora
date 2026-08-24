const TOKEN_INPUT = /(?:^|[_\s-])(?:input|prompt|request|запрос)(?:$|[_\s-])/iu;
const TOKEN_OUTPUT = /(?:^|[_\s-])(?:output|completion|response|answer|ответ)(?:$|[_\s-])/iu;
const VIDEO_UNIT = /(?:video|видео|second|seconds|sec|сек)/iu;
const PER_REQUEST = /(?:per[_\s-]?request|request|generation|per[_\s-]?run|запуск|генерац)/iu;
const PER_MINUTE = /(?:stt[_\s-]?per[_\s-]?minute|per[_\s-]?minute|minute|minutes|min|мин)/iu;
const CHARACTER_UNIT = /(?:char|chars|character|characters|symbol|symbols|символ|знак)/iu;
const TOKEN_UNIT = /(?:token|tokens|токен)/iu;
const TIER_KEY = /(?:tier|tiers|quality|resolution|unitparam|unit_param|option|options)/iu;
const MIN_KEY = /(?:^|[_\s-])(?:min|from|от)(?:$|[_\s-])/iu;
const MAX_KEY = /(?:^|[_\s-])(?:max|to|до)(?:$|[_\s-])/iu;

function finiteRubles(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== 'string') return null;
  const normalized = value
    .replace(/\s+/gu, '')
    .replace(',', '.')
    .replace(/[^\d.]/gu, '');
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function numericLeaf(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return finiteRubles(value);
  for (const key of ['rub', 'rubles', 'ruble', 'price', 'amount', 'value', 'cost']) {
    const parsed = finiteRubles(value[key]);
    if (parsed !== null) return parsed;
  }
  return null;
}

function collectRecords(value, path = []) {
  const parsed = numericLeaf(value);
  if (parsed !== null) {
    const labels = value && typeof value === 'object' && !Array.isArray(value)
      ? ['type', 'unit', 'kind', 'name', 'key']
        .map((key) => value[key])
        .filter((label) => typeof label === 'string' && label.trim())
      : [];
    return [{ path: [...path, ...labels].join('_').toLowerCase(), value: parsed }];
  }
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectRecords(item, [...path, String(index)]));
  }
  return Object.entries(value).flatMap(([key, item]) => collectRecords(item, [...path, key]));
}

function firstRecord(records, pattern) {
  return records.find(({ path }) => pattern.test(path))?.value ?? null;
}

function normalizeLlmPricing(records) {
  const inputRublesPerMillion = firstRecord(records, TOKEN_INPUT);
  const outputRublesPerMillion = firstRecord(records, TOKEN_OUTPUT);
  if (inputRublesPerMillion === null || outputRublesPerMillion === null) return null;
  return Object.freeze({
    type: 'llm_tokens',
    inputRublesPerMillion,
    outputRublesPerMillion
  });
}

function tieredVideoPrice(rawPricing) {
  if (!rawPricing || typeof rawPricing !== 'object' || !Array.isArray(rawPricing.tiers)) return null;
  const tierPrices = rawPricing.tiers.flatMap(({ conditions = [], cost_rub: costRubles }) => {
    const parsedCost = finiteRubles(costRubles);
    if (parsedCost === null) return [];
    const parsedConditions = Object.fromEntries(conditions.flatMap((condition) => {
      const match = /^([a-z][a-z0-9_]*)=(.+)$/iu.exec(String(condition));
      return match ? [[match[1], match[2]]] : [];
    }));
    return [Object.freeze({ conditions: Object.freeze(parsedConditions), costRubles: parsedCost })];
  });
  if (tierPrices.length === 0) return null;

  const minRubles = Math.min(...tierPrices.map(({ costRubles }) => costRubles));
  const maxRubles = Math.max(...tierPrices.map(({ costRubles }) => costRubles));
  const unitParam = String(rawPricing.unitParam ?? rawPricing.unit_param ?? '').toLowerCase();
  if (unitParam === 'duration') {
    return Object.freeze({
      type: 'video_seconds',
      minRublesPerSecond: minRubles,
      maxRublesPerSecond: maxRubles,
      tierPrices: Object.freeze(tierPrices)
    });
  }

  return Object.freeze({
    type: 'request_units',
    minRublesPerRequest: minRubles,
    maxRublesPerRequest: maxRubles,
    tierPrices: Object.freeze(tierPrices)
  });
}

function normalizeVideoPricing(records, rawPricing) {
  const tiered = tieredVideoPrice(rawPricing);
  if (tiered) return tiered;

  const perRequest = normalizePerRequestPricing(records);
  if (perRequest && records.some(({ path }) => PER_REQUEST.test(path))) return perRequest;

  const scoped = records.filter(({ path }) => VIDEO_UNIT.test(path));
  const source = scoped.length > 0 ? scoped : records.filter(({ path }) => !PER_REQUEST.test(path));
  const range = minMaxFromRecords(source);
  if (!range) return null;
  return Object.freeze({
    type: 'video_seconds',
    minRublesPerSecond: range.minRubles,
    maxRublesPerSecond: range.maxRubles
  });
}

function minMaxFromRecords(records) {
  if (records.length === 0) return null;
  const minRubles = firstRecord(records, MIN_KEY) ?? Math.min(...records.map(({ value }) => value));
  const maxRubles = firstRecord(records, MAX_KEY) ?? Math.max(...records.map(({ value }) => value));
  if (!Number.isFinite(minRubles) || !Number.isFinite(maxRubles) || maxRubles < minRubles) return null;
  return { minRubles, maxRubles };
}

function normalizePerRequestPricing(records) {
  const scoped = records.filter(({ path }) => PER_REQUEST.test(path) || TIER_KEY.test(path));
  const range = minMaxFromRecords(scoped.length > 0 ? scoped : records);
  if (!range) return null;
  return Object.freeze({
    type: 'request_units',
    minRublesPerRequest: range.minRubles,
    maxRublesPerRequest: range.maxRubles
  });
}

function normalizePerMinutePricing(records) {
  const scoped = records.filter(({ path }) => PER_MINUTE.test(path));
  const range = minMaxFromRecords(scoped.length > 0 ? scoped : records);
  if (!range) return null;
  return Object.freeze({
    type: 'audio_minutes',
    minRublesPerMinute: range.minRubles,
    maxRublesPerMinute: range.maxRubles
  });
}

function normalizeTextUnitPricing(records) {
  const charRange = minMaxFromRecords(records.filter(({ path }) => CHARACTER_UNIT.test(path)));
  if (charRange) {
    return Object.freeze({
      type: 'character_million',
      minRublesPerMillionCharacters: charRange.minRubles,
      maxRublesPerMillionCharacters: charRange.maxRubles
    });
  }
  const tokenRange = minMaxFromRecords(records.filter(({ path }) => TOKEN_UNIT.test(path)));
  if (tokenRange) {
    return Object.freeze({
      type: 'token_million',
      minRublesPerMillionTokens: tokenRange.minRubles,
      maxRublesPerMillionTokens: tokenRange.maxRubles
    });
  }
  return null;
}

export function normalizePolzaPricing(rawPricing, { category } = {}) {
  const records = collectRecords(rawPricing);
  if (category === 'llm') return normalizeLlmPricing(records);
  if (category === 'video') return normalizeVideoPricing(records, rawPricing);
  if (category === 'image') return normalizePerRequestPricing(records) ?? normalizeTextUnitPricing(records);
  if (category === 'audio') return normalizePerRequestPricing(records);
  if (category === 'voice') return normalizeTextUnitPricing(records) ?? normalizePerMinutePricing(records);
  return null;
}
