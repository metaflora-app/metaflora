import {
  buildMetacoinButton,
  buildUiButton,
  metacoinHtml,
  modelLogoHtml
} from './brand-icons.js';
import {
  AI_AGENT_COUNT,
  AI_TOOL_COUNT,
  MODEL_CATALOG_COUNT
} from './catalog-counts.js';
import {
  METACOIN_PACKAGES,
  calculatePlanUpgrade,
  formatRubles,
  getMetacoinPackage,
  getPurchasableSubscriptionPlans,
  getSubscriptionOffer,
  getSubscriptionPlan,
  isPaidSubscriptionActive
} from './billing-catalog.js';
export {
  buildGenerationHistoryListMessage as buildGenerationHistoryMessage
} from './generation-history-ui.js';

function billingAccount(account = {}) {
  const newcomer = getSubscriptionPlan('newcomer');
  const requestedPlan = getSubscriptionPlan(account.subscriptionPlanId) ?? newcomer;
  const plan = requestedPlan.id !== newcomer.id && !isPaidSubscriptionActive(account)
    ? newcomer
    : requestedPlan;
  return Object.freeze({
    ...account,
    subscriptionPlanId: plan.id,
    subscriptionMetacoinsTotal: Number.isSafeInteger(account.subscriptionMetacoinsTotal)
      ? account.subscriptionMetacoinsTotal
      : plan.metacoins,
    subscriptionMetacoinsRemaining: Number.isSafeInteger(account.subscriptionMetacoinsRemaining)
      ? account.subscriptionMetacoinsRemaining
      : plan.metacoins,
    subscriptionPriceKopecks: Number.isSafeInteger(account.subscriptionPriceKopecks)
      ? account.subscriptionPriceKopecks
      : plan.priceKopecks,
    subscriptionDurationMonths: [1, 3].includes(account.subscriptionDurationMonths)
      ? account.subscriptionDurationMonths
      : 1,
    packageMetacoinsRemaining: Number.isSafeInteger(account.packageMetacoinsRemaining)
      ? account.packageMetacoinsRemaining
      : 0,
    spentMetacoins1d: Number.isSafeInteger(account.spentMetacoins1d) ? account.spentMetacoins1d : 0,
    spentMetacoins30d: Number.isSafeInteger(account.spentMetacoins30d) ? account.spentMetacoins30d : 0,
    metacoinBalance: Number.isSafeInteger(account.metacoinBalance) ? account.metacoinBalance : 0,
    totalUsers: Number.isSafeInteger(account.totalUsers) ? account.totalUsers : 0,
    invited: Number.isSafeInteger(account.invited) ? account.invited : 0,
    paidReferrals: Number.isSafeInteger(account.paidReferrals) ? account.paidReferrals : 0
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function formatPlanFeature(feature) {
  const separator = feature.indexOf(':');
  if (separator < 1) return escapeHtml(feature);
  return `<b>${escapeHtml(feature.slice(0, separator))}:</b>${escapeHtml(feature.slice(separator + 1))}`;
}

const NEWCOMER_MODELS = Object.freeze({
  text: Object.freeze([
    Object.freeze({ id: 'gpt_oss_20b_free', name: 'gpt-oss-20b', category: 'llm', family: 'openai' }),
    Object.freeze({ id: 'nemotron_3_ultra_free', name: 'Nemotron 3 Ultra', category: 'llm' }),
    Object.freeze({ id: 'gemma_4_31b_free', name: 'Gemma 4 31B', category: 'llm' }),
    Object.freeze({ id: 'north_mini_code_free', name: 'North Mini Code', category: 'llm' })
  ]),
  image: Object.freeze([
    Object.freeze({ id: 'gpt_image_2', name: 'GPT Image 2', category: 'image', family: 'openai' }),
    Object.freeze({ id: 'nano_banana_2', name: 'Nano Banana 2', category: 'image', family: 'google' })
  ]),
  music: Object.freeze([
    Object.freeze({ id: 'audio_music', name: 'ElevenLabs Music', category: 'audio' })
  ]),
  voice: Object.freeze([
    Object.freeze({ id: 'audio_tts', name: 'ElevenLabs Voice', category: 'voice' })
  ])
});

function allowanceLine(value) {
  return escapeHtml(value).replace(
    /^(\d+\s+(?:текстовых\s+запросов|запросов|генерации|генерация|озвучек))/u,
    '<b>$1</b>'
  );
}

function newcomerFeatureGroups(features) {
  const starter = String(features[0] ?? '').replace(/^бесплатный старт:\s*/u, '');
  const starterParts = starter.match(
    /^(.*),\s*(\d+ запросов через GPT-5\.6 Luna)\s+и\s+(\d+ генерации через GPT Image 2)$/u
  );
  const textLines = starterParts
    ? [starterParts[1], starterParts[2]]
    : [starter];
  const imageLines = [starterParts?.[3], features[1]].filter(Boolean);
  const groups = [
    { title: 'текст', models: NEWCOMER_MODELS.text, lines: textLines },
    { title: 'изображения', models: NEWCOMER_MODELS.image, lines: imageLines },
    { title: 'музыка', models: NEWCOMER_MODELS.music, lines: [features[2]] },
    { title: 'озвучка', models: NEWCOMER_MODELS.voice, lines: [features[3]] }
  ];

  return groups.map(({ title, models, lines }) => {
    const logos = [...new Set(models.map(modelLogoHtml))].join(' ');
    const allowances = lines.filter(Boolean).map(allowanceLine).join('\n');
    return `${logos} <b>${title}</b>\n${allowances}`;
  }).join('\n\n');
}

function formatDate(value) {
  if (!value) return 'дата окончания недоступна';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return 'дата окончания недоступна';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function formatSubscriptionEndDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Moscow'
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return 'без даты';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return 'без даты';
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date).replace(',', '');
}

function billingNavigation(backData = 'task:profile') {
  return [
    [{ text: '👤 профиль', callback_data: 'task:profile' }],
    [
      { text: '‹ назад', callback_data: backData },
      { text: '🏠 главное меню', callback_data: 'task:menu' }
    ]
  ];
}

function billingOrigin(value, fallback = 'profile') {
  return value === 'balance' || value === 'profile' ? value : fallback;
}

function originBackData(origin) {
  return billingOrigin(origin) === 'balance' ? 'billing:home' : 'task:profile';
}

export function buildActiveSubscriptionMessage({ planId, account: source, origin: sourceOrigin = 'profile' } = {}) {
  const account = billingAccount(source);
  const plan = getSubscriptionPlan(planId ?? account.subscriptionPlanId);
  const origin = billingOrigin(sourceOrigin);
  if (!plan || plan.priceKopecks === 0 || !isPaidSubscriptionActive(account)) {
    return buildPlansMessage(account, origin);
  }
  return {
    text: `📦 <b>тариф «${escapeHtml(plan.name)}» уже активен</b>\n\nу тебя уже есть этот тариф. он действует до <b>${formatDate(account.subscriptionExpiresAt)}</b>. повторная покупка станет доступна после окончания текущего срока.\n\nможно выбрать другой тариф или вернуться в профиль.`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'выбрать другой тариф', callback_data: `billing:plans:${origin}` }],
        [{ text: '👤 профиль', callback_data: 'task:profile' }],
        [{ text: '🏠 главное меню', callback_data: 'task:menu' }]
      ]
    }
  };
}

