import assert from 'node:assert/strict';
import test from 'node:test';

import { providerCostUsdToMetacoins } from '../src/model-pricing.js';
import {
  MUSIC_ROUTE_ENDPOINT_ALLOWLIST,
  buildKieSunoPollUrl,
  buildMusicProviderInput,
  getMusicProviderContract,
  listActiveMusicProviderContracts,
  musicProviderContracts,
  normalizeMusicOutput,
  parseKieSunoStatus,
  parseKieSunoSubmission,
  quoteMusicRouteMetacoins
} from '../src/music-provider-contracts.js';

const ACTIVE_IDS = new Set([
  'polza_suno_generate',
  'replicate_lyria_2',
  'fal_minimax_music_v2',
  'replicate_minimax_music_01',
  'fal_lyria_2',
  'fal_elevenlabs_music'
]);

test('каталог разрешает только документированные музыкальные endpoints', () => {
  assert.deepEqual(
    new Set(listActiveMusicProviderContracts().map(({ id }) => id)),
    ACTIVE_IDS
  );

  for (const contract of musicProviderContracts) {
    assert.ok(Object.isFrozen(contract), contract.id);
    assert.equal(
      MUSIC_ROUTE_ENDPOINT_ALLOWLIST.has(contract.submitEndpoint),
      true,
      contract.id
    );
    assert.equal(contract.verified, true, contract.id);
    assert.ok(['primary', 'fallback'].includes(contract.role), contract.id);
    assert.equal(typeof contract.outputPath, 'string', contract.id);
  }
});

test('Suno через Polza является основным маршрутом, Eleven Music остаётся запасным', () => {
  const textToMusic = listActiveMusicProviderContracts({
    capability: 'text_to_music'
  });

  assert.equal(textToMusic[0].id, 'polza_suno_generate');
  assert.equal(getMusicProviderContract('fal_elevenlabs_music').role, 'fallback');
  assert.ok(
    quoteMusicRouteMetacoins('replicate_lyria_2')
      < quoteMusicRouteMetacoins('fal_elevenlabs_music', { durationSeconds: 30 })
  );
});

test('экономика переводит проверенную стоимость провайдера в метакоины с резервом', () => {
  assert.equal(
    quoteMusicRouteMetacoins('fal_minimax_music_v2'),
    providerCostUsdToMetacoins(0.03)
  );
  assert.equal(
    quoteMusicRouteMetacoins('replicate_minimax_music_01'),
    providerCostUsdToMetacoins(0.035)
  );
  assert.equal(
    quoteMusicRouteMetacoins('replicate_lyria_2'),
    providerCostUsdToMetacoins(0.002 * 30)
  );
  assert.equal(
    quoteMusicRouteMetacoins('fal_elevenlabs_music', { durationSeconds: 61 }),
    providerCostUsdToMetacoins(0.8 * 2)
  );
  assert.throws(
    () => quoteMusicRouteMetacoins('kie_suno_generate_v5', {}),
    /живой тарифный коэффициент/iu
  );
});

test('карты входов формируют точные тела для активных маршрутов', () => {
  assert.deepEqual(buildMusicProviderInput('replicate_lyria_2', {
    prompt: 'slow piano',
    negativePrompt: 'vocals',
    seed: 42
  }), {
    prompt: 'slow piano',
    negative_prompt: 'vocals',
    seed: 42
  });

  assert.deepEqual(buildMusicProviderInput('fal_minimax_music_v2', {
    prompt: 'indie folk',
    lyrics: '[verse]\nhello'
  }), {
    prompt: 'indie folk',
    lyrics_prompt: '[verse]\nhello'
  });

  assert.deepEqual(buildMusicProviderInput('replicate_minimax_music_01', {
    lyrics: '[verse]\nhello',
    referenceAudioUrl: 'https://files.example.test/reference.wav'
  }), {
    lyrics: '[verse]\nhello',
    song_file: 'https://files.example.test/reference.wav',
    sample_rate: 44100,
    bitrate: 256000
  });
});

test('KIE Suno submit и poll используют опубликованный контракт', () => {
  assert.deepEqual(buildMusicProviderInput('kie_suno_generate_v5', {
    prompt: 'calm piano',
    instrumental: true
  }), {
    prompt: 'calm piano',
    customMode: false,
    instrumental: true,
    model: 'V5'
  });

  assert.deepEqual(parseKieSunoSubmission({
    code: 200,
    msg: 'success',
    data: { taskId: 'task_abc-123' }
  }), {
    requestId: 'task_abc-123',
    state: 'pending'
  });

  assert.equal(
    buildKieSunoPollUrl('task_abc-123'),
    'https://api.kie.ai/api/v1/generate/record-info?taskId=task_abc-123'
  );
  assert.throws(
    () => buildKieSunoPollUrl('../secret'),
    /task id/iu
  );
});

test('KIE Suno status parser различает промежуточные, успешные и ошибочные состояния', () => {
  for (const status of ['PENDING', 'TEXT_SUCCESS', 'FIRST_SUCCESS']) {
    assert.deepEqual(parseKieSunoStatus({
      code: 200,
      data: { status }
    }), { state: 'pending' });
  }

  assert.deepEqual(parseKieSunoStatus({
    code: 200,
    data: {
      status: 'SUCCESS',
      response: {
        sunoData: [{
          id: 'audio-1',
          audioUrl: 'https://media.example.test/song.mp3',
          duration: 198.44,
          title: 'song'
        }]
      }
    }
  }), {
    state: 'succeeded',
    output: {
      tracks: [{
        id: 'audio-1',
        url: 'https://media.example.test/song.mp3',
        durationSeconds: 198.44,
        title: 'song'
      }]
    }
  });

  assert.deepEqual(parseKieSunoStatus({
    code: 200,
    data: { status: 'SENSITIVE_WORD_ERROR' }
  }), { state: 'failed' });
  assert.deepEqual(parseKieSunoStatus({
    code: 429,
    msg: 'rate limited'
  }), { state: 'failed' });
});

test('выходы FAL, Replicate и KIE приводятся к одному безопасному формату', () => {
  assert.deepEqual(normalizeMusicOutput('fal_minimax_music_v2', {
    audio: {
      url: 'https://media.example.test/song.mp3',
      content_type: 'audio/mpeg',
      file_size: 123
    }
  }), {
    tracks: [{
      url: 'https://media.example.test/song.mp3',
      mimeType: 'audio/mpeg',
      size: 123
    }]
  });

  assert.deepEqual(
    normalizeMusicOutput(
      'replicate_lyria_2',
      'https://replicate.delivery/song.wav'
    ),
    {
      tracks: [{
        url: 'https://replicate.delivery/song.wav',
        mimeType: 'audio/wav'
      }]
    }
  );

  assert.throws(
    () => normalizeMusicOutput('replicate_lyria_2', 'file:///tmp/song.wav'),
    /output/iu
  );
});

test('маршруты с неприкреплённой ценой остаются неактивными', () => {
  for (const id of [
    'kie_suno_generate_v5',
    'kie_suno_extend_v5',
    'kie_suno_upload_cover_v5',
    'kie_suno_mashup_v5'
  ]) {
    const contract = getMusicProviderContract(id);
    assert.equal(contract.active, false);
    assert.equal(contract.inactiveReason, 'не закреплена стоимость кредита провайдера');
  }
});
