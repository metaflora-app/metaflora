import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { DurableAudioWorkflowStageStore } from '../src/audio-workflow-stage-store.js';

test('durable audio stage survives restart and never reruns a completed provider operation', async () => {
  const databasePath = join(mkdtempSync(join(tmpdir(), 'audio-stage-')), 'state.sqlite');
  let calls = 0;
  const first = new DurableAudioWorkflowStageStore(databasePath);
  const result = await first.run('workflow:audio-dub:10:1', async () => {
    calls += 1;
    return { dubbingId: 'dub_1', bytes: Buffer.from('ok') };
  });
  first.close();

  const second = new DurableAudioWorkflowStageStore(databasePath);
  const replay = await second.run('workflow:audio-dub:10:1', async () => {
    calls += 1;
    return { dubbingId: 'wrong' };
  });
  second.close();

  assert.equal(calls, 1);
  assert.deepEqual(replay, result);
  assert.deepEqual(replay.bytes, Buffer.from('ok'));
});

test('unfinished external stages become manual reconciliation instead of automatic retry', async () => {
  const databasePath = join(mkdtempSync(join(tmpdir(), 'audio-stage-')), 'state.sqlite');
  const store = new DurableAudioWorkflowStageStore(databasePath);
  await assert.rejects(store.run('stage:external:1', async ({ markExternalStarted }) => {
    markExternalStarted();
    throw new Error('network outcome unknown');
  }), /outcome_unknown/);
  await assert.rejects(store.run('stage:external:1', async () => ({ ok: true })), /manual_reconcile/);
  store.close();
});
