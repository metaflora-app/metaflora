import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBalanceHomeMessage,
  buildMetacoinPurchaseSuccessMessage,
  buildDialogHistoryMessage,
  buildDialogThreadMessage,
  buildInvoicePlaceholderMessage,
  buildBillingHistoryMessage,
  buildPaymentFailureMessage,
  buildPaymentMethodMessage,
  buildMetacoinPackagesMessage,
  buildPlanDetailsMessage,
  buildPlanPurchaseSuccessMessage,
  buildPlansMessage,
  buildProfileCabinetMessage,
  buildPromoEntryMessage,
  buildPromoMessage,
  buildReceiptEmailPrompt,
  buildPaymentRedirectMessage
} from '../src/billing-ui.js';
import { MODEL_CATALOG_COUNT } from '../src/catalog-counts.js';
import { buildGenerationHistoryListMessage } from '../src/generation-history-ui.js';
import { setCustomEmojiIds } from '../src/brand-icons.js';

const account = Object.freeze({
  metacoinBalance: 160,
  subscriptionPlanId: 'amateur',
  subscriptionMetacoinsTotal: 130,
  subscriptionMetacoinsRemaining: 110,
  subscriptionExpiresAt: '2026-09-24T00:00:00.000Z',
  packageId: 'coins_50',
  packageMetacoinsRemaining: 50,
  spentMetacoins1d: 4,
  spentMetacoins30d: 20,
  availableKopecks: 0,
  referralUrl: 'https://t.me/neuro_metaflora_bot?start=ref_ivan_A1B2C3',
  invited: 7,
  paidReferrals: 3
});

function buttons(message) {
  return message.reply_markup.inline_keyboard.flat();
}

test('profile keeps only account information and a short metacoin footnote', () => {
  const message = buildProfileCabinetMessage({
    account,
    selectedModel: { name: 'Nano Banana Pro' }
  });

  assert.match(message.text, /^👤 <b>профиль<\/b>/);
  assert.match(message.text, /<b>тариф «любитель»<\/b>/);
  assert.match(message.text, /<b>дата окончания:<\/b> 24\.09\.2026/u);
  assert.match(message.text, /<b>баланс:<\/b>.*160 метакоинов/);
  assert.match(message.text, /<b>потрачено за 1 день:<\/b> 4/);
  assert.match(message.text, /<b>реферальная ссылка:<\/b>.*ref_ivan_A1B2C3/s);
  assert.match(message.text, /<blockquote>\*метакоин — внутренняя валюта агрегатора\.<\/blockquote>$/);
  assert.doesNotMatch(message.text, /250 моделей|пользователей:|квота|пакет:|текущая модель|Nano Banana Pro/i);
  assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'billing:home'));
  assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'billing:plans:profile'));
  assert.equal(buttons(message)[0].text, 'актуальные тарифы');
  assert.ok(buttons(message).some(
    ({ text, callback_data }) => text === 'мои промокоды' && callback_data === 'billing:promo:profile'
  ));
  assert.ok(buttons(message).some(
    ({ text, callback_data }) => (
      text === 'история генераций' && callback_data === 'genhist:list:0'
    )
  ));
  assert.ok(buttons(message).some(
    ({ text, callback_data }) => (
      text === 'история диалогов' && callback_data === 'dialoghist:list:0'
    )
  ));
  assert.ok(buttons(message).some(
    ({ text, callback_data }) => (
      text === 'история задач' && callback_data === 'taskhist:list:0'
    )
  ));
  assert.ok(!buttons(message).some(({ text }) => text === 'история операций'));
  assert.ok(!buttons(message).some(({ callback_data }) => callback_data === 'billing:packages'));
  assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'ref:home'));
  assert.ok(!buttons(message).some(({ callback_data }) => callback_data === 'task:settings'));
  assert.ok(!buttons(message).some(({ callback_data }) => callback_data === 'task:support'));
  assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'task:profile'));
  assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'task:menu'));
  assert.ok(buttons(message).some(({ text }) => text === '‹ назад'));
});

test('receipt email prompt explains the one-time requirement and blocks checkout without it', () => {
  const message = buildReceiptEmailPrompt('billing:packages:balance');

  assert.match(message.text, /^<b>одну секунду: нужен e-mail для чека<\/b>/u);
  assert.match(message.text, /чек на этот адрес по требованиям 54-ФЗ/i);
  assert.match(message.text, /сохраним.*профил/i);
  assert.match(message.text, /без него.*платёжн.*ссылк.*не создастся/i);
  assert.match(message.text, /<b>направь ответным сообщением реальный адрес электронной почты👇<\/b>$/u);
});

