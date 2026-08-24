import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizePolzaPricing } from '../src/polza-pricing-normalizer.js';

test('normalizes live Polza LLM RUB token pricing', () => {
  assert.deepEqual(normalizePolzaPricing({
    input: { price: '109,28 ₽', unit: '1M tokens' },
    output: { price: 655.69, unit: '1M tokens' }
  }, { category: 'llm' }), {
    type: 'llm_tokens',
    inputRublesPerMillion: 109.28,
    outputRublesPerMillion: 655.69
  });
});

test('normalizes array-shaped Polza token pricing', () => {
  assert.deepEqual(normalizePolzaPricing([
    { type: 'input_tokens', price: '5 ₽', unit: '1M tokens' },
    { type: 'output_tokens', price: '15 ₽', unit: '1M tokens' }
  ], { category: 'llm' }), {
    type: 'llm_tokens',
    inputRublesPerMillion: 5,
    outputRublesPerMillion: 15
  });
});

test('normalizes live Polza video RUB second pricing', () => {
  assert.deepEqual(normalizePolzaPricing({
    video: {
      min: '12,82 ₽/сек',
      max: '46,5 ₽/сек'
    }
  }, { category: 'video' }), {
    type: 'video_seconds',
    minRublesPerSecond: 12.82,
    maxRublesPerSecond: 46.5
  });
});

test('normalizes live Polza image tiers as per-request pricing', () => {
  assert.deepEqual(normalizePolzaPricing({
    tiers: {
      standard: { per_request: '8 ₽' },
      pro: { per_request: '16 ₽' }
    }
  }, { category: 'image' }), {
    type: 'request_units',
    minRublesPerRequest: 8,
    maxRublesPerRequest: 16
  });
});

test('normalizes per-request music and video pricing', () => {
  assert.deepEqual(normalizePolzaPricing({
    per_request: { amount: '25 ₽' }
  }, { category: 'audio' }), {
    type: 'request_units',
    minRublesPerRequest: 25,
    maxRublesPerRequest: 25
  });
  assert.deepEqual(normalizePolzaPricing({
    per_request: { amount: '90 ₽' }
  }, { category: 'video' }), {
    type: 'request_units',
    minRublesPerRequest: 90,
    maxRublesPerRequest: 90
  });
});

test('normalizes video option tiers as one generation instead of multiplying by duration again', () => {
  assert.deepEqual(normalizePolzaPricing({
    tiers: [
      { conditions: [], cost_rub: '5.25' },
      { conditions: ['duration=8', 'sound=true'], cost_rub: '21.00' },
      { conditions: ['duration=12', 'sound=true'], cost_rub: '28.50' }
    ],
    currency: 'RUB'
  }, { category: 'video' }), {
    type: 'request_units',
    minRublesPerRequest: 5.25,
    maxRublesPerRequest: 28.5,
    tierPrices: [
      { conditions: {}, costRubles: 5.25 },
      { conditions: { duration: '8', sound: 'true' }, costRubles: 21 },
      { conditions: { duration: '12', sound: 'true' }, costRubles: 28.5 }
    ]
  });
});

test('keeps duration-unit video tiers as a per-second price', () => {
  assert.deepEqual(normalizePolzaPricing({
    tiers: [
      { conditions: ['mode=720p'], cost_rub: '8.25' },
      { conditions: ['mode=1080p'], cost_rub: '13.50' }
    ],
    unitParam: 'duration',
    currency: 'RUB'
  }, { category: 'video' }), {
    type: 'video_seconds',
    minRublesPerSecond: 8.25,
    maxRublesPerSecond: 13.5,
    tierPrices: [
      { conditions: { mode: '720p' }, costRubles: 8.25 },
      { conditions: { mode: '1080p' }, costRubles: 13.5 }
    ]
  });
});

test('normalizes STT minute and TTS character/token pricing', () => {
  assert.deepEqual(normalizePolzaPricing({
    stt_per_minute: { price: '3,5 ₽' }
  }, { category: 'voice' }), {
    type: 'audio_minutes',
    minRublesPerMinute: 3.5,
    maxRublesPerMinute: 3.5
  });
  assert.deepEqual(normalizePolzaPricing({
    chars: { price: '409,81 ₽', unit: '1M chars' }
  }, { category: 'voice' }), {
    type: 'character_million',
    minRublesPerMillionCharacters: 409.81,
    maxRublesPerMillionCharacters: 409.81
  });
  assert.deepEqual(normalizePolzaPricing({
    output_tokens: { price: '120 ₽', unit: '1M tokens' }
  }, { category: 'voice' }), {
    type: 'token_million',
    minRublesPerMillionTokens: 120,
    maxRublesPerMillionTokens: 120
  });
});

test('leaves currency-only Polza pricing unavailable', () => {
  assert.equal(normalizePolzaPricing({
    currency: 'RUB'
  }, { category: 'voice' }), null);
});

test('snapshot generator preserves normalized pricing and runnable metadata', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'polza-snapshot-'));
  const input = path.join(dir, 'catalog.json');
  const output = path.join(dir, 'provider-model-snapshot.js');
  fs.writeFileSync(input, JSON.stringify([
    {
      id: 'openai/gpt-test',
      name: 'GPT Test',
      type: 'chat',
      supported_parameters: ['temperature', 'max_tokens'],
      top_provider: {
        endpoint: 'https://polza.ai/api/v1/chat/completions',
        pricing: {
          input: { price: 10.5, unit: '1M tokens' },
          output: { price: 42, unit: '1M tokens' }
        }
      }
    },
    {
      id: 'bytedance/video-test',
      name: 'Video Test',
      type: 'video',
      top_provider: {
        endpoints: ['https://polza.ai/api/v1/media'],
        pricing: { video: { min: '1,5 ₽/сек', max: '3 ₽/сек' } }
      },
      parameters: {
        duration: { default: '4', values: ['4', '8'] },
        resolution: { default: '720p', values: ['720p', '1080p'] }
      }
    },
    {
      id: 'baai/bge-m3',
      name: 'BAAI: bge-m3',
      type: 'chat',
      top_provider: {
        pricing: { currency: 'RUB' }
      }
    }
  ]));

  execFileSync(process.execPath, [
    'scripts/build-provider-model-snapshot.js',
    input,
    output
  ], { cwd: process.cwd() });

  const contents = fs.readFileSync(output, 'utf8');
  assert.match(contents, /"pricing"/u);
  assert.match(contents, /"type": "llm_tokens"/u);
  assert.match(contents, /"inputRublesPerMillion": 10.5/u);
  assert.match(contents, /"type": "video_seconds"/u);
  assert.match(contents, /"maxRublesPerSecond": 3/u);
  assert.match(contents, /"supportedParameters"/u);
  assert.match(contents, /"endpointAvailable": true/u);
  assert.match(contents, /"providerParameters"/u);
  assert.match(contents, /"duration"/u);
  assert.match(contents, /"providerModelId": "baai\/bge-m3"[\s\S]*"category": "embedding"/u);
});
