const CATALOG_SIZE = 80;
const PUBLIC_ID = /^elv_[a-f0-9]{24}$/u;
const PREVIEW_ID = /^voice-preview-(elv_[a-f0-9]{24})$/u;
const ALLOWED_CATEGORIES = new Set(['premade', 'professional']);
const LABEL_KEYS = Object.freeze([
  'accent',
  'gender',
  'language',
  'age',
  'useCase',
  'descriptive'
]);
const PUBLIC_VOICE_KEYS = Object.freeze([
  'id',
  'name',
  'description',
  'category',
  'labels',
  'preview'
]);

let catalog = Object.freeze([]);
let voiceById = new Map();

export let VOICE_LIBRARY_COUNT = 0;

function normalizedText(value) {
  return String(value ?? '').trim().toLocaleLowerCase('ru-RU');
}

function isSafePublicText(value, { required = false, maximum = 220, lowercase = false } = {}) {
  if (typeof value !== 'string' || value.length > maximum) return false;
  if (required && value.length < 2) return false;
  return value === value.trim()
    && (!lowercase || value === value.toLocaleLowerCase('ru-RU'))
    && !/[\u0000-\u001f\u007f<>]/u.test(value);
}

function isValidLabels(labels) {
  if (!labels || typeof labels !== 'object' || Array.isArray(labels) || !Object.isFrozen(labels)) {
    return false;
  }
  return Object.entries(labels).every(([key, value]) =>
    LABEL_KEYS.includes(key)
    && isSafePublicText(value, { required: true, maximum: 60, lowercase: true })
  );
}

function assertPublicVoice(voice) {
  if (!voice || typeof voice !== 'object' || Array.isArray(voice) || !Object.isFrozen(voice)) {
    throw new TypeError('Every public voice record must be immutable.');
  }
  const keys = Object.keys(voice);
  if (
    keys.length !== PUBLIC_VOICE_KEYS.length
    || keys.some((key) => !PUBLIC_VOICE_KEYS.includes(key))
  ) {
    throw new TypeError('Public voice record contains private or unknown fields.');
  }
  if (!PUBLIC_ID.test(String(voice.id ?? ''))) {
    throw new TypeError('Public voice id is invalid.');
  }
  if (!isSafePublicText(voice.name, { required: true, maximum: 80 })) {
    throw new TypeError('Public voice name must be safe display text.');
  }
  if (!isSafePublicText(voice.description, { maximum: 220, lowercase: true })) {
    throw new TypeError('Public voice description must be safe lowercase text.');
  }
  if (!ALLOWED_CATEGORIES.has(voice.category)) {
    throw new TypeError('Public voice category is invalid.');
  }
  if (!isValidLabels(voice.labels)) {
    throw new TypeError('Public voice labels must be immutable lowercase text.');
  }
  if (!Object.isFrozen(voice.preview) || !validatePreviewReference(voice.preview)) {
    throw new TypeError('Public voice preview is invalid or mutable.');
  }
  const previewVoiceId = PREVIEW_ID.exec(voice.preview.value)?.[1];
  if (previewVoiceId !== voice.id) {
    throw new TypeError('Public voice preview does not match its voice.');
  }
}

function positiveLimit(value) {
  if (value === undefined) return VOICE_LIBRARY_COUNT;
  if (!Number.isSafeInteger(value) || value < 1 || value > CATALOG_SIZE) {
    throw new TypeError('limit must be an integer between 1 and 80.');
  }
  return value;
}

function nonNegativeOffset(value) {
  if (value === undefined) return 0;
  if (!Number.isSafeInteger(value) || value < 0 || value > CATALOG_SIZE) {
    throw new TypeError('offset must be an integer between 0 and 80.');
  }
  return value;
}

function matchesFilter(value, wanted) {
  return wanted.length === 0 || wanted.includes(normalizedText(value));
}

function normalizedList(value, label) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array.`);
  return value.map(normalizedText).filter(Boolean);
}

export function validatePreviewReference(reference) {
  return Boolean(
    reference
    && typeof reference === 'object'
    && !Array.isArray(reference)
    && reference.type === 'id'
    && PREVIEW_ID.test(String(reference.value ?? ''))
  );
}

export function setCuratedVoices(records) {
  if (!Array.isArray(records) || !Object.isFrozen(records)) {
    throw new TypeError('Voice catalog must be an immutable array.');
  }
  if (records.length !== CATALOG_SIZE) {
    throw new TypeError('Voice catalog must contain exactly 80 public records.');
  }

  records.forEach(assertPublicVoice);
  const nextMap = new Map(records.map((voice) => [voice.id, voice]));
  if (nextMap.size !== CATALOG_SIZE) {
    throw new TypeError('Voice catalog must contain 80 unique public ids.');
  }

  const nextCatalog = Object.freeze([...records]);
  catalog = nextCatalog;
  voiceById = nextMap;
  VOICE_LIBRARY_COUNT = CATALOG_SIZE;
  return nextCatalog;
}

export function clearCuratedVoices() {
  catalog = Object.freeze([]);
  voiceById = new Map();
  VOICE_LIBRARY_COUNT = 0;
}

export function isVoiceLibraryReady() {
  return VOICE_LIBRARY_COUNT === CATALOG_SIZE;
}

export function getCuratedVoice(value) {
  const id = String(value ?? '');
  if (!PUBLIC_ID.test(id)) return null;
  return voiceById.get(id) ?? null;
}

export function listCuratedVoices(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('voice filters must be an object.');
  }
  const query = normalizedText(options.query);
  const languages = normalizedList(options.languages, 'languages');
  const useCases = normalizedList(options.useCases, 'useCases');
  const tags = normalizedList(options.tags, 'tags');
  const limit = positiveLimit(options.limit);
  const offset = nonNegativeOffset(options.offset);

  const filtered = catalog.filter((voice) => {
    const labelValues = Object.values(voice.labels);
    const searchable = normalizedText([voice.name, voice.description, ...labelValues].join(' '));
    return (!query || searchable.includes(query))
      && matchesFilter(voice.labels.language, languages)
      && matchesFilter(voice.labels.useCase, useCases)
      && tags.every((tag) => labelValues.includes(tag));
  });
  return Object.freeze(filtered.slice(offset, offset + limit));
}