test('profile never presents a paid tariff without an exact end date', () => {
  const message = buildProfileCabinetMessage({
    account: {
      ...account,
      subscriptionPlanId: 'author',
      subscriptionExpiresAt: null
    }
  });

  assert.doesNotMatch(message.text, /тариф «автор»|без срока/i);
  assert.match(message.text, /тариф «новичок»/i);
});

test('profile omits the subscription end date for the newcomer plan', () => {
  const message = buildProfileCabinetMessage({
    account: {
      ...account,
      subscriptionPlanId: 'newcomer',
      subscriptionExpiresAt: '2026-07-06T00:00:00.000Z'
    }
  });

  assert.match(message.text, /<b>тариф «новичок» \(бесплатный\)<\/b>/u);
  assert.doesNotMatch(message.text, /дата окончания/u);
});

test('balance home separates tariffs from a one-time metacoin purchase', () => {
  const message = buildBalanceHomeMessage(account);

  assert.match(message.text, /^🛎 <b>пополнить баланс<\/b>/);
  assert.match(message.text, /стоимость указана в карточке каждой модели/i);
  assert.match(message.text, /<b>тариф<\/b>/i);
  assert.match(message.text, /<b>разовая покупка<\/b>/i);
  assert.match(message.text, /<b>метакоины не сгорают<\/b> и переносятся/i);
  assert.match(message.text, /только при активной платной подписке/i);
  assert.doesNotMatch(message.text, /сначала выбери, что пополняем|оплата доступна по СБП/i);
  assert.doesNotMatch(message.text, /e-mail.*чека|чек.*e-mail/i);
  assert.doesNotMatch(message.text, /для нескольких|для регулярных|для работы с|для большого|для постоянной/i);
  assert.doesNotMatch(message.text, /провайдер|маршрут|себестоим/i);
  assert.equal(buttons(message)[0].text, 'оплатить тариф');
  assert.equal(buttons(message)[0].callback_data, 'billing:plans:balance');
  assert.equal(buttons(message)[1].text, 'купить метакоины');
  assert.equal(buttons(message)[1].callback_data, 'billing:packages:balance');
  assert.ok(!buttons(message).some(({ callback_data }) => callback_data === 'billing:method:rub'));
  assert.ok(!buttons(message).some(({ callback_data }) => callback_data === 'billing:method:stars'));
  assert.ok(!buttons(message).some(({ text }) => text === 'история операций'));
  assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'billing:promo:balance'));
});

test('removed Stars method falls back to the SBP method screen', () => {
  const message = buildPaymentMethodMessage('stars', 'balance');

  assert.match(message.text, /<b>оплата по СБП<\/b>/u);
  assert.doesNotMatch(message.text, /Stars|⭐/u);
  assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'billing:plans:balance'));
  assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'billing:packages:balance'));
});

