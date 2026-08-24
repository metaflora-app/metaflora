import { parseArgs } from 'node:util';

import { AppStateRepository } from '../src/app-state-repository.js';
import { loadConfig } from '../src/config.js';

const { values } = parseArgs({
  options: {
    code: { type: 'string' },
    type: { type: 'string' },
    value: { type: 'string' },
    uses: { type: 'string' },
    expires: { type: 'string' }
  }
});

const rewardValue = Number(values.value);
const maxUses = Number(values.uses);
if (!values.type || !Number.isSafeInteger(rewardValue) || !Number.isSafeInteger(maxUses)) {
  throw new Error('укажи --type, --value и --uses.');
}

const config = loadConfig();
const repository = new AppStateRepository(config.appDatabasePath);
try {
  const promo = repository.createPromo({
    code: values.code,
    rewardType: values.type,
    rewardValue,
    maxUses,
    expiresAt: values.expires ? new Date(`${values.expires}T23:59:59.999Z`) : null,
    createdBy: 'cli'
  });
  process.stdout.write(`${JSON.stringify(promo, null, 2)}\n`);
} finally {
  repository.close();
}
