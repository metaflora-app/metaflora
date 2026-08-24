import {
  AI_AGENT_COUNT,
  AI_TOOL_COUNT,
  MODEL_CATALOG_COUNT
} from './catalog-counts.js';

const plan = (id, name, priceKopecks, metacoins, features) => Object.freeze({
  id,
  name,
  priceKopecks,
  metacoins,
  features: Object.freeze(features)
});

const coinPackage = (id, metacoins, priceKopecks, audience) => Object.freeze({
  id,
  metacoins,
  priceKopecks,
  audience
});

export const SUBSCRIPTION_PLANS = Object.freeze([
  plan('newcomer', 'новичок', 0, 0, [
    'бесплатный старт: 50 текстовых запросов в неделю через gpt-oss-20b, Nemotron 3 Ultra, Nemotron 3 Super, Gemma 4 31B, North Mini Code и Nemotron 3 Nano Omni, 20 запросов через GPT-5.6 Luna и 2 генерации через GPT Image 2',
    '2 генерации в неделю через Nano Banana 2',
    '1 генерация в неделю через ElevenLabs Music',
    '5 озвучек в неделю через ElevenLabs Voice'
  ]),
  plan('amateur', 'любитель', 74_900, 130, [
    'метакоины: 130 на каждый месяц',
    `${MODEL_CATALOG_COUNT} моделей: Seedance 2.5, GPT-5.6, Claude Opus 5, Nano Banana Pro и другие`,
    `${AI_TOOL_COUNT} ИИ-инструмента: удаление фона, восстановление фото, синхронизация губ, разбор документов и другие`,
    `${AI_AGENT_COUNT} ИИ-агентов: ИИ-юрист, копирайтер, разработчик, исследователь и другие`,
    'обновления: новые возможности агрегатора появляются раньше',
    'поддержка: персональный менеджер поможет с выбором и задачей'
  ]),
  plan('author', 'автор', 149_000, 300, [
    'метакоины: 300 на каждый месяц',
    `${MODEL_CATALOG_COUNT} моделей: Seedance 2.5, GPT-5.6, Claude Opus 5, Nano Banana Pro и другие`,
    `${AI_TOOL_COUNT} ИИ-инструмента: удаление фона, восстановление фото, синхронизация губ, разбор документов и другие`,
    `${AI_AGENT_COUNT} ИИ-агентов: ИИ-юрист, копирайтер, разработчик, исследователь и другие`,
    'обновления: новые возможности агрегатора появляются раньше',
    'поддержка: персональный менеджер поможет с выбором и задачей'
  ]),
  plan('researcher', 'исследователь', 249_000, 850, [
    'метакоины: 850 на каждый месяц',
    `${MODEL_CATALOG_COUNT} моделей: Seedance 2.5, GPT-5.6, Claude Opus 5, Nano Banana Pro и другие`,
    `${AI_TOOL_COUNT} ИИ-инструмента: удаление фона, восстановление фото, синхронизация губ, разбор документов и другие`,
    `${AI_AGENT_COUNT} ИИ-агентов: ИИ-юрист, копирайтер, разработчик, исследователь и другие`,
    'обновления: новые возможности агрегатора появляются раньше',
    'поддержка: персональный менеджер поможет с выбором и задачей'
  ]),
  plan('expert', 'эксперт', 399_000, 1_300, [
    'метакоины: 1 300 на каждый месяц',
    `${MODEL_CATALOG_COUNT} моделей: Seedance 2.5, GPT-5.6, Claude Opus 5, Nano Banana Pro и другие`,
    `${AI_TOOL_COUNT} ИИ-инструмента: удаление фона, восстановление фото, синхронизация губ, разбор документов и другие`,
    `${AI_AGENT_COUNT} ИИ-агентов: ИИ-юрист, копирайтер, разработчик, исследователь и другие`,
    'обновления: новые возможности агрегатора появляются раньше',
    'поддержка: персональный менеджер поможет с выбором и задачей'
  ])
]);

export const METACOIN_PACKAGES = Object.freeze([
  coinPackage('coins_150', 150, 54_900, 'на серию текстов, изображений и работу с парой ИИ-агентов'),
  coinPackage('coins_400', 400, 129_000, 'запас на неделю контента, файлов и обычных рабочих задач'),
  coinPackage('coins_1000', 1_000, 299_000, 'когда генерации идут каждый день и баланс нужен без постоянных пополнений'),
  coinPackage('coins_2500', 2_500, 699_000, 'для команды, потока роликов или большого объёма клиентской работы')
]);

const planById = new Map(SUBSCRIPTION_PLANS.map((item) => [item.id, item]));
const packageById = new Map(METACOIN_PACKAGES.map((item) => [item.id, item]));

export function getPurchasableSubscriptionPlans() {
  return SUBSCRIPTION_PLANS;
}

