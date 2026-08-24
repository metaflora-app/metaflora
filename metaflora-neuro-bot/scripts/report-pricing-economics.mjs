import {
  listPricingEconomicsRows,
  pricingEconomicsSummary
} from '../src/pricing-economics-report.js';

function rubles(kopecks) {
  return `${(kopecks / 100).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ₽`;
}

const headers = [
  'Продукт', 'Цена', 'МК', 'Комиссия', 'Polza 6%',
  'RouterAI 50,5%', 'База RouterAI', 'Хвост 2%',
  'После хвоста', 'Моя доля'
];
const separator = `| ${headers.map(() => '---').join(' | ')} |`;

console.log(`| ${headers.join(' | ')} |`);
console.log(separator);
for (const row of listPricingEconomicsRows()) {
  const title = row.kind === 'package'
    ? row.name
    : `${row.name} · ${row.months} мес.`;
  console.log(`| ${title} | ${rubles(row.priceKopecks)} | ${row.metacoins.toLocaleString('ru-RU')} | ${rubles(row.paymentFeeKopecks)} | ${rubles(row.polzaBudgetKopecks)} | ${rubles(row.routeraiBudgetKopecks)} | ${rubles(row.routeraiBaseLiabilityKopecks)} | ${rubles(row.routeraiTailKopecks)} | ${rubles(row.routeraiSurplusAfterTailKopecks)} | ${rubles(row.ownerShareKopecks)} (${row.ownerSharePercent.toFixed(2)}%) |`);
}

const summary = pricingEconomicsSummary();
console.log('');
console.log(`Проверка: ${summary.routeraiCoversEveryProduct ? 'все продукты покрывают RouterAI' : 'есть дефицит RouterAI'}.`);
