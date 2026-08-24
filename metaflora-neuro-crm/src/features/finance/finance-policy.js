const freezeRows = (rows) => Object.freeze(rows.map((row) => Object.freeze(row)));

export const TARGET_GROSS_MARGIN_PERCENT = 50;

export const PAYOUT_PROVIDERS = freezeRows([
  Object.freeze({
    id: "tbank_mass_payouts",
    label: "Т‑Бизнес массовые выплаты",
    status: "СБП-выплаты через отдельный payout-контур",
    methods: Object.freeze(["sbp"]),
  }),
  Object.freeze({
    id: "yookassa_payouts",
    label: "ЮKassa Payouts API",
    status: "нужно подключение",
  }),
]);

export const PAYOUT_METHODS = freezeRows([
  Object.freeze({ id: "sbp", label: "СБП" }),
]);
