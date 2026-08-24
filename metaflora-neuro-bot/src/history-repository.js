import { normalizeHistoryEvent, sanitizeHistoryMetadata } from './history-contract.js';

function schemaIdentifier(value) {
  const schema = String(value ?? 'neuro');
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(schema)) {
    throw new TypeError('Invalid PostgreSQL schema identifier.');
  }
  return `"${schema}"`;
}

function telegramId(value) {
  const id = String(value ?? '');
  if (!/^[1-9]\d{0,19}$/.test(id)) throw new TypeError('Invalid Telegram user id.');
  return id;
}

function optionalTelegramEntityId(value, { positive = false } = {}) {
  if (value === null || value === undefined || value === '') return null;
  const id = String(value);
  const pattern = positive ? /^[1-9]\d{0,19}$/ : /^-?[1-9]\d{0,19}$/;
  if (!pattern.test(id)) throw new TypeError('Invalid Telegram entity id.');
  return id;
}

function optionalNonNegativeIntegerId(value) {
  if (value === null || value === undefined || value === '') return null;
  const id = String(value);
  if (!/^\d{1,24}$/.test(id)) throw new TypeError('Invalid non-negative identifier.');
  return id;
}

function boundedStatus(value, allowed) {
  const status = optionalText(value, 32);
  if (!allowed.includes(status)) throw new TypeError('Invalid audit status.');
  return status;
}

function optionalText(value, maximum = 255) {
  if (value === null || value === undefined || value === '') return null;
  return String(value).replace(/\u0000/g, '').trim().slice(0, maximum) || null;
}

function generationSubjectType(value) {
  const subjectType = optionalText(value, 30);
  if (subjectType && !['model', 'tool', 'agent', 'entertainment', 'music'].includes(subjectType)) {
    throw new TypeError('Invalid generation subject type.');
  }
  return subjectType;
}

function generationScope(value) {
  const scope = optionalText(value, 20);
  if (scope && !['media', 'agent', 'all'].includes(scope)) {
    throw new TypeError('Invalid generation history scope.');
  }
  return scope;
}

function receiptEmail(value) {
  const email = String(value ?? '').replace(/\u0000/g, '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) || email.length > 254) {
    throw new TypeError('Invalid receipt email.');
  }
  return email;
}

function receiptPhone(value) {
  const phone = String(value ?? '').replace(/\u0000/g, '').trim();
  if (!/^\+[1-9]\d{9,14}$/u.test(phone)) throw new TypeError('Invalid receipt phone.');
  return phone;
}

function paymentProvider(value = 'yookassa') {
  const provider = String(value ?? '').trim().toLowerCase();
  if (!['yookassa', 'tbank'].includes(provider)) throw new TypeError('Invalid payment provider.');
  return provider;
}

function receiptRegistration(value) {
  const status = String(value ?? 'unknown').trim().toLowerCase();
  return ['pending', 'succeeded', 'canceled', 'failed', 'unknown'].includes(status)
    ? status
    : 'unknown';
}

function receiptEmailFromProvider(value) {
  const email = value?.receipt?.customer?.email;
  if (!email) return null;
  try {
    return receiptEmail(email);
  } catch {
    return null;
  }
}

function paymentMethodFromProvider(value, provider = '') {
  const normalizedProvider = String(provider ?? '').trim().toLowerCase();
  if (normalizedProvider === 'telegram_stars' || String(value?.currency ?? '').toUpperCase() === 'XTR') {
    return 'telegram_stars';
  }
  if (normalizedProvider === 'tbank') return 'sbp';
  const type = String(value?.payment_method?.type ?? '').trim().toLowerCase();
  if (type === 'sbp') return 'sbp';
  if (type === 'bank_card' || type === 'card') return 'card';
  return 'unknown';
}

function nonNegativeInteger(value, label) {
  const number = Number(value ?? 0);
  if (!Number.isSafeInteger(number) || number < 0) throw new TypeError(`Invalid ${label}.`);
  return number;
}

function nonZeroInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number === 0) throw new TypeError(`Invalid ${label}.`);
  return number;
}

function positivePageSize(value, { defaultValue, maximum }) {
  const number = Number(value ?? defaultValue);
  if (!Number.isSafeInteger(number) || number < 1 || number > maximum) {
    throw new TypeError('Invalid page size.');
  }
  return number;
}

function uuid(value, label = 'UUID') {
  const normalized = String(value ?? '').toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)) {
    throw new TypeError(`Invalid ${label}.`);
  }
  return normalized;
}

function isoTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError('Invalid history timestamp.');
  return date.toISOString();
}

function encodeCursor(row) {
  return Buffer.from(JSON.stringify({
    at: isoTimestamp(row.latest_message_at ?? row.created_at),
    id: uuid(row.id, 'cursor id')
  })).toString('base64url');
}

function decodeCursor(value) {
  if (!value) return Object.freeze({ at: null, id: null });
  try {
    const decoded = JSON.parse(Buffer.from(String(value), 'base64url').toString('utf8'));
    return Object.freeze({
      at: isoTimestamp(decoded.at),
      id: uuid(decoded.id, 'cursor id')
    });
  } catch {
    throw new TypeError('Invalid history cursor.');
  }
}

function conversationDto(row) {
  return Object.freeze({
    id: String(row.id),
    kind: String(row.kind),
    subjectId: row.subject_id ? String(row.subject_id) : null,
    title: String(row.title || 'новый диалог'),
    status: String(row.status),
    latestMessageAt: isoTimestamp(row.latest_message_at),
    createdAt: isoTimestamp(row.created_at),
    ...(row.message_count === undefined
      ? {}
      : { messageCount: Number(row.message_count) }),
    ...(row.last_message_preview === undefined
      ? {}
      : { lastMessagePreview: String(row.last_message_preview ?? '') })
  });
}

function generationDto(row) {
  const metadata = objectJson(row.metadata);
  const parameters = objectJson(row.parameters);
  return Object.freeze({
    id: String(row.id),
    kind: String(row.kind),
    subjectType: row.subject_type ? String(row.subject_type) : null,
    subjectId: String(row.subject_id),
    subjectLabel: String(row.subject_label ?? row.subject_id),
    status: String(row.status),
    metacoinsQuoted: Number(row.metacoins_quoted ?? 0),
    metacoinsCharged: Number(row.metacoins_charged ?? 0),
    createdAt: isoTimestamp(row.created_at),
    finishedAt: row.finished_at ? isoTimestamp(row.finished_at) : null,
    promptPreview: String(row.prompt_preview ?? row.prompt ?? '').slice(0, 160),
    outputPreview: String(row.output_preview ?? row.output_text ?? '').slice(0, 160),
    prompt: String(row.prompt ?? ''),
    outputText: String(row.output_text ?? ''),
    outputType: String(row.output_type ?? metadata.outputType ?? metadata.output_type ?? row.kind),
    ...(row.metadata === undefined ? {} : { metadata }),
    ...(row.parameters === undefined ? {} : { parameters })
  });
}

function objectJson(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return Object.freeze({ ...value });
  if (typeof value !== 'string' || !value.trim()) return Object.freeze({});
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? Object.freeze({ ...parsed })
      : Object.freeze({});
  } catch {
    return Object.freeze({});
  }
}

function freeQuotaDto(row) {
  if (!row) throw new Error('Free quota claim returned no result.');
  return Object.freeze({
    allowed: Boolean(row.allowed),
    used: Number(row.used ?? 0),
    limit: Number(row.request_limit ?? 50),
    remaining: Number(row.remaining ?? 0),
    duplicate: Boolean(row.duplicate)
  });
}

function legalConsentDto(row) {
  return Object.freeze({
    termsAccepted: Boolean(row?.terms_accepted),
    termsVersion: optionalText(row?.terms_version, 64),
    personalDataAccepted: Boolean(row?.personal_data_accepted),
    personalDataVersion: optionalText(row?.personal_data_version, 64),
    completed: Boolean(
      row?.completed
      ?? (row?.terms_accepted && row?.personal_data_accepted)
    ),
    duplicate: Boolean(row?.duplicate)
  });
}

