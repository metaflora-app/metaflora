import test from 'node:test';
import assert from 'node:assert/strict';

import {
  METACOIN_PACKAGES,
  SUBSCRIPTION_PLANS,
  calculatePlanUpgrade,
  getMetacoinPackage,
  getPurchasableSubscriptionPlans,
  getSubscriptionOffer,
  getSubscriptionPlan
} from '../src/billing-catalog.js';

test('every paid tariff advertises Seedance 2.5 first and never promotes Seedance 2.0', () => {
  for (const plan of SUBSCRIPTION_PLANS.filter((item) => item.priceKopecks > 0)) {
    const models = plan.features.find((feature) => /модел(?:ей|и):/i.test(feature));
    assert.match(models, /модел(?:ей|и): Seedance 2\.5,/i, plan.id);
    assert.doesNotMatch(models, /Seedance 2\.0/i, plan.id);
  }
});

test('subscription catalog keeps the public ladder and the approved ultimate test tariff', () => {
  assert.deepEqual(
    SUBSCRIPTION_PLANS.map(({ id, name, priceKopecks, metacoins }) => ({
      id,
      name,
      priceKopecks,
      metacoins
    })),
    [
      { id: 'newcomer', name: 'новичок', priceKopecks: 0, metacoins: 0 },
      { id: 'ultimate_test', name: 'ultimate тестовый', priceKopecks: 30_000, metacoins: 100 },
      { id: 'amateur', name: 'любитель', priceKopecks: 74_900, metacoins: 130 },
      { id: 'author', name: 'автор', priceKopecks: 149_000, metacoins: 300 },
      { id: 'researcher', name: 'исследователь', priceKopecks: 249_000, metacoins: 850 },
      { id: 'expert', name: 'эксперт', priceKopecks: 399_000, metacoins: 1_300 }
    ]
  );
  assert.ok(SUBSCRIPTION_PLANS.every(({ features }) => features.length >= 4));
  for (const item of SUBSCRIPTION_PLANS.filter(({ priceKopecks }) => priceKopecks > 0)) {
    assert.ok(item.features.some((feature) => /42 ИИ-инструмента/u.test(feature)), item.id);
    assert.ok(item.features.some((feature) => /50 ИИ-агентов/u.test(feature)), item.id);
    assert.ok(item.features.some((feature) => /и другие/i.test(feature)), item.id);
  }
});

test('newcomer groups free text and GPT Image 2 allowances without paid video', () => {
  const newcomer = getSubscriptionPlan('newcomer');
  const copy = newcomer.features.join('\n');

  assert.match(copy, /бесплатный старт:.*50 текстовых запросов.*GPT-5\.6 Luna.*2 генерации.*GPT Image 2/uis);
  assert.match(copy, /Terra|Luna/u);
  assert.doesNotMatch(copy, /\bSol\b/u);
  assert.match(copy, /2 генерации в неделю через Nano Banana 2/u);
  assert.doesNotMatch(copy, /Kling 3/u);
  assert.match(copy, /1 генерация в неделю через ElevenLabs Music/u);
  assert.match(copy, /5 озвучек в неделю через ElevenLabs Voice/u);
  assert.doesNotMatch(copy, /^(?:текст|модели|изображения|видео|музыка|озвучка):/mu);
  assert.doesNotMatch(copy, /ИИ-инструмент/u);
});

test('metacoin packages become cheaper per coin as the package grows', () => {
  assert.deepEqual(
    METACOIN_PACKAGES.map(({ id, priceKopecks, metacoins }) => ({ id, priceKopecks, metacoins })),
    [
      { id: 'coins_150', priceKopecks: 54_900, metacoins: 150 },
      { id: 'coins_400', priceKopecks: 129_000, metacoins: 400 },
      { id: 'coins_1000', priceKopecks: 299_000, metacoins: 1_000 },
      { id: 'coins_2500', priceKopecks: 699_000, metacoins: 2_500 }
    ]
  );

  const unitPrices = METACOIN_PACKAGES.map(({ priceKopecks, metacoins }) => priceKopecks / metacoins);
  assert.ok(unitPrices.every((price, index) => index === 0 || price < unitPrices[index - 1]));
});

test('the removed 50-metacoin package cannot be displayed or purchased', () => {
  assert.equal(getMetacoinPackage('coins_50'), null);
  assert.equal(METACOIN_PACKAGES.some(({ id }) => id === 'coins_50'), false);
});

test('upgrade deducts the value of unused subscription metacoins', () => {
  const quote = calculatePlanUpgrade({
    currentPlanId: 'amateur',
    targetPlanId: 'author',
    remainingPlanMetacoins: 110
  });

  assert.equal(quote.creditKopecks, 63_400);
  assert.equal(quote.amountKopecks, 85_600);
  assert.equal(quote.targetMetacoins, 300);
  assert.equal(quote.metacoinsGranted, 190);
});

test('upgrade credits the real remainder of a three-month subscription', () => {
  const quote = calculatePlanUpgrade({
    currentPlanId: 'author',
    targetPlanId: 'researcher',
    remainingPlanMetacoins: 750,
    currentSubscriptionMetacoinsTotal: 900,
    currentSubscriptionPriceKopecks: 191_000
  });

  assert.equal(quote.creditKopecks, 159_200);
  assert.equal(quote.amountKopecks, 475_800);
  assert.equal(quote.targetMetacoins, 2_550);
  assert.equal(quote.metacoinsGranted, 1_800);
});

