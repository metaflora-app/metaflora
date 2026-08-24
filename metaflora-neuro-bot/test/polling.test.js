import test from 'node:test';
import assert from 'node:assert/strict';

import { processUpdateBatch, runPolling } from '../src/polling.js';

test('failed update is acknowledged so it cannot poison the polling queue', async () => {
  const errors = [];
  const processed = [];
  const nextOffset = await processUpdateBatch({
    updates: [{ update_id: 41 }, { update_id: 42 }],
    offset: 41,
    handleUpdate: async ({ update_id: updateId }) => {
      processed.push(updateId);
      throw new Error(`telegram unavailable ${updateId}`);
    },
    onError: (error) => errors.push(error.message)
  });

  assert.equal(nextOffset, 43);
  assert.deepEqual(processed, [41, 42]);
  assert.deepEqual(errors, ['telegram unavailable 41', 'telegram unavailable 42']);
});

test('a failed delivery does not block a later menu update in the same batch', async () => {
  const errors = [];
  const processed = [];
  const nextOffset = await processUpdateBatch({
    updates: [{ update_id: 51 }, { update_id: 52 }],
    offset: 51,
    handleUpdate: async ({ update_id: updateId }) => {
      processed.push(updateId);
      if (updateId === 51) throw new Error('result delivery failed');
    },
    onError: (error) => errors.push(error.message)
  });

  assert.equal(nextOffset, 53);
  assert.deepEqual(processed, [51, 52]);
  assert.deepEqual(errors, ['result delivery failed']);
});

test('polling recovers from a network failure without exiting', async () => {
  const controller = new AbortController();
  const offsets = [];
  const sleeps = [];
  let calls = 0;
  const telegram = {
    async getUpdates(offset) {
      offsets.push(offset);
      calls += 1;
      if (calls === 1) throw new Error('fetch failed');
      return [{ update_id: 7 }];
    }
  };

  const finalOffset = await runPolling({
    telegram,
    initialOffset: 0,
    handleUpdate: async () => controller.abort(),
    signal: controller.signal,
    sleepFn: async (milliseconds) => sleeps.push(milliseconds),
    onError: () => {}
  });

  assert.deepEqual(offsets, [0, 0]);
  assert.deepEqual(sleeps, [500]);
  assert.equal(finalOffset, 8);
});

test('successful empty polls reset backoff and stop on signal', async () => {
  const controller = new AbortController();
  const telegram = {
    async getUpdates() {
      controller.abort();
      return [];
    }
  };

  const finalOffset = await runPolling({
    telegram,
    initialOffset: 3,
    handleUpdate: async () => {},
    signal: controller.signal,
    sleepFn: async () => {},
    onError: () => {}
  });

  assert.equal(finalOffset, 3);
});