export function buildProfileCabinetMessage({ account: source } = {}) {
  const account = billingAccount(source);
  const plan = getSubscriptionPlan(account.subscriptionPlanId);
  const subscriptionEndDate = formatSubscriptionEndDate(account.subscriptionExpiresAt);
  const expiration = plan.id !== 'newcomer' && subscriptionEndDate
    ? `\n<b>дата окончания:</b> ${subscriptionEndDate}`
    : '';
  const referralLine = account.referralUrl
    ? `\n\n<b>реферальная ссылка:</b>\n${escapeHtml(account.referralUrl)}`
    : '';
  const planLabel = plan.id === 'newcomer'
    ? 'тариф «новичок» (бесплатный)'
    : `тариф «${plan.name}»`;

  return {
    text: `👤 <b>профиль</b>\n\n<b>${planLabel}</b>${expiration}\n\n<b>баланс:</b> ${metacoinHtml()} ${account.metacoinBalance.toLocaleString('ru-RU')} метакоинов\n<b>потрачено за 1 день:</b> ${account.spentMetacoins1d.toLocaleString('ru-RU')}\n<b>потрачено за 30 дней:</b> ${account.spentMetacoins30d.toLocaleString('ru-RU')}${referralLine}\n\n<blockquote>*метакоин — внутренняя валюта агрегатора.</blockquote>`,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: {
      inline_keyboard: [
        [{ text: 'актуальные тарифы', callback_data: 'billing:plans:profile' }],
        [buildMetacoinButton('пополнить баланс', { callback_data: 'billing:home' })],
        [
          { text: 'история генераций', callback_data: 'genhist:list:0' }
        ],
        [
          { text: 'история диалогов', callback_data: 'dialoghist:list:0' },
          { text: 'история задач', callback_data: 'taskhist:list:0' }
        ],
        [{ text: 'мои промокоды', callback_data: 'billing:promo:profile' }],
        [{ text: 'реферальная программа', callback_data: 'ref:home' }],
        ...billingNavigation('task:menu')
      ]
    }
  };
}

