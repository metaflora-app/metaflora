import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ACTIVE_PAID_PROVIDERS,
  buildProviderCoverageReport,
  coverageForModel
} from '../src/provider-coverage.js';
import { getModelById } from '../src/model-catalog.js';
import { POLZA_PUBLIC_MODELS } from '../src/provider-model-snapshot.js';

test('live provider snapshot exposes at least 270 confirmed public models', () => {
  assert.ok(POLZA_PUBLIC_MODELS.length >= 270);
  assert.equal(new Set(POLZA_PUBLIC_MODELS.map(({ providerModelId }) => providerModelId)).size, POLZA_PUBLIC_MODELS.length);
  assert.ok(POLZA_PUBLIC_MODELS.every(({ provider, providerModelId, category, available }) => (
    provider === 'polza'
      && providerModelId.length > 2
      && ['llm', 'image', 'video', 'audio', 'voice', 'embedding'].includes(category)
      && available === true
  )));
  assert.equal(buildProviderCoverageReport().summary.confirmedProviderModels, POLZA_PUBLIC_MODELS.length);
});

test('coverage report is deterministic and separates active, frozen, beta, unavailable and unrouted models', () => {
  const first = buildProviderCoverageReport();
  const second = buildProviderCoverageReport();

  assert.deepEqual(first, second);
  assert.deepEqual(ACTIVE_PAID_PROVIDERS, ['routerai', 'polza', 'kie']);
  assert.ok(first.payable.some(({ id }) => id === 'claude_opus_5'));
  assert.equal(first.frozen.some(({ id }) => id === 'gpt_oss_20b_free'), true);
  assert.equal(first.beta.some(({ id }) => id === 'inkling'), false);
  assert.ok(first.unavailable.every(({ state }) => state === 'unavailable'));
});

test('coverage uses executable tool routes rather than card branding', () => {
  const report = buildProviderCoverageReport();
  const falOnly = report.frozen.find(({ id }) => id === 'photo_generate');

  assert.ok(falOnly);
  assert.deepEqual(falOnly.providers, ['fal']);
  assert.equal(coverageForModel('does_not_exist'), null);
});

test('every catalog model appears in exactly one coverage bucket', () => {
  const report = buildProviderCoverageReport();
  const all = [report.payable, report.frozen, report.beta, report.unavailable, report.unrouted].flat();
  const ids = all.map(({ id }) => id);

  assert.equal(new Set(ids).size, ids.length);
  assert.equal(all.length, report.summary.total);
  assert.equal(
    report.summary.total,
    report.summary.payable
      + report.summary.frozen
      + report.summary.beta
      + report.summary.unavailable
      + report.summary.unrouted
  );
});

test('confirmed Polza aliases are attached to public cards', () => {
  assert.deepEqual(getModelById('gpt_56_terra').providerModels, ['openai/gpt-5.6-terra']);
  assert.deepEqual(getModelById('claude_fable_5').providerModels, ['anthropic/claude-fable-5']);
  assert.deepEqual(getModelById('gemini_36_flash').providerModels, ['google/gemini-3.6-flash']);
  assert.deepEqual(getModelById('gemini_31_pro').providerModels, ['google/gemini-3.1-pro-preview']);
  assert.deepEqual(getModelById('deepseek_v4_pro').providerModels, ['deepseek/deepseek-v4-pro']);
  assert.deepEqual(getModelById('qwen_3_vl').providerModels, ['qwen/qwen3-vl-235b-a22b-instruct']);
  assert.deepEqual(getModelById('minimax_m3').providerModels, ['minimax/minimax-m3']);
  assert.equal(getModelById('ru_gigaam_v3'), null);
  assert.equal(buildProviderCoverageReport().payable.some(({ id }) => id === 'gpt_oss_20b_free'), false);
});

test('coverage increases only from explicit active-provider aliases', () => {
  const report = buildProviderCoverageReport();

  assert.ok(report.summary.payable >= 70);
  assert.ok(report.unresolved.every(({ state }) => state === 'unrouted'));
});
