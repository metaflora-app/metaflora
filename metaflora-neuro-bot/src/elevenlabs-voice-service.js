import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

import { VOICE_CONSENT_VERSION } from './voice-profile-store.js';

const CATALOG_SIZE = 80;
const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
const MAX_TTS_CHARACTERS = 40_000;
const ALLOWED_AUDIO_TYPES = new Set([
  'audio/aac',
  'audio/flac',
  'audio/m4a',
  'audio/mp3',
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'audio/opus',
  'audio/wav',
  'audio/wave',
  'audio/x-m4a',
  'audio/x-wav',
  'video/mp4'
]);
const ALLOWED_CONSENT_BASES = new Set(['own_voice', 'licensed_voice', 'authorized_speaker']);
const SAFE_VALUE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/u;
const SAFE_OUTPUT_FORMAT = /^(?:mp3|pcm|ulaw|alaw|opus)_\d{4,6}(?:_\d{2,3})?$/u;
const VOICE_NAMES = Object.freeze({
  tanner: 'Таннер',
  kristen: 'Кристен',
  billy: 'Билли',
  rich: 'Рич',
  rahul: 'Рахул',
  rachel: 'Рэйчел',
  matthew: 'Мэттью',
  shane: 'Шейн',
  xavier: 'Ксавьер',
  bryan: 'Брайан',
  'brian ludwig': 'Брайан Людвиг',
  mike: 'Майк',
  ava: 'Ава',
  'rocco robot': 'Рокко',
  bella: 'Белла',
  roger: 'Роджер',
  sarah: 'Сара',
  laura: 'Лора',
  charlie: 'Чарли',
  george: 'Джордж',
  callum: 'Каллум',
  river: 'Ривер',
  harry: 'Гарри',
  liam: 'Лиам',
  alice: 'Элис',
  matilda: 'Матильда',
  will: 'Уилл'
});
const LABEL_TRANSLATIONS = Object.freeze({
  accent: Object.freeze({
    american: 'американский',
    australian: 'австралийский',
    british: 'британский',
    canadian: 'канадский',
    standard: 'нейтральный'
  }),
  gender: Object.freeze({
    female: 'женский',
    male: 'мужской',
    neutral: 'нейтральный'
  }),
  language: Object.freeze({
    de: 'немецкий',
    en: 'английский',
    ru: 'русский'
  }),
  age: Object.freeze({
    young: 'молодой',
    middle_aged: 'зрелый',
    old: 'возрастной'
  }),
  useCase: Object.freeze({
    audiobook: 'аудиокниг и длинной озвучки',
    characters_animation: 'персонажей, игр и анимации',
    conversational: 'подкастов, интервью и разговорных роликов',
    entertainment_tv: 'новостей, телепередач и рекламы',
    informative_educational: 'курсов, инструкций и объясняющих видео',
    narrative_story: 'аудиокниг, документальных роликов и закадрового текста',
    social_media: 'коротких роликов и соцсетей'
  }),
  descriptive: Object.freeze({
    calm: 'спокойной',
    casual: 'непринуждённой',
    chill: 'расслабленной',
    classy: 'сдержанной',
    confident: 'уверенной',
    deep: 'глубокой',
    formal: 'деловой',
    hyped: 'энергичной',
    mature: 'зрелой',
    meditative: 'медитативной',
    modulated: 'ровной',
    professional: 'профессиональной',
    robotic: 'роботизированной',
    rough: 'грубой',
    sassy: 'живой',
    serious: 'серьёзной',
    warm: 'тёплой',
    upbeat: 'бодрой'
  })
});

export class ElevenLabsVoiceError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = 'ElevenLabsVoiceError';
    this.code = code;
  }
}

function fail(code, message) {
  throw new ElevenLabsVoiceError(code, message);
}

function assertObject(value, code = 'invalid_input') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(code, 'проверьте данные и попробуйте ещё раз');
  }
}

function publicVoiceId(providerVoiceId) {
  const digest = createHash('sha256').update(`elevenlabs\0${providerVoiceId}`).digest('hex');
  return `elv_${digest.slice(0, 24)}`;
}

