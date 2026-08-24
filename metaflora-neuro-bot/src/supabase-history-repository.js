import { sanitizeHistoryMetadata } from './history-contract.js';

function text(value, maximum = 255) {
  if (value === null || value === undefined || value === '') return null;
  return String(value).replace(/\u0000/g, '').trim().slice(0, maximum) || null;
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

function telegramId(value) {
  const id = String(value ?? '');
  if (!/^[1-9]\d{0,19}$/.test(id)) throw new TypeError('Invalid Telegram user id.');
  return id;
}

function integer(value, { positive = false, nonZero = false } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new TypeError('Invalid integer.');
  if (positive && number < 0) throw new TypeError('Integer must be non-negative.');
  if (nonZero && number === 0) throw new TypeError('Integer must not be zero.');
  return number;
}

function isoNow() {
  return new Date().toISOString();
}

function isoTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError('Invalid history timestamp.');
  return date.toISOString();
}

function uuid(value, label = 'UUID') {
  const normalized = String(value ?? '').toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)) {
    throw new TypeError(`Invalid ${label}.`);
  }
  return normalized;
}

function pageSize(value, fallback, maximum) {
  const number = Number(value ?? fallback);
  if (!Number.isSafeInteger(number) || number < 1 || number > maximum) {
    throw new TypeError('Invalid page size.');
  }
  return number;
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

function conversationDto(row, extra = {}) {
  return Object.freeze({
    id: String(row.id),
    kind: String(row.kind),
    subjectId: row.subject_id ? String(row.subject_id) : null,
    title: String(row.title || 'новый диалог'),
    status: String(row.status),
    latestMessageAt: isoTimestamp(row.latest_message_at),
    createdAt: isoTimestamp(row.created_at),
    ...extra
  });
}

function resultData(result) {
  if (result.error) throw result.error;
  return result.data;
}

function providerTopupDto(row) {
  if (!row) return null;
  const amountKopecks = integer(row.amount_kopecks, { positive: true });
  if (amountKopecks <= 0) throw new Error('Provider topup amount is invalid.');
  return Object.freeze({
    id: uuid(row.id, 'provider topup id'),
    allocationKey: text(row.allocation_key, 220),
    paymentId: text(row.payment_id, 128),
    provider: text(row.provider, 64),
    amountKopecks,
    currency: text(row.currency, 3)?.toUpperCase() ?? 'RUB',
    status: text(row.status, 32),
    attemptCount: integer(row.attempt_count ?? 0, { positive: true }),
    claimToken: row.claim_token ? uuid(row.claim_token, 'provider topup claim token') : null,
    leaseUntil: row.lease_until ? isoTimestamp(row.lease_until) : null,
    externalId: text(row.external_id, 255),
    observedTransactionId: text(row.observed_transaction_id, 255),
    observedAmountKopecks: row.observed_amount_kopecks === null
      || row.observed_amount_kopecks === undefined
      ? null
      : integer(row.observed_amount_kopecks, { positive: true }),
    observedBalanceKopecks: row.observed_balance_kopecks === null
      || row.observed_balance_kopecks === undefined
      ? null
      : integer(row.observed_balance_kopecks, { positive: true }),
    observedAt: row.observed_at ? isoTimestamp(row.observed_at) : null,
    errorCode: text(row.error_code, 64)
  });
}

function firstId(result) {
  const data = resultData(result);
  return Array.isArray(data) ? data[0]?.id ?? null : data?.id ?? null;
}

function safeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return new Date(0).toISOString();
  return date.toISOString();
}

function generationSubjectType(value) {
  const subjectType = text(value, 30);
  if (subjectType && !['model', 'tool', 'agent', 'entertainment', 'music'].includes(subjectType)) {
    throw new TypeError('Invalid generation subject type.');
  }
  return subjectType;
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
    createdAt: safeDate(row.created_at),
    finishedAt: row.finished_at ? safeDate(row.finished_at) : null,
    promptPreview: text(row.prompt, 160) ?? '',
    outputPreview: text(row.output_text, 160) ?? '',
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
    termsVersion: text(row?.terms_version, 64),
    personalDataAccepted: Boolean(row?.personal_data_accepted),
    personalDataVersion: text(row?.personal_data_version, 64),
    completed: Boolean(
      row?.completed
      ?? (row?.terms_accepted && row?.personal_data_accepted)
    ),
    duplicate: Boolean(row?.duplicate)
  });
}

export class SupabaseHistoryRepository {
  constructor({ client, schema = 'neuro' }) {
    if (!client?.schema) throw new TypeError('Supabase client is required.');
    this.client = client.schema(schema);
  }

  async userId(telegramUserId) {
    const result = await this.client
      .from('users')
      .select('id')
      .eq('telegram_user_id', telegramId(telegramUserId))
      .maybeSingle();
    const data = resultData(result);
    if (!data?.id) throw new Error('History user is missing.');
    return data.id;
  }

  async loadEntertainmentSession({ telegramUserId, sessionId = null }) {
    let query = this.client
      .from('entertainment_sessions')
      .select('session_id,scenario_id,version,step,status,charged,cost,media_counts,state,revision,updated_at,expires_at')
      .eq('telegram_user_id', telegramId(telegramUserId))
      .gt('expires_at', isoNow());
    query = sessionId
      ? query.eq('session_id', text(sessionId, 128)).maybeSingle()
      : query.eq('status', 'active').order('updated_at', { ascending: false }).limit(1).maybeSingle();
    const row = resultData(await query);
    if (!row) return null;
    return Object.freeze({
      telegramUserId: telegramId(telegramUserId), sessionId: row.session_id,
      scenarioId: row.scenario_id, version: row.version, step: row.step,
      status: row.status, charged: row.charged, cost: row.cost,
      mediaCounts: Object.freeze(row.media_counts ?? {}), state: Object.freeze(row.state ?? {}),
      revision: row.revision, updatedAt: row.updated_at, expiresAt: row.expires_at
    });
  }

  async saveEntertainmentSession(session) {
    const result = await this.client.rpc('save_entertainment_session', {
      p_telegram_user_id: telegramId(session.telegramUserId),
      p_session_id: text(session.sessionId, 128),
      p_scenario_id: text(session.scenarioId, 128),
      p_version: session.version,
      p_step: session.step,
      p_status: session.status,
      p_charged: Boolean(session.charged),
      p_cost: session.cost,
      p_media_counts: session.mediaCounts ?? {},
      p_state: session.state ?? {},
      p_transition_key: session.transitionKey ?? null,
      p_expected_revision: session.expectedRevision ?? null,
      p_expires_at: session.expiresAt ?? null
    });
    const row = resultData(result);
    if (!row) throw new Error('Entertainment session was not saved.');
    return this.loadEntertainmentSession({ telegramUserId: session.telegramUserId, sessionId: session.sessionId });
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
    const now = isoNow();
    const result = await this.client
      .from('users')
      .upsert({
        telegram_user_id: telegramId(telegramUserId),
        username: text(username, 32) ?? '',
        first_name: text(firstName, 100) ?? '',
        last_name: text(lastName, 100) ?? '',
        language_code: text(languageCode, 16) ?? '',
        is_premium: Boolean(isPremium),
        is_bot: Boolean(isBot),
        metadata: sanitizeHistoryMetadata(metadata),
        last_seen_at: now,
        updated_at: now
      }, { onConflict: 'telegram_user_id' })
      .select('id');
    return firstId(result);
  }

  async getReceiptEmail({ telegramUserId }) {
    const result = await this.client
      .from('users')
      .select('receipt_email')
      .eq('telegram_user_id', telegramId(telegramUserId))
      .maybeSingle();
    const value = resultData(result)?.receipt_email;
    if (!value) return null;
    try {
      return receiptEmail(value);
    } catch {
      return null;
    }
  }

