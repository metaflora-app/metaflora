import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildLegalConsentMessage,
  buildLegalConsentSuccessMessage,
  isLegalConsentComplete,
  missingLegalConsents
} from '../src/legal-consent.js';

const urls = Object.freeze({
  personalData: 'https://legal.example/soglasie',
  agreement: 'https://legal.example/soglashenie',
  privacy: 'https://legal.example/politika',
  rules: 'https://legal.example/pravila'
});

test('legal gate requires terms and personal-data consent independently', () => {
  assert.equal(isLegalConsentComplete(null), false);
  assert.deepEqual(missingLegalConsents(null), ['terms', 'personal_data']);
  assert.deepEqual(
    missingLegalConsents({ termsAccepted: true, personalDataAccepted: false }),
    ['personal_data']
  );
  assert.equal(
    isLegalConsentComplete({ termsAccepted: true, personalDataAccepted: true }),
    true
  );
});

test('legal card contains four documents and two stateful acceptance buttons', () => {
  const message = buildLegalConsentMessage({
    status: { termsAccepted: true, personalDataAccepted: false },
    urls
  });
  assert.equal(message.parse_mode, 'HTML');
  for (const url of Object.values(urls)) {
    assert.match(message.text, new RegExp(`<b><a href="${url}">`));
  }
  const buttons = message.reply_markup.inline_keyboard.flat();
  assert.ok(buttons.some(({ text, callback_data }) => (
    text.startsWith('✅') && callback_data === 'legal:accept:terms'
  )));
  assert.ok(buttons.some(({ text, callback_data }) => (
    text.startsWith('☑️') && callback_data === 'legal:accept:personal_data'
  )));
  assert.match(
    message.text,
    /<b>чтобы продолжить, осталось дать согласие на обработку персональных данных\.<\/b>$/
  );
  assert.doesNotMatch(message.text, /Supstant/u);
});

test('legal card names only the missing acceptance after one item is accepted', () => {
  const message = buildLegalConsentMessage({
    status: { termsAccepted: false, personalDataAccepted: true },
    urls
  });
  assert.match(message.text, /чтобы продолжить, осталось принять условия/u);
  assert.doesNotMatch(message.text, /осталось дать согласие на обработку персональных данных/u);
});

test('legal card keeps a storage failure visible without moving the final instruction', () => {
  const message = buildLegalConsentMessage({
    status: { termsAccepted: false, personalDataAccepted: false },
    urls,
    notice: 'не получилось сохранить отметку. попробуй нажать ещё раз.'
  });

  assert.match(message.text, /<blockquote>не получилось сохранить отметку/u);
  assert.match(message.text, /<b>чтобы продолжить, подтверди оба пункта по отдельности\.<\/b>$/u);
});

test('legal success card is a short emoji-free thank-you without navigation promises', () => {
  const message = buildLegalConsentSuccessMessage();

  assert.match(message.text, /^<b>теперь все готово<\/b>/u);
  assert.match(message.text, /теперь можно пользоваться всеми возможностями агрегатора/u);
  assert.doesNotMatch(message.text, /[✅☑️📄]|главное меню|автоматически/u);
  assert.equal(message.reply_markup, undefined);
});
