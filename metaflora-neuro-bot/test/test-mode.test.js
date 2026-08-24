import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTestModeReply,
  isAgentCallAllowed,
  isFreeLlmTestAllowed,
  isPaidCallAllowed
} from '../src/test-mode.js';

test('test mode keeps paid media calls disabled', () => {
  assert.equal(isPaidCallAllowed({ providerTestMode: true, enablePaidProviderCalls: false }), false);
  assert.equal(isPaidCallAllowed({ providerTestMode: false, enablePaidProviderCalls: true }), true);
  assert.match(buildTestModeReply('image'), /^сейчас генерация картинки временно выключена/);
});

test('free LLM test calls can be enabled without enabling paid provider calls', () => {
  assert.equal(isFreeLlmTestAllowed({ enableFreeLlmTestCalls: true }), true);
  assert.equal(isFreeLlmTestAllowed({ enableFreeLlmTestCalls: false }), false);
});

test('agent provider calls use their own explicit production switch', () => {
  assert.equal(isAgentCallAllowed({ enableAgentProviderCalls: true }), true);
  assert.equal(isAgentCallAllowed({ enableAgentProviderCalls: false }), false);
  assert.equal(isAgentCallAllowed({}), false);
});