test('plans and packages contain their terms and selectable buttons', () => {
  const plans = buildPlansMessage(account);
  const newcomerPlans = buildPlansMessage({ ...account, subscriptionPlanId: 'newcomer' });
  const packages = buildMetacoinPackagesMessage(account);

  assert.match(newcomerPlans.text, /<b>тариф «новичок» \(бесплатный\)<\/b>/u);
  assert.doesNotMatch(newcomerPlans.text, /0 метакоинов.*доступны только недельные квоты/u);
  assert.match(newcomerPlans.text, /<b>тебе доступны:<\/b>/u);
  assert.doesNotMatch(plans.text, /0 метакоинов<\/b> — доступны только недельные квоты/u);
  assert.match(plans.text, /<b>в тарифе «новичок» доступно:<\/b>/u);
  for (const name of ['любитель', 'автор', 'эксперт']) {
    assert.ok(buttons(plans).some(({ text }) => text.startsWith(name)));
  }
  assert.ok(buttons(plans).some(
    ({ text, callback_data }) => (
      /^исследователь · от 2\s490 ₽ 🔥$/u.test(text)
      && callback_data === 'billing:planinfo:researcher:profile'
    )
  ));
  assert.match(plans.text, /^💸 <b>актуальные тарифы<\/b>/);
  assert.match(newcomerPlans.text, /<b>тариф «новичок» \(бесплатный\)<\/b>/u);
  for (const group of ['текст', 'изображения', 'музыка', 'озвучка']) {
    assert.match(plans.text, new RegExp(`<b>${group}<\\/b>`));
  }
  assert.match(plans.text, /<b>50 текстовых запросов<\/b>[\s\S]*gpt-oss-20b[\s\S]*Nemotron 3 Ultra[\s\S]*North Mini Code[\s\S]*<b>20 запросов<\/b>[\s\S]*GPT-5\.6 Luna/u);
  assert.match(plans.text, /<b>изображения<\/b>[\s\S]*<b>2 генерации<\/b>[\s\S]*GPT Image 2[\s\S]*<b>2 генерации<\/b>[\s\S]*Nano Banana 2/u);
  assert.doesNotMatch(plans.text, /Kling 3|\bSol\b/u);
  assert.equal((plans.text.match(/<tg-emoji /g) ?? []).length, 8);
  const imageGroup = plans.text.match(/(?:<tg-emoji [^>]+>[^<]+<\/tg-emoji>\s*){2}<b>изображения<\/b>/u)?.[0] ?? '';
  assert.equal((imageGroup.match(/<tg-emoji /g) ?? []).length, 2);
  assert.doesNotMatch(plans.text, /сейчас у тебя:|<b>(?:текст|модели|изображения|видео|музыка|озвучка):<\/b>/u);
  assert.ok(buttons(plans).some(({ callback_data }) => callback_data === 'billing:planinfo:author:profile'));
  assert.ok(!buttons(plans).some(({ callback_data }) => callback_data === 'billing:plan:newcomer'));
  assert.doesNotMatch(plans.text, /20%|на 20% больше/i);
  assert.match(plans.text, /<b>метакоины не сгорают<\/b> и переносятся/i);
  assert.match(plans.text, /при активной платной подписке/i);
  assert.ok(buttons(plans).some(({ callback_data }) => callback_data === 'task:profile'));

  const author = buildPlanDetailsMessage('author', account);
  assert.match(author.text, /📅 <b>1 месяц<\/b>/);
  assert.match(author.text, /📅 <b>3 месяца<\/b>/);
  assert.match(author.text, /1\s490 ₽ · <b>300 метакоинов<\/b>/u);
  assert.doesNotMatch(author.text, /⭐|Stars/u);
  assert.match(author.text, /3\s800 ₽ \(-15%\) · <b>900 метакоинов<\/b>/u);
  assert.match(author.text, new RegExp(`<b>${MODEL_CATALOG_COUNT} моделей:<\\/b>`));
  assert.match(author.text, new RegExp(`<b>${MODEL_CATALOG_COUNT} моделей:<\\/b> Seedance 2\\.5,`));
  assert.doesNotMatch(author.text, /Seedance 2\.0/u);
  assert.match(author.text, /<b>42 ИИ-инструмента:<\/b>/);
  assert.match(author.text, /<b>50 ИИ-агентов:<\/b>/);
  assert.doesNotMatch(author.text, /бета-модели/u);
  assert.doesNotMatch(author.text, /\+20%|20% метакоинов/i);
  assert.doesNotMatch(author.text, /<b>метакоины:<\/b>|метакоины: \d/i);
  assert.doesNotMatch(author.text, /<b>метакоины не сгорают<\/b>|переносятся на следующий месяц|использовать их можно только при активном платном тарифе/i);
  assert.ok(buttons(author).some(({ callback_data }) => callback_data === 'billing:plan:author:1:profile'));
  assert.ok(buttons(author).some(({ callback_data }) => callback_data === 'billing:plan:author:3:profile'));
  assert.ok(buttons(author).some(({ text }) => /на 1 месяц · 1\s490 ₽/u.test(text)));
  assert.ok(buttons(author).some(({ text }) => /на 3 месяца · 3\s800 ₽.*−15%/u.test(text)));
  assert.ok(buttons(author).some(({ text }) => /на 3 месяца.*−15%/i.test(text)));

  assert.match(packages.text, /^<b>докупить метакоины<\/b>/);
  assert.match(packages.text, /<b>2\s500 метакоинов<\/b>/);
  assert.doesNotMatch(packages.text, /<b>50 метакоинов<\/b>/u);
  assert.doesNotMatch(packages.text, /для нескольких|для регулярных|для работы с|для большого|для постоянной/i);
  assert.ok(buttons(packages).some(({ callback_data }) => callback_data === 'billing:package:coins_150:balance'));
  assert.ok(buttons(packages).some(({ text }) => /купить · 549 ₽ · 150 метакоинов/i.test(text)));
  assert.ok(buttons(packages).some(({ callback_data }) => callback_data === 'task:profile'));
});