export class NullHistoryRepository {
  async upsertUser() { return null; }
  async getReceiptEmail() { return null; }
  async saveReceiptEmail() { return null; }
  async claimCrmUserNotifications() { return []; }
  async markCrmUserNotificationSent() { return false; }
  async markCrmUserNotificationFailed() { return false; }
  async updateUserAvatarReference() { return false; }
  async recordEvent() { return null; }
  async recordTelegramUpdate() { return null; }
  async startTelegramApiCall() { return null; }
  async completeTelegramApiCall() { return null; }
  async startProviderApiCall() { return null; }
  async completeProviderApiCall() { return null; }
  async ensureConversation() { return null; }
  async appendMessage() { return null; }
  async startGeneration() { return null; }
  async completeGeneration() { return null; }
  async failGeneration() { return null; }
  async recordMetacoinTransaction() { return null; }
  async recordPaymentFulfilled() { return null; }
  async recordCryptoUsdcCheckout() { return null; }
  async recordCryptoUsdcCallback() {
    return Object.freeze({ status: 'ignored', duplicate: false, financeRequestCreated: false });
  }
  async completeCryptoUsdcFulfillment() {
    return Object.freeze({ status: 'ignored', duplicate: false });
  }
  async recordStarsPayment() { return null; }
  async recordStarsSubscriptionActivated() { return null; }
  async listPendingStarsPayments() { return []; }
  async recordFinanceAllocations() { return null; }
  async recordWalletEntries() { return null; }
  async recordFinancePayout() { return null; }
  async listGenerations() { return { items: [], nextCursor: null }; }
  async getGeneration() { return null; }
  async listConversations() { return { items: [], nextCursor: null }; }
  async getConversationThread() { return null; }
  async archiveConversation() { return null; }
  async claimFreeWeeklyRequest() {
    return Object.freeze({ allowed: true, used: 0, limit: 50, remaining: 50, duplicate: false });
  }
  async releaseFreeWeeklyRequest() { return false; }
  async getLegalConsentStatus() {
    return legalConsentDto(null);
  }
  async recordLegalConsent() {
    return legalConsentDto(null);
  }
  async schedulePaymentAbandonmentReminders() { return null; }
  async scheduleNewcomerReminder() { return null; }
  async claimDueLifecycleNotifications() { return []; }
  async markLifecycleNotificationSent() { return false; }
  async cancelLifecycleNotification() { return false; }
  async getNewcomerReminderEligibility() {
    return Object.freeze({ eligible: false, reason: 'storage_disabled' });
  }
  async activateConversation() { return null; }
  async close() {}
}

export class PostgresHistoryRepository {
  constructor({ pool, schema = 'neuro', now = () => new Date() }) {
    if (!pool?.query && !pool?.connect) throw new TypeError('PostgreSQL pool is required.');
    this.pool = pool;
    this.schema = schemaIdentifier(schema);
    this.now = now;
  }

  async upsertUser({
    telegramUserId,
    username = '',
    firstName = '',
    lastName = '',
    languageCode = '',
    isPremium = false,
    isBot = false,
    metadata = {}
  }) {
    const result = await this.pool.query(`
      INSERT INTO ${this.schema}.users (
        telegram_user_id, username, first_name, last_name, language_code,
        is_premium, is_bot, metadata, first_seen_at, last_seen_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, now(), now())
      ON CONFLICT (telegram_user_id) DO UPDATE SET
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        language_code = EXCLUDED.language_code,
        is_premium = EXCLUDED.is_premium,
        is_bot = EXCLUDED.is_bot,
        metadata = ${this.schema}.users.metadata || EXCLUDED.metadata,
        last_seen_at = now()
      RETURNING id
    `, [
      telegramId(telegramUserId),
      optionalText(username, 32) ?? '',
      optionalText(firstName, 100) ?? '',
      optionalText(lastName, 100) ?? '',
      optionalText(languageCode, 16) ?? '',
      Boolean(isPremium),
      Boolean(isBot),
      JSON.stringify(sanitizeHistoryMetadata(metadata))
    ]);
    return result.rows[0]?.id ?? null;
  }

  async getReceiptEmail({ telegramUserId }) {
    const result = await this.pool.query(`
      SELECT receipt_email
      FROM ${this.schema}.users
      WHERE telegram_user_id = $1::bigint
    `, [telegramId(telegramUserId)]);
    const value = result.rows[0]?.receipt_email;
    if (!value) return null;
    try {
      return receiptEmail(value);
    } catch {
      return null;
    }
  }

  async saveReceiptEmail({ telegramUserId, email }) {
    const result = await this.pool.query(`
      UPDATE ${this.schema}.users
      SET receipt_email = $2,
          updated_at = now()
      WHERE telegram_user_id = $1::bigint
      RETURNING receipt_email
    `, [telegramId(telegramUserId), receiptEmail(email)]);
    return result.rows[0]?.receipt_email ?? null;
  }

  async claimCrmUserNotifications({ limit = 20 } = {}) {
    const result = await this.pool.query(
      `SELECT * FROM ${this.schema}.claim_crm_user_notifications($1::integer)`,
      [positivePageSize(limit, { defaultValue: 20, maximum: 50 })]
    );
    return Object.freeze(result.rows.map((row) => Object.freeze({
      id: uuid(row.id, 'CRM notification id'),
      telegramUserId: telegramId(row.telegram_user_id),
      kind: optionalText(row.kind, 64),
      payload: sanitizeHistoryMetadata(row.payload),
      attemptCount: nonNegativeInteger(row.attempt_count, 'CRM notification attempt count')
    })));
  }

  async markCrmUserNotificationSent(notificationId) {
    const result = await this.pool.query(
      `SELECT ${this.schema}.mark_crm_user_notification_sent($1::uuid) AS marked`,
      [uuid(notificationId, 'CRM notification id')]
    );
    return Boolean(result.rows[0]?.marked);
  }

  async markCrmUserNotificationFailed(notificationId, error) {
    const result = await this.pool.query(
      `SELECT ${this.schema}.mark_crm_user_notification_failed($1::uuid, $2::text) AS marked`,
      [uuid(notificationId, 'CRM notification id'), optionalText(error, 1_000)]
    );
    return Boolean(result.rows[0]?.marked);
  }

  async updateUserAvatarReference({
    telegramUserId,
    fileId = null,
    fileUniqueId = null,
    storagePath = null
  }) {
    const result = await this.pool.query(`
      UPDATE ${this.schema}.users
      SET
        avatar_file_id = $2,
        avatar_file_unique_id = $3,
        avatar_storage_path = $4,
        avatar_updated_at = now(),
        updated_at = now()
      WHERE telegram_user_id = $1::bigint
      RETURNING id
    `, [
      telegramId(telegramUserId),
      optionalText(fileId, 512),
      optionalText(fileUniqueId, 512),
      optionalText(storagePath, 1024)
    ]);
    return Boolean(result.rows[0]?.id);
  }

  async recordEvent(event) {
    const value = normalizeHistoryEvent(event, this.now());
    const result = await this.pool.query(`
      INSERT INTO ${this.schema}.product_events (
        event_name, category, telegram_user_id, telegram_chat_id,
        telegram_update_id, telegram_message_id, request_key,
        conversation_key, subject_type, subject_id, metadata, occurred_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12
      )
      RETURNING id
    `, [
      value.eventName,
      value.category,
      value.telegramUserId,
      value.telegramChatId,
      value.telegramUpdateId,
      value.telegramMessageId,
      value.requestKey,
      value.conversationKey,
      value.subjectType,
      value.subjectId,
      JSON.stringify(value.metadata),
      value.occurredAt
    ]);
    return result.rows[0]?.id ?? null;
  }

  async recordTelegramUpdate({
    telegramUpdateId,
    telegramUserId = null,
    telegramChatId = null,
    telegramMessageId = null,
    updateType,
    payload = {}
  }) {
    const result = await this.pool.query(`
      INSERT INTO ${this.schema}.telegram_updates (
        telegram_update_id, telegram_user_id, telegram_chat_id,
        telegram_message_id, update_type, payload, received_at
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, now())
      ON CONFLICT (telegram_update_id) DO UPDATE SET
        payload = EXCLUDED.payload,
        update_type = EXCLUDED.update_type
      RETURNING id
    `, [
      optionalNonNegativeIntegerId(telegramUpdateId),
      optionalTelegramEntityId(telegramUserId, { positive: true }),
      optionalTelegramEntityId(telegramChatId),
      optionalTelegramEntityId(telegramMessageId, { positive: true }),
      optionalText(updateType, 80),
      JSON.stringify(sanitizeHistoryMetadata(payload))
    ]);
    return result.rows[0]?.id ?? null;
  }

  async startTelegramApiCall({
    requestKey,
    method,
    telegramUserId = null,
    telegramChatId = null,
    telegramMessageId = null,
    requestPayload = {}
  }) {
    const result = await this.pool.query(`
      INSERT INTO ${this.schema}.telegram_api_calls (
        request_key, method, telegram_user_id, telegram_chat_id,
        telegram_message_id, request_payload, status, started_at
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'running', now())
      ON CONFLICT (request_key) DO UPDATE SET request_key = EXCLUDED.request_key
      RETURNING id
    `, [
      optionalText(requestKey, 200),
      optionalText(method, 100),
      optionalTelegramEntityId(telegramUserId, { positive: true }),
      optionalTelegramEntityId(telegramChatId),
      optionalTelegramEntityId(telegramMessageId, { positive: true }),
      JSON.stringify(sanitizeHistoryMetadata(requestPayload))
    ]);
    return result.rows[0]?.id ?? null;
  }

  async completeTelegramApiCall({
    callId,
    status,
    httpStatus = null,
    responsePayload = {},
    telegramErrorCode = null,
    errorMessage = null,
    durationMs = null
  }) {
    const result = await this.pool.query(`
      UPDATE ${this.schema}.telegram_api_calls
      SET status = $2,
          http_status = $3,
          response_payload = $4::jsonb,
          telegram_error_code = $5,
          error_message = $6,
          duration_ms = $7,
          finished_at = now()
      WHERE id = $1::uuid
      RETURNING id
    `, [
      callId,
      boundedStatus(status, ['succeeded', 'failed', 'cancelled']),
      httpStatus === null ? null : nonNegativeInteger(httpStatus, 'HTTP status'),
      JSON.stringify(sanitizeHistoryMetadata(responsePayload)),
      telegramErrorCode === null ? null : Number(telegramErrorCode),
      optionalText(errorMessage, 1_000),
      durationMs === null ? null : nonNegativeInteger(durationMs, 'duration')
    ]);
    return result.rows[0]?.id ?? null;
  }