export function getSubscriptionPlan(id) {
  return planById.get(id) ?? null;
}

export function getMetacoinPackage(id) {
  return packageById.get(id) ?? null;
}

export function isPaidSubscriptionActive(account = {}, at = new Date()) {
  const plan = getSubscriptionPlan(account?.subscriptionPlanId);
  if (!plan || plan.priceKopecks === 0) return false;
  const expiration = new Date(account?.subscriptionExpiresAt ?? NaN);
  const timestamp = new Date(at);
  return Number.isFinite(expiration.valueOf())
    && Number.isFinite(timestamp.valueOf())
    && expiration.valueOf() > timestamp.valueOf();
}

export function getSubscriptionOffer(planId, months = 1) {
  const selectedPlan = getSubscriptionPlan(planId);
  if (!selectedPlan || selectedPlan.priceKopecks === 0) return null;
  if (![1, 3].includes(months)) throw new TypeError('Unsupported subscription duration.');
  if (months === 1) {
    return Object.freeze({
      planId: selectedPlan.id,
      months: 1,
      durationDays: 30,
      priceKopecks: selectedPlan.priceKopecks,
      metacoins: selectedPlan.metacoins,
      discountPercent: 0,
      bonusPercent: 0
    });
  }
  return Object.freeze({
    planId: selectedPlan.id,
    months: 3,
    durationDays: 90,
    priceKopecks: Math.round((selectedPlan.priceKopecks * 3 * 0.85) / 100) * 100,
    metacoins: selectedPlan.metacoins * 3,
    discountPercent: 15,
    bonusPercent: 0
  });
}

export function formatRubles(kopecks) {
  if (!Number.isSafeInteger(kopecks) || kopecks < 0) throw new TypeError('Invalid amount.');
  return `${Math.round(kopecks / 100).toLocaleString('ru-RU')} ₽`;
}

export function calculatePlanUpgrade({
  currentPlanId,
  targetPlanId,
  remainingPlanMetacoins = 0,
  currentSubscriptionMetacoinsTotal,
  currentSubscriptionPriceKopecks,
  currentDurationMonths,
  targetDurationMonths
}) {
  const current = getSubscriptionPlan(currentPlanId) ?? getSubscriptionPlan('newcomer');
  const target = getSubscriptionPlan(targetPlanId);
  if (!target) throw new Error('Unknown target plan.');
  if (target.priceKopecks <= current.priceKopecks) throw new Error('Target must be a higher plan.');
  if (!Number.isSafeInteger(remainingPlanMetacoins) || remainingPlanMetacoins < 0) {
    throw new TypeError('Invalid remaining metacoins.');
  }

  const inferredCurrentDuration = currentDurationMonths
    ?? (currentSubscriptionMetacoinsTotal > current.metacoins ? 3 : 1);
  const selectedTargetDuration = targetDurationMonths ?? inferredCurrentDuration;
  if (![1, 3].includes(inferredCurrentDuration) || ![1, 3].includes(selectedTargetDuration)) {
    throw new TypeError('Invalid upgrade billing period.');
  }
  if (inferredCurrentDuration !== selectedTargetDuration) {
    throw new Error('An upgrade must preserve the current billing period.');
  }
  const currentOffer = current.priceKopecks === 0
    ? { metacoins: 0, priceKopecks: 0 }
    : getSubscriptionOffer(current.id, inferredCurrentDuration);
  const targetOffer = getSubscriptionOffer(target.id, selectedTargetDuration);
  const purchasedMetacoins = currentSubscriptionMetacoinsTotal ?? currentOffer.metacoins;
  const paidKopecks = currentSubscriptionPriceKopecks ?? currentOffer.priceKopecks;
  if (!Number.isSafeInteger(purchasedMetacoins) || purchasedMetacoins < 0) {
    throw new TypeError('Invalid subscription metacoin total.');
  }
  if (!Number.isSafeInteger(paidKopecks) || paidKopecks < 0) {
    throw new TypeError('Invalid subscription price.');
  }

  const eligibleMetacoins = Math.min(remainingPlanMetacoins, purchasedMetacoins);
  const creditKopecks = purchasedMetacoins > 0
    ? Math.round((eligibleMetacoins / purchasedMetacoins) * paidKopecks / 100) * 100
    : 0;
  return Object.freeze({
    currentPlanId: current.id,
    targetPlanId: target.id,
    creditKopecks,
    amountKopecks: Math.max(1, targetOffer.priceKopecks - creditKopecks),
    targetMetacoins: targetOffer.metacoins,
    metacoinsGranted: Math.max(0, targetOffer.metacoins - eligibleMetacoins),
    remainingPlanMetacoins: eligibleMetacoins,
    durationMonths: selectedTargetDuration
  });
}