test('metacoin packages explain purchase terms, unit price, and a distinct use case', () => {
  const message = buildMetacoinPackagesMessage('balance');

  assert.match(message.text, /разово пополнит общий баланс/i);
  assert.match(message.text, /срок тарифа не изменится/i);
  assert.match(message.text, /<b>метакоины не сгорают<\/b>/i);
  assert.match(message.text, /модели, ИИ-инструменты и ИИ-агентов/u);
  assert.match(message.text, /активном платном тарифе/i);
  assert.match(message.text, /точная стоимость.*в карточке/i);
  assert.match(message.text, /чем больше пакет, тем ниже цена одного метакоина/i);
  assert.doesNotMatch(message.text, /пример масштаба|запусков по 10/i);

  for (const [metacoins, price, audience] of [
    ['150', '3,66 ₽', /серию текстов, изображений/i],
    ['400', '3,23 ₽', /запас на неделю контента/i],
    ['1 000', '2,99 ₽', /генерации идут каждый день/i],
    ['2 500', '2,80 ₽', /команды, потока роликов/i]
  ]) {
    const packagePattern = new RegExp(
      `${price.replace('.', '\\.')}`
      + `[\\s\\S]*?${audience.source}`,
      'i'
    );
    assert.match(message.text, packagePattern);
  }
  assert.doesNotMatch(message.text, /подойд[её]т, если/i);
});

test('paid plan cards explain tools and agents with concrete examples', () => {
  const message = buildPlanDetailsMessage('author', account);

  assert.match(message.text, /42 ИИ-инструмента/u);
  assert.match(message.text, /удаление фона|восстановление фото/i);
  assert.match(message.text, /50 ИИ-агентов/u);
  assert.match(message.text, /копирайтер|разработчик/i);
  assert.match(message.text, /и другие/i);
});

test('successful package and plan purchases have different completion messages', () => {
  const packageMessage = buildMetacoinPurchaseSuccessMessage({
    packageId: 'coins_400',
    creditedMetacoins: 400,
    balanceMetacoins: 560,
    receiptEmail: 'buyer@example.com'
  });
  const planMessage = buildPlanPurchaseSuccessMessage({
    planId: 'author',
    durationMonths: 3,
    creditedMetacoins: 900,
    balanceMetacoins: 1_060,
    expiresAt: '2026-10-24T00:00:00.000Z',
    receiptEmail: 'buyer@example.com'
  });

  assert.match(packageMessage.text, /^💸 <b>баланс пополнен<\/b>/);
  assert.match(packageMessage.text, /добавлено:.*400/s);
  assert.match(packageMessage.text, /теперь на балансе:.*560/s);
  assert.match(packageMessage.text, /активный тариф/i);
  assert.match(packageMessage.text, /чек отправлен на.*buyer@example\.com/i);
  assert.doesNotMatch(packageMessage.text, /платёж подтверждён|спасибо!/i);
  assert.doesNotMatch(packageMessage.text, /запуск/i);
  assert.doesNotMatch(packageMessage.text, /тариф «автор» активирован/i);

  assert.match(planMessage.text, /^✅ <b>тариф «автор» активирован<\/b>/);
  assert.match(planMessage.text, /3 месяца/);
  assert.match(planMessage.text, /900 метакоинов/);
  assert.match(planMessage.text, /<b>метакоины не сгорают<\/b>/i);
  assert.match(planMessage.text, /пока активен платный тариф/i);
  assert.match(planMessage.text, /приятного пользования!/i);
  assert.doesNotMatch(planMessage.text, /доступ к платному каталогу открыт/i);
  assert.doesNotMatch(planMessage.text, /42 ИИ-инструмента|50 ИИ-агентов/u);
  assert.match(planMessage.text, /чек отправлен на.*buyer@example\.com/i);
  assert.doesNotMatch(planMessage.text, /платёж подтверждён|спасибо!/i);

  for (const message of [packageMessage, planMessage]) {
    const actions = buttons(message);
    assert.ok(actions.some(({ callback_data }) => callback_data === 'task:profile'));
    assert.ok(actions.some(({ callback_data }) => callback_data === 'task:menu'));
    assert.ok(!actions.some(({ callback_data }) => callback_data === 'task:models'));
    assert.ok(!actions.some(({ callback_data }) => callback_data === 'agents:home'));
  }
});

