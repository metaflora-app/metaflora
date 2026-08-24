import assert from 'node:assert/strict';
import test from 'node:test';

import { listAgents } from '../src/agent-catalog.js';
import { calculateAgentRunPrice } from '../src/agent-economics.js';
import { buildAgentCard } from '../src/agent-ui.js';
import {
  buildModelCard,
  formatModelMetacoinPrice,
  listCatalogModels
} from '../src/model-catalog.js';

test('every purchasable model card renders the current calculated metacoin price', () => {
  const models = listCatalogModels();
  assert.ok(models.length >= 400, `expected the full catalog, received ${models.length}`);

  for (const model of models) {
    if (model.availability === 'unavailable' || model.availability === 'early_access') continue;
    const expected = `${formatModelMetacoinPrice(model)} metacoins`;
    const normalizedCard = buildModelCard(model).text.replace('метакоинов', 'metacoins');
    assert.match(normalizedCard, new RegExp(`${expected.replace('–', '–')}\\b`), model.id);
  }
});

test('every agent card renders the current calculated metacoin price', () => {
  const agents = listAgents();
  assert.ok(agents.length >= 50);

  for (const agent of agents) {
    const expected = calculateAgentRunPrice(agent);
    assert.match(buildAgentCard(agent).text, new RegExp(`стоимость:[\\s\\S]* ${expected} метакоин`), agent.id);
  }
});
