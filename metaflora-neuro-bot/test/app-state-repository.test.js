import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { AppStateRepository } from '../src/app-state-repository.js';
import { createReferralService } from '../src/referral-service.js';

function databasePath() {
  return join(mkdtempSync(join(tmpdir(), 'metaflora-state-')), 'state.sqlite');
}

test('user model, agent, settings, preferences and promo survive a repository restart', () => {
  const path = databasePath();
  const first = new AppStateRepository(path);
  first.saveUserState('10', {
    selectedModelId: 'seedance_20',
    selectedAgentId: 'business_analyst',
    modelSettings: { seedance_20: { duration: '12', resolution: '720p' } },
    agentSettings: { copywriter: { tone: 'warm' } },
    preferences: { language: 'ru', answerLength: 'short', showModel: 'off' },
    activePromoCode: 'FLORA25'
  });
  first.close();

  const second = new AppStateRepository(path);
  assert.deepEqual(second.loadUserState('10'), {
    selectedModelId: 'seedance_20',
    selectedAgentId: 'business_analyst',
    modelSettings: { seedance_20: { duration: '12', resolution: '720p' } },
    agentSettings: { copywriter: { tone: 'warm' } },
    preferences: { language: 'ru', answerLength: 'short', showModel: 'off' },
    activePromoCode: 'FLORA25'
  });
  second.close();
});

test('selected agent is stored independently without replacing the selected model', () => {
  const repository = new AppStateRepository(databasePath());

  repository.saveUserState('10', { selectedModelId: 'gpt_5_mini' });
  const state = repository.saveUserState('10', { selectedAgentId: 'copywriter' });

  assert.equal(state.selectedModelId, 'gpt_5_mini');
  assert.equal(state.selectedAgentId, 'copywriter');
  repository.close();
});

test('welcome agent session and bounded history survive a repository restart', () => {
  const path = databasePath();
  const first = new AppStateRepository(path);
  const startedAt = new Date('2026-07-26T04:00:00.000Z');
  const checkedAt = new Date('2026-07-26T04:00:30.000Z');

  assert.deepEqual(first.loadWelcomeAgentSession('10'), {
    active: false,
    messages: []
  });
  first.startWelcomeAgentSession('10', startedAt);
  first.appendWelcomeAgentMessage('10', 'user', 'что умеет раздел видео?', checkedAt);
  first.appendWelcomeAgentMessage('10', 'assistant', 'там собраны модели создания и обработки видео.', checkedAt);
  first.close();

  const second = new AppStateRepository(path);
  assert.deepEqual(second.loadWelcomeAgentSession('10', checkedAt), {
    active: true,
    messages: [
      { role: 'user', content: 'что умеет раздел видео?' },
      { role: 'assistant', content: 'там собраны модели создания и обработки видео.' }
    ]
  });
  second.stopWelcomeAgentSession('10', '2026-07-26T04:01:00.000Z');
  assert.deepEqual(second.loadWelcomeAgentSession('10', new Date('2026-07-26T04:01:00.000Z')), {
    active: false,
    messages: []
  });
  second.close();
});

test('welcome agent ignores malformed or oversized stored history', () => {
  const repository = new AppStateRepository(databasePath());
  repository.startWelcomeAgentSession('10');
  repository.database.prepare(`
    UPDATE welcome_agent_sessions
    SET messages_json = ?
    WHERE telegram_id = '10'
  `).run(JSON.stringify([null, 1, 'x', { role: 'user', content: 'нормальный вопрос' }]));

  assert.deepEqual(repository.loadWelcomeAgentSession('10').messages, [
    { role: 'user', content: 'нормальный вопрос' }
  ]);

  repository.database.prepare(`
    UPDATE welcome_agent_sessions
    SET messages_json = ?
    WHERE telegram_id = '10'
  `).run('x'.repeat(100_001));
  assert.deepEqual(repository.loadWelcomeAgentSession('10').messages, []);
  repository.close();
});

