import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { getModelById } from './model-catalog.js';

function telegramId(value) {
  const id = String(value ?? '');
  if (!/^[1-9]\d{0,19}$/.test(id)) throw new TypeError('Invalid Telegram user id.');
  return id;
}

function promoCode(value) {
  const code = String(value ?? '').trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) throw new TypeError('Invalid promo code.');
  return code;
}

function jsonObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
  const serialized = JSON.stringify(value);
  if (serialized.length > 100_000) throw new TypeError(`${label} is too large.`);
  return serialized;
}

function parseObject(value) {
  try {
    const parsed = JSON.parse(value ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function isoDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.valueOf())) throw new TypeError('Invalid date.');
  return date.toISOString();
}

function generatedCode() {
  return `META-${randomBytes(5).toString('hex').toUpperCase()}`;
}

export class AppStateRepository {
  constructor(databasePath) {
    if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
    if (databasePath !== ':memory:') this.database.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;');
    this.databasePath = databasePath;
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS app_user_state (
        telegram_id TEXT PRIMARY KEY,
        selected_model_id TEXT,
        selected_agent_id TEXT,
        model_settings_json TEXT NOT NULL DEFAULT '{}',
        agent_settings_json TEXT NOT NULL DEFAULT '{}',
        preferences_json TEXT NOT NULL DEFAULT '{}',
        active_promo_code TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS promo_codes (
        code TEXT PRIMARY KEY,
        reward_type TEXT NOT NULL CHECK (reward_type IN ('metacoins', 'discount_percent')),
        reward_value INTEGER NOT NULL CHECK (reward_value > 0),
        max_uses INTEGER NOT NULL CHECK (max_uses > 0),
        uses INTEGER NOT NULL DEFAULT 0 CHECK (uses >= 0 AND uses <= max_uses),
        expires_at TEXT,
        active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        model_ids_json TEXT NOT NULL DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS promo_redemptions (
        code TEXT NOT NULL REFERENCES promo_codes(code),
        telegram_id TEXT NOT NULL,
        redeemed_at TEXT NOT NULL,
        PRIMARY KEY (code, telegram_id)
      );

      CREATE TABLE IF NOT EXISTS welcome_agent_sessions (
        telegram_id TEXT PRIMARY KEY,
        active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0, 1)),
        messages_json TEXT NOT NULL DEFAULT '[]',
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS welcome_agent_usage (
        telegram_id TEXT PRIMARY KEY,
        minute_started_at TEXT NOT NULL,
        minute_count INTEGER NOT NULL DEFAULT 0 CHECK (minute_count >= 0),
        day_key TEXT NOT NULL,
        daily_count INTEGER NOT NULL DEFAULT 0 CHECK (daily_count >= 0),
        updated_at TEXT NOT NULL
      );
    `);
    try { this.database.exec("ALTER TABLE promo_codes ADD COLUMN model_ids_json TEXT NOT NULL DEFAULT '[]'"); } catch {}
    const stateColumns = this.database.prepare('PRAGMA table_info(app_user_state)').all();
    if (!stateColumns.some(({ name }) => name === 'selected_agent_id')) {
      this.database.exec('ALTER TABLE app_user_state ADD COLUMN selected_agent_id TEXT;');
    }
    if (!stateColumns.some(({ name }) => name === 'agent_settings_json')) {
      this.database.exec("ALTER TABLE app_user_state ADD COLUMN agent_settings_json TEXT NOT NULL DEFAULT '{}';");
    }
    this.secureDatabaseFiles();
  }

  secureDatabaseFiles() {
    if (this.databasePath === ':memory:') return;
    for (const path of [
      this.databasePath,
      `${this.databasePath}-wal`,
      `${this.databasePath}-shm`
    ]) {
      if (existsSync(path)) chmodSync(path, 0o600);
    }
  }

  close() {
    this.database.close();
  }

  loadUserState(value) {
    const row = this.database.prepare(`
      SELECT selected_model_id, selected_agent_id, model_settings_json, agent_settings_json, preferences_json, active_promo_code
      FROM app_user_state
      WHERE telegram_id = ?
    `).get(telegramId(value));
    if (!row) {
      return Object.freeze({
        selectedModelId: null,
        selectedAgentId: null,
        modelSettings: {},
        agentSettings: {},
        preferences: {},
        activePromoCode: null
      });
    }
    return Object.freeze({
      selectedModelId: row.selected_model_id ?? null,
      selectedAgentId: row.selected_agent_id ?? null,
      modelSettings: parseObject(row.model_settings_json),
      agentSettings: parseObject(row.agent_settings_json),
      preferences: parseObject(row.preferences_json),
      activePromoCode: row.active_promo_code ?? null
    });
  }

  saveUserState(value, patch, now = new Date()) {
    const id = telegramId(value);
    const current = this.loadUserState(id);
    const next = {
      selectedModelId: Object.hasOwn(patch, 'selectedModelId') ? patch.selectedModelId : current.selectedModelId,
      selectedAgentId: Object.hasOwn(patch, 'selectedAgentId') ? patch.selectedAgentId : current.selectedAgentId,
      modelSettings: Object.hasOwn(patch, 'modelSettings') ? patch.modelSettings : current.modelSettings,
      agentSettings: Object.hasOwn(patch, 'agentSettings') ? patch.agentSettings : current.agentSettings,
      preferences: Object.hasOwn(patch, 'preferences') ? patch.preferences : current.preferences,
      activePromoCode: Object.hasOwn(patch, 'activePromoCode') ? patch.activePromoCode : current.activePromoCode
    };
    if (next.selectedModelId !== null && !/^[a-z0-9_]{1,80}$/.test(next.selectedModelId)) {
      throw new TypeError('Invalid model id.');
    }
    if (next.selectedAgentId !== null && !/^[a-z0-9_]{1,80}$/.test(next.selectedAgentId)) {
      throw new TypeError('Invalid agent id.');
    }
    if (next.activePromoCode !== null) promoCode(next.activePromoCode);
    this.database.prepare(`
      INSERT INTO app_user_state (
        telegram_id, selected_model_id, selected_agent_id, model_settings_json, agent_settings_json, preferences_json, active_promo_code, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(telegram_id) DO UPDATE SET
        selected_model_id = excluded.selected_model_id,
        selected_agent_id = excluded.selected_agent_id,
        model_settings_json = excluded.model_settings_json,
        agent_settings_json = excluded.agent_settings_json,
        preferences_json = excluded.preferences_json,
        active_promo_code = excluded.active_promo_code,
        updated_at = excluded.updated_at
    `).run(
      id,
      next.selectedModelId,
      next.selectedAgentId,
      jsonObject(next.modelSettings, 'modelSettings'),
      jsonObject(next.agentSettings, 'agentSettings'),
      jsonObject(next.preferences, 'preferences'),
      next.activePromoCode,
      isoDate(now)
    );
    return this.loadUserState(id);
  }

  loadWelcomeAgentSession(value, now = new Date()) {
    const id = telegramId(value);
    const row = this.database.prepare(`
      SELECT active, messages_json, updated_at
      FROM welcome_agent_sessions
      WHERE telegram_id = ?
    `).get(id);
    if (!row) return Object.freeze({ active: false, messages: Object.freeze([]) });
    const currentTime = Date.parse(isoDate(now));
    const updatedAt = Date.parse(row.updated_at);
    if (
      Boolean(row.active)
      && (!Number.isFinite(updatedAt) || currentTime - updatedAt >= 24 * 60 * 60 * 1_000)
    ) {
      this.database.prepare(`
        UPDATE welcome_agent_sessions
        SET active = 0, messages_json = '[]', updated_at = ?
        WHERE telegram_id = ?
      `).run(new Date(currentTime).toISOString(), id);
      this.secureDatabaseFiles();
      return Object.freeze({ active: false, messages: Object.freeze([]) });
    }
    let messages = [];
    try {
      const serialized = typeof row.messages_json === 'string' ? row.messages_json : '';
      if (Buffer.byteLength(serialized, 'utf8') > 100_000) {
        return Object.freeze({ active: Boolean(row.active), messages: Object.freeze([]) });
      }
      const parsed = JSON.parse(serialized);
      if (Array.isArray(parsed)) {
        messages = parsed
          .filter((item) => (
            item
            && typeof item === 'object'
            && ['user', 'assistant'].includes(item.role)
            && typeof item.content === 'string'
            && item.content.trim()
          ))
          .slice(-20)
          .map((item) => Object.freeze({
            role: item.role,
            content: item.content.trim().slice(0, 4_000)
          }));
      }
    } catch {
      messages = [];
    }
    return Object.freeze({
      active: Boolean(row.active),
      messages: Object.freeze(messages)
    });
  }

  startWelcomeAgentSession(value, now = new Date()) {
    const id = telegramId(value);
    this.database.prepare(`
      INSERT INTO welcome_agent_sessions (telegram_id, active, messages_json, updated_at)
      VALUES (?, 1, '[]', ?)
      ON CONFLICT(telegram_id) DO UPDATE SET
        active = 1,
        messages_json = '[]',
        updated_at = excluded.updated_at
    `).run(id, isoDate(now));
    this.secureDatabaseFiles();
    return this.loadWelcomeAgentSession(id, now);
  }

  appendWelcomeAgentMessage(value, role, content, now = new Date()) {
    const id = telegramId(value);
    if (!['user', 'assistant'].includes(role)) throw new TypeError('Invalid welcome agent role.');
    const normalizedContent = String(content ?? '').trim();
    if (!normalizedContent || normalizedContent.length > 4_000) {
      throw new TypeError('Invalid welcome agent message.');
    }
    const current = this.loadWelcomeAgentSession(id, now);
    if (!current.active) throw new Error('Welcome agent session is inactive.');
    const messages = [
      ...current.messages,
      Object.freeze({ role, content: normalizedContent })
    ].slice(-20);
    this.database.prepare(`
      UPDATE welcome_agent_sessions
      SET messages_json = ?, updated_at = ?
      WHERE telegram_id = ?
    `).run(JSON.stringify(messages), isoDate(now), id);
    this.secureDatabaseFiles();
    return this.loadWelcomeAgentSession(id, now);
  }

  stopWelcomeAgentSession(value, now = new Date()) {
    const id = telegramId(value);
    this.database.prepare(`
      INSERT INTO welcome_agent_sessions (telegram_id, active, messages_json, updated_at)
      VALUES (?, 0, '[]', ?)
      ON CONFLICT(telegram_id) DO UPDATE SET
        active = 0,
        messages_json = '[]',
        updated_at = excluded.updated_at
    `).run(id, isoDate(now));
    this.secureDatabaseFiles();
    return this.loadWelcomeAgentSession(id, now);
  }

  consumeWelcomeAgentQuota(value, now = new Date(), {
    minuteLimit = 6,
    dailyLimit = 50
  } = {}) {
    const id = telegramId(value);
    if (!Number.isSafeInteger(minuteLimit) || minuteLimit < 1) {
      throw new TypeError('Invalid welcome minute limit.');
    }
    if (!Number.isSafeInteger(dailyLimit) || dailyLimit < minuteLimit) {
      throw new TypeError('Invalid welcome daily limit.');
    }
    const timestamp = isoDate(now);
    const timestampMs = Date.parse(timestamp);
    const dayKey = timestamp.slice(0, 10);
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      const current = this.database.prepare(`
        SELECT minute_started_at, minute_count, day_key, daily_count
        FROM welcome_agent_usage
        WHERE telegram_id = ?
      `).get(id);
      const minuteExpired = !current
        || timestampMs - Date.parse(current.minute_started_at) >= 60_000
        || timestampMs < Date.parse(current.minute_started_at);
      const dayExpired = !current || current.day_key !== dayKey;
      const minuteCount = minuteExpired ? 0 : current.minute_count;
      const dailyCount = dayExpired ? 0 : current.daily_count;
      if (minuteCount >= minuteLimit || dailyCount >= dailyLimit) {
        this.database.exec('ROLLBACK;');
        return false;
      }

      this.database.prepare(`
        INSERT INTO welcome_agent_usage (
          telegram_id, minute_started_at, minute_count, day_key, daily_count, updated_at
        ) VALUES (?, ?, 1, ?, 1, ?)
        ON CONFLICT(telegram_id) DO UPDATE SET
          minute_started_at = excluded.minute_started_at,
          minute_count = ?,
          day_key = excluded.day_key,
          daily_count = ?,
          updated_at = excluded.updated_at
      `).run(
        id,
        minuteExpired ? timestamp : current.minute_started_at,
        dayKey,
        timestamp,
        minuteCount + 1,
        dailyCount + 1
      );
      this.database.exec('COMMIT;');
      this.secureDatabaseFiles();
      return true;
    } catch (error) {
      try {
        if (this.database.isTransaction) this.database.exec('ROLLBACK;');
      } catch {
        // Preserve the original database error.
      }
      throw error;
    }
  }

  createPromo({
    code = generatedCode(),
    rewardType,
    rewardValue,
    maxUses,
    expiresAt = null,
    createdBy,
    modelIds = [],
    now = new Date()
  }) {
    const normalizedCode = promoCode(code);
    if (!['metacoins', 'discount_percent'].includes(rewardType)) throw new TypeError('Invalid reward type.');
    if (!Number.isSafeInteger(rewardValue) || rewardValue <= 0) throw new TypeError('Invalid reward value.');
    if (rewardType === 'discount_percent' && rewardValue > 100) throw new TypeError('Discount exceeds 100%.');
    const scopedModels = [...new Set((Array.isArray(modelIds) ? modelIds : []).map(String))];
    if (rewardType === 'discount_percent' && (!scopedModels.length || scopedModels.some((id) => !getModelById(id)))) {
      throw new TypeError('Нужно выбрать существующие модели.');
    }
    if (rewardType === 'metacoins' && scopedModels.length) throw new TypeError('Metacoin promo cannot target models.');
    if (!Number.isSafeInteger(maxUses) || maxUses <= 0) throw new TypeError('Invalid use limit.');
    const expiration = expiresAt ? isoDate(expiresAt) : null;
    this.database.prepare(`
      INSERT INTO promo_codes (
        code, reward_type, reward_value, max_uses, expires_at, created_by, created_at, model_ids_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      normalizedCode,
      rewardType,
      rewardValue,
      maxUses,
      expiration,
      String(createdBy ?? '').slice(0, 80),
      isoDate(now),
      JSON.stringify(scopedModels)
    );
    return Object.freeze({
      code: normalizedCode,
      rewardType,
      rewardValue,
      maxUses,
      expiresAt: expiration,
      modelIds: Object.freeze(scopedModels)
    });
  }

  syncPromo({ code, rewardType, rewardValue, modelIds = [], maxUses = 1_000_000, expiresAt = null, active = true, createdBy = 'crm', createdAt = new Date() }) {
    const normalizedCode = promoCode(code);
    const scopedModels = [...new Set((Array.isArray(modelIds) ? modelIds : []).map(String))];
    if (!['metacoins', 'discount_percent'].includes(rewardType)
      || !Number.isSafeInteger(rewardValue) || rewardValue < 1
      || (rewardType === 'discount_percent' && (rewardValue > 100 || !scopedModels.length || scopedModels.some((id) => !getModelById(id))))) {
      throw new TypeError('Invalid synchronized promo.');
    }
    const safeMaxUses = Number.isSafeInteger(maxUses) && maxUses > 0 ? maxUses : 1_000_000;
    this.database.prepare(`
      INSERT INTO promo_codes (code, reward_type, reward_value, max_uses, expires_at, active, created_by, created_at, model_ids_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET
        reward_type = excluded.reward_type,
        reward_value = excluded.reward_value,
        max_uses = MAX(promo_codes.uses, excluded.max_uses),
        expires_at = excluded.expires_at,
        active = excluded.active,
        model_ids_json = excluded.model_ids_json
    `).run(normalizedCode, rewardType, rewardValue, safeMaxUses, expiresAt ? isoDate(expiresAt) : null, active ? 1 : 0, String(createdBy).slice(0, 80), isoDate(createdAt), JSON.stringify(scopedModels));
    return this.findPromo(normalizedCode);
  }

  findPromo(codeValue) {
    const row = this.database.prepare(`
      SELECT code, reward_type, reward_value, max_uses, uses, expires_at, active, model_ids_json
      FROM promo_codes
      WHERE code = ?
    `).get(promoCode(codeValue));
    if (!row) return null;
    return Object.freeze({
      code: row.code,
      rewardType: row.reward_type,
      rewardValue: Number(row.reward_value),
      maxUses: Number(row.max_uses),
      uses: Number(row.uses),
      expiresAt: row.expires_at ?? null,
      active: Boolean(row.active),
      modelIds: Object.freeze(Array.isArray(JSON.parse(row.model_ids_json ?? '[]')) ? JSON.parse(row.model_ids_json ?? '[]').map(String) : [])
    });
  }

  redeemPromo(value, codeValue, now = new Date()) {
    const id = telegramId(value);
    const code = promoCode(codeValue);
    const timestamp = isoDate(now);
    this.database.exec('BEGIN IMMEDIATE');
    try {
      const promo = this.database.prepare('SELECT * FROM promo_codes WHERE code = ?').get(code);
      if (!promo || !promo.active) throw new Error('промокод не найден.');
      if (promo.expires_at && promo.expires_at < timestamp) throw new Error('срок действия промокода истёк.');
      const existing = this.database.prepare(`
        SELECT 1 FROM promo_redemptions WHERE code = ? AND telegram_id = ?
      `).get(code, id);
      if (existing) throw new Error('этот промокод уже активирован.');
      if (promo.uses >= promo.max_uses) throw new Error('активации этого промокода закончились.');
      this.database.prepare(`
        INSERT INTO promo_redemptions (code, telegram_id, redeemed_at) VALUES (?, ?, ?)
      `).run(code, id, timestamp);
      this.database.prepare('UPDATE promo_codes SET uses = uses + 1 WHERE code = ?').run(code);
      this.saveUserState(id, { activePromoCode: code }, timestamp);
      if (promo.reward_type === 'metacoins') {
        const user = this.database.prepare(`
          SELECT 1 FROM referral_users WHERE telegram_id = ?
        `).get(id);
        if (!user) throw new Error('аккаунт пользователя для начисления не найден.');
        const grant = this.database.prepare(`
          INSERT OR IGNORE INTO promo_metacoin_grants (
            promo_code, telegram_id, amount, created_at
          ) VALUES (?, ?, ?, ?)
        `).run(code, id, promo.reward_value, timestamp);
        if (grant.changes) {
          this.database.prepare(`
            UPDATE referral_users
            SET metacoin_balance = metacoin_balance + ?
            WHERE telegram_id = ?
          `).run(promo.reward_value, id);
        }
      }
      this.database.exec('COMMIT');
      return Object.freeze({
        code,
        rewardType: promo.reward_type,
        rewardValue: promo.reward_value,
        ...(promo.reward_type === 'discount_percent' ? { modelIds: Object.freeze(JSON.parse(promo.model_ids_json ?? '[]').map(String)) } : {})
      });
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }
}