export function buildBalanceHomeMessage(source) {
  const account = billingAccount(source);
  return {
    text: `🛎 <b>пополнить баланс</b>\n\nсейчас у тебя ${metacoinHtml()} <b>${account.metacoinBalance.toLocaleString('ru-RU')} метакоинов</b>. стоимость указана в карточке каждой модели.\n\nсначала выбери, что пополняем. оплата доступна по СБП.\n\n<b>тариф</b> открывает весь каталог на 30 или 90 дней и пополняет баланс. при оплате трёх месяцев действует скидка <b>15%</b>.\n\n<b>разовая покупка</b> пополняет только баланс. <b>метакоины не сгорают</b> и переносятся при продлении тарифа, но расходовать их можно только при активной платной подписке.`,
    menuMediaKey: 'balance',
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'оплатить тариф', callback_data: 'billing:plans:balance' }],
        [buildMetacoinButton('купить метакоины', { callback_data: 'billing:packages:balance' })],
        [{ text: 'мои промокоды', callback_data: 'billing:promo:balance' }],
        ...billingNavigation('task:menu')
      ]
    }
  };
}

export function buildPaymentMethodMessage(_method = 'rub', sourceOrigin = 'balance') {
  const origin = billingOrigin(sourceOrigin, 'balance');
  return {
    text: '<b>оплата по СБП</b>\n\nоплата проходит <b>в защищённой форме СБП</b>.\n\nсначала выбери тариф или пакет метакоинов:',
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'выбрать тариф', callback_data: `billing:plans:${origin}` }],
        [buildMetacoinButton('выбрать метакоины', { callback_data: `billing:packages:${origin}` })],
        ...billingNavigation(originBackData(origin))
      ]
    }
  };
}

export function buildPlansMessage(source, sourceOrigin = 'profile') {
  const account = billingAccount(source);
  const current = getSubscriptionPlan(account.subscriptionPlanId);
  const newcomer = getSubscriptionPlan('newcomer');
  const origin = billingOrigin(sourceOrigin);
  const allowanceTitle = current.id === 'newcomer'
    ? 'тебе доступны:'
    : 'в тарифе «новичок» доступно:';
  const currentPlanLabel = current.id === 'newcomer'
    ? '<b>тариф «новичок» (бесплатный)</b>'
    : `<b>текущий тариф — ${escapeHtml(current.name)}</b>`;
  return {
    text: `💸 <b>актуальные тарифы</b>\n\n${currentPlanLabel}\n\n<b>${allowanceTitle}</b>\n\n${newcomerFeatureGroups(newcomer.features)}\n\n<b>платные тарифы</b> открывают весь каталог и пополняют баланс метакоинов. открой нужный тариф, чтобы посмотреть объём, срок и условия покупки.\n\nпри оплате трёх месяцев действует скидка <b>15%</b>. <b>метакоины не сгорают</b> и переносятся при продлении; использовать их можно при активной платной подписке.`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...getPurchasableSubscriptionPlans().filter((item) => item.priceKopecks > 0).map((item) => [{
          text: `${item.name} · от ${formatRubles(item.priceKopecks)}${item.id === 'researcher' ? ' 🔥' : ''}`,
          callback_data: `billing:planinfo:${item.id}:${origin}`
        }]),
        ...billingNavigation(originBackData(origin))
      ]
    }
  };
}

