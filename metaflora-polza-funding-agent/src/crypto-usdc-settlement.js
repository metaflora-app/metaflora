const ADDRESS = /^0x[a-fA-F0-9]{40}$/u;
const ORDER = /^mfc_[a-f0-9]{32}$/u;
const HASH = /^0x[a-f0-9]{64}$/u;

function positive(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new TypeError(`${label} is invalid`);
  return number;
}

function sale(value) {
  const normalized = Object.freeze({
    ...value,
    amountUsdcMicros: positive(value?.amountUsdcMicros, "gross amount"),
    openrouterCreditMicrousd: positive(value?.openrouterCreditMicrousd, "OpenRouter credit"),
    openrouterUsdcMicros: positive(value?.openrouterUsdcMicros, "OpenRouter funding"),
    gasReserveUsdcMicros: positive(value?.gasReserveUsdcMicros, "gas reserve"),
    ownerUsdcMicros: positive(value?.ownerUsdcMicros, "owner amount")
  });
  if (!ORDER.test(String(normalized.orderId)) || normalized.currency !== "USDC" || normalized.chain !== "base"
    || normalized.openrouterUsdcMicros + normalized.gasReserveUsdcMicros + normalized.ownerUsdcMicros !== normalized.amountUsdcMicros) {
    throw new TypeError("Crypto USDC settlement is invalid");
  }
  return normalized;
}

export function createCryptoUsdcSettlementManager({ openRouter, smartWallet, ownerAddress } = {}) {
  if (!openRouter?.createDirectCryptoInvoice || !openRouter?.verifyDirectCryptoFunding) throw new TypeError("OpenRouter direct funding connector is required");
  if (!smartWallet?.getUsdcBalanceMicros || !smartWallet?.transferUsdcBatch) throw new TypeError("Base smart wallet is required");
  if (!ADDRESS.test(String(ownerAddress ?? ""))) throw new TypeError("Owner payout address is invalid");
  return Object.freeze({
    async settleCryptoSale(raw) {
      const job = sale(raw);
      const balance = await smartWallet.getUsdcBalanceMicros();
      if (balance < job.amountUsdcMicros) throw new Error("Smart wallet has not received the exact customer payment yet");
      const invoice = await openRouter.createDirectCryptoInvoice({
        idempotencyKey: job.orderId,
        creditMicrousd: job.openrouterCreditMicrousd,
        expectedPaymentUsdcMicros: job.openrouterUsdcMicros
      });
      if (!ADDRESS.test(String(invoice?.recipient ?? "")) || invoice.amountUsdcMicros !== job.openrouterUsdcMicros
        || invoice.creditMicrousd !== job.openrouterCreditMicrousd || !String(invoice?.invoiceId ?? "").trim()) {
        throw new Error("OpenRouter invoice does not match the signed allocation");
      }
      const receipt = await smartWallet.transferUsdcBatch({
        transfers: [
          { recipient: invoice.recipient, amountUsdcMicros: job.openrouterUsdcMicros },
          { recipient: ownerAddress, amountUsdcMicros: job.ownerUsdcMicros }
        ],
        idempotencyKey: `settle:${job.orderId}`
      });
      if (!HASH.test(String(receipt?.transactionHash ?? "").toLowerCase())) throw new Error("Base settlement receipt is invalid");
      const verified = await openRouter.verifyDirectCryptoFunding({
        invoiceId: invoice.invoiceId,
        transactionHash: receipt.transactionHash,
        creditMicrousd: job.openrouterCreditMicrousd,
        paymentUsdcMicros: job.openrouterUsdcMicros
      });
      const transactionId = String(verified?.transactionId ?? "").trim();
      if (!transactionId || transactionId.length > 180) throw new Error("OpenRouter funding proof is invalid");
      return Object.freeze({
        openrouterTransactionId: transactionId,
        openrouterFundedUsdcMicros: job.openrouterUsdcMicros,
        ownerTransactionHash: receipt.transactionHash.toLowerCase(),
        ownerPaidUsdcMicros: job.ownerUsdcMicros
      });
    }
  });
}
