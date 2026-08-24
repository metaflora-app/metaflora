import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ElevenLabsVoiceError,
  ElevenLabsVoiceService
} from '../src/elevenlabs-voice-service.js';

function createStore() {
  const profiles = new Map();
  const pending = [];
  let serial = 0;
  return {
    createdInputs: [],
    completed: [],
    failed: [],
    createProfile(input) {
      this.createdInputs.push(input);
      const profile = {
        profileId: `vp_00000000-0000-4000-8000-${String(++serial).padStart(12, '0')}`,
        ...input,
        consent: { ...input.consent },
        sample: { ...input.sample }
      };
      profiles.set(profile.profileId, profile);
      return profile;
    },
    getProfile(ownerTelegramId, profileId) {
      const profile = profiles.get(profileId);
      if (!profile) return null;
      if (profile.ownerTelegramId !== String(ownerTelegramId)) throw new Error('owner access denied');
      return profile;
    },
    touchProfile(ownerTelegramId, profileId) {
      return this.getProfile(ownerTelegramId, profileId);
    },
    listProfiles(ownerTelegramId) {
      return [...profiles.values()].filter((profile) => profile.ownerTelegramId === String(ownerTelegramId));
    },
    deleteProfile(ownerTelegramId, profileId) {
      const profile = this.getProfile(ownerTelegramId, profileId);
      if (!profile) return false;
      profiles.delete(profileId);
      return true;
    },
    claimPendingDeletions() {
      return pending.splice(0);
    },
    completeDeletion(deletionId, leaseToken) {
      this.completed.push({ deletionId, leaseToken });
      return true;
    },
    failDeletion(deletionId, leaseToken, code) {
      this.failed.push({ deletionId, leaseToken, code });
      return true;
    },
    queueDeletion(item) {
      pending.push(item);
    }
  };
}

function providerVoices() {
  return Array.from({ length: 80 }, (_, index) => ({
    voice_id: `private_voice_${String(index + 1).padStart(2, '0')}`,
    name: index === 0 ? ' Rachel ' : `Voice ${index + 1}`,
    category: index % 2 === 0 ? 'premade' : 'professional',
    description: index === 0 ? 'Warm narrator' : `Real voice ${index + 1}`,
    labels: index === 0
      ? { accent: 'american', gender: 'female', use_case: 'audiobook' }
      : {
          language: index % 3 === 0 ? 'ru' : 'en',
          age: ['young', 'middle_aged', 'old'][index % 3],
          gender: index % 2 ? 'female' : 'male',
          use_case: ['audiobook', 'conversational', 'informative_educational'][index % 3],
          descriptive: index % 2 ? 'warm' : 'confident'
        },
    preview_url: `https://storage.example/private_voice_${index + 1}.mp3`
  }));
}

function createClient(overrides = {}) {
  return {
    cloneCalls: [],
    listCalls: [],
    previewCalls: [],
    ttsCalls: [],
    changeCalls: [],
    dubbingCalls: [],
    deleteCalls: [],
    async listVoices(options) {
      this.listCalls.push(options);
      return { voices: providerVoices() };
    },
    async cloneVoice(input) {
      this.cloneCalls.push(input);
      return { voice_id: 'private_cloned_voice_7' };
    },
    async previewVoice(input) {
      this.previewCalls.push(input);
      return { audio: Buffer.from('preview'), contentType: 'audio/mpeg' };
    },
    async deleteVoice(voiceId) {
      this.deleteCalls.push(voiceId);
      return { ok: true };
    },
    async textToSpeech(input) {
      this.ttsCalls.push(input);
      return { data: Uint8Array.from(Buffer.from('speech')), contentType: 'audio/mpeg' };
    },
    async changeVoice(input) {
      this.changeCalls.push(input);
      return { data: Uint8Array.from(Buffer.from('changed')), contentType: 'audio/mpeg' };
    },
    async createDubbing(input) {
      this.dubbingCalls.push(input);
      return { dubbing_id: 'dub_1', expected_duration_sec: 20 };
    },
    async getDubbing() { return { status: 'dubbed' }; },
    async getDubbingAudio() {
      return { data: Uint8Array.from(Buffer.from('dubbed-audio')), contentType: 'audio/mpeg' };
    },
    ...overrides
  };
}