test('payment failure card explains the reason without claiming a credit', () => {
  const insufficient = buildPaymentFailureMessage({
    reason: 'insufficient_funds',
    backData: 'billing:packages:balance'
  });
  const canceled = buildPaymentFailureMessage({ reason: 'canceled' });

  assert.match(insufficient.text, /^❌ <b>оплата не прошла<\/b>/u);
  assert.match(insufficient.text, /недостаточно средств/u);
  assert.match(insufficient.text, /не начислены/u);
  assert.doesNotMatch(insufficient.text, /баланс пополнен|тариф .*активирован/u);
  assert.match(canceled.text, /платёж отменён/u);
  assert.ok(buttons(insufficient).some(({ callback_data }) => callback_data === 'billing:packages:balance'));
  assert.ok(buttons(insufficient).some(
    ({ text, callback_data }) => text === '🧯 поддержка' && callback_data === 'task:support'
  ));
});

test('success cards reject unconfirmed payment data', () => {
  assert.throws(() => buildMetacoinPurchaseSuccessMessage({
    packageId: 'coins_150',
    creditedMetacoins: 0,
    balanceMetacoins: 50
  }), /credited/i);
  assert.throws(() => buildPlanPurchaseSuccessMessage({
    planId: 'author',
    creditedMetacoins: 300,
    balanceMetacoins: 300,
    expiresAt: 'invalid',
    operation: 'maybe'
  }), /operation|expiration/i);
});

test('promo screen opens a Telegram input field and shows the entered code', () => {
  const promo = buildPromoMessage('', 'profile');
  const entry = buildPromoEntryMessage();
  const active = buildPromoMessage('START_25', 'profile');

  assert.match(promo.text, /^🎟 <b>мои промокоды<\/b>/);
  assert.ok(buttons(promo).some(({ callback_data }) => callback_data === 'billing:promo:enter:profile'));
  assert.ok(buttons(promo).some(({ callback_data }) => callback_data === 'task:profile'));
  assert.equal(entry.reply_markup.force_reply, true);
  assert.equal(entry.reply_markup.input_field_placeholder, 'введи промокод');
  assert.equal(entry.reply_markup.selective, undefined);
  assert.match(active.text, /<b>активный промокод:<\/b> START_25/);
});

test('profile billing screens return to the profile instead of balance home', () => {
  const history = buildBillingHistoryMessage('profile');
  const promo = buildPromoMessage('', 'profile');
  const plans = buildPlansMessage(account, 'profile');

  for (const message of [history, promo, plans]) {
    assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'task:profile'));
    assert.ok(!buttons(message).some(({ callback_data }) => callback_data === 'billing:home'));
  }
});

test('generation and dialog history cards are compact and account-scoped', () => {
  const generations = buildGenerationHistoryListMessage({
    items: [{
      id: 'generation-id',
      kind: 'text',
      subjectId: 'gpt_oss_20b_free',
      status: 'completed',
      metacoinsCharged: 7,
      createdAt: '2026-07-27T00:00:00.000Z',
      finishedAt: '2026-07-27T00:01:00.000Z',
      promptPreview: 'напиши план запуска'
    }]
  });
  const dialogs = buildDialogHistoryMessage({
    pageIndex: 0,
    hasNext: true,
    items: [{
      id: '00000000-0000-4000-8000-000000000001',
      title: 'план запуска',
      messageCount: 4,
      latestMessageAt: '2026-07-27T00:01:00.000Z',
      lastMessagePreview: 'готовый ответ'
    }]
  });
  const thread = buildDialogThreadMessage({
    conversation: {
      id: '00000000-0000-4000-8000-000000000001',
      title: 'план запуска'
    },
    messages: [
      { role: 'user', content: 'напиши план запуска' },
      { role: 'assistant', content: 'готовый ответ' }
    ]
  });

  assert.match(generations.text, /^🖌️ <b>история генераций<\/b>/);
  assert.match(generations.text, /текст · gpt oss 20b free/);
  assert.match(generations.text, /готово/);
  assert.match(generations.text, /7 метакоинов/);
  assert.doesNotMatch(generations.text, /metadata|provider_payload|api/i);
  assert.match(dialogs.text, /^💬 <b>история диалогов<\/b>/);
  assert.ok(buttons(dialogs).some(({ callback_data }) => callback_data === 'dialoghist:view:00000000-0000-4000-8000-000000000001'));
  assert.ok(buttons(dialogs).some(({ callback_data }) => callback_data === 'dialog:new'));
  assert.ok(buttons(dialogs).some(({ callback_data }) => callback_data === 'dialoghist:list:1'));
  assert.match(thread.text, /^💬 <b>план запуска<\/b>/);
  assert.match(thread.text, /<b>сообщение<\/b>/);
  assert.match(thread.text, /<b>ответ<\/b>/);
  assert.ok(buttons(thread).some(({ callback_data }) => callback_data === 'dialoghist:continue:00000000-0000-4000-8000-000000000001'));
  assert.ok(buttons(thread).some(({ callback_data }) => callback_data === 'dialoghist:archive:00000000-0000-4000-8000-000000000001'));
});

