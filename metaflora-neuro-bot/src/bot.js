import { createHash } from 'node:crypto';
import { createReferralOfferTrackingUrl } from './referral-offer-tracking.js';

import { invokeFreeLlm } from './llm-router.js';
import { installModelIcons } from './icon-installer.js';
import {
  applyModelSetting,
  buildLlmFamilyMessage,
  buildModelCard,
  buildModelCategoryMessage,
  buildModelConfiguredMessage,
  buildModelActionButton,
  buildContextClearedMessage,
  isConversationalModel,
  buildModelInstructionsPrompt,
  buildModelSettingsMessage,
  buildModelSelectedMessage,
  buildSettingOptionsMessage,
  buildToolCategoryMessage,
  calculateModelMetacoinPrice,
  calculateModelProviderFloorMetacoins,
  defaultModelSettings,
  getModelById,
  inputProfileForModel
} from './model-catalog.js';
import { buildWelcomeMessage } from './onboarding.js';
import {
  buildImageReferenceMessage,
  imageReferenceLimit,
  supportsImageReferences
} from './image-reference-ui.js';
import {
  buildBalanceHomeMessage,
  buildBillingHistoryMessage,
  buildDialogHistoryMessage,
  buildDialogThreadMessage,
  buildCheckoutUnavailableMessage,
  buildActiveSubscriptionMessage,
  buildInvoicePlaceholderMessage,
  buildCryptoPaymentRedirectMessage,
  buildPaymentRedirectMessage,
  buildMetacoinPackagesMessage,
  buildPaymentMethodMessage,
  buildPlanDetailsMessage,
  buildPlansMessage,
  buildProfileCabinetMessage,
  buildPromoEntryMessage,
  buildPromoMessage,
  buildReceiptEmailPrompt
} from './billing-ui.js';
import {
  buildGenerationHistoryDetailMessage,
  buildGenerationHistoryListMessage,
  buildGenerationHistoryUnavailableMessage,
  GENERATION_HISTORY_PAGE_SIZE
} from './generation-history-ui.js';
import {
  getMetacoinPackage,
  getSubscriptionPlan,
  isPaidSubscriptionActive
} from './billing-catalog.js';
import { parseReferralPayload } from './referral-program.js';
import { createReferralService } from './referral-service.js';
import {
  buildReferralAccountMessage,
  buildReferralEarningsMessage,
  buildReferralLevelsMessage,
  buildReferralPeopleMessage,
  buildReferralWithdrawalMessage,
  buildPartnerOfferMessage,
  buildPartnerOnboardingMessage,
  buildPartnerStatusMessage,
  buildWithdrawalOwnerMessage,
  buildWithdrawalAmountPrompt,
  buildWithdrawalMethodPrompt,
  buildWithdrawalCreatedMessage,
  buildWithdrawalDestinationPrompt
} from './referral-ui.js';
import {
  buildTestModeReply,
  isAgentCallAllowed,
  isFreeLlmTestAllowed,
  isPaidCallAllowed
} from './test-mode.js';
import { cardProfileFor, inputContractFor } from './model-profiles.js';
import { decideModelAccess } from './access-control.js';
import {
  buildGenerationAccessMessage,
  freeEntitlementFor,
  FREE_MODEL_IDS
} from './generation-access.js';
import {
  applyUserPreference,
  cycleUserPreference,
  buildUserPreferenceOptions,
  buildUserSettingsMessage,
  defaultUserPreferences,
  preferenceInstructions
} from './user-preferences.js';
import {
  buildAgentProviderErrorMessage,
  buildAggregatorErrorMessage,
  buildDeliveryErrorMessage,
  buildProviderErrorMessage,
  ProviderRequestError,
  ResultDeliveryError
} from './request-errors.js';
import {
  createToolExecutor,
  falUploader,
  resolveMediaInputs,
  toolUsageFromInputs
} from './tool-executor.js';
import {
  calculateToolMetacoinPrice,
  getToolModelById
} from './tool-model-adapter.js';
import { createMediaModelExecutor } from './media-model-executor.js';
import { normalizeTelegramInputs, validateToolInputs } from './tool-runtime.js';
import {
  applyScenarioTelegramInput,
  buildScenarioCatalogMessage,
  buildScenarioMessage,
  getScenarioById,
  validateScenarioInputs
} from './scenario-catalog.js';
import { getAgentById } from './agent-catalog.js';
import {
  buildAgentCard,
  buildAgentCatalogMenu,
  buildAgentCategoryMessage,
  buildAgentSettingOptionsMessage,
  buildAgentSettingsMessage,
  buildAgentSelectedMessage
} from './agent-ui.js';
import { buildAgentLlmRequest } from './agent-runtime.js';
import {
  buildEntertainmentCard,
  buildEntertainmentMenu,
  buildEntertainmentSelectedMessage,
  getEntertainmentById,
  entertainmentAgentFor
} from './entertainment-catalog.js';
import {
  buildFlowReadyMessage,
  buildLilaNextMessage,
  buildCongratulatorConfirmationMessage,
  buildCongratulatorPromptMessage,
  buildInteractiveEntertainmentStart,
  buildMemeStickerCaptureMessage,
  createEntertainmentFlowState,
  flowStateFromCallback,
  isInteractiveEntertainment,
  prepareEntertainmentTurn
} from './entertainment-interactive.js';
import {
  buildEntertainmentFlowMessage,
  chooseEntertainmentFlow,
  entertainmentFlowFor
} from './entertainment-flows.js';
import {
  QUIZ_CATEGORIES,
  QUIZ_DIFFICULTIES,
  QUIZ_COUNTS,
  buildQuizSetupMessage,
  buildQuizQuestionMessage,
  buildQuizResultMessage,
  buildQuizGenerationPrompt,
  createQuizState,
  parseQuizQuestions,
  answerQuizQuestion
} from './entertainment-quiz.js';
import { calculateAgentRunPrice } from './agent-economics.js';
import {
  applyAgentSetting,
  cycleAgentSetting,
  defaultAgentSettings,
  sanitizeAgentSettingsStore
} from './agent-settings.js';
import {
  buildAudioStudioCategoryMessage,
  buildAudioDubConstructorMessage,
  buildAudioDubVoicePickerMessage,
  buildAudioStudioHomeMessage,
  buildAudioWorkflowEarlyAccessMessage,
  buildAudioWorkflowMessage,
  buildAudioWorkflowSettingsMessage,
  buildAudioWorkflowSelectedMessage
} from './audio-studio-ui.js';
import {
  applyMusicSetting,
  buildMusicConfirmationMessage,
  buildMusicDurationMessage,
  buildMusicInputPrompt,
  buildMusicLyricsMessage,
  buildMusicPerformerMessage,
  buildMusicSettingsMessage,
  buildMusicStyleMessage,
  clearMusicPrompt,
  createMusicDraft,
  isMusicConstructorWorkflowId,
  musicProviderRequest
} from './music-constructor.js';
import { getMusicProviderContract } from './music-provider-contracts.js';
import { getExecutableToolForWorkflow } from './audio-workflow-routing.js';
import {
  buildOwnedVoiceCardMessage,
  buildOwnedVoiceDeleteMessage,
  buildOwnedVoiceTextPrompt,
  buildVoiceCardMessage,
  buildVoiceEarlyAccessMessage,
  buildVoiceLibraryMessage,
  buildVoiceTextPrompt,
  calculateVoiceTtsPrice
} from './voice-library-ui.js';
import { getCuratedVoice, listCuratedVoices } from './voice-library.js';
import { metacoinHtml } from './brand-icons.js';
import {
  buildGeneratedMediaCaption,
  buildGenerationResultRows,
  buildGenerationStatusMessage
} from './generation-ui.js';
import {
  buildWelcomeAgentIntroMessage,
  buildWelcomeAgentRequest,
  buildWelcomeAgentResponseMessage,
  sanitizeWelcomeAgentOutput
} from './welcome-agent.js';
import {
  buildLegalConsentMessage,
  buildLegalConsentSuccessMessage,
  isLegalConsentComplete,
  LEGAL_DOCUMENT_VERSION
} from './legal-consent.js';
import { normalizeReceiptEmail } from './yookassa-client.js';
import { markMenuMedia } from './menu-media.js';
import {
  addVideoConstructorUpload,
  buildVideoModeSelectionMessage,
  buildVideoConstructorMessage,
  buildVideoReferenceUploadMessage,
  buildVideoSettingOptionsMessage,
  buildVideoLaunchMessage,
  createVideoConstructorDraft,
  clearVideoConstructorPrompt,
  cycleVideoConstructorSetting,
  modesForVideoModel,
  resetVideoConstructorSettings,
  setVideoConstructorMode,
  setVideoConstructorSetting,
  setVideoConstructorPrompt,
  validateVideoConstructorDraft,
  videoConstructorTelegramInput
} from './video-constructor.js';

export const BOT_COMMANDS = Object.freeze([
  { command: 'menu', description: 'главное меню' },
  { command: 'welcome', description: 'помощник по МЕТАФЛОРА* нейро' },
  { command: 'text', description: 'текст, код и поиск' },
  { command: 'design', description: 'изображения' },
  { command: 'video', description: 'видео' },
  { command: 'audio', description: 'аудио и музыка' },
  { command: 'voice', description: 'озвучка и расшифровка' },
  { command: 'tools', description: 'ИИ-инструменты' },
  { command: 'agents', description: 'ИИ-агенты' },
  { command: 'fun', description: 'развлечения' },
  { command: 'settings', description: 'настройки ответов' },
  { command: 'dialogs', description: '💬 история диалогов' },
  { command: 'profile', description: 'профиль и баланс' },
  { command: 'balance', description: 'пополнить баланс' },
  { command: 'paysupport', description: 'поддержка по платежам' },
  { command: 'channel', description: 'канал фаундера' },
  { command: 'support', description: 'поддержка' }
]);

const taskCategory = Object.freeze({
  text: 'llm',
  image: 'image',
  video: 'video',
  audio: 'audio',
  voice: 'voice',
  tools: 'tools',
  russian: 'russian',
  beta: 'beta',
  experimental: 'beta'
});
const commandCategory = Object.freeze({
  text: 'llm',
  design: 'image',
  audio: 'audio',
  video: 'video',
  tools: 'tools',
  russian: 'russian',
  beta: 'beta',
  experimental: 'beta'
});
const menuMediaForCategory = Object.freeze({
  llm: 'llm',
  russian: 'llm',
  image: 'image',
  video: 'video',
  audio: 'music',
  voice: 'voice',
  beta: 'beta',
  tools: 'tools'
});
const fullAccessUsernames = new Set(['mishchenko_is']);

function hasFullAccess({ username, actorId, ownerId }) {
  const normalizedUsername = String(username ?? '').replace(/^@/, '').toLowerCase();
  return fullAccessUsernames.has(normalizedUsername)
    || (ownerId && String(actorId) === String(ownerId));
}

function largestPhotoFileId(message) {
  return Array.isArray(message?.photo) ? message.photo.at(-1)?.file_id : null;
}

function documentMediaKind(document) {
  const mimeType = String(document?.mime_type ?? '');
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return null;
}

function collectAgentTelegramMedia(telegramInput) {
  const entries = (Array.isArray(telegramInput) ? telegramInput : [telegramInput]).filter(Boolean);
  const imageIds = [];
  let audioId = null;
  let videoId = null;
  let audioDurationSeconds = 60;
  let videoDurationSeconds = 5;

  for (const entry of entries) {
    const photoId = largestPhotoFileId(entry);
    if (photoId) imageIds.push(photoId);

    const documentKind = documentMediaKind(entry.document);
    if (documentKind === 'image' && entry.document?.file_id) imageIds.push(entry.document.file_id);
    if (documentKind === 'video' && entry.document?.file_id && !videoId) {
      videoId = entry.document.file_id;
      videoDurationSeconds = Number(entry.document.duration ?? videoDurationSeconds);
    }
    if (documentKind === 'audio' && entry.document?.file_id && !audioId) {
      audioId = entry.document.file_id;
      audioDurationSeconds = Number(entry.document.duration ?? audioDurationSeconds);
    }
    if (entry.video?.file_id && !videoId) {
      videoId = entry.video.file_id;
      videoDurationSeconds = Number(entry.video.duration ?? videoDurationSeconds);
    }
    if (entry.audio?.file_id && !audioId) {
      audioId = entry.audio.file_id;
      audioDurationSeconds = Number(entry.audio.duration ?? audioDurationSeconds);
    }
    if (entry.voice?.file_id && !audioId) {
      audioId = entry.voice.file_id;
      audioDurationSeconds = Number(entry.voice.duration ?? audioDurationSeconds);
    }
  }

  return Object.freeze({
    imageIds: Object.freeze([...new Set(imageIds)].slice(0, 10)),
    audioId,
    videoId,
    audioDurationSeconds: Number.isFinite(audioDurationSeconds) && audioDurationSeconds > 0
      ? audioDurationSeconds
      : 60,
    videoDurationSeconds: Number.isFinite(videoDurationSeconds) && videoDurationSeconds > 0
      ? videoDurationSeconds
      : 5
  });
}

function agentMediaCounts(media) {
  const image = media.imageIds.length;
  const video = media.videoId ? 1 : 0;
  const audio = media.audioId ? 1 : 0;
  return Object.freeze({ image, video, audio, total: image + video + audio });
}

function defaultAgentPromptForMedia(counts) {
  if (counts.video) return 'разбери приложенное видео';
  if (counts.audio) return 'расшифруй и разбери приложенное аудио';
  if (counts.image) return 'проанализируй приложенное изображение';
  return '';
}

function agentPreprocessSpecs(media) {
  return Object.freeze([
    media.audioId
      ? Object.freeze({
        kind: 'audio',
        toolId: 'audio_stt',
        durationSeconds: media.audioDurationSeconds
      })
      : null,
    media.videoId
      ? Object.freeze({
        kind: 'video',
        toolId: 'video_understand',
        durationSeconds: media.videoDurationSeconds
      })
      : null
  ].filter(Boolean));
}

function agentPreprocessPriceMetacoins(specs) {
  return specs.reduce((total, spec) => {
    const tool = getToolModelById(spec.toolId);
    if (!tool) return total;
    return total + calculateToolMetacoinPrice(tool, {}, {
      durationSeconds: spec.durationSeconds
    });
  }, 0);
}

function telegramInputWithPrompt(telegramInput, prompt) {
  if (Array.isArray(telegramInput)) {
    if (telegramInput.length === 0) return telegramInput;
    return telegramInput.map((entry, index) => (
      index === 0
        ? { ...entry, text: entry.text ?? prompt, caption: entry.caption ?? prompt }
        : entry
    ));
  }
  return {
    ...telegramInput,
    text: telegramInput?.text ?? prompt,
    caption: telegramInput?.caption ?? prompt
  };
}

const replyMenuTask = Object.freeze({
  'профиль': 'profile',
  'текст / код / поиск': 'text',
  'текст / код / Perplexity': 'text',
  'изображения': 'image',
  'видео': 'video',
  'аудио / музыка': 'audio',
  'озвучка / расшифровка': 'voice',
  'инструменты': 'tools',
  'ии-инструменты': 'tools',
  'ии-инструменты': 'tools',
  'ии-инструменты': 'tools',
  'ии-агенты': 'agents',
  'российские': 'russian',
  'бета-модели': 'beta',
  'экспериментальные': 'beta',
  'канал фаундера': 'founder-channel',
  'пригласить друга': 'invite',
  'поддержка': 'support',
  '👤 профиль': 'profile',
  '💬 текст / код / поиск': 'text',
  '💬 текст / код / Perplexity': 'text',
  '🎨 изображения': 'image',
  '🎬 видео': 'video',
  '🎧 аудио / музыка': 'audio',
  '🎙 озвучка / расшифровка': 'voice',
  '🛠 инструменты': 'tools',
  '🪄 ИИ-инструменты': 'tools',
  '🪄 ии-инструменты': 'tools',
  '🪄 ии-инструменты': 'tools',
  '🪄 ии-инструменты': 'tools',
  '🤖 ИИ-агенты': 'agents',
  '🤖 ии-агенты': 'agents',
  '🎰 развлечения': 'entertainment',
  '🇷🇺 российские': 'russian',
  '🧪 бета-модели': 'beta',
  '🧪 экспериментальные': 'beta',
  '📡 канал фаундера': 'founder-channel',
  '🪙 пополнить баланс': 'balance',
  'пополнить баланс': 'balance',
  '👥 пригласить друга': 'invite',
  '🧯 поддержка': 'support'
});

function navigationRows(backData = 'task:menu', backText = '‹ назад') {
  return [
    [{ text: '👤 профиль', callback_data: 'task:profile' }],
    [
      { text: backText, callback_data: backData },
      { text: '🏠 главное меню', callback_data: 'task:menu' }
    ]
  ];
}

function buildProfileMessage(selected, referralAccount) {
  return buildProfileCabinetMessage({ account: referralAccount, selectedModel: selected });
}

function buildBalanceMessage(referralAccount) {
  return buildBalanceHomeMessage(referralAccount);
}

function buildSupportMessage() {
  return {
    text: '🧯 поддержка\n\nесли что-то не работает, <b>списались метакоины без результата</b> или нужна помощь с моделью, напиши @metaflora_support. приложи скриншот и коротко расскажи, что произошло, так мы быстрее разберемся.\n\n<b>отвечаем с 10:00 до 18:00 (UTC+3)</b>👇',
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'написать', url: 'https://t.me/metaflora_support' }],
        ...navigationRows()
      ]
    }
  };
}

function buildFounderChannelMessage() {
  return {
    text: '📡 <b>канал фаундера</b>\n\nдесятки гайдов по нейросетям, готовые промпты, разборы новых моделей, рабочие связки и кейсы без пересказа пресс-релизов. <b>только то, чем пользуюсь сам каждый день.</b>\n\nподпишись, чтобы не пропускать полезные материалы и обновления👇',
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: {
      inline_keyboard: [
        [{ text: 'подписаться ↗', url: 'https://t.me/metamishchenko' }],
        ...navigationRows()
      ]
    }
  };
}

function buildDialogsMessage(model) {
  return {
    text: `💬 диалоги\n\n${model ? `текущий диалог: ${model.name}` : 'активного диалога пока нет.'}\n\nконтекст очищен — модель сохранена, но следующий запрос будет в новой теме.`,
    reply_markup: {
      inline_keyboard: [
        [{ text: '⛔️ очистить контекст', callback_data: 'dialog:new' }],
        ...navigationRows()
      ]
    }
  };
}

function normalizeDialogHistoryMessage(message, currentModel = null) {
  const keyboard = message?.reply_markup?.inline_keyboard;
  if (!Array.isArray(keyboard)) return message;
  const canClearContext = isConversationalModel(currentModel);
  return {
    ...message,
    reply_markup: {
      ...message.reply_markup,
      inline_keyboard: keyboard.flatMap((row) => {
        if (!Array.isArray(row)) return [row];
        const normalizedRow = row
          .filter((button) => canClearContext || button?.callback_data !== 'dialog:new')
          .map((button) => button?.callback_data === 'dialog:new'
            ? { ...button, text: '⛔️ очистить контекст' }
            : button);
        return normalizedRow.length > 0 ? [normalizedRow] : [];
      })
    }
  };
}

function callbackValue(data, prefix) {
  return typeof data === 'string' && data.startsWith(`${prefix}:`) ? data.slice(prefix.length + 1) : null;
}

function commandName(text) {
  if (typeof text !== 'string' || !text.startsWith('/')) return null;
  return text.slice(1).split(/[@\s]/, 1)[0].toLowerCase();
}

function commandArgument(text) {
  if (typeof text !== 'string' || !text.startsWith('/')) return '';
  const separator = text.indexOf(' ');
  return separator < 0 ? '' : text.slice(separator + 1).trim();
}

const inputLabels = Object.freeze({
  text: 'текст',
  image: 'изображение',
  video: 'видео',
  audio: 'аудио',
  document: 'документ'
});

function messageInputs(message) {
  const inputs = [];
  const prompt = typeof message?.text === 'string' ? message.text : message?.caption;
  if (typeof prompt === 'string' && prompt.trim()) inputs.push('text');
  if (Array.isArray(message?.photo) && message.photo.length > 0) inputs.push('image');
  if (message?.video || message?.animation || message?.video_note) inputs.push('video');
  if (message?.audio || message?.voice) inputs.push('audio');
  if (message?.document) {
    const mimeType = message.document.mime_type ?? '';
    if (mimeType.startsWith('image/')) inputs.push('image');
    else if (mimeType.startsWith('video/')) inputs.push('video');
    else if (mimeType.startsWith('audio/')) inputs.push('audio');
    else inputs.push('document');
  }
  return inputs;
}

function validMessage(message) {
  const prompt = typeof message?.text === 'string' ? message.text : message?.caption;
  if (typeof prompt === 'string' && prompt.length > 12_000) return false;
  return messageInputs(message).length > 0;
}

function unsupportedInputMessage(model, allowedInputs) {
  const labels = allowedInputs.map((input) => inputLabels[input]).filter(Boolean);
  return `${model.name} принимает только: ${labels.join(', ')}. отправь запрос в одном из этих форматов.`;
}

function inputCountLabel(input, count) {
  const form = (one, few, many) => {
    const lastTwo = count % 100;
    const last = count % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return many;
    if (last === 1) return one;
    if (last >= 2 && last <= 4) return few;
    return many;
  };
  const labels = {
    text: `${count} ${form('текст', 'текста', 'текстов')}`,
    image: `${count} ${form('изображение', 'изображения', 'изображений')}`,
    video: `${count} видео`,
    audio: `${count} ${form('аудиофайл', 'аудиофайла', 'аудиофайлов')}`,
    document: `${count} ${form('документ', 'документа', 'документов')}`
  };
  return labels[input] ?? `${count} файла`;
}

function inputContractError(model, inputs) {
  const contract = inputContractFor(model);
  if (!contract) return null;

  const counts = Object.fromEntries(
    [...new Set(inputs)].map((input) => [input, inputs.filter((value) => value === input).length])
  );
  const countOf = (input) => counts[input] ?? 0;
  const missing = Object.entries(contract.minimum ?? {})
    .filter(([input, minimum]) => countOf(input) < minimum)
    .map(([input, minimum]) => inputCountLabel(input, minimum));
  if (missing.length) {
    const hint = contract.minimum?.text
      ? 'добавь текст в подписи и отправь все файлы одним сообщением или альбомом.'
      : 'отправь все файлы одним альбомом.';
    return `для ${model.name} нужно: ${missing.join(' и ')}. ${hint}`;
  }

  const exceeded = Object.entries(contract.maximum ?? {})
    .filter(([input, maximum]) => countOf(input) > maximum)
    .map(([input, maximum]) => inputCountLabel(input, maximum));
  if (exceeded.length) {
    return `для ${model.name} можно отправить не больше: ${exceeded.join(' и ')}.`;
  }
  const mediaCount = inputs.filter((input) => input !== 'text').length;
  if (contract.totalMaximum && mediaCount > contract.totalMaximum) {
    return `для ${model.name} можно отправить не больше ${contract.totalMaximum} вложений за один запуск.`;
  }
  return null;
}

function createRequestGate({ maxRequests, windowMs, now }) {
  const buckets = new Map();
  return (chatId) => {
    const timestamp = now();
    const current = buckets.get(chatId);
    if (!current || timestamp - current.startedAt >= windowMs) {
      buckets.set(chatId, { startedAt: timestamp, count: 1 });
      return true;
    }
    if (current.count >= maxRequests) return false;
    buckets.set(chatId, { ...current, count: current.count + 1 });
    return true;
  };
}

export async function registerBotCommands(telegram) {
  await telegram.setMyCommands(BOT_COMMANDS);
}

export function sanitizeStoredModelSettings(source) {
  return Object.fromEntries(
    Object.entries(source ?? {}).flatMap(([modelId, rawSettings]) => {
      const model = getModelById(modelId);
      if (!model || !rawSettings || typeof rawSettings !== 'object' || Array.isArray(rawSettings)) return [];
      const definitions = inputProfileForModel(model);
      const defaults = defaultModelSettings(model);
      const settings = Object.fromEntries(definitions.map((definition) => {
        const candidate = String(rawSettings[definition.key] ?? '');
        const allowed = definition.values.some(({ value }) => value === candidate);
        return [definition.key, allowed ? candidate : defaults[definition.key]];
      }));
      if (model.category === 'llm' && typeof rawSettings.instructions === 'string') {
        settings.instructions = rawSettings.instructions.slice(0, 3000);
      }
      return [[modelId, settings]];
    })
  );
}

