import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildReferralAccountMessage,
  buildReferralLevelsMessage,
  buildReferralWithdrawalMessage,
  buildPartnerOfferMessage,
  buildPartnerOnboardingMessage,
  buildWithdrawalDestinationPrompt,
  buildWithdrawalMethodPrompt,
  buildWithdrawalOwnerMessage
} from '../src/referral-ui.js';

const account = Object.freeze({
  referralUrl: 'https://t.me/neuro_metaflora_bot?start=ref_ivan_K7m4Q2x9Qa12',
  level: { name: 'классика', percent: 25, next: { name: 'серебро', remaining: 3 } },
  invited: 0,
  paidReferrals: 0,
  referralTurnoverKopecks: 0,
  availableKopecks: 0,
  pendingKopecks: 0,
  lifetimeKopecks: 0,
  availableBoosts: 0
});

test('referral account explains cash rewards and both uncapped 25 percent bonuses', () => {
  const message = buildReferralAccountMessage(account);
  const buttons = message.reply_markup.inline_keyboard.flat();

  assert.match(message.text, /<b>реферальная программа<\/b>/);
  assert.match(message.text, /до 40% деньгами/);
  assert.match(message.text, /25% метакоинами/);
  assert.match(message.text, /по правилам своего уровня/u);
  assert.doesNotMatch(message.text, /партнёрской базы после/u);
  assert.doesNotMatch(message.text, /сентябр|2026|срок действия/i);
  assert.match(message.text, /ref_ivan_K7m4Q2x9Qa12/);
  assert.equal(message.parse_mode, 'HTML');
  assert.equal(message.link_preview_options.is_disabled, true);
  assert.ok(buttons.some((button) => button.callback_data === 'ref:people'));
  assert.ok(buttons.some((button) => button.callback_data === 'ref:earnings'));
  assert.ok(buttons.some((button) => button.callback_data === 'ref:levels'));
  assert.ok(buttons.some((button) => button.callback_data === 'ref:levels' && button.text === 'уровни реферала'));
  assert.ok(buttons.some((button) => button.callback_data === 'ref:withdraw'));
  assert.ok(buttons.some((button) => button.callback_data === 'task:profile'));
});

test('levels screen contains only the approved names and percentages', () => {
  const message = buildReferralLevelsMessage(account);

  assert.match(message.text, /классика · 25%/);
  assert.match(message.text, /серебро · 30%/);
  assert.match(message.text, /золото · 35%/);
  assert.match(message.text, /платина · 40%/);
  assert.doesNotMatch(message.text, /сентябр|2026|срок/i);
  assert.doesNotMatch(message.text, /<b>(?:Старт|Цветение|Партнёр)\s*·/i);
  assert.match(message.text, /достигнутый уровень сохраняется/u);
  assert.doesNotMatch(message.text, /комисси|резерв|остаётся не менее 30%|части дохода/u);
});

test('partner onboarding is one clear journey for supported business statuses', () => {
  const message = buildPartnerOnboardingMessage({ offerAccepted: false, profile: null });
  const buttons = message.reply_markup.inline_keyboard.flat();

  assert.match(message.text, /один раз/u);
  assert.match(message.text, /самозанятый, ИП или организация/u);
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'ref:onboarding:offer'));
  assert.doesNotMatch(message.text, /номер карты|паспорт/u);
});

test('offer acceptance card records an explicit acceptance and links the full document', () => {
  const message = buildPartnerOfferMessage({
    offerVersion: 'partner-program-2026-08-14',
    offerUrl: 'https://legal.metaflora.ru/referral-offer'
  });
  const buttons = message.reply_markup.inline_keyboard.flat();

  assert.match(message.text, /информационно-маркетинговые услуги/u);
  assert.match(message.text, /<b>версия:<\/b> <code>partner-program-2026-08-14<\/code>/u);
  assert.ok(buttons.some(({ url }) => url === 'https://legal.metaflora.ru/referral-offer'));
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'ref:onboarding:offer:accept:partner-program-2026-08-14'));
});

test('withdrawal sends an eligible but not onboarded partner to setup first', () => {
  const message = buildReferralWithdrawalMessage({
    ...account,
    availableKopecks: 150_000,
    partnerOnboarding: { payoutEnabled: false }
  });
  const buttons = message.reply_markup.inline_keyboard.flat();

  assert.match(message.text, /оформление выплат/u);
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'ref:onboarding'));
  assert.equal(buttons.some(({ callback_data }) => callback_data === 'ref:withdraw:start'), false);
});

test('withdrawal screen enforces the approved 1000 ruble threshold', () => {
  const message = buildReferralWithdrawalMessage(account);

  assert.match(message.text, /минимальная сумма: <b>1 000 ₽<\/b>/);
  assert.match(message.text, /осталось заработать <b>1 000 ₽<\/b>/);
  assert.equal(message.reply_markup.inline_keyboard.flat()
    .some((button) => button.callback_data === 'ref:withdraw:start'), false);
});

test('withdrawal asks for a payout method before collecting its details', () => {
  const message = buildWithdrawalMethodPrompt(150_000);
  const buttons = message.reply_markup.inline_keyboard.flat();

  assert.match(message.text, /выбери способ выплаты/u);
  assert.ok(buttons.some(({ text, callback_data }) => text === 'СБП' && callback_data === 'ref:withdraw:method:sbp'));
  assert.equal(buttons.some(({ callback_data }) => callback_data === 'ref:withdraw:method:bank_card'), false);

  assert.match(buildWithdrawalDestinationPrompt(150_000, 'sbp').text, /телефон.*СБП/u);
  assert.match(buildWithdrawalDestinationPrompt(150_000, 'bank_card').text, /номер российской банковской карты/u);
  assert.doesNotMatch(buildWithdrawalDestinationPrompt(150_000, 'sbp').text, /USDT|крипт/u);
});

test('secure payout prompt sends the user to one short T-Business setup link', () => {
  const message = buildWithdrawalDestinationPrompt(
    150_000,
    'bank_card',
    'https://bot.example/payout/setup/AbCdEf1234567890'
  );
  const button = message.reply_markup.inline_keyboard.flat()
    .find(({ url }) => url);

  assert.equal(button.text, 'указать реквизиты');
  assert.equal(button.url, 'https://bot.example/payout/setup/AbCdEf1234567890');
  assert.match(message.text, /защищённой форме Т-Бизнеса/u);
  assert.doesNotMatch(message.text, /YooKassa|ЮKassa/u);
});

test('owner payout card contains the destination and explicit processing actions', () => {
  const message = buildWithdrawalOwnerMessage({
    withdrawal: {
      withdrawalId: 'withdrawal_12345678',
      telegramId: '10',
      amountKopecks: 100_000,
      destination: '<phone>',
      method: 'sbp',
      status: 'pending',
      username: 'inviter',
      firstName: 'Иван'
    }
  });
  const buttons = message.reply_markup.inline_keyboard.flat();

  assert.match(message.text, /новая заявка на выплату/);
  assert.match(message.text, /1 000 ₽/);
  assert.match(message.text, /Т-Бизнес/);
  assert.match(message.text, /СБП/);
  assert.match(message.text, /&lt;phone&gt;/);
  assert.ok(buttons.some(({ callback_data }) => callback_data === 'refadmin:reconcile:withdrawal_12345678'));
  assert.equal(buttons.some(({ callback_data }) => callback_data === 'refadmin:paid:withdrawal_12345678'), false);
});