function cleanText(value, maximum = 160) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f<>]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLocaleLowerCase('ru-RU')
    .slice(0, maximum);
}

function providerNameBase(value) {
  return String(value ?? '')
    .split(/\s+-\s+/u, 1)[0]
    .trim()
    .toLocaleLowerCase('en-US');
}

function cyrillicFallbackName(value) {
  const source = providerNameBase(value);
  const numberedVoice = /^voice\s+(\d+)$/u.exec(source);
  if (numberedVoice) return `Голос ${numberedVoice[1]}`;
  const sharedVoice = /^shared\s+(\d+)$/u.exec(source);
  if (sharedVoice) return `Общий голос ${sharedVoice[1]}`;
  const transliteration = {
    a: 'а', b: 'б', c: 'к', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х',
    i: 'и', j: 'дж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п',
    q: 'к', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'у', x: 'кс',
    y: 'й', z: 'з'
  };
  const prepared = source;
  const localized = [...prepared]
    .map((character) => transliteration[character] ?? (/\d/u.test(character) ? character : (character === ' ' ? ' ' : '')))
    .join('')
    .replace(/\s+/gu, ' ')
    .trim();
  const safe = localized || 'голос';
  return safe[0].toLocaleUpperCase('ru-RU') + safe.slice(1);
}

function localizedVoiceName(value) {
  const source = String(value ?? '');
  const base = providerNameBase(source);
  if (base === 'rob') {
    return /radio|podcast/iu.test(source) ? 'Роб, радио' : 'Роб, рассказчик';
  }
  if (base === 'james') return 'Джеймс, преподаватель';
  if (base === 'james lindsay') return 'Джеймс, деловой';
  return VOICE_NAMES[base] ?? cyrillicFallbackName(base);
}

function translatedLabel(group, value) {
  const source = cleanLabel(value);
  if (!source) return undefined;
  return LABEL_TRANSLATIONS[group]?.[source] ?? source;
}

function cleanLabel(value) {
  const label = cleanText(value, 60);
  return label || undefined;
}

function providerId(value) {
  const id = String(value ?? '').trim();
  if (!SAFE_VALUE.test(id)) return null;
  return id;
}

function normalizeLabels(value) {
  const labels = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const result = {};
  const known = [
    ['accent', 'accent', 'accent'],
    ['gender', 'gender', 'gender'],
    ['language', 'language', 'language'],
    ['age', 'age', 'age'],
    ['use_case', 'useCase', 'useCase'],
    ['descriptive', 'descriptive', 'descriptive']
  ];
  for (const [source, target, group] of known) {
    const normalized = translatedLabel(group, labels[source]);
    if (normalized) result[target] = normalized;
  }
  return Object.freeze({
    gender: result.gender ?? 'нейтральный',
    age: result.age ?? 'не указан',
    useCase: result.useCase ?? 'озвучка и контент',
    descriptive: result.descriptive ?? 'естественной',
    language: result.language ?? 'многоязычный',
    ...(result.accent ? { accent: result.accent } : {})
  });
}

function localizedDescription(labels) {
  const gender = labels.gender ?? 'нейтральный';
  const delivery = labels.descriptive ?? 'естественной';
  const useCase = labels.useCase ?? 'роликов, подкастов и озвучки';
  return `${gender} голос с ${delivery} подачей. лучше всего подходит для ${useCase}.`;
}