  async saveReceiptEmail({ telegramUserId, email }) {
    const result = await this.client
      .from('users')
      .update({ receipt_email: receiptEmail(email), updated_at: isoNow() })
      .eq('telegram_user_id', telegramId(telegramUserId))
      .select('receipt_email')
      .maybeSingle();
    return resultData(result)?.receipt_email ?? null;
  }

  async claimCrmUserNotifications({ limit = 20 } = {}) {
    const rows = resultData(await this.client.rpc('claim_crm_user_notifications', {
      p_limit: pageSize(limit, 20, 50)
    }));
    return Object.freeze((Array.isArray(rows) ? rows : []).map((row) => Object.freeze({
      id: uuid(row.id, 'CRM notification id'),
      telegramUserId: telegramId(row.telegram_user_id),
      kind: text(row.kind, 64),
      payload: row.payload && typeof row.payload === 'object'
        ? Object.freeze({ ...row.payload })
        : Object.freeze({}),
      attemptCount: integer(row.attempt_count, { positive: true })
    })));
  }

  async markCrmUserNotificationSent(notificationId) {
    return Boolean(resultData(await this.client.rpc('mark_crm_user_notification_sent', {
      p_id: uuid(notificationId, 'CRM notification id')
    })));
  }

  async markCrmUserNotificationFailed(notificationId, error) {
    return Boolean(resultData(await this.client.rpc('mark_crm_user_notification_failed', {
      p_id: uuid(notificationId, 'CRM notification id'),
      p_error: text(error, 1_000)
    })));
  }

  async updateUserAvatarReference({
    telegramUserId,
    fileId = null,
    fileUniqueId = null,
    storagePath = null
  }) {
    const now = isoNow();
    const result = await this.client
      .from('users')
      .update({
        avatar_file_id: text(fileId, 512),
        avatar_file_unique_id: text(fileUniqueId, 512),
        avatar_storage_path: text(storagePath, 1024),
        avatar_updated_at: now,
        updated_at: now
      })
      .eq('telegram_user_id', telegramId(telegramUserId))
      .select('id')
      .maybeSingle();
    const data = resultData(result);
    return Boolean(data?.id);
  }

  async recordEvent(event) {
    const result = await this.client.from('product_events').insert({
      event_name: text(event.eventName, 120),
      category: text(event.category, 80),
      telegram_user_id: event.telegramUserId ? telegramId(event.telegramUserId) : null,
      telegram_chat_id: event.telegramChatId ? String(event.telegramChatId) : null,
      telegram_update_id: event.telegramUpdateId ?? null,
      telegram_message_id: event.telegramMessageId ?? null,
      request_key: text(event.requestKey, 200),
      conversation_key: text(event.conversationKey, 200),
      subject_type: text(event.subjectType, 80),
      subject_id: text(event.subjectId, 160),
      metadata: sanitizeHistoryMetadata(event.metadata),
      occurred_at: event.occurredAt ?? isoNow()
    }).select('id');
    return firstId(result);
  }

  async recordTelegramUpdate(value) {
    const result = await this.client.from('telegram_updates').upsert({
      telegram_update_id: value.telegramUpdateId,
      telegram_user_id: value.telegramUserId ? telegramId(value.telegramUserId) : null,
      telegram_chat_id: value.telegramChatId ? String(value.telegramChatId) : null,
      telegram_message_id: value.telegramMessageId ?? null,
      update_type: text(value.updateType, 80),
      payload: sanitizeHistoryMetadata(value.payload),
      received_at: isoNow()
    }, { onConflict: 'telegram_update_id' }).select('id');
    return firstId(result);
  }

  async startTelegramApiCall(value) {
    const result = await this.client.from('telegram_api_calls').upsert({
      request_key: text(value.requestKey, 200),
      method: text(value.method, 100),
      telegram_user_id: value.telegramUserId ? telegramId(value.telegramUserId) : null,
      telegram_chat_id: value.telegramChatId ? String(value.telegramChatId) : null,
      telegram_message_id: value.telegramMessageId ?? null,
      request_payload: sanitizeHistoryMetadata(value.requestPayload),
      status: 'running',
      started_at: isoNow()
    }, { onConflict: 'request_key', ignoreDuplicates: true }).select('id');
    const id = firstId(result);
    if (id) return id;
    const existing = await this.client.from('telegram_api_calls')
      .select('id').eq('request_key', value.requestKey).maybeSingle();
    return resultData(existing)?.id ?? null;
  }

  async completeTelegramApiCall(value) {
    const result = await this.client.from('telegram_api_calls').update({
      status: value.status,
      http_status: value.httpStatus,
      response_payload: sanitizeHistoryMetadata(value.responsePayload),
      telegram_error_code: value.telegramErrorCode,
      error_message: text(value.errorMessage, 1_000),
      duration_ms: value.durationMs,
      finished_at: isoNow()
    }).eq('id', value.callId).select('id');
    return firstId(result);
  }

  async startProviderApiCall(value) {
    const result = await this.client.from('provider_api_calls').upsert({
      request_key: text(value.requestKey, 200),
      generation_id: value.generationId,
      telegram_user_id: value.telegramUserId ? telegramId(value.telegramUserId) : null,
      provider: text(value.provider, 80),
      operation: text(value.operation, 120),
      endpoint_host: text(value.endpointHost, 255),
      endpoint_path: text(value.endpointPath, 1_000),
      request_payload: sanitizeHistoryMetadata(value.requestPayload),
      status: 'running',
      started_at: isoNow()
    }, { onConflict: 'request_key', ignoreDuplicates: true }).select('id');
    const id = firstId(result);
    if (id) return id;
    const existing = await this.client.from('provider_api_calls')
      .select('id').eq('request_key', value.requestKey).maybeSingle();
    return resultData(existing)?.id ?? null;
  }

  async completeProviderApiCall(value) {
    const result = await this.client.from('provider_api_calls').update({
      status: value.status,
      http_status: value.httpStatus,
      provider_request_id: text(value.providerRequestId, 256),
      response_payload: sanitizeHistoryMetadata(value.responsePayload),
      error_code: text(value.errorCode, 80),
      error_message: text(value.errorMessage, 1_000),
      input_tokens: value.inputTokens,
      output_tokens: value.outputTokens,
      provider_cost_usd: value.providerCostUsd,
      duration_ms: value.durationMs,
      finished_at: isoNow()
    }).eq('id', value.callId).select('id');
    return firstId(result);
  }

  async ensureConversation(value) {
    const userId = await this.userId(value.telegramUserId);
    const days = integer(value.retentionDays ?? 30, { positive: true });
    const now = new Date();
    const expiresAt = days === 0
      ? null
      : new Date(now.valueOf() + days * 86_400_000).toISOString();
    const result = await this.client.from('conversations').upsert({
      user_id: userId,
      conversation_key: text(value.conversationKey, 200),
      kind: text(value.kind, 20),
      subject_id: text(value.subjectId, 100),
      title: text(value.title, 200) ?? 'новый диалог',
      status: 'active',
      retention_days: days,
      expires_at: expiresAt,
      latest_message_at: now.toISOString(),
      updated_at: now.toISOString()
    }, { onConflict: 'conversation_key' }).select('id');
    return firstId(result);
  }