  async startProviderApiCall({
    requestKey,
    generationId = null,
    telegramUserId = null,
    provider,
    operation,
    endpointHost,
    endpointPath,
    requestPayload = {}
  }) {
    const result = await this.pool.query(`
      INSERT INTO ${this.schema}.provider_api_calls (
        request_key, generation_id, telegram_user_id, provider, operation,
        endpoint_host, endpoint_path, request_payload, status, started_at
      ) VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8::jsonb, 'running', now())
      ON CONFLICT (request_key) DO UPDATE SET request_key = EXCLUDED.request_key
      RETURNING id
    `, [
      optionalText(requestKey, 200),
      generationId,
      optionalTelegramEntityId(telegramUserId, { positive: true }),
      optionalText(provider, 80),
      optionalText(operation, 120),
      optionalText(endpointHost, 255),
      optionalText(endpointPath, 1_000),
      JSON.stringify(sanitizeHistoryMetadata(requestPayload))
    ]);
    return result.rows[0]?.id ?? null;
  }

  async completeProviderApiCall({
    callId,
    status,
    httpStatus = null,
    providerRequestId = null,
    responsePayload = {},
    errorCode = null,
    errorMessage = null,
    inputTokens = null,
    outputTokens = null,
    providerCostUsd = null,
    durationMs = null
  }) {
    const result = await this.pool.query(`
      UPDATE ${this.schema}.provider_api_calls
      SET status = $2,
          http_status = $3,
          provider_request_id = $4,
          response_payload = $5::jsonb,
          error_code = $6,
          error_message = $7,
          input_tokens = $8,
          output_tokens = $9,
          provider_cost_usd = $10,
          duration_ms = $11,
          finished_at = now()
      WHERE id = $1::uuid
      RETURNING id
    `, [
      callId,
      boundedStatus(status, ['succeeded', 'failed', 'cancelled', 'timeout']),
      httpStatus === null ? null : nonNegativeInteger(httpStatus, 'HTTP status'),
      optionalText(providerRequestId, 256),
      JSON.stringify(sanitizeHistoryMetadata(responsePayload)),
      optionalText(errorCode, 80),
      optionalText(errorMessage, 1_000),
      inputTokens === null ? null : nonNegativeInteger(inputTokens, 'input tokens'),
      outputTokens === null ? null : nonNegativeInteger(outputTokens, 'output tokens'),
      providerCostUsd === null ? null : Number(providerCostUsd),
      durationMs === null ? null : nonNegativeInteger(durationMs, 'duration')
    ]);
    return result.rows[0]?.id ?? null;
  }

  async ensureConversation({
    telegramUserId,
    conversationKey,
    kind,
    subjectId = null,
    title = null,
    retentionDays = 30
  }) {
    const days = nonNegativeInteger(retentionDays, 'retention days');
    const result = await this.pool.query(`
      INSERT INTO ${this.schema}.conversations (
        user_id, conversation_key, kind, subject_id, title,
        status, retention_days, expires_at, latest_message_at
      )
      SELECT id, $2, $3, $4, $5, 'active', $6,
             CASE WHEN $6 = 0 THEN NULL ELSE now() + make_interval(days => $6) END,
             now()
      FROM ${this.schema}.users
      WHERE telegram_user_id = $1
      ON CONFLICT (conversation_key) DO UPDATE SET
        status = 'active',
        latest_message_at = now(),
        expires_at = CASE
          WHEN EXCLUDED.retention_days = 0 THEN NULL
          ELSE now() + make_interval(days => EXCLUDED.retention_days)
        END
      RETURNING id
    `, [
      telegramId(telegramUserId),
      optionalText(conversationKey, 200),
      optionalText(kind, 20),
      optionalText(subjectId, 100),
      optionalText(title, 200),
      days
    ]);
    return result.rows[0]?.id ?? null;
  }

  async listConversations({
    telegramUserId,
    limit = 20,
    offset = 0,
    cursor = null,
    status = 'active',
    kind = null
  }) {
    const pageSize = positivePageSize(limit, { defaultValue: 20, maximum: 50 });
    const pageOffset = nonNegativeInteger(offset, 'history offset');
    const normalizedStatus = optionalText(status, 20);
    if (!['active', 'archived', 'all'].includes(normalizedStatus)) {
      throw new TypeError('Invalid conversation status filter.');
    }
    const normalizedKind = optionalText(kind, 20);
    if (normalizedKind && !['model', 'agent', 'welcome', 'tool', 'voice'].includes(normalizedKind)) {
      throw new TypeError('Invalid conversation kind filter.');
    }
    const decoded = decodeCursor(cursor);
    const result = await this.pool.query(`
      SELECT
        c.id, c.kind, c.subject_id, c.title, c.status,
        c.latest_message_at, c.created_at,
        count(m.id)::text AS message_count,
        left(coalesce((
          SELECT recent.content
          FROM ${this.schema}.messages recent
          WHERE recent.conversation_id = c.id
            AND recent.deleted_at IS NULL
            AND recent.role IN ('user', 'assistant')
          ORDER BY recent.created_at DESC, recent.id DESC
          LIMIT 1
        ), ''), 160) AS last_message_preview
      FROM ${this.schema}.conversations c
      JOIN ${this.schema}.users u ON u.id = c.user_id
      LEFT JOIN ${this.schema}.messages m
        ON m.conversation_id = c.id
       AND m.deleted_at IS NULL
      WHERE u.telegram_user_id = $1
        AND c.deleted_at IS NULL
        AND c.kind = 'model'
        AND ($2 = 'all' OR c.status = $2)
        AND ($3::text IS NULL OR c.kind = $3)
        AND EXISTS (
          SELECT 1
          FROM ${this.schema}.generations g
          WHERE g.conversation_id = c.id
            AND g.user_id = c.user_id
            AND g.kind = 'text'
        )
        AND (
          $4::timestamptz IS NULL
          OR (c.latest_message_at, c.id) < ($4::timestamptz, $5::uuid)
        )
      GROUP BY c.id
      ORDER BY c.latest_message_at DESC, c.id DESC
      LIMIT $6
      OFFSET $7
    `, [
      telegramId(telegramUserId),
      normalizedStatus,
      normalizedKind,
      decoded.at,
      decoded.id,
      pageSize + 1,
      pageOffset
    ]);
    const hasMore = result.rows.length > pageSize;
    const rows = result.rows.slice(0, pageSize);
    return Object.freeze({
      items: Object.freeze(rows.map(conversationDto)),
      nextCursor: hasMore && rows.length ? encodeCursor(rows.at(-1)) : null,
      hasMore
    });
  }

  async getConversationThread({
    telegramUserId,
    conversationId,
    limit = 50,
    before = null
  }) {
    const ownerId = telegramId(telegramUserId);
    const threadId = uuid(conversationId, 'conversation id');
    const pageSize = positivePageSize(limit, { defaultValue: 50, maximum: 100 });
    const conversationResult = await this.pool.query(`
      SELECT
        c.id, c.kind, c.subject_id, c.title, c.status,
        c.latest_message_at, c.created_at
      FROM ${this.schema}.conversations c
      JOIN ${this.schema}.users u ON u.id = c.user_id
      WHERE u.telegram_user_id = $1
        AND c.id = $2::uuid
        AND c.deleted_at IS NULL
        AND c.kind = 'model'
        AND EXISTS (
          SELECT 1
          FROM ${this.schema}.generations g
          WHERE g.conversation_id = c.id
            AND g.user_id = c.user_id
            AND g.kind = 'text'
        )
      LIMIT 1
    `, [ownerId, threadId]);
    const conversation = conversationResult.rows[0];
    if (!conversation) return null;

    const decoded = decodeCursor(before);
    const messageResult = await this.pool.query(`
      SELECT
        m.id, m.role, m.content, m.status,
        m.metacoins_charged, m.created_at
      FROM ${this.schema}.messages m
      JOIN ${this.schema}.users u ON u.id = m.user_id
      WHERE u.telegram_user_id = $1
        AND m.conversation_id = $2::uuid
        AND m.deleted_at IS NULL
        AND (
          $3::timestamptz IS NULL
          OR (m.created_at, m.id) < ($3::timestamptz, $4::uuid)
        )
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT $5
    `, [ownerId, threadId, decoded.at, decoded.id, pageSize + 1]);
    const hasMore = messageResult.rows.length > pageSize;
    const descendingRows = messageResult.rows.slice(0, pageSize);
    const nextCursor = hasMore && descendingRows.length
      ? Buffer.from(JSON.stringify({
          at: isoTimestamp(descendingRows.at(-1).created_at),
          id: uuid(descendingRows.at(-1).id, 'cursor id')
        })).toString('base64url')
      : null;
    const messages = descendingRows.reverse().map((row) => Object.freeze({
      id: String(row.id),
      role: String(row.role),
      content: String(row.content),
      status: String(row.status),
      metacoinsCharged: Number(row.metacoins_charged ?? 0),
      createdAt: isoTimestamp(row.created_at)
    }));
    return Object.freeze({
      conversation: conversationDto(conversation),
      messages: Object.freeze(messages),
      nextCursor
    });
  }

