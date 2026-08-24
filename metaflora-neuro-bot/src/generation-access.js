export const FREE_MODEL_IDS = Object.freeze([
  'gpt_oss_20b_free',
  'nemotron_3_ultra_free',
  'nemotron_3_super_free',
  'gemma_4_31b_free',
  'north_mini_code_free',
  'nemotron_3_nano_omni_free',
  'photo_generate',
  'video_generate',
  'audio_music',
  'audio_tts',
  'nano_banana_2',
  'gpt_56_luna',
  'gpt_image_2'
]);

const FULLY_FREE_MODEL_IDS = new Set([
  'gpt_oss_20b_free',
  'nemotron_3_ultra_free',
  'nemotron_3_super_free',
  'gemma_4_31b_free',
  'north_mini_code_free',
  'nemotron_3_nano_omni_free'
]);

const FREE_ENTITLEMENTS = Object.freeze({
  gpt_oss_20b_free: Object.freeze({ quotaKey: 'text', weeklyLimit: 50 }),
  nemotron_3_ultra_free: Object.freeze({ quotaKey: 'text', weeklyLimit: 50 }),
  nemotron_3_super_free: Object.freeze({ quotaKey: 'text', weeklyLimit: 50 }),
  gemma_4_31b_free: Object.freeze({ quotaKey: 'text', weeklyLimit: 50 }),
  north_mini_code_free: Object.freeze({ quotaKey: 'text', weeklyLimit: 50 }),
  nemotron_3_nano_omni_free: Object.freeze({ quotaKey: 'text', weeklyLimit: 50 }),
  photo_generate: Object.freeze({ quotaKey: 'image', weeklyLimit: 2 }),
  video_generate: Object.freeze({ quotaKey: 'video', weeklyLimit: 1 }),
  audio_music: Object.freeze({ quotaKey: 'music', weeklyLimit: 1 }),
  audio_tts: Object.freeze({ quotaKey: 'voice', weeklyLimit: 5 }),
  nano_banana_2: Object.freeze({ quotaKey: 'image', weeklyLimit: 2 }),
  elevenlabs_curated_tts: Object.freeze({ quotaKey: 'voice', weeklyLimit: 5 }),
  gpt_56_luna: Object.freeze({ quotaKey: 'luna_text', weeklyLimit: 20 }),
  gpt_image_2: Object.freeze({ quotaKey: 'gpt_image_2', weeklyLimit: 2 })
});

export function freeEntitlementFor(modelId) {
  return FREE_ENTITLEMENTS[modelId] ?? null;
}

export function isFreeModelId(modelId) {
  return FULLY_FREE_MODEL_IDS.has(String(modelId ?? ''));
}

const ACCESS_CARDS = Object.freeze({
  tariff_required: Object.freeze({
    text: '<b>❗ нужен платный тариф</b>\n\nэта модель доступна на платных тарифах.\nвыбери подходящий из каталога ниже 👇',
    action: Object.freeze({
      text: 'оплатить тариф',
      callback_data: 'billing:plans:profile'
    })
  }),
  tariff_expired: Object.freeze({
    text: '<b>срок тарифа закончился</b>\n\nпродли тариф, чтобы снова пользоваться моделями и оставшимися метакоинами.',
    action: Object.freeze({
      text: 'оплатить тариф',
      callback_data: 'billing:plans:profile'
    })
  }),
  insufficient_metacoins: Object.freeze({
    text: '<b>не хватает метакоинов</b>\n\nдля этой модели на балансе не хватает метакоинов. запрос не отправлен, ничего не списано.\n\nпополни баланс, чтобы продолжить работу.',
    action: Object.freeze({
      text: 'пополнить баланс',
      callback_data: 'billing:packages:balance'
    })
  }),
  weekly_free_limit: Object.freeze({
    text: '<b>бесплатные запросы на эту неделю закончились</b>\n\nновые 50 запросов появятся в понедельник. до этого можно перейти на тариф с полным каталогом и метакоинами.',
    action: Object.freeze({
      text: 'оплатить тариф',
      callback_data: 'billing:plans:profile'
    })
  }),
  free_quota_unavailable: Object.freeze({
    text: '<b>сейчас не получается проверить бесплатный лимит</b>\n\nпопробуй ещё раз чуть позже. запрос не отправлен и ничего не списано.',
    action: Object.freeze({
      text: 'повторить',
      callback_data: 'task:text'
    })
  })
});

const QUOTA_LABELS = Object.freeze({
  text: 'запросов на текст',
  image: 'изображений',
  video: 'коротких видео',
  music: 'музыкальных генераций',
  voice: 'озвучек',
  luna_text: 'запросов к GPT-5.6 Luna Fast',
  gpt_image_2: 'генераций через GPT Image 2'
});

export function buildGenerationAccessMessage(
  reason,
  entitlement = null,
  backData = 'task:models'
) {
  if (!Object.hasOwn(ACCESS_CARDS, reason)) {
    throw new TypeError(`Unknown generation access reason: ${reason}`);
  }
  const card = reason === 'weekly_free_limit' && entitlement
    ? Object.freeze({
        ...ACCESS_CARDS.weekly_free_limit,
        text: `<b>бесплатный лимит на эту неделю закончился</b>\n\nновые ${entitlement.weeklyLimit} ${QUOTA_LABELS[entitlement.quotaKey] ?? 'запросов'} появятся в понедельник. до этого можно перейти на тариф с полным каталогом и метакоинами.`
      })
    : ACCESS_CARDS[reason];

  return {
    text: card.text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ ...card.action }],
        [
          { text: '‹ назад', callback_data: backData },
          { text: '🏠 главное меню', callback_data: 'task:menu' }
        ]
      ]
    }
  };
}