test('invoice card shows the exact plan or package before payment', () => {
  const plan = buildInvoicePlaceholderMessage({
    kind: 'plan',
    productId: 'author',
    account
  });
  const pack = buildInvoicePlaceholderMessage({
    kind: 'package',
    productId: 'coins_400',
    account
  });

  assert.match(plan.text, /^💳 <b>счёт на оплату<\/b>/);
  assert.match(plan.text, /<b>тариф:<\/b> автор/);
  assert.match(plan.text, /<b>сумма:<\/b> 856 ₽/u);
  assert.doesNotMatch(plan.text, /остаток текущего тарифа|учтён/i);
  assert.ok(buttons(plan).some(({ callback_data }) => callback_data === 'billing:checkout:plan:author:1:profile:85600'));

  assert.match(pack.text, /<b>метакоины: 400 метакоинов<\/b>/u);
  assert.match(pack.text, /<b>сумма:<\/b> 1\s290 ₽/u);
  assert.ok(buttons(pack).some(({ callback_data }) => callback_data === 'billing:checkout:package:coins_400:balance:129000'));
});

test('three-month invoice uses the discounted total without a hidden metacoin bonus', () => {
  const invoice = buildInvoicePlaceholderMessage({
    kind: 'plan',
    productId: 'author',
    durationMonths: 3,
    account: { ...account, subscriptionPlanId: 'newcomer', subscriptionMetacoinsRemaining: 0 }
  });

  assert.match(invoice.text, /<b>тариф:<\/b> автор на 3 месяца/);
  assert.match(invoice.text, /<b>сумма:<\/b> 3\s800 ₽/u);
  assert.match(invoice.text, /900 метакоинов/);
  assert.match(invoice.text, /скидка за три месяца: <b>15%<\/b>/i);
  assert.doesNotMatch(invoice.text, /метакоинов на 90 дней|\+20%|20% больше/i);
  assert.ok(buttons(invoice).some(({ callback_data }) => callback_data?.startsWith('billing:checkout:plan:author:3:profile:')));
});

test('discount promo changes the final invoice amount', () => {
  const invoice = buildInvoicePlaceholderMessage({
    kind: 'package',
    productId: 'coins_400',
    account,
    promo: {
      code: 'FLORA25',
      rewardType: 'discount_percent',
      rewardValue: 25,
      active: true
    }
  });

  assert.match(invoice.text, /<b>скидка по промокоду FLORA25:<\/b> −323 ₽/);
  assert.match(invoice.text, /<b>сумма:<\/b> 968 ₽/u);
});

test('invoice placeholder stays concise even when legal links are configured', () => {
  const invoice = buildInvoicePlaceholderMessage({
    kind: 'plan',
    productId: 'author',
    account,
    paymentLinks: {
      offerUrl: 'https://metaflora.example/offer',
      privacyUrl: 'https://metaflora.example/privacy'
    }
  });

  assert.match(invoice.text, /^💳 <b>счёт на оплату<\/b>/);
  assert.match(invoice.text, /<b>сумма:<\/b> 856 ₽/u);
  assert.match(invoice.text, /<b>тариф:<\/b> автор/);
  assert.doesNotMatch(invoice.text, /оферт|политик|персональн/i);
  assert.ok(buttons(invoice).some(({ callback_data }) => callback_data?.startsWith('billing:checkout:plan:author:1:profile:')));
});