export function createUpdateHandler({
  telegram,
  config,
  invokeLlm = invokeFreeLlm,
  onError = () => {},
  rateLimit = { maxRequests: 10, windowMs: 60_000 },
  now = Date.now,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
  mediaGroupDelayMs = 500,
  referralService = createReferralService(),
  stateRepository = null,
  invokeTool = null,
  invokeMediaModel = null,
  voiceService = null,
  audioWorkflowExecutor = null,
  historyService = null,
  entertainmentSessionRepository = null,
  paymentService = null,
  paymentRails = null,
  lifecycleService = null,
  mediaStorage = null,
  menuMedia = null,
  providerFetch = fetch,
  payoutSetupBaseUrl = '',
  uploadMedia = null
}) {
  const selections = new Map();
  const selectedAgents = new Map();
  const selectedEntertainments = new Map();
  const entertainmentFlowStates = new Map();
  const entertainmentQuizDrafts = new Map();
  const persistEntertainmentFlow = async (actorId, state, {
    transitionKey = null, charged = false, cost = 0, status = 'active'
  } = {}) => {
    if (!state || !entertainmentSessionRepository?.saveEntertainmentSession) return state;
    const saved = await entertainmentSessionRepository.saveEntertainmentSession({
      telegramUserId: actorId,
      sessionId: state.sessionId ?? `${state.id}:${actorId}`,
      scenarioId: state.id,
      version: 1,
      step: state.turn ?? 0,
      status,
      charged,
      cost,
      mediaCounts: { image: 0, video: 0, audio: 0 },
      state,
      transitionKey,
      ...(state.persistenceRevision !== undefined
        ? { expectedRevision: state.persistenceRevision }
        : {})
    });
    return Object.freeze({ ...state, persistenceRevision: saved.revision });
  };
  const restoreEntertainmentFlow = async (actorId, chatId) => {
    if (!entertainmentSessionRepository?.loadEntertainmentSession) return null;
    const session = await entertainmentSessionRepository.loadEntertainmentSession({ telegramUserId: actorId });
    if (!session?.state || session.status !== 'active') return null;
    const entertainment = getEntertainmentById(session.scenarioId);
    const agent = entertainmentAgentFor(entertainment);
    if (!entertainment || !agent) return null;
    entertainmentFlowStates.set(chatId, Object.freeze({
      ...session.state,
      sessionId: session.sessionId,
      persistenceRevision: session.revision
    }));
    saveAgentSelection(chatId, agent);
    selectedEntertainments.set(chatId, entertainment);
    return session;
  };
  const congratulatorDrafts = new Map();
  const pendingModels = new Map();
  const pendingScenarios = new Map();
  const modelSettings = new Map();
  const agentSettings = new Map();
  const userPreferences = new Map();
  const instructionDrafts = new Map();
  const uiMessageIds = new Map();
  const uiMediaKeys = new Map();
  const menuPhotoFileIds = new Map();
  const generationStatusMessageIds = new Map();
  const generationProtectedMessageIds = new Map();
  const mediaGroups = new Map();
  const withdrawalDrafts = new Map();
  const partnerOnboardingDrafts = new Map();
  const receiptDrafts = new Map();
  const receiptEmails = new Map();
  const promoDrafts = new Map();
  const promoCodes = new Map();
  const hydratedUsers = new Set();
  const generationResults = new Map();
  const generationStoredMedia = new Map();
  const generationHistoryRuns = new Map();
  const llmRequestPromises = new Map();
  const dialogHistoryCursors = new Map();
  const voicePreviewMessageIds = new Map();
  const audioDubDrafts = new Map();
  const audioDubPromises = new Map();
  const musicDrafts = new Map();
  const activeMusicConstructors = new Set();
  const musicPromises = new Map();
  const voiceTextDrafts = new Map();
  const voiceConfirmations = new Map();
  const voiceGenerationPromises = new Map();
  const voiceDeliveryPromises = new Map();
  const videoConstructorDrafts = new Map();
  const videoUploadTargets = new Map();
  const imageReferenceDrafts = new Map();
  const imageReferenceCapture = new Set();
  const imageReferenceKey = (chatId, modelId) => `${chatId}:${modelId}`;
  const imageReferencesFor = (chatId, model) => (
    imageReferenceDrafts.get(imageReferenceKey(chatId, model?.id)) ?? Object.freeze([])
  );
  const replayRequests = new Map();
  let replaySequence = 0;
  const memoryWelcomeSessions = new Map();
  let welcomeMessageIds = new Map();
  let welcomeReturnMessageIds = new Map();
  const allowRequest = createRequestGate({ ...rateLimit, now });
  const reportTelegramCleanupError = (error, context) => {
    const message = String(error?.message ?? '');
    if (/message to delete not found|message can't be deleted|message to edit not found/i.test(message)) return;
    onError(error, context);
  };
  const allowMemoryWelcomeRequest = createRequestGate({
    maxRequests: 6,
    windowMs: 60_000,
    now
  });
  let welcomeTokens = new Map();
  let welcomeInFlight = new Map();
  let welcomeQueue = [];
  let activeWelcomeRequests = 0;
  const maxConcurrentWelcomeRequests = 3;
  const maxQueuedWelcomeRequests = 50;
  let resolvedToolExecutor = invokeTool;
  let resolvedMediaModelExecutor = invokeMediaModel;
  const executeTool = (request) => {
    if (request?.auditContext && typeof providerFetch.withAuditContext === 'function' && !invokeTool) {
      return createToolExecutor({
        telegram,
        providerKeys: config.providerKeys,
        upload: uploadMedia,
        fetchImpl: providerFetch.withAuditContext(request.auditContext)
      })(request);
    }
    resolvedToolExecutor ??= createToolExecutor({
      telegram,
      providerKeys: config.providerKeys,
      upload: uploadMedia,
      fetchImpl: providerFetch
    });
    return resolvedToolExecutor(request);
  };
  const executeMediaModel = (request) => {
    resolvedMediaModelExecutor ??= createMediaModelExecutor({
      telegram,
      providerKeys: config.providerKeys,
      fetchImpl: providerFetch
    });
    const scopedFetch = request?.auditContext
      && typeof providerFetch.withAuditContext === 'function'
      ? providerFetch.withAuditContext(request.auditContext)
      : providerFetch;
    return resolvedMediaModelExecutor({ ...request, fetchImpl: scopedFetch });
  };
  const providerFetchForGeneration = (historyRun, requestKey, operation) => (
    historyRun?.generationId && typeof providerFetch.withAuditContext === 'function'
      ? providerFetch.withAuditContext({
        generationId: historyRun.generationId,
        telegramUserId: historyRun.telegramUserId,
        requestKey,
        operation
      })
      : providerFetch
  );
  const persistGeneratedMedia = async (generated, requestKey = null) => {
    if (generated?.type === 'text' || !mediaStorage?.persist) return generated;
    if (requestKey && generationStoredMedia.has(requestKey)) {
      return generationStoredMedia.get(requestKey);
    }
    const remoteSource = generated?.data == null && typeof generated?.url === 'string';
    const persisted = await mediaStorage.persist({
      source: generated.data ?? generated.url,
      // Polza occasionally reports a generic/incorrect MIME or omits the
      // byte size while its signed storage URL has the real headers. Let the
      // storage reader validate the downloaded object instead of rejecting a
      // valid result before Telegram ever sees it.
      mimeType: remoteSource ? undefined : generated.mimeType,
      size: remoteSource ? undefined : generated.size,
      fileName: generated.fileName
    });
    const stored = Object.freeze({
      ...generated,
      data: persisted.data,
      url: persisted.url,
      shortUrl: persisted.shortUrl,
      mimeType: persisted.mimeType ?? persisted.contentType ?? generated.mimeType,
      size: persisted.size,
      fileName: persisted.fileName ?? generated.fileName
    });
    if (requestKey) generationStoredMedia.set(requestKey, stored);
    return stored;
  };
  const notifyWithdrawalOwner = async (withdrawal) => {
    if (!config?.botOwnerId || !withdrawal?.withdrawalId || typeof telegram.sendMessage !== 'function') return;
    try {
      await telegram.sendMessage(config.botOwnerId, buildWithdrawalOwnerMessage({ withdrawal }));
    } catch (error) {
      onError(error, { action: 'referral_withdrawal_owner_notification' });
    }
  };
  const notifyWithdrawalUser = async (withdrawal, status) => {
    if (!withdrawal?.telegramId || typeof telegram.sendMessage !== 'function') return;
    const text = status === 'paid'
      ? `✅ выплата по заявке ${withdrawal.withdrawalId} отправлена. сумма: ${(withdrawal.amountKopecks / 100).toLocaleString('ru-RU')} ₽.`
      : `заявка на вывод ${withdrawal.withdrawalId} отклонена. ${(
        withdrawal.amountKopecks / 100
      ).toLocaleString('ru-RU')} ₽ возвращены в доступный партнёрский баланс.`;
    try {
      await telegram.sendMessage(withdrawal.telegramId, {
        text,
        reply_markup: { inline_keyboard: navigationRows('ref:home') }
      });
    } catch (error) {
      onError(error, { action: 'referral_withdrawal_user_notification' });
    }
  };
  const loadWelcomeSession = (chatId) => (
    stateRepository?.loadWelcomeAgentSession?.(String(chatId))
    ?? memoryWelcomeSessions.get(String(chatId))
    ?? Object.freeze({ active: false, messages: Object.freeze([]) })
  );
  const startWelcomeSession = (chatId) => {
    const key = String(chatId);
    welcomeTokens = new Map(welcomeTokens).set(key, (welcomeTokens.get(key) ?? 0) + 1);
    welcomeQueue = welcomeQueue.filter((job) => job.key !== key);
    if (welcomeInFlight.has(key)) {
      welcomeInFlight = new Map(welcomeInFlight);
      welcomeInFlight.delete(key);
    }
    if (stateRepository?.startWelcomeAgentSession) {
      return stateRepository.startWelcomeAgentSession(key);
    }
    const session = Object.freeze({ active: true, messages: Object.freeze([]) });
    memoryWelcomeSessions.set(key, session);
    return session;
  };
  const appendWelcomeMessage = (chatId, role, content) => {
    if (stateRepository?.appendWelcomeAgentMessage) {
      return stateRepository.appendWelcomeAgentMessage(String(chatId), role, content);
    }
    const current = loadWelcomeSession(chatId);
    if (!current.active) throw new Error('Welcome agent session is inactive.');
    const messages = Object.freeze([
      ...current.messages,
      Object.freeze({ role, content: String(content).trim().slice(0, 4_000) })
    ].slice(-20));
    const session = Object.freeze({ active: true, messages });
    memoryWelcomeSessions.set(String(chatId), session);
    return session;
  };
  const stopWelcomeSession = (chatId) => {
    const key = String(chatId);
    welcomeTokens = new Map(welcomeTokens).set(key, (welcomeTokens.get(key) ?? 0) + 1);
    welcomeQueue = welcomeQueue.filter((job) => job.key !== key);
    if (welcomeInFlight.has(key)) {
      welcomeInFlight = new Map(welcomeInFlight);
      welcomeInFlight.delete(key);
    }
    if (stateRepository?.stopWelcomeAgentSession) {
      return stateRepository.stopWelcomeAgentSession(key);
    }
    const session = Object.freeze({ active: false, messages: Object.freeze([]) });
    memoryWelcomeSessions.set(key, session);
    return session;
  };
  const sendWelcomeAgentMessage = async (chatId, message) => {
    const result = await telegram.sendMessage(chatId, message);
    if (result?.message_id) {
      const key = String(chatId);
      const ids = welcomeMessageIds.get(key) ?? [];
      welcomeMessageIds = new Map(welcomeMessageIds).set(
        key,
        Object.freeze([...ids, result.message_id])
      );
    }
    return result;
  };
  const deleteWelcomeAgentMessages = async (chatId) => {
    const key = String(chatId);
    const ids = welcomeMessageIds.get(key) ?? [];
    welcomeMessageIds = new Map(welcomeMessageIds);
    welcomeMessageIds.delete(key);
    if (typeof telegram.deleteMessage !== 'function') return;
    for (const messageId of ids) {
      try {
        await telegram.deleteMessage(chatId, messageId);
      } catch (error) {
        reportTelegramCleanupError(error, {
          chatId,
          messageId,
          action: 'welcome_agent_delete'
        });
      }
    }
  };
  const welcomeTokenMatches = (key, token) => (
    welcomeTokens.get(key) === token
    && loadWelcomeSession(key).active
  );
  const consumeWelcomeQuota = (chatId) => (
    stateRepository?.consumeWelcomeAgentQuota
      ? stateRepository.consumeWelcomeAgentQuota(String(chatId), new Date(now()), {
        minuteLimit: 6,
        dailyLimit: 50
      })
      : allowMemoryWelcomeRequest(chatId)
  );
  const drainWelcomeQueue = () => {
    while (
      activeWelcomeRequests < maxConcurrentWelcomeRequests
      && welcomeQueue.length > 0
    ) {
      const [job, ...remaining] = welcomeQueue;
      welcomeQueue = remaining;
      if (!welcomeTokenMatches(job.key, job.token)) {
        if (welcomeInFlight.get(job.key) === job.token) {
          welcomeInFlight = new Map(welcomeInFlight);
          welcomeInFlight.delete(job.key);
        }
        continue;
      }
      activeWelcomeRequests += 1;
      void (async () => {
        try {
          const result = await invokeLlm({
            ...job.request,
            providerKeys: config.providerKeys ?? {},
            fetchImpl: providerFetch
          });
          if (!welcomeTokenMatches(job.key, job.token)) return;
          const safeText = sanitizeWelcomeAgentOutput(result.text);
          const responseMessage = buildWelcomeAgentResponseMessage(safeText);
          await sendWelcomeAgentMessage(job.chatId, responseMessage);
          if (welcomeTokenMatches(job.key, job.token)) {
            try {
              appendWelcomeMessage(job.chatId, 'assistant', safeText);
            } catch (historyError) {
              onError(historyError, {
                chatId: job.chatId,
                action: 'welcome_agent_history'
              });
            }
          }
        } catch (error) {
          onError(error, { chatId: job.chatId, action: 'welcome_agent' });
          if (welcomeTokenMatches(job.key, job.token)) {
            try {
              await sendWelcomeAgentMessage(job.chatId, buildWelcomeAgentResponseMessage(
                'сейчас помощник не ответил. повтори сообщение чуть позже или выбери нужный раздел кнопками ниже.'
              ));
            } catch (deliveryError) {
              onError(deliveryError, {
                chatId: job.chatId,
                action: 'welcome_agent_error_delivery'
              });
            }
          }
        } finally {
          activeWelcomeRequests -= 1;
          if (welcomeInFlight.get(job.key) === job.token) {
            welcomeInFlight = new Map(welcomeInFlight);
            welcomeInFlight.delete(job.key);
          }
          drainWelcomeQueue();
        }
      })();
    }
  };
  const queueWelcomeRequest = (chatId, request, input) => {
    const key = String(chatId);
    if (welcomeInFlight.has(key)) return false;
    if (
      activeWelcomeRequests >= maxConcurrentWelcomeRequests
      && welcomeQueue.length >= maxQueuedWelcomeRequests
    ) return false;
    const token = welcomeTokens.get(key) ?? 0;
    appendWelcomeMessage(chatId, 'user', input);
    welcomeInFlight = new Map(welcomeInFlight).set(key, token);
    welcomeQueue = [...welcomeQueue, Object.freeze({ key, chatId, request, token })];
    drainWelcomeQueue();
    return true;
  };
  const welcomeQueueHasCapacity = () => (
    activeWelcomeRequests < maxConcurrentWelcomeRequests
    || welcomeQueue.length < maxQueuedWelcomeRequests
  );

  const registerReferralUser = (actor, chatId) => referralService.registerUser({
    id: actor?.id ?? chatId,
    username: actor?.username ?? '',
    first_name: actor?.first_name ?? ''
  });
  const markReferralUserStarted = (actor, chatId) => {
    const user = registerReferralUser(actor, chatId);
    referralService.markStarted?.(user?.telegramId ?? actor?.id ?? chatId);
    return user;
  };
  const runNonBlocking = (operation, context) => {
    try {
      return operation();
    } catch (error) {
      onError(error, context);
      return null;
    }
  };
  const referralAccountFor = async (telegramId) => {
    await referralService.releaseDueEarnings?.();
    return await referralService.account(telegramId);
  };
  const partnerOnboardingFor = async (telegramId) => {
    if (typeof referralService.getPartnerOnboarding !== 'function') {
      return Object.freeze({ offerAccepted: false, profile: null, payoutEnabled: false });
    }
    return await referralService.getPartnerOnboarding(telegramId);
  };
  const receiptEmailFor = async (telegramId) => {
    const key = String(telegramId);
    const cached = receiptEmails.get(key);
    if (cached) return cached;
    const stored = await historyService?.getReceiptEmail?.({ telegramUserId: key });
    if (stored) {
      receiptEmails.set(key, stored);
      return stored;
    }
    return null;
  };
  const enabledPaymentMethods = (checkout) => paymentRails?.enabledMethods?.(checkout)
    ?? ['sbp'];
  const startYooKassaCheckout = async ({
    chatId,
    actorId,
    kind,
    productId,
    durationMonths = 1,
    expectedAmountKopecks,
    origin,
    reply
  }) => {
    const backData = kind === 'plan'
      ? `billing:planinfo:${productId}:${origin}`
      : `billing:packages:${origin}`;
    if (!paymentService) {
      await reply(buildCheckoutUnavailableMessage(backData));
      return;
    }
    const plan = kind === 'plan' ? getSubscriptionPlan(productId) : null;
    const account = plan ? await referralAccountFor(actorId) : null;
    if (plan && account.subscriptionPlanId === plan.id && isPaidSubscriptionActive(account, new Date(now()))) {
      await reply(buildActiveSubscriptionMessage({ planId: plan.id, account, origin }));
      return;
    }
    const customerEmail = await receiptEmailFor(actorId);
    if (!customerEmail) {
      receiptDrafts.set(String(actorId), Object.freeze({
        kind,
        productId,
        durationMonths,
        expectedAmountKopecks,
        origin
      }));
      await reply(buildReceiptEmailPrompt(backData));
      return;
    }
    try {
      const checkout = await paymentService.createCheckout({
        kind,
        productId,
        durationMonths: kind === 'plan' ? durationMonths : 1,
        telegramUserId: String(actorId),
        telegramChatId: String(chatId),
        receiptEmail: customerEmail,
        expectedAmountKopecks,
        idempotencyKey: createHash('sha256')
          .update([actorId, kind, productId, durationMonths, Math.floor(Date.now() / 600_000)].join(':'))
          .digest('base64url')
          .slice(0, 64),
        promo: activePromoFor(actorId)
      });
      await reply(buildPaymentRedirectMessage({
        confirmationUrl: checkout.confirmationUrl,
        amountKopecks: checkout.amountKopecks,
        backData
      }));
    } catch (error) {
      onError(error, { chatId, action: 'billing_checkout' });
      if (error?.code === 'active_subscription') {
        await reply(buildActiveSubscriptionMessage({ planId: productId, account, origin }));
        return;
      }
      if (error?.code === 'checkout_quote_changed') {
        await reply(buildInvoicePlaceholderMessage({
          kind,
          productId,
          durationMonths,
          account: await referralAccountFor(actorId),
          promo: activePromoFor(actorId),
          origin,
          paymentMethods: enabledPaymentMethods({ kind, productId, durationMonths })
        }));
        return;
      }
      await reply(buildCheckoutUnavailableMessage(backData));
    }
  };
  const startCryptoUsdcCheckout = async ({
    chatId,
    actorId,
    kind,
    productId,
    durationMonths = 1,
    origin,
    reply
  }) => {
    const backData = kind === 'plan'
      ? `billing:planinfo:${productId}:${origin}`
      : `billing:packages:${origin}`;
    const service = paymentRails?.get?.('crypto_usdc');
    if (!service) {
      await reply(buildCheckoutUnavailableMessage(backData));
      return;
    }
    const plan = kind === 'plan' ? getSubscriptionPlan(productId) : null;
    const account = plan ? await referralAccountFor(actorId) : null;
    if (plan && isPaidSubscriptionActive(account, new Date(now()))) {
      if (account.subscriptionPlanId === plan.id) {
        await reply(buildActiveSubscriptionMessage({ planId: plan.id, account, origin }));
      } else {
        await reply(buildCheckoutUnavailableMessage(backData));
      }
      return;
    }
    try {
      const checkout = await service.createCheckout({
        kind,
        productId,
        durationMonths: kind === 'plan' ? durationMonths : 1,
        telegramUserId: String(actorId),
        telegramChatId: String(chatId),
        idempotencyKey: createHash('sha256')
          .update([actorId, chatId, 'crypto_usdc', kind, productId, durationMonths, Math.floor(Date.now() / 600_000)].join(':'))
          .digest('base64url')
          .slice(0, 64)
      });
      await reply(buildCryptoPaymentRedirectMessage({
        confirmationUrl: checkout.confirmationUrl,
        amountUsdcMicros: checkout.amountUsdcMicros,
        backData
      }));
    } catch (error) {
      onError(error, { chatId, action: 'billing_crypto_usdc_checkout' });
      await reply(buildCheckoutUnavailableMessage(backData));
    }
  };
  const reserveGeneration = ({ actorId, debitMetacoins, requestKey, label }) => {
    if (debitMetacoins <= 0) {
      return Object.freeze({
        ok: true,
        amount: 0,
        usesReservation: false,
        commitStarted: false
      });
    }
    if (!requestKey) throw new Error(`Paid ${label} requires a request key.`);
    if (typeof referralService.reserveMetacoins !== 'function') {
      // Keep test/downgrade compatibility with older injected services. The
      // production service always exposes the two-phase reservation API. An
      // old service can only perform an atomic debit, so do that before any
      // Telegram call and never debit it again after delivery.
      const debit = referralService.debitMetacoins({
        telegramId: actorId,
        amount: debitMetacoins,
        requestKey
      });
      if (debit?.status === 'insufficient_funds') {
        return Object.freeze({
          ok: false,
          amount: debitMetacoins,
          usesReservation: false,
          commitStarted: false,
          legacyDebit: debit
        });
      }
      if (!['debited', 'duplicate'].includes(debit?.status)) {
        throw new Error(`Paid ${label} returned an invalid debit status.`);
      }
      return Object.freeze({
        ok: true,
        amount: debitMetacoins,
        usesReservation: false,
        commitStarted: true,
        legacyDebit: debit
      });
    }
    const reservation = referralService.reserveMetacoins({
      telegramId: actorId,
      amount: debitMetacoins,
      requestKey
    });
    if (reservation?.status === 'insufficient_funds') {
      return Object.freeze({
        ok: false,
        amount: debitMetacoins,
        usesReservation: true,
        commitStarted: false,
        reservation
      });
    }
    if (!['reserved', 'duplicate'].includes(reservation?.status)) {
      throw new Error(`Paid ${label} returned an invalid reservation status.`);
    }
    return Object.freeze({
      ok: true,
      amount: debitMetacoins,
      usesReservation: true,
      commitStarted: reservation.status === 'duplicate',
      reservation
    });
  };
  const commitGeneration = async ({ actorId, debitMetacoins, requestKey, label, billing }) => {
    if (debitMetacoins <= 0) return Object.freeze({ status: 'free', balance: null });
    if (!requestKey) throw new Error(`Paid ${label} requires a request key.`);
    const debit = billing?.legacyDebit
      ?? (billing?.usesReservation
      ? referralService.commitMetacoins({
        telegramId: actorId,
        amount: debitMetacoins,
        requestKey
      })
      : referralService.debitMetacoins({
        telegramId: actorId,
        amount: debitMetacoins,
        requestKey
      }));
    if (debit?.status === 'insufficient_funds') {
      throw new Error(`Paid ${label} lost its reservation before commit.`);
    }
    const validStatuses = billing?.legacyDebit
      ? ['debited', 'duplicate']
      : billing?.usesReservation
      ? ['committed', 'duplicate']
      : ['debited', 'duplicate'];
    if (!validStatuses.includes(debit?.status)) {
      throw new Error(`Paid ${label} returned an invalid commit status.`);
    }
    try {
      await historyService?.recordMetacoinTransaction?.({
        telegramUserId: actorId,
        idempotencyKey: requestKey,
        delta: -debitMetacoins,
        balanceAfter: debit.balance,
        subscriptionMetacoinsRemainingAfter: debit.subscriptionMetacoinsRemaining,
        source: 'generation',
        referenceType: 'generation_request',
        referenceId: requestKey,
        description: `списание за ${label}`,
        metadata: {
          debitStatus: debit.status,
          spentMetacoins1d: debit.spentMetacoins1d ?? null,
          spentMetacoins30d: debit.spentMetacoins30d ?? null
        }
      });
    } catch (error) {
      // Financial commit is authoritative. An audit mirror failure must not
      // make an already delivered result look like a Telegram failure.
      onError(error, {
        actorId,
        requestKey,
        action: 'generation_metacoin_audit'
      });
    }
    return debit;
  };
  const releaseGeneration = ({ actorId, debitMetacoins, requestKey, label, billing }) => {
    if (
      debitMetacoins <= 0
      || !requestKey
      || !billing?.usesReservation
      || billing.commitStarted
      || typeof referralService.releaseMetacoins !== 'function'
    ) return;
    try {
      const released = referralService.releaseMetacoins({
        telegramId: actorId,
        amount: debitMetacoins,
        requestKey
      });
      if (!['released', 'committed'].includes(released?.status)) {
        throw new Error(`Paid ${label} returned an invalid release status.`);
      }
    } catch (error) {
      onError(error, {
        actorId,
        requestKey,
        action: 'generation_reservation_release'
      });
    }
  };
  const completeGenerationSafely = async (generationRun, payload, context = {}) => {
    try {
      await historyService?.completeGeneration?.(generationRun, payload);
    } catch (error) {
      onError(error, {
        ...context,
        action: 'generation_history_complete'
      });
    }
  };
  const failGenerationSafely = async (generationRun, error, context = {}) => {
    try {
      await historyService?.failGeneration?.(generationRun, error);
    } catch (failureError) {
      onError(failureError, {
        ...context,
        action: 'generation_history_fail'
      });
    }
  };
  const deliveryOutcomeUnknown = (error) => {
    let current = error;
    for (let depth = 0; current && depth < 3; depth += 1) {
      if (/Telegram .* network failure|Telegram .* invalid response|timeout|aborted/i.test(String(current.message ?? ''))) {
        return true;
      }
      current = current.cause;
    }
    return false;
  };
  const currentModelFor = (chatId) => pendingModels.get(chatId) ?? selections.get(chatId) ?? null;
  const userSettingsMessageFor = (chatId, source = preferencesFor(chatId)) => {
    const currentModel = currentModelFor(chatId);
    return buildUserSettingsMessage(source, currentModel && isConversationalModel(currentModel)
      ? {
          backData: `settings:${currentModel.id}`,
          backText: '‹ назад к настройкам модели'
        }
      : undefined);
  };
  const dialogHistoryMessageFor = async (telegramUserId, requestedPage = 0, currentModel = null) => {
    const ownerKey = String(telegramUserId);
    const pageIndex = Number.isInteger(requestedPage) && requestedPage >= 0
      ? requestedPage
      : 0;
    const knownCursors = pageIndex === 0
      ? [null]
      : [...(dialogHistoryCursors.get(ownerKey) ?? [null])];
    const cursor = knownCursors[pageIndex];
    const resolvedPage = cursor === undefined ? 0 : pageIndex;
    const result = await historyService?.listDialogs?.({
      telegramUserId,
      limit: 8,
      ...(knownCursors[resolvedPage] ? { cursor: knownCursors[resolvedPage] } : {}),
      status: 'active',
      kind: 'model'
    }) ?? { items: [] };
    const nextCursors = knownCursors.slice(0, resolvedPage + 1);
    if (result.nextCursor) nextCursors[resolvedPage + 1] = result.nextCursor;
    dialogHistoryCursors.set(ownerKey, nextCursors);
    return normalizeDialogHistoryMessage(buildDialogHistoryMessage({
      ...result,
      pageIndex: resolvedPage,
      hasPrevious: resolvedPage > 0,
      hasNext: Boolean(result.nextCursor)
    }), currentModel);
  };
  const dialogThreadMessageFor = async (telegramUserId, conversationId) => buildDialogThreadMessage(
    await historyService?.getDialog?.({
      telegramUserId,
      conversationId,
      limit: 16
    })
  );

  const sanitizePreferences = (source) => Object.entries(source ?? {}).reduce(
    (current, [key, value]) => applyUserPreference(current, key, value),
    defaultUserPreferences()
  );
  const persistState = (chatId, patch) => stateRepository?.saveUserState(String(chatId), patch);
  const activePromoFor = (chatId) => {
    const code = promoCodes.get(chatId);
    if (!code || !stateRepository) return null;
    return stateRepository.findPromo(code);
  };
  const grantStoredPromo = (chatId, code) => {
    if (!code || !stateRepository || !referralService.grantPromoMetacoins) return;
    const promo = stateRepository.findPromo(code);
    if (promo?.rewardType !== 'metacoins') return;
    referralService.grantPromoMetacoins({
      telegramId: chatId,
      promoCode: promo.code,
      amount: promo.rewardValue
    });
  };
  const hydrateState = (chatId) => {
    if (!stateRepository || hydratedUsers.has(chatId)) return;
    const stored = stateRepository.loadUserState(String(chatId));
    const selected = getModelById(stored.selectedModelId);
    if (selected?.availability === 'available') selections.set(chatId, selected);
    const selectedAgent = getAgentById(stored.selectedAgentId);
    if (selectedAgent) selectedAgents.set(chatId, selectedAgent);
    const safeSettings = sanitizeStoredModelSettings(stored.modelSettings);
    if (Object.keys(safeSettings).length) modelSettings.set(chatId, safeSettings);
    const safeAgentSettings = sanitizeAgentSettingsStore(stored.agentSettings);
    if (Object.keys(safeAgentSettings).length) agentSettings.set(chatId, safeAgentSettings);
    userPreferences.set(chatId, sanitizePreferences(stored.preferences));
    if (stored.activePromoCode) {
      promoCodes.set(chatId, stored.activePromoCode);
      grantStoredPromo(chatId, stored.activePromoCode);
    }
    hydratedUsers.add(chatId);
  };
  const saveSelection = (chatId, model = null) => {
    if (model) selections.set(chatId, model);
    else selections.delete(chatId);
    persistState(chatId, { selectedModelId: model?.id ?? null });
  };
  const saveAgentSelection = (chatId, agent = null) => {
    if (agent) selectedAgents.set(chatId, agent);
    else selectedAgents.delete(chatId);
    persistState(chatId, { selectedAgentId: agent?.id ?? null });
  };
  const clearActiveSelection = (chatId) => {
    pendingModels.delete(chatId);
    pendingScenarios.delete(chatId);
    videoConstructorDrafts.delete(chatId);
    videoUploadTargets.delete(chatId);
    saveSelection(chatId);
    saveAgentSelection(chatId);
    selectedEntertainments.delete(chatId);
    entertainmentFlowStates.delete(chatId);
    activeMusicConstructors.delete(chatId);
  };
  const settingsFor = (chatId, model) => {
    const stored = modelSettings.get(chatId)?.[model.id];
    return sanitizeStoredModelSettings({ [model.id]: stored ?? defaultModelSettings(model) })[model.id]
      ?? defaultModelSettings(model);
  };
  const saveSettings = (chatId, model, settings) => {
    const updated = { ...(modelSettings.get(chatId) ?? {}), [model.id]: settings };
    modelSettings.set(chatId, updated);
    persistState(chatId, { modelSettings: updated });
  };
  const agentSettingsFor = (chatId, agent) => (
    agentSettings.get(chatId)?.[agent.id] ?? defaultAgentSettings(agent)
  );
  const saveAgentSettings = (chatId, agent, settings) => {
    const updated = { ...(agentSettings.get(chatId) ?? {}), [agent.id]: settings };
    agentSettings.set(chatId, updated);
    persistState(chatId, { agentSettings: updated });
  };
  const preferencesFor = (chatId) => userPreferences.get(chatId) ?? defaultUserPreferences();
  const savePreferences = (chatId, preferences) => {
    userPreferences.set(chatId, preferences);
    persistState(chatId, { preferences });
  };
  const rememberReplay = ({ chatId, actorId, kind, request }) => {
    const currentTime = Number(now());
    for (const [token, entry] of replayRequests) {
      if (entry.expiresAt <= currentTime) replayRequests.delete(token);
    }
    replaySequence += 1;
    const token = createHash('sha256')
      .update(`${chatId}:${actorId}:${kind}:${currentTime}:${replaySequence}`)
      .digest('base64url')
      .slice(0, 20);
    const normalizedRequest = Object.freeze({
      ...request,
      ...(Array.isArray(request.inputs) ? { inputs: Object.freeze([...request.inputs]) } : {})
    });
    replayRequests.set(token, Object.freeze({
      chatId: String(chatId),
      actorId: String(actorId),
      kind,
      request: normalizedRequest,
      expiresAt: currentTime + 30 * 60_000
    }));
    return token;
  };
  const takeReplay = ({ token, chatId, actorId }) => {
    const entry = replayRequests.get(token);
    replayRequests.delete(token);
    if (
      !entry
      || entry.expiresAt <= Number(now())
      || entry.chatId !== String(chatId)
      || entry.actorId !== String(actorId)
    ) return null;
    return entry;
  };
  const markReplayForDeliveryRetry = (token, requestKey) => {
    if (!token || !requestKey) return;
    const entry = replayRequests.get(token);
    if (!entry) return;
    replayRequests.set(token, Object.freeze({
      ...entry,
      deliveryRetryRequestKey: requestKey
    }));
  };
  const deliverUi = async (chatId, message, editableMessageId) => {
    const mediaKey = message?.menuMediaKey;
    const media = menuMedia?.[mediaKey] ?? null;
    const telegramMessage = Object.fromEntries(
      Object.entries(message ?? {}).filter(([key]) => key !== 'menuMediaKey')
    );
    const currentMessageId = uiMessageIds.get(chatId) ?? editableMessageId;
    const generationStatusMessageId = generationStatusMessageIds.get(chatId);
    const replacesGenerationStatus = generationStatusMessageId === currentMessageId;

    if (
      media
      && uiMediaKeys.get(chatId) === mediaKey
      && currentMessageId
      && typeof telegram.editMessageCaption === 'function'
    ) {
      try {
        const result = await telegram.editMessageCaption(chatId, currentMessageId, {
          caption: telegramMessage.text,
          parse_mode: telegramMessage.parse_mode,
          reply_markup: telegramMessage.reply_markup
        });
        uiMessageIds.set(chatId, currentMessageId);
        if (replacesGenerationStatus) {
          generationStatusMessageIds.delete(chatId);
          generationProtectedMessageIds.set(chatId, currentMessageId);
        }
        return result;
      } catch (error) {
        onError(error, { chatId, messageId: currentMessageId, action: 'edit_menu_media_caption' });
      }
    }

    if (
      !media
      && !uiMediaKeys.has(chatId)
      && editableMessageId
      && typeof telegram.editMessageText === 'function'
    ) {
      try {
        const result = await telegram.editMessageText(
          chatId,
          editableMessageId,
          telegramMessage
        );
        uiMessageIds.set(chatId, editableMessageId);
        if (replacesGenerationStatus) {
          generationStatusMessageIds.delete(chatId);
          generationProtectedMessageIds.set(chatId, editableMessageId);
        }
        return result;
      } catch (error) {
        onError(error, { chatId, editableMessageId });
      }
    }

    const previousIds = new Set(
      [media ? editableMessageId : null, uiMessageIds.get(chatId)]
        .filter((value) => value !== undefined && value !== null)
    );
    if (typeof telegram.deleteMessage === 'function') {
      for (const previousId of previousIds) {
        try {
          await telegram.deleteMessage(chatId, previousId);
        } catch (error) {
          reportTelegramCleanupError(error, { chatId, previousId });
        }
      }
    }
    uiMessageIds.delete(chatId);
    uiMediaKeys.delete(chatId);
    if (replacesGenerationStatus) generationStatusMessageIds.delete(chatId);
    const cachedPhotoFileId = mediaKey ? menuPhotoFileIds.get(mediaKey) : null;
    const result = media && typeof telegram.sendPhoto === 'function'
      ? await telegram.sendPhoto(chatId, cachedPhotoFileId ?? media.data, {
        caption: telegramMessage.text,
        parse_mode: telegramMessage.parse_mode,
        reply_markup: telegramMessage.reply_markup,
        mimeType: media.mimeType,
        size: media.size,
        fileName: media.fileName
      })
      : await telegram.sendMessage(chatId, telegramMessage);
    if (result?.message_id) uiMessageIds.set(chatId, result.message_id);
    if (replacesGenerationStatus) {
      generationProtectedMessageIds.delete(chatId);
      if (result?.message_id) generationProtectedMessageIds.set(chatId, result.message_id);
    }
    if (media && mediaKey) {
      const fileId = result?.photo?.at(-1)?.file_id;
      if (typeof fileId === 'string' && fileId.length > 0) menuPhotoFileIds.set(mediaKey, fileId);
      uiMediaKeys.set(chatId, mediaKey);
    }
    return result;
  };
  const deliverGenerationStatus = async (chatId, message) => {
    const result = await deliverUi(chatId, message);
    if (result?.message_id) generationStatusMessageIds.set(chatId, result.message_id);
    return result;
  };
  const clearGenerationUi = async (chatId) => {
    const statusMessageId = generationStatusMessageIds.get(chatId);
    const protectedMessageId = generationProtectedMessageIds.get(chatId);
    const currentMessageId = uiMessageIds.get(chatId);
    const messageIds = new Set(
      [
        statusMessageId,
        // A user may open the profile/menu while a provider is still running.
        // Only remove the current UI when it is the processing message itself;
        // never delete a newer screen that the user explicitly opened.
        ...(currentMessageId === statusMessageId ? [currentMessageId] : [])
      ]
        .filter((messageId) => messageId && messageId !== protectedMessageId)
    );
    generationStatusMessageIds.delete(chatId);
    generationProtectedMessageIds.delete(chatId);
    for (const messageId of messageIds) {
      if (typeof telegram.deleteMessage !== 'function') break;
      try {
        await telegram.deleteMessage(chatId, messageId);
      } catch (error) {
        reportTelegramCleanupError(error, { chatId, messageId, action: 'generation_processing_cleanup' });
      }
      if (uiMessageIds.get(chatId) === messageId) uiMessageIds.delete(chatId);
    }
    uiMediaKeys.delete(chatId);
  };
  const deliverResult = async (chatId, text, model, backData = null, resultRows = []) => {
    await clearGenerationUi(chatId);
    const result = await telegram.sendMessage(chatId, {
      text,
      reply_markup: {
        inline_keyboard: [
          ...resultRows,
          ...navigationRows(backData ?? (model ? `model:${model.id}` : 'task:menu'))
        ]
      }
    });
    if (result?.message_id) uiMessageIds.set(chatId, result.message_id);
    return result;
  };
  const deliverGeneratedMedia = async (
    chatId,
    generated,
    model,
    { chargedMetacoins = 0, regenerateCallbackData = null, prompt = '', requestKey = null } = {}
  ) => {
    await clearGenerationUi(chatId);

    const storedGenerated = await persistGeneratedMedia(generated, requestKey);
    const resultRows = buildGenerationResultRows({
      regenerateCallbackData,
      settingsCallbackData: model?.id ? `settings:${model.id}` : null,
      downloadUrl: storedGenerated.shortUrl ?? storedGenerated.url
    });

    if (storedGenerated.type === 'text') {
      const result = await deliverResult(chatId, storedGenerated.text, model, null, resultRows);
      return Object.freeze({ result, generated: storedGenerated });
    }

    const options = {
      caption: buildGeneratedMediaCaption({
        category: model.category,
        name: model.name,
        prompt,
        chargedMetacoins
      }),
      parse_mode: 'HTML',
      mimeType: storedGenerated.mimeType,
      size: storedGenerated.size,
      fileName: storedGenerated.fileName,
      reply_markup: {
        inline_keyboard: [
          ...resultRows,
          ...navigationRows(`model:${model.id}`)
        ]
      }
    };
    const sender = {
      image: telegram.sendPhoto?.bind(telegram),
      video: telegram.sendVideo?.bind(telegram),
      audio: telegram.sendAudio?.bind(telegram),
      document: telegram.sendDocument?.bind(telegram)
    }[storedGenerated.type];
    if (!sender) throw new Error(`Unsupported generated result type: ${storedGenerated.type}`);
    const mediaSource = storedGenerated.data ?? storedGenerated.url;
    const result = await sender(chatId, mediaSource, options);
    if (result?.message_id) uiMessageIds.set(chatId, result.message_id);
    return Object.freeze({ result, generated: storedGenerated });
  };
  const executeSelectedRequest = async ({
    chatId,
    actorId = chatId,
    actorUsername = '',
    selected,
    inputs,
    prompt = '',
    requestKey,
    telegramInput,
    settings = null,
    historyMetadata = null
  }) => {
    const activeScenario = pendingScenarios.get(chatId) ?? null;
    const preparedTelegramInput = applyScenarioTelegramInput(
      activeScenario,
      telegramInput
    );
    if (selected.availability !== 'available') {
      pendingModels.delete(chatId);
      saveSelection(chatId);
      await deliverUi(chatId, buildModelCard(selected));
      return;
    }

    const nativeSettings = settings ?? settingsFor(chatId, selected);
    let normalizedToolInputs = null;
    const preferenceText = selected.category === 'llm'
      ? preferenceInstructions(preferencesFor(chatId))
      : '';
    const requestSettings = selected.category === 'llm'
      ? {
          ...nativeSettings,
          instructions: [nativeSettings.instructions, preferenceText].filter(Boolean).join('\n')
        }
      : nativeSettings;
    let usage = selected.category === 'voice'
      ? { characters: Array.from(String(prompt ?? '')).length }
      : selected.category === 'llm'
        ? {
            // UTF-8 bytes are a conservative upper bound for tokenizer units.
            inputTokens: Buffer.byteLength(
              [requestSettings.instructions, prompt].filter(Boolean).join('\n'),
              'utf8'
            ),
            outputTokens: Number.parseInt(
              requestSettings.max_tokens
                ?? requestSettings.max_completion_tokens
                ?? requestSettings.max_output_tokens
                ?? 900,
              10
            )
          }
      : {};
    if (selected.source !== 'tool' && selected.category === 'image') {
      // FLUX.2 bills input references separately from the output megapixels.
      // Quote the exact number the user is about to submit before any provider
      // request is accepted, otherwise a multi-reference edit can consume an
      // unreserved portion of the RouterAI balance.
      usage = {
        imageReferences: collectAgentTelegramMedia(preparedTelegramInput).imageIds.length
      };
    }
    if (selected.source === 'tool') {
      try {
        normalizedToolInputs = normalizeTelegramInputs(selected.id, preparedTelegramInput);
        validateToolInputs(selected.id, normalizedToolInputs);
        validateScenarioInputs(activeScenario, normalizedToolInputs);
        usage = toolUsageFromInputs(normalizedToolInputs);
      } catch {
        await deliverUi(
          chatId,
          activeScenario ? buildScenarioMessage(activeScenario) : buildModelCard(selected)
        );
        return;
      }
    }
    const toolMediaSummary = normalizedToolInputs ? Object.freeze({
      mode: 'tool_inputs',
      references: Object.freeze({
        image: ['image', 'person_image', 'garment_image'].reduce(
          (count, key) => count + (normalizedToolInputs[key] ? 1 : 0),
          Array.isArray(normalizedToolInputs.images) ? normalizedToolInputs.images.length : 0
        ) + (Array.isArray(normalizedToolInputs.reference_images) ? normalizedToolInputs.reference_images.length : 0),
        video: normalizedToolInputs.video ? 1 : normalizedToolInputs.media?.type === 'video' ? 1 : 0,
        audio: (normalizedToolInputs.audio ? 1 : 0)
          + (normalizedToolInputs.reference_audio ? 1 : 0)
          + (normalizedToolInputs.media?.type === 'audio' ? 1 : 0),
        total: Object.entries(normalizedToolInputs).reduce((count, [key, value]) => {
          if (!['image', 'images', 'person_image', 'garment_image', 'reference_images', 'video', 'audio', 'reference_audio', 'media'].includes(key)) return count;
          return count + (Array.isArray(value) ? value.length : value ? 1 : 0);
        }, 0)
      })
    }) : null;
    const basePriceMetacoins = calculateModelMetacoinPrice(selected, nativeSettings, usage);
    const providerFloorMetacoins = calculateModelProviderFloorMetacoins(
      selected,
      nativeSettings,
      usage
    );
    const generationPromo = activePromoFor(actorId);
    const priceMetacoins = generationPromo?.active
      && generationPromo.rewardType === 'discount_percent'
      && generationPromo.modelIds?.includes(selected.id)
      ? Math.max(
          providerFloorMetacoins,
          Math.ceil(basePriceMetacoins * (100 - generationPromo.rewardValue) / 100)
        )
      : basePriceMetacoins;
    const historyKind = selected.category === 'llm'
      ? 'text'
      : ['image', 'video', 'audio', 'music', 'voice', 'document', '3d'].includes(selected.category)
        ? selected.category
        : 'tool';
    const account = await referralAccountFor(actorId);
    const fullAccess = hasFullAccess({
      username: actorUsername,
      actorId,
      ownerId: config.botOwnerId
    });
    const access = fullAccess && config.ownerMeteredAccess !== true
      ? Object.freeze({ allowed: true, reason: null, debitMetacoins: 0 })
      : decideModelAccess({
        account,
        modelId: selected.id,
        priceMetacoins,
        freeModelIds: FREE_MODEL_IDS,
        now: new Date(now())
      });
    if (!access.allowed) {
      await historyService?.recordEvent?.({
        eventName: 'generation.access.blocked',
        category: 'billing',
        telegramUserId: String(actorId),
        telegramChatId: String(chatId),
        requestKey,
        subjectType: selected.source === 'tool' ? 'tool' : 'model',
        subjectId: selected.id,
        metadata: {
          reason: access.reason,
          subscriptionPlanId: account.subscriptionPlanId,
          subscriptionExpiresAt: account.subscriptionExpiresAt ?? null,
          balanceMetacoins: account.metacoinBalance,
          quotedMetacoins: priceMetacoins
        }
      });
      await deliverUi(
        chatId,
        buildGenerationAccessMessage(access.reason, null, `model:${selected.id}`)
      );
      return;
    }

    if (selected.source !== 'tool') {
      const allowedInputs = cardProfileFor(selected).inputs;
      const unsupportedInputs = inputs.filter((input) => !allowedInputs.includes(input));
      if (unsupportedInputs.length > 0) {
        await deliverResult(chatId, unsupportedInputMessage(selected, allowedInputs), selected);
        return;
      }
      const contractError = inputContractError(selected, inputs);
      if (contractError) {
        await deliverResult(chatId, contractError, selected);
        return;
      }
    }

    const freeEntitlement = freeEntitlementFor(selected.id);
    let freeQuotaClaimed = false;
    const releaseFreeQuota = async () => {
      if (!freeQuotaClaimed || !requestKey || !freeEntitlement) return;
      await historyService?.releaseFreeWeeklyRequest?.({
        telegramUserId: actorId,
        requestKey,
        quotaKey: freeEntitlement.quotaKey
      });
      freeQuotaClaimed = false;
    };
    if (freeEntitlement && !fullAccess && account.subscriptionPlanId === 'newcomer') {
      const quota = requestKey
        ? historyService?.claimFreeWeeklyRequest
          ? await historyService.claimFreeWeeklyRequest({
              telegramUserId: actorId,
              requestKey,
              quotaKey: freeEntitlement.quotaKey,
              requestLimit: freeEntitlement.weeklyLimit
            })
          : Object.freeze({
              allowed: true,
              used: 0,
              limit: freeEntitlement.weeklyLimit,
              remaining: freeEntitlement.weeklyLimit,
              duplicate: true
            })
        : null;
      if (!quota) {
        await deliverUi(chatId, buildGenerationAccessMessage(
          'free_quota_unavailable',
          freeEntitlement
        ));
        return;
      }
      if (!quota.allowed) {
        await deliverUi(chatId, buildGenerationAccessMessage(
          'weekly_free_limit',
          freeEntitlement
        ));
        return;
      }
      freeQuotaClaimed = !quota.duplicate;
    }

    const canCallFreeModel = Boolean(
      freeEntitlement
      && selected.category === 'llm'
      && (isFreeLlmTestAllowed(config) || isPaidCallAllowed(config))
    );
    const canCallPaidLlm = Boolean(selected.category === 'llm' && isPaidCallAllowed(config));
    if ((canCallFreeModel || canCallPaidLlm) && selected.category === 'llm') {
      const activeRequest = requestKey ? llmRequestPromises.get(requestKey) : null;
      if (activeRequest) {
        await activeRequest;
        return;
      }
      let releaseRequest = null;
      let requestPromise = null;
      if (requestKey) {
        requestPromise = new Promise((resolve) => {
          releaseRequest = resolve;
        });
        llmRequestPromises.set(requestKey, requestPromise);
      }
      try {
      let result = requestKey ? generationResults.get(requestKey) : null;
      if (!result && !allowRequest(chatId)) {
        await releaseFreeQuota();
        await deliverResult(chatId, 'слишком много запросов за минуту. попробуй снова чуть позже.', selected);
        return;
      }
      let billing = null;
      if (!result) {
        await deliverGenerationStatus(chatId, buildGenerationStatusMessage({
          category: selected.category,
          name: selected.name,
          subjectType: 'model'
        }));
        const historyRun = await historyService?.startGeneration?.({
          telegramUserId: actorId,
          telegramChatId: chatId,
          requestKey,
          kind: 'text',
          subjectType: 'model',
          subjectId: selected.id,
          title: selected.name,
          prompt,
          parameters: requestSettings,
          inputTypes: inputs,
          metacoinsQuoted: priceMetacoins
        });
        if (historyRun && requestKey) generationHistoryRuns.set(requestKey, historyRun);
        billing = reserveGeneration({
          actorId,
          debitMetacoins: access.debitMetacoins,
          requestKey,
          label: 'generation'
        });
        if (!billing.ok) {
          await releaseFreeQuota();
          if (requestKey) generationHistoryRuns.delete(requestKey);
          await deliverUi(chatId, buildGenerationAccessMessage('insufficient_metacoins'));
          return;
        }
        try {
          result = await invokeLlm({
            prompt: prompt.trim(),
            providerKeys: config.providerKeys,
            settings: requestSettings,
            allowSecondaryProviders: canCallPaidLlm,
            fetchImpl: providerFetchForGeneration(historyRun, requestKey, 'generation.llm'),
            ...(selected.provider ? { provider: selected.provider } : {}),
            ...(selected.providerModels ? { providerModels: selected.providerModels } : {})
          });
        } catch (error) {
          releaseGeneration({
            actorId,
            debitMetacoins: access.debitMetacoins,
            requestKey,
            label: 'generation',
            billing
          });
          await releaseFreeQuota();
          await failGenerationSafely(historyRun, error, { actorId, requestKey });
          if (requestKey) generationHistoryRuns.delete(requestKey);
          throw new ProviderRequestError('The selected provider did not complete the request.', { cause: error });
        }
        if (requestKey) generationResults.set(requestKey, result);
      }
      const modelLabel = '';
      const canRepeat = !isConversationalModel(selected);
      billing ??= reserveGeneration({
        actorId,
        debitMetacoins: access.debitMetacoins,
        requestKey,
        label: 'generation'
      });
      if (!billing.ok) {
        if (requestKey) generationResults.delete(requestKey);
        await deliverUi(chatId, buildGenerationAccessMessage('insufficient_metacoins'));
        return;
      }
      let commitStarted = billing.commitStarted;
      let deliveryConfirmed = false;
      let retryCallbackData = null;
      let retryToken = null;
      try {
        const replayToken = rememberReplay({
          chatId,
          actorId,
          kind: 'model',
          request: {
            chatId,
            actorId,
            actorUsername,
            selected,
            inputs,
            prompt,
            telegramInput
          }
        });
        retryToken = replayToken;
        retryCallbackData = `repeat:${replayToken}`;
        await deliverResult(
          chatId,
          `${modelLabel}${result.text}`,
          selected,
          null,
          buildGenerationResultRows({
            regenerateCallbackData: canRepeat ? `repeat:${replayToken}` : null,
            settingsCallbackData: `settings:${selected.id}`,
            newActionButton: buildModelActionButton(selected)
          })
        );
        deliveryConfirmed = true;
        commitStarted = true;
        await commitGeneration({
          actorId,
          debitMetacoins: access.debitMetacoins,
          requestKey,
          label: 'generation',
          billing
        });
        await completeGenerationSafely(
          requestKey ? generationHistoryRuns.get(requestKey) : null,
          {
            outputText: result.text,
            outputType: 'text',
            metacoinsCharged: access.debitMetacoins,
            provider: result.provider,
            providerModelId: result.model ?? null
          },
          { actorId, requestKey }
        );
        if (requestKey) generationHistoryRuns.delete(requestKey);
        if (requestKey) generationResults.delete(requestKey);
      } catch (error) {
        if (deliveryConfirmed) {
          markReplayForDeliveryRetry(retryToken, requestKey);
          onError(error, {
            actorId,
            requestKey,
            action: 'generation_post_delivery_finalize'
          });
          return;
        }
        markReplayForDeliveryRetry(retryToken, requestKey);
        if (!deliveryOutcomeUnknown(error)) {
          releaseGeneration({
            actorId,
            debitMetacoins: access.debitMetacoins,
            requestKey,
            label: 'generation',
            billing: { ...billing, commitStarted }
          });
        }
        await failGenerationSafely(
          requestKey ? generationHistoryRuns.get(requestKey) : null,
          new ResultDeliveryError('Generated result delivery failed.', { cause: error }),
          { actorId, requestKey }
        );
        throw new ResultDeliveryError('Telegram did not accept the generated result.', {
          cause: error,
          retryCallbackData
        });
      }
      return;
      } finally {
        releaseRequest?.();
        if (requestKey && llmRequestPromises.get(requestKey) === requestPromise) {
          llmRequestPromises.delete(requestKey);
        }
      }
    }

    const executableMediaRequest = (
      selected.source === 'tool'
      || (selected.source !== 'tool' && [
        'image', 'video', 'audio', 'voice', 'document', '3d'
      ].includes(selected.category))
    ) && isPaidCallAllowed(config);
    if (executableMediaRequest) {
      const subjectType = selected.source === 'tool' ? 'tool' : 'model';
      let result = requestKey ? generationResults.get(requestKey) : null;
      let billing = null;
      if (!result && !allowRequest(chatId)) {
        await releaseFreeQuota();
        await deliverResult(chatId, 'слишком много запросов за минуту. попробуй снова чуть позже.', selected);
        return;
      }
      if (!result) {
        await deliverGenerationStatus(chatId, buildGenerationStatusMessage({
          category: selected.category,
          name: selected.name,
          subjectType
        }));
        const historyRun = await historyService?.startGeneration?.({
          telegramUserId: actorId,
          telegramChatId: chatId,
          requestKey,
          kind: historyKind,
          subjectType,
          subjectId: selected.id,
          title: selected.name,
          prompt,
          parameters: historyMetadata
            ? { ...nativeSettings, constructor: historyMetadata }
            : toolMediaSummary
              ? { ...nativeSettings, media: toolMediaSummary }
              : nativeSettings,
          inputTypes: inputs,
          metacoinsQuoted: priceMetacoins
        });
        if (historyRun && requestKey) generationHistoryRuns.set(requestKey, historyRun);
        // Reserve before starting a chargeable media job.  Media providers can
        // accept work asynchronously, so charging only after their response
        // creates a real race: a concurrent debit can leave an accepted paid
        // request without enough user balance to settle it.
        billing = reserveGeneration({
          actorId,
          debitMetacoins: access.debitMetacoins,
          requestKey,
          label: 'tool generation'
        });
        if (!billing.ok) {
          await releaseFreeQuota();
          if (requestKey) generationHistoryRuns.delete(requestKey);
          await deliverUi(chatId, buildGenerationAccessMessage('insufficient_metacoins'));
          return;
        }
        try {
          const auditContext = {
            generationId: historyRun?.generationId,
            telegramUserId: historyRun?.telegramUserId,
            requestKey,
            operation: subjectType === 'tool' ? 'generation.tool' : 'generation.media'
          };
          result = subjectType === 'tool'
            ? await executeTool({
                toolId: selected.id,
                telegramInput: preparedTelegramInput,
                settings: nativeSettings,
                auditContext
              })
            : await executeMediaModel({
                model: selected,
                settings: nativeSettings,
                telegramInput: preparedTelegramInput,
                auditContext
              });
        } catch (error) {
          releaseGeneration({
            actorId,
            debitMetacoins: access.debitMetacoins,
            requestKey,
            label: 'tool generation',
            billing
          });
          await releaseFreeQuota();
          await failGenerationSafely(historyRun, error, { actorId, requestKey });
          if (requestKey) generationHistoryRuns.delete(requestKey);
          throw new ProviderRequestError('The selected provider did not complete the request.', { cause: error });
        }
        if (requestKey) generationResults.set(requestKey, result);
      }
      billing ??= reserveGeneration({
        actorId,
        debitMetacoins: access.debitMetacoins,
        requestKey,
        label: 'tool generation'
      });
      if (!billing.ok) {
        if (requestKey) generationResults.delete(requestKey);
        if (requestKey) generationStoredMedia.delete(requestKey);
        await deliverUi(chatId, buildGenerationAccessMessage('insufficient_metacoins'));
        return;
      }
      let commitStarted = billing.commitStarted;
      let deliveryConfirmed = false;
      let retryCallbackData = null;
      let retryToken = null;
      try {
        const canRepeat = !isConversationalModel(selected);
        const replayToken = rememberReplay({
          chatId,
          actorId,
          kind: 'model',
          request: {
            chatId,
            actorId,
            actorUsername,
            selected,
            inputs,
            prompt,
            telegramInput
          }
        });
        retryToken = replayToken;
        retryCallbackData = `repeat:${replayToken}`;
        const delivery = await deliverGeneratedMedia(chatId, result, selected, {
          chargedMetacoins: access.debitMetacoins,
          regenerateCallbackData: canRepeat ? `repeat:${replayToken}` : null,
          prompt,
          requestKey
        });
        deliveryConfirmed = true;
        commitStarted = true;
        await commitGeneration({
          actorId,
          debitMetacoins: access.debitMetacoins,
          requestKey,
          label: 'tool generation',
          billing
        });
        await completeGenerationSafely(
          requestKey ? generationHistoryRuns.get(requestKey) : null,
          {
            outputType: result.type ?? historyKind,
            metacoinsCharged: access.debitMetacoins,
            provider: result.provider ?? null,
            providerModelId: result.model ?? null,
            metadata: {
              url: delivery.generated.shortUrl ?? delivery.generated.url ?? null,
              mimeType: delivery.generated.mimeType ?? null,
              size: delivery.generated.size ?? null,
              providerCostRubles: Number.isFinite(result.providerCostRubles)
                ? result.providerCostRubles
                : null
            }
          },
          { actorId, requestKey }
        );
        if (requestKey) generationHistoryRuns.delete(requestKey);
        if (requestKey) generationResults.delete(requestKey);
        if (requestKey) generationStoredMedia.delete(requestKey);
      } catch (error) {
        if (deliveryConfirmed) {
          markReplayForDeliveryRetry(retryToken, requestKey);
          onError(error, {
            actorId,
            requestKey,
            action: 'generation_post_delivery_finalize'
          });
          return;
        }
        markReplayForDeliveryRetry(retryToken, requestKey);
        if (!deliveryOutcomeUnknown(error)) {
          releaseGeneration({
            actorId,
            debitMetacoins: access.debitMetacoins,
            requestKey,
            label: 'tool generation',
            billing: { ...billing, commitStarted }
          });
        }
        await failGenerationSafely(
          requestKey ? generationHistoryRuns.get(requestKey) : null,
          new ResultDeliveryError('Generated result delivery failed.', { cause: error }),
          { actorId, requestKey }
        );
        throw new ResultDeliveryError('Telegram did not accept the generated result.', {
          cause: error,
          retryCallbackData
        });
      }
      return;
    }

    await deliverResult(chatId, buildTestModeReply(selected.category, selected.name), selected);
  };
  const runSelectedRequest = async (request) => {
    try {
      await executeSelectedRequest(request);
    } catch (error) {
      if (error instanceof ResultDeliveryError) {
        onError(error, {
          chatId: request.chatId,
          modelId: request.selected?.id,
          action: 'generation_delivery'
        });
        try {
          await deliverUi(
            request.chatId,
            buildDeliveryErrorMessage(request.selected, error.retryCallbackData)
          );
        } catch (deliveryError) {
          onError(deliveryError, {
            chatId: request.chatId,
            modelId: request.selected?.id,
            action: 'generation_delivery_error_notice'
          });
        }
        return;
      }
      onError(error, { chatId: request.chatId, modelId: request.selected?.id, action: 'generation' });
      const message = error instanceof ProviderRequestError
        ? buildProviderErrorMessage(request.selected)
        : buildAggregatorErrorMessage(request.selected);
      try {
        await deliverUi(request.chatId, message);
      } catch (deliveryError) {
        onError(deliveryError, {
          chatId: request.chatId,
          modelId: request.selected?.id,
          action: 'generation_error_notice'
        });
      }
    }
  };
  const executeSelectedAgentRequest = async ({
    chatId,
    actorId = chatId,
    actorUsername = '',
    agent,
    prompt,
    requestKey,
    telegramInput = null,
    entertainment = null,
    entertainmentFlow = null
  }) => {
    const collectedMedia = collectAgentTelegramMedia(telegramInput);
    const collectedMediaCounts = agentMediaCounts(collectedMedia);
    const preprocessSpecs = agentPreprocessSpecs(collectedMedia);
    const effectivePrompt = String(prompt ?? '').trim()
      || defaultAgentPromptForMedia(collectedMediaCounts);
    if (!effectivePrompt) {
      await deliverUi(chatId, buildAgentSelectedMessage(agent));
      return;
    }
    const preflightMedia = collectedMedia.imageIds.map((_, index) => ({
      type: 'image',
      url: `https://metaflora.invalid/agent-reference-${index + 1}.png`
    }));
    let request;
    try {
      request = buildAgentLlmRequest({
        agent,
        userPrompt: effectivePrompt,
        agentSettings: agentSettingsFor(chatId, agent),
        preferenceText: preferenceInstructions(preferencesFor(chatId)),
        media: preflightMedia
      });
    } catch (error) {
      if (collectedMedia.imageIds.length && /attachments/iu.test(error.message)) {
        await deliverResult(chatId, 'этот ИИ-агент пока не принимает изображения. выбери агента с поддержкой визуального анализа.', null, `agent:${agent.id}`);
        return;
      }
      throw error;
    }
    const mediaHistory = collectedMediaCounts.total > 0
      ? Object.freeze({
        mode: 'agent_media',
        references: collectedMediaCounts,
        ...(collectedMedia.imageIds.length ? { directVision: true } : {}),
        ...(preprocessSpecs.length
          ? { preprocessTools: Object.freeze(preprocessSpecs.map(({ toolId }) => toolId)) }
          : {})
      })
      : null;
    const priceMetacoins = calculateAgentRunPrice(agent)
      + agentPreprocessPriceMetacoins(preprocessSpecs);
    const fullAccess = hasFullAccess({
      username: actorUsername,
      actorId,
      ownerId: config.botOwnerId
    });
    const access = fullAccess && config.ownerMeteredAccess !== true
      ? Object.freeze({ allowed: true, reason: null, debitMetacoins: 0 })
      : decideModelAccess({
        account: await referralAccountFor(actorId),
        modelId: request.modelId,
        priceMetacoins,
        freeModelIds: FREE_MODEL_IDS,
        now: new Date(now())
      });
    if (!access.allowed) {
      await deliverUi(chatId, buildGenerationAccessMessage(access.reason));
      return;
    }
    const routeModel = getModelById(request.modelId);
    if (!isAgentCallAllowed(config)) {
      await deliverResult(
        chatId,
        buildTestModeReply('llm', agent.name),
        routeModel,
        `agent:${agent.id}`
      );
      return;
    }

    let result = requestKey ? generationResults.get(requestKey) : null;
    if (!result && !allowRequest(chatId)) {
      await deliverResult(
        chatId,
        'слишком много запросов за минуту. попробуй снова чуть позже.',
        routeModel,
        `agent:${agent.id}`
      );
      return;
    }
    if (!result) {
      await deliverGenerationStatus(chatId, buildGenerationStatusMessage({
        category: entertainment ? 'entertainment' : 'agent',
        name: agent.name,
        subjectType: entertainment ? 'entertainment' : 'agent'
      }));
      const historyRun = await historyService?.startGeneration?.({
        telegramUserId: actorId,
        telegramChatId: chatId,
        requestKey,
        kind: 'agent',
        subjectType: entertainment ? 'entertainment' : 'agent',
        subjectId: entertainment?.id ?? agent.id,
        title: entertainment?.name ?? agent.name,
        prompt: effectivePrompt,
        parameters: {
          ...request.settings,
          ...(entertainmentFlow?.history ? { entertainmentFlow: entertainmentFlow.history } : {}),
          mediaCounts: collectedMediaCounts,
          ...(mediaHistory ? { media: mediaHistory } : {})
        },
        metacoinsQuoted: priceMetacoins
      });
      if (historyRun && requestKey) generationHistoryRuns.set(requestKey, historyRun);
      try {
        let agentMedia = [];
        if (collectedMedia.imageIds.length) {
          try {
            const resolved = await resolveMediaInputs(
              telegram,
              { reference_images: collectedMedia.imageIds },
              uploadMedia ?? falUploader(config.providerKeys.fal)
            );
            agentMedia = resolved.reference_images.map((url) => ({ type: 'image', url }));
          } catch (error) {
            onError(error, { chatId, agentId: agent.id, action: 'agent_media_upload' });
            throw new ProviderRequestError('Agent image attachment upload failed.', {
              cause: error
            });
          }
        }
        const preprocessTexts = [];
        for (const spec of preprocessSpecs) {
          const toolResult = await executeTool({
            toolId: spec.toolId,
            telegramInput: telegramInputWithPrompt(telegramInput, effectivePrompt),
            auditContext: historyRun?.generationId ? {
              generationId: historyRun.generationId,
              telegramUserId: historyRun.telegramUserId,
              requestKey,
              operation: `generation.agent.${spec.toolId}`
            } : null
          });
          const outputText = String(toolResult?.text ?? '').trim();
          if (outputText) {
            preprocessTexts.push(spec.kind === 'audio'
              ? `Расшифровка аудио-вложения:\n${outputText}`
              : `Разбор видео-вложения:\n${outputText}`);
          }
        }
        if (agentMedia.length || preprocessTexts.length) {
          request = buildAgentLlmRequest({
            agent,
            userPrompt: [effectivePrompt, ...preprocessTexts].filter(Boolean).join('\n\n'),
            agentSettings: agentSettingsFor(chatId, agent),
            preferenceText: preferenceInstructions(preferencesFor(chatId)),
            media: agentMedia
          });
        }
        result = await invokeLlm({
          prompt: request.prompt,
          providerModels: request.routeCandidates
            .map(({ providerModelId }) => providerModelId)
            .filter(Boolean),
          providerKeys: config.providerKeys,
          settings: request.settings,
          media: request.media,
          allowSecondaryProviders: true,
          allowFreeFallback: true,
          fetchImpl: providerFetchForGeneration(historyRun, requestKey, 'generation.agent')
        });
      } catch (error) {
        await failGenerationSafely(historyRun, error, { actorId, requestKey });
        if (requestKey) generationHistoryRuns.delete(requestKey);
        throw new ProviderRequestError('The configured providers did not complete the agent request.', {
          cause: error
        });
      }
      if (requestKey) generationResults.set(requestKey, result);
    }

    const billing = reserveGeneration({
      actorId,
      debitMetacoins: result.billingTier === 'free' ? 0 : access.debitMetacoins,
      requestKey,
      label: 'agent run'
    });
    if (!billing.ok) {
      if (requestKey) generationResults.delete(requestKey);
      await deliverUi(chatId, buildGenerationAccessMessage('insufficient_metacoins'));
      return;
    }
    let commitStarted = billing.commitStarted;
    let deliveryConfirmed = false;
    let retryCallbackData = null;
    let retryToken = null;
    try {
      const replayToken = rememberReplay({
        chatId,
        actorId,
        kind: 'agent',
        request: {
          chatId,
          actorId,
          actorUsername,
          agent,
          prompt: effectivePrompt,
          telegramInput,
          entertainment
        }
      });
      retryToken = replayToken;
      retryCallbackData = `repeat:${replayToken}`;
      await deliverResult(
        chatId,
        result.text,
        routeModel,
        `agent:${agent.id}`,
        buildGenerationResultRows({
          regenerateCallbackData: `repeat:${replayToken}`,
          settingsCallbackData: `agentsettings:${agent.id}`,
          newActionButton: { text: '📝 новая задача', callback_data: `agent:new:${agent.id}` }
        })
      );
      deliveryConfirmed = true;
      commitStarted = true;
      await commitGeneration({
        actorId,
        debitMetacoins: result.billingTier === 'free' ? 0 : access.debitMetacoins,
        requestKey,
        label: 'agent run',
        billing
      });
      await completeGenerationSafely(
        requestKey ? generationHistoryRuns.get(requestKey) : null,
        {
          outputText: result.text,
          outputType: 'text',
          metacoinsCharged: result.billingTier === 'free' ? 0 : access.debitMetacoins,
          provider: result.provider,
          providerModelId: result.model ?? null
        },
        { actorId, requestKey }
      );
      if (requestKey) generationHistoryRuns.delete(requestKey);
      if (requestKey) generationResults.delete(requestKey);
      if (entertainmentFlow?.state?.id === 'ent_lila') {
        await deliverUi(chatId, buildLilaNextMessage(entertainmentFlow.state));
      }
    } catch (error) {
      const chargedMetacoins = result.billingTier === 'free' ? 0 : access.debitMetacoins;
      if (deliveryConfirmed) {
        markReplayForDeliveryRetry(retryToken, requestKey);
        onError(error, {
          actorId,
          requestKey,
          action: 'generation_post_delivery_finalize'
        });
        return;
      }
      markReplayForDeliveryRetry(retryToken, requestKey);
      if (!deliveryOutcomeUnknown(error)) {
        releaseGeneration({
          actorId,
          debitMetacoins: chargedMetacoins,
          requestKey,
          label: 'agent run',
          billing: { ...billing, commitStarted }
        });
      }
      await failGenerationSafely(
        requestKey ? generationHistoryRuns.get(requestKey) : null,
        new ResultDeliveryError('Agent result delivery failed.', { cause: error }),
        { actorId, requestKey }
      );
      throw new ResultDeliveryError('Telegram did not accept the agent result.', {
        cause: error,
        retryCallbackData
      });
    }
  };
  const runSelectedAgentRequest = async (request) => {
    try {
      await executeSelectedAgentRequest(request);
    } catch (error) {
      if (error instanceof ResultDeliveryError) {
        onError(error, {
          chatId: request.chatId,
          agentId: request.agent?.id,
          action: 'agent_generation_delivery'
        });
        try {
          await deliverUi(request.chatId, buildDeliveryErrorMessage(null, error.retryCallbackData));
        } catch (deliveryError) {
          onError(deliveryError, {
            chatId: request.chatId,
            agentId: request.agent?.id,
            action: 'agent_generation_delivery_error_notice'
          });
        }
        return;
      }
      onError(error, { chatId: request.chatId, agentId: request.agent?.id, action: 'agent_generation' });
      const message = error instanceof ProviderRequestError
        ? buildAgentProviderErrorMessage(request.agent)
        : buildAggregatorErrorMessage();
      try {
        await deliverUi(request.chatId, message);
      } catch (deliveryError) {
        onError(deliveryError, {
          chatId: request.chatId,
          agentId: request.agent?.id,
          action: 'agent_generation_error_notice'
        });
      }
    }
  };
  const runVoiceTextToSpeech = async ({
    chatId,
    actorId,
    actorUsername,
    voiceId,
    confirmationToken
  }) => {
    const confirmation = voiceConfirmations.get(chatId);
    const isOwnedVoice = String(voiceId).startsWith('vp_');
    const ownedVoice = isOwnedVoice
      ? voiceService?.listOwnedVoices?.(String(actorId))?.find(({ profileId }) => profileId === voiceId)
      : null;
    const voiceName = isOwnedVoice ? ownedVoice?.name : getCuratedVoice(voiceId)?.name;
    const voiceBack = isOwnedVoice ? `ownedvoice:${voiceId}` : `voicecard:${voiceId}`;
    if (
      !confirmation
      || confirmation.voiceId !== voiceId
      || confirmation.confirmationToken !== confirmationToken
      || !voiceName
    ) {
      await deliverUi(chatId, isOwnedVoice
        ? buildVoiceLibraryMessage({ profiles: voiceService?.listOwnedVoices?.(String(actorId)) ?? [] })
        : buildVoiceCardMessage(voiceId));
      return;
    }
    if (!voiceService?.textToSpeech) {
      await deliverUi(chatId, buildVoiceEarlyAccessMessage(voiceId));
      return;
    }
    const fullAccess = hasFullAccess({
      username: actorUsername,
      actorId,
      ownerId: config.botOwnerId
    });
    const voiceModelId = 'elevenlabs_curated_tts';
    const account = await referralAccountFor(actorId);
    const freeEntitlement = freeEntitlementFor(voiceModelId);
    const isNewcomerFreeVoice = (
      account.subscriptionPlanId === 'newcomer'
      && Boolean(freeEntitlement)
    );
    const access = fullAccess && config.ownerMeteredAccess !== true
      ? Object.freeze({ allowed: true, reason: null, debitMetacoins: 0 })
      : isNewcomerFreeVoice
        ? Object.freeze({ allowed: true, reason: null, debitMetacoins: 0 })
        : decideModelAccess({
          account,
          modelId: voiceModelId,
          priceMetacoins: confirmation.priceMetacoins,
          freeModelIds: FREE_MODEL_IDS,
          now: new Date(now())
        });
    if (!access.allowed) {
      await deliverUi(chatId, buildGenerationAccessMessage(access.reason));
      return;
    }
    let freeQuotaClaimed = false;
    const releaseFreeQuota = async () => {
      if (!freeQuotaClaimed || !freeEntitlement) return;
      await historyService?.releaseFreeWeeklyRequest?.({
        telegramUserId: actorId,
        requestKey: confirmation.requestKey,
        quotaKey: freeEntitlement.quotaKey
      });
      freeQuotaClaimed = false;
    };
    let result = generationResults.get(confirmation.requestKey);
    if (!result && !allowRequest(chatId)) {
      await deliverUi(chatId, {
        text: 'слишком много запросов за минуту. попробуй снова чуть позже.',
        reply_markup: {
          inline_keyboard: navigationRows(voiceBack, '‹ назад к голосу')
        }
      });
      return;
    }
    if (
      !result
      && freeEntitlement
      && !fullAccess
      && isNewcomerFreeVoice
    ) {
      const quota = historyService?.claimFreeWeeklyRequest
        ? await historyService.claimFreeWeeklyRequest({
            telegramUserId: actorId,
            requestKey: confirmation.requestKey,
            quotaKey: freeEntitlement.quotaKey,
            requestLimit: freeEntitlement.weeklyLimit
          })
        : null;
      if (!quota) {
        await deliverUi(chatId, buildGenerationAccessMessage(
          'free_quota_unavailable',
          freeEntitlement
        ));
        return;
      }
      if (!quota.allowed) {
        await deliverUi(chatId, buildGenerationAccessMessage(
          'weekly_free_limit',
          freeEntitlement
        ));
        return;
      }
      freeQuotaClaimed = !quota.duplicate;
    }
    if (!result) {
      await deliverGenerationStatus(chatId, buildGenerationStatusMessage({
        category: 'voice',
        name: voiceName ?? 'голос',
        subjectType: 'model'
      }));
      try {
        let pending = voiceGenerationPromises.get(confirmation.requestKey);
        if (!pending) {
          pending = voiceService.textToSpeech({
            ownerTelegramId: String(actorId),
            voice: { type: isOwnedVoice ? 'profile' : 'curated', id: voiceId },
            text: confirmation.text,
            model: 'eleven_multilingual_v2',
            outputFormat: 'mp3_44100_128'
          });
          voiceGenerationPromises.set(confirmation.requestKey, pending);
        }
        result = await pending;
        voiceGenerationPromises.delete(confirmation.requestKey);
      } catch (error) {
        voiceGenerationPromises.delete(confirmation.requestKey);
        await releaseFreeQuota();
        onError(error, { chatId, voiceId, action: 'voice_tts' });
        await deliverUi(chatId, {
          text: '<b>озвучка не получилась</b>\n\nтекст сохранён. повтори запуск чуть позже, метакоины не списаны.',
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{
                text: 'повторить озвучку',
                callback_data: `voicegenerate:${voiceId}:${confirmation.confirmationToken}`
              }],
              ...navigationRows(voiceBack, '‹ назад к голосу')
            ]
          }
        });
        return;
      }
      generationResults.set(confirmation.requestKey, result);
    }
    let delivery = voiceDeliveryPromises.get(confirmation.requestKey);
    if (!delivery) {
      delivery = (async () => {
        const billing = reserveGeneration({
          actorId,
          debitMetacoins: access.debitMetacoins,
          requestKey: confirmation.requestKey,
          label: 'voice text to speech'
        });
        if (!billing.ok) {
          generationResults.delete(confirmation.requestKey);
          await deliverUi(chatId, buildGenerationAccessMessage('insufficient_metacoins'));
          return;
        }
        let commitStarted = billing.commitStarted;
        let deliveryConfirmed = false;
        let retryCallbackData = null;
        let retryToken = null;
        try {
          const replayToken = rememberReplay({
            chatId,
            actorId,
            kind: 'voice',
            request: {
              voiceId,
              text: confirmation.text,
              priceMetacoins: confirmation.priceMetacoins
            }
          });
          retryToken = replayToken;
          retryCallbackData = `repeat:${replayToken}`;
          await clearGenerationUi(chatId);
          const sent = await telegram.sendAudio(chatId, result.audio, {
            caption: buildGeneratedMediaCaption({
              category: 'voice',
              name: voiceName ?? 'голос',
              chargedMetacoins: access.debitMetacoins
            }),
            parse_mode: 'HTML',
            mimeType: result.contentType ?? 'audio/mpeg',
            fileName: 'metaflora-voice.mp3',
            reply_markup: {
              inline_keyboard: [
                ...buildGenerationResultRows({
                  regenerateCallbackData: `repeat:${replayToken}`
                }),
                ...navigationRows(voiceBack, '‹ назад к голосу')
              ]
            }
          });
          if (sent?.message_id) uiMessageIds.set(chatId, sent.message_id);
          deliveryConfirmed = true;
          commitStarted = true;
          await commitGeneration({
            actorId,
            debitMetacoins: access.debitMetacoins,
            requestKey: confirmation.requestKey,
            label: 'voice text to speech',
            billing
          });
          generationResults.delete(confirmation.requestKey);
          voiceConfirmations.delete(chatId);
          voiceTextDrafts.delete(chatId);
        } catch (error) {
          await releaseFreeQuota();
          if (deliveryConfirmed) {
            markReplayForDeliveryRetry(retryToken, confirmation.requestKey);
            onError(error, {
              actorId,
              requestKey: confirmation.requestKey,
              action: 'generation_post_delivery_finalize'
            });
            return;
          }
          markReplayForDeliveryRetry(retryToken, confirmation.requestKey);
          if (!deliveryOutcomeUnknown(error)) {
            releaseGeneration({
              actorId,
              debitMetacoins: access.debitMetacoins,
              requestKey: confirmation.requestKey,
              label: 'voice text to speech',
              billing: { ...billing, commitStarted }
            });
          }
          throw new ResultDeliveryError('Telegram did not accept the generated voice MP3.', {
            cause: error,
            retryCallbackData
          });
        }
      })();
      voiceDeliveryPromises.set(confirmation.requestKey, delivery);
    }
    try {
      await delivery;
    } finally {
      if (voiceDeliveryPromises.get(confirmation.requestKey) === delivery) {
        voiceDeliveryPromises.delete(confirmation.requestKey);
      }
    }
  };
  const queueMediaGroup = (message, selected) => {
    const chatId = message.chat.id;
    const key = `${chatId}:${message.media_group_id}`;
    const previous = mediaGroups.get(key);
    if (previous?.timer) clearTimeoutFn(previous.timer);

    const group = {
      chatId,
      selected,
      messages: [...(previous?.messages ?? []), message],
      timer: null
    };
    group.timer = setTimeoutFn(() => {
      mediaGroups.delete(key);
      const prompt = group.messages
        .map((item) => item.text ?? item.caption ?? '')
        .find((text) => text.trim()) ?? '';
      const inputs = group.messages.flatMap(messageInputs);
      return runSelectedRequest({
        chatId,
        actorId: group.messages[0]?.from?.id ?? chatId,
        actorUsername: group.messages[0]?.from?.username ?? '',
        selected: group.selected,
        inputs,
        prompt,
        requestKey: `album:${key}`,
        telegramInput: group.messages
      });
    }, mediaGroupDelayMs);
    mediaGroups.set(key, group);
  };
  const removeIncomingMessage = async (message) => {
    if (!message?.message_id || typeof telegram.deleteMessage !== 'function') return;
    try {
      await telegram.deleteMessage(message.chat.id, message.message_id);
    } catch (error) {
      reportTelegramCleanupError(error, { chatId: message.chat.id, incomingMessageId: message.message_id });
    }
  };
  const legalGateEnabled = Boolean(config.legalConsent?.enabled);
  const legalStatusFor = async (telegramUserId) => (
    historyService?.getLegalConsentStatus
      ? historyService.getLegalConsentStatus({ telegramUserId })
      : null
  );
  const legalMessageFor = (status) => buildLegalConsentMessage({
    status,
    urls: config.legalConsent?.urls
  });
  const showLegalGate = async ({
    chatId,
    status,
    editableMessageId = null,
    showDeviceMenu = false,
    actor = null
  }) => {
    if (showDeviceMenu) {
      await telegram.sendMessage(
        chatId,
        buildWelcomeMessage(actor?.first_name, actor?.username)
      );
    }
    return deliverUi(chatId, legalMessageFor(status), editableMessageId);
  };
  const showLegalSuccess = async ({
    chatId,
    editableMessageId
  }) => {
    const result = await deliverUi(
      chatId,
      buildLegalConsentSuccessMessage(),
      editableMessageId
    );
    const successMessageId = result?.message_id ?? editableMessageId ?? null;
    const timer = setTimeoutFn(async () => {
      try {
        if (successMessageId && typeof telegram.deleteMessage === 'function') {
          await telegram.deleteMessage(chatId, successMessageId);
        }
        if (uiMessageIds.get(chatId) === successMessageId) {
          uiMessageIds.delete(chatId);
        }
      } catch (error) {
        reportTelegramCleanupError(error, { chatId, action: 'legal_success_cleanup' });
      }
    }, 3_000);
    timer?.unref?.();
  };

  const handleUpdate = async (update) => {
    runNonBlocking(
      () => historyService?.captureUpdate?.(update),
      { action: 'history_capture_update' }
    );
    const incomingChat = update.callback_query?.message?.chat ?? update.message?.chat;
    if (incomingChat?.type && incomingChat.type !== 'private') {
      if (update.callback_query) {
        try {
          await telegram.answerCallbackQuery(update.callback_query.id);
        } catch (error) {
          onError(error, update);
        }
      }
      await telegram.sendMessage(incomingChat.id, {
        text: 'профиль, баланс и генерации доступны в личном чате с ботом.',
        reply_markup: {
          inline_keyboard: [[{
            text: 'открыть МЕТАФЛОРА* нейро',
            url: 'https://t.me/neuro_metaflora_bot'
          }]]
        }
      });
      return;
    }

    if (update.callback_query) {
      const callback = update.callback_query;
      try {
        await telegram.answerCallbackQuery(callback.id);
      } catch (error) {
        onError(error, update);
      }

      const chatId = callback.message?.chat?.id;
      if (!chatId) return;
      const welcomeDestination = callback.data?.startsWith('welcome:')
        ? callback.data.slice('welcome:'.length)
        : null;
      if (['profile', 'back', 'menu'].includes(welcomeDestination)) {
        const actorId = callback.from?.id ?? chatId;
        const returnMessageId = welcomeReturnMessageIds.get(String(chatId)) ?? null;
        stopWelcomeSession(chatId);
        await deleteWelcomeAgentMessages(chatId);
        welcomeReturnMessageIds = new Map(welcomeReturnMessageIds);
        welcomeReturnMessageIds.delete(String(chatId));
        if (welcomeDestination === 'profile') {
          await deliverUi(
            chatId,
            markMenuMedia(
              buildProfileMessage(selections.get(chatId), await referralAccountFor(actorId)),
              'profile'
            )
          );
        } else if (welcomeDestination === 'menu' || !returnMessageId) {
          await deliverUi(
            chatId,
            markMenuMedia(
              buildWelcomeMessage(callback.from?.first_name, callback.from?.username),
              'menu'
            )
          );
        } else {
          uiMessageIds.set(chatId, returnMessageId);
        }
        return;
      }
      if (loadWelcomeSession(chatId).active) {
        stopWelcomeSession(chatId);
        await deleteWelcomeAgentMessages(chatId);
        welcomeReturnMessageIds = new Map(welcomeReturnMessageIds);
        welcomeReturnMessageIds.delete(String(chatId));
      }
      if (!callback.data?.startsWith('instructions:')) instructionDrafts.delete(chatId);
      const actorId = callback.from?.id ?? chatId;
      const referralAdminAction = callbackValue(callback.data, 'refadmin');
      if (referralAdminAction) {
        if (String(actorId) !== String(config?.botOwnerId ?? '')) return;
        const [, withdrawalId] = referralAdminAction.match(
          /^reconcile:([A-Za-z0-9_-]{8,128})$/u
        ) ?? [];
        if (!withdrawalId) return;
        try {
          const current = referralService.getWithdrawal?.(withdrawalId);
          if (!current) throw new Error('Заявка на вывод не найдена.');
          await deliverUi(chatId, {
            text: `🔄 <b>сверка запрошена</b>\n\nзаявка: <code>${withdrawalId}</code>\nтекущий статус: <b>${escapeHtml(current.payoutStatus ?? current.status)}</b>\n\nстатус изменит только платёжный воркер после ответа Т-Бизнеса с внешним идентификатором операции.`,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [] }
          }, callback.message?.message_id);
        } catch (error) {
          onError(error, { chatId, actorId, action: 'referral_withdrawal_admin' });
          await deliverUi(chatId, {
            text: 'не получилось обработать эту заявку. проверь её статус и попробуй ещё раз.',
            reply_markup: { inline_keyboard: [] }
          }, callback.message?.message_id);
        }
        return;
      }
      runNonBlocking(
        () => markReferralUserStarted(callback.from, actorId),
        { chatId, action: 'referral_activity' }
      );
      runNonBlocking(
        () => hydrateState(chatId),
        { chatId, action: 'hydrate_state' }
      );
      if (legalGateEnabled) {
        const legalAction = callbackValue(callback.data, 'legal');
        if (legalAction?.startsWith('accept:')) {
          const consentKind = legalAction.slice('accept:'.length);
          if (!['terms', 'personal_data'].includes(consentKind)) return;
          const requestKey = `legal:${actorId}:${callback.id}`;
          let status;
          try {
            if (!historyService?.recordLegalConsent) {
              throw new Error('Legal consent storage is unavailable.');
            }
            status = await historyService.recordLegalConsent({
              telegramUserId: actorId,
              consentKind,
              documentVersion: config.legalConsent?.version ?? LEGAL_DOCUMENT_VERSION,
              requestKey,
              telegramUpdateId: update.update_id,
              telegramMessageId: callback.message?.message_id,
              telegramCallbackId: callback.id,
              metadata: {
                source: 'telegram_inline',
                botUsername: config.botUsername ?? 'neuro_metaflora_bot'
              }
            });
          } catch (error) {
            onError(error, { chatId, actorId, action: 'legal_consent_write' });
            try {
              await historyService?.recordEvent?.({
                eventName: 'legal.consent.failed',
                category: 'legal',
                telegramUserId: String(actorId),
                telegramChatId: String(chatId),
                requestKey: `${requestKey}:failed`,
                subjectType: 'legal_consent',
                subjectId: consentKind,
                metadata: {
                  documentVersion: config.legalConsent?.version ?? LEGAL_DOCUMENT_VERSION
                }
              });
            } catch (auditError) {
              onError(auditError, { chatId, actorId, action: 'legal_consent_failure_audit' });
            }
            let currentStatus = null;
            try {
              currentStatus = await legalStatusFor(actorId);
            } catch (statusError) {
              onError(statusError, { chatId, actorId, action: 'legal_consent_status' });
            }
            await deliverUi(
              chatId,
              buildLegalConsentMessage({
                status: currentStatus,
                urls: config.legalConsent?.urls,
                notice: 'не получилось сохранить отметку. попробуй нажать ещё раз.'
              }),
              callback.message?.message_id
            );
            return;
          }
          if (isLegalConsentComplete(status)) {
            await showLegalSuccess({
              chatId,
              editableMessageId: callback.message?.message_id
            });
            if (lifecycleService?.scheduleNewcomerReminder) {
              void lifecycleService.scheduleNewcomerReminder({
                telegramUserId: String(actorId),
                telegramChatId: String(chatId)
              }).catch((error) => onError(error, {
                chatId,
                actorId,
                action: 'schedule_newcomer_reminder'
              }));
            }
          } else {
            await showLegalGate({
              chatId,
              status,
              editableMessageId: callback.message?.message_id
            });
          }
          return;
        }
        const legalStatus = await legalStatusFor(actorId);
        if (!isLegalConsentComplete(legalStatus)) {
          await showLegalGate({
            chatId,
            status: legalStatus,
            editableMessageId: callback.message?.message_id
          });
          return;
        }
      }
      if (!callback.data.startsWith('billing:promo:enter')) promoDrafts.delete(actorId);
      const clearVoicePreview = async (chatId) => {
        const previewState = voicePreviewMessageIds.get(chatId);
        const previewMessageId = previewState && typeof previewState === 'object'
          ? previewState.messageId
          : previewState;
        if (!previewMessageId) return null;
        voicePreviewMessageIds.delete(chatId);
        const timer = previewState && typeof previewState === 'object' ? previewState.timer : null;
        if (timer !== null && timer !== undefined) clearTimeoutFn(timer);
        if (typeof telegram.deleteMessage !== 'function') return previewMessageId;
        try {
          await telegram.deleteMessage(chatId, previewMessageId);
        } catch (error) {
          reportTelegramCleanupError(error, {
            chatId,
            messageId: previewMessageId,
            action: 'voice_preview_cleanup'
          });
        }
        return previewMessageId;
      };

      const voicePreviewCleanupDelay = (preview) => {
        const durationMs = Number(preview?.durationMs);
        if (Number.isFinite(durationMs) && durationMs > 0) {
          return Math.max(1_000, Math.ceil(durationMs) + 500);
        }
        const durationSeconds = Number(preview?.durationSeconds ?? preview?.duration);
        if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
          return Math.max(1_000, Math.ceil(durationSeconds * 1_000) + 500);
        }
        return 4_000;
      };

      const trackVoicePreview = (chatId, messageId, preview) => {
        const timer = setTimeoutFn(async () => {
          const currentState = voicePreviewMessageIds.get(chatId);
          const currentMessageId = currentState && typeof currentState === 'object'
            ? currentState.messageId
            : currentState;
          if (!currentMessageId || String(currentMessageId) !== String(messageId)) return;
          await clearVoicePreview(chatId);
        }, voicePreviewCleanupDelay(preview));
        timer?.unref?.();
        voicePreviewMessageIds.set(chatId, { messageId, timer });
      };

      const respond = async (message, mediaKey = null) => {
        const clearedPreviewMessageId = await clearVoicePreview(chatId);
        const callbackMessageId = callback.message?.message_id;
        const editableMessageId = clearedPreviewMessageId !== null
          && String(clearedPreviewMessageId) === String(callbackMessageId)
          ? null
          : callbackMessageId;
        return deliverUi(
          chatId,
          mediaKey ? markMenuMedia(message, mediaKey) : message,
          editableMessageId
        );
      };

      const showContextCleared = async (model) => {
        const notice = await telegram.sendMessage(chatId, buildContextClearedMessage());
        const noticeMessageId = notice?.message_id ?? null;
        const timer = setTimeoutFn(async () => {
          if (!noticeMessageId || typeof telegram.deleteMessage !== 'function') return;
          try {
            await telegram.deleteMessage(chatId, noticeMessageId);
          } catch (error) {
            reportTelegramCleanupError(error, {
              chatId,
              messageId: noticeMessageId,
              action: 'context_cleared_notice_cleanup'
            });
          }
        }, 3_000);
        timer?.unref?.();
        await respond(buildModelCard(model));
      };

      const replayToken = callbackValue(callback.data, 'repeat');
      if (replayToken) {
        const replay = takeReplay({ token: replayToken, chatId, actorId });
        if (!replay) {
          await respond({
            text: 'повтор больше недоступен. отправь запрос ещё раз, чтобы создать новый результат.',
            reply_markup: { inline_keyboard: navigationRows() }
          });
          return;
        }
        if (replay.kind === 'model') {
          await runSelectedRequest({
            ...replay.request,
            chatId,
            actorId,
            actorUsername: callback.from?.username ?? '',
            requestKey: replay.deliveryRetryRequestKey
              ?? `repeat:model:${chatId}:${callback.id}`
          });
          return;
        }
        if (replay.kind === 'agent') {
          await runSelectedAgentRequest({
            ...replay.request,
            chatId,
            actorId,
            actorUsername: callback.from?.username ?? '',
            requestKey: replay.deliveryRetryRequestKey
              ?? `repeat:agent:${chatId}:${callback.id}`
          });
          return;
        }
        if (replay.kind === 'voice') {
          const confirmationToken = `repeat-${replayToken}`;
          const confirmation = Object.freeze({
            voiceId: replay.request.voiceId,
            text: replay.request.text,
            priceMetacoins: replay.request.priceMetacoins,
            requestKey: replay.deliveryRetryRequestKey
              ?? `repeat:voice:${chatId}:${callback.id}`,
            confirmationToken
          });
          voiceConfirmations.set(chatId, confirmation);
          await runVoiceTextToSpeech({
            chatId,
            actorId,
            actorUsername: callback.from?.username ?? '',
            voiceId: confirmation.voiceId,
            confirmationToken
          });
          return;
        }
      }

      const task = callbackValue(callback.data, 'task');
      if (task === 'menu') {
        withdrawalDrafts.delete(actorId);
        await deliverUi(
          chatId,
          markMenuMedia(buildWelcomeMessage(callback.from?.first_name, callback.from?.username), 'menu')
        );
        return;
      }
      if (task === 'profile') {
        withdrawalDrafts.delete(actorId);
        await respond(buildProfileMessage(selections.get(chatId), await referralAccountFor(actorId)), 'profile');
        return;
      }
      if (task === 'support') {
        await respond(buildSupportMessage(), 'support');
        return;
      }
      if (task === 'founder-channel') {
        await respond(buildFounderChannelMessage(), 'founder');
        return;
      }
      if (task === 'invite') {
        await respond(buildReferralAccountMessage(await referralAccountFor(actorId)), 'invite');
        return;
      }
      if (task === 'balance') {
        await respond(buildBalanceMessage(await referralAccountFor(actorId)), 'balance');
        return;
      }
      if (task === 'settings') {
        await respond(userSettingsMessageFor(chatId));
        return;
      }
      if (task === 'models') {
        videoConstructorDrafts.delete(chatId);
        clearActiveSelection(chatId);
        await respond(buildModelCategoryMessage('llm'), 'llm');
        return;
      }
      if (task === 'audio') {
        clearActiveSelection(chatId);
        await respond(buildModelCategoryMessage('audio'), 'music');
        return;
      }
      if (task === 'voice') {
        clearActiveSelection(chatId);
        await respond(buildModelCategoryMessage('voice'), 'voice');
        return;
      }
      if (task === 'agents') {
        clearActiveSelection(chatId);
        await respond(buildAgentCatalogMenu(), 'agents');
        return;
      }
      if (taskCategory[task]) {
        clearActiveSelection(chatId);
        const category = taskCategory[task];
        await respond(buildModelCategoryMessage(category), menuMediaForCategory[category]);
        return;
      }

      const audioStudio = callbackValue(callback.data, 'audiostudio');
      if (audioStudio) {
        clearActiveSelection(chatId);
        await respond(audioStudio === 'home'
          ? buildAudioStudioHomeMessage()
          : buildAudioStudioCategoryMessage(audioStudio));
        return;
      }

      const audioCategory = callbackValue(callback.data, 'audiocategory');
      if (audioCategory) {
        clearActiveSelection(chatId);
        await respond(buildAudioStudioCategoryMessage(audioCategory));
        return;
      }

      const audioWorkflow = callbackValue(callback.data, 'audioworkflow');
      if (audioWorkflow) {
        clearActiveSelection(chatId);
        if (isMusicConstructorWorkflowId(audioWorkflow) && audioWorkflowExecutor?.getRoute?.(audioWorkflow)?.state === 'runnable') {
          const current = musicDrafts.get(chatId) ?? createMusicDraft(audioWorkflow);
          const draft = current.workflowId === audioWorkflow ? current : createMusicDraft(audioWorkflow);
          musicDrafts.set(chatId, draft);
          await respond(buildAudioWorkflowMessage(audioWorkflow));
          return;
        }
        if (['music_song', 'music_instrumental'].includes(audioWorkflow)) {
          await respond(buildAudioWorkflowEarlyAccessMessage(audioWorkflow));
          return;
        }
        if (audioWorkflow === 'voice_dub_video') {
          const route = audioWorkflowExecutor?.getRoute?.(audioWorkflow);
          if (route?.state !== 'runnable') {
            await respond(buildAudioWorkflowEarlyAccessMessage(audioWorkflow));
            return;
          }
          const current = audioDubDrafts.get(chatId) ?? Object.freeze({
            sourceAudio: 'сохранить',
            sourceAudioMix: 25,
            video: null,
            awaitingLanguage: false
          });
          audioDubDrafts.set(chatId, current);
          await respond(buildAudioDubConstructorMessage(current));
          return;
        }
        const tool = getExecutableToolForWorkflow(audioWorkflow);
        if (tool) {
          saveAgentSelection(chatId);
          pendingModels.set(chatId, tool);
          saveSelection(chatId, tool);
        }
        await respond(buildAudioWorkflowMessage(audioWorkflow));
        return;
      }

      const audioDub = callbackValue(callback.data, 'audiodub');
      if (audioDub) {
        const draft = audioDubDrafts.get(chatId) ?? Object.freeze({
          sourceAudio: 'сохранить', sourceAudioMix: 25, video: null, awaitingLanguage: false
        });
        if (audioDub === 'voice') {
          const profiles = voiceService?.listOwnedVoices?.(String(actorId)) ?? [];
          await respond(buildAudioDubVoicePickerMessage(profiles, listCuratedVoices({ limit: 8 })));
        } else {
          await respond(buildAudioDubConstructorMessage(draft));
        }
        return;
      }

      const audioDubVoice = callbackValue(callback.data, 'audiodubvoice');
      if (audioDubVoice) {
        const draft = audioDubDrafts.get(chatId) ?? Object.freeze({ sourceAudio: 'сохранить', sourceAudioMix: 25 });
        const updated = Object.freeze({ ...draft, voice: Object.freeze({ type: 'curated', id: audioDubVoice }) });
        audioDubDrafts.set(chatId, updated);
        await respond(buildAudioDubConstructorMessage(updated));
        return;
      }

      const audioDubOwned = callbackValue(callback.data, 'audiodubowned');
      if (audioDubOwned) {
        const profile = voiceService?.listOwnedVoices?.(String(actorId))
          ?.find(({ profileId }) => profileId === audioDubOwned);
        if (!profile) {
          await respond(buildAudioDubVoicePickerMessage([], listCuratedVoices({ limit: 8 })));
          return;
        }
        const draft = audioDubDrafts.get(chatId) ?? Object.freeze({ sourceAudio: 'сохранить', sourceAudioMix: 25 });
        const updated = Object.freeze({ ...draft, voice: Object.freeze({ type: 'profile', id: profile.profileId }) });
        audioDubDrafts.set(chatId, updated);
        await respond(buildAudioDubConstructorMessage(updated));
        return;
      }

      const audioDubSetting = callbackValue(callback.data, 'audiodubset');
      if (audioDubSetting) {
        const draft = audioDubDrafts.get(chatId);
        if (!draft) {
          await respond(buildAudioWorkflowEarlyAccessMessage('voice_dub_video'));
          return;
        }
        const values = ['сохранить', 'убрать', 'смешать'];
        const index = Math.max(0, values.indexOf(draft.sourceAudio));
        const sourceAudio = audioDubSetting === 'mix'
          ? 'смешать'
          : values[(index + 1) % values.length];
        const updated = Object.freeze({ ...draft, sourceAudio });
        audioDubDrafts.set(chatId, updated);
        await respond(buildAudioDubConstructorMessage(updated));
        return;
      }

      const audioDubMix = callbackValue(callback.data, 'audiodubmix');
      if (audioDubMix && audioDubMix !== 'current') {
        const draft = audioDubDrafts.get(chatId);
        if (!draft) return;
        const delta = audioDubMix === 'up' ? 5 : -5;
        const updated = Object.freeze({
          ...draft,
          sourceAudioMix: Math.max(0, Math.min(100, (draft.sourceAudioMix ?? 25) + delta))
        });
        audioDubDrafts.set(chatId, updated);
        await respond(buildAudioDubConstructorMessage(updated));
        return;
      }

      const audioEarly = callbackValue(callback.data, 'audioearly');
      if (audioEarly) {
        await respond(buildAudioWorkflowEarlyAccessMessage(audioEarly));
        return;
      }

      const audioUse = callbackValue(callback.data, 'audiouse');
      if (audioUse) {
        const tool = getExecutableToolForWorkflow(audioUse);
        if (!tool) {
          await respond(buildAudioWorkflowEarlyAccessMessage(audioUse));
          return;
        }
        saveAgentSelection(chatId);
        pendingModels.set(chatId, tool);
        saveSelection(chatId, tool);
        await respond(buildAudioWorkflowSelectedMessage(audioUse));
        return;
      }

      const audioSettings = callbackValue(callback.data, 'audiosettings');
      if (audioSettings) {
        clearActiveSelection(chatId);
        if (isMusicConstructorWorkflowId(audioSettings) && audioWorkflowExecutor?.getRoute?.(audioSettings)?.state === 'runnable') {
          const current = musicDrafts.get(chatId) ?? createMusicDraft(audioSettings);
          const draft = current.workflowId === audioSettings ? current : createMusicDraft(audioSettings);
          musicDrafts.set(chatId, draft);
          activeMusicConstructors.add(chatId);
          await respond(buildMusicSettingsMessage(draft));
          return;
        }
        if (['music_song', 'music_instrumental'].includes(audioSettings)) {
          await respond(buildAudioWorkflowEarlyAccessMessage(audioSettings));
          return;
        }
        if (audioSettings === 'voice_dub_video') {
          const route = audioWorkflowExecutor?.getRoute?.(audioSettings);
          if (route?.state !== 'runnable') {
            await respond(buildAudioWorkflowEarlyAccessMessage(audioSettings));
            return;
          }
          const draft = audioDubDrafts.get(chatId) ?? Object.freeze({
            sourceAudio: 'сохранить', sourceAudioMix: 25, video: null, awaitingLanguage: false
          });
          audioDubDrafts.set(chatId, draft);
          await respond(buildAudioDubConstructorMessage(draft));
          return;
        }
        await respond(buildAudioWorkflowSettingsMessage(audioSettings));
        return;
      }

      if (callback.data === 'musicsettings:home') {
        const draft = musicDrafts.get(chatId);
        if (draft) activeMusicConstructors.add(chatId);
        await respond(draft ? buildMusicSettingsMessage(draft) : buildAudioStudioCategoryMessage('music_create'));
        return;
      }

      const musicPreset = callbackValue(callback.data, 'musicpreset');
      if (musicPreset) {
        const draft = musicDrafts.get(chatId);
        if (!draft) return;
        const updated = applyMusicSetting(draft, 'preset', musicPreset);
        musicDrafts.set(chatId, updated);
        await respond(buildMusicStyleMessage(updated));
        return;
      }

      const musicPerformer = callbackValue(callback.data, 'musicperformer');
      if (musicPerformer) {
        const draft = musicDrafts.get(chatId);
        if (!draft) return;
        const updated = applyMusicSetting(draft, 'performer', musicPerformer);
        musicDrafts.set(chatId, updated);
        await respond(buildMusicSettingsMessage(updated));
        return;
      }

      const musicPerformerPage = callbackValue(callback.data, 'musicperformers');
      if (musicPerformerPage !== null) {
        const draft = musicDrafts.get(chatId);
        if (!draft) return;
        await respond(buildMusicPerformerMessage(draft, { page: Number(musicPerformerPage) }));
        return;
      }

      const musicSetting = callbackValue(callback.data, 'musicset');
      if (musicSetting) {
        const draft = musicDrafts.get(chatId);
        if (!draft) return;
        const [field, value] = musicSetting.split(':');
        if (field === 'prompt' && value === 'delete') {
          const updated = clearMusicPrompt(draft);
          musicDrafts.set(chatId, updated);
          await respond(buildMusicSettingsMessage(updated));
        } else if (field === 'duration' && value === 'open') await respond(buildMusicDurationMessage(draft));
        else if (field === 'performer' && value === 'open') await respond(buildMusicPerformerMessage(draft));
        else if (field === 'reference' && value === 'open') {
          const updated = applyMusicSetting(draft, 'awaiting', 'referenceAudio');
          musicDrafts.set(chatId, updated);
          await respond({ text: '<b>🎧 аудиореференс</b>\n\nпришли один аудиофайл отдельным сообщением.', parse_mode: 'HTML', reply_markup: { inline_keyboard: navigationRows('musicsettings:home', '‹ назад к параметрам') } });
        }
        else if (field === 'duration') {
          const updated = applyMusicSetting(draft, 'duration', Number(value));
          musicDrafts.set(chatId, updated);
          await respond(buildMusicSettingsMessage(updated));
        } else if (field === 'style' && value === 'open') await respond(buildMusicStyleMessage(draft));
        else if (field === 'lyrics' && value === 'open') await respond(buildMusicLyricsMessage(draft));
        else if (field === 'lyrics') {
          let updated = applyMusicSetting(draft, 'lyrics', value);
          if (value === 'custom') updated = applyMusicSetting(updated, 'awaiting', 'lyricsText');
          musicDrafts.set(chatId, updated);
          await respond(value === 'custom' ? buildMusicInputPrompt(updated, 'lyricsText') : buildMusicSettingsMessage(updated));
        } else if (field === 'instrumental') {
          const updated = applyMusicSetting(draft, 'instrumental', 'cycle');
          musicDrafts.set(chatId, updated);
          await respond(buildMusicSettingsMessage(updated));
        } else if ((field === 'prompt' && value === 'open') || (field === 'style' && value === 'custom')) {
          const inputField = field === 'prompt' ? 'prompt' : 'styleText';
          const updated = applyMusicSetting(draft, 'awaiting', inputField);
          musicDrafts.set(chatId, updated);
          await respond(buildMusicInputPrompt(updated, inputField));
        } else if (field === 'confirm') await respond(buildMusicConfirmationMessage(draft));
        return;
      }

      if (callback.data === 'musicrun:confirm') {
        const draft = musicDrafts.get(chatId);
        if (!draft || !audioWorkflowExecutor) return;
        const providerRequest = musicProviderRequest(draft);
        const requestKey = `music:${chatId}:${callback.message?.message_id ?? update.update_id}`;
        const historyRun = await historyService?.startGeneration?.({
          telegramUserId: actorId,
          telegramChatId: chatId,
          requestKey,
          kind: 'audio',
          subjectType: 'music',
          subjectId: draft.workflowId,
          title: draft.workflowId === 'music_instrumental' ? 'создать инструментал' : 'создать песню',
          prompt: draft.prompt || draft.styleText || draft.lyricsText,
          parameters: {
            instrumental: draft.instrumental,
            lyricsMode: draft.lyricsMode,
            style: draft.styleText,
            durationSeconds: draft.durationSeconds,
            hasReferenceAudio: Boolean(draft.referenceAudioUrl),
            providerContractId: providerRequest.contractId
          },
          inputTypes: draft.referenceAudioUrl ? ['text', 'audio'] : ['text'],
          metacoinsQuoted: providerRequest.metacoins
        });
        let pending = musicPromises.get(requestKey);
        if (!pending) {
          pending = audioWorkflowExecutor.execute({
            workflowId: draft.workflowId, requestKey,
            inputs: { ...providerRequest.inputs, contractId: providerRequest.contractId },
            settings: { quotedMetacoins: providerRequest.metacoins }
          });
          musicPromises.set(requestKey, pending);
        }
        try {
          const completed = await pending;
          const track = completed?.result?.tracks?.[0];
          if (!track?.url || typeof telegram.sendAudio !== 'function') throw new Error('music output unavailable');
          const delivered = await telegram.sendAudio(chatId, track.url, {
            caption: '<b>🎵 музыка готова</b>', parse_mode: 'HTML',
            reply_markup: { inline_keyboard: navigationRows(`audioworkflow:${draft.workflowId}`, '‹ к музыке') }
          });
          await completeGenerationSafely(historyRun, {
            outputType: 'audio',
            outputUrl: track.url,
            outputMimeType: track.mimeType ?? 'audio/mpeg',
            outputTelegramMessageId: delivered?.message_id ?? null,
            metacoinsCharged: providerRequest.metacoins,
            provider: getMusicProviderContract(providerRequest.contractId)?.provider ?? 'unknown',
            providerModelId: providerRequest.contractId
          }, { actorId, requestKey });
          musicDrafts.delete(chatId);
        } catch (error) {
          await failGenerationSafely(historyRun, error, { actorId, requestKey });
          onError(error, { chatId, actorId, requestKey, action: 'music_execute' });
          await respond({ text: '<b>музыка не создалась</b>\n\nпараметры сохранены, повторный запуск с тем же запросом не спишет метакоины дважды.', parse_mode: 'HTML', reply_markup: { inline_keyboard: navigationRows('musicsettings:home', '‹ назад к параметрам') } });
        } finally {
          musicPromises.delete(requestKey);
        }
        return;
      }

      const audioModels = callbackValue(callback.data, 'audiomodels');
      if (audioModels === 'audio' || audioModels === 'voice') {
        clearActiveSelection(chatId);
        await respond(audioModels === 'audio'
          ? buildModelCategoryMessage('audio')
          : buildAudioStudioCategoryMessage('voice'));
        return;
      }

      const voiceLibraryPage = callbackValue(callback.data, 'voicelib');
      if (voiceLibraryPage !== null) {
        clearActiveSelection(chatId);
        let profiles = [];
        try {
          profiles = voiceService?.listOwnedVoices?.(String(actorId)) ?? [];
        } catch (error) {
          onError(error, { chatId, actorId, action: 'voice_profiles_list' });
        }
        await respond(buildVoiceLibraryMessage({ page: voiceLibraryPage, profiles }));
        return;
      }

      const ownedVoiceCard = callbackValue(callback.data, 'ownedvoice');
      if (ownedVoiceCard) {
        clearActiveSelection(chatId);
        try {
          const profile = voiceService?.listOwnedVoices?.(String(actorId))
            ?.find(({ profileId }) => profileId === ownedVoiceCard);
          await respond(profile
            ? buildOwnedVoiceCardMessage(profile)
            : buildVoiceLibraryMessage({ profiles: voiceService?.listOwnedVoices?.(String(actorId)) ?? [] }));
        } catch (error) {
          onError(error, { chatId, actorId, action: 'owned_voice_card' });
          await respond(buildVoiceLibraryMessage());
        }
        return;
      }

      const ownedVoiceUse = callbackValue(callback.data, 'ownedvoiceuse');
      if (ownedVoiceUse) {
        try {
          const profile = voiceService?.listOwnedVoices?.(String(actorId))
            ?.find(({ profileId }) => profileId === ownedVoiceUse);
          if (!profile) throw new Error('Owned voice is unavailable.');
          clearActiveSelection(chatId);
          voiceConfirmations.delete(chatId);
          voiceTextDrafts.set(chatId, Object.freeze({ voiceId: profile.profileId, profile }));
          await respond(buildOwnedVoiceTextPrompt(profile));
        } catch (error) {
          onError(error, { chatId, actorId, action: 'owned_voice_use' });
          await respond(buildVoiceLibraryMessage());
        }
        return;
      }

      const ownedVoicePreview = callbackValue(callback.data, 'ownedvoicepreview');
      if (ownedVoicePreview) {
        try {
          const preview = await voiceService?.previewOwnedVoice?.({
            ownerTelegramId: String(actorId),
            profileId: ownedVoicePreview
          });
          if (!preview) throw new Error('Owned voice preview is unavailable.');
          await clearVoicePreview(chatId);
          const sentPreview = await telegram.sendAudio(chatId, preview.audio, {
            caption: 'пример личного голоса',
            mimeType: preview.contentType,
            fileName: 'my-voice-preview.mp3',
            reply_markup: { inline_keyboard: navigationRows(`ownedvoice:${ownedVoicePreview}`, '‹ назад к голосу') }
          });
          if (sentPreview?.message_id) trackVoicePreview(chatId, sentPreview.message_id, preview);
        } catch (error) {
          onError(error, { chatId, actorId, action: 'owned_voice_preview' });
          await respond(buildVoiceLibraryMessage({ profiles: voiceService?.listOwnedVoices?.(String(actorId)) ?? [] }));
        }
        return;
      }

      const ownedVoiceDeleteConfirm = callbackValue(callback.data, 'ownedvoicedeleteconfirm');
      if (ownedVoiceDeleteConfirm) {
        const profile = voiceService?.listOwnedVoices?.(String(actorId))
          ?.find(({ profileId }) => profileId === ownedVoiceDeleteConfirm);
        await respond(profile ? buildOwnedVoiceDeleteMessage(profile) : buildVoiceLibraryMessage());
        return;
      }

      const ownedVoiceDelete = callbackValue(callback.data, 'ownedvoicedelete');
      if (ownedVoiceDelete) {
        try {
          voiceService?.deleteOwnedVoice?.(String(actorId), ownedVoiceDelete, new Date(now()));
          await respond(buildVoiceLibraryMessage({ profiles: voiceService?.listOwnedVoices?.(String(actorId)) ?? [] }));
        } catch (error) {
          onError(error, { chatId, actorId, action: 'owned_voice_delete' });
          await respond(buildVoiceLibraryMessage());
        }
        return;
      }

      if (callback.data === 'voiceclone:consent'
        || callback.data === 'voiceclone:confirm:own_voice'
        || callback.data === 'voiceclone:cancel') {
        await respond(buildVoiceLibraryMessage({ profiles: voiceService?.listOwnedVoices?.(String(actorId)) ?? [] }));
        return;
      }

      const voiceCard = callbackValue(callback.data, 'voicecard');
      if (voiceCard) {
        clearActiveSelection(chatId);
        voiceTextDrafts.delete(chatId);
        voiceConfirmations.delete(chatId);
        await respond(buildVoiceCardMessage(voiceCard));
        return;
      }

      const voiceUse = callbackValue(callback.data, 'voiceuse');
      if (voiceUse) {
        if (!getCuratedVoice(voiceUse)) {
          await respond(buildVoiceLibraryMessage());
          return;
        }
        clearActiveSelection(chatId);
        voiceConfirmations.delete(chatId);
        voiceTextDrafts.set(chatId, Object.freeze({ voiceId: voiceUse }));
        await respond(buildVoiceTextPrompt(voiceUse));
        return;
      }

      const voiceGenerate = callbackValue(callback.data, 'voicegenerate');
      if (voiceGenerate) {
        const separator = voiceGenerate.lastIndexOf(':');
        const voiceId = separator > 0 ? voiceGenerate.slice(0, separator) : '';
        const confirmationToken = separator > 0 ? voiceGenerate.slice(separator + 1) : '';
        await runVoiceTextToSpeech({
          chatId,
          actorId,
          actorUsername: callback.from?.username ?? '',
          voiceId,
          confirmationToken
        });
        return;
      }

      const voicePreview = callbackValue(callback.data, 'voicepreview');
      if (voicePreview) {
        if (!voiceService?.previewVoice) {
          await respond(buildVoiceEarlyAccessMessage(voicePreview));
          return;
        }
        try {
          const preview = await voiceService.previewVoice({
            type: 'id',
            value: `voice-preview-${voicePreview}`
          });
          await clearVoicePreview(chatId);
          const sentPreview = await telegram.sendAudio(chatId, preview.audio, {
            caption: 'пример голоса',
            mimeType: preview.contentType,
            fileName: 'voice-preview.mp3',
            reply_markup: {
              inline_keyboard: navigationRows(`voicecard:${voicePreview}`, '‹ назад к карточке')
            }
          });
          if (sentPreview?.message_id) trackVoicePreview(chatId, sentPreview.message_id, preview);
        } catch (error) {
          onError(error, { chatId, voiceId: voicePreview, action: 'voice_preview' });
          await respond({
            text: '<b>превью не загрузилось</b>\n\nпопробуй ещё раз или открой другой голос.',
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{
                  text: 'повторить',
                  callback_data: `voicepreview:${voicePreview}`
                }],
                ...navigationRows(`voicecard:${voicePreview}`, '‹ назад к карточке')
              ]
            }
          });
        }
        return;
      }

      const voiceEarly = callbackValue(callback.data, 'voiceearly');
      if (voiceEarly) {
        await respond(buildVoiceEarlyAccessMessage(voiceEarly));
        return;
      }

      const referralAction = callbackValue(callback.data, 'ref');
      if (referralAction === 'home') {
        withdrawalDrafts.delete(actorId);
        await respond(buildReferralAccountMessage(await referralAccountFor(actorId)));
        return;
      }
      if (referralAction === 'people') {
        withdrawalDrafts.delete(actorId);
        const account = await referralAccountFor(actorId);
        await respond(buildReferralPeopleMessage(account, await referralService.listReferrals(actorId)));
        return;
      }
      if (referralAction === 'earnings') {
        withdrawalDrafts.delete(actorId);
        const account = await referralAccountFor(actorId);
        await respond(buildReferralEarningsMessage(account, await referralService.listEarnings(actorId)));
        return;
      }
      if (referralAction === 'levels') {
        withdrawalDrafts.delete(actorId);
        await respond(buildReferralLevelsMessage(await referralAccountFor(actorId)));
        return;
      }
      if (referralAction === 'onboarding') {
        withdrawalDrafts.delete(actorId);
        await respond(buildPartnerOnboardingMessage(await partnerOnboardingFor(actorId)));
        return;
      }
      if (referralAction === 'onboarding:offer') {
        const publishedOfferUrl = config?.referralPayout?.offerUrl
          ?? config?.legalConsent?.urls?.referralOffer
          ?? '';
        const offerVersion = config?.referralPayout?.offerVersion
          ?? 'partner-program-2026-08-14';
        const trackingSecret = config?.referralPayout?.offerTrackingSecret ?? '';
        const publicBaseUrl = config?.publicBaseUrl ?? '';
        if (!publishedOfferUrl || !publicBaseUrl || Buffer.byteLength(trackingSecret, 'utf8') < 32) {
          await respond({
            text: '<b>оферта временно недоступна</b>\n\nпопробуй открыть оформление выплат позже.',
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: navigationRows('ref:onboarding') }
          });
          return;
        }
        const offerUrl = createReferralOfferTrackingUrl({
          publicBaseUrl,
          secret: trackingSecret,
          telegramId: actorId,
          offerVersion,
          expiresAt: new Date(now() + 24 * 60 * 60 * 1000)
        });
        await respond(buildPartnerOfferMessage({ offerUrl, offerVersion }));
        return;
      }
      const offerAcceptMatch = referralAction?.match(/^onboarding:offer:accept:([a-z0-9][a-z0-9._-]{0,31})$/u);
      if (offerAcceptMatch) {
        if (typeof referralService.acceptPartnerOffer !== 'function') {
          await respond(buildPartnerOnboardingMessage(await partnerOnboardingFor(actorId)));
          return;
        }
        const documentSha256 = String(config?.referralPayout?.offerDocumentSha256 ?? '').trim().toLowerCase();
        if (!/^[a-f0-9]{64}$/u.test(documentSha256)) {
          await respond({
            text: '<b>не получилось подтвердить документ</b>\n\nверсия оферты ещё не опубликована. попробуй позже.',
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: navigationRows('ref:onboarding') }
          });
          return;
        }
        try {
          await referralService.acceptPartnerOffer({
            telegramId: actorId,
            offerVersion: offerAcceptMatch[1],
            documentSha256,
            acceptedAt: new Date(now()),
            telegramUpdateId: String(update.update_id),
            sourceEventId: String(callback.id),
            metadata: { source: 'telegram_bot', callbackQueryId: callback.id }
          });
        } catch (error) {
          if (/offer must be opened first|offer_open_required/iu.test(String(error?.message ?? ''))) {
            await respond({
              text: '<b>сначала открой оферту</b>\n\nнажми первую кнопку, открой документ, затем вернись и подтверди условия.',
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: navigationRows('ref:onboarding:offer') }
            });
            return;
          }
          throw error;
        }
        await respond(buildPartnerStatusMessage());
        return;
      }
      if (referralAction === 'onboarding:status') {
        const onboarding = await partnerOnboardingFor(actorId);
        await respond(onboarding.offerAccepted
          ? buildPartnerStatusMessage()
          : buildPartnerOnboardingMessage(onboarding));
        return;
      }
      const partnerStatusMatch = referralAction?.match(/^onboarding:status:(self_employed|ip|legal_entity)$/u);
      if (partnerStatusMatch) {
        const onboarding = await partnerOnboardingFor(actorId);
        if (!onboarding.offerAccepted) {
          await respond(buildPartnerOnboardingMessage(onboarding));
          return;
        }
        partnerOnboardingDrafts.set(actorId, Object.freeze({
          step: 'full_name',
          legalStatus: partnerStatusMatch[1]
        }));
        await respond({
          text: '<b>данные получателя</b>\n\nпришли ФИО самозанятого или ИП либо полное название организации одним сообщением.',
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: navigationRows('ref:onboarding') }
        });
        return;
      }
      if (referralAction === 'withdraw') {
        withdrawalDrafts.delete(actorId);
        const onboarding = typeof referralService.getPartnerOnboarding === 'function'
          ? await partnerOnboardingFor(actorId)
          : null;
        await respond(buildReferralWithdrawalMessage({
          ...await referralAccountFor(actorId),
          ...(onboarding ? { partnerOnboarding: onboarding } : {})
        }));
        return;
      }
      if (referralAction === 'withdraw:start') {
        const account = await referralAccountFor(actorId);
        if (typeof referralService.getPartnerOnboarding === 'function') {
          const onboarding = await partnerOnboardingFor(actorId);
          if (!onboarding.payoutEnabled) {
            await respond(buildReferralWithdrawalMessage({ ...account, partnerOnboarding: onboarding }));
            return;
          }
        }
        if (account.availableKopecks < 100_000) {
          await respond(buildReferralWithdrawalMessage(account));
          return;
        }
        withdrawalDrafts.set(actorId, Object.freeze({ step: 'amount' }));
        await respond(buildWithdrawalAmountPrompt(account));
        return;
      }
      const withdrawalMethodMatch = referralAction?.match(/^withdraw:method:(sbp|bank_card)$/u);
      if (withdrawalMethodMatch) {
        const currentDraft = withdrawalDrafts.get(actorId);
        if (currentDraft?.step !== 'method') {
          await respond(buildReferralWithdrawalMessage(await referralAccountFor(actorId)));
          return;
        }
        const method = withdrawalMethodMatch[1];
        const setupBaseUrl = String(
          payoutSetupBaseUrl
            || config?.generatedMedia?.publicBaseUrl
            || config?.publicBaseUrl
            || ''
        ).replace(/\/+$/u, '');
        if (setupBaseUrl && typeof referralService.createPayoutSetup === 'function') {
          try {
            const setup = referralService.createPayoutSetup({
              telegramId: actorId,
              amountKopecks: currentDraft.amountKopecks,
              method
            });
            withdrawalDrafts.delete(actorId);
            await respond(buildWithdrawalDestinationPrompt(
              currentDraft.amountKopecks,
              method,
              `${setupBaseUrl}/payout/setup/${setup.setupToken}`
            ));
          } catch (error) {
            onError(error, { chatId, actorId, action: 'referral_payout_setup' });
            await respond({
              text: 'не получилось открыть защищённую форму реквизитов. попробуй ещё раз чуть позже.',
              reply_markup: { inline_keyboard: navigationRows('ref:withdraw') }
            });
          }
          return;
        }
        withdrawalDrafts.set(actorId, Object.freeze({
          step: 'destination',
          amountKopecks: currentDraft.amountKopecks,
          method
        }));
        await respond(buildWithdrawalDestinationPrompt(currentDraft.amountKopecks, method));
        return;
      }

      const preferenceAction = callbackValue(callback.data, 'prefs');
      if (preferenceAction === 'language' || preferenceAction === 'length') {
        await respond(buildUserPreferenceOptions(preferenceAction, preferencesFor(chatId)));
        return;
      }
      if (preferenceAction?.startsWith('set:')) {
        const [, key, value] = preferenceAction.match(/^set:([^:]+):([^:]+)$/) ?? [];
        if (!key || !value) return;
        const updated = applyUserPreference(preferencesFor(chatId), key, value);
        savePreferences(chatId, updated);
        await respond(userSettingsMessageFor(chatId, updated));
        return;
      }
      const preferenceCycle = callbackValue(callback.data, 'prefcycle');
      if (preferenceCycle) {
        const updated = cycleUserPreference(preferencesFor(chatId), preferenceCycle);
        savePreferences(chatId, updated);
        await respond(userSettingsMessageFor(chatId, updated));
        return;
      }

      const generationHistoryAction = callbackValue(callback.data, 'genhist');
      const generationHistoryList = generationHistoryAction?.match(/^list:(\d+)$/);
      if (generationHistoryList) {
        const page = Number(generationHistoryList[1]);
        try {
          const history = await historyService?.listGenerations?.({
            telegramUserId: String(actorId),
            limit: GENERATION_HISTORY_PAGE_SIZE,
            offset: page * GENERATION_HISTORY_PAGE_SIZE,
            scope: 'media'
          });
          await respond(history
            ? buildGenerationHistoryListMessage({
                ...history,
                page,
                hasMore: Boolean(history.hasMore || history.nextCursor)
              })
            : buildGenerationHistoryUnavailableMessage());
        } catch (error) {
          onError(error, { chatId, action: 'generation_history_list' });
          await respond(buildGenerationHistoryUnavailableMessage());
        }
        return;
      }

      const generationHistoryRepeat = generationHistoryAction
        ?.match(/^repeat:([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i);
      if (generationHistoryRepeat) {
        const [, generationId] = generationHistoryRepeat;
        try {
          const generation = await historyService?.getGeneration?.({
            telegramUserId: String(actorId),
            generationId
          });
          const model = generation?.subjectType === 'model'
            ? getModelById(generation.subjectId)
            : null;
          const prompt = String(generation?.prompt ?? '').trim();
          if (
            !generation
            || generation.status !== 'completed'
            || !model
            || model.availability !== 'available'
            || !prompt
          ) {
            await respond({
              text: 'повтор этого запуска недоступен: исходный промпт или маршрут модели не сохранился.',
              reply_markup: { inline_keyboard: navigationRows('genhist:list:0') }
            });
            return;
          }
          await runSelectedRequest({
            chatId,
            actorId,
            actorUsername: callback.from?.username ?? '',
            selected: model,
            inputs: ['text'],
            prompt,
            telegramInput: {},
            requestKey: `repeat:history:${chatId}:${callback.id}`
          });
        } catch (error) {
          onError(error, { chatId, actorId, generationId, action: 'generation_history_repeat' });
          await respond(buildGenerationHistoryUnavailableMessage());
        }
        return;
      }

      const generationHistoryItem = generationHistoryAction
        ?.match(/^item:([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}):(\d+)$/i);
      if (generationHistoryItem) {
        const [, generationId, pageValue] = generationHistoryItem;
        try {
          const generation = await historyService?.getGeneration?.({
            telegramUserId: String(actorId),
            generationId
          });
          await respond(generation
            ? buildGenerationHistoryDetailMessage(generation, { page: Number(pageValue) })
            : buildGenerationHistoryUnavailableMessage());
        } catch (error) {
          onError(error, { chatId, action: 'generation_history_detail' });
          await respond(buildGenerationHistoryUnavailableMessage());
        }
        return;
      }

      const taskHistoryAction = callbackValue(callback.data, 'taskhist');
      const taskHistoryList = taskHistoryAction?.match(/^list:(\d+)$/);
      if (taskHistoryList) {
        const page = Number(taskHistoryList[1]);
        try {
          const history = await historyService?.listGenerations?.({
            telegramUserId: String(actorId),
            limit: GENERATION_HISTORY_PAGE_SIZE,
            offset: page * GENERATION_HISTORY_PAGE_SIZE,
            kind: 'agent',
            scope: 'agent'
          });
          await respond(history
            ? buildGenerationHistoryListMessage({
                ...history,
                page,
                historyType: 'task',
                hasMore: Boolean(history.hasMore || history.nextCursor)
              })
            : buildGenerationHistoryUnavailableMessage({ historyType: 'task' }));
        } catch (error) {
          onError(error, { chatId, action: 'task_history_list' });
          await respond(buildGenerationHistoryUnavailableMessage({ historyType: 'task' }));
        }
        return;
      }

      const taskHistoryItem = taskHistoryAction
        ?.match(/^item:([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}):(\d+)$/i);
      if (taskHistoryItem) {
        const [, generationId, pageValue] = taskHistoryItem;
        try {
          const generation = await historyService?.getGeneration?.({
            telegramUserId: String(actorId),
            generationId
          });
          await respond(generation
            ? buildGenerationHistoryDetailMessage(generation, {
                page: Number(pageValue),
                historyType: 'task'
              })
            : buildGenerationHistoryUnavailableMessage({ historyType: 'task' }));
        } catch (error) {
          onError(error, { chatId, action: 'task_history_detail' });
          await respond(buildGenerationHistoryUnavailableMessage({ historyType: 'task' }));
        }
        return;
      }

      const billingAction = callbackValue(callback.data, 'billing');
      const billingParts = billingAction?.split(':') ?? [];
      const billingOrigin = (value, fallback = 'profile') => {
        if (value === 'balance' || value === 'profile') return value;
        return fallback;
      };
      if (billingAction === 'home') {
        await respond(markMenuMedia(
          buildBalanceHomeMessage(await referralAccountFor(actorId)),
          'balance'
        ));
        return;
      }
      if (billingParts[0] === 'method') {
        await respond(buildPaymentMethodMessage('rub', billingParts[2]));
        return;
      }
      if (billingParts[0] === 'plans') {
        const origin = billingOrigin(billingParts[1]);
        await respond(buildPlansMessage(await referralAccountFor(actorId), origin));
        return;
      }
      if (billingParts[0] === 'planinfo') {
        const [, productId, originValue] = billingParts;
        const origin = billingOrigin(originValue);
        await respond(buildPlanDetailsMessage(
          productId,
          await referralAccountFor(actorId),
          origin
        ));
        return;
      }
      if (billingParts[0] === 'packages') {
        const origin = billingOrigin(billingParts[1], 'balance');
        await respond(buildMetacoinPackagesMessage(origin));
        return;
      }
      if (billingParts[0] === 'history') {
        const origin = billingOrigin(billingParts[1]);
        await respond(buildBillingHistoryMessage(origin));
        return;
      }
      if (billingParts[0] === 'promo' && billingParts[1] !== 'enter') {
        const origin = billingOrigin(billingParts[1]);
        promoDrafts.delete(actorId);
        await respond(buildPromoMessage(promoCodes.get(actorId), origin));
        return;
      }
      if (billingParts[0] === 'promo' && billingParts[1] === 'enter') {
        const origin = billingOrigin(billingParts[2]);
        promoDrafts.set(actorId, origin);
        await deliverUi(chatId, buildPromoEntryMessage());
        return;
      }
      if (billingParts[0] === 'plan') {
        const [, productId, durationValue, originValue] = billingParts;
        const durationMonths = Number(durationValue ?? 1);
        const origin = billingOrigin(originValue);
        if (productId === 'newcomer' || !getSubscriptionPlan(productId)) {
          await respond(buildPlansMessage(await referralAccountFor(actorId), origin));
          return;
        }
        const account = await referralAccountFor(actorId);
        const paymentMethods = isPaidSubscriptionActive(account, new Date(now()))
          ? enabledPaymentMethods({ kind: 'plan', productId, durationMonths })
            .filter((method) => method !== 'crypto_usdc')
          : enabledPaymentMethods({ kind: 'plan', productId, durationMonths });
        await respond(buildInvoicePlaceholderMessage({
          kind: 'plan',
          productId,
          durationMonths,
          account,
          promo: activePromoFor(actorId),
          origin,
          paymentLinks: config.paymentLinks,
          paymentMethods
        }));
        return;
      }
      if (billingParts[0] === 'package') {
        const [, productId, originValue] = billingParts;
        const origin = billingOrigin(originValue, 'balance');
        if (!getMetacoinPackage(productId)) {
          await respond(buildMetacoinPackagesMessage(origin));
          return;
        }
        await respond(buildInvoicePlaceholderMessage({
          kind: 'package',
          productId,
          account: await referralAccountFor(actorId),
          promo: activePromoFor(actorId),
          origin,
          paymentLinks: config.paymentLinks,
          paymentMethods: enabledPaymentMethods({ kind: 'package', productId, durationMonths: 1 })
        }));
        return;
      }
      if (billingParts[0] === 'checkout') {
        if (billingParts[1] === 'crypto_usdc') {
          const [, , kind, productId, durationOrOrigin, maybeOrigin] = billingParts;
          const origin = billingOrigin(
            kind === 'plan' ? maybeOrigin : durationOrOrigin,
            kind === 'package' ? 'balance' : 'profile'
          );
          await startCryptoUsdcCheckout({
            chatId,
            actorId,
            kind,
            productId,
            durationMonths: kind === 'plan' ? Number(durationOrOrigin ?? 1) : 1,
            origin,
            reply: respond
          });
          return;
        }
        const [, kind, productId, durationOrOrigin, maybeOrigin, planExpectedAmount] = billingParts;
        const origin = billingOrigin(
          kind === 'plan' ? maybeOrigin : durationOrOrigin,
          kind === 'package' ? 'balance' : 'profile'
        );
        const expectedAmountValue = kind === 'plan' ? planExpectedAmount : maybeOrigin;
        await startYooKassaCheckout({
          chatId,
          actorId,
          kind,
          productId,
          durationMonths: kind === 'plan' ? Number(durationOrOrigin ?? 1) : 1,
          expectedAmountKopecks: /^\d+$/u.test(String(expectedAmountValue ?? ''))
            ? Number(expectedAmountValue)
            : undefined,
          origin,
          reply: respond
        });
        return;
      }
      const dialogAction = callbackValue(callback.data, 'dialog');
      if (dialogAction?.startsWith('new:model:') || dialogAction?.startsWith('new:')) {
        const modelId = dialogAction.startsWith('new:model:')
          ? dialogAction.slice('new:model:'.length)
          : dialogAction.slice('new:'.length);
        const model = getModelById(modelId) ?? (!modelId ? currentModelFor(chatId) : null);
        if (!model || !isConversationalModel(model)) return;
        historyService?.rotateConversation?.({
          telegramUserId: actorId,
          subjectType: 'model',
          subjectId: model.id
        });
        saveAgentSelection(chatId);
        pendingModels.set(chatId, model);
        saveSelection(chatId, model);
        await showContextCleared(model);
        return;
      }

      const generationAction = callbackValue(callback.data, 'generation');
      const compactGenerationAction = callbackValue(callback.data, 'gen');
      const normalizedGenerationAction = generationAction ?? compactGenerationAction;
      if (normalizedGenerationAction?.startsWith('new:model:') || normalizedGenerationAction?.startsWith('new:')) {
        const modelId = normalizedGenerationAction.startsWith('new:model:')
          ? normalizedGenerationAction.slice('new:model:'.length)
          : normalizedGenerationAction.slice('new:'.length);
        const model = getModelById(modelId) ?? (!modelId ? currentModelFor(chatId) : null);
        if (!model || isConversationalModel(model)) return;
        historyService?.rotateConversation?.({
          telegramUserId: actorId,
          subjectType: 'model',
          subjectId: model.id
        });
        saveAgentSelection(chatId);
        pendingModels.set(chatId, model);
        saveSelection(chatId, model);
        await respond(buildModelSelectedMessage(model));
        return;
      }

      const dialogHistoryAction = callbackValue(callback.data, 'dialoghist');
      if (dialogHistoryAction?.startsWith('list')) {
        const requestedPage = Number(dialogHistoryAction.split(':')[1] ?? 0);
        await respond(await dialogHistoryMessageFor(
          actorId,
          Number.isSafeInteger(requestedPage) ? requestedPage : 0,
          currentModelFor(chatId)
        ));
        return;
      }
      if (dialogHistoryAction?.startsWith('view:')) {
        const conversationId = dialogHistoryAction.slice('view:'.length);
        await respond(await dialogThreadMessageFor(actorId, conversationId));
        return;
      }
      if (dialogHistoryAction?.startsWith('continue:')) {
        const conversationId = dialogHistoryAction.slice('continue:'.length);
        const resumed = await historyService?.resumeDialog?.({
          telegramUserId: actorId,
          conversationId
        });
        const model = getModelById(resumed?.subjectId);
        if (!resumed || !model || !isConversationalModel(model)) {
          await respond(await dialogHistoryMessageFor(actorId, 0, currentModelFor(chatId)));
          return;
        }
        saveAgentSelection(chatId);
        pendingModels.set(chatId, model);
        saveSelection(chatId, model);
        await respond(buildModelSelectedMessage(model));
        return;
      }
      if (dialogHistoryAction?.startsWith('archive:')) {
        const conversationId = dialogHistoryAction.slice('archive:'.length);
        await historyService?.archiveDialog?.({
          telegramUserId: actorId,
          conversationId
        });
        await respond(await dialogHistoryMessageFor(actorId, 0, currentModelFor(chatId)));
        return;
      }

      const category = callbackValue(callback.data, 'modelcat');
      if (category) {
        videoConstructorDrafts.delete(chatId);
        clearActiveSelection(chatId);
        await respond(buildModelCategoryMessage(category), menuMediaForCategory[category]);
        return;
      }

      if (callback.data === 'scenarios:home') {
        clearActiveSelection(chatId);
        await respond(buildScenarioCatalogMessage(), 'tools');
        return;
      }

      const scenarioAction = callbackValue(callback.data, 'scenario');
      if (scenarioAction?.startsWith('use:')) {
        const scenario = getScenarioById(scenarioAction.slice('use:'.length));
        const target = getModelById(scenario?.targetId);
        if (!scenario || !target || target.availability !== 'available') return;
        saveAgentSelection(chatId);
        pendingScenarios.set(chatId, scenario);
        pendingModels.set(chatId, target);
        saveSelection(chatId, target);
        await respond(buildModelSelectedMessage(target));
        return;
      }
      const scenario = getScenarioById(scenarioAction);
      if (scenario) {
        clearActiveSelection(chatId);
        await respond(buildScenarioMessage(scenario), 'tools');
        return;
      }

      const toolCategory = callbackValue(callback.data, 'toolcat');
      if (toolCategory) {
        clearActiveSelection(chatId);
        await respond(buildToolCategoryMessage(toolCategory), 'tools');
        return;
      }

      if (callback.data === 'agents:home') {
        clearActiveSelection(chatId);
        await respond(buildAgentCatalogMenu(), 'agents');
        return;
      }

      if (callback.data === 'ent:home') {
        const draft = congratulatorDrafts.get(chatId);
        if (draft?.billing?.ok && draft.requestKey && draft.access?.allowed) {
          releaseGeneration({
            actorId: callback.from?.id ?? chatId,
            debitMetacoins: draft.access.debitMetacoins,
            requestKey: draft.requestKey,
            label: 'congratulator',
            billing: draft.billing
          });
          congratulatorDrafts.delete(chatId);
        }
        clearActiveSelection(chatId);
        await respond(buildEntertainmentMenu(), 'entertainment');
        return;
      }
      const entertainmentCardId = callbackValue(callback.data, 'ent:card');
      if (entertainmentCardId) {
        clearActiveSelection(chatId);
        await respond(buildEntertainmentCard(entertainmentCardId));
        return;
      }
      const entertainmentUseId = callbackValue(callback.data, 'ent:use');
      if (entertainmentUseId) {
        const entertainment = getEntertainmentById(entertainmentUseId);
        const entertainmentAgent = entertainmentAgentFor(entertainment);
        if (!entertainment || !entertainmentAgent) return;
        if (entertainmentFlowFor(entertainment.id)) {
          await respond(buildEntertainmentFlowMessage(entertainment.id));
          return;
        }
        if (isInteractiveEntertainment(entertainment.id)) {
          if (entertainment.id === 'ent_calorie_estimator') {
            saveAgentSelection(chatId, entertainmentAgent);
            selectedEntertainments.set(chatId, entertainment);
          }
          await respond(buildInteractiveEntertainmentStart(entertainment.id));
          return;
        }
        saveAgentSelection(chatId, entertainmentAgent);
        selectedEntertainments.set(chatId, entertainment);
        await respond(buildEntertainmentSelectedMessage(entertainment));
        return;
      }

      if (callback.data.startsWith('ent:flow:')) {
        const [, , entertainmentId, optionId] = callback.data.split(':');
        const selectedFlow = chooseEntertainmentFlow(entertainmentId, optionId);
        if (!selectedFlow) return;
        saveAgentSelection(chatId, selectedFlow.agent);
        selectedEntertainments.set(chatId, selectedFlow.entertainment);
        await respond(selectedFlow.message);
        return;
      }

      if (callback.data.startsWith('entflow:')) {
        if (callback.data === 'entflow:language:progress') {
          const restored = entertainmentFlowStates.get(chatId)
            ?? await restoreEntertainmentFlow(callback.from?.id ?? chatId, chatId);
          const state = entertainmentFlowStates.get(chatId) ?? restored;
          const text = state?.id === 'ent_language_tutor'
            ? `<b>📊 прогресс</b>\n\nязык: <b>${escapeHtml(state.language)}</b>\nпройдено реплик: <b>${Number(state.turn) || 0} из ${Number(state.maxTurns) || 20}</b>`
            : '<b>📊 прогресс</b>\n\nсначала выбери язык и начни занятие.';
          await respond({ text, parse_mode: 'HTML', reply_markup: buildInteractiveEntertainmentStart('ent_language_tutor').reply_markup });
          return;
        }
        if (callback.data === 'entflow:lila:roll') {
          const state = entertainmentFlowStates.get(chatId);
          const entertainment = getEntertainmentById('ent_lila');
          const agent = entertainmentAgentFor(entertainment);
          if (!state || !agent) return;
          const turn = prepareEntertainmentTurn(state, state.question);
          if (!turn) {
            await respond({ text: '<b>сессия завершена</b>', parse_mode: 'HTML' });
            return;
          }
          const persistedState = await persistEntertainmentFlow(callback.from?.id ?? chatId, turn.state, {
            transitionKey: `lila:${turn.state.turn}`
          });
          entertainmentFlowStates.set(chatId, persistedState);
          await runSelectedAgentRequest({
            chatId,
            actorId: callback.from?.id ?? chatId,
            actorUsername: callback.from?.username ?? '',
            agent,
            prompt: turn.prompt,
            entertainment,
            entertainmentFlow: Object.freeze({ ...turn, state: persistedState }),
            requestKey: `ent-lila:${chatId}:${turn.state.sessionId}:${turn.state.turn}`
          });
          return;
        }
        const flowState = flowStateFromCallback(callback.data, `${chatId}:${callback.id ?? now()}`);
        if (!flowState) return;
        const entertainment = getEntertainmentById(flowState.id);
        const entertainmentAgent = entertainmentAgentFor(entertainment);
        if (!entertainment || !entertainmentAgent) return;
        const persistedState = await persistEntertainmentFlow(callback.from?.id ?? chatId, flowState, {
          transitionKey: `start:${callback.data}`
        });
        entertainmentFlowStates.set(chatId, persistedState);
        saveAgentSelection(chatId, entertainmentAgent);
        selectedEntertainments.set(chatId, entertainment);
        await respond(buildFlowReadyMessage(flowState));
        return;
      }

      const quizCategory = callbackValue(callback.data, 'entquiz:category');
      if (quizCategory) {
        if (!QUIZ_CATEGORIES[quizCategory]) return;
        const draft = Object.freeze({ category: quizCategory });
        entertainmentQuizDrafts.set(chatId, draft);
        await respond(buildQuizSetupMessage(draft));
        return;
      }
      const quizDifficulty = callbackValue(callback.data, 'entquiz:difficulty');
      if (quizDifficulty) {
        const previous = entertainmentQuizDrafts.get(chatId);
        if (!previous?.category || !QUIZ_DIFFICULTIES[quizDifficulty]) return;
        const draft = Object.freeze({ ...previous, difficulty: quizDifficulty });
        entertainmentQuizDrafts.set(chatId, draft);
        await respond(buildQuizSetupMessage(draft));
        return;
      }
      const quizCountValue = callbackValue(callback.data, 'entquiz:count');
      if (quizCountValue) {
        const draft = entertainmentQuizDrafts.get(chatId);
        const count = Number(quizCountValue);
        const entertainment = getEntertainmentById('ent_quiz');
        const agent = entertainmentAgentFor(entertainment);
        if (!draft?.category || !draft?.difficulty || !QUIZ_COUNTS.includes(count) || !agent) return;
        const requestKey = `ent-quiz:${chatId}:${callback.id ?? now()}`;
        const actorId = callback.from?.id ?? chatId;
        const priceMetacoins = calculateAgentRunPrice(agent);
        const fullAccess = hasFullAccess({ username: callback.from?.username ?? '', actorId, ownerId: config.botOwnerId });
        const access = fullAccess && config.ownerMeteredAccess !== true
          ? Object.freeze({ allowed: true, debitMetacoins: 0 })
          : decideModelAccess({ account: await referralAccountFor(actorId), modelId: agent.primaryModel, priceMetacoins, freeModelIds: FREE_MODEL_IDS, now: new Date(now()) });
        if (!access.allowed) {
          await respond(buildGenerationAccessMessage(access.reason));
          return;
        }
        const billing = reserveGeneration({ actorId, debitMetacoins: access.debitMetacoins, requestKey, label: 'quiz generation' });
        if (!billing.ok) {
          await respond(buildGenerationAccessMessage('insufficient_metacoins'));
          return;
        }
        try {
          const request = buildAgentLlmRequest({
            agent,
            userPrompt: buildQuizGenerationPrompt({ ...draft, count }),
            agentSettings: agentSettingsFor(chatId, agent),
            preferenceText: preferenceInstructions(preferencesFor(chatId))
          });
          await deliverGenerationStatus(chatId, buildGenerationStatusMessage({ category: 'entertainment', name: 'квиз', subjectType: 'entertainment' }));
          const historyRun = await historyService?.startGeneration?.({
            telegramUserId: actorId, telegramChatId: chatId, requestKey, kind: 'agent',
            subjectType: 'entertainment', subjectId: 'ent_quiz', title: entertainment.name,
            prompt: `квиз: ${draft.category}, ${draft.difficulty}, ${count} вопросов`,
            parameters: { category: draft.category, difficulty: draft.difficulty, count }, metacoinsQuoted: priceMetacoins
          });
          let result = generationResults.get(requestKey);
          if (!result) result = await invokeLlm({
            prompt: request.prompt,
            providerModels: request.routeCandidates.map(({ providerModelId }) => providerModelId).filter(Boolean),
            providerKeys: config.providerKeys,
            settings: request.settings,
            allowSecondaryProviders: true,
            allowFreeFallback: true,
            fetchImpl: providerFetch
          });
          generationResults.set(requestKey, result);
          const questions = parseQuizQuestions(result.text, count);
          const state = createQuizState({ sessionId: requestKey, ...draft, questions });
          await respond(buildQuizQuestionMessage(state));
          if (result.billingTier === 'free') {
            releaseGeneration({ actorId, debitMetacoins: access.debitMetacoins, requestKey, label: 'quiz generation', billing });
          } else {
            await commitGeneration({ actorId, debitMetacoins: access.debitMetacoins, requestKey, label: 'quiz generation', billing });
          }
          await completeGenerationSafely(historyRun, {
            outputText: `создан квиз из ${count} вопросов`, outputType: 'text',
            metacoinsCharged: result.billingTier === 'free' ? 0 : access.debitMetacoins,
            provider: result.provider, providerModelId: result.model ?? null
          }, { actorId, requestKey });
          saveAgentSelection(chatId, agent);
          selectedEntertainments.set(chatId, entertainment);
          const persistedState = await persistEntertainmentFlow(actorId, state, { transitionKey: `start:${requestKey}`, charged: true, cost: result.billingTier === 'free' ? 0 : access.debitMetacoins });
          entertainmentFlowStates.set(chatId, persistedState);
          generationResults.delete(requestKey);
        } catch (error) {
          releaseGeneration({ actorId, debitMetacoins: access.debitMetacoins, requestKey, label: 'quiz generation', billing });
          // Keep a completed provider result when a post-delivery persistence step fails.
          // A retry can then finish the durable session without paying the provider twice.
          onError(error, { chatId, action: 'entertainment_quiz_generation' });
          await respond({ text: 'не получилось завершить запуск квиза. открой его ещё раз; повторный callback не создаст второй игровой ход.' });
        }
        return;
      }
      if (callback.data.startsWith('entquiz:answer:')) {
        const state = entertainmentFlowStates.get(chatId);
        if (state?.id !== 'ent_quiz') return;
        const [, , questionIndex, answerIndex, token] = callback.data.split(':');
        if (Number(questionIndex) !== state.index || token !== state.token) return;
        const answered = answerQuizQuestion(state, Number(answerIndex));
        if (!answered) return;
        const persistedState = await persistEntertainmentFlow(callback.from?.id ?? chatId, answered.state, {
          transitionKey: `answer:${answered.state.index}:${callback.id ?? answerIndex}`,
          status: answered.finished ? 'completed' : 'active'
        });
        entertainmentFlowStates.set(chatId, persistedState);
        await respond(answered.finished
          ? buildQuizResultMessage(answered.state)
          : buildQuizQuestionMessage(answered.state, answered.feedback));
        return;
      }

      const congratulatorOccasion = callbackValue(callback.data, 'entcongrats');
      if (congratulatorOccasion) {
        const previousDraft = congratulatorDrafts.get(chatId);
        if (previousDraft?.billing?.ok && previousDraft.requestKey && previousDraft.access?.allowed) {
          releaseGeneration({
            actorId,
            debitMetacoins: previousDraft.access.debitMetacoins,
            requestKey: previousDraft.requestKey,
            label: 'congratulator',
            billing: previousDraft.billing
          });
        }
        const entertainment = getEntertainmentById('ent_congratulator');
        const baseAgent = entertainmentAgentFor(entertainment);
        if (!entertainment || !baseAgent) return;
        const occasionAgent = Object.freeze({
          ...baseAgent,
          systemPrompt: `${baseAgent.systemPrompt}\n\nВыбранный повод: ${congratulatorOccasion}. Сразу подготовь законченное поздравление по данным пользователя.`
        });
        saveAgentSelection(chatId, occasionAgent);
        selectedEntertainments.set(chatId, entertainment);
        congratulatorDrafts.set(chatId, Object.freeze({ occasion: congratulatorOccasion, awaitingDetails: true }));
        await respond(buildCongratulatorPromptMessage(congratulatorOccasion));
        return;
      }

      const congratulatorToken = callbackValue(callback.data, 'entcongratulate');
      if (congratulatorToken) {
        const draft = congratulatorDrafts.get(chatId);
        if (!draft || draft.token !== congratulatorToken || !draft.text) return;
        if (!voiceService?.textToSpeech) {
          await respond({ text: 'озвучка сейчас недоступна. текст сохранён — попробуй запустить позже.' });
          return;
        }
        const { requestKey, historyRun, access, billing } = draft;
        if (!requestKey || !access?.allowed || !billing?.ok) return;
        let result = generationResults.get(requestKey);
        if (!result) {
          try {
            result = await voiceService.textToSpeech({
              ownerTelegramId: String(actorId),
              voice: { type: 'curated', id: listCuratedVoices({ limit: 1 })[0]?.id },
              text: draft.text,
              model: 'eleven_multilingual_v2',
              outputFormat: 'mp3_44100_128'
            });
            generationResults.set(requestKey, result);
          } catch (error) {
            releaseGeneration({ actorId, debitMetacoins: access.debitMetacoins, requestKey, label: 'congratulator audio', billing });
            await failGenerationSafely(historyRun, error, { actorId, requestKey });
            onError(error, { chatId, action: 'entertainment_congratulator_tts' });
            await respond({ text: 'аудио не создалось. метакоины не списаны — повтори запуск чуть позже.' });
            return;
          }
        }
        try {
          await telegram.sendAudio(chatId, result.audio ?? result.url, {
            caption: '<b>🎙 поздравление готово</b>',
            parse_mode: 'HTML',
            mimeType: result.contentType ?? 'audio/mpeg',
            reply_markup: { inline_keyboard: [[{ text: '🎰 развлечения', callback_data: 'ent:home' }, { text: '🏠 главное меню', callback_data: 'task:menu' }]] }
          });
          await commitGeneration({ actorId, debitMetacoins: access.debitMetacoins, requestKey, label: 'congratulator audio', billing });
          await completeGenerationSafely(historyRun, {
            outputType: 'audio',
            metacoinsCharged: access.debitMetacoins,
            provider: 'elevenlabs',
            providerModelId: 'eleven_multilingual_v2'
          }, { actorId, requestKey });
          congratulatorDrafts.delete(chatId);
          generationResults.delete(requestKey);
        } catch (error) {
          if (!deliveryOutcomeUnknown(error)) {
            releaseGeneration({ actorId, debitMetacoins: access.debitMetacoins, requestKey, label: 'congratulator audio', billing });
          }
          await failGenerationSafely(historyRun, error, { actorId, requestKey });
          onError(error, { chatId, action: 'entertainment_congratulator_delivery' });
          await respond({ text: 'Telegram не принял аудио. повтори запуск — повторной генерации и списания не будет.' });
        }
        return;
      }

      const memeMode = callbackValue(callback.data, 'entmeme');
      if (memeMode) {
        const imageModel = getModelById('nano_banana_2');
        if (!imageModel) return;
        clearActiveSelection(chatId);
        saveSelection(chatId, imageModel);
        pendingScenarios.set(chatId, Object.freeze({
          id: `ent_meme_sticker_${memeMode}`,
          name: '🎭 мем-стикер',
          targetId: imageModel.id,
          instruction: 'Сделай мем-стикер: один главный объект, чистый контур, простой фон и крупная читаемая подпись.',
          presetInput: Object.freeze({ text: 'Сделай мем-стикер: один главный объект, чистый контур, простой фон и крупная читаемая подпись.' })
        }));
        await respond(buildMemeStickerCaptureMessage(memeMode));
        return;
      }

      const agentCategory = callbackValue(callback.data, 'agentcat');
      if (agentCategory) {
        clearActiveSelection(chatId);
        await respond(buildAgentCategoryMessage(agentCategory), 'agents');
        return;
      }

      const agentSettingsId = callbackValue(callback.data, 'agentsettings');
      if (agentSettingsId?.startsWith('reset:')) {
        const current = getAgentById(agentSettingsId.slice('reset:'.length));
        if (!current) return;
        const reset = defaultAgentSettings(current);
        saveAgentSettings(chatId, current, reset);
        await respond(buildAgentSettingsMessage(current, reset));
        return;
      }
      const settingsAgent = getAgentById(agentSettingsId);
      if (settingsAgent) {
        saveAgentSelection(chatId, settingsAgent);
        await respond(buildAgentSettingsMessage(
          settingsAgent,
          agentSettingsFor(chatId, settingsAgent)
        ));
        return;
      }

      const newAgentId = callbackValue(callback.data, 'agent');
      if (newAgentId?.startsWith('new:')) {
        const agent = getAgentById(newAgentId.slice('new:'.length));
        if (!agent) return;
        historyService?.rotateConversation?.({
          telegramUserId: actorId,
          subjectType: 'agent',
          subjectId: agent.id
        });
        saveAgentSelection(chatId, agent);
        await respond(buildAgentSelectedMessage(agent));
        return;
      }

      const agentSettingId = callbackValue(callback.data, 'agentsetting');
      if (agentSettingId) {
        const separator = agentSettingId.lastIndexOf(':');
        const current = getAgentById(agentSettingId.slice(0, separator));
        const key = agentSettingId.slice(separator + 1);
        if (!current || separator < 1) return;
        await respond(buildAgentSettingOptionsMessage(
          current,
          key,
          agentSettingsFor(chatId, current)
        ));
        return;
      }

      const agentSettingCycle = callbackValue(callback.data, 'agentcycle');
      if (agentSettingCycle) {
        const separator = agentSettingCycle.lastIndexOf(':');
        const current = getAgentById(agentSettingCycle.slice(0, separator));
        const key = agentSettingCycle.slice(separator + 1);
        if (!current || separator < 1) return;
        const updated = cycleAgentSetting(
          current,
          agentSettingsFor(chatId, current),
          key
        );
        saveAgentSettings(chatId, current, updated);
        await respond(buildAgentSettingsMessage(current, updated));
        return;
      }

      const agentSettingChange = callbackValue(callback.data, 'agentset');
      if (agentSettingChange) {
        const [agentId, key, value, ...extra] = agentSettingChange.split(':');
        const current = getAgentById(agentId);
        if (!current || !key || !value || extra.length) return;
        const updated = applyAgentSetting(
          current,
          agentSettingsFor(chatId, current),
          key,
          value
        );
        saveAgentSettings(chatId, current, updated);
        await respond(buildAgentSettingsMessage(current, updated));
        return;
      }

      const agent = getAgentById(callbackValue(callback.data, 'agent'));
      if (agent) {
        saveAgentSelection(chatId, agent);
        await respond(buildAgentCard(agent));
        return;
      }

      const useAgent = getAgentById(callbackValue(callback.data, 'useagent'));
      if (useAgent) {
        saveAgentSelection(chatId, useAgent);
        await respond(buildAgentSelectedMessage(useAgent));
        return;
      }

      const family = callbackValue(callback.data, 'family');
      if (family) {
        const [familyId, requestedPage = '0'] = family.split(':');
        await respond(buildLlmFamilyMessage(familyId, requestedPage));
        return;
      }

      const modelId = callbackValue(callback.data, 'model');
      const model = getModelById(modelId);
      if (model) {
        pendingScenarios.delete(chatId);
        videoConstructorDrafts.delete(chatId);
        if (['early_access', 'unavailable'].includes(model.availability)) {
          pendingModels.delete(chatId);
          saveSelection(chatId);
          saveAgentSelection(chatId);
          await respond(buildModelCard(model));
          return;
        }
        saveAgentSelection(chatId);
        pendingModels.set(chatId, model);
        saveSelection(chatId, model);
        await respond(buildModelCard(model));
        return;
      }
      if (modelId) {
        await respond(buildModelCategoryMessage('llm'));
        return;
      }

      const videoAction = callbackValue(callback.data, 'video');
      if (videoAction?.startsWith('new:')) {
        const requestedVideoModelId = videoAction.slice('new:'.length);
        const videoModel = requestedVideoModelId === '_'
          ? currentModelFor(chatId)
          : getModelById(requestedVideoModelId);
        if (!videoModel || videoModel.category !== 'video' || videoModel.availability !== 'available') return;
        saveAgentSelection(chatId);
        pendingModels.set(chatId, videoModel);
        saveSelection(chatId, videoModel);
        const draft = createVideoConstructorDraft(videoModel);
        videoConstructorDrafts.set(chatId, draft);
        await respond(buildVideoModeSelectionMessage(videoModel, draft.mode));
        return;
      }

      const imageReferenceAction = callbackValue(callback.data, 'imagerefs');
      if (imageReferenceAction) {
        const imageModel = currentModelFor(chatId);
        if (!supportsImageReferences(imageModel)) return;
        if (imageReferenceAction === 'open') {
          imageReferenceCapture.add(chatId);
          await respond(buildImageReferenceMessage(
            imageModel,
            imageReferencesFor(chatId, imageModel)
          ));
          return;
        }
        if (imageReferenceAction === 'reset') {
          imageReferenceDrafts.set(imageReferenceKey(chatId, imageModel.id), Object.freeze([]));
          await respond(buildImageReferenceMessage(imageModel, []));
          return;
        }
        if (imageReferenceAction === 'done') {
          imageReferenceCapture.delete(chatId);
          await respond(buildModelSelectedMessage(imageModel));
          return;
        }
      }
      if (videoAction) {
        if (videoAction.startsWith('choose:')) {
          const videoModel = currentModelFor(chatId);
          const mode = videoAction.slice('choose:'.length);
          if (!videoModel || !modesForVideoModel(videoModel).includes(mode)) return;
          const existingDraft = videoConstructorDrafts.get(chatId);
          const draft = existingDraft?.modelId === videoModel.id
            ? existingDraft
            : createVideoConstructorDraft(videoModel);
          const updated = setVideoConstructorMode(draft, mode, videoModel);
          videoConstructorDrafts.set(chatId, updated);
          await respond(buildVideoConstructorMessage(updated, videoModel));
          return;
        }
        const draft = videoConstructorDrafts.get(chatId);
        const videoModel = draft ? getModelById(draft.modelId) : null;
        if (!draft || !videoModel) return;
        if (videoAction === 'prompt:delete') {
          const updated = clearVideoConstructorPrompt(draft);
          videoConstructorDrafts.set(chatId, updated);
          await respond(buildVideoConstructorMessage(updated, videoModel));
          return;
        }
        if (videoAction === 'close') {
          videoConstructorDrafts.delete(chatId);
          await respond(buildModelCard(videoModel));
          return;
        }
        if (videoAction === 'done') {
          saveSettings(chatId, videoModel, draft.settings);
          await respond(buildVideoLaunchMessage(draft, videoModel));
          return;
        }
        if (videoAction === 'change') {
          await respond(buildVideoModeSelectionMessage(videoModel, draft.mode));
          return;
        }
        if (videoAction === 'return') {
          await respond(buildVideoConstructorMessage(draft, videoModel));
          return;
        }
        if (videoAction === 'settings') {
          videoUploadTargets.delete(chatId);
          await respond(buildVideoConstructorMessage(draft, videoModel));
          return;
        }
        if (videoAction === 'references:back') {
          videoUploadTargets.delete(chatId);
          await respond(buildVideoConstructorMessage(draft, videoModel));
          return;
        }
        if (videoAction === 'references') {
          videoUploadTargets.set(chatId, 'references');
          const sent = await telegram.sendMessage(chatId, buildVideoReferenceUploadMessage(draft, videoModel));
          if (sent?.message_id) uiMessageIds.set(chatId, sent.message_id);
          return;
        }
        if (videoAction.startsWith('mode:')) {
          const updated = setVideoConstructorMode(
            draft,
            videoAction.slice('mode:'.length),
            videoModel
          );
          videoConstructorDrafts.set(chatId, updated);
          await respond(buildVideoConstructorMessage(updated, videoModel));
          return;
        }
        if (videoAction.startsWith('options:')) {
          await respond(buildVideoSettingOptionsMessage(
            draft,
            videoModel,
            videoAction.slice('options:'.length)
          ));
          return;
        }
        if (videoAction.startsWith('set:')) {
          const [, key, value] = videoAction.match(/^set:([^:]+):(.+)$/u) ?? [];
          if (!key || value === undefined) return;
          const updated = setVideoConstructorSetting(draft, videoModel, key, value);
          videoConstructorDrafts.set(chatId, updated);
          await respond(buildVideoConstructorMessage(updated, videoModel));
          return;
        }
        if (videoAction.startsWith('cycle:')) {
          const updated = cycleVideoConstructorSetting(
            draft,
            videoModel,
            videoAction.slice('cycle:'.length)
          );
          videoConstructorDrafts.set(chatId, updated);
          await respond(buildVideoConstructorMessage(updated, videoModel));
          return;
        }
        if (videoAction === 'reset') {
          const updated = resetVideoConstructorSettings(draft, videoModel);
          videoConstructorDrafts.set(chatId, updated);
          await respond(buildVideoConstructorMessage(updated, videoModel));
          return;
        }
        if (videoAction.startsWith('slot:')) {
          const instructions = {
            first: 'пришли изображение для первого кадра.',
            last: 'пришли изображение для последнего кадра.',
            references: 'пришли сюда изображения, видео или аудио отдельными сообщениями.',
            source: 'пришли исходный видеоклип.'
          };
          const slot = videoAction.slice('slot:'.length);
          if (!instructions[slot]) return;
          videoUploadTargets.set(chatId, slot);
          if (slot === 'references') {
            const sent = await telegram.sendMessage(chatId, buildVideoReferenceUploadMessage(draft, videoModel, {
              message: instructions[slot]
            }));
            if (sent?.message_id) uiMessageIds.set(chatId, sent.message_id);
          } else {
            await respond(buildVideoLaunchMessage(draft, videoModel, {
              message: instructions[slot]
            }));
          }
          return;
        }
        if (videoAction === 'generate') {
          const validation = validateVideoConstructorDraft(draft, videoModel);
          if (!validation.ok) {
            await respond(buildVideoLaunchMessage(draft, videoModel, {
              message: validation.message
            }));
            return;
          }
          saveSettings(chatId, videoModel, draft.settings);
          const telegramInput = videoConstructorTelegramInput(draft);
          const messages = Array.isArray(telegramInput) ? telegramInput : [telegramInput];
          await runSelectedRequest({
            chatId,
            actorId,
            actorUsername: callback.from?.username ?? '',
            selected: videoModel,
            settings: { ...draft.settings, _constructorMode: draft.mode },
            inputs: messages.flatMap(messageInputs),
            prompt: draft.prompt,
            requestKey: `video-constructor:${chatId}:${callback.id}`,
            telegramInput,
            historyMetadata: validation.historyTarget
          });
          return;
        }
      }

      const useModel = getModelById(callbackValue(callback.data, 'use'));
      if (useModel) {
        pendingScenarios.delete(chatId);
        if (['early_access', 'unavailable'].includes(useModel.availability)) {
          pendingModels.delete(chatId);
          saveSelection(chatId);
          saveAgentSelection(chatId);
          await respond(buildModelCard(useModel));
          return;
        }
        saveAgentSelection(chatId);
        pendingModels.set(chatId, useModel);
        saveSelection(chatId, useModel);
        await respond(buildModelSelectedMessage(useModel));
        return;
      }

      const settingsId = callbackValue(callback.data, 'settings');
      if (settingsId?.startsWith('done:')) {
        const requestedId = settingsId.slice('done:'.length);
        const current = (requestedId === '_' ? pendingModels.get(chatId) ?? selections.get(chatId) : getModelById(requestedId));
        if (!current) return;
        if (current.category === 'video' && modesForVideoModel(current).length > 0) {
          const draft = videoConstructorDrafts.get(chatId);
          await respond(draft?.modelId === current.id
            ? buildVideoLaunchMessage(draft, current)
            : buildModelCard(current));
          return;
        }
        pendingModels.set(chatId, current);
        saveSelection(chatId, current);
        await respond(buildModelConfiguredMessage(current, settingsFor(chatId, current)));
        return;
      }
      if (settingsId?.startsWith('reset:')) {
        const requestedId = settingsId.slice('reset:'.length);
        const current = (requestedId === '_' ? pendingModels.get(chatId) ?? selections.get(chatId) : getModelById(requestedId));
        if (!current) return;
        pendingModels.set(chatId, current);
        const reset = defaultModelSettings(current);
        saveSettings(chatId, current, reset);
        await respond(buildModelSettingsMessage(current, reset));
        return;
      }
      const settingsModel = settingsId === '_'
        ? pendingModels.get(chatId) ?? selections.get(chatId)
        : getModelById(settingsId);
      if (settingsModel) {
        pendingModels.set(chatId, settingsModel);
        await respond(buildModelSettingsMessage(settingsModel, settingsFor(chatId, settingsModel)));
        return;
      }

      const instructionsId = callbackValue(callback.data, 'instructions');
      if (instructionsId?.startsWith('clear:')) {
        const requestedId = instructionsId.slice('clear:'.length);
        const current = requestedId === '_'
          ? currentModelFor(chatId)
          : getModelById(requestedId);
        if (!current || current.category !== 'llm') return;
        const updated = { ...settingsFor(chatId, current), instructions: '' };
        saveSettings(chatId, current, updated);
        instructionDrafts.delete(chatId);
        await respond(buildModelSettingsMessage(current, updated));
        return;
      }
      const instructionsModel = instructionsId === '_'
        ? currentModelFor(chatId)
        : getModelById(instructionsId);
      if (instructionsModel?.category === 'llm') {
        pendingModels.set(chatId, instructionsModel);
        instructionDrafts.set(chatId, instructionsModel.id);
        await respond(buildModelInstructionsPrompt(
          instructionsModel,
          Boolean(settingsFor(chatId, instructionsModel).instructions)
        ));
        return;
      }

      const settingKey = callbackValue(callback.data, 'setting');
      if (settingKey) {
        const current = pendingModels.get(chatId) ?? selections.get(chatId);
        if (!current) return;
        await respond(buildSettingOptionsMessage(current, settingKey, settingsFor(chatId, current)));
        return;
      }

      const settingCycleKey = callbackValue(callback.data, 'settingcycle');
      if (settingCycleKey) {
        const current = pendingModels.get(chatId) ?? selections.get(chatId);
        if (!current) return;
        const profile = inputProfileForModel(current);
        const definition = profile.find(({ key }) => key === settingCycleKey);
        if (!definition || definition.type === 'string') return;
        const selectedValue = settingsFor(chatId, current)[settingCycleKey];
        const values = definition.values.map(({ value }) => String(value));
        const currentIndex = values.indexOf(String(selectedValue ?? definition.defaultValue));
        const nextValue = values[currentIndex < 0 ? 0 : (currentIndex + 1) % values.length];
        const updated = applyModelSetting(current, settingsFor(chatId, current), settingCycleKey, nextValue);
        saveSettings(chatId, current, updated);
        await respond(buildModelSettingsMessage(current, updated));
        return;
      }

      const settingChange = callbackValue(callback.data, 'set');
      if (settingChange) {
        const separator = settingChange.indexOf(':');
        const current = pendingModels.get(chatId) ?? selections.get(chatId);
        if (!current || separator < 1) return;
        const key = settingChange.slice(0, separator);
        const value = settingChange.slice(separator + 1);
        const updated = applyModelSetting(current, settingsFor(chatId, current), key, value);
        saveSettings(chatId, current, updated);
        await respond(buildModelSettingsMessage(current, updated));
        return;
      }

      if (callback.data === 'dialog:new') {
        const currentModel = pendingModels.get(chatId) ?? selections.get(chatId);
        if (isConversationalModel(currentModel)) {
          historyService?.rotateConversation?.({
            telegramUserId: actorId,
            subjectType: 'model',
            subjectId: currentModel.id
          });
          saveAgentSelection(chatId);
          pendingModels.set(chatId, currentModel);
          saveSelection(chatId, currentModel);
          await showContextCleared(currentModel);
        } else {
          await respond(buildModelCategoryMessage('llm'), 'llm');
        }
      }
      return;
    }

    const message = update.message;
    if (!validMessage(message)) return;
    const chatId = message.chat.id;
    const command = commandName(message.text);
    const menuTask = replyMenuTask[message.text];
    if (command) {
      instructionDrafts.delete(chatId);
      voiceTextDrafts.delete(chatId);
      voiceConfirmations.delete(chatId);
    }
    const actorId = message.from?.id ?? chatId;
    const navigationIntent = Boolean(command || menuTask);
    if (navigationIntent) {
      receiptDrafts.delete(String(actorId));
      partnerOnboardingDrafts.delete(actorId);
    }
    const startReferralCode = command === 'start'
      ? parseReferralPayload(commandArgument(message.text))
      : null;
    if (command === 'start' && referralService.processStart) {
      await referralService.processStart({
        id: actorId,
        username: message.from?.username ?? '',
        first_name: message.from?.first_name ?? ''
      }, startReferralCode ?? '');
    } else {
      runNonBlocking(
        () => markReferralUserStarted(message.from, actorId),
        { chatId, action: 'referral_activity' }
      );
    }
    runNonBlocking(
      () => hydrateState(chatId),
      { chatId, action: 'hydrate_state' }
    );
    await removeIncomingMessage(message);

    if (legalGateEnabled) {
      const legalStatus = await legalStatusFor(actorId);
      if (!isLegalConsentComplete(legalStatus)) {
        await showLegalGate({
          chatId,
          status: legalStatus,
          showDeviceMenu: command === 'start' || command === 'menu',
          actor: message.from
        });
        return;
      }
    }

    const musicDraft = musicDrafts.get(chatId);
    if (musicDraft && activeMusicConstructors.has(chatId) && !command && !menuTask) {
      if (musicDraft.awaiting === 'referenceAudio') {
        const source = message.audio ?? message.voice ?? message.document;
        const mimeType = String(source?.mime_type ?? '').toLowerCase();
        if (!source?.file_id || !['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav'].includes(mimeType)) {
          await deliverUi(chatId, { text: 'пришли аудиофайл MP3, M4A, OGG или WAV.', reply_markup: { inline_keyboard: navigationRows('musicsettings:home', '‹ назад к параметрам') } });
          return;
        }
        try {
          if (typeof uploadMedia !== 'function') throw new Error('music upload unavailable');
          const file = await telegram.getFile(source.file_id, { maxBytes: 50 * 1024 * 1024 });
          const downloaded = await telegram.downloadFile(file, { allowedMimeTypes: ['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav'], maxBytes: 50 * 1024 * 1024 });
          const url = await uploadMedia(new Blob([downloaded.data], { type: downloaded.mimeType }), { fileName: downloaded.fileName, mimeType: downloaded.mimeType });
          const updated = applyMusicSetting(musicDraft, 'referenceAudioUrl', url);
          musicDrafts.set(chatId, updated);
          await deliverUi(chatId, buildMusicSettingsMessage(updated));
        } catch (error) {
          onError(error, { chatId, actorId, action: 'music_reference_upload' });
          await deliverUi(chatId, { text: 'не получилось загрузить аудиореференс. попробуй ещё раз.', reply_markup: { inline_keyboard: navigationRows('musicsettings:home', '‹ назад к параметрам') } });
        }
        return;
      }
      const input = String(message.text ?? message.caption ?? '').trim();
      if (!input) {
        if (musicDraft.awaiting) await deliverUi(chatId, buildMusicInputPrompt(musicDraft, musicDraft.awaiting));
        return;
      }
      try {
        const inputField = musicDraft.awaiting ?? 'prompt';
        const updated = applyMusicSetting(musicDraft, inputField, input);
        musicDrafts.set(chatId, updated);
        await deliverUi(chatId, buildMusicSettingsMessage(updated));
      } catch (error) {
        await deliverUi(chatId, {
          text: escapeHtml(error.message),
          parse_mode: 'HTML',
          reply_markup: buildMusicInputPrompt(musicDraft, musicDraft.awaiting ?? 'prompt').reply_markup
        });
      }
      return;
    }

    const audioDubDraft = audioDubDrafts.get(chatId);
    if (audioDubDraft && !command && !menuTask) {
      if (!audioDubDraft.voice) {
        await deliverUi(chatId, buildAudioDubConstructorMessage(audioDubDraft));
        return;
      }
      if (!audioDubDraft.video) {
        const telegramVideo = message.video ?? message.animation ?? message.document;
        const mimeType = String(telegramVideo?.mime_type ?? 'video/mp4').toLowerCase();
        if (!telegramVideo?.file_id || mimeType !== 'video/mp4') {
          await deliverUi(chatId, {
            text: 'пришли видео в формате MP4. выбранный голос и настройки сохранены.',
            reply_markup: buildAudioDubConstructorMessage(audioDubDraft).reply_markup
          });
          return;
        }
        let video;
        try {
          if (typeof telegram.getFile !== 'function' || typeof telegram.downloadFile !== 'function') {
            throw new Error('Telegram media download is unavailable.');
          }
          const file = await telegram.getFile(telegramVideo.file_id, { maxBytes: 50 * 1024 * 1024 });
          const downloaded = await telegram.downloadFile(file, {
            allowedMimeTypes: ['video/mp4'],
            maxBytes: 50 * 1024 * 1024
          });
          video = Object.freeze({
            bytes: Buffer.from(downloaded.data),
            mimeType: downloaded.mimeType,
            durationSeconds: Number(telegramVideo.duration) || 0.1
          });
        } catch (error) {
          onError(error, { chatId, actorId, action: 'audio_dub_download' });
          await deliverUi(chatId, {
            text: 'не получилось загрузить видео. попробуй отправить MP4 ещё раз.',
            reply_markup: buildAudioDubConstructorMessage(audioDubDraft).reply_markup
          });
          return;
        }
        const updated = Object.freeze({
          ...audioDubDraft,
          video,
          awaitingLanguage: true,
          operationKey: audioDubDraft.operationKey
            ?? `audio-dub:${chatId}:${message.message_id ?? update.update_id}`
        });
        audioDubDrafts.set(chatId, updated);
        await deliverUi(chatId, {
          text: '<b>видео принято</b>\n\nпришли код языка дубляжа: например, <code>ru</code>, <code>en</code> или <code>de</code>.',
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: navigationRows('audiodub:home', '‹ назад к дубляжу') }
        });
        return;
      }
      const targetLanguage = String(message.text ?? '').trim().toLowerCase();
      if (!/^[a-z]{2,3}(?:-[a-z]{2})?$/u.test(targetLanguage)) {
        await deliverUi(chatId, {
          text: 'пришли код языка из 2–3 латинских букв, например ru или en.',
          reply_markup: { inline_keyboard: navigationRows('audiodub:home', '‹ назад к дубляжу') }
        });
        return;
      }
      const requestKey = audioDubDraft.operationKey;
      let pending = audioDubPromises.get(requestKey);
      if (!pending) {
        pending = audioWorkflowExecutor.execute({
          workflowId: 'voice_dub_video',
          requestKey,
          inputs: {
            ownerTelegramId: String(actorId),
            video: audioDubDraft.video,
            target_language: targetLanguage,
            voice: audioDubDraft.voice
          },
          settings: {
            ownerTelegramId: String(actorId),
            source_audio: audioDubDraft.sourceAudio,
            source_audio_mix: audioDubDraft.sourceAudioMix,
            subtitles: true,
            lip_sync: 'обычная'
          }
        });
        audioDubPromises.set(requestKey, pending);
      }
      try {
        const completed = await pending;
        const media = completed?.result?.media;
        if (!media || typeof telegram.sendVideo !== 'function') {
          throw new Error('Completed dubbing media is unavailable.');
        }
        await telegram.sendVideo(chatId, media, {
          caption: '<b>🎥 дубляж готов</b>',
          parse_mode: 'HTML',
          mimeType: completed.result.contentType ?? 'video/mp4',
          fileName: 'metaflora-dubbed.mp4',
          reply_markup: { inline_keyboard: navigationRows('audioworkflow:voice_dub_video', '‹ к дубляжу') }
        });
        await audioWorkflowExecutor.settleDelivery?.({
          requestKey,
          reservation: completed.reservation
        });
        audioDubDrafts.delete(chatId);
      } catch (error) {
        onError(error, { chatId, actorId, requestKey, action: 'audio_dub_execute' });
        await deliverUi(chatId, {
          text: '<b>дубляж не запустился</b>\n\nнастройки и видео сохранены. повтори код языка — повторного списания не будет.',
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: navigationRows('audiodub:home', '‹ назад к дубляжу') }
        });
      } finally {
        audioDubPromises.delete(requestKey);
      }
      return;
    }

    const videoDraft = videoConstructorDrafts.get(chatId);
    if (videoDraft && !command && !menuTask) {
      const videoModel = getModelById(videoDraft.modelId);
      if (!videoModel) {
        videoConstructorDrafts.delete(chatId);
      } else {
        const uploadTarget = videoUploadTargets.get(chatId) ?? null;
        const prompt = String(message.text ?? message.caption ?? '').trim();
        const withPrompt = prompt
          ? setVideoConstructorPrompt(videoDraft, prompt)
          : videoDraft;
        const photo = Array.isArray(message.photo) ? message.photo.at(-1) : null;
        const media = photo
          ? {
              kind: 'image', fileId: photo.file_id, width: photo.width, height: photo.height,
              fileSize: photo.file_size
            }
          : message.video || message.animation || message.video_note
            ? {
                kind: 'video',
                fileId: (message.video ?? message.animation ?? message.video_note).file_id,
                width: (message.video ?? message.animation ?? message.video_note).width,
                height: (message.video ?? message.animation ?? message.video_note).height,
                duration: (message.video ?? message.animation ?? message.video_note).duration,
                fileSize: (message.video ?? message.animation ?? message.video_note).file_size
              }
            : message.audio || message.voice
              ? {
                  kind: 'audio',
                  fileId: (message.audio ?? message.voice).file_id,
                  duration: (message.audio ?? message.voice).duration,
                  fileSize: (message.audio ?? message.voice).file_size
                }
              : null;
        const targetDraft = uploadTarget && uploadTarget !== withPrompt.mode
          ? setVideoConstructorMode(withPrompt, uploadTarget, videoModel)
          : withPrompt;
        const result = media
          ? addVideoConstructorUpload(targetDraft, media, videoModel)
          : { draft: targetDraft, error: null };
        videoConstructorDrafts.set(chatId, result.draft);
        await deliverUi(chatId, uploadTarget === 'references'
          ? buildVideoReferenceUploadMessage(result.draft, videoModel, result.error)
          : buildVideoConstructorMessage(result.draft, videoModel, result.error));
        return;
      }
    }

    if (imageReferenceCapture.has(chatId) && !command && !menuTask) {
      const imageModel = currentModelFor(chatId);
      if (!supportsImageReferences(imageModel)) {
        imageReferenceCapture.delete(chatId);
      } else {
        const photo = Array.isArray(message.photo) ? message.photo.at(-1) : null;
        const imageDocument = message.document?.mime_type?.startsWith('image/')
          ? message.document
          : null;
        if (!photo && !imageDocument) {
          await deliverUi(chatId, buildImageReferenceMessage(
            imageModel,
            imageReferencesFor(chatId, imageModel),
            'пришли изображение.'
          ));
          return;
        }
        const references = imageReferencesFor(chatId, imageModel);
        const limit = imageReferenceLimit(imageModel);
        if (limit !== null && references.length >= limit) {
          await deliverUi(chatId, buildImageReferenceMessage(
            imageModel,
            references,
            `лимит референсов: ${limit}.`
          ));
          return;
        }
        const normalized = photo
          ? { photo: [{ ...photo }] }
          : { document: { ...imageDocument } };
        const updated = Object.freeze([...references, Object.freeze(normalized)]);
        imageReferenceDrafts.set(imageReferenceKey(chatId, imageModel.id), updated);
        await deliverUi(chatId, buildImageReferenceMessage(imageModel, updated));
        return;
      }
    }

    if (command === 'welcome') {
      withdrawalDrafts.delete(actorId);
      promoDrafts.delete(actorId);
      instructionDrafts.delete(chatId);
      voiceTextDrafts.delete(chatId);
      voiceConfirmations.delete(chatId);
      if (loadWelcomeSession(chatId).active || welcomeMessageIds.has(String(chatId))) {
        stopWelcomeSession(chatId);
        await deleteWelcomeAgentMessages(chatId);
      }
      welcomeReturnMessageIds = new Map(welcomeReturnMessageIds).set(
        String(chatId),
        uiMessageIds.get(chatId) ?? null
      );
      startWelcomeSession(chatId);
      await sendWelcomeAgentMessage(chatId, buildWelcomeAgentIntroMessage());
      return;
    }

    if ((command || menuTask) && loadWelcomeSession(chatId).active) {
      stopWelcomeSession(chatId);
      await deleteWelcomeAgentMessages(chatId);
      welcomeReturnMessageIds = new Map(welcomeReturnMessageIds);
      welcomeReturnMessageIds.delete(String(chatId));
    } else if (loadWelcomeSession(chatId).active) {
      const input = String(message.text ?? '').trim();
      if (!input || input.length > 4_000) {
        await sendWelcomeAgentMessage(chatId, buildWelcomeAgentResponseMessage(
          input.length > 4_000
            ? 'сообщение длиннее 4 000 знаков. сократи его и пришли ещё раз.'
            : 'пришли вопрос текстом. я помогу выбрать раздел и следующий шаг.'
        ));
        return;
      }
      if (welcomeInFlight.has(String(chatId))) {
        await sendWelcomeAgentMessage(chatId, buildWelcomeAgentResponseMessage(
          'предыдущий вопрос ещё обрабатывается. дождись ответа или выбери другой раздел кнопками ниже.'
        ));
        return;
      }
      if (!welcomeQueueHasCapacity()) {
        await sendWelcomeAgentMessage(chatId, buildWelcomeAgentResponseMessage(
          'сейчас очередь помощника заполнена. повтори сообщение чуть позже или выбери раздел вручную.'
        ));
        return;
      }
      if (!consumeWelcomeQuota(chatId)) {
        await sendWelcomeAgentMessage(chatId, buildWelcomeAgentResponseMessage(
          'лимит помощника на сейчас исчерпан. открой нужный раздел вручную или вернись позже.'
        ));
        return;
      }
      const session = loadWelcomeSession(chatId);
      const request = buildWelcomeAgentRequest({
        history: session.messages,
        input
      });
      if (!queueWelcomeRequest(chatId, request, input)) {
        await sendWelcomeAgentMessage(chatId, buildWelcomeAgentResponseMessage(
          'сейчас очередь помощника заполнена. повтори сообщение чуть позже или выбери раздел вручную.'
        ));
        return;
      }
      return;
    }

    const instructionModelId = instructionDrafts.get(chatId);
    if (instructionModelId && !command) {
      const instructionModel = getModelById(instructionModelId);
      const instructions = String(message.text ?? '').trim();
      if (!instructionModel || !instructions || instructions.length > 3000) {
        await deliverUi(chatId, {
          text: instructions.length > 3000
            ? '<b>слишком длинно.</b> сократи инструкции до 3 000 символов.'
            : 'отправь инструкции одним текстовым сообщением.',
          parse_mode: 'HTML',
          reply_markup: buildModelInstructionsPrompt(instructionModel ?? pendingModels.get(chatId)).reply_markup
        });
        return;
      }
      const updated = { ...settingsFor(chatId, instructionModel), instructions };
      saveSettings(chatId, instructionModel, updated);
      instructionDrafts.delete(chatId);
      await deliverUi(chatId, buildModelSettingsMessage(instructionModel, updated));
      return;
    }

    const receiptDraft = receiptDrafts.get(String(actorId));
    if (receiptDraft && !navigationIntent) {
      try {
        const customerEmail = normalizeReceiptEmail(message.text);
        receiptEmails.set(String(actorId), customerEmail);
        await historyService?.saveReceiptEmail?.({
          telegramUserId: String(actorId),
          email: customerEmail
        });
        receiptDrafts.delete(String(actorId));
        await startYooKassaCheckout({
          chatId,
          actorId,
          ...receiptDraft,
          reply: (ui) => deliverUi(chatId, ui)
        });
      } catch (error) {
        await deliverUi(chatId, {
          ...buildReceiptEmailPrompt(
            receiptDraft.kind === 'plan'
              ? `billing:planinfo:${receiptDraft.productId}:${receiptDraft.origin}`
              : `billing:packages:${receiptDraft.origin}`
          ),
          text: '<b>одну секунду: нужен e-mail для чека</b>\n\nпроверь адрес и отправь его ещё раз — Т-Банк отправит чек по требованиям 54-ФЗ. без него платёжная ссылка не создастся.\n\n<b>направь ответным сообщением реальный адрес электронной почты👇</b>'
        });
      }
      return;
    }

    const partnerDraft = partnerOnboardingDrafts.get(actorId);
    if (partnerDraft && !navigationIntent) {
      const input = String(message.text ?? '').trim();
      if (partnerDraft.step === 'full_name') {
        const fullName = input.replace(/[\u0000-\u001f\u007f]/gu, '').replace(/\s+/gu, ' ').trim();
        if (fullName.length < 3 || fullName.length > 180) {
          await deliverUi(chatId, {
            text: 'пришли ФИО или полное название длиной от 3 до 180 символов.',
            reply_markup: { inline_keyboard: navigationRows('ref:onboarding') }
          });
          return;
        }
        partnerOnboardingDrafts.set(actorId, Object.freeze({
          ...partnerDraft,
          step: 'inn',
          fullName
        }));
        await deliverUi(chatId, {
          text: '<b>ИНН получателя</b>\n\nпришли ИНН одним сообщением: 12 цифр для самозанятого, 10 или 12 цифр для ИП, 10 цифр для организации.',
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: navigationRows('ref:onboarding') }
        });
        return;
      }
      const inn = input.replace(/\D/gu, '');
      const allowedLengths = partnerDraft.legalStatus === 'self_employed'
        ? [12]
        : partnerDraft.legalStatus === 'legal_entity'
          ? [10]
          : [10, 12];
      if (!allowedLengths.includes(inn.length)) {
        await deliverUi(chatId, {
          text: 'проверь ИНН и отправь его ещё раз только цифрами.',
          reply_markup: { inline_keyboard: navigationRows('ref:onboarding') }
        });
        return;
      }
      if (typeof referralService.upsertPartnerProfile !== 'function') {
        partnerOnboardingDrafts.delete(actorId);
        await deliverUi(chatId, buildPartnerOnboardingMessage(await partnerOnboardingFor(actorId)));
        return;
      }
      await referralService.upsertPartnerProfile({
        telegramId: actorId,
        legalStatus: partnerDraft.legalStatus,
        inn,
        fullName: partnerDraft.fullName,
        metadata: { source: 'telegram_bot', telegramUpdateId: String(update.update_id) }
      });
      partnerOnboardingDrafts.delete(actorId);
      await deliverUi(chatId, buildPartnerOnboardingMessage(await partnerOnboardingFor(actorId)));
      return;
    }

    const withdrawalDraft = withdrawalDrafts.get(actorId);
    if (withdrawalDraft && !command) {
      if (withdrawalDraft.step === 'amount') {
        const rawAmount = String(message.text ?? '').trim().replace(',', '.');
        if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(rawAmount)) {
          await deliverUi(chatId, {
            text: 'отправь сумму цифрами, например <b>1500</b>.',
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: navigationRows('ref:withdraw') }
          });
          return;
        }
        const amountKopecks = Math.round(Number(rawAmount) * 100);
        const account = await referralAccountFor(actorId);
        if (amountKopecks < 100_000 || amountKopecks > account.availableKopecks) {
          await deliverUi(chatId, {
            text: `можно вывести от <b>1 000 ₽</b> до <b>${(account.availableKopecks / 100).toLocaleString('ru-RU')} ₽</b>.`,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: navigationRows('ref:withdraw') }
          });
          return;
        }
        withdrawalDrafts.set(actorId, Object.freeze({ step: 'method', amountKopecks }));
        await deliverUi(chatId, buildWithdrawalMethodPrompt(amountKopecks));
        return;
      }
      const destination = String(message.text ?? '').trim();
      try {
        const withdrawal = await referralService.requestWithdrawal({
          telegramId: actorId,
          amountKopecks: withdrawalDraft.amountKopecks,
          method: withdrawalDraft.method,
          destination
        });
        withdrawalDrafts.delete(actorId);
        await deliverUi(chatId, buildWithdrawalCreatedMessage(withdrawalDraft.amountKopecks));
        await notifyWithdrawalOwner({
          ...withdrawal,
          telegramId: String(actorId),
          destination,
          firstName: message.from?.first_name,
          username: message.from?.username
        });
      } catch (error) {
        onError(error, update);
        await deliverUi(chatId, {
          text: 'не получилось создать заявку. проверь реквизиты и отправь их ещё раз.',
          reply_markup: { inline_keyboard: navigationRows('ref:withdraw') }
        });
      }
      return;
    }

    if (command) promoDrafts.delete(actorId);
    if (promoDrafts.has(actorId) && !command) {
      const promoOrigin = promoDrafts.get(actorId) ?? 'profile';
      const promoCode = String(message.text ?? '').trim().toUpperCase();
      if (!/^[A-Z0-9_-]{3,32}$/.test(promoCode)) {
        await deliverUi(chatId, buildPromoEntryMessage());
        return;
      }
      try {
        if (!stateRepository) throw new Error('хранилище промокодов недоступно.');
        const reward = stateRepository.redeemPromo(String(actorId), promoCode);
        promoCodes.set(actorId, promoCode);
        promoDrafts.delete(actorId);
        await deliverUi(chatId, buildPromoMessage(promoCode, promoOrigin, reward));
      } catch (error) {
        const expected = /не найден|истёк|закончились|уже активирован/i.test(error.message);
        if (!expected) onError(error, update);
        promoDrafts.delete(actorId);
        await deliverUi(chatId, {
          text: `🎟 <b>мои промокоды</b>\n\n${expected ? error.message : 'не получилось активировать промокод. попробуй ещё раз или напиши в поддержку.'}`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: 'ввести другой промокод', callback_data: `billing:promo:enter:${promoOrigin}` }],
              ...navigationRows(`billing:promo:${promoOrigin}`)
            ]
          }
        });
      }
      return;
    }

    const voiceDraft = voiceTextDrafts.get(chatId);
    if (voiceDraft && !command) {
      const text = String(message.text ?? '').trim();
      if (!text || text.length > 40_000) {
        await deliverUi(chatId, {
          text: text.length > 40_000
            ? '<b>текст слишком длинный</b>\n\nсократи его до 40 000 знаков и пришли одним сообщением.'
            : 'пришли текст одним сообщением, без файла.',
          parse_mode: 'HTML',
          reply_markup: (voiceDraft.profile
            ? buildOwnedVoiceTextPrompt(voiceDraft.profile)
            : buildVoiceTextPrompt(voiceDraft.voiceId)).reply_markup
        });
        return;
      }
      const priceMetacoins = calculateVoiceTtsPrice(text);
      const confirmationToken = String(message.message_id ?? update.update_id);
      const requestKey = `voice-tts:${chatId}:${confirmationToken}`;
      const confirmation = Object.freeze({
        voiceId: voiceDraft.voiceId,
        text,
        priceMetacoins,
        requestKey,
        confirmationToken
      });
      voiceConfirmations.set(chatId, confirmation);
      voiceTextDrafts.delete(chatId);
      await runVoiceTextToSpeech({
        chatId,
        actorId,
        actorUsername: message.from?.username ?? '',
        voiceId: confirmation.voiceId,
        confirmationToken
      });
      return;
    }

    if (menuTask === 'profile') {
      await deliverUi(
        chatId,
        markMenuMedia(
          buildProfileMessage(selections.get(chatId), await referralAccountFor(actorId)),
          'profile'
        )
      );
      return;
    }
    if (menuTask === 'support') {
      await deliverUi(chatId, markMenuMedia(buildSupportMessage(), 'support'));
      return;
    }
    if (menuTask === 'founder-channel') {
      await deliverUi(chatId, markMenuMedia(buildFounderChannelMessage(), 'founder'));
      return;
    }
    if (menuTask === 'invite') {
      await deliverUi(
        chatId,
        markMenuMedia(buildReferralAccountMessage(await referralAccountFor(actorId)), 'invite')
      );
      return;
    }
    if (menuTask === 'balance') {
      await deliverUi(
        chatId,
        markMenuMedia(buildBalanceMessage(await referralAccountFor(actorId)), 'balance')
      );
      return;
    }
    if (menuTask === 'agents') {
      clearActiveSelection(chatId);
      await deliverUi(chatId, markMenuMedia(buildAgentCatalogMenu(), 'agents'));
      return;
    }
    if (menuTask === 'entertainment') {
      clearActiveSelection(chatId);
      await deliverUi(chatId, markMenuMedia(buildEntertainmentMenu(), 'entertainment'));
      return;
    }
    if (menuTask === 'voice') {
      clearActiveSelection(chatId);
      await deliverUi(chatId, markMenuMedia(buildModelCategoryMessage('voice'), 'voice'));
      return;
    }
    if (taskCategory[menuTask]) {
      clearActiveSelection(chatId);
      const category = taskCategory[menuTask];
      await deliverUi(
        chatId,
        markMenuMedia(buildModelCategoryMessage(category), menuMediaForCategory[category])
      );
      return;
    }

      if (command === 'start' || command === 'menu' || command === 'back') {
      await deliverUi(
        chatId,
        markMenuMedia(buildWelcomeMessage(message.from?.first_name, message.from?.username), 'menu')
      );
      return;
    }
    if (command === 'icons') {
      if (!config.botOwnerId || String(message.from?.id) !== String(config.botOwnerId)) {
        await deliverUi(chatId, {
          text: 'команда недоступна.',
          reply_markup: {
            inline_keyboard: navigationRows()
          }
        });
        return;
      }
      await deliverUi(chatId, { text: 'устанавливаю логотипы моделей в кнопки. это займет несколько секунд.' });
      try {
        const result = await installModelIcons({
          telegram,
          ownerId: message.from.id,
          includeUi: true,
          refreshPaymentUi: true,
          refreshAll: true
        });
        await deliverUi(chatId, {
          text: `готово. подключено логотипов: ${result.count}, интерфейсных эмодзи: ${result.uiCount ?? 0}.`,
          reply_markup: {
            inline_keyboard: navigationRows()
          }
        });
      } catch (error) {
        onError(error, update);
        await deliverUi(chatId, {
          text: 'не получилось создать набор логотипов. проверь Telegram Premium у владельца и повтори /icons.',
          reply_markup: {
            inline_keyboard: navigationRows()
          }
        });
      }
      return;
    }
    if (command === 'voice') {
      clearActiveSelection(chatId);
      await deliverUi(chatId, markMenuMedia(buildModelCategoryMessage('voice'), 'voice'));
      return;
    }
    if (command === 'agents') {
      clearActiveSelection(chatId);
      await deliverUi(chatId, markMenuMedia(buildAgentCatalogMenu(), 'agents'));
      return;
    }
    if (command === 'fun') {
      clearActiveSelection(chatId);
      await deliverUi(chatId, markMenuMedia(buildEntertainmentMenu(), 'entertainment'));
      return;
    }
    if (commandCategory[command]) {
      clearActiveSelection(chatId);
      const category = commandCategory[command];
      await deliverUi(
        chatId,
        markMenuMedia(buildModelCategoryMessage(category), menuMediaForCategory[category])
      );
      return;
    }
    if (command === 'profile') {
      await deliverUi(
        chatId,
        markMenuMedia(
          buildProfileMessage(selections.get(chatId), await referralAccountFor(actorId)),
          'profile'
        )
      );
      return;
    }
    if (command === 'support') {
      await deliverUi(chatId, markMenuMedia(buildSupportMessage(), 'support'));
      return;
    }
    if (command === 'paysupport') {
      await deliverUi(chatId, markMenuMedia(buildSupportMessage(), 'support'));
      return;
    }
    if (command === 'channel') {
      await deliverUi(chatId, markMenuMedia(buildFounderChannelMessage(), 'founder'));
      return;
    }
    if (command === 'balance') {
      await deliverUi(
        chatId,
        markMenuMedia(buildBalanceMessage(await referralAccountFor(actorId)), 'balance')
      );
      return;
    }
    if (command === 'settings') {
      await deliverUi(chatId, userSettingsMessageFor(chatId));
      return;
    }
    if (command === 'dialogs') {
      await deliverUi(chatId, await dialogHistoryMessageFor(actorId, 0, currentModelFor(chatId)));
      return;
    }

      if (!selectedAgents.get(chatId)) await restoreEntertainmentFlow(actorId, chatId);
      const selectedAgent = selectedAgents.get(chatId);
    if (selectedAgent) {
      const selectedEntertainment = selectedEntertainments.get(chatId) ?? null;
      if (selectedEntertainment?.id === 'ent_calorie_estimator' && !message.photo?.length) {
        await deliverUi(chatId, buildInteractiveEntertainmentStart('ent_calorie_estimator'));
        return;
      }
      const congratulatorDraft = congratulatorDrafts.get(chatId);
      if (selectedEntertainment?.id === 'ent_congratulator' && congratulatorDraft?.awaitingDetails) {
        const details = String(message.text ?? message.caption ?? '').trim();
        if (!details) {
          await deliverUi(chatId, buildCongratulatorPromptMessage(congratulatorDraft.occasion));
          return;
        }
        const requestKey = message.message_id
          ? `ent-congratulator:${chatId}:${message.message_id}`
          : `ent-congratulator-update:${chatId}:${update.update_id}`;
        const priceMetacoins = calculateAgentRunPrice(selectedAgent) + calculateVoiceTtsPrice('');
        const access = decideModelAccess({
          account: await referralAccountFor(actorId),
          modelId: selectedAgent.primaryModel,
          priceMetacoins,
          freeModelIds: FREE_MODEL_IDS,
          now: new Date(now())
        });
        if (!access.allowed) {
          await deliverUi(chatId, buildGenerationAccessMessage(access.reason));
          return;
        }
        if (!allowRequest(chatId)) {
          await deliverUi(chatId, { text: 'слишком много запусков подряд. подожди минуту и повтори.' });
          return;
        }
        const billing = reserveGeneration({ actorId, debitMetacoins: access.debitMetacoins, requestKey, label: 'congratulator' });
        if (!billing.ok) {
          await deliverUi(chatId, buildGenerationAccessMessage('insufficient_metacoins'));
          return;
        }
        let historyRun = null;
        try {
          historyRun = await historyService?.startGeneration?.({
            telegramUserId: actorId, telegramChatId: chatId, requestKey, kind: 'agent',
            subjectType: 'entertainment', subjectId: 'ent_congratulator', title: '🎙 поздравлятор',
            prompt: details, parameters: { occasion: congratulatorDraft.occasion, output: 'audio' },
            metacoinsQuoted: priceMetacoins
          });
          const request = buildAgentLlmRequest({
            agent: selectedAgent,
            userPrompt: `Повод: ${congratulatorDraft.occasion}. Данные: ${details}. Напиши только готовый текст поздравления для озвучки, без комментариев и заголовка. Не более 900 знаков.`,
            agentSettings: agentSettingsFor(chatId, selectedAgent),
            preferenceText: preferenceInstructions(preferencesFor(chatId))
          });
          const scriptResult = await invokeLlm({
            prompt: request.prompt,
            providerModels: request.routeCandidates.map(({ providerModelId }) => providerModelId).filter(Boolean),
            providerKeys: config.providerKeys,
            settings: request.settings,
            allowSecondaryProviders: true,
            allowFreeFallback: true,
            fetchImpl: providerFetch
          });
          const text = String(scriptResult.text ?? '').trim();
          if (!text) throw new Error('empty congratulator script');
          if (text.length > 1_000) throw new Error('congratulator script exceeded reserved TTS tier');
          const token = createHash('sha256').update(`${chatId}:${message.message_id ?? update.update_id}:${text}`).digest('base64url').slice(0, 20);
          congratulatorDrafts.set(chatId, Object.freeze({
            ...congratulatorDraft, awaitingDetails: false, text, token, priceMetacoins,
            requestKey, historyRun, access, billing
          }));
          await deliverUi(chatId, buildCongratulatorConfirmationMessage({ occasion: congratulatorDraft.occasion, text, priceMetacoins, token }));
        } catch (error) {
          releaseGeneration({ actorId, debitMetacoins: access.debitMetacoins, requestKey, label: 'congratulator', billing });
          await failGenerationSafely(historyRun, error, { actorId, requestKey });
          onError(error, { chatId, action: 'entertainment_congratulator_script' });
          await deliverUi(chatId, { text: 'не получилось подготовить поздравление. метакоины не списаны — попробуй ещё раз.' });
        }
        return;
      }
      const flowState = entertainmentFlowStates.get(chatId) ?? null;
      const rawPrompt = message.text ?? message.caption ?? '';
      let preparedTurn = flowState ? prepareEntertainmentTurn(flowState, rawPrompt) : null;
      if (flowState && !preparedTurn) {
        await deliverUi(chatId, { text: '<b>сессия завершена</b>\n\nможно открыть развлечения и начать новую.', parse_mode: 'HTML' });
        return;
      }
      if (preparedTurn) {
        const persistedState = await persistEntertainmentFlow(actorId, preparedTurn.state, {
          transitionKey: message.message_id ? `message:${message.message_id}` : `update:${update.update_id}`
        });
        entertainmentFlowStates.set(chatId, persistedState);
        preparedTurn = Object.freeze({ ...preparedTurn, state: persistedState });
      }
      const prompt = preparedTurn?.prompt ?? rawPrompt;
      await runSelectedAgentRequest({
        chatId,
        actorId,
        actorUsername: message.from?.username ?? '',
        agent: selectedAgent,
        prompt,
        telegramInput: message,
        entertainment: selectedEntertainment,
        entertainmentFlow: preparedTurn,
        requestKey: message.message_id
          ? `agent:${chatId}:${message.message_id}`
          : update.update_id !== undefined
            ? `agent-update:${chatId}:${update.update_id}`
            : undefined
      });
      return;
    }

    const selected = selections.get(chatId);
    if (!selected) {
      await deliverUi(chatId, buildModelCategoryMessage('llm'));
      return;
    }

    if (message.media_group_id) {
      queueMediaGroup(message, selected);
      return;
    }

    const imageReferences = selected.category === 'image'
      ? imageReferencesFor(chatId, selected)
      : [];
    const inputs = [...new Set([
      ...messageInputs(message),
      ...(imageReferences.length > 0 ? ['image'] : [])
    ])];
    const prompt = message.text ?? message.caption ?? '';
    await runSelectedRequest({
      chatId,
      actorId,
      actorUsername: message.from?.username ?? '',
      selected,
      inputs,
      prompt,
      requestKey: message.message_id
        ? `message:${chatId}:${message.message_id}`
        : update.update_id !== undefined
          ? `message-update:${chatId}:${update.update_id}`
          : undefined,
      telegramInput: imageReferences.length > 0 ? [...imageReferences, message] : message,
      historyMetadata: selected.category === 'image' ? {
        kind: 'image',
        modelId: selected.id,
        mode: imageReferences.length > 0 ? 'image_references' : 'text_to_image',
        references: {
          image: imageReferences.length,
          video: 0,
          audio: 0,
          total: imageReferences.length
        },
        referenceLimit: imageReferenceLimit(selected)
      } : null
    });
    if (selected.category === 'image') {
      imageReferenceDrafts.delete(imageReferenceKey(chatId, selected.id));
    }
  };

  return async function handleUpdateSafely(update) {
    try {
      return await handleUpdate(update);
    } catch (error) {
      const chatId = update.callback_query?.message?.chat?.id ?? update.message?.chat?.id;
      onError(error, { chatId, action: 'update' });
      if (!chatId) return;
      const message = error instanceof ResultDeliveryError
        ? buildDeliveryErrorMessage(selections.get(chatId), error.retryCallbackData)
        : buildAggregatorErrorMessage(selections.get(chatId));
      try {
        await deliverUi(chatId, message);
      } catch (deliveryError) {
        onError(deliveryError, { chatId, action: 'update_error_notice' });
      }
    }
  };
}