export function buildPlanDetailsMessage(productId, source, sourceOrigin = 'profile') {
  const account = billingAccount(source);
  const item = getSubscriptionPlan(productId);
  const origin = billingOrigin(sourceOrigin);
  if (!item || item.priceKopecks === 0) return buildPlansMessage(account, origin);
  if (item.id === account.subscriptionPlanId && isPaidSubscriptionActive(account)) {
    return buildActiveSubscriptionMessage({ planId: item.id, account, origin });
  }
  const quarterly = getSubscriptionOffer(item.id, 3);
  const features = item.features.filter((feature) => !/метакоин|бета-модели/i.test(feature));
  const monthlyLine = `${formatRubles(item.priceKopecks)} · <b>${item.metacoins.toLocaleString('ru-RU')} метакоинов</b>`;
  const quarterlyBlock = quarterly
    ? `\n\n📅 <b>3 месяца</b>\n${formatRubles(quarterly.priceKopecks)} (-15%) · <b>${quarterly.metacoins.toLocaleString('ru-RU')} метакоинов</b>`
    : '';
  const quarterlyButton = quarterly
    ? [[{
        text: `оплатить на 3 месяца · ${formatRubles(quarterly.priceKopecks)} (−15%)`,
        callback_data: `billing:plan:${item.id}:3:${origin}`
      }]]
    : [];

  return {
    text: `📦 <b>тариф «${item.name}»</b>\n\n📅 <b>1 месяц</b>\n${monthlyLine}${quarterlyBlock}\n\n${features.map(formatPlanFeature).join('\n\n')}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{
          text: `оплатить на 1 месяц · ${formatRubles(item.priceKopecks)}`,
          callback_data: `billing:plan:${item.id}:1:${origin}`
        }],
        ...quarterlyButton,
        ...billingNavigation(`billing:plans:${origin}`)
      ]
    }
  };
}

export function buildMetacoinPackagesMessage(sourceOrigin = 'balance') {
  const origin = billingOrigin(sourceOrigin, 'balance');
  const blocks = METACOIN_PACKAGES.map((item) => {
    const unitPrice = (item.priceKopecks / item.metacoins / 100).toFixed(2).replace('.', ',');
    return `${formatRubles(item.priceKopecks)} · <b>${item.metacoins.toLocaleString('ru-RU')} метакоинов</b>\n${unitPrice} ₽ за 1 метакоин\n${item.audience}`;
  });
  return {
    text: `<b>докупить метакоины</b>\n\nпокупка разово пополнит общий баланс. срок тарифа не изменится. <b>метакоины не сгорают</b>.\n\nими можно оплачивать модели, ИИ-инструменты и ИИ-агентов при активном платном тарифе. точная стоимость указана в карточке перед отправкой запроса.\n\nчем больше пакет, тем ниже цена одного метакоина.\n\n${blocks.join('\n\n')}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...METACOIN_PACKAGES.map((item) => [
          buildMetacoinButton(
            `купить · ${formatRubles(item.priceKopecks)} · ${item.metacoins.toLocaleString('ru-RU')} метакоинов`,
            { callback_data: `billing:package:${item.id}:${origin}` }
          )
        ]),
        ...billingNavigation(originBackData(origin))
      ]
    }
  };
}

function purchaseSuccessNavigation() {
  return [
    [{ text: '👤 профиль', callback_data: 'task:profile' }],
    [{ text: '🏠 главное меню', callback_data: 'task:menu' }]
  ];
}

function receiptSuccessLine(receiptEmail) {
  const email = String(receiptEmail ?? '').trim().toLowerCase();
  if (!email) return '';
  return `\n\n✅ чек отправлен на <code>${escapeHtml(email)}</code>.`;
}

export function buildMetacoinPurchaseSuccessMessage({
  packageId,
  creditedMetacoins,
  balanceMetacoins,
  receiptEmail = null,
  receiptChannel = 'yookassa'
}) {
  const item = getMetacoinPackage(packageId);
  if (!item) throw new Error('Unknown metacoin package.');
  if (!Number.isSafeInteger(creditedMetacoins) || creditedMetacoins <= 0) {
    throw new TypeError('Credited metacoins must be a confirmed positive amount.');
  }
  const credited = creditedMetacoins;
  if (!Number.isSafeInteger(balanceMetacoins) || balanceMetacoins < credited) {
    throw new TypeError('Invalid metacoin balance.');
  }
  return {
    text: `💸 <b>баланс пополнен</b>\n\n<b>добавлено:</b> ${metacoinHtml()} ${credited.toLocaleString('ru-RU')} метакоинов\n<b>теперь на балансе:</b> ${metacoinHtml()} ${balanceMetacoins.toLocaleString('ru-RU')} метакоинов\n\nметакоины уже можно использовать для работы с ${MODEL_CATALOG_COUNT} моделями, ${AI_TOOL_COUNT} ИИ-инструментами и ${AI_AGENT_COUNT} ИИ-агентами. для платного каталога нужен активный тариф.${receiptSuccessLine(receiptEmail, receiptChannel)}`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: purchaseSuccessNavigation() }
  };
}

