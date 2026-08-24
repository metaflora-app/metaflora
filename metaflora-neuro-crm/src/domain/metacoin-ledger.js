function validateTransaction(transaction) {
  for (const field of ["id", "userId"]) {
    if (typeof transaction[field] !== "string" || !transaction[field].trim()) {
      throw new TypeError(`${field} is required`);
    }
  }
  if (!["credit", "debit"].includes(transaction.type)) {
    throw new TypeError("Transaction type must be credit or debit");
  }
  if (!Number.isInteger(transaction.amount) || transaction.amount <= 0) {
    throw new TypeError("Transaction amount must be a positive integer");
  }
}

export function calculateMetacoinBalance(ledger, userId) {
  return ledger
    .filter(
      (entry) =>
        entry.userId === userId && (entry.status ?? "settled") === "settled",
    )
    .reduce(
      (balance, entry) =>
        balance + (entry.type === "credit" ? entry.amount : -entry.amount),
      0,
    );
}

export function applyMetacoinTransaction(ledger, transaction) {
  validateTransaction(transaction);
  const normalizedTransaction = {
    ...transaction,
    id: transaction.id.trim(),
    userId: transaction.userId.trim(),
  };
  if (ledger.some(({ id }) => id === normalizedTransaction.id)) {
    throw new Error("Transaction id already exists");
  }
  if (
    normalizedTransaction.type === "debit" &&
    calculateMetacoinBalance(ledger, normalizedTransaction.userId) <
      normalizedTransaction.amount
  ) {
    throw new Error("Insufficient metacoin balance");
  }

  const settledTransaction = Object.freeze({
    ...normalizedTransaction,
    status: "settled",
  });
  return [...ledger, settledTransaction];
}