  async archiveConversation({ telegramUserId, conversationId }) {
    const result = await this.pool.query(`
      UPDATE ${this.schema}.conversations c
      SET status = 'archived',
          updated_at = now()
      FROM ${this.schema}.users u
      WHERE u.id = c.user_id
        AND u.telegram_user_id = $1
        AND c.id = $2::uuid
        AND c.deleted_at IS NULL
      RETURNING c.id, c.status, c.kind, c.subject_id
    `, [
      telegramId(telegramUserId),
      uuid(conversationId, 'conversation id')
    ]);
    const row = result.rows[0];
    if (!row) return null;
    return Object.freeze({
      conversationId: String(row.id),
      status: String(row.status),
      kind: String(row.kind),
      subjectId: String(row.subject_id)
    });
  }

  async activateConversation({ telegramUserId, conversationId }) {
    const result = await this.pool.query(`
      UPDATE ${this.schema}.conversations c
      SET status = 'active',
          updated_at = now()
      FROM ${this.schema}.users u
      WHERE u.id = c.user_id
        AND u.telegram_user_id = $1
        AND c.id = $2::uuid
        AND c.deleted_at IS NULL
      RETURNING
        c.id, c.conversation_key, c.kind, c.subject_id, c.title, c.status
    `, [
      telegramId(telegramUserId),
      uuid(conversationId, 'conversation id')
    ]);
    const row = result.rows[0];
    if (!row) return null;
    return Object.freeze({
      conversationId: String(row.id),
      conversationKey: String(row.conversation_key),
      kind: String(row.kind),
      subjectId: String(row.subject_id),
      title: String(row.title),
      status: String(row.status)
    });
  }

  async appendMessage({
    telegramUserId,
    conversationId,
    role,
    content,
    telegramMessageId = null,
    status = 'completed',
    metadata = {}
  }) {
    const normalizedRole = optionalText(role, 20);
    if (!['system', 'user', 'assistant', 'tool'].includes(normalizedRole)) {
      throw new TypeError('Invalid message role.');
    }
    const normalizedContent = optionalText(content, 200_000);
    if (!normalizedContent) throw new TypeError('Message content is required.');
    const result = await this.pool.query(`
      INSERT INTO ${this.schema}.messages (
        conversation_id, user_id, role, content, telegram_message_id,
        status, metadata, created_at
      )
      SELECT $2::uuid, id, $3, $4, $5, $6, $7::jsonb, now()
      FROM ${this.schema}.users
      WHERE telegram_user_id = $1
      RETURNING id
    `, [
      telegramId(telegramUserId),
      conversationId,
      normalizedRole,
      normalizedContent,
      telegramMessageId ? String(telegramMessageId) : null,
      optionalText(status, 20),
      JSON.stringify(sanitizeHistoryMetadata(metadata))
    ]);
    return result.rows[0]?.id ?? null;
  }

  async startGeneration({
    telegramUserId,
    conversationId = null,
    requestKey,
    kind,
    subjectType = null,
    subjectId,
    prompt = '',
    parameters = {},
    metacoinsQuoted = 0
  }) {
    const result = await this.pool.query(`
      INSERT INTO ${this.schema}.generations (
        user_id, conversation_id, request_key, kind, subject_type, subject_id, prompt,
        parameters, status, metacoins_quoted, started_at
      )
      SELECT id, $2::uuid, $3, $4, $5, $6, $7, $8::jsonb, 'running', $9, now()
      FROM ${this.schema}.users
      WHERE telegram_user_id = $1
      ON CONFLICT (request_key) DO UPDATE SET request_key = EXCLUDED.request_key
      RETURNING id
    `, [
      telegramId(telegramUserId),
      conversationId,
      optionalText(requestKey, 200),
      optionalText(kind, 30),
      generationSubjectType(subjectType),
      optionalText(subjectId, 100),
      optionalText(prompt, 200_000) ?? '',
      JSON.stringify(sanitizeHistoryMetadata(parameters)),
      nonNegativeInteger(metacoinsQuoted, 'quoted metacoins')
    ]);
    return result.rows[0]?.id ?? null;
  }

  async completeGeneration({
    generationId,
    outputText = null,
    metacoinsCharged = 0,
    provider = null,
    providerModelId = null,
    metadata = {}
  }) {
    const result = await this.pool.query(`
      UPDATE ${this.schema}.generations
      SET status = 'completed',
          output_text = $2,
          metacoins_charged = $3,
          provider = $4,
          provider_model_id = $5,
          metadata = metadata || $6::jsonb,
          finished_at = now(),
          updated_at = now()
      WHERE id = $1::uuid
      RETURNING id
    `, [
      generationId,
      optionalText(outputText, 200_000),
      nonNegativeInteger(metacoinsCharged, 'charged metacoins'),
      optionalText(provider, 80),
      optionalText(providerModelId, 160),
      JSON.stringify(sanitizeHistoryMetadata(metadata))
    ]);
    return result.rows[0]?.id ?? null;
  }

  async failGeneration({ generationId, errorCode = 'provider_error', errorMessage = '' }) {
    const result = await this.pool.query(`
      UPDATE ${this.schema}.generations
      SET status = 'failed',
          error_code = $2,
          error_message = $3,
          finished_at = now(),
          updated_at = now()
      WHERE id = $1::uuid
      RETURNING id
    `, [
      generationId,
      optionalText(errorCode, 80),
      optionalText(errorMessage, 1_000)
    ]);
    return result.rows[0]?.id ?? null;
  }

  async recordMetacoinTransaction({
    telegramUserId,
    idempotencyKey,
    delta,
    balanceAfter,
    source,
    referenceType = null,
    referenceId = null,
    description = null,
    metadata = {}
  }) {
    const normalizedSource = optionalText(source, 32);
    if (![
      'purchase',
      'subscription',
      'generation',
      'promo',
      'referral',
      'refund',
      'admin',
      'expiry'
    ].includes(normalizedSource)) {
      throw new TypeError('Invalid metacoin source.');
    }
    const result = await this.pool.query(`
      INSERT INTO ${this.schema}.metacoin_ledger (
        user_id, idempotency_key, delta, balance_after, source,
        reference_type, reference_id, description, metadata, created_at
      )
      SELECT id, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, now()
      FROM ${this.schema}.users
      WHERE telegram_user_id = $1
      ON CONFLICT (idempotency_key) DO UPDATE SET
        idempotency_key = EXCLUDED.idempotency_key
      WHERE ${this.schema}.metacoin_ledger.user_id = EXCLUDED.user_id
        AND ${this.schema}.metacoin_ledger.delta = EXCLUDED.delta
        AND ${this.schema}.metacoin_ledger.balance_after = EXCLUDED.balance_after
        AND ${this.schema}.metacoin_ledger.source = EXCLUDED.source
      RETURNING id
    `, [
      telegramId(telegramUserId),
      optionalText(idempotencyKey, 200),
      nonZeroInteger(delta, 'metacoin delta'),
      nonNegativeInteger(balanceAfter, 'metacoin balance'),
      normalizedSource,
      optionalText(referenceType, 80),
      optionalText(referenceId, 200),
      optionalText(description, 500),
      JSON.stringify(sanitizeHistoryMetadata(metadata))
    ]);
    const id = result.rows[0]?.id;
    if (!id) throw new Error('Metacoin ledger user is missing or idempotency payload conflicts.');
    return id;
  }

  async listGenerations({
    telegramUserId,
    limit = 10,
    offset = 0,
    cursor = null,
    kind = null,
    scope = null
  }) {
    const pageSize = positivePageSize(limit, { defaultValue: 10, maximum: 25 });
    const pageOffset = nonNegativeInteger(offset, 'history offset');
    const normalizedKind = optionalText(kind, 30);
    if (normalizedKind && !['text', 'image', 'video', 'audio', 'music', 'voice', 'document', '3d', 'tool', 'agent'].includes(normalizedKind)) {
      throw new TypeError('Invalid generation kind filter.');
    }
    const normalizedScope = generationScope(scope);
    const decoded = decodeCursor(cursor);
    const result = await this.pool.query(`
      SELECT
        g.id, g.kind, g.subject_type, g.subject_id, g.status,
        g.metacoins_quoted, g.metacoins_charged,
        g.created_at, g.finished_at,
        left(g.prompt, 160) AS prompt_preview,
        left(coalesce(g.output_text, ''), 160) AS output_preview
      FROM ${this.schema}.generations g
      JOIN ${this.schema}.users u ON u.id = g.user_id
      WHERE u.telegram_user_id = $1
        AND ($2::text IS NULL OR g.kind = $2)
        AND (
          $3::text IS NULL
          OR $3::text = 'all'
          OR (
            $3::text = 'media'
            AND (
              g.subject_type = 'tool'
              OR g.subject_type IN ('entertainment', 'music')
              OR (g.subject_type = 'model' AND g.kind IN ('image', 'video', 'audio', 'music', 'voice', 'document', '3d'))
              OR (g.subject_type IS NULL AND g.kind IN ('image', 'video', 'audio', 'music', 'voice', 'document', '3d', 'tool'))
            )
          )
          OR (
            $3::text = 'agent'
            AND (g.subject_type = 'agent' OR (g.subject_type IS NULL AND g.kind = 'agent'))
          )
        )
        AND (
          $4::timestamptz IS NULL
          OR (g.created_at, g.id) < ($4::timestamptz, $5::uuid)
        )
      ORDER BY g.created_at DESC, g.id DESC
      LIMIT $6
      OFFSET $7
    `, [
      telegramId(telegramUserId),
      normalizedKind,
      normalizedScope,
      decoded.at,
      decoded.id,
      pageSize + 1,
      pageOffset
    ]);
    const hasMore = result.rows.length > pageSize;
    const rows = result.rows.slice(0, pageSize);
    return Object.freeze({
      items: Object.freeze(rows.map(generationDto)),
      nextCursor: hasMore && rows.length ? encodeCursor(rows.at(-1)) : null,
      hasMore
    });
  }