export function buildPlanPurchaseSuccessMessage({
  planId,
  durationMonths = 1,
  creditedMetacoins,
  balanceMetacoins,
  expiresAt,
  operation = 'activated',
  receiptEmail = null,
  receiptChannel = 'yookassa'
}) {
  const item = getSubscriptionPlan(planId);
  if (!item || item.priceKopecks === 0) throw new Error('Unknown paid plan.');
  if (![1, 3].includes(durationMonths)) throw new TypeError('Unsupported subscription duration.');
  if (!['activated', 'renewed'].includes(operation)) {
    throw new TypeError('Unsupported purchase operation.');
  }
  if (!Number.isSafeInteger(creditedMetacoins) || creditedMetacoins <= 0) {
    throw new TypeError('Credited metacoins must be a confirmed positive amount.');
  }
  const expiration = new Date(expiresAt);
  if (!expiresAt || Number.isNaN(expiration.valueOf())) {
    throw new TypeError('Invalid subscription expiration.');
  }
  const credited = creditedMetacoins;
  if (!Number.isSafeInteger(balanceMetacoins) || balanceMetacoins < credited) {
    throw new TypeError('Invalid metacoin balance.');
  }
  const action = operation === 'renewed' ? 'продлён' : 'активирован';
  return {
    text: `✅ <b>тариф «${escapeHtml(item.name)}» ${action}</b>\n\n<b>срок:</b> ${durationMonths === 3 ? '3 месяца' : '1 месяц'}\n<b>действует до:</b> ${formatDate(expiresAt)}\n<b>начислено:</b> ${metacoinHtml()} ${credited.toLocaleString('ru-RU')} метакоинов\n<b>теперь на балансе:</b> ${metacoinHtml()} ${balanceMetacoins.toLocaleString('ru-RU')} метакоинов\n\n<b>метакоины не сгорают</b>: остаток сохраняется на балансе и при продлении. использовать его можно, пока активен платный тариф.\n\nприятного пользования!${receiptSuccessLine(receiptEmail, receiptChannel)}`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: purchaseSuccessNavigation() }
  };
}

const PAYMENT_FAILURE_COPY = Object.freeze({
  insufficient_funds: 'банк отклонил платёж: недостаточно средств.',
  canceled: 'платёж отменён или страница оплаты была закрыта.',
  general_decline: 'банк отклонил платёж.',
  expired: 'срок действия платёжной страницы истёк.'
});

export function buildPaymentFailureMessage({
  reason = 'payment_failed',
  backData = 'billing:home'
} = {}) {
  const normalizedReason = String(reason ?? '').trim().toLowerCase();
  const explanation = PAYMENT_FAILURE_COPY[normalizedReason]
    ?? 'платёж не завершился.';
  return {
    text: `❌ <b>оплата не прошла</b>\n\n${explanation}\n\nтариф или метакоины не начислены. если банк всё же удержал сумму, напиши в поддержку — проверим платёж.`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🧯 поддержка', callback_data: 'task:support' }],
        ...billingNavigation(backData)
      ]
    }
  };
}

