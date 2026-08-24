import test from 'node:test';
import assert from 'node:assert/strict';

import {
  listPricingEconomicsRows,
  pricingEconomicsSummary
} from '../src/pricing-economics-report.js';

test('every public package and subscription funds RouterAI through the explicit tail', () => {
  const rows = listPricingEconomicsRows();

  assert.equal(rows.length, 13);
  assert.ok(rows.every((row) => row.routeraiCoversLiability));
  assert.ok(rows.every((row) => row.routeraiBudgetKopecks >= row.routeraiRequiredKopecks));
  assert.ok(rows.every((row) => row.routeraiTailKopecks > 0));
  assert.ok(rows.every((row) => row.polzaBudgetKopecks > 0));
  assert.ok(rows.filter(({ id }) => id !== 'plan:ultimate_test:1').every((row) => row.ownerShareKopecks > 0));
  assert.equal(rows.find(({ id }) => id === 'plan:ultimate_test:1')?.ownerShareKopecks, 0);
  assert.ok(rows.filter(({ id }) => id !== 'plan:ultimate_test:1').every((row) => row.ownerSharePercent >= 37.99));
});

test('the product economics report separates the 2% RouterAI tail from base capacity', () => {
  const amateur = listPricingEconomicsRows().find(({ id }) => id === 'plan:amateur:1');

  assert.ok(amateur);
  assert.equal(amateur.metacoins, 130);
  assert.ok(amateur.routeraiRequiredKopecks > amateur.routeraiBaseLiabilityKopecks);
  assert.equal(
    amateur.routeraiRequiredKopecks,
    amateur.routeraiBaseLiabilityKopecks + amateur.routeraiTailKopecks
  );
  assert.equal(
    amateur.routeraiSurplusAfterTailKopecks,
    amateur.routeraiBudgetKopecks - amateur.routeraiRequiredKopecks
  );
});

test('the report summary reconciles every economic bucket to the gross product revenue', () => {
  const summary = pricingEconomicsSummary();

  assert.equal(summary.products, 13);
  assert.equal(
    summary.grossKopecks,
    summary.paymentFeeKopecks
      + summary.polzaBudgetKopecks
      + summary.routeraiBudgetKopecks
      + summary.ownerShareKopecks
  );
  assert.ok(summary.routeraiCoversEveryProduct);
});
