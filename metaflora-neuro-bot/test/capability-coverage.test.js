import assert from 'node:assert/strict';
import test from 'node:test';

import { AI_AGENT_COUNT, AI_TOOL_COUNT, MODEL_CATALOG_COUNT } from '../src/catalog-counts.js';
import {
  buildCapabilityCoverage,
  validateCapabilityCoverage
} from '../src/capability-coverage.js';
import { SCENARIO_CATALOG } from '../src/scenario-catalog.js';
import { modesForVideoModel } from '../src/video-constructor.js';
import { getModelById, inputProfileForModel } from '../src/model-catalog.js';

test('coverage matrix contains every public model, agent, and tool exactly once', () => {
  const coverage = buildCapabilityCoverage();

  assert.equal(coverage.models.length, MODEL_CATALOG_COUNT);
  assert.equal(coverage.agents.length, AI_AGENT_COUNT);
  assert.equal(coverage.tools.length, AI_TOOL_COUNT);

  for (const group of [coverage.models, coverage.agents, coverage.tools]) {
    assert.equal(new Set(group.map(({ id }) => id)).size, group.length);
  }
});

test('coverage validates route, card, price, and runtime contracts where applicable', () => {
  const coverage = buildCapabilityCoverage();
  const report = validateCapabilityCoverage(coverage);

  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.counts, {
    models: MODEL_CATALOG_COUNT,
    agents: AI_AGENT_COUNT,
    tools: AI_TOOL_COUNT
  });

  assert.ok(coverage.models.every(({ route, card, price }) => route && card && price));
  assert.ok(coverage.agents.every(({ route, card, runtime }) => route && card && runtime));
  assert.ok(coverage.tools.every(({ route, card, price, runtime }) => (
    route && card && price && runtime
  )));
});

test('every entity row lists only applicable point 1-6 capabilities with executable evidence', () => {
  const coverage = buildCapabilityCoverage();

  for (const row of [...coverage.models, ...coverage.agents, ...coverage.tools]) {
    assert.ok(Array.isArray(row.capabilities), `${row.id}: capabilities`);
    assert.equal(new Set(row.capabilities.map(({ id }) => id)).size, row.capabilities.length);
    assert.ok(row.capabilities.every(({ status }) => status === 'supported'));
  }

  for (const row of coverage.models) {
    const model = getModelById(row.id);
    const cyclic = inputProfileForModel(model).some(({ type, values }) => (
      type !== 'string' && values.length > 1
    ));
    assert.equal(row.capabilities.some(({ id }) => id === 'cyclic_settings'), cyclic, row.id);
    assert.deepEqual(
      row.capabilities.find(({ id }) => id === 'video_constructor')?.modes ?? [],
      modesForVideoModel(model),
      row.id
    );
  }

  assert.ok(coverage.agents.every(({ capabilities }) => (
    capabilities.some(({ id }) => id === 'cyclic_settings')
  )));
});

test('feature surfaces prove scenario targets and executable voice/dubbing contracts', () => {
  const coverage = buildCapabilityCoverage();

  assert.deepEqual(
    coverage.surfaces.scenarios.map(({ id, targetId }) => [id, targetId]),
    SCENARIO_CATALOG.map(({ id, targetId }) => [id, targetId])
  );
  assert.ok(coverage.surfaces.scenarios.every(({ status }) => status === 'supported'));
  assert.equal(coverage.surfaces.voiceLibrary.status, 'supported');
  assert.equal(coverage.surfaces.voiceLibrary.preview, true);
  assert.equal(coverage.surfaces.voiceLibrary.personalVoices, true);
  assert.deepEqual(coverage.surfaces.dubbing, {
    workflowId: 'voice_dub_video',
    status: 'supported',
    executionRoute: 'eleven.dubVideo',
    readyVoice: true,
    personalVoice: true,
    sourceAudioModes: ['сохранить', 'убрать', 'смешать']
  });
});