function planCheckout(productId, source, durationMonths = 1) {
  const account = billingAccount(source);
  const current = getSubscriptionPlan(account.subscriptionPlanId);
  const target = getSubscriptionPlan(productId);
  if (!target) throw new Error('Unknown plan.');
  const offer = getSubscriptionOffer(productId, durationMonths);

  if (target.id === 'newcomer') {
    throw new Error('The free plan cannot be purchased.');
  }

  if (target.priceKopecks < current.priceKopecks) {
    return {
      title: `тариф ${target.name}`,
      details: `после оплаты тариф «${escapeHtml(target.name)}» заменит текущий тариф «${escapeHtml(current.name)}». срок действия начнётся сразу после подтверждения платежа.`,
      amountKopecks: offer.priceKopecks,
      durationMonths,
      metacoins: offer.metacoins,
      backData: 'billing:plans'
    };
  }

  if (target.id === current.id && isPaidSubscriptionActive(account)) {
    return {
      alreadyActive: true,
      planId: target.id,
      backData: 'billing:plans'
    };
  }

  if (target.id === current.id) {
    return {
      title: `продление тарифа ${target.name}`,
      details: `тариф продлится на ${offer.durationDays} дней, на баланс поступит ${offer.metacoins.toLocaleString('ru-RU')} метакоинов.${offer.discountPercent ? ` скидка за три месяца: <b>${offer.discountPercent}%</b>.` : ''}`,
      amountKopecks: offer.priceKopecks,
      durationMonths,
      metacoins: offer.metacoins,
      backData: 'billing:plans'
    };
  }

  const hasActivePaidSubscription = current.priceKopecks > 0
    && isPaidSubscriptionActive(account);
  if (!hasActivePaidSubscription) {
    return {
      title: `тариф ${target.name}`,
      details: `тариф действует ${offer.durationDays} дней. на баланс поступит ${offer.metacoins.toLocaleString('ru-RU')} метакоинов.${offer.discountPercent ? ` скидка за три месяца: <b>${offer.discountPercent}%</b>.` : ''} <b>метакоины не сгорают</b>.`,
      amountKopecks: offer.priceKopecks,
      durationMonths,
      metacoins: offer.metacoins,
      backData: 'billing:plans'
    };
  }
  const quote = calculatePlanUpgrade({
    currentPlanId: current.id,
    targetPlanId: target.id,
    remainingPlanMetacoins: account.subscriptionMetacoinsRemaining,
    currentSubscriptionMetacoinsTotal: account.subscriptionMetacoinsTotal,
    currentSubscriptionPriceKopecks: account.subscriptionPriceKopecks,
    currentDurationMonths: account.subscriptionDurationMonths ?? durationMonths,
    targetDurationMonths: offer.months
  });
  return {
    title: `тариф ${target.name}`,
    details: `тариф действует ${offer.durationDays} дней. на баланс поступит ${offer.metacoins.toLocaleString('ru-RU')} метакоинов.${offer.discountPercent ? ` скидка за три месяца: <b>${offer.discountPercent}%</b>.` : ''} <b>метакоины не сгорают</b>.`,
    amountKopecks: Math.max(0, offer.priceKopecks - quote.creditKopecks),
    durationMonths,
    metacoins: offer.metacoins,
    backData: 'billing:plans'
  };
}

function packageCheckout(productId) {
  const item = getMetacoinPackage(productId);
  if (!item) throw new Error('Unknown metacoin package.');
  return {
    title: `${item.metacoins.toLocaleString('ru-RU')} метакоинов`,
    details: `${item.metacoins.toLocaleString('ru-RU')} метакоинов будут добавлены к текущему балансу. <b>метакоины не сгорают</b>.`,
    amountKopecks: item.priceKopecks,
    backData: 'billing:packages'
  };
}

export function buildInvoicePlaceholderMessage({
  kind,
  productId,
  durationMonths = 1,
  account,
  promo = null,
  origin: sourceOrigin,
  paymentMethods = ['sbp']
}) {
  const origin = billingOrigin(sourceOrigin, kind === 'package' ? 'balance' : 'profile');
  const purchase = kind === 'plan'
    ? planCheckout(productId, account, durationMonths)
    : packageCheckout(productId);
  if (purchase.alreadyActive) {
    return buildActiveSubscriptionMessage({
      planId: purchase.planId,
      account,
      origin
    });
  }
  const productName = purchase.title.replace(/^тариф\s+/, '');
  const productLine = kind === 'plan'
    ? `<b>тариф:</b> ${productName} на ${durationMonths === 3 ? '3 месяца' : '1 месяц'}`
    : `<b>метакоины: ${productName}</b>`;
  const discountPercent = promo?.active && promo.rewardType === 'discount_percent' && !promo.modelIds?.length
    ? Math.min(100, Math.max(0, Number(promo.rewardValue) || 0))
    : 0;
  const discountKopecks = Math.round(purchase.amountKopecks * discountPercent / 100);
  const payableKopecks = Math.max(0, purchase.amountKopecks - discountKopecks);
  const discountLine = discountKopecks > 0
    ? `\n🎟 <b>скидка по промокоду ${escapeHtml(promo.code)}:</b> −${formatRubles(discountKopecks)}`
    : '';
  const changeData = kind === 'plan'
    ? `billing:planinfo:${productId}:${origin}`
    : `billing:packages:${origin}`;
  const zeroAmountBackData = kind === 'plan'
    ? `billing:plans:${origin}`
    : `billing:packages:${origin}`;
  if (payableKopecks === 0) {
    return {
      text: `<b>${purchase.title}</b>\n\n${purchase.details}`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{
            text: kind === 'plan' ? 'выбрать другой тариф' : 'выбрать другой пакет',
            callback_data: zeroAmountBackData
          }],
          [{ text: '👤 профиль', callback_data: 'task:profile' }],
          [{ text: '🏠 главное меню', callback_data: 'task:menu' }]
        ]
      }
    };
  }
  const paymentButton = buildUiButton('sbp', 'оплатить по СБП', {
    callback_data: `billing:checkout:${kind}:${productId}${kind === 'plan' ? `:${durationMonths}` : ''}:${origin}:${payableKopecks}`
  });
  const cryptoPaymentRows = paymentMethods.includes('crypto_usdc')
    ? [[buildUiButton('base', 'оплата криптовалютой', {
        callback_data: `billing:checkout:crypto_usdc:${kind}:${productId}${kind === 'plan' ? `:${durationMonths}` : ''}:${origin}`
      })]]
    : [];
  const sbpPaymentRows = paymentMethods.includes('sbp') ? [[paymentButton]] : [];
  return {
    text: `💳 <b>счёт на оплату</b>\n\n💰 <b>сумма:</b> ${formatRubles(payableKopecks)}${discountLine}\n📦 ${productLine}\n\n${purchase.details}\n\nдля СБП понадобится e-mail для чека.\n\nнажми кнопку ниже, чтобы оплатить. после подтверждения платежа ${kind === 'plan' ? 'тариф активируется' : 'метакоины появятся на балансе'} автоматически.`,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: {
      inline_keyboard: [
        ...sbpPaymentRows,
        ...cryptoPaymentRows,
        [
          { text: 'изменить выбор', callback_data: changeData },
          { text: '👤 профиль', callback_data: 'task:profile' }
        ],
        [{ text: '🏠 главное меню', callback_data: 'task:menu' }]
      ]
    }
  };
}