  async listConversations({
    telegramUserId,
    limit = 20,
    offset = 0,
    cursor = null,
    status = 'active',
    kind = null
  }) {
    const userId = await this.userId(telegramUserId);
    const size = pageSize(limit, 20, 50);
    const pageOffset = integer(offset ?? 0, { positive: true });
    const normalizedStatus = text(status, 20);
    if (!['active', 'archived', 'all'].includes(normalizedStatus)) {
      throw new TypeError('Invalid conversation status filter.');
    }
    const normalizedKind = text(kind, 20);
    if (normalizedKind && !['model', 'agent', 'welcome', 'tool', 'voice'].includes(normalizedKind)) {
      throw new TypeError('Invalid conversation kind filter.');
    }
    const decoded = decodeCursor(cursor);
    let query = this.client.from('conversations')
      .select('id,kind,subject_id,title,status,latest_message_at,created_at,generations!inner(kind)')
      .eq('user_id', userId)
      .eq('kind', 'model')
      .eq('generations.kind', 'text')
      .is('deleted_at', null);
    if (normalizedStatus !== 'all') query = query.eq('status', normalizedStatus);
    if (normalizedKind) query = query.eq('kind', normalizedKind);
    if (decoded.at) {
      query = query.or(
        `latest_message_at.lt.${decoded.at},and(latest_message_at.eq.${decoded.at},id.lt.${decoded.id})`
      );
    }
    const rows = resultData(await query
      .order('latest_message_at', { ascending: false })
      .order('id', { ascending: false })
      .range(pageOffset, pageOffset + size)) ?? [];
    const hasMore = rows.length > size;
    const pageRows = rows.slice(0, size);
    const items = await Promise.all(pageRows.map(async (row) => {
      const countResult = await this.client.from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('conversation_id', row.id)
        .is('deleted_at', null);
      if (countResult.error) throw countResult.error;
      const recentResult = await this.client.from('messages')
        .select('content')
        .eq('user_id', userId)
        .eq('conversation_id', row.id)
        .is('deleted_at', null)
        .in('role', ['user', 'assistant'])
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
      const recent = resultData(recentResult);
      return conversationDto(row, {
        messageCount: Number(countResult.count ?? 0),
        lastMessagePreview: String(recent?.content ?? '').slice(0, 160)
      });
    }));
    return Object.freeze({
      items: Object.freeze(items),
      nextCursor: hasMore && pageRows.length ? encodeCursor(pageRows.at(-1)) : null,
      hasMore
    });
  }

  async getConversationThread({
    telegramUserId,
    conversationId,
    limit = 50,
    before = null
  }) {
    const userId = await this.userId(telegramUserId);
    const threadId = uuid(conversationId, 'conversation id');
    const size = pageSize(limit, 50, 100);
    const conversation = resultData(await this.client.from('conversations')
      .select('id,kind,subject_id,title,status,latest_message_at,created_at,generations!inner(kind)')
      .eq('user_id', userId)
      .eq('id', threadId)
      .eq('kind', 'model')
      .eq('generations.kind', 'text')
      .is('deleted_at', null)
      .maybeSingle());
    if (!conversation) return null;

    const decoded = decodeCursor(before);
    let query = this.client.from('messages')
      .select('id,role,content,status,metacoins_charged,created_at')
      .eq('user_id', userId)
      .eq('conversation_id', threadId)
      .is('deleted_at', null);
    if (decoded.at) {
      query = query.or(
        `created_at.lt.${decoded.at},and(created_at.eq.${decoded.at},id.lt.${decoded.id})`
      );
    }
    const rows = resultData(await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(size + 1)) ?? [];
    const hasMore = rows.length > size;
    const descendingRows = rows.slice(0, size);
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
    const userId = await this.userId(telegramUserId);
    const threadId = uuid(conversationId, 'conversation id');
    const row = resultData(await this.client.from('conversations')
      .update({ status: 'archived', updated_at: isoNow() })
      .eq('user_id', userId)
      .eq('id', threadId)
      .is('deleted_at', null)
      .select('id,status,kind,subject_id')
      .maybeSingle());
    if (!row) return null;
    return Object.freeze({
      conversationId: String(row.id),
      status: String(row.status),
      kind: String(row.kind),
      subjectId: String(row.subject_id)
    });
  }