function service(options = {}) {
  return new ElevenLabsVoiceService({
    client: options.client ?? createClient(),
    profileStore: options.profileStore ?? createStore(),
    sampleHmacKey: Buffer.alloc(32, 4),
    sampleHmacKeyId: 'voice-samples-2026-07'
  });
}

function consent(overrides = {}) {
  return {
    confirmed: true,
    basis: 'own_voice',
    version: '2026-07-26',
    confirmedAt: '2026-07-26T10:00:00.000Z',
    sourceMessageId: '501',
    ...overrides
  };
}

test('нормализует ровно 80 реальных голосов и скрывает внутренние идентификаторы и ссылки', async () => {
  const client = createClient();
  const voiceService = service({ client });
  const voices = await voiceService.refreshCuratedCatalog();

  assert.equal(voices.length, 80);
  assert.deepEqual(voices[0], {
    id: voices[0].id,
    name: 'Рэйчел',
    description: 'женский голос с естественной подачей. лучше всего подходит для аудиокниг и длинной озвучки.',
    category: 'premade',
    labels: {
      gender: 'женский',
      age: 'не указан',
      useCase: 'аудиокниг и длинной озвучки',
      descriptive: 'естественной',
      language: 'многоязычный',
      accent: 'американский'
    },
    preview: {
      type: 'id',
      value: `voice-preview-${voices[0].id}`
    }
  });
  assert.match(voices[0].id, /^elv_[a-f0-9]{24}$/);
  assert.ok(voices.every(({ name, description, labels }) =>
    !/[a-z]/iu.test([name, description, ...Object.values(labels)].join(' '))
  ));
  assert.ok(Object.isFrozen(voices[0]));
  const serialized = JSON.stringify(voices);
  assert.doesNotMatch(serialized, /private_voice|storage\.example|voice_id|preview_url/i);
  assert.deepEqual(voiceService.listCuratedVoices(), voices);
  assert.deepEqual(client.listCalls, [{ pageSize: 100 }]);
  assert.equal(new Set(voices.map(({ name }) => name.toLocaleLowerCase('ru-RU'))).size, 80);
  assert.ok(voices.every(({ labels }) => labels.gender && labels.age && labels.useCase && labels.descriptive));
  assert.ok(voices.filter(({ labels }) => labels.gender === 'женский').length >= 30);
  assert.ok(voices.filter(({ labels }) => labels.gender === 'мужской').length >= 30);
  assert.ok(new Set(voices.map(({ labels }) => labels.age)).size >= 3);
  assert.ok(new Set(voices.map(({ labels }) => labels.useCase)).size >= 3);
  for (const voice of voices) {
    const preview = await voiceService.previewVoice(voice.preview);
    assert.equal(preview.contentType, 'audio/mpeg');
  }
  assert.equal(client.previewCalls.length, 80);
});

test('отказывается публиковать неполный каталог вместо заполнения заглушками', async () => {
  const voiceService = service({
    client: createClient({
      async listVoices() {
        return { voices: providerVoices().slice(0, 79) };
      }
    })
  });
  await assert.rejects(
    voiceService.refreshCuratedCatalog(),
    (error) => error.code === 'voice_catalog_incomplete'
      && error.message === 'каталог голосов временно недоступен'
  );
});

test('дополняет доступные голоса реальными shared voices и удаляет дубли', async () => {
  const owned = providerVoices().slice(0, 30);
  const shared = Array.from({ length: 60 }, (_, index) => ({
    voice_id: index === 0 ? owned[0].voice_id : `shared_voice_${String(index).padStart(2, '0')}`,
    name: index === 0 ? owned[0].name : `Shared ${index}`,
    category: 'professional',
    labels: {
      gender: index % 2 ? 'female' : 'male',
      age: ['young', 'middle_aged', 'old'][index % 3],
      use_case: ['audiobook', 'conversational', 'informative_educational'][index % 3],
      descriptive: index % 2 ? 'warm' : 'confident',
      language: index % 3 ? 'en' : 'ru'
    },
    preview_url: `https://storage.example/shared_${index}.mp3`
  }));
  const client = createClient({
    async listVoices(options) {
      this.listCalls.push(options);
      return { voices: owned };
    },
    async listSharedVoices() { return { voices: shared, has_more: false }; }
  });
  const voiceService = service({ client });
  const voices = await voiceService.refreshCuratedCatalog();

  assert.equal(voices.length, 80);
  assert.equal(new Set(voices.map(({ id }) => id)).size, 80);
  assert.equal(new Set(voices.map(({ name }) => name.toLowerCase())).size, 80);
  assert.equal(voices.some(({ name }) => /^Общий голос \d+$/u.test(name)), true);
});