function normalizeProviderVoice(voice) {
  if (!voice || typeof voice !== 'object' || Array.isArray(voice)) return null;
  const internalId = providerId(voice.voice_id ?? voice.voiceId);
  const name = localizedVoiceName(voice.name);
  const category = cleanText(voice.category ?? voice.voice_type ?? voice.voiceType, 40);
  if (!internalId || name.length < 2 || !['premade', 'professional'].includes(category)) return null;
  const id = publicVoiceId(internalId);
  const labels = normalizeLabels({
    ...(voice.labels && typeof voice.labels === 'object' ? voice.labels : {}),
    accent: voice.accent ?? voice.labels?.accent,
    gender: voice.gender ?? voice.labels?.gender,
    language: voice.language ?? voice.labels?.language,
    age: voice.age ?? voice.labels?.age,
    use_case: voice.use_case ?? voice.useCase ?? voice.labels?.use_case,
    descriptive: voice.descriptive ?? voice.labels?.descriptive
  });
  const result = Object.freeze({
    id,
    name,
    description: localizedDescription(labels),
    category,
    labels,
    preview: Object.freeze({
      type: 'id',
      value: `voice-preview-${id}`
    })
  });
  return { internalId, publicVoice: result };
}

function safeCatalogResponse(value) {
  const voices = Array.isArray(value) ? value : value?.voices;
  if (!Array.isArray(voices)) fail('voice_catalog_unavailable', 'каталог голосов временно недоступен');
  const seen = new Set();
  const seenNames = new Set();
  const candidates = [];
  for (const voice of voices) {
    const item = normalizeProviderVoice(voice);
    const nameKey = item?.publicVoice?.name?.toLocaleLowerCase('ru-RU');
    if (!item || seen.has(item.internalId) || seenNames.has(nameKey)) continue;
    seen.add(item.internalId);
    seenNames.add(nameKey);
    candidates.push(item);
  }
  const genderOrder = ['женский', 'мужской', 'нейтральный'];
  const buckets = new Map(genderOrder.map((gender) => [gender, candidates.filter(
    ({ publicVoice }) => publicVoice.labels.gender === gender
  )]));
  const normalized = [];
  for (let index = 0; normalized.length < CATALOG_SIZE; index += 1) {
    let added = false;
    for (const gender of genderOrder) {
      const item = buckets.get(gender)?.[index];
      if (!item) continue;
      normalized.push(item);
      added = true;
      if (normalized.length === CATALOG_SIZE) break;
    }
    if (!added) break;
  }
  if (normalized.length !== CATALOG_SIZE) {
    fail('voice_catalog_incomplete', 'каталог голосов временно недоступен');
  }
  return normalized;
}

function safeOwnerId(value) {
  const id = String(value ?? '');
  if (!/^[1-9]\d{0,19}$/u.test(id)) fail('invalid_user', 'не удалось определить пользователя');
  return id;
}

function safeVoiceReference(value) {
  assertObject(value, 'invalid_voice');
  const type = String(value.type ?? '');
  const id = String(value.id ?? '');
  if (!['curated', 'profile'].includes(type) || !/^[A-Za-z0-9_-]{3,80}$/u.test(id)) {
    fail('invalid_voice', 'выберите голос ещё раз');
  }
  return { type, id };
}

function safeText(value) {
  const text = String(value ?? '').trim();
  if (!text || text.length > MAX_TTS_CHARACTERS || /[\u0000]/u.test(text)) {
    fail('invalid_text', 'пришлите текст длиной до 40 000 знаков');
  }
  return text;
}

function safeAudio(value, { minimumSeconds = 0.1, maximumSeconds = 1_800 } = {}) {
  assertObject(value, 'invalid_audio');
  if (!Buffer.isBuffer(value.bytes) && !(value.bytes instanceof Uint8Array)) {
    fail('invalid_audio', 'пришлите аудиофайл ещё раз');
  }
  const bytes = Buffer.from(value.bytes);
  if (bytes.length === 0) fail('invalid_audio', 'пришлите непустой аудиофайл');
  if (bytes.length > MAX_AUDIO_BYTES) fail('audio_too_large', 'аудиофайл должен быть меньше 50 мб');
  const mimeType = String(value.mimeType ?? '').trim().toLowerCase();
  if (!ALLOWED_AUDIO_TYPES.has(mimeType)) {
    fail('invalid_audio_type', 'этот формат аудио пока не поддерживается');
  }
  const durationSeconds = Number(value.durationSeconds);
  if (
    !Number.isFinite(durationSeconds)
    || durationSeconds < minimumSeconds
    || durationSeconds > maximumSeconds
  ) {
    fail('invalid_audio_duration', `длительность записи должна быть от ${minimumSeconds} до ${maximumSeconds} секунд`);
  }
  return Object.freeze({ bytes, mimeType, durationSeconds });
}

