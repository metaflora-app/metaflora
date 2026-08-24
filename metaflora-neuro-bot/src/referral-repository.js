import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const METACOIN_BALANCE_CONTRACT = Object.freeze({
  authority: 'sqlite',
  table: 'referral_users',
  balanceColumn: 'metacoin_balance',
  debitTable: 'metacoin_debits',
  ledgerRole: 'supabase_history_audit_mirror'
});

function asTelegramId(value) {
  const id = String(value ?? '');
  if (!/^[1-9]\d{0,19}$/.test(id)) throw new TypeError('Invalid Telegram user id.');
  return id;
}

function asNonNegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${label} must be a non-negative integer.`);
  return value;
}

function asPositiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError(`${label} must be a positive integer.`);
  return value;
}

function asNonZeroInteger(value, label) {
  if (!Number.isSafeInteger(value) || value === 0) throw new TypeError(`${label} must be a non-zero integer.`);
  return value;
}

function asRequestKey(value) {
  const requestKey = String(value ?? '');
  if (!/^[A-Za-z0-9_.:-]{1,128}$/.test(requestKey)) throw new TypeError('Invalid request key.');
  return requestKey;
}

function asIsoDate(value, label) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) throw new TypeError(`${label} must be a valid date.`);
  return date.toISOString();
}

function userFromRow(row) {
  if (!row) return null;
  return Object.freeze({
    telegramId: row.telegram_id,
    username: row.username ?? '',
    firstName: row.first_name ?? '',
    referralCode: row.referral_code,
    referrerId: row.referrer_id,
    startedAt: row.started_at
  });
}

function withdrawalFromRow(row) {
  if (!row) return null;
  return Object.freeze({
    withdrawalId: row.withdrawal_id,
    telegramId: row.telegram_id,
    amountKopecks: Number(row.amount_kopecks),
    method: row.payout_method ?? 'sbp',
    destination: row.destination_hint ?? row.destination,
    destinationHint: row.destination_hint ?? row.destination,
    status: row.status,
    payoutStatus: row.payout_status ?? null,
    externalPayoutId: row.external_payout_id ?? null,
    payoutAttempts: Number(row.payout_attempts ?? 0),
    lastPayoutAttemptAt: row.last_payout_attempt_at ?? null,
    payoutFeeKopecks: row.payout_fee_kopecks === null || row.payout_fee_kopecks === undefined
      ? null
      : Number(row.payout_fee_kopecks),
    payoutErrorCode: row.payout_error_code ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    username: row.username ?? '',
    firstName: row.first_name ?? ''
  });
}

function asWithdrawalId(value) {
  const id = String(value ?? '');
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(id)) throw new TypeError('Invalid withdrawal id.');
  return id;
}

function asSetupToken(value) {
  const token = String(value ?? '');
  if (!/^[A-Za-z0-9_-]{16,128}$/u.test(token)) throw new TypeError('Invalid payout setup token.');
  return token;
}

function asStarsChargeId(value) {
  const id = String(value ?? '');
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new TypeError('Invalid Telegram Stars charge id.');
  return id;
}

function asPayoutMethod(value = 'sbp') {
  const method = String(value ?? '').trim();
  if (!['sbp', 'bank_card'].includes(method)) throw new TypeError('Invalid payout method.');
  return method;
}

export class ReferralRepository {
  constructor(databasePath) {
    if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
    if (databasePath !== ':memory:') this.database.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;');
    this.migrate();
  }

  migrate() {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS referral_users (
        telegram_id TEXT PRIMARY KEY,
        username TEXT NOT NULL DEFAULT '',
        first_name TEXT NOT NULL DEFAULT '',
        referral_code TEXT NOT NULL UNIQUE,
        referrer_id TEXT REFERENCES referral_users(telegram_id),
        referred_at TEXT,
        started_at TEXT,
        metacoin_balance INTEGER NOT NULL DEFAULT 0 CHECK (metacoin_balance >= 0),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS referral_users_referrer_idx
        ON referral_users(referrer_id);

      CREATE TABLE IF NOT EXISTS referral_payments (
        payment_id TEXT PRIMARY KEY,
        telegram_id TEXT NOT NULL REFERENCES referral_users(telegram_id),
        amount_kopecks INTEGER NOT NULL CHECK (amount_kopecks > 0),
        base_metacoins INTEGER NOT NULL CHECK (base_metacoins >= 0),
        bonus_metacoins INTEGER NOT NULL CHECK (bonus_metacoins >= 0),
        is_first_payment INTEGER NOT NULL CHECK (is_first_payment IN (0, 1)),
        confirmed_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS referral_payments_user_idx
        ON referral_payments(telegram_id, confirmed_at);

      CREATE TABLE IF NOT EXISTS subscription_payments (
        payment_id TEXT PRIMARY KEY,
        telegram_id TEXT NOT NULL REFERENCES referral_users(telegram_id),
        plan_id TEXT NOT NULL,
        duration_months INTEGER NOT NULL CHECK (duration_months IN (1, 3)),
        price_kopecks INTEGER NOT NULL CHECK (price_kopecks > 0),
        metacoins INTEGER NOT NULL CHECK (metacoins > 0),
        credited_metacoins INTEGER NOT NULL CHECK (credited_metacoins > 0),
        remaining_metacoins_before INTEGER NOT NULL DEFAULT 0 CHECK (remaining_metacoins_before >= 0),
        activated_at TEXT NOT NULL,
        starts_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS telegram_stars_payments (
        charge_id TEXT PRIMARY KEY,
        telegram_id TEXT NOT NULL REFERENCES referral_users(telegram_id),
        product_kind TEXT NOT NULL CHECK (product_kind IN ('package', 'plan')),
        product_id TEXT NOT NULL,
        duration_months INTEGER NOT NULL CHECK (duration_months IN (1, 3)),
        stars INTEGER NOT NULL CHECK (stars > 0),
        metacoins INTEGER NOT NULL CHECK (metacoins > 0),
        confirmed_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS crypto_usdc_entitlements (
        order_id TEXT PRIMARY KEY CHECK (order_id GLOB 'mfc_*'),
        telegram_id TEXT NOT NULL REFERENCES referral_users(telegram_id),
        product_kind TEXT NOT NULL CHECK (product_kind IN ('package', 'tariff')),
        product_id TEXT NOT NULL,
        duration_months INTEGER NOT NULL CHECK (duration_months IN (1, 3)),
        amount_usdc_micros INTEGER NOT NULL CHECK (amount_usdc_micros > 0),
        metacoins INTEGER NOT NULL CHECK (metacoins > 0),
        payment_rail TEXT NOT NULL CHECK (payment_rail = 'crypto_usdc'),
        funding_provider TEXT NOT NULL CHECK (funding_provider = 'openrouter'),
        confirmed_at TEXT NOT NULL,
        starts_at TEXT,
        expires_at TEXT,
        CHECK (
          (product_kind = 'package' AND starts_at IS NULL AND expires_at IS NULL)
          OR (product_kind = 'tariff' AND starts_at IS NOT NULL AND expires_at IS NOT NULL)
        )
      );

      CREATE INDEX IF NOT EXISTS crypto_usdc_entitlements_user_idx
        ON crypto_usdc_entitlements(telegram_id, confirmed_at);

      CREATE INDEX IF NOT EXISTS telegram_stars_payments_user_idx
        ON telegram_stars_payments(telegram_id, confirmed_at);

      CREATE INDEX IF NOT EXISTS subscription_payments_user_idx
        ON subscription_payments(telegram_id, activated_at);

      CREATE TABLE IF NOT EXISTS plan_upgrade_reservations (
        reservation_id TEXT PRIMARY KEY,
        telegram_id TEXT NOT NULL REFERENCES referral_users(telegram_id),
        from_plan_id TEXT NOT NULL,
        target_plan_id TEXT NOT NULL,
        duration_months INTEGER NOT NULL CHECK (duration_months IN (1, 3)),
        remaining_metacoins INTEGER NOT NULL CHECK (remaining_metacoins >= 0),
        status TEXT NOT NULL CHECK (status IN ('pending', 'consumed', 'released')),
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS plan_upgrade_reservations_pending_user_idx
        ON plan_upgrade_reservations(telegram_id) WHERE status = 'pending';

      CREATE TABLE IF NOT EXISTS referral_boosts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT NOT NULL REFERENCES referral_users(telegram_id),
        source_telegram_id TEXT NOT NULL REFERENCES referral_users(telegram_id),
        source_payment_id TEXT NOT NULL UNIQUE REFERENCES referral_payments(payment_id),
        percent INTEGER NOT NULL CHECK (percent > 0 AND percent <= 100),
        status TEXT NOT NULL CHECK (status IN ('available', 'consumed', 'cancelled')),
        created_at TEXT NOT NULL,
        consumed_payment_id TEXT REFERENCES referral_payments(payment_id),
        consumed_at TEXT
      );

      CREATE INDEX IF NOT EXISTS referral_boosts_available_idx
        ON referral_boosts(telegram_id, status, id);

      CREATE TABLE IF NOT EXISTS referral_earnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_id TEXT NOT NULL UNIQUE REFERENCES referral_payments(payment_id),
        partner_id TEXT NOT NULL REFERENCES referral_users(telegram_id),
        referral_id TEXT NOT NULL REFERENCES referral_users(telegram_id),
        amount_kopecks INTEGER NOT NULL CHECK (amount_kopecks >= 0),
        percent INTEGER NOT NULL CHECK (percent >= 0 AND percent <= 100),
        status TEXT NOT NULL CHECK (status IN ('pending', 'available', 'reversed')),
        created_at TEXT NOT NULL,
        available_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS referral_earnings_partner_idx
        ON referral_earnings(partner_id, status, created_at);

      CREATE TABLE IF NOT EXISTS referral_withdrawals (
        withdrawal_id TEXT PRIMARY KEY,
        telegram_id TEXT NOT NULL REFERENCES referral_users(telegram_id),
        amount_kopecks INTEGER NOT NULL CHECK (amount_kopecks > 0),
        payout_method TEXT NOT NULL DEFAULT 'sbp' CHECK (payout_method IN ('sbp', 'bank_card')),
        destination TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'rejected')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS payout_setup_tokens (
        setup_token TEXT PRIMARY KEY,
        telegram_id TEXT NOT NULL REFERENCES referral_users(telegram_id),
        amount_kopecks INTEGER NOT NULL CHECK (amount_kopecks > 0),
        payout_method TEXT NOT NULL CHECK (payout_method IN ('sbp', 'bank_card')),
        status TEXT NOT NULL CHECK (status IN ('pending', 'used', 'expired')),
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        used_at TEXT
      );

      CREATE INDEX IF NOT EXISTS payout_setup_tokens_status_idx
        ON payout_setup_tokens(status, expires_at);

      CREATE TABLE IF NOT EXISTS promo_metacoin_grants (
        promo_code TEXT NOT NULL,
        telegram_id TEXT NOT NULL REFERENCES referral_users(telegram_id),
        amount INTEGER NOT NULL CHECK (amount > 0),
        created_at TEXT NOT NULL,
        PRIMARY KEY (promo_code, telegram_id)
      );

      CREATE INDEX IF NOT EXISTS referral_withdrawals_user_idx
        ON referral_withdrawals(telegram_id, status, created_at);

      CREATE TABLE IF NOT EXISTS metacoin_debits (
        request_key TEXT PRIMARY KEY,
        telegram_id TEXT NOT NULL REFERENCES referral_users(telegram_id),
        amount INTEGER NOT NULL CHECK (amount > 0),
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS metacoin_debits_user_created_idx
        ON metacoin_debits(telegram_id, created_at);

      CREATE TABLE IF NOT EXISTS metacoin_reservations (
        request_key TEXT PRIMARY KEY,
        telegram_id TEXT NOT NULL REFERENCES referral_users(telegram_id),
        amount INTEGER NOT NULL CHECK (amount > 0),
        status TEXT NOT NULL CHECK (status IN ('reserved', 'committed', 'released')),
        reserved_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS metacoin_reservations_user_status_idx
        ON metacoin_reservations(telegram_id, status, updated_at);

      CREATE TABLE IF NOT EXISTS crm_admin_applied_actions (
        action_id TEXT PRIMARY KEY,
        telegram_id TEXT NOT NULL REFERENCES referral_users(telegram_id),
        kind TEXT NOT NULL CHECK (kind IN ('metacoins_adjusted', 'subscription_changed')),
        delta INTEGER,
        plan_id TEXT,
        duration_months INTEGER,
        metacoins INTEGER,
        expires_at TEXT,
        reason TEXT NOT NULL DEFAULT '',
        balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
        created_at TEXT NOT NULL
      );
    `);
    const userColumns = this.database.prepare('PRAGMA table_info(referral_users)').all();
    if (!userColumns.some(({ name }) => name === 'started_at')) {
      this.database.exec('ALTER TABLE referral_users ADD COLUMN started_at TEXT;');
    }
    const billingColumns = [
      ['subscription_plan_id', "TEXT NOT NULL DEFAULT 'newcomer'"],
      ['subscription_expires_at', 'TEXT'],
      ['subscription_metacoins_total', 'INTEGER NOT NULL DEFAULT 0'],
      ['subscription_metacoins_remaining', 'INTEGER NOT NULL DEFAULT 0'],
      ['subscription_price_kopecks', 'INTEGER NOT NULL DEFAULT 0'],
      ['subscription_duration_months', 'INTEGER NOT NULL DEFAULT 1'],
      ['spent_metacoins_1d', 'INTEGER NOT NULL DEFAULT 0'],
      ['spent_metacoins_30d', 'INTEGER NOT NULL DEFAULT 0']
    ];
    const knownColumns = new Set(userColumns.map(({ name }) => name));
    for (const [name, definition] of billingColumns) {
      if (!knownColumns.has(name)) {
        this.database.exec(`ALTER TABLE referral_users ADD COLUMN ${name} ${definition};`);
      }
    }
    const subscriptionColumns = this.database.prepare(
      'PRAGMA table_info(subscription_payments)'
    ).all();
    const upgradeReservationColumns = this.database.prepare(
      'PRAGMA table_info(plan_upgrade_reservations)'
    ).all();
    if (!upgradeReservationColumns.some(({ name }) => name === 'expires_at')) {
      this.database.exec("ALTER TABLE plan_upgrade_reservations ADD COLUMN expires_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z';");
    }
    if (!subscriptionColumns.some(({ name }) => name === 'starts_at')) {
      this.database.exec(`
        ALTER TABLE subscription_payments ADD COLUMN starts_at TEXT;
        UPDATE subscription_payments
        SET starts_at = activated_at
        WHERE starts_at IS NULL;
      `);
    }
    if (!subscriptionColumns.some(({ name }) => name === 'credited_metacoins')) {
      this.database.exec(`
        ALTER TABLE subscription_payments ADD COLUMN credited_metacoins INTEGER;
        UPDATE subscription_payments SET credited_metacoins = metacoins WHERE credited_metacoins IS NULL;
      `);
    }
    if (!subscriptionColumns.some(({ name }) => name === 'remaining_metacoins_before')) {
      this.database.exec(`
        ALTER TABLE subscription_payments ADD COLUMN remaining_metacoins_before INTEGER NOT NULL DEFAULT 0;
      `);
    }
    const withdrawalColumns = this.database.prepare(
      'PRAGMA table_info(referral_withdrawals)'
    ).all();
    if (!withdrawalColumns.some(({ name }) => name === 'payout_method')) {
      this.database.exec("ALTER TABLE referral_withdrawals ADD COLUMN payout_method TEXT NOT NULL DEFAULT 'sbp';");
    }
    const secureWithdrawalColumns = [
      ['destination_encrypted', 'TEXT'],
      ['destination_hint', "TEXT NOT NULL DEFAULT 'скрыто'"],
      ['external_payout_id', 'TEXT'],
      ['payout_status', 'TEXT'],
      ['payout_error_code', 'TEXT'],
      ['payout_attempts', 'INTEGER NOT NULL DEFAULT 0'],
      ['payout_idempotency_key', 'TEXT'],
      ['last_payout_attempt_at', 'TEXT'],
      ['payout_fee_kopecks', 'INTEGER']
    ];
    const secureColumnNames = new Set(
      this.database.prepare('PRAGMA table_info(referral_withdrawals)').all().map(({ name }) => name)
    );
    for (const [name, definition] of secureWithdrawalColumns) {
      if (!secureColumnNames.has(name)) {
        this.database.exec(`ALTER TABLE referral_withdrawals ADD COLUMN ${name} ${definition};`);
      }
    }
    this.database.exec(`
      UPDATE referral_withdrawals
      SET destination_hint = COALESCE(NULLIF(destination_hint, ''), 'скрыто')
      WHERE destination_hint IS NULL OR destination_hint = '';
    `);
    const schemaVersion = Number(this.database.prepare('PRAGMA user_version').get().user_version);
    if (schemaVersion < 2) {
      this.database.exec(`
        UPDATE referral_users
        SET started_at = COALESCE(started_at, created_at)
        WHERE started_at IS NULL;
        PRAGMA user_version = 2;
      `);
    }
    if (schemaVersion < 3) {
      this.database.exec('PRAGMA user_version = 3;');
    }
    if (schemaVersion < 4) {
      this.database.exec('PRAGMA user_version = 4;');
    }
    if (schemaVersion < 5) {
      this.database.exec('PRAGMA user_version = 5;');
    }
  }

  close() {
    this.database.close();
  }

  transaction(callback) {
    this.database.exec('BEGIN IMMEDIATE');
    try {
      const result = callback();
      this.database.exec('COMMIT');
      return result;
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  findUser(telegramId) {
    const row = this.database.prepare(`
      SELECT telegram_id, username, first_name, referral_code, referrer_id, started_at
      FROM referral_users WHERE telegram_id = ?
    `).get(asTelegramId(telegramId));
    return userFromRow(row);
  }

  findUserByReferralCode(code) {
    const row = this.database.prepare(`
      SELECT telegram_id, username, first_name, referral_code, referrer_id, started_at
      FROM referral_users WHERE referral_code = ?
    `).get(code);
    return userFromRow(row);
  }

  insertUser({ telegramId, username, firstName, referralCode, now }) {
    const id = asTelegramId(telegramId);
    this.database.prepare(`
      INSERT INTO referral_users (
        telegram_id, username, first_name, referral_code, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, username, firstName, referralCode, now, now);
    return this.findUser(id);
  }

  updateUser({ telegramId, username, firstName, now }) {
    const id = asTelegramId(telegramId);
    this.database.prepare(`
      UPDATE referral_users
      SET username = ?, first_name = ?, updated_at = ?
      WHERE telegram_id = ?
    `).run(username, firstName, now, id);
    return this.findUser(id);
  }

  bindReferrer({ telegramId, referrerId, now }) {
    const id = asTelegramId(telegramId);
    const inviterId = asTelegramId(referrerId);
    const result = this.database.prepare(`
      UPDATE referral_users
      SET referrer_id = ?, referred_at = ?, started_at = ?, updated_at = ?
      WHERE telegram_id = ? AND referrer_id IS NULL AND started_at IS NULL
    `).run(inviterId, now, now, now, id);
    return result.changes === 1;
  }

  markStarted(telegramId, now) {
    const id = asTelegramId(telegramId);
    this.database.prepare(`
      UPDATE referral_users
      SET started_at = COALESCE(started_at, ?), updated_at = ?
      WHERE telegram_id = ?
    `).run(now, now, id);
    return this.findUser(id);
  }

  payment(paymentId) {
    return this.database.prepare(`
      SELECT payment_id, telegram_id, amount_kopecks, base_metacoins, bonus_metacoins,
             is_first_payment, confirmed_at
      FROM referral_payments WHERE payment_id = ?
    `).get(paymentId);
  }

  paymentEarning(paymentId) {
    const row = this.database.prepare(`
      SELECT COALESCE(SUM(amount_kopecks), 0) AS amount_kopecks
      FROM referral_earnings
      WHERE payment_id = ? AND status != 'reversed'
    `).get(paymentId);
    return Number(row?.amount_kopecks ?? 0);
  }

  paymentEarningDetails(paymentId) {
    const row = this.database.prepare(`
      SELECT amount_kopecks, percent
      FROM referral_earnings
      WHERE payment_id = ? AND status != 'reversed'
      ORDER BY created_at ASC
      LIMIT 1
    `).get(paymentId);
    return row ? Object.freeze({
      amountKopecks: Number(row.amount_kopecks),
      percent: Number(row.percent)
    }) : null;
  }

  paymentCount(telegramId) {
    return Number(this.database.prepare(`
      SELECT COUNT(*) AS count FROM referral_payments WHERE telegram_id = ?
    `).get(asTelegramId(telegramId)).count);
  }

  subscriptionPayment(paymentId) {
    return this.database.prepare(`
      SELECT payment_id, telegram_id, plan_id, duration_months, price_kopecks,
             metacoins, credited_metacoins, remaining_metacoins_before,
             activated_at, starts_at, expires_at
      FROM subscription_payments
      WHERE payment_id = ?
    `).get(paymentId);
  }

  starsPayment(chargeId) {
    const row = this.database.prepare(`
      SELECT charge_id, telegram_id, product_kind, product_id,
             duration_months, stars, metacoins, confirmed_at
      FROM telegram_stars_payments
      WHERE charge_id = ?
    `).get(asStarsChargeId(chargeId));
    if (!row) return null;
    return Object.freeze({
      chargeId: row.charge_id,
      telegramId: row.telegram_id,
      kind: row.product_kind,
      productId: row.product_id,
      durationMonths: Number(row.duration_months),
      stars: Number(row.stars),
      metacoins: Number(row.metacoins),
      confirmedAt: row.confirmed_at
    });
  }

  insertStarsPayment({
    chargeId,
    telegramId,
    kind,
    productId,
    durationMonths,
    stars,
    metacoins,
    confirmedAt
  }) {
    this.database.prepare(`
      INSERT INTO telegram_stars_payments (
        charge_id, telegram_id, product_kind, product_id,
        duration_months, stars, metacoins, confirmed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      asStarsChargeId(chargeId),
      asTelegramId(telegramId),
      kind,
      productId,
      durationMonths,
      asPositiveInteger(stars, 'stars'),
      asPositiveInteger(metacoins, 'metacoins'),
      confirmedAt
    );
  }

  activateStarsSubscription({
    chargeId,
    telegramId,
    planId,
    durationMonths,
    durationDays,
    stars,
    metacoins,
    confirmedAt,
    startsAt,
    expiresAt
  }) {
    const id = asTelegramId(telegramId);
    this.database.prepare(`
      INSERT INTO telegram_stars_payments (
        charge_id, telegram_id, product_kind, product_id,
        duration_months, stars, metacoins, confirmed_at
      ) VALUES (?, ?, 'plan', ?, ?, ?, ?, ?)
    `).run(
      asStarsChargeId(chargeId),
      id,
      planId,
      durationMonths,
      asPositiveInteger(stars, 'stars'),
      asPositiveInteger(metacoins, 'metacoins'),
      confirmedAt
    );
    this.database.prepare(`
      UPDATE referral_users
      SET
        subscription_plan_id = ?,
        subscription_expires_at = ?,
        subscription_metacoins_total = ?,
        subscription_metacoins_remaining = ?,
        subscription_price_kopecks = 0,
        subscription_duration_months = ?,
        metacoin_balance = metacoin_balance + ?,
        updated_at = ?
      WHERE telegram_id = ?
    `).run(
      planId,
      expiresAt,
      metacoins,
      metacoins,
      durationMonths,
      metacoins,
      confirmedAt,
      id
    );
    return Object.freeze({ status: 'activated', chargeId, startsAt, expiresAt });
  }

  fulfillCryptoEntitlement({
    orderId,
    telegramId,
    kind,
    productId,
    durationMonths,
    amountUsdcMicros,
    metacoins,
    paymentRail,
    fundingProvider,
    confirmedAt,
    startsAt = null,
    expiresAt = null
  }) {
    const id = asTelegramId(telegramId);
    if (!/^mfc_[a-f0-9]{32}$/u.test(String(orderId))) throw new TypeError('Invalid crypto order id.');
    if (!['package', 'tariff'].includes(kind)) throw new TypeError('Invalid crypto product kind.');
    if (!/^[a-z][a-z0-9_]{1,63}$/u.test(String(productId))) throw new TypeError('Invalid crypto product id.');
    if (![1, 3].includes(durationMonths)) throw new TypeError('Invalid crypto duration.');
    if (paymentRail !== 'crypto_usdc' || fundingProvider !== 'openrouter') {
      throw new TypeError('Invalid crypto entitlement provenance.');
    }
    const existing = this.database.prepare(`
      SELECT * FROM crypto_usdc_entitlements WHERE order_id = ?
    `).get(orderId);
    if (existing) {
      const matches = existing.telegram_id === id
        && existing.product_kind === kind
        && existing.product_id === productId
        && Number(existing.duration_months) === durationMonths
        && Number(existing.amount_usdc_micros) === amountUsdcMicros
        && Number(existing.metacoins) === metacoins
        && existing.payment_rail === paymentRail
        && existing.funding_provider === fundingProvider
        && existing.confirmed_at === confirmedAt
        && (existing.starts_at ?? null) === startsAt
        && (existing.expires_at ?? null) === expiresAt;
      if (!matches) throw new Error('Crypto entitlement idempotency payload conflicts.');
      return Object.freeze({
        status: 'duplicate', orderId, startsAt: existing.starts_at, expiresAt: existing.expires_at
      });
    }
    const user = this.database.prepare(`
      SELECT telegram_id FROM referral_users WHERE telegram_id = ?
    `).get(id);
    if (!user) throw new Error('Crypto entitlement user is not registered.');
    this.database.prepare(`
      INSERT INTO crypto_usdc_entitlements (
        order_id, telegram_id, product_kind, product_id, duration_months,
        amount_usdc_micros, metacoins, payment_rail, funding_provider,
        confirmed_at, starts_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId, id, kind, productId, durationMonths, amountUsdcMicros, metacoins,
      paymentRail, fundingProvider, confirmedAt, startsAt, expiresAt
    );
    if (kind === 'package') {
      this.database.prepare(`
        UPDATE referral_users
        SET metacoin_balance = metacoin_balance + ?, updated_at = ?
        WHERE telegram_id = ?
      `).run(metacoins, confirmedAt, id);
    } else {
      this.database.prepare(`
        UPDATE referral_users
        SET subscription_plan_id = ?, subscription_expires_at = ?,
          subscription_metacoins_total = ?, subscription_metacoins_remaining = ?,
          subscription_price_kopecks = 0, subscription_duration_months = ?,
          metacoin_balance = metacoin_balance + ?, updated_at = ?
        WHERE telegram_id = ?
      `).run(productId, expiresAt, metacoins, metacoins, durationMonths, metacoins, confirmedAt, id);
    }
    return Object.freeze({ status: 'fulfilled', orderId, startsAt, expiresAt });
  }

  cryptoEntitlement(orderId) {
    if (!/^mfc_[a-f0-9]{32}$/u.test(String(orderId))) throw new TypeError('Invalid crypto order id.');
    return this.database.prepare(`SELECT * FROM crypto_usdc_entitlements WHERE order_id = ?`).get(orderId) ?? null;
  }

  insertPayment({
    paymentId,
    telegramId,
    amountKopecks,
    baseMetacoins,
    bonusMetacoins,
    isFirstPayment,
    confirmedAt
  }) {
    this.database.prepare(`
      INSERT INTO referral_payments (
        payment_id, telegram_id, amount_kopecks, base_metacoins,
        bonus_metacoins, is_first_payment, confirmed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      paymentId,
      asTelegramId(telegramId),
      asNonNegativeInteger(amountKopecks, 'amountKopecks'),
      asNonNegativeInteger(baseMetacoins, 'baseMetacoins'),
      asNonNegativeInteger(bonusMetacoins, 'bonusMetacoins'),
      isFirstPayment ? 1 : 0,
      confirmedAt
    );
  }

  addMetacoins(telegramId, amount) {
    this.database.prepare(`
      UPDATE referral_users
      SET metacoin_balance = metacoin_balance + ?
      WHERE telegram_id = ?
    `).run(asNonNegativeInteger(amount, 'amount'), asTelegramId(telegramId));
  }

  activateSubscription({
    paymentId,
    telegramId,
    planId,
    durationMonths,
    priceKopecks,
    metacoins,
    creditedMetacoins = metacoins,
    remainingPlanMetacoinsBefore = 0,
    upgradeReservationId = null,
    activatedAt,
    startsAt,
    expiresAt
  }) {
    const id = asTelegramId(telegramId);
    const upgradeReservation = upgradeReservationId
      ? this.database.prepare(`
          SELECT * FROM plan_upgrade_reservations WHERE reservation_id = ?
        `).get(upgradeReservationId)
      : null;
    if (upgradeReservationId && (!upgradeReservation
      || upgradeReservation.telegram_id !== id
      || upgradeReservation.target_plan_id !== planId
      || Number(upgradeReservation.duration_months) !== durationMonths
      || Number(upgradeReservation.remaining_metacoins) !== remainingPlanMetacoinsBefore
      || !['pending', 'consumed'].includes(upgradeReservation.status))) {
      throw new Error('Upgrade reservation does not match the subscription activation.');
    }
    const existing = this.database.prepare(`
      SELECT payment_id, telegram_id, plan_id, duration_months, price_kopecks,
             metacoins, credited_metacoins, remaining_metacoins_before,
             activated_at, starts_at, expires_at
      FROM subscription_payments
      WHERE payment_id = ?
    `).get(paymentId);
    if (existing) {
      const matches = existing.telegram_id === id
        && existing.plan_id === planId
        && Number(existing.duration_months) === durationMonths
        && Number(existing.price_kopecks) === priceKopecks
        && Number(existing.metacoins) === metacoins
        && Number(existing.credited_metacoins) === creditedMetacoins
        && Number(existing.remaining_metacoins_before) === remainingPlanMetacoinsBefore
        && existing.activated_at === activatedAt
        && existing.starts_at === startsAt
        && existing.expires_at === expiresAt;
      if (!matches) throw new Error('Subscription payment id collision with a different payload.');
      return Object.freeze({
        status: 'duplicate',
        paymentId,
        startsAt: existing.starts_at,
        expiresAt: existing.expires_at
      });
    }

    this.database.prepare(`
      INSERT INTO subscription_payments (
        payment_id, telegram_id, plan_id, duration_months, price_kopecks,
        metacoins, credited_metacoins, remaining_metacoins_before,
        activated_at, starts_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      paymentId,
      id,
      planId,
      durationMonths,
      priceKopecks,
      metacoins,
      creditedMetacoins,
      remainingPlanMetacoinsBefore,
      activatedAt,
      startsAt,
      expiresAt
    );
    this.database.prepare(`
      UPDATE referral_users
      SET
        subscription_plan_id = ?,
        subscription_expires_at = ?,
        subscription_metacoins_total = ?,
        subscription_metacoins_remaining = ?,
        subscription_price_kopecks = ?,
        subscription_duration_months = ?,
        metacoin_balance = metacoin_balance + ?,
        updated_at = ?
      WHERE telegram_id = ?
    `).run(
      planId,
      expiresAt,
      metacoins,
      metacoins,
      priceKopecks,
      durationMonths,
      upgradeReservation ? metacoins : creditedMetacoins,
      activatedAt,
      id
    );
    if (upgradeReservation) {
      this.database.prepare(`
        UPDATE plan_upgrade_reservations
        SET status = 'consumed', updated_at = ?
        WHERE reservation_id = ? AND status = 'pending'
      `).run(activatedAt, upgradeReservationId);
    }
    return Object.freeze({ status: 'activated', paymentId, startsAt, expiresAt });
  }

  reservePlanUpgrade({
    reservationId,
    telegramId,
    fromPlanId,
    targetPlanId,
    durationMonths,
    currentDurationMonths = durationMonths,
    remainingPlanMetacoins,
    now,
    expiresAt
  }) {
    const id = asTelegramId(telegramId);
    const existing = this.database.prepare(`
      SELECT * FROM plan_upgrade_reservations WHERE reservation_id = ?
    `).get(reservationId);
    if (existing) {
      const matches = existing.telegram_id === id
        && existing.from_plan_id === fromPlanId
        && existing.target_plan_id === targetPlanId
        && Number(existing.duration_months) === durationMonths
        && Number(existing.remaining_metacoins) === remainingPlanMetacoins;
      if (!matches) throw new Error('Upgrade reservation id collision.');
      if (existing.status === 'pending') return Object.freeze({ status: 'duplicate' });
      if (existing.status === 'consumed') return Object.freeze({ status: 'consumed' });
      if (existing.status !== 'released') throw new Error('Upgrade reservation has an invalid state.');
    }
    const pendingGeneration = this.database.prepare(`
      SELECT 1
      FROM metacoin_reservations
      WHERE telegram_id = ? AND status = 'reserved'
      LIMIT 1
    `).get(id);
    if (pendingGeneration) {
      throw new Error('A generation reservation is pending; the upgrade cannot be reserved.');
    }
    const changed = this.database.prepare(`
      UPDATE referral_users
      SET metacoin_balance = metacoin_balance - ?,
          subscription_metacoins_remaining = 0,
          updated_at = ?
      WHERE telegram_id = ?
        AND subscription_plan_id = ?
        AND subscription_duration_months = ?
        AND subscription_metacoins_remaining = ?
        AND metacoin_balance >= ?
    `).run(
      remainingPlanMetacoins, now, id, fromPlanId, currentDurationMonths,
      remainingPlanMetacoins, remainingPlanMetacoins
    );
    if (!changed.changes) throw new Error('Subscription changed before the upgrade could be reserved.');
    if (existing?.status === 'released') {
      this.database.prepare(`
        UPDATE plan_upgrade_reservations
        SET status = 'pending', created_at = ?, updated_at = ?, expires_at = ?
        WHERE reservation_id = ? AND status = 'released'
      `).run(now, now, expiresAt, reservationId);
    } else {
      this.database.prepare(`
        INSERT INTO plan_upgrade_reservations (
          reservation_id, telegram_id, from_plan_id, target_plan_id,
          duration_months, remaining_metacoins, status, created_at, updated_at,
          expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
      `).run(
        reservationId, id, fromPlanId, targetPlanId, durationMonths,
        remainingPlanMetacoins, now, now, expiresAt
      );
    }
    return Object.freeze({ status: 'reserved' });
  }

  releasePlanUpgrade({ reservationId, telegramId, now }) {
    const id = asTelegramId(telegramId);
    const reservation = this.database.prepare(`
      SELECT * FROM plan_upgrade_reservations WHERE reservation_id = ?
    `).get(reservationId);
    if (!reservation || reservation.telegram_id !== id) throw new Error('Upgrade reservation not found.');
    if (reservation.status === 'released') return Object.freeze({ status: 'released' });
    if (reservation.status === 'consumed') return Object.freeze({ status: 'consumed' });
    this.database.prepare(`
      UPDATE referral_users
      SET metacoin_balance = metacoin_balance + ?,
          subscription_metacoins_remaining = subscription_metacoins_remaining + ?,
          updated_at = ?
      WHERE telegram_id = ? AND subscription_plan_id = ?
    `).run(reservation.remaining_metacoins, reservation.remaining_metacoins, now, id, reservation.from_plan_id);
    this.database.prepare(`
      UPDATE plan_upgrade_reservations SET status = 'released', updated_at = ?
      WHERE reservation_id = ?
    `).run(now, reservationId);
    return Object.freeze({ status: 'released' });
  }

  releaseExpiredPlanUpgrades({ now }) {
    const rows = this.database.prepare(`
      SELECT reservation_id, telegram_id FROM plan_upgrade_reservations
      WHERE status = 'pending' AND expires_at <= ?
    `).all(now);
    for (const row of rows) {
      this.releasePlanUpgrade({
        reservationId: row.reservation_id,
        telegramId: row.telegram_id,
        now
      });
    }
    return rows.length;
  }

  debitMetacoins({ telegramId, amount, requestKey, now }) {
    const id = asTelegramId(telegramId);
    const debitAmount = asPositiveInteger(amount, 'amount');
    const key = asRequestKey(requestKey);
    const timestamp = asIsoDate(now, 'now');
    const dayStart = new Date(new Date(timestamp).valueOf() - 86_400_000).toISOString();
    const monthStart = new Date(new Date(timestamp).valueOf() - 30 * 86_400_000).toISOString();

    return this.transaction(() => {
      const existing = this.database.prepare(`
        SELECT telegram_id, amount
        FROM metacoin_debits
        WHERE request_key = ?
      `).get(key);
      if (existing) {
        if (existing.telegram_id !== id || Number(existing.amount) !== debitAmount) {
          throw new Error('Request key collision with a different debit payload.');
        }
        return this.debitResult('duplicate', id, key, debitAmount);
      }
      const pendingUpgrade = this.database.prepare(`
        SELECT 1
        FROM plan_upgrade_reservations
        WHERE telegram_id = ? AND status = 'pending'
        LIMIT 1
      `).get(id);
      if (pendingUpgrade) {
        throw new Error('A subscription upgrade reservation is pending; generation is temporarily unavailable.');
      }

      const changed = this.database.prepare(`
        UPDATE referral_users
        SET
          metacoin_balance = metacoin_balance - ?,
          subscription_metacoins_remaining = MAX(0, subscription_metacoins_remaining - ?),
          updated_at = ?
        WHERE telegram_id = ? AND metacoin_balance >= ?
      `).run(debitAmount, debitAmount, timestamp, id, debitAmount);
      if (!changed.changes) {
        const user = this.database.prepare(`
          SELECT metacoin_balance FROM referral_users WHERE telegram_id = ?
        `).get(id);
        if (!user) throw new Error('Debit user is not registered.');
        return this.debitResult('insufficient_funds', id, key, debitAmount);
      }

      this.database.prepare(`
        INSERT INTO metacoin_debits (request_key, telegram_id, amount, created_at)
        VALUES (?, ?, ?, ?)
      `).run(key, id, debitAmount, timestamp);
      const spent = this.database.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN created_at >= ? THEN amount ELSE 0 END), 0) AS spent_1d,
          COALESCE(SUM(CASE WHEN created_at >= ? THEN amount ELSE 0 END), 0) AS spent_30d
        FROM metacoin_debits
        WHERE telegram_id = ? AND created_at <= ?
      `).get(dayStart, monthStart, id, timestamp);
      this.database.prepare(`
        UPDATE referral_users
        SET spent_metacoins_1d = ?, spent_metacoins_30d = ?
        WHERE telegram_id = ?
      `).run(Number(spent.spent_1d), Number(spent.spent_30d), id);

      return this.debitResult('debited', id, key, debitAmount);
    });
  }

  reserveMetacoins({ telegramId, amount, requestKey, now }) {
    const id = asTelegramId(telegramId);
    const reservationAmount = asPositiveInteger(amount, 'amount');
    const key = asRequestKey(requestKey);
    const timestamp = asIsoDate(now, 'now');

    return this.transaction(() => {
      const existingDebit = this.database.prepare(`
        SELECT telegram_id, amount
        FROM metacoin_debits
        WHERE request_key = ?
      `).get(key);
      if (existingDebit) {
        if (existingDebit.telegram_id !== id || Number(existingDebit.amount) !== reservationAmount) {
          throw new Error('Request key collision with a different debit payload.');
        }
        return this.debitResult('duplicate', id, key, reservationAmount);
      }

      const existing = this.database.prepare(`
        SELECT telegram_id, amount, status
        FROM metacoin_reservations
        WHERE request_key = ?
      `).get(key);
      if (existing) {
        if (existing.telegram_id !== id || Number(existing.amount) !== reservationAmount) {
          throw new Error('Request key collision with a different reservation payload.');
        }
        if (existing.status === 'committed') {
          return this.debitResult('duplicate', id, key, reservationAmount);
        }
        if (existing.status === 'reserved') {
          return this.reservationResult('reserved', id, key, reservationAmount);
        }
      }
      const pendingUpgrade = this.database.prepare(`
        SELECT 1
        FROM plan_upgrade_reservations
        WHERE telegram_id = ? AND status = 'pending'
        LIMIT 1
      `).get(id);
      if (pendingUpgrade) {
        throw new Error('A subscription upgrade reservation is pending; generation is temporarily unavailable.');
      }

      const changed = this.database.prepare(`
        UPDATE referral_users
        SET metacoin_balance = metacoin_balance - ?, updated_at = ?
        WHERE telegram_id = ? AND metacoin_balance >= ?
      `).run(reservationAmount, timestamp, id, reservationAmount);
      if (!changed.changes) {
        const user = this.database.prepare(`
          SELECT metacoin_balance FROM referral_users WHERE telegram_id = ?
        `).get(id);
        if (!user) throw new Error('Reservation user is not registered.');
        return this.reservationResult('insufficient_funds', id, key, reservationAmount);
      }

      if (existing?.status === 'released') {
        this.database.prepare(`
          UPDATE metacoin_reservations
          SET status = 'reserved', updated_at = ?
          WHERE request_key = ?
        `).run(timestamp, key);
      } else {
        this.database.prepare(`
          INSERT INTO metacoin_reservations (
            request_key, telegram_id, amount, status, reserved_at, updated_at
          ) VALUES (?, ?, ?, 'reserved', ?, ?)
        `).run(key, id, reservationAmount, timestamp, timestamp);
      }
      return this.reservationResult('reserved', id, key, reservationAmount);
    });
  }

  commitMetacoins({ telegramId, amount, requestKey, now }) {
    const id = asTelegramId(telegramId);
    const debitAmount = asPositiveInteger(amount, 'amount');
    const key = asRequestKey(requestKey);
    const timestamp = asIsoDate(now, 'now');
    const dayStart = new Date(new Date(timestamp).valueOf() - 86_400_000).toISOString();
    const monthStart = new Date(new Date(timestamp).valueOf() - 30 * 86_400_000).toISOString();

    return this.transaction(() => {
      const reservation = this.database.prepare(`
        SELECT telegram_id, amount, status
        FROM metacoin_reservations
        WHERE request_key = ?
      `).get(key);
      if (!reservation) throw new Error('Metacoin reservation not found.');
      if (reservation.telegram_id !== id || Number(reservation.amount) !== debitAmount) {
        throw new Error('Request key collision with a different reservation payload.');
      }
      if (reservation.status === 'committed') {
        return this.debitResult('duplicate', id, key, debitAmount);
      }
      if (reservation.status !== 'reserved') {
        return this.reservationResult('released', id, key, debitAmount);
      }

      this.database.prepare(`
        INSERT INTO metacoin_debits (request_key, telegram_id, amount, created_at)
        VALUES (?, ?, ?, ?)
      `).run(key, id, debitAmount, timestamp);
      this.database.prepare(`
        UPDATE referral_users
        SET subscription_metacoins_remaining = MAX(0, subscription_metacoins_remaining - ?),
            updated_at = ?
        WHERE telegram_id = ?
      `).run(debitAmount, timestamp, id);
      const spent = this.database.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN created_at >= ? THEN amount ELSE 0 END), 0) AS spent_1d,
          COALESCE(SUM(CASE WHEN created_at >= ? THEN amount ELSE 0 END), 0) AS spent_30d
        FROM metacoin_debits
        WHERE telegram_id = ? AND created_at <= ?
      `).get(dayStart, monthStart, id, timestamp);
      this.database.prepare(`
        UPDATE referral_users
        SET spent_metacoins_1d = ?, spent_metacoins_30d = ?
        WHERE telegram_id = ?
      `).run(Number(spent.spent_1d), Number(spent.spent_30d), id);
      this.database.prepare(`
        UPDATE metacoin_reservations
        SET status = 'committed', updated_at = ?
        WHERE request_key = ?
      `).run(timestamp, key);

      return this.debitResult('committed', id, key, debitAmount);
    });
  }

  releaseMetacoins({ telegramId, amount, requestKey, now }) {
    const id = asTelegramId(telegramId);
    const reservationAmount = asPositiveInteger(amount, 'amount');
    const key = asRequestKey(requestKey);
    const timestamp = asIsoDate(now, 'now');

    return this.transaction(() => {
      const reservation = this.database.prepare(`
        SELECT telegram_id, amount, status
        FROM metacoin_reservations
        WHERE request_key = ?
      `).get(key);
      if (!reservation) throw new Error('Metacoin reservation not found.');
      if (reservation.telegram_id !== id || Number(reservation.amount) !== reservationAmount) {
        throw new Error('Request key collision with a different reservation payload.');
      }
      if (reservation.status === 'reserved') {
        this.database.prepare(`
          UPDATE referral_users
          SET metacoin_balance = metacoin_balance + ?, updated_at = ?
          WHERE telegram_id = ?
        `).run(reservationAmount, timestamp, id);
        this.database.prepare(`
          UPDATE metacoin_reservations
          SET status = 'released', updated_at = ?
          WHERE request_key = ?
        `).run(timestamp, key);
      }
      return this.reservationResult(reservation.status === 'committed' ? 'committed' : 'released', id, key, reservationAmount);
    });
  }

  reservationResult(status, telegramId, requestKey, amount) {
    const account = this.readAccount(telegramId);
    if (!account) throw new Error('Metacoin reservation user is not registered.');
    return Object.freeze({
      status,
      requestKey,
      amount,
      balance: account.metacoinBalance,
      subscriptionMetacoinsRemaining: account.subscriptionMetacoinsRemaining,
      spentMetacoins1d: account.spentMetacoins1d,
      spentMetacoins30d: account.spentMetacoins30d
    });
  }

  debitResult(status, telegramId, requestKey, amount) {
    const account = this.readAccount(telegramId);
    if (!account) throw new Error('Debit user is not registered.');
    return Object.freeze({
      status,
      requestKey,
      amount,
      balance: account.metacoinBalance,
      subscriptionMetacoinsRemaining: account.subscriptionMetacoinsRemaining,
      spentMetacoins1d: account.spentMetacoins1d,
      spentMetacoins30d: account.spentMetacoins30d
    });
  }

  grantPromoMetacoins({ telegramId, promoCode, amount, now }) {
    const result = this.database.prepare(`
      INSERT OR IGNORE INTO promo_metacoin_grants (
        promo_code, telegram_id, amount, created_at
      ) VALUES (?, ?, ?, ?)
    `).run(
      String(promoCode),
      asTelegramId(telegramId),
      asNonNegativeInteger(amount, 'amount'),
      now
    );
    if (!result.changes) return false;
    this.addMetacoins(telegramId, amount);
    return true;
  }

  applyAdminMetacoinAdjustment({ actionId, telegramId, delta, reason = '', now }) {
    const key = asRequestKey(actionId);
    const id = asTelegramId(telegramId);
    const amount = asNonZeroInteger(delta, 'delta');
    const timestamp = asIsoDate(now, 'now');
    const safeReason = String(reason ?? '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 500);

    return this.transaction(() => {
      const existing = this.database.prepare(`
        SELECT action_id, telegram_id, kind, delta, reason, balance_after
        FROM crm_admin_applied_actions
        WHERE action_id = ?
      `).get(key);
      if (existing) {
        const matches = existing.telegram_id === id
          && existing.kind === 'metacoins_adjusted'
          && Number(existing.delta) === amount
          && existing.reason === safeReason;
        if (!matches) throw new Error('CRM action id collision with a different payload.');
        return Object.freeze({
          status: 'duplicate',
          actionId: key,
          balanceAfter: Number(existing.balance_after)
        });
      }

      const changed = this.database.prepare(`
        UPDATE referral_users
        SET metacoin_balance = metacoin_balance + ?, updated_at = ?
        WHERE telegram_id = ? AND metacoin_balance + ? >= 0
      `).run(amount, timestamp, id, amount);
      if (!changed.changes) {
        const user = this.database.prepare(
          'SELECT telegram_id FROM referral_users WHERE telegram_id = ?'
        ).get(id);
        if (!user) throw new Error('CRM adjustment user is not registered.');
        throw new Error('Insufficient metacoin balance for CRM adjustment.');
      }

      const balanceAfter = Number(this.database.prepare(
        'SELECT metacoin_balance FROM referral_users WHERE telegram_id = ?'
      ).get(id).metacoin_balance);
      this.database.prepare(`
        INSERT INTO crm_admin_applied_actions (
          action_id, telegram_id, kind, delta, reason, balance_after, created_at
        ) VALUES (?, ?, 'metacoins_adjusted', ?, ?, ?, ?)
      `).run(key, id, amount, safeReason, balanceAfter, timestamp);
      return Object.freeze({ status: 'applied', actionId: key, balanceAfter });
    });
  }

  applyAdminSubscription({
    actionId,
    telegramId,
    planId,
    durationMonths,
    metacoins,
    expiresAt,
    reason = '',
    now
  }) {
    const key = asRequestKey(actionId);
    const id = asTelegramId(telegramId);
    const plan = String(planId ?? '').trim();
    if (!/^[a-z][a-z0-9_]{1,31}$/u.test(plan)) throw new TypeError('Invalid CRM plan id.');
    if (![1, 3].includes(Number(durationMonths))) throw new TypeError('Invalid CRM subscription duration.');
    const allowance = Number(metacoins);
    if (!Number.isSafeInteger(allowance) || allowance < 0) throw new TypeError('Invalid CRM subscription metacoins.');
    const timestamp = asIsoDate(now, 'now');
    const expiry = asIsoDate(expiresAt, 'subscription expiry');
    if (new Date(expiry).valueOf() <= new Date(timestamp).valueOf()) {
      throw new TypeError('CRM subscription expiry must be in the future.');
    }
    const safeReason = String(reason ?? '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 500);

    return this.transaction(() => {
      const existing = this.database.prepare(`
        SELECT action_id, telegram_id, kind, plan_id, duration_months,
               metacoins, expires_at, reason, balance_after
        FROM crm_admin_applied_actions
        WHERE action_id = ?
      `).get(key);
      if (existing) {
        const matches = existing.telegram_id === id
          && existing.kind === 'subscription_changed'
          && existing.plan_id === plan
          && Number(existing.duration_months) === Number(durationMonths)
          && Number(existing.metacoins) === allowance
          && existing.expires_at === expiry
          && existing.reason === safeReason;
        if (!matches) throw new Error('CRM action id collision with a different payload.');
        return Object.freeze({
          status: 'duplicate',
          actionId: key,
          expiresAt: existing.expires_at,
          balanceAfter: Number(existing.balance_after)
        });
      }

      const changed = this.database.prepare(`
        UPDATE referral_users
        SET subscription_plan_id = ?,
            subscription_expires_at = ?,
            subscription_metacoins_total = ?,
            subscription_metacoins_remaining = ?,
            subscription_price_kopecks = 0,
            subscription_duration_months = ?,
            metacoin_balance = metacoin_balance + ?,
            updated_at = ?
        WHERE telegram_id = ?
      `).run(plan, expiry, allowance, allowance, Number(durationMonths), allowance, timestamp, id);
      if (!changed.changes) throw new Error('CRM subscription user is not registered.');

      const balanceAfter = Number(this.database.prepare(
        'SELECT metacoin_balance FROM referral_users WHERE telegram_id = ?'
      ).get(id).metacoin_balance);
      this.database.prepare(`
        INSERT INTO crm_admin_applied_actions (
          action_id, telegram_id, kind, plan_id, duration_months,
          metacoins, expires_at, reason, balance_after, created_at
        ) VALUES (?, ?, 'subscription_changed', ?, ?, ?, ?, ?, ?, ?)
      `).run(key, id, plan, Number(durationMonths), allowance, expiry, safeReason, balanceAfter, timestamp);
      return Object.freeze({
        status: 'applied',
        actionId: key,
        expiresAt: expiry,
        balanceAfter
      });
    });
  }

  availableBoost(telegramId) {
    return this.database.prepare(`
      SELECT id, percent FROM referral_boosts
      WHERE telegram_id = ? AND status = 'available'
      ORDER BY id ASC LIMIT 1
    `).get(asTelegramId(telegramId));
  }

  createBoost({ telegramId, sourceTelegramId, sourcePaymentId, percent, now }) {
    this.database.prepare(`
      INSERT INTO referral_boosts (
        telegram_id, source_telegram_id, source_payment_id, percent, status, created_at
      ) VALUES (?, ?, ?, ?, 'available', ?)
    `).run(
      asTelegramId(telegramId),
      asTelegramId(sourceTelegramId),
      sourcePaymentId,
      percent,
      now
    );
  }

  consumeBoost({ boostId, paymentId, now }) {
    this.database.prepare(`
      UPDATE referral_boosts
      SET status = 'consumed', consumed_payment_id = ?, consumed_at = ?
      WHERE id = ? AND status = 'available'
    `).run(paymentId, now, boostId);
  }

  paidReferralCount(partnerId) {
    return Number(this.database.prepare(`
      SELECT COUNT(DISTINCT u.telegram_id) AS count
      FROM referral_users u
      JOIN referral_payments p ON p.telegram_id = u.telegram_id
      WHERE u.referrer_id = ?
    `).get(asTelegramId(partnerId)).count);
  }

  createEarning({
    paymentId,
    partnerId,
    referralId,
    amountKopecks,
    percent,
    now,
    availableAt
  }) {
    this.database.prepare(`
      INSERT INTO referral_earnings (
        payment_id, partner_id, referral_id, amount_kopecks,
        percent, status, created_at, available_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(
      paymentId,
      asTelegramId(partnerId),
      asTelegramId(referralId),
      asNonNegativeInteger(amountKopecks, 'amountKopecks'),
      percent,
      now,
      availableAt
    );
  }

  releaseDueEarnings(now) {
    return this.database.prepare(`
      UPDATE referral_earnings
      SET status = 'available'
      WHERE status = 'pending' AND available_at <= ?
    `).run(now).changes;
  }

  readAccount(telegramId) {
    const id = asTelegramId(telegramId);
    const user = this.database.prepare(`
      SELECT
        metacoin_balance,
        subscription_plan_id,
        subscription_expires_at,
        subscription_metacoins_total,
        subscription_metacoins_remaining,
        subscription_price_kopecks,
        subscription_duration_months,
        spent_metacoins_1d,
        spent_metacoins_30d
      FROM referral_users
      WHERE telegram_id = ?
    `).get(id);
    if (!user) return null;

    const referrals = this.database.prepare(`
      SELECT
        COUNT(DISTINCT u.telegram_id) AS invited,
        COUNT(DISTINCT CASE WHEN p.payment_id IS NOT NULL THEN u.telegram_id END) AS paid_referrals,
        COALESCE(SUM(p.amount_kopecks), 0) AS turnover_kopecks
      FROM referral_users u
      LEFT JOIN referral_payments p ON p.telegram_id = u.telegram_id
      WHERE u.referrer_id = ?
    `).get(id);
    const earnings = this.database.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'available' THEN amount_kopecks ELSE 0 END), 0) AS available,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_kopecks ELSE 0 END), 0) AS pending,
        COALESCE(SUM(CASE WHEN status != 'reversed' THEN amount_kopecks ELSE 0 END), 0) AS lifetime
      FROM referral_earnings WHERE partner_id = ?
    `).get(id);
    const withdrawals = this.database.prepare(`
      SELECT COALESCE(SUM(amount_kopecks), 0) AS reserved
      FROM referral_withdrawals
      WHERE telegram_id = ? AND status IN ('pending', 'paid')
    `).get(id);
    const boosts = this.database.prepare(`
      SELECT COUNT(*) AS count FROM referral_boosts
      WHERE telegram_id = ? AND status = 'available'
    `).get(id);
    const users = this.database.prepare(`
      SELECT COUNT(*) AS count
      FROM referral_users
      WHERE started_at IS NOT NULL
    `).get();

    return Object.freeze({
      invited: Number(referrals.invited),
      paidReferrals: Number(referrals.paid_referrals),
      referralTurnoverKopecks: Number(referrals.turnover_kopecks),
      availableKopecks: Math.max(0, Number(earnings.available) - Number(withdrawals.reserved)),
      pendingKopecks: Number(earnings.pending),
      lifetimeKopecks: Number(earnings.lifetime),
      metacoinBalance: Number(user.metacoin_balance),
      subscriptionPlanId: user.subscription_plan_id,
      subscriptionExpiresAt: user.subscription_expires_at,
      subscriptionMetacoinsTotal: Number(user.subscription_metacoins_total),
      subscriptionMetacoinsRemaining: Number(user.subscription_metacoins_remaining),
      subscriptionPriceKopecks: Number(user.subscription_price_kopecks),
      subscriptionDurationMonths: Number(user.subscription_duration_months),
      spentMetacoins1d: Number(user.spent_metacoins_1d),
      spentMetacoins30d: Number(user.spent_metacoins_30d),
      availableBoosts: Number(boosts.count),
      totalUsers: Number(users.count)
    });
  }

  accountStats(telegramId) {
    return this.readAccount(telegramId);
  }

  listReferrals(telegramId, limit = 20) {
    return this.database.prepare(`
      SELECT
        u.telegram_id, u.username, u.first_name, u.created_at,
        MIN(p.confirmed_at) AS first_payment_at,
        COALESCE(SUM(p.amount_kopecks), 0) AS turnover_kopecks
      FROM referral_users u
      LEFT JOIN referral_payments p ON p.telegram_id = u.telegram_id
      WHERE u.referrer_id = ?
      GROUP BY u.telegram_id
      ORDER BY u.created_at DESC
      LIMIT ?
    `).all(asTelegramId(telegramId), limit).map((row) => Object.freeze({
      telegramId: row.telegram_id,
      username: row.username ?? '',
      firstName: row.first_name ?? '',
      createdAt: row.created_at,
      firstPaymentAt: row.first_payment_at,
      turnoverKopecks: Number(row.turnover_kopecks)
    }));
  }

  listEarnings(telegramId, limit = 20) {
    return this.database.prepare(`
      SELECT
        e.amount_kopecks, e.percent, e.status, e.created_at,
        u.username, u.first_name, p.amount_kopecks AS payment_amount_kopecks
      FROM referral_earnings e
      JOIN referral_users u ON u.telegram_id = e.referral_id
      JOIN referral_payments p ON p.payment_id = e.payment_id
      WHERE e.partner_id = ?
      ORDER BY e.id DESC
      LIMIT ?
    `).all(asTelegramId(telegramId), limit).map((row) => Object.freeze({
      amountKopecks: Number(row.amount_kopecks),
      percent: Number(row.percent),
      status: row.status,
      createdAt: row.created_at,
      username: row.username ?? '',
      firstName: row.first_name ?? '',
      paymentAmountKopecks: Number(row.payment_amount_kopecks)
    }));
  }

  createPayoutSetup({ setupToken, telegramId, amountKopecks, method = 'sbp', expiresAt, now }) {
    const token = asSetupToken(setupToken);
    const payoutMethod = asPayoutMethod(method);
    this.database.prepare(`
      INSERT INTO payout_setup_tokens (
        setup_token, telegram_id, amount_kopecks, payout_method, status,
        expires_at, created_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?)
    `).run(
      token,
      asTelegramId(telegramId),
      asPositiveInteger(amountKopecks, 'amountKopecks'),
      payoutMethod,
      asIsoDate(expiresAt, 'payout setup expiry'),
      asIsoDate(now, 'now')
    );
    return this.getPayoutSetup(token);
  }

  getPayoutSetup(setupToken) {
    const token = asSetupToken(setupToken);
    return this.database.prepare(`
      SELECT setup_token, telegram_id, amount_kopecks, payout_method,
             status, expires_at, created_at, used_at
      FROM payout_setup_tokens
      WHERE setup_token = ?
    `).get(token) ?? null;
  }

  consumePayoutSetup({ setupToken, now }) {
    const token = asSetupToken(setupToken);
    const timestamp = asIsoDate(now, 'now');
    const setup = this.getPayoutSetup(token);
    if (!setup) throw new Error('Payout setup not found.');
    if (setup.status !== 'pending') throw new Error('Payout setup has already been used.');
    if (new Date(setup.expires_at).valueOf() <= new Date(timestamp).valueOf()) {
      this.database.prepare(`
        UPDATE payout_setup_tokens SET status = 'expired' WHERE setup_token = ? AND status = 'pending'
      `).run(token);
      throw new Error('Payout setup has expired.');
    }
    this.database.prepare(`
      UPDATE payout_setup_tokens
      SET status = 'used', used_at = ?
      WHERE setup_token = ? AND status = 'pending'
    `).run(timestamp, token);
    const consumed = this.getPayoutSetup(token);
    if (consumed?.status !== 'used') throw new Error('Payout setup could not be consumed.');
    return consumed;
  }

  createWithdrawal({
    withdrawalId,
    telegramId,
    amountKopecks,
    method = 'sbp',
    destination = 'скрыто',
    destinationHint = destination,
    destinationEncrypted = null,
    payoutIdempotencyKey = null,
    now
  }) {
    const id = asWithdrawalId(withdrawalId);
    const payoutMethod = asPayoutMethod(method);
    const hint = String(destinationHint ?? destination ?? 'скрыто').replace(/[\u0000-\u001f\u007f]/gu, '').slice(0, 64) || 'скрыто';
    this.database.prepare(`
      INSERT INTO referral_withdrawals (
        withdrawal_id, telegram_id, amount_kopecks, payout_method, destination,
        destination_encrypted, destination_hint, payout_idempotency_key,
        payout_status, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, ?)
    `).run(
      id,
      asTelegramId(telegramId),
      asPositiveInteger(amountKopecks, 'amountKopecks'),
      payoutMethod,
      hint,
      destinationEncrypted,
      hint,
      payoutIdempotencyKey,
      asIsoDate(now, 'now'),
      asIsoDate(now, 'now')
    );
    return this.getWithdrawal(id);
  }

  getWithdrawal(withdrawalId) {
    const id = asWithdrawalId(withdrawalId);
    return withdrawalFromRow(this.database.prepare(`
      SELECT w.withdrawal_id, w.telegram_id, w.amount_kopecks, w.payout_method,
             w.destination, w.destination_hint, w.external_payout_id,
             w.payout_status, w.payout_error_code, w.payout_attempts,
             w.last_payout_attempt_at,
             w.payout_fee_kopecks, w.status, w.created_at, w.updated_at,
             u.username, u.first_name
      FROM referral_withdrawals w
      JOIN referral_users u ON u.telegram_id = w.telegram_id
      WHERE w.withdrawal_id = ?
    `).get(id));
  }

  listPendingWithdrawals(limit = 100) {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1_000) {
      throw new TypeError('Withdrawal limit must be between 1 and 1000.');
    }
    return this.database.prepare(`
      SELECT w.withdrawal_id, w.telegram_id, w.amount_kopecks, w.payout_method,
             w.destination, w.destination_hint, w.external_payout_id,
             w.payout_status, w.payout_error_code, w.payout_attempts,
             w.last_payout_attempt_at,
             w.payout_fee_kopecks, w.status, w.created_at, w.updated_at,
             u.username, u.first_name
      FROM referral_withdrawals w
      JOIN referral_users u ON u.telegram_id = w.telegram_id
      WHERE w.status = 'pending'
        AND COALESCE(w.payout_status, 'pending') <> 'manual_review'
      ORDER BY w.created_at ASC
      LIMIT ?
    `).all(limit).map(withdrawalFromRow);
  }

  getWithdrawalPayoutData(withdrawalId) {
    const id = asWithdrawalId(withdrawalId);
    return this.database.prepare(`
      SELECT withdrawal_id, telegram_id, amount_kopecks, payout_method,
             destination_encrypted, external_payout_id
      FROM referral_withdrawals
      WHERE withdrawal_id = ?
    `).get(id) ?? null;
  }

  markWithdrawalPayoutAttempt({ withdrawalId, attemptedAt }) {
    const id = asWithdrawalId(withdrawalId);
    this.database.prepare(`
      UPDATE referral_withdrawals
      SET payout_attempts = payout_attempts + 1,
          last_payout_attempt_at = ?,
          payout_status = 'pending',
          updated_at = ?
      WHERE withdrawal_id = ? AND status = 'pending'
    `).run(asIsoDate(attemptedAt, 'attemptedAt'), asIsoDate(attemptedAt, 'attemptedAt'), id);
    return this.getWithdrawal(id);
  }

  claimWithdrawalForPayout({ withdrawalId, attemptedAt }) {
    const id = asWithdrawalId(withdrawalId);
    const timestamp = asIsoDate(attemptedAt, 'attemptedAt');
    const result = this.database.prepare(`
      UPDATE referral_withdrawals
      SET payout_attempts = payout_attempts + 1,
          last_payout_attempt_at = ?,
          payout_status = 'submitting',
          updated_at = ?
      WHERE withdrawal_id = ?
        AND status = 'pending'
        AND external_payout_id IS NULL
        AND COALESCE(payout_status, 'pending') IN ('pending', 'failed')
    `).run(timestamp, timestamp, id);
    return result.changes === 1 ? this.getWithdrawal(id) : null;
  }

  markWithdrawalForManualReview({ withdrawalId, errorCode = 'manual_review', attemptedAt = new Date() }) {
    const id = asWithdrawalId(withdrawalId);
    const safeErrorCode = String(errorCode ?? 'manual_review').replace(/[^A-Za-z0-9_.-]/gu, '').slice(0, 64);
    const timestamp = asIsoDate(attemptedAt, 'attemptedAt');
    this.database.prepare(`
      UPDATE referral_withdrawals
      SET payout_status = 'manual_review',
          payout_error_code = ?,
          updated_at = ?
      WHERE withdrawal_id = ? AND status = 'pending'
    `).run(safeErrorCode || 'manual_review', timestamp, id);
    return this.getWithdrawal(id);
  }

  markWithdrawalPayoutSubmitted({ withdrawalId, externalPayoutId, payoutStatus: status = 'pending', submittedAt }) {
    const id = asWithdrawalId(withdrawalId);
    const providerId = String(externalPayoutId ?? '');
    if (!/^[A-Za-z0-9_-]{1,128}$/u.test(providerId)) throw new TypeError('Invalid external payout id.');
    this.database.prepare(`
      UPDATE referral_withdrawals
      SET external_payout_id = ?,
          payout_status = ?,
          payout_idempotency_key = COALESCE(payout_idempotency_key, ?),
          updated_at = ?
      WHERE withdrawal_id = ? AND status = 'pending'
    `).run(
      providerId,
      ['pending', 'succeeded', 'canceled', 'failed'].includes(status) ? status : 'pending',
      `payout:${id}`,
      asIsoDate(submittedAt, 'submittedAt'),
      id
    );
    return this.getWithdrawal(id);
  }

  markWithdrawalPayoutResult({
    withdrawalId,
    externalPayoutId = null,
    status = 'pending',
    payoutStatus: providerStatus = status,
    errorCode = null,
    payoutFeeKopecks = null,
    processedAt = new Date()
  }) {
    const id = asWithdrawalId(withdrawalId);
    const normalizedStatus = ['pending', 'succeeded', 'canceled', 'failed'].includes(providerStatus)
      ? providerStatus
      : 'failed';
    const localStatus = normalizedStatus === 'succeeded'
      ? 'paid'
      : normalizedStatus === 'canceled'
        ? 'rejected'
        : 'pending';
    const safeErrorCode = errorCode
      ? String(errorCode).replace(/[^A-Za-z0-9_.-]/gu, '').slice(0, 64)
      : null;
    const fee = payoutFeeKopecks === null || payoutFeeKopecks === undefined
      ? null
      : asNonNegativeInteger(payoutFeeKopecks, 'payoutFeeKopecks');
    this.database.prepare(`
      UPDATE referral_withdrawals
      SET external_payout_id = COALESCE(?, external_payout_id),
          payout_status = ?,
          payout_error_code = ?,
          payout_fee_kopecks = COALESCE(?, payout_fee_kopecks),
          status = ?,
          updated_at = ?
      WHERE withdrawal_id = ?
    `).run(
      externalPayoutId,
      normalizedStatus,
      safeErrorCode,
      fee,
      localStatus,
      asIsoDate(processedAt, 'processedAt'),
      id
    );
    return this.getWithdrawal(id);
  }

  transitionWithdrawal({ withdrawalId, status, now }) {
    const id = asWithdrawalId(withdrawalId);
    if (!['paid', 'rejected'].includes(status)) throw new TypeError('Invalid withdrawal status.');
    const current = this.getWithdrawal(id);
    if (!current) throw new Error('Withdrawal not found.');
    if (current.status === status) return current;
    if (current.status !== 'pending') throw new Error('Withdrawal has already been processed.');
    if (current.payoutStatus === 'submitting'
      || (current.externalPayoutId && current.payoutStatus === 'pending')) {
      throw new Error('Withdrawal payout is being processed by the provider.');
    }
    this.database.prepare(`
      UPDATE referral_withdrawals
      SET status = ?, updated_at = ?
      WHERE withdrawal_id = ?
        AND status = 'pending'
        AND COALESCE(payout_status, 'pending') <> 'submitting'
        AND NOT (external_payout_id IS NOT NULL AND payout_status = 'pending')
    `).run(status, now, id);
    return this.getWithdrawal(id);
  }
}