test('checkout stays local until a server-bound YooKassa order exists', () => {
  const invoice = buildInvoicePlaceholderMessage({
    kind: 'package',
    productId: 'coins_150',
    account,
    paymentLinks: { checkoutUrl: 'https://yookassa.example/order-123' }
  });

  assert.ok(!buttons(invoice).some(({ url }) => url));
  assert.ok(buttons(invoice).some(({ callback_data }) => callback_data?.startsWith('billing:checkout:package:coins_150:balance:')));
});

test('ruble checkout copy exposes only the custom T-Bank SBP form', () => {
  const home = buildBalanceHomeMessage(account);
  const method = buildPaymentMethodMessage('rub');
  const invoice = buildInvoicePlaceholderMessage({
    kind: 'package',
    productId: 'coins_150',
    account
  });
  const receipt = buildReceiptEmailPrompt();

  for (const message of [home, method, invoice, receipt]) {
    assert.doesNotMatch(message.text, /ЮKassa|YooKassa|банковск(?:ая|ой) карт|карта \/ СБП/u);
  }
  assert.doesNotMatch(method.text, /Т-Банк/u);
  assert.ok(buttons(invoice).some(({ text }) => text.endsWith('оплатить по СБП')));
});

test('ready SBP checkout does not repeat amount or bank name', () => {
  const message = buildPaymentRedirectMessage({
    confirmationUrl: 'https://pay-metaflora.ru/checkout/abc',
    amountKopecks: 44_900,
    backData: 'billing:plans:profile'
  });

  assert.match(message.text, /<b>в защищённой форме СБП<\/b>/u);
  assert.doesNotMatch(message.text, /449 ₽|к оплате|Т-Банк/u);
});

test('payment method buttons display the SBP and Base brand icons before their labels', () => {
  setCustomEmojiIds({
    ui_sbp: 'sbp-custom-emoji-id',
    ui_base: 'base-custom-emoji-id'
  });
  try {
    const invoice = buildInvoicePlaceholderMessage({
      kind: 'package',
      productId: 'coins_150',
      account,
      paymentMethods: ['sbp', 'crypto_usdc']
    });
    const sbp = buttons(invoice).find(({ callback_data }) => callback_data?.startsWith('billing:checkout:package:'));
    const crypto = buttons(invoice).find(({ callback_data }) => callback_data?.startsWith('billing:checkout:crypto_usdc:'));

    assert.deepEqual(
      { text: sbp?.text, icon: sbp?.icon_custom_emoji_id },
      { text: 'оплатить по СБП', icon: 'sbp-custom-emoji-id' }
    );
    assert.deepEqual(
      { text: crypto?.text, icon: crypto?.icon_custom_emoji_id },
      { text: 'оплата криптовалютой', icon: 'base-custom-emoji-id' }
    );
  } finally {
    setCustomEmojiIds({});
  }
});

test('switching to a lower paid plan creates a normal checkout immediately', () => {
  const invoice = buildInvoicePlaceholderMessage({
    kind: 'plan',
    productId: 'amateur',
    origin: 'balance',
    account: {
      ...account,
      subscriptionPlanId: 'author',
      subscriptionExpiresAt: '2026-09-24T00:00:00.000Z'
    }
  });

  assert.match(invoice.text, /после оплаты тариф .* заменит текущий тариф/i);
  assert.doesNotMatch(invoice.text, /остаток|учтён/i);
  assert.match(invoice.text, /счёт на оплату|сумма:/i);
  assert.ok(buttons(invoice).some(({ callback_data }) => callback_data?.startsWith('billing:checkout:plan:amateur:1:balance:')));
});

test('active plan cannot be purchased twice before its expiration', () => {
  const details = buildPlanDetailsMessage('amateur', account);
  const invoice = buildInvoicePlaceholderMessage({
    kind: 'plan',
    productId: 'amateur',
    account
  });

  for (const message of [details, invoice]) {
    assert.match(message.text, /уже активен/i);
    assert.match(message.text, /24 сентября 2026/u);
    assert.doesNotMatch(message.text, /счёт на оплату|оплатить картой|оплатить Telegram Stars/i);
    assert.ok(buttons(message).some(({ callback_data }) => callback_data === 'billing:plans:profile'));
  }
});