  async activateConversation({ telegramUserId, conversationId }) {
    const userId = await this.userId(telegramUserId);
    const threadId = uuid(conversationId, 'conversation id');
    const row = resultData(await this.client.from('conversations')
      .update({ status: 'active', updated_at: isoNow() })
      .eq('user_id', userId)
      .eq('id', threadId)
      .is('deleted_at', null)
      .select('id,conversation_key,kind,subject_id,title,status')
      .maybeSingle());
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

  async appendMessage(value) {
    const userId = await this.userId(value.telegramUserId);
    const result = await this.client.from('messages').insert({
      conversation_id: value.conversationId,
      user_id: userId,
      role: value.role,
      content: text(value.content, 200_000),
      telegram_message_id: value.telegramMessageId ?? null,
      status: value.status ?? 'completed',
      metadata: sanitizeHistoryMetadata(value.metadata)
    }).select('id');
    return firstId(result);
  }

  async startGeneration(value) {
    const userId = await this.userId(value.telegramUserId);
    const result = await this.client.from('generations').upsert({
      user_id: userId,
      conversation_id: value.conversationId,
      request_key: text(value.requestKey, 200),
      kind: text(value.kind, 30),
      subject_type: generationSubjectType(value.subjectType),
      subject_id: text(value.subjectId, 100),
      prompt: text(value.prompt, 200_000) ?? '',
      parameters: sanitizeHistoryMetadata(value.parameters),
      status: 'running',
      metacoins_quoted: integer(value.metacoinsQuoted ?? 0, { positive: true }),
      started_at: isoNow()
    }, { onConflict: 'request_key', ignoreDuplicates: true }).select('id');
    const id = firstId(result);
    if (id) return id;
    const existing = await this.client.from('generations')
      .select('id').eq('request_key', value.requestKey).maybeSingle();
    return resultData(existing)?.id ?? null;
  }

  async completeGeneration(value) {
    const result = await this.client.from('generations').update({
      status: 'completed',
      output_text: text(value.outputText, 200_000),
      metacoins_charged: integer(value.metacoinsCharged ?? 0, { positive: true }),
      provider: text(value.provider, 80),
      provider_model_id: text(value.providerModelId, 160),
      metadata: sanitizeHistoryMetadata(value.metadata),
      finished_at: isoNow(),
      updated_at: isoNow()
    }).eq('id', value.generationId).select('id');
    return firstId(result);
  }

  async failGeneration(value) {
    const result = await this.client.from('generations').update({
      status: 'failed',
      error_code: text(value.errorCode, 80),
      error_message: text(value.errorMessage, 1_000),
      finished_at: isoNow(),
      updated_at: isoNow()
    }).eq('id', value.generationId).select('id');
    return firstId(result);
  }

  async recordMetacoinTransaction(value) {
    const userId = await this.userId(value.telegramUserId);
    const row = {
      user_id: userId,
      idempotency_key: text(value.idempotencyKey, 200),
      delta: integer(value.delta, { nonZero: true }),
      balance_after: integer(value.balanceAfter, { positive: true }),
      source: value.source,
      reference_type: text(value.referenceType, 80),
      reference_id: text(value.referenceId, 200),
      description: text(value.description, 500),
      metadata: sanitizeHistoryMetadata(value.metadata)
    };
    const inserted = await this.client.from('metacoin_ledger')
      .upsert(row, { onConflict: 'idempotency_key', ignoreDuplicates: true })
      .select('id');
    const id = firstId(inserted);
    if (id) return id;
    const existing = resultData(await this.client.from('metacoin_ledger')
      .select('id,user_id,delta,balance_after,source')
      .eq('idempotency_key', row.idempotency_key)
      .maybeSingle());
    if (!existing
      || existing.user_id !== row.user_id
      || existing.delta !== row.delta
      || existing.balance_after !== row.balance_after
      || existing.source !== row.source) {
      throw new Error('Metacoin idempotency payload conflicts.');
    }
    return existing.id;
  }

  async recordPaymentCreated(value) {
    const userId = await this.userId(value.telegramUserId);
    const now = isoNow();
    const receiptStatus = receiptRegistration(value.providerPayload?.receipt_registration);
    const provider = paymentProvider(value.provider);
    const row = {
      user_id: userId,
      payment_id: text(value.paymentId, 128),
      provider,
      product_type: value.productType,
      product_id: text(value.productId, 80),
      amount_kopecks: integer(value.amountKopecks, { positive: true }),
      currency: 'RUB',
      payment_method: paymentMethodFromProvider(value.providerPayload, provider),
      status: 'pending',
      base_metacoins: integer(value.baseMetacoins ?? 0, { positive: true }),
      receipt_email: value.receiptEmail ? receiptEmail(value.receiptEmail) : null,
      receipt_phone: value.receiptPhone ? receiptPhone(value.receiptPhone) : null,
      receipt_registration: receiptStatus,
      receipt_sent_at: receiptStatus === 'succeeded' ? now : null,
      provider_payload: sanitizeHistoryMetadata(value.providerPayload),
      updated_at: now
    };
    const inserted = await this.client.from('payments').upsert(
      row,
      { onConflict: 'payment_id', ignoreDuplicates: true }
    ).select('id');
    const id = firstId(inserted);
    if (id) return id;
    const existing = resultData(await this.client.from('payments')
      .select('id,user_id,payment_id,provider,product_type,product_id,amount_kopecks,base_metacoins,receipt_email,receipt_phone')
      .eq('payment_id', row.payment_id)
      .maybeSingle());
    const matches = existing
      && existing.user_id === row.user_id
      && existing.payment_id === row.payment_id
      && existing.provider === row.provider
      && existing.product_type === row.product_type
      && existing.product_id === row.product_id
      && Number(existing.amount_kopecks) === row.amount_kopecks
      && Number(existing.base_metacoins) === row.base_metacoins
      && (existing.receipt_email ?? null) === row.receipt_email
      && (existing.receipt_phone ?? null) === row.receipt_phone;
    if (!matches) throw new Error('Payment idempotency payload conflicts.');
    return existing.id;
  }

  async recordCryptoUsdcCheckout(value) {
    const snapshot = sanitizeHistoryMetadata(value.snapshot);
    const product = snapshot.product;
    const allocation = snapshot.allocation;
    if (!product || !allocation) throw new TypeError('Crypto USDC snapshot is invalid.');
    const userId = await this.userId(value.telegramUserId);
    const row = {
      order_id: text(value.orderId, 128),
      user_id: userId,
      telegram_chat_id: telegramId(value.telegramChatId),
      product_kind: text(product.kind, 20),
      product_code: text(product.productId, 80),
      product_name: text(product.productName, 200),
      duration_months: integer(product.durationMonths, { positive: true }),
      metacoins: integer(product.metacoins, { positive: true }),
      amount_usdc_micros: integer(value.amountUsdcMicros, { positive: true }),
      currency: 'USDC',
      chain: 'base',
      payment_method: 'crypto_usdc',
      immutable_snapshot: snapshot,
      status: 'pending',
      updated_at: isoNow()
    };
    const inserted = await this.client.from('crypto_usdc_payments').upsert(
      row,
      { onConflict: 'order_id', ignoreDuplicates: true }
    ).select('id');
    const id = firstId(inserted);
    if (id) return id;
    const existing = resultData(await this.client.from('crypto_usdc_payments')
      .select('id,user_id,telegram_chat_id,product_kind,product_code,duration_months,metacoins,amount_usdc_micros,currency,chain,immutable_snapshot')
      .eq('order_id', row.order_id)
      .maybeSingle());
    const matches = existing
      && existing.user_id === row.user_id
      && String(existing.telegram_chat_id) === String(row.telegram_chat_id)
      && existing.product_kind === row.product_kind
      && existing.product_code === row.product_code
      && Number(existing.duration_months) === row.duration_months
      && Number(existing.metacoins) === row.metacoins
      && Number(existing.amount_usdc_micros) === row.amount_usdc_micros
      && existing.currency === 'USDC'
      && existing.chain === 'base'
      && JSON.stringify(existing.immutable_snapshot) === JSON.stringify(snapshot);
    if (!matches) throw new Error('Crypto USDC checkout idempotency payload conflicts.');
    return existing.id;
  }

  async recordCryptoUsdcCallback(value) {
    const rows = resultData(await this.client.rpc('record_crypto_usdc_callback', {
      p_callback_id: text(value.callbackId, 220),
      p_order_id: text(value.orderId, 128),
      p_external_payment_id: text(value.paymentId, 128),
      p_transaction_hash: text(value.transactionHash, 66),
      p_amount_usdc_micros: integer(value.amountUsdcMicros, { positive: true }),
      p_currency: 'USDC',
      p_chain: 'base',
      p_chain_status: 'confirmed',
      p_confirmed_at: isoTimestamp(value.confirmedAt),
      p_payload: sanitizeHistoryMetadata(value)
    }));
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) throw new Error('Supabase did not record the Crypto USDC callback.');
    return Object.freeze({
      status: text(row.status, 32),
      duplicate: Boolean(row.duplicate),
      financeRequestCreated: Boolean(row.finance_request_created),
      telegramUserId: telegramId(row.telegram_user_id),
      telegramChatId: telegramId(row.telegram_chat_id),
      productKind: text(row.product_kind, 20),
      productId: text(row.product_id, 80),
      durationMonths: integer(row.duration_months, { positive: true }),
      durationDays: integer(row.duration_days, { positive: true }),
      metacoins: integer(row.metacoins, { positive: true }),
      confirmedAt: isoTimestamp(row.confirmed_at)
    });
  }