test('не включает клонированные и сгенерированные голоса в общий каталог', async () => {
  const client = createClient({
    async listVoices(options) {
      this.listCalls.push(options);
      return {
        voices: [
          { voice_id: 'private_clone', name: 'clone', category: 'cloned' },
          { voice_id: 'private_generated', name: 'generated', category: 'generated' },
          ...providerVoices()
        ]
      };
    }
  });
  const voiceService = service({ client });

  const voices = await voiceService.refreshCuratedCatalog();

  assert.equal(voices.length, 80);
  assert.equal(voices.some(({ name }) => ['clone', 'generated'].includes(name)), false);
  assert.deepEqual(client.listCalls, [{ pageSize: 100 }]);
});

test('озвучивает выбранным голосом и не передаёт наружу его внутренний id', async () => {
  const client = createClient();
  const voiceService = service({ client });
  const [voice] = await voiceService.refreshCuratedCatalog();

  const result = await voiceService.textToSpeech({
    ownerTelegramId: '100',
    voice: { type: 'curated', id: voice.id },
    text: 'проверь, как звучит эта фраза',
    model: 'eleven_multilingual_v2',
    outputFormat: 'mp3_44100_128'
  });

  assert.deepEqual(result, {
    audio: Buffer.from('speech'),
    contentType: 'audio/mpeg'
  });
  assert.equal(client.ttsCalls[0].voiceId, 'private_voice_01');
  assert.equal(client.ttsCalls[0].modelId, 'eleven_multilingual_v2');
  assert.equal(Object.hasOwn(result, 'voiceId'), false);
});

test('отдаёт превью по непрозрачной ссылке без внутреннего id и исходного url', async () => {
  const client = createClient();
  const voiceService = service({ client });
  const [voice] = await voiceService.refreshCuratedCatalog();

  const result = await voiceService.previewVoice(voice.preview);

  assert.deepEqual(result, {
    audio: Buffer.from('preview'),
    contentType: 'audio/mpeg'
  });
  assert.deepEqual(client.previewCalls, [{ voiceId: 'private_voice_01' }]);
  assert.doesNotMatch(JSON.stringify(result), /private_voice|storage\.example/i);
});

test('клонирует голос только после свежего согласия и сохраняет лишь HMAC образца', async () => {
  const client = createClient();
  const profileStore = createStore();
  const voiceService = service({ client, profileStore });
  const sample = Buffer.from('a sufficiently long clean voice sample');

  const profile = await voiceService.cloneVoice({
    ownerTelegramId: '100',
    name: 'мой голос',
    sample: {
      bytes: sample,
      mimeType: 'audio/mpeg',
      durationSeconds: 35
    },
    consent: consent(),
    retentionDays: 30
  }, '2026-07-26T10:00:00.000Z');

  assert.equal(client.cloneCalls.length, 1);
  assert.equal(client.cloneCalls[0].files.length, 1);
  assert.equal(client.cloneCalls[0].files[0] instanceof Blob, true);
  assert.deepEqual(Buffer.from(await client.cloneCalls[0].files[0].arrayBuffer()), sample);
  assert.equal(profile.name, 'мой голос');
  assert.equal(Object.hasOwn(profile, 'providerVoiceId'), false);
  assert.equal(profileStore.createdInputs[0].providerVoiceId, 'private_cloned_voice_7');
  assert.match(profileStore.createdInputs[0].sample.hmacSha256, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(profileStore.createdInputs).includes(sample.toString()), false);
});