  async getGeneration({ telegramUserId, generationId }) {
    const result = await this.pool.query(`
      SELECT
        g.id, g.kind, g.subject_type, g.subject_id, g.status,
        g.metacoins_quoted, g.metacoins_charged,
        g.created_at, g.finished_at,
        g.prompt, g.output_text,
        g.parameters, g.metadata,
        coalesce(g.metadata->>'outputType', g.metadata->>'output_type') AS output_type
      FROM ${this.schema}.generations g
      JOIN ${this.schema}.users u ON u.id = g.user_id
      WHERE u.telegram_user_id = $1
        AND g.id = $2::uuid
      LIMIT 1
    `, [
      telegramId(telegramUserId),
      uuid(generationId, 'generation id')
    ]);
    return result.rows[0] ? generationDto(result.rows[0]) : null;
  }

  async recordPaymentCreated(value) {
    const amountKopecks = nonNegativeInteger(value.amountKopecks, 'payment amount');
    if (amountKopecks === 0) throw new TypeError('Invalid payment amount.');
    const baseMetacoins = nonNegativeInteger(value.baseMetacoins ?? 0, 'base metacoins');
    const paymentIdentifier = optionalText(value.paymentId, 128);
    const productType = boundedStatus(value.productType, ['metacoins', 'subscription']);
    const productIdentifier = optionalText(value.productId, 80);
    const customerEmail = value.receiptEmail ? receiptEmail(value.receiptEmail) : null;
    const customerPhone = value.receiptPhone ? receiptPhone(value.receiptPhone) : null;
    const provider = paymentProvider(value.provider);
    const receiptStatus = receiptRegistration(value.providerPayload?.receipt_registration);
    const userResult = await this.pool.query(
      `SELECT id FROM ${this.schema}.users WHERE telegram_user_id = $1::bigint`,
      [telegramId(value.telegramUserId)]
    );
    const userId = userResult.rows[0]?.id;
    if (!userId) throw new Error('History user is missing.');
    const insertResult = await this.pool.query(`
      INSERT INTO ${this.schema}.payments (
        user_id, payment_id, provider, product_type, product_id,
        amount_kopecks, currency, payment_method, status, base_metacoins,
        receipt_email, receipt_phone, receipt_registration, receipt_sent_at,
        provider_payload, updated_at
      ) VALUES (
        $1::uuid, $2, $3, $4, $5, $6, 'RUB', $7, 'pending', $8,
        $9, $10, $11, CASE WHEN $11 = 'succeeded' THEN now() ELSE NULL END,
        $12::jsonb, now()
      )
      ON CONFLICT (payment_id) DO NOTHING
      RETURNING id
    `, [
      userId,
      paymentIdentifier,
      provider,
      productType,
      productIdentifier,
      amountKopecks,
      paymentMethodFromProvider(value.providerPayload, provider),
      baseMetacoins,
      customerEmail,
      customerPhone,
      receiptStatus,
      JSON.stringify(sanitizeHistoryMetadata(value.providerPayload))
    ]);
    if (insertResult.rows[0]?.id) return insertResult.rows[0].id;
    const existingResult = await this.pool.query(`
      SELECT id, user_id, payment_id, provider, product_type, product_id,
             amount_kopecks, base_metacoins, receipt_email, receipt_phone
      FROM ${this.schema}.payments
      WHERE payment_id = $1
    `, [paymentIdentifier]);
    const existing = existingResult.rows[0];
    const matches = existing
      && existing.user_id === userId
      && existing.payment_id === paymentIdentifier
      && existing.provider === provider
      && existing.product_type === productType
      && existing.product_id === productIdentifier
      && Number(existing.amount_kopecks) === amountKopecks
      && Number(existing.base_metacoins) === baseMetacoins
      && (existing.receipt_email ?? null) === customerEmail
      && (existing.receipt_phone ?? null) === customerPhone;
    if (!matches) throw new Error('Payment idempotency payload conflicts.');
    return existing.id;
  }

  async recordCryptoUsdcCheckout(value) {
    const snapshot = sanitizeHistoryMetadata(value.snapshot);
    const product = snapshot.product;
    const allocation = snapshot.allocation;
    if (!product || !allocation) throw new TypeError('Crypto USDC snapshot is invalid.');
    const amount = nonNegativeInteger(value.amountUsdcMicros, 'USDC amount');
    if (amount <= 0) throw new TypeError('Invalid USDC amount.');
    const userResult = await this.pool.query(
      `SELECT id FROM ${this.schema}.users WHERE telegram_user_id = $1::bigint`,
      [telegramId(value.telegramUserId)]
    );
    const userId = userResult.rows[0]?.id;
    if (!userId) throw new Error('History user is missing.');
    const values = [
      optionalText(value.orderId, 128),
      userId,
      telegramId(value.telegramChatId),
      boundedStatus(product.kind, ['package', 'tariff']),
      optionalText(product.productId, 80),
      optionalText(product.productName, 200),
      nonNegativeInteger(product.durationMonths, 'duration months'),
      nonNegativeInteger(product.metacoins, 'metacoins'),
      amount,
      JSON.stringify(snapshot)
    ];
    const inserted = await this.pool.query(`
      INSERT INTO ${this.schema}.crypto_usdc_payments (
        order_id, user_id, telegram_chat_id, product_kind, product_code,
        product_name, duration_months, metacoins, amount_usdc_micros,
        currency, chain, payment_method, immutable_snapshot, status, updated_at
      ) VALUES ($1, $2::uuid, $3::bigint, $4, $5, $6, $7, $8, $9,
        'USDC', 'base', 'crypto_usdc', $10::jsonb, 'pending', now())
      ON CONFLICT (order_id) DO NOTHING
      RETURNING id
    `, values);
    if (inserted.rows[0]?.id) return inserted.rows[0].id;
    const existing = await this.pool.query(`
      SELECT id
      FROM ${this.schema}.crypto_usdc_payments
      WHERE order_id = $1 AND user_id = $2::uuid AND telegram_chat_id = $3::bigint
        AND product_kind = $4 AND product_code = $5 AND product_name = $6
        AND duration_months = $7 AND metacoins = $8 AND amount_usdc_micros = $9
        AND currency = 'USDC' AND chain = 'base' AND immutable_snapshot = $10::jsonb
    `, values);
    if (!existing.rows[0]) throw new Error('Crypto USDC checkout idempotency payload conflicts.');
    return existing.rows[0].id;
  }

  async recordCryptoUsdcCallback(value) {
    const result = await this.pool.query(`
      SELECT status, duplicate, finance_request_created,
        telegram_user_id, telegram_chat_id, product_kind, product_id,
        duration_months, duration_days, metacoins, confirmed_at
      FROM ${this.schema}.record_crypto_usdc_callback(
        $1, $2, $3, $4, $5, 'USDC', 'base', 'confirmed', $6::timestamptz, $7::jsonb
      )
    `, [
      optionalText(value.callbackId, 220),
      optionalText(value.orderId, 128),
      optionalText(value.paymentId, 128),
      optionalText(value.transactionHash, 66),
      nonNegativeInteger(value.amountUsdcMicros, 'USDC amount'),
      isoTimestamp(value.confirmedAt),
      JSON.stringify(sanitizeHistoryMetadata(value))
    ]);
    const row = result.rows[0];
    if (!row) throw new Error('PostgreSQL did not record the Crypto USDC callback.');
    return Object.freeze({
      status: row.status,
      duplicate: Boolean(row.duplicate),
      financeRequestCreated: Boolean(row.finance_request_created),
      telegramUserId: String(row.telegram_user_id),
      telegramChatId: String(row.telegram_chat_id),
      productKind: row.product_kind,
      productId: row.product_id,
      durationMonths: Number(row.duration_months),
      durationDays: Number(row.duration_days),
      metacoins: Number(row.metacoins),
      confirmedAt: isoTimestamp(row.confirmed_at)
    });
  }

  async completeCryptoUsdcFulfillment(value) {
    const result = await this.pool.query(`
      SELECT status, duplicate
      FROM ${this.schema}.complete_crypto_usdc_fulfillment($1, $2, $3::timestamptz)
    `, [
      optionalText(value.orderId, 128),
      boundedStatus(value.entitlementStatus, ['fulfilled', 'duplicate']),
      isoTimestamp(value.fulfilledAt)
    ]);
    const row = result.rows[0];
    if (!row) throw new Error('PostgreSQL did not complete the Crypto USDC fulfillment.');
    return Object.freeze({ status: row.status, duplicate: Boolean(row.duplicate) });
  }