function safeConsent(value, now) {
  assertObject(value, 'consent_required');
  if (value.confirmed !== true) {
    fail('consent_required', 'подтвердите, что у вас есть право использовать этот голос');
  }
  if (!ALLOWED_CONSENT_BASES.has(value.basis) || value.version !== VOICE_CONSENT_VERSION) {
    fail('consent_invalid', 'подтвердите согласие ещё раз');
  }
  const confirmedAt = new Date(value.confirmedAt);
  const current = new Date(now);
  const age = current.valueOf() - confirmedAt.valueOf();
  if (Number.isNaN(confirmedAt.valueOf()) || age < 0 || age > 86_400_000) {
    fail('consent_expired', 'подтвердите согласие ещё раз');
  }
  const sourceMessageId = String(value.sourceMessageId ?? '');
  if (!/^[1-9]\d{0,19}$/u.test(sourceMessageId)) {
    fail('consent_invalid', 'подтвердите согласие ещё раз');
  }
  const consent = {
    confirmed: true,
    basis: value.basis,
    version: VOICE_CONSENT_VERSION,
    confirmedAt: confirmedAt.toISOString(),
    sourceMessageId
  };
  if (value.evidenceReference !== undefined && value.evidenceReference !== null) {
    const reference = String(value.evidenceReference);
    if (!/^[a-z0-9][a-z0-9_.:-]{2,127}$/u.test(reference)) {
      fail('consent_invalid', 'подтвердите согласие ещё раз');
    }
    consent.evidenceReference = reference;
  }
  return Object.freeze(consent);
}

function safeName(value) {
  const name = cleanText(value, 80);
  if (name.length < 2) fail('invalid_voice_name', 'задайте голосу короткое понятное имя');
  return name;
}

function safeRetentionDays(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 365) {
    fail('invalid_retention', 'выберите срок хранения от 1 до 365 дней');
  }
  return value;
}

function safeModel(value) {
  if (value === undefined) return undefined;
  const model = String(value);
  if (!SAFE_VALUE.test(model)) fail('invalid_model', 'выберите режим озвучки ещё раз');
  return model;
}

function safeOutputFormat(value) {
  if (value === undefined) return undefined;
  const format = String(value);
  if (!SAFE_OUTPUT_FORMAT.test(format)) fail('invalid_output_format', 'выберите формат файла ещё раз');
  return format;
}

function safeLanguage(value) {
  const language = String(value ?? '').trim().toLowerCase();
  if (!/^[a-z]{2,3}(?:-[a-z]{2})?$/u.test(language)) {
    fail('invalid_language', 'выберите язык дубляжа ещё раз');
  }
  return language;
}

function safeSourceAudioSettings(value) {
  const settings = value && typeof value === 'object' ? value : {};
  const labels = { сохранить: 'preserve', убрать: 'remove', смешать: 'mix' };
  const rawMode = String(settings.source_audio ?? 'сохранить');
  const mode = labels[rawMode] ?? (['preserve', 'remove', 'mix'].includes(rawMode) ? rawMode : null);
  if (!mode) fail('invalid_audio_mix', 'выберите режим исходного звука ещё раз');
  const sourcePercent = Number(settings.source_audio_mix ?? 25);
  if (!Number.isInteger(sourcePercent) || sourcePercent < 0 || sourcePercent > 100) {
    fail('invalid_audio_mix', 'громкость исходного звука должна быть от 0 до 100');
  }
  return Object.freeze({ mode, sourcePercent });
}

function publicProfile(profile) {
  if (!profile) return null;
  return Object.freeze({
    profileId: profile.profileId,
    ownerTelegramId: profile.ownerTelegramId,
    name: profile.name,
    consent: profile.consent ? Object.freeze({ ...profile.consent }) : undefined,
    sample: profile.sample ? Object.freeze({ ...profile.sample }) : undefined,
    createdAt: profile.createdAt,
    lastUsedAt: profile.lastUsedAt,
    expiresAt: profile.expiresAt
  });
}