test('welcome agent quota is durable across repository instances', () => {
  const path = databasePath();
  const first = new AppStateRepository(path);
  assert.equal(first.consumeWelcomeAgentQuota('10', new Date('2026-07-26T04:00:00Z'), {
    minuteLimit: 2,
    dailyLimit: 3
  }), true);
  assert.equal(first.consumeWelcomeAgentQuota('10', new Date('2026-07-26T04:00:10Z'), {
    minuteLimit: 2,
    dailyLimit: 3
  }), true);
  first.close();

  const second = new AppStateRepository(path);
  assert.equal(second.consumeWelcomeAgentQuota('10', new Date('2026-07-26T04:00:20Z'), {
    minuteLimit: 2,
    dailyLimit: 3
  }), false);
  assert.equal(second.consumeWelcomeAgentQuota('10', new Date('2026-07-26T04:01:20Z'), {
    minuteLimit: 2,
    dailyLimit: 3
  }), true);
  assert.equal(second.consumeWelcomeAgentQuota('10', new Date('2026-07-26T04:02:20Z'), {
    minuteLimit: 2,
    dailyLimit: 3
  }), false);
  second.close();
});

test('abandoned welcome sessions expire and delete their history after 24 hours', () => {
  const repository = new AppStateRepository(databasePath());
  repository.startWelcomeAgentSession('10', new Date('2026-07-25T04:00:00Z'));
  repository.appendWelcomeAgentMessage(
    '10',
    'user',
    'старый вопрос',
    new Date('2026-07-25T04:01:00Z')
  );

  assert.deepEqual(
    repository.loadWelcomeAgentSession('10', new Date('2026-07-26T04:01:00Z')),
    { active: false, messages: [] }
  );
  repository.close();
});

test('app state database is private to the Railway process owner', () => {
  const path = databasePath();
  const repository = new AppStateRepository(path);
  repository.startWelcomeAgentSession('10');

  assert.equal(statSync(path).mode & 0o777, 0o600);
  repository.close();
});

test('repository adds selected_agent_id when opening an existing database', async () => {
  const path = databasePath();
  const { DatabaseSync } = await import('node:sqlite');
  const legacyDatabase = new DatabaseSync(path);
  legacyDatabase.exec(`
    CREATE TABLE app_user_state (
      telegram_id TEXT PRIMARY KEY,
      selected_model_id TEXT,
      model_settings_json TEXT NOT NULL DEFAULT '{}',
      preferences_json TEXT NOT NULL DEFAULT '{}',
      active_promo_code TEXT,
      updated_at TEXT NOT NULL
    );
    INSERT INTO app_user_state (
      telegram_id, selected_model_id, updated_at
    ) VALUES ('10', 'gpt_5_mini', '2026-07-26T00:00:00.000Z');
  `);
  legacyDatabase.close();

  const repository = new AppStateRepository(path);
  assert.deepEqual(repository.loadUserState('10'), {
    selectedModelId: 'gpt_5_mini',
    selectedAgentId: null,
    modelSettings: {},
    agentSettings: {},
    preferences: {},
    activePromoCode: null
  });
  repository.close();
});

test('promo generator enforces unique redemption and the global use limit', () => {
  const repository = new AppStateRepository(databasePath());
  const promo = repository.createPromo({
    code: 'START25',
    rewardType: 'discount_percent',
    rewardValue: 25,
    modelIds: ['gpt_5_mini'],
    maxUses: 2,
    expiresAt: '2027-01-01T00:00:00.000Z',
    createdBy: 'owner',
    now: '2026-07-24T00:00:00.000Z'
  });

  assert.equal(promo.code, 'START25');
  assert.equal(repository.redeemPromo('10', 'start25', '2026-07-24T00:00:00.000Z').rewardValue, 25);
  assert.throws(
    () => repository.redeemPromo('10', 'START25', '2026-07-24T00:01:00.000Z'),
    /уже активирован/i
  );
  assert.equal(repository.redeemPromo('11', 'START25', '2026-07-24T00:02:00.000Z').code, 'START25');
  assert.throws(
    () => repository.redeemPromo('12', 'START25', '2026-07-24T00:03:00.000Z'),
    /закончились/i
  );
  repository.close();
});