test('личная библиотека не раскрывает provider id и все действия проверяют владельца', async () => {
  const client = createClient();
  const profileStore = createStore();
  const voiceService = service({ client, profileStore });
  const created = profileStore.createProfile({
    ownerTelegramId: '100',
    name: 'мой голос',
    provider: 'elevenlabs',
    providerVoiceId: 'private_profile_voice',
    consent: consent(),
    sample: { hmacSha256: 'a'.repeat(64), hmacKeyId: 'test-key', durationSeconds: 20 },
    retentionDays: 30
  });

  assert.deepEqual(voiceService.listOwnedVoices('100').map(({ profileId, name }) => ({ profileId, name })), [{
    profileId: created.profileId,
    name: 'мой голос'
  }]);
  assert.doesNotMatch(JSON.stringify(voiceService.listOwnedVoices('100')), /private_profile_voice/u);
  await assert.rejects(
    voiceService.previewOwnedVoice({ ownerTelegramId: '200', profileId: created.profileId }),
    (error) => error.code === 'voice_access_denied'
  );
  await voiceService.previewOwnedVoice({ ownerTelegramId: '100', profileId: created.profileId });
  assert.equal(client.ttsCalls.at(-1).voiceId, 'private_profile_voice');
  assert.equal(voiceService.deleteOwnedVoice('100', created.profileId), true);
  assert.equal(voiceService.listOwnedVoices('100').length, 0);
});

test('дубляж принимает готовый или личный голос и сохраняет инструкцию сведения исходного звука', async () => {
  const client = createClient();
  const profileStore = createStore();
  const voiceService = service({ client, profileStore });
  const [curated] = await voiceService.refreshCuratedCatalog();
  const result = await voiceService.dubVideo({
    ownerTelegramId: '100',
    video: { bytes: Buffer.from('video'), mimeType: 'video/mp4', durationSeconds: 20 },
    target_language: 'ru',
    voice: { type: 'curated', id: curated.id },
    settings: { source_audio: 'смешать', source_audio_mix: 25 }
  });

  assert.equal(client.dubbingCalls[0].voiceId, 'private_voice_01');
  assert.equal(client.dubbingCalls[0].dropBackgroundAudio, true);
  assert.deepEqual(result.audioMix, { mode: 'mix', sourcePercent: 25 });
  assert.deepEqual(result.dubbedAudio, Buffer.from('dubbed-audio'));
  assert.equal(result.contentType, 'audio/mpeg');
  assert.doesNotMatch(JSON.stringify(result), /private_voice_01/u);
});

test('отклоняет клонирование до сетевого вызова при отсутствии согласия', async () => {
  const client = createClient();
  const voiceService = service({ client });

  await assert.rejects(
    voiceService.cloneVoice({
      ownerTelegramId: '100',
      name: 'мой голос',
      sample: { bytes: Buffer.from('sample'), mimeType: 'audio/mpeg', durationSeconds: 5 },
      consent: consent({ confirmed: false }),
      retentionDays: 30
    }, '2026-07-26T10:00:00.000Z'),
    (error) => error instanceof ElevenLabsVoiceError
      && error.code === 'consent_required'
      && error.message === 'подтвердите, что у вас есть право использовать этот голос'
  );
  assert.equal(client.cloneCalls.length, 0);
});

test('удаляет созданный голос, если локальное сохранение профиля сорвалось', async () => {
  const client = createClient();
  const profileStore = createStore();
  profileStore.createProfile = () => {
    throw new Error('database unavailable private_cloned_voice_7');
  };
  const voiceService = service({ client, profileStore });

  await assert.rejects(
    voiceService.cloneVoice({
      ownerTelegramId: '100',
      name: 'мой голос',
      sample: {
        bytes: Buffer.from('a sufficiently long clean voice sample'),
        mimeType: 'audio/mpeg',
        durationSeconds: 35
      },
      consent: consent(),
      retentionDays: 30
    }, '2026-07-26T10:00:00.000Z'),
    (error) => error instanceof ElevenLabsVoiceError
      && error.code === 'profile_save_failed'
      && !/private_cloned|database/i.test(error.message)
  );
  assert.deepEqual(client.deleteCalls, ['private_cloned_voice_7']);
});