  async completeCryptoUsdcFulfillment(value) {
    const rows = resultData(await this.client.rpc('complete_crypto_usdc_fulfillment', {
      p_order_id: text(value.orderId, 128),
      p_entitlement_status: text(value.entitlementStatus, 20),
      p_fulfilled_at: isoTimestamp(value.fulfilledAt)
    }));
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) throw new Error('Supabase did not complete the Crypto USDC fulfillment.');
    return Object.freeze({ status: text(row.status, 32), duplicate: Boolean(row.duplicate) });
  }

  async claimCryptoUsdcFundingRequests({ limit = 8, leaseSeconds = 300 } = {}) {
    const rows = resultData(await this.client.rpc('claim_crypto_usdc_funding_requests', {
      p_limit: integer(limit, { positive: true }),
      p_lease_seconds: integer(leaseSeconds, { positive: true })
    })) ?? [];
    return Object.freeze(rows.map((row) => Object.freeze({
      id: uuid(row.id, 'crypto funding id'),
      claimToken: uuid(row.claim_token, 'crypto funding claim token'),
      requestKey: text(row.request_key, 255), orderId: text(row.order_id, 128),
      sourceTransactionHash: text(row.source_transaction_hash, 66),
      amountUsdcMicros: integer(row.amount_usdc_micros, { positive: true }),
      openrouterCreditMicrousd: integer(row.openrouter_credit_microusd, { positive: true }),
      openrouterUsdcMicros: integer(row.openrouter_usdc_micros, { positive: true }),
      gasReserveUsdcMicros: integer(row.gas_reserve_usdc_micros, { positive: true }),
      ownerUsdcMicros: integer(row.owner_usdc_micros, { positive: true }),
      currency: text(row.currency, 8), chain: text(row.chain, 16)
    })));
  }

  async markCryptoUsdcFundingStarted(value) {
    return Boolean(resultData(await this.client.rpc('mark_crypto_usdc_funding_started', {
      p_id: uuid(value.id, 'crypto funding id'),
      p_claim_token: uuid(value.claimToken, 'crypto funding claim token'),
      p_metadata: sanitizeHistoryMetadata(value.metadata)
    })));
  }

  async markCryptoUsdcFundingCompleted(value) {
    return Boolean(resultData(await this.client.rpc('mark_crypto_usdc_funding_completed', {
      p_id: uuid(value.id, 'crypto funding id'),
      p_claim_token: uuid(value.claimToken, 'crypto funding claim token'),
      p_openrouter_external_id: text(value.openrouterExternalId, 180),
      p_openrouter_funded_usdc_micros: integer(value.openrouterFundedUsdcMicros, { positive: true }),
      p_owner_transaction_hash: text(value.ownerTransactionHash, 66),
      p_owner_paid_usdc_micros: integer(value.ownerPaidUsdcMicros, { positive: true }),
      p_metadata: sanitizeHistoryMetadata(value.metadata)
    })));
  }

  async markCryptoUsdcFundingManual(value) {
    return Boolean(resultData(await this.client.rpc('mark_crypto_usdc_funding_manual', {
      p_id: uuid(value.id, 'crypto funding id'),
      p_claim_token: uuid(value.claimToken, 'crypto funding claim token'),
      p_error_code: text(value.errorCode, 80),
      p_metadata: sanitizeHistoryMetadata(value.metadata)
    })));
  }

  async recordStarsPayment(value) {
    const amount = integer(value.amountXtr, { positive: true });
    if (amount <= 0) throw new TypeError('Invalid Telegram Stars amount.');
    const baseMetacoins = integer(value.baseMetacoins ?? 0, { positive: true });
    const productType = text(value.productType, 32);
    if (!['metacoins', 'subscription'].includes(productType)) {
      throw new TypeError('Invalid payment product type.');
    }
    const rows = resultData(await this.client.rpc('record_telegram_stars_payment', {
      p_telegram_user_id: telegramId(value.telegramUserId),
      p_charge_id: text(value.paymentId, 128),
      p_product_type: productType,
      p_product_id: text(value.productId, 80),
      p_amount_xtr: amount,
      p_base_metacoins: baseMetacoins,
      p_paid_at: isoTimestamp(value.paidAt ?? Date.now()),
      p_provider_payload: sanitizeHistoryMetadata(value.providerPayload)
    }));
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row?.payment_id) throw new Error('Supabase did not record the Stars payment.');
    return String(row.payment_id);
  }

  async listPendingStarsPayments({ limit = 25 } = {}) {
    const rows = resultData(await this.client.rpc('list_pending_telegram_stars_fulfillments', {
      p_limit: pageSize(limit, 25, 100)
    }));
    return (Array.isArray(rows) ? rows : []).map((row) => Object.freeze({
      paymentId: String(row.payment_id),
      telegramUserId: String(row.telegram_user_id),
      providerPayload: Object.freeze({ ...sanitizeHistoryMetadata(row.provider_payload) })
    }));
  }

  async recordStarsSubscriptionActivated(value) {
    const rows = resultData(await this.client.rpc('record_stars_subscription_activation', {
      p_telegram_user_id: telegramId(value.telegramUserId),
      p_payment_id: text(value.paymentId, 128),
      p_plan_id: text(value.planId, 80),
      p_starts_at: isoTimestamp(value.startsAt),
      p_expires_at: isoTimestamp(value.expiresAt),
      p_price_xtr: integer(value.priceXtr, { positive: true }),
      p_metacoins: integer(value.metacoins, { positive: true }),
      p_balance_after: integer(value.balanceAfter, { positive: true })
    }));
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) throw new Error('Supabase did not record the Stars subscription activation.');
    return Object.freeze({
      subscriptionId: uuid(row.subscription_id, 'subscription id'),
      ledgerId: uuid(row.ledger_id, 'subscription ledger id'),
      duplicate: Boolean(row.duplicate),
      startsAt: isoTimestamp(row.starts_at),
      expiresAt: isoTimestamp(row.expires_at)
    });
  }

  async recordPaymentFulfilled(value) {
    const rows = resultData(await this.client.rpc('record_metacoin_purchase', {
      p_telegram_user_id: telegramId(value.telegramUserId),
      p_payment_id: text(value.paymentId, 128),
      p_metacoins: integer(value.metacoins, { positive: true }),
      p_bonus_metacoins: integer(value.bonusMetacoins ?? 0, { positive: true }),
      p_balance_after: integer(value.balanceAfter, { positive: true })
    }));
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) throw new Error('Supabase did not record the metacoin purchase.');
    return Object.freeze({
      ledgerId: uuid(row.ledger_id, 'package ledger id'),
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
    occurredAt = isoNow()
  }) {
    const paymentIdentifier = text(externalPaymentId, 128);
    if (!paymentIdentifier) throw new TypeError('Finance payment id is required.');
    if (!Array.isArray(allocations) || allocations.length === 0) {
      throw new TypeError('Finance allocations are required.');
    }
    const userId = await this.userId(telegramUserId);
    const allowedCategories = new Set([
      'gross', 'payment_fee', 'api_reserve', 'referral_liability', 'owner_share', 'refund'
    ]);
    const allowedStatuses = new Set(['estimated', 'reserved', 'actual', 'reversed']);
    const occurred = isoTimestamp(occurredAt);
    const rows = allocations.map((allocation) => {
      const allocationKey = text(allocation?.allocationKey, 180);
      const category = text(allocation?.category, 64);
      const amount = integer(allocation?.amountKopecks, { positive: true });
      const currency = text(allocation?.currency ?? 'RUB', 3)?.toUpperCase() ?? 'RUB';
      const status = text(allocation?.status, 32);
      if (!allocationKey || !allowedCategories.has(category) || amount <= 0
        || !/^[A-Z]{3}$/.test(currency) || !allowedStatuses.has(status)) {
        throw new TypeError('Finance allocation is invalid.');
      }
      return {
        allocation_key: allocationKey,
        external_payment_id: paymentIdentifier,
        user_id: userId,
        category,
        provider: text(allocation?.provider, 64),
        amount_kopecks: amount,
        currency,
        status,
        source: text(allocation?.source, 64) ?? 'payment_webhook',
        metadata: sanitizeHistoryMetadata({
          ...metadata,
          provider: allocation?.provider ?? metadata.provider
        }),
        occurred_at: occurred,
        updated_at: isoNow()
      };
    });
    const inserted = await this.client.from('finance_allocations').upsert(
      rows,
      { onConflict: 'allocation_key', ignoreDuplicates: true }
    ).select('id');
    resultData(inserted);
    const reserveCarryInKopecks = integer(metadata?.reserveCarryInKopecks ?? 0, { positive: true });
    if (reserveCarryInKopecks > 0) {
      const carryRows = resultData(await this.client.rpc('reclassify_upgrade_provider_reserve', {
        p_target_payment_id: paymentIdentifier,
        p_amount_kopecks: reserveCarryInKopecks
      }));
      const carry = Array.isArray(carryRows) ? carryRows[0] : carryRows;
      if (!carry || Number(carry.reserve_carry_in_kopecks) !== reserveCarryInKopecks) {
        throw new Error('Supabase did not record the upgrade reserve carry.');
      }
    }
    // Provider top-ups are deliberately not inserted here. The only writer
    // for an automatic top-up is record_yookassa_payment_confirmation(),
    // which verifies payment.succeeded and creates the queue in one DB
    // transaction. This prevents a retry or a non-YooKassa payment from
    // reaching the external funding worker before the payment is confirmed.
    return rows.length;
  }

  async claimProviderTopupRequests({
    provider = 'polza',
    limit = 10,
    leaseSeconds = 300,
    maxAttempts = 5
  } = {}) {
    const normalizedProvider = text(provider, 64)?.toLowerCase();
    const requestLimit = pageSize(limit, 10, 50);
    const lease = integer(leaseSeconds, { positive: true });
    const attempts = integer(maxAttempts, { positive: true });
    if (!normalizedProvider || !/^[a-z][a-z0-9_-]{1,63}$/.test(normalizedProvider)
      || lease < 30 || lease > 3_600 || attempts < 1 || attempts > 10) {
      throw new TypeError('Invalid provider topup claim options.');
    }
    const rows = resultData(await this.client.rpc('claim_provider_topup_requests', {
      p_provider: normalizedProvider,
      p_limit: requestLimit,
      p_lease_seconds: lease,
      p_max_attempts: attempts
    }));
    return Object.freeze((Array.isArray(rows) ? rows : []).map(providerTopupDto));
  }

  async getProviderTopupRequest({ allocationKey, paymentId, provider }) {
    const key = text(allocationKey, 220);
    const paymentIdentifier = text(paymentId, 128);
    const normalizedProvider = text(provider, 64)?.toLowerCase();
    if (!key || !paymentIdentifier || !normalizedProvider) {
      throw new TypeError('Provider topup identity is required.');
    }
    const row = resultData(await this.client.rpc('get_provider_topup_request', {
      p_allocation_key: key,
      p_payment_id: paymentIdentifier,
      p_provider: normalizedProvider
    }));
    return providerTopupDto(Array.isArray(row) ? row[0] : row);
  }

  async markProviderTopupChargeStarted({
    id,
    claimToken,
    idempotencyKey,
    metadata = {}
  }) {
    const key = text(idempotencyKey, 255);
    if (!key || !/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,254}$/.test(key)) {
      throw new TypeError('Invalid provider topup idempotency key.');
    }
    return Boolean(resultData(await this.client.rpc('mark_provider_topup_charge_started', {
      p_id: uuid(id, 'provider topup id'),
      p_claim_token: uuid(claimToken, 'provider topup claim token'),
      p_idempotency_key: key,
      p_metadata: sanitizeHistoryMetadata(metadata)
    })));
  }

  async markProviderTopupSucceeded({
    id,
    claimToken,
    externalId,
    observedTransactionId,
    observedAmountKopecks,
    observedBalanceKopecks,
    metadata = {}
  }) {
    const observedAmount = integer(observedAmountKopecks, { positive: true });
    if (observedAmount <= 0) throw new TypeError('Observed provider transaction amount is invalid.');
    const observedBalance = integer(observedBalanceKopecks, { positive: true });
    const transactionId = text(observedTransactionId, 255);
    if (!transactionId) throw new TypeError('Observed provider transaction id is required.');
    return Boolean(resultData(await this.client.rpc('complete_provider_topup_request', {
      p_id: uuid(id, 'provider topup id'),
      p_claim_token: uuid(claimToken, 'provider topup claim token'),
      p_external_id: text(externalId, 255) ?? transactionId,
      p_observed_transaction_id: transactionId,
      p_observed_amount_kopecks: observedAmount,
      p_observed_balance_kopecks: observedBalance,
      p_metadata: sanitizeHistoryMetadata(metadata)
    })));
  }

  async markProviderTopupFailed({
    id,
    claimToken,
    errorCode,
    retryable = false,
    maxAttempts = 5,
    metadata = {}
  }) {
    const code = text(errorCode, 64)?.toLowerCase();
    const attempts = integer(maxAttempts, { positive: true });
    if (!code || !/^[a-z][a-z0-9_-]{1,63}$/.test(code) || attempts > 10) {
      throw new TypeError('Invalid provider topup failure.');
    }
    return Boolean(resultData(await this.client.rpc('fail_provider_topup_request', {
      p_id: uuid(id, 'provider topup id'),
      p_claim_token: uuid(claimToken, 'provider topup claim token'),
      p_error_code: code,
      p_retryable: retryable === true,
      p_max_attempts: attempts,
      p_metadata: sanitizeHistoryMetadata(metadata)
    })));
  }

  async recordYooKassaPaymentConfirmation({
    externalEventId,
    paymentId,
    amountKopecks,
    currency = 'RUB',
    event = 'payment.succeeded',
    status = 'succeeded',
    confirmedAt = isoNow(),
    metadata = {}
  }) {
    const eventId = text(externalEventId, 220);
    const paymentIdentifier = text(paymentId, 128);
    const amount = integer(amountKopecks, { positive: true });
    const normalizedCurrency = text(currency, 3)?.toUpperCase();
    const normalizedEvent = text(event, 64);
    const normalizedStatus = text(status, 32);
    if (!eventId || !paymentIdentifier || !/^[A-Z]{3}$/.test(normalizedCurrency)
      || normalizedEvent !== 'payment.succeeded' || normalizedStatus !== 'succeeded') {
      throw new TypeError('Invalid YooKassa payment confirmation.');
    }
    const rows = resultData(await this.client.rpc('record_yookassa_payment_confirmation', {
      p_external_event_id: eventId,
      p_payment_id: paymentIdentifier,
      p_amount_kopecks: amount,
      p_currency: normalizedCurrency,
      p_event: normalizedEvent,
      p_confirmed_at: isoTimestamp(confirmedAt),
      p_metadata: sanitizeHistoryMetadata(metadata)
    }));
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row?.confirmation_id || !row?.payment_id || row.status !== 'succeeded') {
      throw new Error('Supabase did not record the YooKassa confirmation.');
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

  async recordTBankPaymentConfirmation({
    externalEventId,
    paymentId,
    amountKopecks,
    currency = 'RUB',
    event = 'CONFIRMED',
    status = 'succeeded',
    confirmedAt = isoNow(),
    metadata = {}
  }) {
    const eventId = text(externalEventId, 220);
    const paymentIdentifier = text(paymentId, 128);
    const amount = integer(amountKopecks, { positive: true });
    const normalizedCurrency = text(currency, 3)?.toUpperCase();
    const normalizedEvent = text(event, 64);
    const normalizedStatus = text(status, 32);
    if (!eventId || !paymentIdentifier || !/^[A-Z]{3}$/.test(normalizedCurrency)
      || normalizedEvent !== 'CONFIRMED' || normalizedStatus !== 'succeeded') {
      throw new TypeError('Invalid T-Bank payment confirmation.');
    }
    const rows = resultData(await this.client.rpc('record_tbank_payment_confirmation', {
      p_external_event_id: eventId,
      p_payment_id: paymentIdentifier,
      p_amount_kopecks: amount,
      p_currency: normalizedCurrency,
      p_event: normalizedEvent,
      p_confirmed_at: isoTimestamp(confirmedAt),
      p_metadata: sanitizeHistoryMetadata(metadata)
    }));
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row?.confirmation_id || !row?.payment_id || row.status !== 'succeeded') {
      throw new Error('Supabase did not record the T-Bank confirmation.');
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

  async recordWalletEntries({ entries }) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new TypeError('Wallet entries are required.');
    }
    const userIds = new Map();
    const rows = [];
    for (const entry of entries) {
      let userId = null;
      if (entry.telegramUserId !== null && entry.telegramUserId !== undefined) {
        const telegramUserId = telegramId(entry.telegramUserId);
        userId = userIds.get(telegramUserId) ?? await this.userId(telegramUserId);
        userIds.set(telegramUserId, userId);
      }
      rows.push({
        entry_key: text(entry.entryKey, 220),
        external_payment_id: text(entry.externalPaymentId, 128),
        allocation_key: text(entry.allocationKey, 180),
        user_id: userId,
        account: text(entry.account, 64),
        category: text(entry.category, 64),
        provider: text(entry.provider, 64),
        direction: text(entry.direction, 16),
        amount_kopecks: integer(entry.amountKopecks, { positive: true }),
        currency: text(entry.currency, 3)?.toUpperCase() ?? 'RUB',
        status: 'posted',
        source: text(entry.source, 64) ?? 'payment_webhook',
        metadata: sanitizeHistoryMetadata(entry.metadata ?? {}),
        occurred_at: entry.occurredAt ? isoTimestamp(entry.occurredAt) : isoNow(),
        updated_at: isoNow()
      });
    }
    const result = await this.client.from('finance_wallet_ledger').upsert(
      rows,
      { onConflict: 'entry_key', ignoreDuplicates: true }
    ).select('id');
    const data = resultData(result);
    return Array.isArray(data) ? data.length : 0;
  }

  async getPaymentRecord(paymentId) {
    const payment = resultData(await this.client.from('payments')
      .select('payment_id,user_id,product_type,product_id,amount_kopecks,amount_xtr,currency,base_metacoins,status,receipt_email')
      .eq('payment_id', text(paymentId, 128))
      .maybeSingle());
    if (!payment) return null;
    const user = resultData(await this.client.from('users')
      .select('telegram_user_id')
      .eq('id', payment.user_id)
      .maybeSingle());
    if (!user) throw new Error('Payment user is missing.');
    return Object.freeze({
      paymentId: payment.payment_id,
      telegramUserId: String(user.telegram_user_id),
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

  async getPaymentCheckoutRecord(paymentId) {
    const payment = resultData(await this.client.from('payments')
      .select('payment_id,user_id,provider,provider_payload,product_type,product_id,amount_kopecks,base_metacoins,status,receipt_email,receipt_phone')
      .eq('payment_id', text(paymentId, 128))
      .maybeSingle());
    if (!payment) return null;
    const user = resultData(await this.client.from('users')
      .select('telegram_user_id')
      .eq('id', payment.user_id)
      .maybeSingle());
    if (!user) throw new Error('Payment user is missing.');
    return Object.freeze({
      paymentId: payment.payment_id,
      provider: payment.provider,
      providerPayload: sanitizeHistoryMetadata(payment.provider_payload),
      telegramUserId: String(user.telegram_user_id),
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
    const status = value.status;
    if (!['pending', 'succeeded', 'cancelled', 'refunded', 'partially_refunded'].includes(status)) {
      throw new TypeError('Invalid payment status.');
    }
    const providerPayload = sanitizeHistoryMetadata(value.providerPayload);
    const provider = paymentProvider(value.provider);
    const receiptStatus = receiptRegistration(providerPayload.receipt_registration);
    const customerEmail = receiptEmailFromProvider(providerPayload);
    const result = await this.client.from('payments').update({
      status,
      ...(customerEmail ? { receipt_email: customerEmail } : {}),
      receipt_registration: receiptStatus,
      ...(receiptStatus === 'succeeded'
        ? { receipt_sent_at: new Date(value.paidAt ?? Date.now()).toISOString() }
        : {}),
      ...(paymentMethodFromProvider(providerPayload, provider) !== 'unknown'
        ? { payment_method: paymentMethodFromProvider(providerPayload, provider) }
        : {}),
      provider_payload: providerPayload,
      paid_at: status === 'succeeded' ? new Date(value.paidAt ?? Date.now()).toISOString() : null,
      updated_at: isoNow()
    }).eq('payment_id', text(value.paymentId, 128)).select('id');
    return firstId(result);
  }

  async recordSubscriptionActivated(value) {
    const upgrade = value.subscriptionMetacoinsTotal !== undefined;
    if (upgrade) {
      const existing = resultData(await this.client.from('subscription_upgrade_audit')
        .select('activated_subscription_id,ledger_id')
        .eq('payment_id', text(value.paymentId, 128))
        .maybeSingle());
      if (existing) {
        return Object.freeze({
          subscriptionId: uuid(existing.activated_subscription_id, 'subscription id'),
          ledgerId: uuid(existing.ledger_id, 'subscription ledger id'),
          duplicate: true,
          startsAt: isoTimestamp(value.startsAt),
          expiresAt: isoTimestamp(value.expiresAt)
        });
      }
      const userId = await this.userId(value.telegramUserId);
      const current = resultData(await this.client.from('subscriptions')
        .select('id,updated_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('plan_id', text(value.fromPlanId, 80))
        .maybeSingle());
      if (!current) throw new Error('Supabase active subscription is missing for upgrade.');
      const occurredAt = isoTimestamp(value.startsAt);
      const rows = resultData(await this.client.rpc('activate_subscription_upgrade', {
        p_telegram_user_id: telegramId(value.telegramUserId),
        p_payment_id: text(value.paymentId, 128),
        p_expected_subscription_id: uuid(current.id, 'subscription id'),
        p_expected_subscription_updated_at: isoTimestamp(current.updated_at),
        p_from_plan_id: text(value.fromPlanId, 80),
        p_to_plan_id: text(value.planId, 80),
        p_duration_months: integer(value.durationMonths),
        p_starts_at: isoTimestamp(value.startsAt),
        p_expires_at: isoTimestamp(value.expiresAt),
        p_before_subscription_total: integer(value.subscriptionMetacoinsTotalBefore, { positive: true }),
        p_before_subscription_remaining: integer(value.remainingPlanMetacoinsBefore, { positive: true }),
        p_target_subscription_total: integer(value.subscriptionMetacoinsTotal, { positive: true }),
        p_credited_delta: integer(value.metacoins, { positive: true }),
        p_after_subscription_total: integer(value.subscriptionMetacoinsTotal, { positive: true }),
        p_after_subscription_remaining: integer(value.subscriptionMetacoinsTotal, { positive: true }),
        p_before_general_balance: integer(value.balanceBefore, { positive: true }),
        p_after_general_balance: integer(value.balanceAfter, { positive: true }),
        p_payment_amount_kopecks: integer(value.priceKopecks, { positive: true }),
        p_occurred_at: occurredAt
      }));
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row) throw new Error('Supabase did not record the subscription upgrade.');
      return Object.freeze({
        subscriptionId: uuid(row.subscription_id, 'subscription id'),
        ledgerId: uuid(row.ledger_id, 'subscription ledger id'),
        duplicate: Boolean(row.duplicate),
        startsAt: isoTimestamp(value.startsAt),
        expiresAt: isoTimestamp(value.expiresAt)
      });
    }
    const rows = resultData(await this.client.rpc('record_subscription_activation', {
      p_telegram_user_id: telegramId(value.telegramUserId),
      p_payment_id: text(value.paymentId, 128),
      p_plan_id: text(value.planId, 80),
      p_starts_at: isoTimestamp(value.startsAt),
      p_expires_at: isoTimestamp(value.expiresAt),
      p_price_kopecks: integer(value.priceKopecks, { positive: true }),
      p_metacoins: integer(value.metacoins, { positive: true }),
      p_balance_after: integer(value.balanceAfter, { positive: true })
    }));
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) throw new Error('Supabase did not record the subscription activation.');
    return Object.freeze({
      subscriptionId: uuid(row.subscription_id, 'subscription id'),
      ledgerId: uuid(row.ledger_id, 'subscription ledger id'),
      duplicate: Boolean(row.duplicate),
      startsAt: isoTimestamp(row.starts_at),
      expiresAt: isoTimestamp(row.expires_at)
    });
  }

  async recordPaymentWebhook(value) {
    const provider = paymentProvider(value.provider);
    const result = await this.client.from('provider_webhooks').upsert({
      provider,
      provider_event_id: text(value.providerEventId, 256),
      event_type: text(value.eventType, 120),
      signature_valid: value.signatureValid === undefined ? null : value.signatureValid === true,
      payload: sanitizeHistoryMetadata(value.payload),
      processing_status: 'received',
      processed_at: null
    }, { onConflict: 'provider,provider_event_id', ignoreDuplicates: true }).select('id');
    return firstId(result);
  }

  async claimPaymentWebhook(value) {
    const provider = paymentProvider(value.provider);
    const rows = resultData(await this.client.rpc('claim_provider_webhook', {
      p_provider: provider,
      p_provider_event_id: text(value.providerEventId, 256),
      p_event_type: text(value.eventType, 120),
      p_signature_valid: value.signatureValid === undefined ? null : value.signatureValid === true,
      p_payload: sanitizeHistoryMetadata(value.payload),
      p_lease_seconds: integer(value.leaseSeconds ?? 300, { positive: true })
    }));
    const row = Array.isArray(rows) ? rows[0] : rows;
    return Object.freeze({
      claimed: row?.claimed === true,
      status: row?.processing_status ?? null
    });
  }

  async getPaymentWebhookStatus(providerEventId, sourceProvider = 'yookassa') {
    const provider = paymentProvider(sourceProvider);
    const result = resultData(await this.client.from('provider_webhooks')
      .select('processing_status')
      .eq('provider', provider)
      .eq('provider_event_id', text(providerEventId, 256))
      .maybeSingle());
    return result?.processing_status ?? null;
  }

  async updatePaymentWebhookStatus(value) {
    if (!['processed', 'failed', 'ignored'].includes(value.status)) {
      throw new TypeError('Invalid webhook processing status.');
    }
    const provider = paymentProvider(value.provider);
    const result = await this.client.from('provider_webhooks').update({
      processing_status: value.status,
      error_message: text(value.errorMessage, 1_000),
      processed_at: isoNow()
    })
      .eq('provider', provider)
      .eq('provider_event_id', text(value.providerEventId, 256))
      .select('id');
    return firstId(result);
  }

  async schedulePaymentAbandonmentReminders(value) {
    resultData(await this.client.rpc('schedule_payment_abandonment_reminders', {
      p_payment_id: text(value.paymentId, 128),
      p_telegram_user_id: telegramId(value.telegramUserId),
      p_telegram_chat_id: telegramId(value.telegramChatId),
      p_first_due_at: isoTimestamp(value.firstDueAt),
      p_second_due_at: isoTimestamp(value.secondDueAt)
    }));
  }

  async scheduleNewcomerReminder(value) {
    resultData(await this.client.rpc('schedule_newcomer_reminder', {
      p_telegram_user_id: telegramId(value.telegramUserId),
      p_telegram_chat_id: telegramId(value.telegramChatId),
      p_due_at: isoTimestamp(value.dueAt)
    }));
  }

  async claimDueLifecycleNotifications({ limit = 20 } = {}) {
    const rows = resultData(await this.client.rpc('claim_due_lifecycle_notifications', {
      p_limit: pageSize(limit, 20, 50),
      p_lease_seconds: 300
    }));
    return Object.freeze((rows ?? []).map((row) => Object.freeze({
      id: uuid(row.id, 'lifecycle notification id'),
      scenario: text(row.scenario, 80),
      telegramUserId: telegramId(row.telegram_user_id),
      telegramChatId: telegramId(row.telegram_chat_id),
      paymentId: text(row.payment_id, 128)
    })));
  }

  async markLifecycleNotificationSent(notificationId) {
    const sent = resultData(await this.client.rpc('mark_lifecycle_notification_sent', {
      p_notification_id: uuid(notificationId, 'lifecycle notification id')
    }));
    return Boolean(sent);
  }

  async cancelLifecycleNotification(notificationId, reason) {
    const cancelled = resultData(await this.client.rpc('cancel_lifecycle_notification', {
      p_notification_id: uuid(notificationId, 'lifecycle notification id'),
      p_reason: text(reason, 500) ?? 'cancelled'
    }));
    return Boolean(cancelled);
  }

  async getNewcomerReminderEligibility({ telegramUserId }) {
    const rows = resultData(await this.client.rpc('get_newcomer_reminder_eligibility', {
      p_telegram_user_id: telegramId(telegramUserId)
    }));
    const row = Array.isArray(rows) ? rows[0] : rows;
    return Object.freeze({
      eligible: Boolean(row?.eligible),
      reason: text(row?.reason, 80) ?? 'not_eligible'
    });
  }

  async listGenerations({ telegramUserId, limit = 10, offset = 0, kind = null, scope = null }) {
    const userId = await this.userId(telegramUserId);
    const pageSize = Math.min(Math.max(integer(limit ?? 10, { positive: true }), 1), 25);
    const pageOffset = integer(offset ?? 0, { positive: true });
    const normalizedScope = text(scope, 20);
    if (normalizedScope && !['media', 'agent', 'all'].includes(normalizedScope)) {
      throw new TypeError('Invalid generation history scope.');
    }
    let query = this.client
      .from('generations')
      .select('id,kind,subject_type,subject_id,status,metacoins_quoted,metacoins_charged,created_at,finished_at,prompt,output_text')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(pageOffset, pageOffset + pageSize);
    if (kind) query = query.eq('kind', text(kind, 30));
    if (normalizedScope === 'media') {
      query = query.or(
        'subject_type.eq.tool,subject_type.in.(entertainment,music),and(subject_type.eq.model,kind.in.(image,video,audio,music,voice,document,3d)),and(subject_type.is.null,kind.in.(image,video,audio,music,voice,document,3d,tool))'
      );
    } else if (normalizedScope === 'agent') {
      query = query.or('subject_type.eq.agent,and(subject_type.is.null,kind.eq.agent)');
    }
    const data = resultData(await query);
    const rows = (data ?? []).slice(0, pageSize);
    return Object.freeze({
      items: Object.freeze(rows.map(generationDto)),
      nextCursor: null,
      hasMore: (data ?? []).length > pageSize
    });
  }

  async getGeneration({ telegramUserId, generationId }) {
    const userId = await this.userId(telegramUserId);
    const row = resultData(await this.client
      .from('generations')
      .select('id,kind,subject_type,subject_id,status,metacoins_quoted,metacoins_charged,created_at,finished_at,prompt,output_text,parameters,metadata')
      .eq('id', uuid(generationId, 'generation id'))
      .eq('user_id', userId)
      .maybeSingle());
    return row ? generationDto(row) : null;
  }

  async claimFreeWeeklyRequest({
    telegramUserId,
    requestKey,
    quotaKey = 'text',
    requestLimit = 50
  }) {
    const rows = resultData(await this.client.rpc('claim_free_weekly_entitlement', {
      p_telegram_user_id: telegramId(telegramUserId),
      p_request_key: text(requestKey, 200),
      p_quota_key: text(quotaKey, 32),
      p_request_limit: requestLimit
    }));
    return freeQuotaDto(Array.isArray(rows) ? rows[0] : rows);
  }

  async releaseFreeWeeklyRequest({ telegramUserId, requestKey, quotaKey = 'text' }) {
    const released = resultData(await this.client.rpc('release_free_weekly_entitlement', {
      p_telegram_user_id: telegramId(telegramUserId),
      p_request_key: text(requestKey, 200),
      p_quota_key: text(quotaKey, 32)
    }));
    return Boolean(released);
  }

  async getLegalConsentStatus({ telegramUserId }) {
    const rows = resultData(await this.client.rpc('get_legal_consent_status', {
      p_telegram_user_id: telegramId(telegramUserId)
    }));
    return legalConsentDto(Array.isArray(rows) ? rows[0] : rows);
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
    const rows = resultData(await this.client.rpc('record_legal_consent', {
      p_telegram_user_id: telegramId(telegramUserId),
      p_consent_kind: text(consentKind, 32),
      p_document_version: text(documentVersion, 64),
      p_request_key: text(requestKey, 200),
      p_telegram_update_id: telegramUpdateId,
      p_telegram_message_id: telegramMessageId,
      p_telegram_callback_id: text(telegramCallbackId, 200),
      p_metadata: sanitizeHistoryMetadata(metadata)
    }));
    return legalConsentDto(Array.isArray(rows) ? rows[0] : rows);
  }

  async close() {}
}
