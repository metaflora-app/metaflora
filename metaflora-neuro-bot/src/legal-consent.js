export const LEGAL_DOCUMENT_VERSION = '2026-07-27';

export const DEFAULT_LEGAL_URLS = Object.freeze({
  personalData: 'https://legal.metaflora.ru/soglasie',
  agreement: 'https://legal.metaflora.ru/soglashenie',
  privacy: 'https://legal.metaflora.ru/politika',
  rules: 'https://legal.metaflora.ru/pravila'
});

function safeUrl(value, fallback) {
  try {
    const url = new URL(String(value ?? fallback));
    return url.protocol === 'https:' ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function normalizedUrls(urls = {}) {
  return Object.freeze({
    personalData: safeUrl(urls.personalData, DEFAULT_LEGAL_URLS.personalData),
    agreement: safeUrl(urls.agreement, DEFAULT_LEGAL_URLS.agreement),
    privacy: safeUrl(urls.privacy, DEFAULT_LEGAL_URLS.privacy),
    rules: safeUrl(urls.rules, DEFAULT_LEGAL_URLS.rules)
  });
}

export function missingLegalConsents(status) {
  return Object.freeze([
    ...(status?.termsAccepted ? [] : ['terms']),
    ...(status?.personalDataAccepted ? [] : ['personal_data'])
  ]);
}

export function isLegalConsentComplete(status) {
  return missingLegalConsents(status).length === 0;
}

function remainingText(status) {
  const missing = missingLegalConsents(status);
  if (missing.length === 2) return 'чтобы продолжить, подтверди оба пункта по отдельности.';
  if (missing[0] === 'terms') return 'чтобы продолжить, осталось принять условия сервиса.';
  if (missing[0] === 'personal_data') {
    return 'чтобы продолжить, осталось дать согласие на обработку персональных данных.';
  }
  return 'оба пункта подтверждены.';
}

export function buildLegalConsentMessage({ status = null, urls = {}, notice = '' } = {}) {
  const links = normalizedUrls(urls);
  const termsAccepted = Boolean(status?.termsAccepted);
  const personalDataAccepted = Boolean(status?.personalDataAccepted);
  const safeNotice = String(notice ?? '').trim().slice(0, 300);
  return Object.freeze({
    text: [
      '📄 <b>перед началом</b>',
      '',
      'ознакомься с документами МЕТАФЛОРА* нейро:',
      '',
      `• <b><a href="${links.agreement}">пользовательское соглашение</a></b>`,
      `• <b><a href="${links.rules}">правила сервиса</a></b>`,
      `• <b><a href="${links.privacy}">политика конфиденциальности</a></b>`,
      `• <b><a href="${links.personalData}">согласие на обработку персональных данных</a></b>`,
      '',
      'первой кнопкой ты подтверждаешь, что тебе исполнилось 18 лет, и принимаешь соглашение, правила и политику. второй — отдельно даёшь согласие на обработку персональных данных.',
      ...(safeNotice ? ['', `<blockquote>${escapeHtml(safeNotice)}</blockquote>`] : []),
      '',
      `<b>${remainingText(status)}</b>`
    ].join('\n'),
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: {
      inline_keyboard: [
        [{
          text: `${termsAccepted ? '✅' : '☑️'} принимаю условия`,
          callback_data: 'legal:accept:terms'
        }],
        [{
          text: `${personalDataAccepted ? '✅' : '☑️'} согласен на обработку данных`,
          callback_data: 'legal:accept:personal_data'
        }]
      ]
    }
  });
}

export function buildLegalConsentSuccessMessage() {
  return Object.freeze({
    text: [
      '<b>теперь все готово</b>',
      '',
      'согласия сохранены. теперь можно пользоваться всеми возможностями агрегатора.'
    ].join('\n'),
    parse_mode: 'HTML'
  });
}