export function buildBillingHistoryMessage(sourceOrigin = 'profile') {
  const origin = billingOrigin(sourceOrigin);
  return {
    text: '<b>история операций</b>\n\nпокупок и списаний пока нет. после первого пополнения здесь появятся дата, сумма, выбранный тариф или разовая докупка и начисленные метакоины.',
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: billingNavigation(originBackData(origin)) }
  };
}

function cleanPreview(value, fallback = 'без текста') {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
  return escapeHtml(normalized ? normalized.slice(0, 120) : fallback);
}

export function buildDialogHistoryMessage(page = { items: [] }) {
  const items = Array.isArray(page?.items) ? page.items : [];
  const pageIndex = Number.isInteger(page?.pageIndex) && page.pageIndex >= 0
    ? page.pageIndex
    : 0;
  const rows = items.slice(0, 8).map((item) => [{
    text: `${String(item.title || 'новый диалог').slice(0, 34)} · ${item.messageCount ?? 0}`,
    callback_data: `dialoghist:view:${item.id}`
  }]);
  const body = items.length === 0
    ? 'диалогов пока нет. открой текстовую модель и отправь первое сообщение — новая ветка появится здесь.'
    : items.map((item, index) => (
        `<b>${index + 1}. ${escapeHtml(item.title || 'новый диалог')}</b>\n`
        + `${formatDateTime(item.latestMessageAt)} · ${item.messageCount ?? 0} сообщений\n`
        + cleanPreview(item.lastMessagePreview, 'без сообщений')
      )).join('\n\n');
  return {
    text: `💬 <b>история диалогов</b>\n\nздесь хранятся отдельные ветки общения с текстовыми моделями. открой нужную, чтобы перечитать ответы или продолжить с того же места.\n\n${body}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...rows,
        ...((page.hasPrevious || page.hasNext) ? [[
          ...(page.hasPrevious ? [{
            text: '‹ назад',
            callback_data: `dialoghist:list:${pageIndex - 1}`
          }] : []),
          ...(page.hasNext ? [{
            text: 'дальше ›',
            callback_data: `dialoghist:list:${pageIndex + 1}`
          }] : [])
        ]] : []),
        [{ text: '⛔️ очистить контекст', callback_data: 'dialog:new' }],
        ...billingNavigation('task:profile')
      ]
    }
  };
}

export function buildDialogThreadMessage(thread = null) {
  if (!thread?.conversation) {
    return {
      text: '💬 <b>диалог не найден</b>\n\nвозможно, он удалён, истёк по сроку хранения или относится к другому пользователю.',
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: billingNavigation('dialoghist:list:0') }
    };
  }
  const messages = Array.isArray(thread.messages) ? thread.messages.slice(-8) : [];
  const body = messages.length === 0
    ? 'в этой ветке пока нет сообщений.'
    : messages.map((message) => {
        const role = message.role === 'assistant' ? 'ответ' : message.role === 'user' ? 'сообщение' : message.role;
        return `<b>${escapeHtml(role)}</b>\n${cleanPreview(message.content, 'без текста')}`;
      }).join('\n\n');
  return {
    text: `💬 <b>${escapeHtml(thread.conversation.title || 'диалог')}</b>\n\n${body}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'продолжить диалог', callback_data: `dialoghist:continue:${thread.conversation.id}` }],
        [{ text: 'убрать из списка', callback_data: `dialoghist:archive:${thread.conversation.id}` }],
        ...billingNavigation('dialoghist:list:0')
      ]
    }
  };
}

