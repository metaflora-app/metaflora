import test from 'node:test';
import assert from 'node:assert/strict';

import { listAgents } from '../src/agent-catalog.js';
import { calculateAgentRunPrice } from '../src/agent-economics.js';
import { buildAgentLlmRequest } from '../src/agent-runtime.js';
import { buildAgentCard } from '../src/agent-ui.js';
import { invokeFreeLlm } from '../src/llm-router.js';
import { exactProviderRoutesFor } from '../src/provider-route-matrix.js';

test('all 50 agents build a routed request and complete the provider boundary smoke', async () => {
  const agents = listAgents();
  const providerModels = new Set();

  assert.equal(agents.length, 50);

  for (const agent of agents) {
    const userPrompt = `тестовая задача для ${agent.name}`;
    const request = buildAgentLlmRequest({ agent, userPrompt });
    const card = buildAgentCard(agent);
    let body;

    assert.ok(request.settings.instructions.startsWith(agent.systemPrompt), agent.id);
    if (agent.riskTier === 'high') {
      assert.match(request.settings.instructions, /границы безопасности/i, agent.id);
    }
    assert.equal(request.messages[0].role, 'system', agent.id);
    assert.equal(request.messages[1].content, userPrompt, agent.id);
    assert.match(request.providerModelId, /^[a-z0-9][a-z0-9._/-]+$/i, agent.id);
    assert.ok(calculateAgentRunPrice(agent) > 0, agent.id);
    assert.match(card.text, new RegExp(`${calculateAgentRunPrice(agent)} метакоин`), agent.id);

    const result = await invokeFreeLlm({
      prompt: request.prompt,
      providerModel: request.providerModelId,
      providerKeys: { routerai: 'smoke-key', openrouter: 'free-smoke-key' },
      settings: request.settings,
      fetchImpl: async (_url, options) => {
        body = JSON.parse(options.body);
        return new Response(JSON.stringify({
          choices: [{ message: { content: `готово: ${agent.id}` } }]
        }), { status: 200 });
      }
    });

    const routedModel = exactProviderRoutesFor(request.providerModelId)
      .find(({ provider }) => provider === result.provider)?.providerModelId;
    assert.equal(body.model, routedModel ?? request.providerModelId, agent.id);
    assert.deepEqual(body.messages, [
      { role: 'system', content: request.settings.instructions.slice(0, 12_000) },
      { role: 'user', content: userPrompt }
    ], agent.id);
    assert.equal(result.text, `готово: ${agent.id}`, agent.id);
    providerModels.add(request.providerModelId);
  }

  assert.ok(providerModels.size >= 5, 'каталог должен использовать несколько реальных маршрутов');
});