test('expired and unknown promo codes are rejected', () => {
  const repository = new AppStateRepository(databasePath());
  repository.createPromo({
    code: 'OLD100',
    rewardType: 'metacoins',
    rewardValue: 100,
    maxUses: 10,
    expiresAt: '2026-07-01T00:00:00.000Z',
    createdBy: 'owner',
    now: '2026-06-01T00:00:00.000Z'
  });

  assert.throws(() => repository.redeemPromo('10', 'UNKNOWN', '2026-07-24T00:00:00.000Z'), /не найден/i);
  assert.throws(() => repository.redeemPromo('10', 'OLD100', '2026-07-24T00:00:00.000Z'), /истёк/i);
  repository.close();
});

test('metacoin promo redemption and balance grant commit atomically', () => {
  const path = databasePath();
  const referralService = createReferralService({ databasePath: path });
  referralService.registerUser({ id: '10', username: 'tester' });
  const repository = new AppStateRepository(path);
  repository.createPromo({
    code: 'COINS100',
    rewardType: 'metacoins',
    rewardValue: 100,
    maxUses: 10,
    createdBy: 'owner'
  });

  const reward = repository.redeemPromo('10', 'COINS100');

  assert.equal(reward.rewardValue, 100);
  assert.equal(referralService.account('10').metacoinBalance, 100);
  assert.equal(repository.findPromo('COINS100').uses, 1);
  repository.close();
  referralService.close();
});

test('an arbitrary metacoin promo is granted exactly once at redemption', () => {
  const path = databasePath();
  const referralService = createReferralService({ databasePath: path });
  referralService.registerUser({ id: '314', username: 'promo-user' });
  const repository = new AppStateRepository(path);
  repository.createPromo({
    code: 'ODD137',
    rewardType: 'metacoins',
    rewardValue: 137,
    maxUses: 3,
    createdBy: 'crm-owner'
  });

  const redemption = repository.redeemPromo('314', 'ODD137');

  assert.deepEqual(redemption, {
    code: 'ODD137',
    rewardType: 'metacoins',
    rewardValue: 137
  });
  assert.equal(referralService.account('314').metacoinBalance, 137);
  assert.throws(() => repository.redeemPromo('314', 'ODD137'), /уже активирован/i);
  assert.equal(referralService.account('314').metacoinBalance, 137);
  assert.equal(repository.findPromo('ODD137').uses, 1);

  repository.close();
  referralService.close();
});

test('a generation discount stores one or many valid model ids and rejects unknown models', () => {
  const repository = new AppStateRepository(databasePath());
  const promo = repository.createPromo({
    code: 'SELECTED37',
    rewardType: 'discount_percent',
    rewardValue: 37,
    modelIds: ['gpt_5_mini', 'claude_sonnet_5'],
    maxUses: 9,
    createdBy: 'crm-owner'
  });

  assert.deepEqual(promo.modelIds, ['gpt_5_mini', 'claude_sonnet_5']);
  assert.deepEqual(repository.findPromo('SELECTED37').modelIds, ['gpt_5_mini', 'claude_sonnet_5']);
  assert.deepEqual(
    repository.redeemPromo('10', 'SELECTED37').modelIds,
    ['gpt_5_mini', 'claude_sonnet_5']
  );
  assert.throws(() => repository.createPromo({
    code: 'UNKNOWNMODEL',
    rewardType: 'discount_percent',
    rewardValue: 10,
    modelIds: ['model_that_does_not_exist'],
    maxUses: 1,
    createdBy: 'crm-owner'
  }), /модел/i);
  assert.throws(() => repository.createPromo({
    code: 'NOSCOPE',
    rewardType: 'discount_percent',
    rewardValue: 10,
    modelIds: [],
    maxUses: 1,
    createdBy: 'crm-owner'
  }), /модел/i);

  repository.close();
});

test('metacoin promo redemption rolls back when its user account is missing', () => {
  const path = databasePath();
  const referralService = createReferralService({ databasePath: path });
  const repository = new AppStateRepository(path);
  repository.createPromo({
    code: 'COINS50',
    rewardType: 'metacoins',
    rewardValue: 50,
    maxUses: 1,
    createdBy: 'owner'
  });

  assert.throws(() => repository.redeemPromo('99', 'COINS50'), /аккаунт пользователя/i);
  assert.equal(repository.findPromo('COINS50').uses, 0);
  assert.equal(repository.loadUserState('99').activePromoCode, null);

  repository.close();
  referralService.close();
});
