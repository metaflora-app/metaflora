import { MINIMUM_WITHDRAWAL_KOPECKS, REFERRAL_LEVELS } from './referral-program.js';

function rubles(kopecks) {
  const value = Number.isSafeInteger(kopecks) ? kopecks : 0;
  const amount = value / 100;
  return `${new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(amount).replace(/[\u00a0\u202f]/g, ' ')} ₽`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function safeHttpsUrl(value) {
  const source = String(value ?? '').trim();
  return /^https:\/\/[^\s<>]+$/u.test(source) ? source : '';
}

function referralNavigation() {
  return [
    [{ text: '👤 профиль', callback_data: 'task:profile' }],
    [
      { text: '‹ назад', callback_data: 'ref:home' },
      { text: '🏠 главное меню', callback_data: 'task:menu' }
    ]
  ];
}

function accountButtons(account) {
  const shareText = 'попробуй МЕТАФЛОРА* нейро: тебе начислят +25% метакоинами к первому пополнению';
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(account.referralUrl)}&text=${encodeURIComponent(shareText)}`;
  return [
    [{ text: '👥 поделиться ссылкой', url: shareUrl }],
    [
      { text: 'мои рефералы', callback_data: 'ref:people' },
      { text: 'начисления', callback_data: 'ref:earnings' }
    ],
    [{ text: 'уровни реферала', callback_data: 'ref:levels' }],
    [{ text: 'условия выплат', callback_data: 'ref:onboarding' }],
    [{ text: 'вывести средства', callback_data: 'ref:withdraw' }],
    [{ text: '👤 профиль', callback_data: 'task:profile' }],
    [
      { text: '‹ назад', callback_data: 'task:profile' },
      { text: '🏠 главное меню', callback_data: 'task:menu' }
    ]
  ];
}

export function buildReferralAccountMessage(account) {
  const levelProgress = account.level.next
    ? `<b>до уровня «${account.level.next.name}»:</b> осталось ${account.level.next.remaining} оплативших реферала`
    : '<b>достигнут максимальный уровень программы</b>';
  const boostLine = account.availableBoosts > 0
    ? `\n<b>бонусов +25% к пополнению:</b> ${account.availableBoosts}`
    : '';
  return {
    text: `👥 <b>реферальная программа</b>\n\nприглашай друзей, коллег и подписчиков в МЕТАФЛОРА* нейро и получай <b>до 40% деньгами</b> по правилам своего уровня.\n\nпосле первого пополнения друг получит <b>ещё 25% метакоинами</b>. тебе откроется такой же бонус к следующему пополнению собственного баланса. ограничений по сумме пополнения нет.\n\n<b>твой уровень:</b> ${account.level.name} · ${account.level.percent}%\n${levelProgress}${boostLine}\n\n<b>твоя ссылка:</b>\n${escapeHtml(account.referralUrl)}\n\n<b>приглашено:</b> ${account.invited}\n<b>пополнили баланс:</b> ${account.paidReferrals}\n<b>оборот рефералов:</b> ${rubles(account.referralTurnoverKopecks)}\n\n<b>доступно к выводу:</b> ${rubles(account.availableKopecks)}\n<b>в обработке:</b> ${rubles(account.pendingKopecks)}\n<b>заработано за всё время:</b> ${rubles(account.lifetimeKopecks)}`,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: accountButtons(account) }
  };
}

export function buildReferralLevelsMessage(account) {
  const levels = REFERRAL_LEVELS.map(({ name, minimumPaidReferrals, percent }, index) => {
    const condition = index === 0
      ? 'доступна сразу после регистрации.'
      : `от ${minimumPaidReferrals} оплативших рефералов.`;
    return `<b>${name} · ${percent}%</b>\n${condition}`;
  }).join('\n\n');
  return {
    text: `🏆 <b>уровни реферальной программы</b>\n\nуровень зависит от количества приглашённых пользователей, которые хотя бы один раз пополнили баланс.\n\n${levels}\n\n<b>сейчас у тебя:</b> ${account.level.name} · ${account.level.percent}%\n\nдостигнутый уровень сохраняется. точная сумма каждого начисления видна в разделе «начисления».`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: referralNavigation() }
  };
}

export function buildReferralPeopleMessage(account, referrals) {
  const rows = referrals.length === 0
    ? 'ты пока никого не пригласил. отправь свою ссылку другу, коллеге или подписчику.'
    : referrals.map((referral) => {
        const name = referral.username
          ? `@${escapeHtml(referral.username)}`
          : escapeHtml(referral.firstName || `пользователь ${referral.telegramId}`);
        const paymentDate = referral.firstPaymentAt
          ? new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(new Date(referral.firstPaymentAt))
          : null;
        const status = paymentDate ? `оплатил · ${paymentDate}` : 'ещё не оплачивал';
        return `<b>${name}</b>\nстатус: ${status}\nпокупки: ${rubles(referral.turnoverKopecks)}`;
      }).join('\n\n');
  return {
    text: `👥 <b>мои рефералы</b>\n\n<b>всего приглашено:</b> ${account.invited}\n<b>пополнили баланс:</b> ${account.paidReferrals}\n<b>ещё не пополняли:</b> ${Math.max(0, account.invited - account.paidReferrals)}\n\n${rows}`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: referralNavigation() }
  };
}

export function buildReferralEarningsMessage(account, earnings) {
  const rows = earnings.length === 0
    ? 'начислений пока нет.'
    : earnings.map((earning) => {
        const name = earning.username ? `@${escapeHtml(earning.username)}` : escapeHtml(earning.firstName);
        const status = earning.status === 'available'
          ? 'доступно'
          : earning.status === 'pending'
            ? 'в обработке'
            : earning.status === 'paid'
              ? 'выплачено'
              : 'отменено';
        const bonus = Number(earning.inviteeBonusMetacoins ?? 0) > 0
          ? `\nбонус приглашённому: +${Number(earning.inviteeBonusMetacoins).toLocaleString('ru-RU')} метакоинов`
          : '';
        const inviterBoost = earning.inviterBoostCreated
          ? '\nтвой бонус: +25% метакоинами к следующему пополнению'
          : '';
        return `<b>${rubles(earning.amountKopecks)}</b>\nреферал: ${name || 'пользователь'}\nпокупка: ${rubles(earning.paymentAmountKopecks)}\nуровень: ${escapeHtml(earning.levelName ?? account.level.name)} · ${earning.percent}%\nстатус: ${status}${bonus}${inviterBoost}`;
      }).join('\n\n');
  return {
    text: `💳 <b>начисления</b>\n\n<b>доступно к выводу:</b> ${rubles(account.availableKopecks)}\n<b>в обработке:</b> ${rubles(account.pendingKopecks)}\n<b>заработано за всё время:</b> ${rubles(account.lifetimeKopecks)}\n\nвознаграждение появляется в обработке после платежа реферала. после проверки оплаты и окончания периода возврата деньги становятся доступны для вывода.\n\n${rows}`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: referralNavigation() }
  };
}

export function buildReferralWithdrawalMessage(account) {
  if (account.availableKopecks < MINIMUM_WITHDRAWAL_KOPECKS) {
    const missing = MINIMUM_WITHDRAWAL_KOPECKS - account.availableKopecks;
    return {
      text: `💸 <b>пока недостаточно для вывода</b>\n\nна партнёрском балансе: <b>${rubles(account.availableKopecks)}</b>\nминимальная сумма: <b>1 000 ₽</b>\n\nосталось заработать <b>${rubles(missing)}</b>.`,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: referralNavigation() }
    };
  }
  if (account.partnerOnboarding && account.partnerOnboarding.payoutEnabled !== true) {
    return {
      text: `💸 <b>оформление выплат</b>\n\nна партнёрском балансе: <b>${rubles(account.availableKopecks)}</b>\n\nперед первым выводом один раз прими условия программы и укажи статус получателя. после проверки следующие выплаты можно оформлять без повторной регистрации.`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'оформить выплаты', callback_data: 'ref:onboarding' }],
          ...referralNavigation()
        ]
      }
    };
  }
  return {
    text: `💸 <b>вывод средств</b>\n\n<b>доступно:</b> ${rubles(account.availableKopecks)}\n<b>минимальная сумма:</b> 1 000 ₽\n\nнажми кнопку ниже, затем отправь сумму вывода одним сообщением.`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'оформить вывод', callback_data: 'ref:withdraw:start' }],
        ...referralNavigation()
      ]
    }
  };
}

export function buildPartnerOnboardingMessage(onboarding = {}) {
  const offerAccepted = onboarding.offerAccepted === true;
  const profile = onboarding.profile ?? null;
  const offerStatus = offerAccepted ? '✅ принято' : 'не принято';
  const profileStatus = profile?.legalStatus
    ? `✅ ${profile.legalStatus === 'self_employed' ? 'самозанятый' : profile.legalStatus === 'ip' ? 'ИП' : 'организация'}`
    : 'не указан';
  const nextButton = offerAccepted
    ? [{ text: 'указать статус', callback_data: 'ref:onboarding:status' }]
    : [{ text: 'прочитать и принять оферту', callback_data: 'ref:onboarding:offer' }];
  return {
    text: `💼 <b>оформление партнёрских выплат</b>\n\nэто нужно пройти один раз перед первым выводом. выбери, кто получает выплату: самозанятый, ИП или организация. бумажные документы подписывать не нужно.\n\n<b>оферта:</b> ${offerStatus}\n<b>статус получателя:</b> ${profileStatus}\n\nначисления продолжают копиться, пока оформление не завершено.`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [nextButton, ...referralNavigation()] }
  };
}

export function buildPartnerOfferMessage({ offerVersion, offerUrl } = {}) {
  const version = String(offerVersion ?? '').trim();
  if (!/^[a-z0-9][a-z0-9._-]{0,31}$/u.test(version)) throw new TypeError('Invalid partner offer version.');
  const url = safeHttpsUrl(offerUrl);
  if (!url) throw new TypeError('Invalid partner offer URL.');
  return {
    text: `📄 <b>партнёрская оферта</b>\n\nты размещаешь информацию о МЕТАФЛОРА* нейро и получаешь вознаграждение за покупки приглашённых пользователей. это оферта на информационно-маркетинговые услуги.\n\nсначала открой полную версию документа. после этого вернись сюда и нажми «принимаю условия». без зафиксированного открытия продолжить оформление нельзя.\n\n<b>версия:</b> <code>${escapeHtml(version)}</code>`,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup: {
      inline_keyboard: [
        [{ text: 'открыть и прочитать оферту ↗', url }],
        [{ text: 'принимаю условия', callback_data: `ref:onboarding:offer:accept:${version}` }],
        ...referralNavigation()
      ]
    }
  };
}

export function buildPartnerStatusMessage() {
  return {
    text: `💼 <b>статус получателя</b>\n\nвыбери статус, на который будут оформляться партнёрские выплаты:`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'самозанятый', callback_data: 'ref:onboarding:status:self_employed' }],
        [{ text: 'ИП', callback_data: 'ref:onboarding:status:ip' }],
        [{ text: 'организация', callback_data: 'ref:onboarding:status:legal_entity' }],
        ...referralNavigation()
      ]
    }
  };
}

export function buildWithdrawalAmountPrompt(account) {
  return {
    text: `💸 <b>сумма вывода</b>\n\nдоступно: <b>${rubles(account.availableKopecks)}</b>\nминимум: <b>1 000 ₽</b>\n\nотправь сумму в рублях одним сообщением, например <b>1500</b>.`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: referralNavigation() }
  };
}

export function buildWithdrawalMethodPrompt(amountKopecks, { bankCardEnabled = false } = {}) {
  return {
    text: `💸 <b>способ выплаты</b>\n\nсумма: <b>${rubles(amountKopecks)}</b>\n\nвыбери способ выплаты:`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'СБП', callback_data: 'ref:withdraw:method:sbp' }],
        ...(bankCardEnabled
          ? [[{ text: 'банковская карта', callback_data: 'ref:withdraw:method:bank_card' }]]
          : []),
        ...referralNavigation()
      ]
    }
  };
}

function payoutMethodLabel(method) {
  return method === 'bank_card' ? 'российская банковская карта' : 'СБП';
}

export function buildWithdrawalDestinationPrompt(amountKopecks, method = 'sbp', setupUrl = '') {
  const normalizedMethod = method === 'bank_card' ? 'bank_card' : 'sbp';
  const safeSetupUrl = typeof setupUrl === 'string' && /^https:\/\/[^\s]+$/u.test(setupUrl)
    ? setupUrl
    : '';
  if (safeSetupUrl) {
    return {
      text: `💸 <b>реквизиты для вывода</b>\n\nспособ: <b>${payoutMethodLabel(normalizedMethod)}</b>\nсумма: <b>${rubles(amountKopecks)}</b>\n\nнажми кнопку ниже и укажи реквизиты в защищённой форме Т-Бизнеса. бот не получает полный номер карты или счёта.`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'указать реквизиты', url: safeSetupUrl }],
          ...referralNavigation()
        ]
      }
    };
  }
  const destinationHint = normalizedMethod === 'bank_card'
    ? 'отправь номер российской банковской карты одним сообщением.'
    : 'отправь номер телефона, привязанный к СБП, одним сообщением.';
  return {
    text: `💸 <b>реквизиты для вывода</b>\n\nспособ: <b>${payoutMethodLabel(normalizedMethod)}</b>\nсумма: <b>${rubles(amountKopecks)}</b>\n\n${destinationHint}`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: referralNavigation() }
  };
}

export function buildWithdrawalCreatedMessage(amountKopecks) {
  return {
    text: `✅ <b>заявка на вывод создана</b>\n\nсумма: <b>${rubles(amountKopecks)}</b>\n\nзаявка появилась в кабинете и передана в очередь выплат Т-Бизнеса. бот сообщит, когда банк подтвердит результат.`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: referralNavigation() }
  };
}

export function buildWithdrawalOwnerMessage({ withdrawal } = {}) {
  const user = withdrawal?.username
    ? `@${escapeHtml(withdrawal.username)}`
    : escapeHtml(withdrawal?.firstName || `пользователь ${withdrawal?.telegramId ?? ''}`);
  const withdrawalId = escapeHtml(withdrawal?.withdrawalId);
  return {
    text: `💸 <b>новая заявка на выплату</b>\n\n<b>заявка:</b> <code>${withdrawalId}</code>\n<b>пользователь:</b> ${user} · <code>${escapeHtml(withdrawal?.telegramId)}</code>\n<b>провайдер:</b> Т-Бизнес\n<b>способ:</b> ${payoutMethodLabel(withdrawal?.method)}\n<b>сумма:</b> <b>${rubles(withdrawal?.amountKopecks)}</b>\n<b>реквизиты:</b> <code>${escapeHtml(withdrawal?.destinationHint ?? withdrawal?.destination ?? 'скрыто')}</code>\n\nзаявка обрабатывается автоматически. ручная сверка не меняет статус без подтверждения и внешнего идентификатора банка.`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔄 сверить с банком', callback_data: `refadmin:reconcile:${withdrawal?.withdrawalId}` }]
      ]
    }
  };
}