test('upgrade preserves the billing period and can never create a zero checkout', () => {
  assert.throws(() => calculatePlanUpgrade({
    currentPlanId: 'amateur',
    targetPlanId: 'author',
    remainingPlanMetacoins: 390,
    currentSubscriptionMetacoinsTotal: 390,
    currentSubscriptionPriceKopecks: 191_000,
    currentDurationMonths: 3,
    targetDurationMonths: 1
  }), /billing period/i);

  const quarterly = calculatePlanUpgrade({
    currentPlanId: 'amateur',
    targetPlanId: 'author',
    remainingPlanMetacoins: 390,
    currentSubscriptionMetacoinsTotal: 390,
    currentSubscriptionPriceKopecks: 191_000,
    currentDurationMonths: 3,
    targetDurationMonths: 3
  });
  assert.equal(quarterly.targetMetacoins, 900);
  assert.equal(quarterly.metacoinsGranted, 510);
  assert.equal(quarterly.amountKopecks, 189_000);
  assert.ok(quarterly.amountKopecks > 0);
});

test('upgrade never spends package metacoins and rejects a downgrade', () => {
  assert.throws(() => calculatePlanUpgrade({
    currentPlanId: 'author',
    targetPlanId: 'amateur',
    remainingPlanMetacoins: 100
  }), /higher plan/i);

  assert.equal(getSubscriptionPlan('expert').name, 'эксперт');
  assert.equal(getMetacoinPackage('coins_400').metacoins, 400);
});

test('every supported paid-plan upgrade has one positive deterministic checkout amount', () => {
  const paidPlans = SUBSCRIPTION_PLANS.filter(({ priceKopecks }) => priceKopecks > 0);
  for (const months of [1, 3]) {
    for (let currentIndex = 0; currentIndex < paidPlans.length - 1; currentIndex += 1) {
      const current = paidPlans[currentIndex];
      const currentOffer = getSubscriptionOffer(current.id, months);
      if (!currentOffer) continue;
      for (const target of paidPlans.slice(currentIndex + 1)) {
        if (!getSubscriptionOffer(target.id, months)) continue;
        for (const remaining of [0, Math.floor(currentOffer.metacoins / 2), currentOffer.metacoins]) {
          const input = {
            currentPlanId: current.id,
            targetPlanId: target.id,
            remainingPlanMetacoins: remaining,
            currentSubscriptionMetacoinsTotal: currentOffer.metacoins,
            currentSubscriptionPriceKopecks: currentOffer.priceKopecks,
            currentDurationMonths: months,
            targetDurationMonths: months
          };
          const first = calculatePlanUpgrade(input);
          const second = calculatePlanUpgrade(input);
          assert.deepEqual(first, second, `${current.id}->${target.id}:${months}:${remaining}`);
          assert.ok(first.amountKopecks > 0, `${current.id}->${target.id}:${months}:${remaining}`);
          assert.equal(
            first.amountKopecks + first.creditKopecks,
            getSubscriptionOffer(target.id, months).priceKopecks,
            `${current.id}->${target.id}:${months}:${remaining}`
          );
        }
      }
    }
  }
});

test('three-month offers cost 15 percent less without inflating the metacoin grant', () => {
  assert.deepEqual(getSubscriptionOffer('amateur', 3), {
    planId: 'amateur',
    months: 3,
    durationDays: 90,
    priceKopecks: 191_000,
    metacoins: 390,
    discountPercent: 15,
    bonusPercent: 0
  });
  assert.deepEqual(getSubscriptionOffer('author', 3), {
    planId: 'author',
    months: 3,
    durationDays: 90,
    priceKopecks: 380_000,
    metacoins: 900,
    discountPercent: 15,
    bonusPercent: 0
  });
  assert.equal(getSubscriptionOffer('researcher', 3).priceKopecks, 635_000);
  assert.equal(getSubscriptionOffer('expert', 3).priceKopecks, 1_017_500);
});

test('metacoin package descriptions name concrete use instead of a repeated suitability template', () => {
  assert.ok(METACOIN_PACKAGES.every(({ audience }) => !/подойдёт, если/iu.test(audience)));
  assert.ok(new Set(METACOIN_PACKAGES.map(({ audience }) => audience)).size === METACOIN_PACKAGES.length);
});

test('removed legacy test tariff ids cannot be restored by the former environment flag', () => {
  const environment = { TEST_TARIFF_ENABLED: 'true' };
  assert.deepEqual(getPurchasableSubscriptionPlans(environment), SUBSCRIPTION_PLANS);
  for (const id of ['test_140', 'test_110', 'final_test_130']) {
    assert.equal(getSubscriptionPlan(id, environment), null);
    assert.equal(getSubscriptionOffer(id, 1, environment), null);
  }
  assert.equal(getSubscriptionPlan('ultimate_test')?.priceKopecks, 30_000);
  assert.equal(getSubscriptionOffer('ultimate_test', 3), null);
});
