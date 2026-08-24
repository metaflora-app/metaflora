import { createHash, randomUUID } from 'node:crypto';

function telegramActor(update) {
  return update?.callback_query?.from ?? update?.message?.from ?? null;
}

function telegramChat(update) {
  return update?.callback_query?.message?.chat ?? update?.message?.chat ?? null;
}

function contentType(message) {
  if (!message) return 'unknown';
  for (const key of [
    'text',
    'photo',
    'video',
    'audio',
    'voice',
    'document',
    'animation',
    'sticker',
    'location',
    'contact'
  ]) {
    if (message[key] !== undefined) return key;
  }
  return 'other';
}

function commandName(text) {
  const match = String(text ?? '').match(/^\/([a-z0-9_]{1,32})(?:@[A-Za-z0-9_]{5,32})?(?:\s|$)/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function userPayload(actor) {
  return Object.freeze({
    telegramUserId: String(actor.id),
    username: actor.username ?? '',
    firstName: actor.first_name ?? '',
    lastName: actor.last_name ?? '',
    languageCode: actor.language_code ?? '',
    isPremium: Boolean(actor.is_premium),
    isBot: Boolean(actor.is_bot)
  });
}

function conversationKey({ telegramUserId, subjectType, subjectId }) {
  return `${subjectType}:${telegramUserId}:${subjectId}:${randomUUID()}`;
}

function idempotentConversationKey({
  telegramUserId,
  subjectType,
  subjectId,
  requestKey
}) {
  if (!requestKey) return conversationKey({ telegramUserId, subjectType, subjectId });
  const digest = createHash('sha256')
    .update(String(requestKey))
    .digest('base64url')
    .slice(0, 32);
  return `${subjectType}:${telegramUserId}:${subjectId}:${digest}`;
}

function conversationKindForGeneration({ kind, subjectType }) {
  if (kind === 'text' && (!subjectType || subjectType === 'model')) return 'model';
  if (kind === 'agent' && subjectType === 'agent') return 'agent';
  return null;
}

export function createHistoryService({
  repository,
  avatarService = null,
  onError = () => {},
  retentionDays = 30
}) {
  if (!repository) throw new TypeError('History repository is required.');
  let activeConversationKeys = new Map();

  const safely = async (action, callback) => {
    try {
      return await callback();
    } catch (error) {
      onError(error, { action });
      return null;
    }
  };

  const currentConversationKey = (value) => {
    const scope = `${value.subjectType}:${value.telegramUserId}:${value.subjectId}`;
    const existing = activeConversationKeys.get(scope);
    if (existing) return existing;
    const created = conversationKey(value);
    activeConversationKeys = new Map(activeConversationKeys).set(scope, created);
    return created;
  };

  return Object.freeze({
    async captureUpdate(update) {
      return safely('history.capture_update', async () => {
        const actor = telegramActor(update);
        const chat = telegramChat(update);
        if (!actor?.id || !chat?.id) return null;
        await repository.upsertUser(userPayload(actor));
        const message = update.message ?? update.callback_query?.message ?? {};
        const callbackData = update.callback_query?.data;
        const text = update.message?.text ?? update.message?.caption ?? '';
        try {
          await avatarService?.sync?.(actor, {
            force: commandName(text) === 'start'
          });
        } catch (error) {
          onError(error, { action: 'history.sync_avatar' });
        }
        await repository.recordTelegramUpdate?.({
          telegramUpdateId: update.update_id,
          telegramUserId: actor.id,
          telegramChatId: chat.id,
          telegramMessageId: message.message_id,
          updateType: update.callback_query
            ? 'callback_query'
            : contentType(message),
          payload: update
        });
        const metadata = update.callback_query
          ? {
              chatType: chat.type ?? 'private',
              callbackData: String(callbackData ?? '').slice(0, 200),
              sourceMessageId: message.message_id ? String(message.message_id) : null
            }
          : {
              chatType: chat.type ?? 'private',
              contentType: contentType(message),
              command: commandName(text),
              textLength: String(text).length,
              ...(message.media_group_id ? { mediaGroupId: String(message.media_group_id) } : {})
            };
        return repository.recordEvent({
          eventName: update.callback_query
            ? 'telegram.callback.received'
            : 'telegram.message.received',
          category: 'telegram',
          telegramUserId: String(actor.id),
          telegramChatId: String(chat.id),
          telegramUpdateId: update.update_id,
          telegramMessageId: message.message_id,
          metadata
        });
      });
    },

    async recordEvent(event) {
      return safely('history.record_event', () => repository.recordEvent(event));
    },

    async getReceiptEmail(value) {
      return safely('history.get_receipt_email', () => repository.getReceiptEmail(value));
    },

    async saveReceiptEmail(value) {
      return safely('history.save_receipt_email', () => repository.saveReceiptEmail(value));
    },

    async listGenerations(value) {
      const query = {
        telegramUserId: value.telegramUserId,
        limit: value.limit,
        ...(value.offset === undefined ? {} : { offset: value.offset }),
        ...(value.cursor === undefined ? {} : { cursor: value.cursor }),
        kind: value.kind,
        scope: value.scope
      };
      return safely('history.list_generations', () => repository.listGenerations(query));
    },

    async getGeneration(value) {
      return safely('history.get_generation', () => repository.getGeneration({
        telegramUserId: value.telegramUserId,
        generationId: value.generationId
      }));
    },

    async claimFreeWeeklyRequest(value) {
      return safely('history.claim_free_weekly_request', () => repository.claimFreeWeeklyRequest({
        telegramUserId: value.telegramUserId,
        requestKey: value.requestKey,
        ...(value.quotaKey === undefined ? {} : { quotaKey: value.quotaKey }),
        ...(value.requestLimit === undefined ? {} : { requestLimit: value.requestLimit })
      }));
    },

    async releaseFreeWeeklyRequest(value) {
      return safely('history.release_free_weekly_request', () => repository.releaseFreeWeeklyRequest({
        telegramUserId: value.telegramUserId,
        requestKey: value.requestKey,
        ...(value.quotaKey === undefined ? {} : { quotaKey: value.quotaKey })
      }));
    },

    async getLegalConsentStatus(value) {
      return safely('history.get_legal_consent_status', () => repository.getLegalConsentStatus({
        telegramUserId: value.telegramUserId
      }));
    },

    async recordLegalConsent(value) {
      return safely('history.record_legal_consent', () => repository.recordLegalConsent({
        telegramUserId: value.telegramUserId,
        consentKind: value.consentKind,
        documentVersion: value.documentVersion,
        requestKey: value.requestKey,
        telegramUpdateId: value.telegramUpdateId,
        telegramMessageId: value.telegramMessageId,
        telegramCallbackId: value.telegramCallbackId,
        metadata: value.metadata
      }));
    },

    async schedulePaymentAbandonmentReminders(value) {
      return safely('history.schedule_payment_abandonment_reminders', () => (
        repository.schedulePaymentAbandonmentReminders(value)
      ));
    },

    async getPaymentRecord(paymentId) {
      return safely('history.get_payment_record', () => repository.getPaymentRecord(paymentId));
    },

    async scheduleNewcomerReminder(value) {
      return safely('history.schedule_newcomer_reminder', () => (
        repository.scheduleNewcomerReminder(value)
      ));
    },

    async claimDueLifecycleNotifications(value) {
      return safely('history.claim_due_lifecycle_notifications', () => (
        repository.claimDueLifecycleNotifications(value)
      ));
    },

    async markLifecycleNotificationSent(notificationId) {
      return safely('history.mark_lifecycle_notification_sent', () => (
        repository.markLifecycleNotificationSent(notificationId)
      ));
    },

    async cancelLifecycleNotification(notificationId, reason) {
      return safely('history.cancel_lifecycle_notification', () => (
        repository.cancelLifecycleNotification(notificationId, reason)
      ));
    },

    async getNewcomerReminderEligibility(value) {
      return safely('history.get_newcomer_reminder_eligibility', () => (
        repository.getNewcomerReminderEligibility(value)
      ));
    },

    async listDialogs(value) {
      return safely('history.list_dialogs', () => repository.listConversations({
        telegramUserId: value.telegramUserId,
        limit: value.limit,
        offset: value.offset,
        cursor: value.cursor,
        status: value.status,
        kind: 'model'
      }));
    },

    async getDialog(value) {
      return safely('history.get_dialog', () => repository.getConversationThread({
        telegramUserId: value.telegramUserId,
        conversationId: value.conversationId,
        limit: value.limit,
        before: value.before
      }));
    },

    async startNewDialog(value) {
      return safely('history.start_new_dialog', async () => {
        const key = idempotentConversationKey(value);
        const conversationId = await repository.ensureConversation({
          telegramUserId: value.telegramUserId,
          conversationKey: key,
          kind: value.subjectType === 'agent' ? 'agent' : 'model',
          subjectId: value.subjectId,
          title: value.title || 'новый диалог',
          retentionDays
        });
        if (!conversationId) return null;
        const scope = `${value.subjectType}:${value.telegramUserId}:${value.subjectId}`;
        activeConversationKeys = new Map(activeConversationKeys).set(scope, key);
        await repository.recordEvent({
          eventName: 'conversation.created',
          category: 'history',
          telegramUserId: String(value.telegramUserId),
          requestKey: value.requestKey ?? null,
          conversationKey: key,
          subjectType: value.subjectType,
          subjectId: value.subjectId,
          metadata: { conversationId }
        });
        return Object.freeze({ conversationId, conversationKey: key });
      });
    },

    async archiveDialog(value) {
      return safely('history.archive_dialog', async () => {
        const archived = await repository.archiveConversation({
          telegramUserId: value.telegramUserId,
          conversationId: value.conversationId
        });
        if (!archived) return null;
        const subjectType = value.subjectType ?? archived.kind;
        const subjectId = value.subjectId ?? archived.subjectId;
        if (subjectType && subjectId) {
          const scope = `${subjectType}:${value.telegramUserId}:${subjectId}`;
          activeConversationKeys = new Map(activeConversationKeys);
          activeConversationKeys.delete(scope);
        }
        await repository.recordEvent({
          eventName: 'conversation.archived',
          category: 'history',
          telegramUserId: String(value.telegramUserId),
          subjectType: subjectType ?? 'conversation',
          subjectId: subjectId ?? value.conversationId,
          metadata: { conversationId: value.conversationId }
        });
        return Object.freeze({
          conversationId: archived.conversationId,
          status: archived.status
        });
      });
    },

    async resumeDialog(value) {
      return safely('history.resume_dialog', async () => {
        const resumed = await repository.activateConversation({
          telegramUserId: value.telegramUserId,
          conversationId: value.conversationId
        });
        if (!resumed || resumed.kind !== 'model') return null;
        const scope = `model:${value.telegramUserId}:${resumed.subjectId}`;
        activeConversationKeys = new Map(activeConversationKeys)
          .set(scope, resumed.conversationKey);
        await repository.recordEvent({
          eventName: 'conversation.resumed',
          category: 'history',
          telegramUserId: String(value.telegramUserId),
          conversationKey: resumed.conversationKey,
          subjectType: 'model',
          subjectId: resumed.subjectId,
          metadata: { conversationId: resumed.conversationId }
        });
        return Object.freeze({
          conversationId: resumed.conversationId,
          kind: resumed.kind,
          subjectId: resumed.subjectId,
          title: resumed.title,
          status: resumed.status
        });
      });
    },

    resetUserDialogs({ telegramUserId }) {
      const marker = `:${telegramUserId}:`;
      activeConversationKeys = new Map(
        [...activeConversationKeys].filter(([scope]) => !scope.includes(marker))
      );
    },

    rotateConversation({ telegramUserId, subjectType, subjectId }) {
      const scope = `${subjectType}:${telegramUserId}:${subjectId}`;
      const created = conversationKey({ telegramUserId, subjectType, subjectId });
      activeConversationKeys = new Map(activeConversationKeys).set(scope, created);
      return created;
    },

    async startGeneration(value) {
      return safely('history.start_generation', async () => {
        const conversationKind = conversationKindForGeneration(value);
        const key = conversationKind ? currentConversationKey(value) : null;
        let conversationId = null;
        if (conversationKind) {
          conversationId = await repository.ensureConversation({
            telegramUserId: value.telegramUserId,
            conversationKey: key,
            kind: conversationKind,
            subjectId: value.subjectId,
            title: value.title,
            retentionDays
          });
          if (!conversationId) return null;
          await repository.appendMessage({
            telegramUserId: value.telegramUserId,
            conversationId,
            role: 'user',
            content: value.prompt || '[файл без подписи]',
            telegramMessageId: value.telegramMessageId,
            metadata: {
              inputTypes: value.inputTypes ?? [],
              subjectType: value.subjectType,
              subjectId: value.subjectId
            }
          });
        }
        const generationId = await repository.startGeneration({
          ...value,
          conversationId
        });
        if (!generationId) return null;
        await repository.recordEvent({
          eventName: 'generation.started',
          category: 'generation',
          telegramUserId: value.telegramUserId,
          telegramChatId: value.telegramChatId,
          telegramMessageId: value.telegramMessageId,
          requestKey: value.requestKey,
          conversationKey: key,
          subjectType: value.subjectType,
          subjectId: value.subjectId,
          metadata: {
            generationId,
            kind: value.kind,
            metacoinsQuoted: value.metacoinsQuoted
          }
        });
        return Object.freeze({
          generationId,
          conversationId,
          telegramUserId: String(value.telegramUserId)
        });
      });
    },

    async completeGeneration(run, result) {
      if (!run?.generationId) return null;
      return safely('history.complete_generation', async () => {
        if (run.conversationId && result.outputText) {
          await repository.appendMessage({
            telegramUserId: run.telegramUserId,
            conversationId: run.conversationId,
            role: 'assistant',
            content: result.outputText,
            metadata: {
              provider: result.provider ?? null,
              providerModelId: result.providerModelId ?? null
            }
          });
        }
        await repository.completeGeneration({
          generationId: run.generationId,
          ...result
        });
        await repository.recordEvent({
          eventName: 'generation.completed',
          category: 'generation',
          telegramUserId: run.telegramUserId,
          subjectType: 'system',
          subjectId: 'generation',
          metadata: {
            generationId: run.generationId,
            metacoinsCharged: result.metacoinsCharged ?? 0,
            outputType: result.outputType ?? (result.outputText ? 'text' : 'media')
          }
        });
        return run.generationId;
      });
    },

    async failGeneration(run, error) {
      if (!run?.generationId) return null;
      return safely('history.fail_generation', async () => {
        await repository.failGeneration({
          generationId: run.generationId,
          errorCode: error?.code ?? 'provider_error',
          errorMessage: error?.message ?? 'generation failed'
        });
        await repository.recordEvent({
          eventName: 'generation.failed',
          category: 'generation',
          telegramUserId: run.telegramUserId,
          subjectType: 'system',
          subjectId: 'generation',
          metadata: {
            generationId: run.generationId,
            errorCode: error?.code ?? 'provider_error'
          }
        });
        return run.generationId;
      });
    },

    async recordMetacoinTransaction(value) {
      return safely('history.record_metacoin_transaction', async () => {
        const ledgerId = await repository.recordMetacoinTransaction(value);
        await repository.recordEvent({
          eventName: value.delta < 0 ? 'metacoins.debited' : 'metacoins.credited',
          category: 'billing',
          telegramUserId: value.telegramUserId,
          requestKey: value.idempotencyKey,
          subjectType: value.referenceType ?? 'metacoins',
          subjectId: value.referenceId ?? value.source,
          metadata: {
            ledgerId,
            delta: value.delta,
            balanceAfter: value.balanceAfter,
            source: value.source,
            ...value.metadata
          }
        });
        return ledgerId;
      });
    },

    async close() {
      return safely('history.close', () => repository.close());
    }
  });
}
