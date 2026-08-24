import {
  getSubscriptionOffer,
  METACOIN_PACKAGES,
  SUBSCRIPTION_PLANS
} from './billing-catalog.js';
import {
  createFinanceAllocations,
  summarizeFinanceAllocations
} from './finance-ledger.js';
import {
  FINANCE_POLICY,
  financePolicyForProduct,
  providerLiabilityRublesForMetacoins
} from './finance-policy.js';
import { minimumTariffRublesPerMetacoin } from './model-pricing.js';

function productDefinitions() {
  const packages = METACOIN_PACKAGES.map((item) => Object.freeze({
    id: `package:${item.id}`,
    kind: 'package',
    name: item.id.replace(/^coins_/, 'пакет '),
    months: null,
    priceKopecks: item.priceKopecks,
    metacoins: item.metacoins
  }));

  const subscriptions = SUBSCRIPTION_PLANS
    .filter(({ priceKopecks }) => priceKopecks > 0)
    .flatMap(({ id, name, durationMonths }) => durationMonths.map((months) => {
      const offer = getSubscriptionOffer(id, months);
      return Object.freeze({
        id: `plan:${id}:${months}`,
        kind: 'plan',
        name,
        months,
        priceKopecks: offer.priceKopecks,
        metacoins: offer.metacoins
      });
    }));

  return Object.freeze([...packages, ...subscriptions]);
}

function amountFor(rows, category, provider = null) {
  return rows
    .filter((row) => row.category === category && (provider === null || row.provider === provider))
    .reduce((total, row) => total + row.amountKopecks, 0);
}

function exactProviderLiability(metacoins) {
  return providerLiabilityRublesForMetacoins({
    metacoins,
    minimumTariffRublesPerMetacoin: minimumTariffRublesPerMetacoin(),
    paymentFeePercent: FINANCE_POLICY.paymentFeePercent,
    targetGrossMarginPercent: FINANCE_POLICY.targetGrossMarginPercent,
    routeraiReservePercent: FINANCE_POLICY.routeraiReservePercent,
    primaryProviderBufferPercent: FINANCE_POLICY.primaryProviderBufferPercent
  });
}

function economicsRow(product) {
  const productPolicy = financePolicyForProduct({
    kind: product.kind,
    productId: product.id.replace(/^(?:plan|package):/u, '').replace(/:\d+$/u, ''),
    durationMonths: product.months ?? 1
  });
  const allocations = createFinanceAllocations({
    externalPaymentId: `economics-${product.id.replace(/[^a-z0-9]/giu, '-')}`,
    amountKopecks: product.priceKopecks,
    metacoinsGranted: product.metacoins,
    enforceExactGrossMargin: true,
    targetGrossMarginPercent: productPolicy.targetGrossMarginPercent,
    polzaReservePercent: productPolicy.polzaReservePercent,
    routeraiReservePercent: productPolicy.routeraiReservePercent,
    allocateRemainingToRouter: productPolicy.allocateRemainingToRouter,
    source: 'pricing_report'
  });
  const totals = summarizeFinanceAllocations(allocations);
  const liability = exactProviderLiability(product.metacoins);
  const routeraiBaseLiabilityKopecks = Math.ceil(liability.primary * 100);
  const routeraiRequiredKopecks = Math.ceil(liability.total * 100);
  const routeraiTailKopecks = routeraiRequiredKopecks - routeraiBaseLiabilityKopecks;
  const routeraiBudgetKopecks = amountFor(allocations, 'api_reserve', 'routerai');
  const polzaBudgetKopecks = amountFor(allocations, 'api_reserve', 'polza');
  const ownerShareKopecks = amountFor(allocations, 'owner_share');
  const paymentFeeKopecks = amountFor(allocations, 'payment_fee');

  return Object.freeze({
    ...product,
    paymentFeeKopecks,
    polzaBudgetKopecks,
    routeraiBudgetKopecks,
    routeraiBaseLiabilityKopecks,
    routeraiTailKopecks,
    routeraiRequiredKopecks,
    routeraiSurplusAfterTailKopecks: routeraiBudgetKopecks - routeraiRequiredKopecks,
    routeraiCoversLiability: routeraiBudgetKopecks >= routeraiRequiredKopecks,
    ownerShareKopecks,
    ownerSharePercent: (ownerShareKopecks / product.priceKopecks) * 100,
    grossKopecks: totals.gross
  });
}

/**
 * A reproducible economic ledger for every public paid product.  This is
 * intentionally derived from the same payment allocator that production uses,
 * so the table cannot silently drift away from checkout economics.
 */
export function listPricingEconomicsRows() {
  return Object.freeze(productDefinitions().map(economicsRow));
}

export function pricingEconomicsSummary() {
  const rows = listPricingEconomicsRows();
  const sum = (field) => rows.reduce((total, row) => total + row[field], 0);
  return Object.freeze({
    products: rows.length,
    grossKopecks: sum('grossKopecks'),
    paymentFeeKopecks: sum('paymentFeeKopecks'),
    polzaBudgetKopecks: sum('polzaBudgetKopecks'),
    routeraiBudgetKopecks: sum('routeraiBudgetKopecks'),
    ownerShareKopecks: sum('ownerShareKopecks'),
    routeraiRequiredKopecks: sum('routeraiRequiredKopecks'),
    routeraiTailKopecks: sum('routeraiTailKopecks'),
    routeraiCoversEveryProduct: rows.every((row) => row.routeraiCoversLiability)
  });
}