test('озвучка профилем и изменение голоса проверяют владельца', async () => {
  const client = createClient();
  const profileStore = createStore();
  const voiceService = service({ client, profileStore });
  const created = profileStore.createProfile({
    ownerTelegramId: '100',
    name: 'мой голос',
    provider: 'elevenlabs',
    providerVoiceId: 'private_profile_voice',
    consent: consent(),
    sample: {
      hmacSha256: 'a'.repeat(64),
      hmacKeyId: 'voice-samples-2026-07',
      durationSeconds: 30
    },
    retentionDays: 30
  });

  await assert.rejects(
    voiceService.textToSpeech({
      ownerTelegramId: '200',
      voice: { type: 'profile', id: created.profileId },
      text: 'чужой голос использовать нельзя'
    }),
    (error) => error instanceof ElevenLabsVoiceError
      && error.code === 'voice_access_denied'
      && !/private_profile_voice|owner/i.test(error.message)
  );

  const result = await voiceService.changeVoice({
    ownerTelegramId: '100',
    voice: { type: 'profile', id: created.profileId },
    audio: {
      bytes: Buffer.from('clean source speech'),
      mimeType: 'audio/wav',
      durationSeconds: 20
    },
    outputFormat: 'mp3_44100_128'
  });
  assert.equal(result.contentType, 'audio/mpeg');
  assert.equal(client.changeCalls[0].voiceId, 'private_profile_voice');
  assert.equal(client.changeCalls[0].file instanceof Blob, true);
  assert.equal(Object.hasOwn(result, 'voiceId'), false);
});

test('воркер считает 404 успешным удалением и ставит повтор при временной ошибке', async () => {
  let invocation = 0;
  const client = createClient({
    async deleteVoice() {
      invocation += 1;
      if (invocation === 1) {
        const error = new Error('not found private_deleted_voice');
        error.status = 404;
        throw error;
      }
      const error = new Error('timeout private_retry_voice');
      error.code = 'ETIMEDOUT';
      throw error;
    }
  });
  const profileStore = createStore();
  profileStore.queueDeletion({
    deletionId: '00000000-0000-4000-8000-000000000001',
    leaseToken: '00000000-0000-4000-8000-000000000011',
    provider: 'elevenlabs',
    providerVoiceId: 'private_deleted_voice'
  });
  profileStore.queueDeletion({
    deletionId: '00000000-0000-4000-8000-000000000002',
    leaseToken: '00000000-0000-4000-8000-000000000022',
    provider: 'elevenlabs',
    providerVoiceId: 'private_retry_voice'
  });
  const voiceService = service({ client, profileStore });

  const summary = await voiceService.processDeletionOutbox({
    now: '2026-07-26T10:00:00.000Z'
  });

  assert.deepEqual(summary, { claimed: 2, deleted: 1, retried: 1, skipped: 0 });
  assert.equal(profileStore.completed.length, 1);
  assert.deepEqual(profileStore.failed, [{
    deletionId: '00000000-0000-4000-8000-000000000002',
    leaseToken: '00000000-0000-4000-8000-000000000022',
    code: 'provider_timeout'
  }]);
  assert.doesNotMatch(JSON.stringify(summary), /private_/);
});

test('не отправляет запросы с пустым текстом или слишком большим аудио', async () => {
  const client = createClient();
  const voiceService = service({ client });
  const [voice] = await voiceService.refreshCuratedCatalog();

  await assert.rejects(
    voiceService.textToSpeech({
      ownerTelegramId: '100',
      voice: { type: 'curated', id: voice.id },
      text: ' '
    }),
    (error) => error.code === 'invalid_text' && /^[а-яё]/u.test(error.message)
  );
  await assert.rejects(
    voiceService.textToSpeech({
      ownerTelegramId: '100',
      voice: { type: 'curated', id: voice.id },
      text: 'текст',
      outputFormat: '../raw'
    }),
    (error) => error.code === 'invalid_output_format'
  );
  await assert.rejects(
    voiceService.changeVoice({
      ownerTelegramId: '100',
      voice: { type: 'curated', id: voice.id },
      audio: {
        bytes: Buffer.alloc(51 * 1024 * 1024),
        mimeType: 'audio/wav',
        durationSeconds: 20
      }
    }),
    (error) => error.code === 'audio_too_large'
  );
  assert.equal(client.ttsCalls.length, 0);
  assert.equal(client.changeCalls.length, 0);
});