export function buildPromoMessage(activeCode = '', sourceOrigin = 'profile', reward = null) {
  const origin = billingOrigin(sourceOrigin);
  const status = activeCode
    ? `\n\n<b>активный промокод:</b> ${escapeHtml(activeCode)}${reward?.rewardType === 'metacoins' ? `\nначислено: ${Number(reward.rewardValue).toLocaleString('ru-RU')} метакоинов.` : reward?.rewardType === 'discount_percent' ? `\nскидка ${reward.rewardValue}% действует на ${reward.modelIds?.length ?? 0} моделей.` : ''}`
    : '\n\nсохранённых промокодов пока нет.';
  return {
    text: `🎟 <b>мои промокоды</b>\n\nпромокод может добавить метакоины или снизить стоимость выбранных моделей.${status}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{
          text: activeCode ? 'заменить промокод' : 'добавить промокод',
          callback_data: `billing:promo:enter:${origin}`
        }],
        ...billingNavigation(originBackData(origin))
      ]
    }
  };
}

export function buildPromoEntryMessage() {
  return {
    text: '<b>ввести промокод</b>\n\nотправь промокод в поле ниже. можно использовать латинские буквы, цифры, дефис и нижнее подчёркивание.',
    parse_mode: 'HTML',
    reply_markup: {
      force_reply: true,
      input_field_placeholder: 'введи промокод'
    }
  };
}

export function buildCheckoutUnavailableMessage(backData = 'billing:home') {
  return {
    text: '<b>оплата по СБП временно недоступна</b>\n\nплатёж не создан, деньги не списаны. попробуй ещё раз позже или обратись в поддержку.',
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: billingNavigation(backData) }
  };
}

export function buildReceiptEmailPrompt(backData = 'billing:home') {
  return {
    text: '<b>одну секунду: нужен e-mail для чека</b>\n\nТ-Банк отправит чек на этот адрес по требованиям 54-ФЗ. сохраним e-mail в профиле и повторно спрашивать его не будем. без него платёжная ссылка не создастся.\n\n<b>направь ответным сообщением реальный адрес электронной почты👇</b>',
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: billingNavigation(backData)
    }
  };
}

export function buildPaymentRedirectMessage({
  confirmationUrl,
  amountKopecks,
  backData = 'billing:home'
}) {
  let url;
  try {
    url = new URL(confirmationUrl);
  } catch {
    throw new TypeError('Invalid payment URL.');
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new TypeError('Invalid payment URL.');
  }
  return {
    text: '💳 <b>счёт готов</b>\n\nоплата откроется <b>в защищённой форме СБП</b>. после подтверждения тариф активируется или метакоины поступят на баланс автоматически.',
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: {
      inline_keyboard: [
        [{ text: 'оплатить', url: url.toString() }],
        ...billingNavigation(backData)
      ]
    }
  };
}

export function buildCryptoPaymentRedirectMessage({
  confirmationUrl,
  amountUsdcMicros,
  backData = 'billing:home'
}) {
  let url;
  try {
    url = new URL(confirmationUrl);
  } catch {
    throw new TypeError('Invalid crypto payment URL.');
  }
  if (url.protocol !== 'https:' || url.username || url.password || !Number.isSafeInteger(amountUsdcMicros) || amountUsdcMicros <= 0) {
    throw new TypeError('Invalid crypto payment redirect.');
  }
  const amount = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(amountUsdcMicros / 1_000_000);
  return {
    text: `💳 <b>крипто-счёт готов</b>\n\n<b>к оплате:</b> ${amount} USDC\n<b>сеть:</b> Base\n\nоплата откроется <b>в защищённой форме оплаты криптовалютой</b>. начисление произойдёт автоматически после подтверждения перевода в блокчейне.`,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: {
      inline_keyboard: [
        [{ text: 'оплатить USDC', url: url.toString() }],
        ...billingNavigation(backData)
      ]
    }
  };
}