  async recordPaymentFulfilled({
    telegramUserId,
    paymentId,
    metacoins,
    bonusMetacoins = 0,
    balanceAfter
  }) {
    const result = await this.pool.query(
      `SELECT * FROM ${this.schema}.record_metacoin_purchase($1::bigint, $2, $3, $4, $5)`,
      [
        telegramId(telegramUserId),
        optionalText(paymentId, 128),
        nonNegativeInteger(metacoins, 'metacoins'),
        nonNegativeInteger(bonusMetacoins, 'bonus metacoins'),
        nonNegativeInteger(balanceAfter, 'metacoin balance')
      ]
    );
    const row = result.rows[0];
    if (!row) throw new Error('PostgreSQL did not record the metacoin purchase.');
    return Object.freeze({
      ledgerId: row.ledger_id,
      duplicate: Boolean(row.duplicate),
      balanceAfter: Number(row.balance_after)
    });
  }

  async recordFinanceAllocations({
    externalPaymentId,
    telegramUserId,
    allocations,
    metadata = {},
    autoTopUp = false,
    occurredAt = this.now()
  }) {
    const paymentIdentifier = optionalText(externalPaymentId, 128);
    if (!paymentIdentifier) throw new TypeError('Finance payment id is required.');
    if (!Array.isArray(allocations) || allocations.length === 0) {
      throw new TypeError('Finance allocations are required.');
    }
    const reserveCarryInKopecks = metadata?.reserveCarryInKopecks === undefined
      ? 0
      : nonNegativeInteger(metadata.reserveCarryInKopecks, 'reserve carry');
    const client = reserveCarryInKopecks > 0 ? await this.pool.connect() : this.pool;
    if (reserveCarryInKopecks > 0) await client.query('BEGIN');
    try {
    const userResult = await client.query(
      `SELECT id FROM ${this.schema}.users WHERE telegram_user_id = $1::bigint`,
      [telegramId(telegramUserId)]
    );
    const userId = userResult.rows[0]?.id;
    if (!userId) throw new Error('History user is missing.');
    const allowedCategories = ['gross', 'payment_fee', 'api_reserve', 'referral_liability', 'owner_share', 'refund'];
    const allowedStatuses = ['estimated', 'reserved', 'actual', 'reversed'];
    const occurred = isoTimestamp(occurredAt);
    for (const allocation of allocations) {
      const allocationKey = optionalText(allocation?.allocationKey, 180);
      const category = boundedStatus(allocation?.category, allowedCategories);
      const amount = nonNegativeInteger(allocation?.amountKopecks, 'finance allocation amount');
      if (!allocationKey || amount <= 0) throw new TypeError('Finance allocation is invalid.');
      const currency = String(allocation?.currency ?? 'RUB').trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) throw new TypeError('Finance currency is invalid.');
      const status = boundedStatus(allocation?.status, allowedStatuses);
      const provider = optionalText(allocation?.provider, 64);
      await client.query(`
        INSERT INTO ${this.schema}.finance_allocations (
          allocation_key, external_payment_id, user_id, category, provider,
          amount_kopecks, currency, status, source, metadata, occurred_at, updated_at
        ) VALUES ($1, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::timestamptz, now())
        ON CONFLICT (allocation_key) DO NOTHING
      `, [
        allocationKey,
        paymentIdentifier,
        userId,
        category,
        provider,
        amount,
        currency,
        status,
        optionalText(allocation?.source, 64) ?? 'payment_webhook',
        JSON.stringify(sanitizeHistoryMetadata({ ...metadata, provider: provider ?? undefined })),
        occurred
      ]);
      // Provider top-ups are created only by the YooKassa confirmation
      // function. Keeping this method allocation-only prevents any caller
      // (including Telegram Stars) from creating an executable queue entry.
    }
    if (reserveCarryInKopecks > 0) {
      const carryResult = await client.query(
        `SELECT * FROM ${this.schema}.reclassify_upgrade_provider_reserve($1::text, $2::bigint)`,
        [paymentIdentifier, reserveCarryInKopecks]
      );
      const carry = carryResult.rows[0];
      if (!carry?.reclassification_id
        || Number(carry.reserve_carry_in_kopecks) !== reserveCarryInKopecks) {
        throw new Error('PostgreSQL did not secure the upgrade reserve carry.');
      }
      await client.query('COMMIT');
    }
    return allocations.length;
    } catch (error) {
      if (reserveCarryInKopecks > 0) await client.query('ROLLBACK');
      throw error;
    } finally {
      if (reserveCarryInKopecks > 0) client.release();
    }
  }

  async recordYooKassaPaymentConfirmation({
    externalEventId,
    paymentId,
    amountKopecks,
    currency = 'RUB',
    event = 'payment.succeeded',
    status = 'succeeded',
    confirmedAt = this.now(),
    metadata = {}
  }) {
    const eventId = optionalText(externalEventId, 220);
    const paymentIdentifier = optionalText(paymentId, 128);
    const amount = nonNegativeInteger(amountKopecks, 'YooKassa payment amount');
    const normalizedCurrency = String(currency ?? '').trim().toUpperCase();
    const normalizedEvent = optionalText(event, 64);
    const normalizedStatus = optionalText(status, 32);
    if (!eventId || !paymentIdentifier || amount <= 0
      || !/^[A-Z]{3}$/.test(normalizedCurrency)
      || normalizedEvent !== 'payment.succeeded'
      || normalizedStatus !== 'succeeded') {
      throw new TypeError('Invalid YooKassa payment confirmation.');
    }
    const result = await this.pool.query(
      `SELECT * FROM ${this.schema}.record_yookassa_payment_confirmation(
        $1::text, $2::text, $3::bigint, $4::text, $5::text, $6::timestamptz, $7::jsonb
      )`,
      [
        eventId,
        paymentIdentifier,
        amount,
        normalizedCurrency,
        normalizedEvent,
        isoTimestamp(confirmedAt),
        JSON.stringify(sanitizeHistoryMetadata(metadata))
      ]
    );
    const row = result.rows[0];
    if (!row?.confirmation_id || !row?.payment_id || row.status !== 'succeeded') {
      throw new Error('PostgreSQL did not record the YooKassa confirmation.');
    }
    return Object.freeze({
      confirmationId: String(row.confirmation_id),
      duplicate: Boolean(row.duplicate),
      paymentId: String(row.payment_id),
      providerReserveKopecks: Number(row.provider_reserve_kopecks),
      topupCount: Number(row.topup_count),
      status: String(row.status)
    });
  }

  async recordWalletEntries({
    entries,
    occurredAt = this.now()
  }) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new TypeError('Wallet entries are required.');
    }
    const occurred = isoTimestamp(occurredAt);
    for (const entry of entries) {
      const entryKey = optionalText(entry?.entryKey, 220);
      const paymentIdentifier = optionalText(entry?.externalPaymentId, 128);
      const account = boundedStatus(entry?.account, [
        'cash', 'payment_fee', 'api_reserve', 'provider_spend', 'referral_liability', 'owner_share', 'payout'
      ]);
      const direction = boundedStatus(entry?.direction, ['credit', 'debit']);
      const amount = nonNegativeInteger(entry?.amountKopecks, 'wallet amount');
      if (!entryKey || !paymentIdentifier || amount <= 0) throw new TypeError('Wallet entry is invalid.');
      const userResult = entry.telegramUserId === null || entry.telegramUserId === undefined
        ? { rows: [{ id: null }] }
        : await this.pool.query(
          `SELECT id FROM ${this.schema}.users WHERE telegram_user_id = $1::bigint`,
          [telegramId(entry.telegramUserId)]
        );
      const userId = userResult.rows[0]?.id ?? null;
      if (entry.telegramUserId !== null && entry.telegramUserId !== undefined && !userId) {
        throw new Error('Wallet user is missing.');
      }
      const currency = String(entry.currency ?? 'RUB').trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) throw new TypeError('Wallet currency is invalid.');
      await this.pool.query(`
        INSERT INTO ${this.schema}.finance_wallet_ledger (
          entry_key, external_payment_id, allocation_key, user_id, account,
          category, provider, direction, amount_kopecks, currency, status,
          source, metadata, occurred_at, updated_at
        ) VALUES ($1, $2, $3, $4::uuid, $5, $6, $7, $8, $9, $10, 'posted', $11, $12::jsonb, $13::timestamptz, now())
        ON CONFLICT (entry_key) DO NOTHING
      `, [
        entryKey,
        paymentIdentifier,
        optionalText(entry.allocationKey, 180),
        userId,
        account,
        optionalText(entry.category, 64),
        optionalText(entry.provider, 64),
        direction,
        amount,
        currency,
        optionalText(entry.source, 64) ?? 'payment_webhook',
        JSON.stringify(sanitizeHistoryMetadata(entry.metadata ?? {})),
        entry.occurredAt ? isoTimestamp(entry.occurredAt) : occurred
      ]);
    }
    return entries.length;
  }

  async recordFinancePayout({
    withdrawalId,
    telegramUserId,
    amountKopecks,
    method,
    provider = 'yookassa_payouts',
    externalPayoutId = null,
    payoutFeeKopecks = null,
    status = 'pending',
    payoutStatus = null,
    destinationHint = 'скрыто',
    errorCode = null,
    metadata = {},
    requestedAt = this.now(),
    processedAt = null
  }) {
    const withdrawalIdentifier = optionalText(withdrawalId, 128);
    if (!withdrawalIdentifier) throw new TypeError('Finance withdrawal id is required.');
    const amount = nonNegativeInteger(amountKopecks, 'finance payout amount');
    if (amount <= 0) throw new TypeError('Finance payout amount is invalid.');
    const payoutMethod = boundedStatus(method, ['sbp', 'bank_card']);
    const payoutStatusValue = payoutStatus ? optionalText(payoutStatus, 32) : null;
    const payoutStatusValueAllowed = !payoutStatusValue || ['pending', 'succeeded', 'canceled', 'failed'].includes(payoutStatusValue);
    if (!payoutStatusValueAllowed) throw new TypeError('Finance payout status is invalid.');
    const payoutState = boundedStatus(status, ['pending', 'submitted', 'succeeded', 'canceled', 'failed']);
    const userResult = telegramUserId === null || telegramUserId === undefined
      ? { rows: [] }
      : await this.pool.query(
        `SELECT id FROM ${this.schema}.users WHERE telegram_user_id = $1::bigint`,
        [telegramId(telegramUserId)]
      );
    const userId = userResult.rows[0]?.id ?? null;
    const fee = payoutFeeKopecks === null || payoutFeeKopecks === undefined
      ? null
      : nonNegativeInteger(payoutFeeKopecks, 'finance payout fee');
    const safeHint = optionalText(destinationHint, 64) ?? 'скрыто';
    const safeExternalId = externalPayoutId ? optionalText(externalPayoutId, 128) : null;
    const safeError = errorCode ? optionalText(errorCode, 64)?.replace(/[^A-Za-z0-9_.-]/gu, '') : null;
    const result = await this.pool.query(`
      INSERT INTO ${this.schema}.finance_payouts (
        withdrawal_id, user_id, telegram_user_id, amount_kopecks, currency,
        payout_method, provider, external_payout_id, payout_fee_kopecks,
        status, payout_status, destination_hint, error_code, metadata,
        requested_at, processed_at, updated_at
      ) VALUES ($1, $2::uuid, $3::bigint, $4, 'RUB', $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::timestamptz, $15::timestamptz, now())
      ON CONFLICT (withdrawal_id) DO UPDATE SET
        user_id = COALESCE(EXCLUDED.user_id, ${this.schema}.finance_payouts.user_id),
        telegram_user_id = COALESCE(EXCLUDED.telegram_user_id, ${this.schema}.finance_payouts.telegram_user_id),
        external_payout_id = COALESCE(EXCLUDED.external_payout_id, ${this.schema}.finance_payouts.external_payout_id),
        payout_fee_kopecks = COALESCE(EXCLUDED.payout_fee_kopecks, ${this.schema}.finance_payouts.payout_fee_kopecks),
        status = EXCLUDED.status,
        payout_status = EXCLUDED.payout_status,
        destination_hint = EXCLUDED.destination_hint,
        error_code = EXCLUDED.error_code,
        metadata = EXCLUDED.metadata,
        processed_at = EXCLUDED.processed_at,
        updated_at = now()
      RETURNING id
    `, [
      withdrawalIdentifier,
      userId,
      telegramUserId === null || telegramUserId === undefined ? null : telegramId(telegramUserId),
      amount,
      payoutMethod,
      optionalText(provider, 64) ?? 'yookassa_payouts',
      safeExternalId,
      fee,
      payoutState,
      payoutStatusValue,
      safeHint,
      safeError,
      JSON.stringify(sanitizeHistoryMetadata(metadata)),
      isoTimestamp(requestedAt),
      processedAt ? isoTimestamp(processedAt) : null
    ]);
    return result.rows[0]?.id ?? null;
  }

  async recordStarsPayment(value) {
    const amount = nonNegativeInteger(value.amountXtr, 'Stars amount');
    if (amount <= 0) throw new TypeError('Invalid Telegram Stars amount.');
    const baseMetacoins = nonNegativeInteger(value.baseMetacoins ?? 0, 'base metacoins');
    const paymentIdentifier = optionalText(value.paymentId, 128);
    const productType = boundedStatus(value.productType, ['metacoins', 'subscription']);
    const productIdentifier = optionalText(value.productId, 80);
    const paidAt = isoTimestamp(value.paidAt ?? this.now());
    const result = await this.pool.query(`
      SELECT * FROM ${this.schema}.record_telegram_stars_payment(
        $1::bigint, $2::text, $3::text, $4::text, $5::bigint,
        $6::integer, $7::timestamptz, $8::jsonb
      )
    `, [
      telegramId(value.telegramUserId),
      paymentIdentifier,
      productType,
      productIdentifier,
      amount,
      baseMetacoins,
      paidAt,
      JSON.stringify(sanitizeHistoryMetadata(value.providerPayload))
    ]);
    if (!result.rows[0]?.payment_id) throw new Error('PostgreSQL did not record the Stars payment.');
    return result.rows[0].payment_id;
  }

  async listPendingStarsPayments({ limit = 25 } = {}) {
    const size = positivePageSize(limit, { defaultValue: 25, maximum: 100 });
    const result = await this.pool.query(
      `SELECT * FROM ${this.schema}.list_pending_telegram_stars_fulfillments($1::integer)`,
      [size]
    );
    return result.rows.map((row) => Object.freeze({
      paymentId: String(row.payment_id),
      telegramUserId: String(row.telegram_user_id),
      providerPayload: Object.freeze({ ...sanitizeHistoryMetadata(row.provider_payload) })
    }));
  }

  async recordStarsSubscriptionActivated(value) {
    const result = await this.pool.query(
      `SELECT * FROM ${this.schema}.record_stars_subscription_activation(
        $1::bigint, $2::text, $3::text, $4::timestamptz, $5::timestamptz,
        $6::bigint, $7::integer, $8::integer
      )`,
      [
        telegramId(value.telegramUserId),
        optionalText(value.paymentId, 128),
        optionalText(value.planId, 80),
        isoTimestamp(value.startsAt),
        isoTimestamp(value.expiresAt),
        nonNegativeInteger(value.priceXtr, 'Stars subscription price'),
        nonNegativeInteger(value.metacoins, 'metacoins'),
        nonNegativeInteger(value.balanceAfter, 'metacoin balance')
      ]
    );
    const row = result.rows[0];
    if (!row) throw new Error('PostgreSQL did not record the Stars subscription activation.');
    return Object.freeze({
      subscriptionId: row.subscription_id,
      ledgerId: row.ledger_id,
      duplicate: Boolean(row.duplicate),
      startsAt: isoTimestamp(row.starts_at),
      expiresAt: isoTimestamp(row.expires_at)
    });
  }

  async getPaymentRecord(paymentIdentifier) {
    const result = await this.pool.query(`
      SELECT
        p.payment_id, u.telegram_user_id, p.product_type, p.product_id,
        p.amount_kopecks, p.amount_xtr, p.currency, p.base_metacoins,
        p.status, p.receipt_email
      FROM ${this.schema}.payments AS p
      JOIN ${this.schema}.users AS u ON u.id = p.user_id
      WHERE p.payment_id = $1
    `, [optionalText(paymentIdentifier, 128)]);
    const payment = result.rows[0];
    if (!payment) return null;
    return Object.freeze({
      paymentId: payment.payment_id,
      telegramUserId: String(payment.telegram_user_id),
      productType: payment.product_type,
      productId: payment.product_id,
      ...(payment.currency === 'XTR'
        ? { amountXtr: Number(payment.amount_xtr) }
        : { amountKopecks: Number(payment.amount_kopecks) }),
      baseMetacoins: Number(payment.base_metacoins),
      status: payment.status,
      ...(payment.receipt_email ? { receiptEmail: receiptEmail(payment.receipt_email) } : {})
    });
  }

  async getPaymentCheckoutRecord(paymentIdentifier) {
    const result = await this.pool.query(`
      SELECT
        p.payment_id, p.provider, p.provider_payload, p.receipt_email, p.receipt_phone,
        p.product_type, p.product_id, p.amount_kopecks, p.base_metacoins, p.status,
        u.telegram_user_id
      FROM ${this.schema}.payments AS p
      JOIN ${this.schema}.users AS u ON u.id = p.user_id
      WHERE p.payment_id = $1
    `, [optionalText(paymentIdentifier, 128)]);
    const payment = result.rows[0];
    if (!payment) return null;
    return Object.freeze({
      paymentId: payment.payment_id,
      provider: payment.provider,
      providerPayload: sanitizeHistoryMetadata(payment.provider_payload),
      telegramUserId: String(payment.telegram_user_id),
      productType: payment.product_type,
      productId: payment.product_id,
      amountKopecks: Number(payment.amount_kopecks),
      baseMetacoins: Number(payment.base_metacoins),
      status: payment.status,
      ...(payment.receipt_email ? { receiptEmail: receiptEmail(payment.receipt_email) } : {}),
      ...(payment.receipt_phone ? { receiptPhone: receiptPhone(payment.receipt_phone) } : {})
    });
  }

  async updatePaymentStatus(value) {
    const status = boundedStatus(value.status, [
      'pending',
      'succeeded',
      'cancelled',
      'refunded',
      'partially_refunded'
    ]);
    const providerPayload = sanitizeHistoryMetadata(value.providerPayload);
    const provider = paymentProvider(value.provider);
    const receiptStatus = receiptRegistration(providerPayload.receipt_registration);
    const customerEmail = receiptEmailFromProvider(providerPayload);
    const paidAt = status === 'succeeded' ? isoTimestamp(value.paidAt ?? this.now()) : null;
    const result = await this.pool.query(`
      UPDATE ${this.schema}.payments
      SET status = $2,
          receipt_email = COALESCE($3, receipt_email),
          receipt_registration = $4,
          receipt_sent_at = CASE
            WHEN $4 = 'succeeded' THEN COALESCE(receipt_sent_at, $5::timestamptz)
            ELSE receipt_sent_at
          END,
          payment_method = CASE WHEN $8 <> 'unknown' THEN $8 ELSE payment_method END,
          provider_payload = $6::jsonb,
          paid_at = CASE WHEN $2 = 'succeeded' THEN $7::timestamptz ELSE NULL END,
          updated_at = now()
      WHERE payment_id = $1
      RETURNING id
    `, [
      optionalText(value.paymentId, 128),
      status,
      customerEmail,
      receiptStatus,
      receiptStatus === 'succeeded' ? paidAt : null,
      JSON.stringify(providerPayload),
      paidAt,
      paymentMethodFromProvider(providerPayload, provider)
    ]);
    return result.rows[0]?.id ?? null;
  }

  async recordPaymentWebhook(value) {
    const provider = paymentProvider(value.provider);
    const result = await this.pool.query(`
      INSERT INTO ${this.schema}.provider_webhooks (
        provider, provider_event_id, event_type, signature_valid,
        payload, processing_status, processed_at
      ) VALUES ($1, $2, $3, $4, $5::jsonb, 'received', NULL)
      ON CONFLICT (provider, provider_event_id) DO NOTHING
      RETURNING id
    `, [
      provider,
      optionalText(value.providerEventId, 256),
      optionalText(value.eventType, 120),
      value.signatureValid === undefined ? null : value.signatureValid === true,
      JSON.stringify(sanitizeHistoryMetadata(value.payload))
    ]);
    return result.rows[0]?.id ?? null;
  }

  async claimPaymentWebhook(value) {
    const provider = paymentProvider(value.provider);
    const result = await this.pool.query(
      `SELECT claimed, processing_status
       FROM ${this.schema}.claim_provider_webhook($1, $2, $3, $4, $5::jsonb, $6)`,
      [
        provider,
        optionalText(value.providerEventId, 256),
        optionalText(value.eventType, 120),
        value.signatureValid === undefined ? null : value.signatureValid === true,
        JSON.stringify(sanitizeHistoryMetadata(value.payload)),
        Number(value.leaseSeconds ?? 300)
      ]
    );
    return Object.freeze({
      claimed: result.rows[0]?.claimed === true,
      status: result.rows[0]?.processing_status ?? null
    });
  }

  async getPaymentWebhookStatus(providerEventId, sourceProvider = 'yookassa') {
    const provider = paymentProvider(sourceProvider);
    const result = await this.pool.query(`
      SELECT processing_status
      FROM ${this.schema}.provider_webhooks
      WHERE provider = $1 AND provider_event_id = $2
    `, [provider, optionalText(providerEventId, 256)]);
    return result.rows[0]?.processing_status ?? null;
  }

  async updatePaymentWebhookStatus(value) {
    const provider = paymentProvider(value.provider);
    const status = boundedStatus(value.status, ['processed', 'failed', 'ignored']);
    const result = await this.pool.query(`
      UPDATE ${this.schema}.provider_webhooks
      SET processing_status = $3, error_message = $4, processed_at = now()
      WHERE provider = $1 AND provider_event_id = $2
      RETURNING id
    `, [
      provider,
      optionalText(value.providerEventId, 256),
      status,
      optionalText(value.errorMessage, 1_000)
    ]);
    return result.rows[0]?.id ?? null;
  }

  async schedulePaymentAbandonmentReminders(value) {
    await this.pool.query(
      `SELECT ${this.schema}.schedule_payment_abandonment_reminders(
        $1::text, $2::bigint, $3::bigint, $4::timestamptz, $5::timestamptz
      )`,
      [
        optionalText(value.paymentId, 128),
        telegramId(value.telegramUserId),
        telegramId(value.telegramChatId),
        isoTimestamp(value.firstDueAt),
        isoTimestamp(value.secondDueAt)
      ]
    );
  }

  async scheduleNewcomerReminder(value) {
    await this.pool.query(
      `SELECT ${this.schema}.schedule_newcomer_reminder($1::bigint, $2::bigint, $3::timestamptz)`,
      [
        telegramId(value.telegramUserId),
        telegramId(value.telegramChatId),
        isoTimestamp(value.dueAt)
      ]
    );
  }

  async claimDueLifecycleNotifications({ limit = 20 } = {}) {
    const result = await this.pool.query(
      `SELECT * FROM ${this.schema}.claim_due_lifecycle_notifications($1::integer, 300::integer)`,
      [positivePageSize(limit, { defaultValue: 20, maximum: 50 })]
    );
    return Object.freeze(result.rows.map((row) => Object.freeze({
      id: uuid(row.id, 'lifecycle notification id'),
      scenario: optionalText(row.scenario, 80),
      telegramUserId: telegramId(row.telegram_user_id),
      telegramChatId: telegramId(row.telegram_chat_id),
      paymentId: optionalText(row.payment_id, 128)
    })));
  }

  async markLifecycleNotificationSent(notificationId) {
    const result = await this.pool.query(
      `SELECT ${this.schema}.mark_lifecycle_notification_sent($1::uuid) AS sent`,
      [uuid(notificationId, 'lifecycle notification id')]
    );
    return Boolean(result.rows[0]?.sent);
  }

  async cancelLifecycleNotification(notificationId, reason) {
    const result = await this.pool.query(
      `SELECT ${this.schema}.cancel_lifecycle_notification($1::uuid, $2::text) AS cancelled`,
      [
        uuid(notificationId, 'lifecycle notification id'),
        optionalText(reason, 500) ?? 'cancelled'
      ]
    );
    return Boolean(result.rows[0]?.cancelled);
  }

  async getNewcomerReminderEligibility({ telegramUserId }) {
    const result = await this.pool.query(
      `SELECT * FROM ${this.schema}.get_newcomer_reminder_eligibility($1::bigint)`,
      [telegramId(telegramUserId)]
    );
    const row = result.rows[0];
    return Object.freeze({
      eligible: Boolean(row?.eligible),
      reason: optionalText(row?.reason, 80) ?? 'not_eligible'
    });
  }

  async claimFreeWeeklyRequest({
    telegramUserId,
    requestKey,
    quotaKey = 'text',
    requestLimit = 50
  }) {
    const result = await this.pool.query(
      `SELECT * FROM ${this.schema}.claim_free_weekly_entitlement(
        $1::bigint, $2::text, $3::text, $4::integer
      )`,
      [
        telegramId(telegramUserId),
        optionalText(requestKey, 200),
        optionalText(quotaKey, 32),
        requestLimit
      ]
    );
    return freeQuotaDto(result.rows[0]);
  }

  async releaseFreeWeeklyRequest({ telegramUserId, requestKey, quotaKey = 'text' }) {
    const result = await this.pool.query(
      `SELECT ${this.schema}.release_free_weekly_entitlement(
        $1::bigint, $2::text, $3::text
      ) AS released`,
      [
        telegramId(telegramUserId),
        optionalText(requestKey, 200),
        optionalText(quotaKey, 32)
      ]
    );
    return Boolean(result.rows[0]?.released);
  }

  async getLegalConsentStatus({ telegramUserId }) {
    const result = await this.pool.query(
      `SELECT * FROM ${this.schema}.get_legal_consent_status($1::bigint)`,
      [telegramId(telegramUserId)]
    );
    return legalConsentDto(result.rows[0]);
  }

  async recordLegalConsent({
    telegramUserId,
    consentKind,
    documentVersion,
    requestKey,
    telegramUpdateId = null,
    telegramMessageId = null,
    telegramCallbackId = null,
    metadata = {}
  }) {
    const result = await this.pool.query(
      `SELECT * FROM ${this.schema}.record_legal_consent(
        $1::bigint, $2::text, $3::text, $4::text,
        $5::bigint, $6::bigint, $7::text, $8::jsonb
      )`,
      [
        telegramId(telegramUserId),
        optionalText(consentKind, 32),
        optionalText(documentVersion, 64),
        optionalText(requestKey, 200),
        optionalNonNegativeIntegerId(telegramUpdateId),
        optionalNonNegativeIntegerId(telegramMessageId),
        optionalText(telegramCallbackId, 200),
        JSON.stringify(sanitizeHistoryMetadata(metadata))
      ]
    );
    return legalConsentDto(result.rows[0]);
  }

  async close() {
    await this.pool.end?.();
  }
}
