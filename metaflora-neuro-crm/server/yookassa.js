const YOOKASSA_PAYMENTS_URL = "https://api.yookassa.ru/v3/payments";
const MAX_TEST_PAYMENT_RUB = 100;
const REQUEST_TIMEOUT_MS = 10_000;

export class PendingPaymentDisabledError extends Error {
  constructor() {
    super(
      "создание тестовых pending-платежей выключено конфигурацией сервера",
    );
    this.name = "PendingPaymentDisabledError";
  }
}

export class ProviderConfigurationError extends Error {
  constructor(provider) {
    super(`${provider} не настроен`);
    this.name = "ProviderConfigurationError";
  }
}

export class YooKassaRequestError extends Error {
  constructor(statusCode) {
    super("ЮKassa не приняла тестовый запрос");
    this.name = "YooKassaRequestError";
    this.statusCode = statusCode;
  }
}

function isEnabled(value) {
  return value === "true";
}

function requireNonBlank(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${fieldName} is required`);
  }

  return value.trim();
}

function getAllowedOrigins(env) {
  return new Set(
    (env.CRM_ALLOWED_RETURN_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map((origin) => new URL(origin).origin),
  );
}

function validateReturnUrl(value, env) {
  const returnUrl = new URL(requireNonBlank(value, "returnUrl"));
  const isLocalHttp =
    returnUrl.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(returnUrl.hostname);
  const isDevelopmentLocalhost =
    env.NODE_ENV !== "production" && isLocalHttp;
  const isConfiguredOrigin = getAllowedOrigins(env).has(returnUrl.origin);

  if (!isDevelopmentLocalhost && !isConfiguredOrigin) {
    throw new TypeError("returnUrl origin is not allowed");
  }

  return returnUrl.toString();
}

function validateAmount(value) {
  const amount = requireNonBlank(value, "amount");
  const numericAmount = Number(amount);

  if (
    !/^\d+\.\d{2}$/.test(amount) ||
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0 ||
    numericAmount > MAX_TEST_PAYMENT_RUB
  ) {
    throw new RangeError(
      `amount must be between 0.01 and ${MAX_TEST_PAYMENT_RUB.toFixed(2)} RUB`,
    );
  }

  return amount;
}

function validateInput(input, env) {
  if (!input || typeof input !== "object") {
    throw new TypeError("payment input is required");
  }

  if (input.currency !== "RUB") {
    throw new TypeError("currency must be RUB");
  }

  if (input.metadata?.crmTest !== true) {
    throw new TypeError("metadata.crmTest must be true");
  }

  const idempotenceKey = requireNonBlank(
    input.idempotenceKey,
    "idempotenceKey",
  );

  if (!/^[A-Za-z0-9_-]{8,64}$/.test(idempotenceKey)) {
    throw new TypeError("idempotenceKey format is invalid");
  }

  const description = requireNonBlank(input.description, "description");
  if (description.length > 128 || /[\u0000-\u001f\u007f]/.test(description)) {
    throw new RangeError("description must not exceed 128 characters");
  }

  const crmUserId =
    typeof input.metadata?.userId === "string"
      ? input.metadata.userId.slice(0, 64)
      : undefined;
  if (crmUserId && !/^[A-Za-z0-9_-]+$/.test(crmUserId)) {
    throw new TypeError("metadata.userId format is invalid");
  }

  return {
    amount: validateAmount(input.amount),
    currency: input.currency,
    description,
    idempotenceKey,
    returnUrl: validateReturnUrl(input.returnUrl, env),
    metadata: {
      crm_test: input.metadata?.crmTest === true,
      crm_user_id: crmUserId,
    },
  };
}

function readCredentials(env) {
  const shopId = env.YOOKASSA_SHOP_ID?.trim();
  const secretKey = env.YOOKASSA_SECRET_KEY?.trim();

  if (!shopId || !secretKey) {
    throw new ProviderConfigurationError("ЮKassa");
  }

  return { shopId, secretKey };
}

function createRequestBody(payment) {
  return {
    amount: {
      value: payment.amount,
      currency: payment.currency,
    },
    capture: false,
    confirmation: {
      type: "redirect",
      return_url: payment.returnUrl,
    },
    description: payment.description,
    metadata: Object.fromEntries(
      Object.entries(payment.metadata).filter(([, value]) => value !== undefined),
    ),
  };
}

function projectSafeResponse(response) {
  if (
    response?.status !== "pending" ||
    response?.paid !== false ||
    typeof response?.id !== "string"
  ) {
    throw new YooKassaRequestError(502);
  }

  return {
    id: response.id,
    status: response.status,
    paid: response.paid === true,
    amount: {
      value: response.amount?.value,
      currency: response.amount?.currency,
    },
    createdAt: response.created_at,
  };
}

/**
 * Creates an uncaptured YooKassa payment in pending state.
 *
 * The function is disabled by default and never performs card confirmation,
 * capture, cancellation, or a refund. No money can be charged by this call
 * alone.
 */
export async function createYooKassaPendingTestPayment(
  input,
  { env = process.env, fetchImpl = globalThis.fetch } = {},
) {
  if (!isEnabled(env.ENABLE_YOOKASSA_PENDING_TESTS)) {
    throw new PendingPaymentDisabledError();
  }

  const { shopId, secretKey } = readCredentials(env);
  const payment = validateInput(input, env);
  const authorization = Buffer.from(`${shopId}:${secretKey}`).toString(
    "base64",
  );

  let response;
  try {
    response = await fetchImpl(YOOKASSA_PAYMENTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/json",
        "Idempotence-Key": payment.idempotenceKey,
      },
      body: JSON.stringify(createRequestBody(payment)),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new YooKassaRequestError(503);
  }

  if (!response.ok) {
    throw new YooKassaRequestError(response.status);
  }

  let responseBody;
  try {
    responseBody = await response.json();
  } catch {
    throw new YooKassaRequestError(502);
  }

  return projectSafeResponse(responseBody);
}