function safeAudioResult(value) {
  const audio = value?.data ?? value?.audio;
  if (!Buffer.isBuffer(audio) && !(audio instanceof Uint8Array)) {
    fail('invalid_provider_result', 'не удалось получить готовое аудио');
  }
  const contentType = String(value.contentType ?? value.content_type ?? 'audio/mpeg').toLowerCase();
  if (!ALLOWED_AUDIO_TYPES.has(contentType)) {
    fail('invalid_provider_result', 'не удалось получить готовое аудио');
  }
  return Object.freeze({ audio: Buffer.from(audio), contentType });
}

function providerError(code, message, cause) {
  if (cause instanceof ElevenLabsVoiceError) return cause;
  return new ElevenLabsVoiceError(code, message, { cause });
}

function isNotFound(error) {
  return Number(error?.status ?? error?.statusCode ?? error?.response?.status) === 404;
}

function deletionFailureCode(error) {
  const code = String(error?.code ?? '').toUpperCase();
  if (['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'UND_ERR_CONNECT_TIMEOUT'].includes(code)) {
    return 'provider_timeout';
  }
  const status = Number(error?.status ?? error?.statusCode ?? error?.response?.status);
  if (status === 429) return 'provider_rate_limited';
  if (status >= 500) return 'provider_unavailable';
  return 'provider_delete_failed';
}

function requiredMethod(object, name) {
  if (typeof object?.[name] !== 'function') {
    throw new TypeError(`Eleven client must implement ${name}().`);
  }
}

export class ElevenLabsVoiceService {
  #client;
  #profileStore;
  #sampleHmacKey;
  #sampleHmacKeyId;
  #providerIdByPublicId = new Map();
  #catalog = Object.freeze([]);

  constructor({ client, profileStore, sampleHmacKey, sampleHmacKeyId }) {
    requiredMethod(client, 'listVoices');
    requiredMethod(client, 'previewVoice');
    requiredMethod(client, 'cloneVoice');
    requiredMethod(client, 'deleteVoice');
    requiredMethod(client, 'textToSpeech');
    requiredMethod(client, 'changeVoice');
    if (
      !profileStore
      || typeof profileStore.createProfile !== 'function'
      || typeof profileStore.getProfile !== 'function'
      || typeof profileStore.listProfiles !== 'function'
      || typeof profileStore.touchProfile !== 'function'
      || typeof profileStore.deleteProfile !== 'function'
      || typeof profileStore.claimPendingDeletions !== 'function'
      || typeof profileStore.completeDeletion !== 'function'
      || typeof profileStore.failDeletion !== 'function'
    ) {
      throw new TypeError('A compatible voice profile store is required.');
    }
    const key = Buffer.isBuffer(sampleHmacKey)
      ? Buffer.from(sampleHmacKey)
      : Buffer.from(String(sampleHmacKey ?? ''), 'base64');
    if (key.length < 32) throw new TypeError('Sample HMAC key must contain at least 32 bytes.');
    if (!/^[a-z0-9][a-z0-9_-]{2,63}$/u.test(String(sampleHmacKeyId ?? ''))) {
      throw new TypeError('Sample HMAC key id is invalid.');
    }
    this.#client = client;
    this.#profileStore = profileStore;
    this.#sampleHmacKey = key;
    this.#sampleHmacKeyId = String(sampleHmacKeyId);
  }

  async refreshCuratedCatalog() {
    const providerRecords = [];
    let nextPageToken;
    try {
      for (let page = 0; page < 5; page += 1) {
        const response = await this.#client.listVoices({
          pageSize: 100,
          ...(nextPageToken ? { nextPageToken } : {})
        });
        providerRecords.push(...(Array.isArray(response) ? response : response?.voices ?? []));
        nextPageToken = response?.next_page_token ?? response?.nextPageToken;
        if (!nextPageToken) break;
      }
      if (typeof this.#client.listSharedVoices === 'function') {
        let lastSortId;
        for (let page = 0; page < 5; page += 1) {
          const response = await this.#client.listSharedVoices({
            pageSize: 100,
            ...(lastSortId ? { lastSortId } : {})
          });
          providerRecords.push(...(response?.voices ?? []));
          lastSortId = response?.last_sort_id ?? response?.lastSortId;
          if (!response?.has_more || !lastSortId) break;
        }
      }
    } catch (error) {
      throw providerError('voice_catalog_unavailable', 'каталог голосов временно недоступен', error);
    }
    const normalized = safeCatalogResponse(providerRecords);
    const mapping = new Map(normalized.map(({ internalId, publicVoice }) => [publicVoice.id, internalId]));
    this.#providerIdByPublicId = mapping;
    this.#catalog = Object.freeze(normalized.map(({ publicVoice }) => publicVoice));
    return this.#catalog;
  }

  listCuratedVoices() {
    return this.#catalog;
  }

  getPreviewReference(publicId) {
    const id = String(publicId ?? '');
    if (!this.#providerIdByPublicId.has(id)) fail('unknown_voice', 'выберите голос ещё раз');
    return Object.freeze({ type: 'id', value: `voice-preview-${id}` });
  }

  async previewVoice(reference) {
    assertObject(reference, 'invalid_preview');
    const value = String(reference.value ?? '');
    const match = /^voice-preview-(elv_[a-f0-9]{24})$/u.exec(value);
    if (reference.type !== 'id' || !match) {
      fail('invalid_preview', 'выберите пример голоса ещё раз');
    }
    const voiceId = this.#providerIdByPublicId.get(match[1]);
    if (!voiceId) fail('unknown_voice', 'этот пример голоса больше недоступен');
    try {
      return safeAudioResult(await this.#client.previewVoice({ voiceId }));
    } catch (error) {
      throw providerError('voice_preview_failed', 'не удалось загрузить пример голоса', error);
    }
  }

  async #resolveVoice(ownerValue, reference, now = new Date()) {
    const ownerTelegramId = safeOwnerId(ownerValue);
    const voice = safeVoiceReference(reference);
    if (voice.type === 'curated') {
      const id = this.#providerIdByPublicId.get(voice.id);
      if (!id) fail('unknown_voice', 'выберите голос ещё раз');
      return id;
    }
    try {
      const profile = this.#profileStore.getProfile(ownerTelegramId, voice.id, now);
      if (!profile || profile.provider !== 'elevenlabs') {
        fail('unknown_voice', 'этот голос больше недоступен');
      }
      return profile.providerVoiceId;
    } catch (error) {
      if (error instanceof ElevenLabsVoiceError) throw error;
      throw providerError('voice_access_denied', 'этот голос недоступен для вашего профиля', error);
    }
  }

  async cloneVoice(input, now = new Date()) {
    assertObject(input);
    const timestamp = new Date(now);
    if (Number.isNaN(timestamp.valueOf())) fail('invalid_time', 'не удалось проверить срок согласия');
    const ownerTelegramId = safeOwnerId(input.ownerTelegramId);
    const name = safeName(input.name);
    const consent = safeConsent(input.consent, timestamp);
    const sample = safeAudio(input.sample, { minimumSeconds: 10, maximumSeconds: 300 });
    const retentionDays = safeRetentionDays(input.retentionDays);
    let response;
    try {
      response = await this.#client.cloneVoice({
        name,
        files: [new Blob([sample.bytes], { type: sample.mimeType })],
        removeBackgroundNoise: true
      });
    } catch (error) {
      throw providerError('voice_clone_failed', 'не удалось создать голос, попробуйте позже', error);
    }
    const internalId = providerId(response?.voice_id ?? response?.voiceId);
    if (!internalId) fail('invalid_provider_result', 'не удалось сохранить созданный голос');
    const hmacSha256 = createHmac('sha256', this.#sampleHmacKey).update(sample.bytes).digest('hex');
    try {
      const profile = this.#profileStore.createProfile({
        ownerTelegramId,
        name,
        provider: 'elevenlabs',
        providerVoiceId: internalId,
        consent,
        sample: {
          hmacSha256,
          hmacKeyId: this.#sampleHmacKeyId,
          durationSeconds: sample.durationSeconds
        },
        retentionDays
      }, timestamp);
      return publicProfile(profile);
    } catch (error) {
      try {
        await this.#client.deleteVoice(internalId);
      } catch {
        // The original save failure remains the actionable error.
      }
      throw providerError('profile_save_failed', 'голос создан, но сохранить его не удалось', error);
    }
  }

  listOwnedVoices(ownerValue, now = new Date()) {
    const ownerTelegramId = safeOwnerId(ownerValue);
    try {
      return Object.freeze(this.#profileStore.listProfiles(ownerTelegramId, now).map(publicProfile));
    } catch (error) {
      throw providerError('voice_access_denied', 'личные голоса недоступны для этого профиля', error);
    }
  }

  async previewOwnedVoice(input, now = new Date()) {
    assertObject(input);
    return this.textToSpeech({
      ownerTelegramId: input.ownerTelegramId,
      voice: { type: 'profile', id: String(input.profileId ?? '') },
      text: 'Привет! Это короткий пример моего голоса.',
      model: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128'
    }, now);
  }

  deleteOwnedVoice(ownerValue, profileValue, now = new Date()) {
    const ownerTelegramId = safeOwnerId(ownerValue);
    const reference = safeVoiceReference({ type: 'profile', id: profileValue });
    try {
      return this.#profileStore.deleteProfile(ownerTelegramId, reference.id, now);
    } catch (error) {
      throw providerError('voice_access_denied', 'этот голос недоступен для вашего профиля', error);
    }
  }

  async textToSpeech(input, now = new Date()) {
    assertObject(input);
    const text = safeText(input.text);
    const modelId = safeModel(input.model);
    const outputFormat = safeOutputFormat(input.outputFormat);
    const voiceId = await this.#resolveVoice(input.ownerTelegramId, input.voice, now);
    try {
      const result = await this.#client.textToSpeech({
        voiceId,
        text,
        modelId,
        outputFormat
      });
      if (input.voice?.type === 'profile') {
        this.#profileStore.touchProfile(input.ownerTelegramId, input.voice.id, now);
      }
      return safeAudioResult(result);
    } catch (error) {
      throw providerError('speech_generation_failed', 'озвучка не получилась, попробуйте ещё раз', error);
    }
  }

  async changeVoice(input, now = new Date()) {
    assertObject(input);
    const audio = safeAudio(input.audio, { minimumSeconds: 0.1, maximumSeconds: 1_800 });
    const modelId = safeModel(input.model);
    const outputFormat = safeOutputFormat(input.outputFormat);
    const voiceId = await this.#resolveVoice(input.ownerTelegramId, input.voice, now);
    try {
      const result = await this.#client.changeVoice({
        voiceId,
        file: new Blob([audio.bytes], { type: audio.mimeType }),
        modelId,
        outputFormat
      });
      if (input.voice?.type === 'profile') {
        this.#profileStore.touchProfile(input.ownerTelegramId, input.voice.id, now);
      }
      return safeAudioResult(result);
    } catch (error) {
      throw providerError('voice_change_failed', 'не удалось изменить голос, попробуйте ещё раз', error);
    }
  }

  async dubVideo(input, now = new Date()) {
    assertObject(input);
    if (typeof this.#client.createDubbing !== 'function') {
      fail('dubbing_unavailable', 'дубляж временно недоступен');
    }
    const video = safeAudio(input.video, { minimumSeconds: 0.1, maximumSeconds: 1_800 });
    if (video.mimeType !== 'video/mp4') fail('invalid_video_type', 'пришлите видео в формате mp4');
    const targetLanguage = safeLanguage(input.target_language ?? input.targetLanguage);
    const audioMix = safeSourceAudioSettings(input.settings);
    const voiceId = input.voice
      ? await this.#resolveVoice(input.ownerTelegramId, input.voice, now)
      : undefined;
    try {
      input.markExternalStarted?.();
      const result = await this.#client.createDubbing({
        file: new Blob([video.bytes], { type: video.mimeType }),
        targetLang: targetLanguage,
        voiceId,
        dropBackgroundAudio: audioMix.mode === 'remove' || audioMix.mode === 'mix',
        disableVoiceCloning: Boolean(voiceId)
      });
      const dubbingId = providerId(result?.dubbing_id ?? result?.dubbingId);
      if (!dubbingId) fail('invalid_provider_result', 'не удалось запустить дубляж');
      if (input.voice?.type === 'profile') {
        this.#profileStore.touchProfile(input.ownerTelegramId, input.voice.id, now);
      }
      const maxPolls = Number.isInteger(input.maxPolls) ? input.maxPolls : 60;
      const pollIntervalMs = Number.isInteger(input.pollIntervalMs) ? input.pollIntervalMs : 5_000;
      let terminal = null;
      for (let attempt = 0; attempt < maxPolls; attempt += 1) {
        terminal = await this.#client.getDubbing(dubbingId);
        const status = String(terminal?.status ?? '').toLowerCase();
        if (['dubbed', 'completed', 'done'].includes(status)) break;
        if (['failed', 'error', 'cancelled'].includes(status)) {
          fail('dubbing_failed', 'провайдер не смог завершить дубляж');
        }
        if (attempt + 1 < maxPolls) {
          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        }
      }
      if (!['dubbed', 'completed', 'done'].includes(String(terminal?.status ?? '').toLowerCase())) {
        fail('dubbing_timeout_reconcile', 'дубляж ещё выполняется и требует проверки статуса');
      }
      const mediaResult = await this.#client.getDubbingAudio(dubbingId, targetLanguage);
      const media = Buffer.from(mediaResult?.data ?? []);
      if (!media.length) fail('invalid_provider_result', 'провайдер вернул пустой результат дубляжа');
      return Object.freeze({
        dubbingId,
        targetLanguage,
        expectedDurationSeconds: Number(result?.expected_duration_sec) || null,
        audioMix,
        dubbedAudio: media,
        contentType: mediaResult.contentType ?? 'audio/mpeg',
        originalVideo: video.bytes
      });
    } catch (error) {
      if (error instanceof ElevenLabsVoiceError) throw error;
      throw providerError('dubbing_failed', 'не удалось запустить дубляж, попробуйте позже', error);
    }
  }

  async processDeletionOutbox(options = {}) {
    const claimed = this.#profileStore.claimPendingDeletions(options);
    let deleted = 0;
    let retried = 0;
    let skipped = 0;
    for (const item of claimed) {
      if (item.provider !== 'elevenlabs') {
        skipped += 1;
        this.#profileStore.failDeletion(
          item.deletionId,
          item.leaseToken,
          'unsupported_provider',
          options.now
        );
        continue;
      }
      try {
        await this.#client.deleteVoice(item.providerVoiceId);
        this.#profileStore.completeDeletion(item.deletionId, item.leaseToken);
        deleted += 1;
      } catch (error) {
        if (isNotFound(error)) {
          this.#profileStore.completeDeletion(item.deletionId, item.leaseToken);
          deleted += 1;
          continue;
        }
        this.#profileStore.failDeletion(
          item.deletionId,
          item.leaseToken,
          deletionFailureCode(error),
          options.now
        );
        retried += 1;
      }
    }
    return Object.freeze({ claimed: claimed.length, deleted, retried, skipped });
  }

  verifySample(sample, expectedHmac) {
    const bytes = Buffer.isBuffer(sample) ? sample : Buffer.from(sample ?? []);
    const expected = Buffer.from(String(expectedHmac ?? ''), 'hex');
    const actual = createHmac('sha256', this.#sampleHmacKey).update(bytes).digest();
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
