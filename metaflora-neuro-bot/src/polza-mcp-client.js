import { createDirectChargeContract } from './provider-funding-config.js';

const DEFAULT_MCP_ENDPOINT = 'https://polza.ai/api/mcp';
const MCP_PROTOCOL_VERSION = '2025-06-18';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function containsExactValue(value, expected) {
  if (value === expected) return true;
  if (Array.isArray(value)) return value.some((item) => containsExactValue(item, expected));
  if (isPlainObject(value)) {
    return Object.values(value).some((item) => containsExactValue(item, expected));
  }
  return false;
}

function safeText(value, maximum = 255) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = String(value).replace(/\u0000/g, '').trim();
  return normalized ? normalized.slice(0, maximum) : null;
}

function safeIdentifier(value, label) {
  const normalized = safeText(value, 255);
  if (!normalized || !/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,254}$/.test(normalized)) {
    throw new TypeError(`Invalid ${label}.`);
  }
  return normalized;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new TypeError(`Invalid ${label}.`);
  return number;
}

function currencyCode(value) {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) throw new TypeError('Invalid funding currency.');
  return normalized;
}

function errorCode(error, fallback = 'mcp_error') {
  const code = safeText(error?.code, 64)?.toLowerCase();
  return code && /^[a-z][a-z0-9_-]{1,63}$/.test(code) ? code : fallback;
}

function parseJsonText(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return { text: value };
  }
}

function toolPayload(value) {
  if (!value) return {};
  if (value.error) {
    throw new PolzaMcpError('MCP tool call failed.', {
      code: errorCode(value.error, 'tool_call_failed'),
      retryable: false
    });
  }
  const result = value.result ?? value;
  if (result.isError === true) {
    throw new PolzaMcpError('MCP tool call failed.', {
      code: 'tool_call_failed',
      retryable: false
    });
  }
  if (isPlainObject(result.structuredContent)) return result.structuredContent;
  if (Array.isArray(result.content)) {
    const textContent = result.content.find((item) => item?.type === 'text' && typeof item.text === 'string');
    if (textContent) return parseJsonText(textContent.text);
  }
  return result;
}

function freezeTool(tool) {
  if (!isPlainObject(tool) || !safeText(tool.name, 128)) return null;
  const normalized = {
    name: safeText(tool.name, 128),
    ...(safeText(tool.description, 1_000) ? { description: safeText(tool.description, 1_000) } : {}),
    ...(isPlainObject(tool.inputSchema) ? { inputSchema: structuredClone(tool.inputSchema) } : {})
  };
  if (normalized.inputSchema) Object.freeze(normalized.inputSchema);
  return Object.freeze(normalized);
}

function parseDecimalKopecks(value, label) {
  const normalized = String(value ?? '').trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new PolzaMcpError(`Invalid ${label}.`, {
    code: 'invalid_provider_value',
    retryable: false
  });
  const [rubles, cents = ''] = normalized.split('.');
  const kopecks = Number(rubles) * 100 + Number((cents + '00').slice(0, 2));
  if (!Number.isSafeInteger(kopecks) || kopecks < 0) throw new PolzaMcpError(`Invalid ${label}.`, {
    code: 'invalid_provider_value',
    retryable: false
  });
  return kopecks;
}

function kopecksFromPayload(value, { label, allowZero = true } = {}) {
  if (value === undefined || value === null || value === '') {
    throw new PolzaMcpError(`Provider ${label} is missing.`, {
      code: 'invalid_provider_value',
      retryable: false
    });
  }
  const number = typeof value === 'number' ? value : Number(value);
  if (typeof value === 'number' && Number.isSafeInteger(number) && number >= 0) {
    if (!allowZero && number === 0) throw new PolzaMcpError(`Provider ${label} is invalid.`, {
      code: 'invalid_provider_value',
      retryable: false
    });
    return number;
  }
  const parsed = parseDecimalKopecks(value, label);
  if (!allowZero && parsed === 0) throw new PolzaMcpError(`Provider ${label} is invalid.`, {
    code: 'invalid_provider_value',
    retryable: false
  });
  return parsed;
}

function integerKopecksFromPayload(value, { label, allowZero = true } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0 || (!allowZero && number === 0)) {
    throw new PolzaMcpError(`Invalid ${label}.`, {
      code: 'invalid_provider_value',
      retryable: false
    });
  }
  return number;
}

function responseMessages(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return [];
  if (!trimmed.includes('\n')) return [parseJsonText(trimmed)];
  return trimmed.split(/\r?\n/u)
    .filter((line) => line.startsWith('data:'))
    .map((line) => parseJsonText(line.slice(5).trim()))
    .filter(Boolean);
}

class HttpMcpTransport {
  constructor({ endpoint, token, fetchImpl }) {
    this.endpoint = endpoint;
    this.token = token;
    this.fetchImpl = fetchImpl;
    this.nextId = 1;
    this.initialized = false;
    this.sessionId = null;
  }

  async request(method, params = {}) {
    if (!['initialize', 'notifications/initialized'].includes(method) && !this.initialized) {
      await this.request('initialize', {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: 'metaflora-neuro-bot-funding-worker', version: '1.0.0' }
      });
      await this.request('notifications/initialized', {});
      this.initialized = true;
    }
    const id = method.startsWith('notifications/') ? undefined : this.nextId++;
    const response = await this.fetchImpl(this.endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/event-stream',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
        ...(this.sessionId ? { 'Mcp-Session-Id': this.sessionId } : {})
      },
      body: JSON.stringify({ jsonrpc: '2.0', ...(id === undefined ? {} : { id }), method, params }),
      signal: AbortSignal.timeout(15_000)
    });
    const sessionId = response.headers?.get?.('mcp-session-id');
    if (sessionId) this.sessionId = sessionId;
    if (!response.ok) {
      throw new PolzaMcpError('Polza MCP request failed.', {
        code: response.status === 429 ? 'rate_limited' : 'mcp_http_error',
        retryable: response.status === 429 || response.status >= 500
      });
    }
    const body = await response.text();
    if (method.startsWith('notifications/')) return {};
    const messages = responseMessages(body);
    const message = messages.at(-1) ?? {};
    if (message.error) {
      throw new PolzaMcpError('Polza MCP request failed.', {
        code: errorCode(message.error),
        retryable: false
      });
    }
    return message.result ?? message;
  }
}

export class PolzaMcpError extends Error {
  constructor(message, { code = 'mcp_error', retryable = false } = {}) {
    super(message);
    this.name = 'PolzaMcpError';
    this.code = code;
    this.retryable = retryable;
  }
}

export class DirectChargeUnavailableError extends PolzaMcpError {
  constructor(message = 'Confirmed Polza direct-charge tool and params are unavailable.') {
    super(message, { code: 'direct_charge_unavailable', retryable: false });
    this.name = 'DirectChargeUnavailableError';
  }
}

export class ProviderVerificationError extends PolzaMcpError {
  constructor(message = 'Polza funding verification failed.') {
    super(message, { code: 'verification_failed', retryable: false });
    this.name = 'ProviderVerificationError';
  }
}

export class PolzaMcpClient {
  constructor({
    token = '',
    endpoint = DEFAULT_MCP_ENDPOINT,
    fetchImpl = globalThis.fetch,
    transport = null,
    billing = {},
    billingDanger = false,
    directChargeContract = null,
    directChargeTool = null,
    directChargeArguments = null,
    transactionHistoryArguments = () => ({}),
    balanceArguments = () => ({}),
    logger = null
  } = {}) {
    if (transport && typeof transport.request !== 'function') {
      throw new TypeError('Polza MCP transport request must be a function.');
    }
    if (!transport && typeof fetchImpl !== 'function') throw new TypeError('Polza MCP fetch is required.');
    const url = new URL(endpoint);
    if (!['http:', 'https:'].includes(url.protocol)) throw new TypeError('Polza MCP endpoint must be HTTP(S).');
    if (!transport && !safeText(token, 2_000)) throw new TypeError('Polza MCP token is required.');
    if (typeof transactionHistoryArguments !== 'function' || typeof balanceArguments !== 'function') {
      throw new TypeError('Polza MCP read argument builders must be functions.');
    }
    this.transport = transport ?? new HttpMcpTransport({ endpoint: url.toString(), token: String(token), fetchImpl });
    this.billingDanger = billing?.danger === true || billingDanger === true;
    this.directChargeContract = directChargeContract ?? createDirectChargeContract({
      toolName: directChargeTool,
      argumentsTemplate: directChargeArguments
    });
    this.transactionHistoryArguments = transactionHistoryArguments;
    this.balanceArguments = balanceArguments;
    this.logger = logger;
    this.tools = null;
  }

  async request(method, params = {}) {
    try {
      const result = await this.transport.request(method, params);
      if (result?.error) {
        throw new PolzaMcpError('Polza MCP request failed.', {
          code: errorCode(result.error),
          retryable: false
        });
      }
      return result?.result ?? result;
    } catch (error) {
      if (error instanceof PolzaMcpError) throw error;
      const retryable = error?.name === 'AbortError' || error?.code === 'ETIMEDOUT'
        || error?.code === 'ECONNRESET' || error?.code === 'ENETUNREACH';
      throw new PolzaMcpError('Polza MCP request failed.', {
        code: retryable ? 'mcp_timeout' : 'mcp_request_failed',
        retryable
      });
    }
  }

  async discoverTools({ force = false } = {}) {
    if (this.tools && !force) return this.tools;
    const result = await this.request('tools/list', {});
    const tools = Array.isArray(result?.tools)
      ? result.tools.map(freezeTool).filter(Boolean)
      : [];
    this.tools = Object.freeze(tools);
    return this.tools;
  }

  findTool(name, tools = this.tools) {
    return tools?.find((tool) => tool.name === name) ?? null;
  }

  async callTool(name, args = {}) {
    const tools = await this.discoverTools();
    if (!this.findTool(name, tools)) {
      throw new PolzaMcpError('Required Polza MCP tool is unavailable.', {
        code: 'tool_unavailable',
        retryable: false
      });
    }
    if (!isPlainObject(args)) throw new TypeError('MCP tool arguments must be an object.');
    return toolPayload(await this.request('tools/call', { name, arguments: args }));
  }

  validateContractArguments(tool, args) {
    if (!isPlainObject(args)) throw new DirectChargeUnavailableError('Confirmed direct-charge params must be an object.');
    const schema = tool?.inputSchema;
    if (!isPlainObject(schema)) return;
    if (schema.type && schema.type !== 'object') {
      throw new DirectChargeUnavailableError('Confirmed direct-charge schema is not an object.');
    }
    for (const required of Array.isArray(schema.required) ? schema.required : []) {
      if (!Object.prototype.hasOwnProperty.call(args, required)) {
        throw new DirectChargeUnavailableError('Confirmed direct-charge params are incomplete.');
      }
    }
    if (schema.additionalProperties === false && isPlainObject(schema.properties)) {
      const allowed = new Set(Object.keys(schema.properties));
      if (Object.keys(args).some((key) => !allowed.has(key))) {
        throw new DirectChargeUnavailableError('Direct-charge params are not confirmed by the tool schema.');
      }
    }
  }

  async charge({ provider, allocationKey, paymentId, amountKopecks, currency, idempotencyKey }) {
    if (!this.billingDanger) throw new DirectChargeUnavailableError('billing.danger is not explicitly enabled.');
    const contract = this.directChargeContract;
    if (contract?.supportsCustomAmount !== true) {
      throw new DirectChargeUnavailableError(
        'Direct-charge contract does not carry the exact funding amount.'
      );
    }
    const tools = await this.discoverTools();
    if (!isPlainObject(contract) || !safeText(contract.toolName, 128)
      || typeof contract.buildArguments !== 'function') {
      throw new DirectChargeUnavailableError();
    }
    const request = Object.freeze({
      provider: safeIdentifier(provider, 'provider'),
      allocationKey: safeIdentifier(allocationKey, 'allocation key'),
      paymentId: safeIdentifier(paymentId, 'payment id'),
      amountKopecks: positiveInteger(amountKopecks, 'funding amount'),
      currency: currencyCode(currency),
      idempotencyKey: safeIdentifier(idempotencyKey, 'idempotency key')
    });
    const tool = this.findTool(contract.toolName, tools);
    if (!tool) throw new DirectChargeUnavailableError('Confirmed direct-charge tool is not in tools/list.');
    let args;
    try {
      args = contract.buildArguments(request);
    } catch {
      throw new DirectChargeUnavailableError('Confirmed direct-charge params could not be built.');
    }
    this.validateContractArguments(tool, args);
    if (typeof contract.validateArguments === 'function' && contract.validateArguments(args, tool) !== true) {
      throw new DirectChargeUnavailableError('Confirmed direct-charge params failed validation.');
    }
    if (!containsExactValue(args, request.idempotencyKey)) {
      throw new DirectChargeUnavailableError('Direct-charge params do not carry the stable idempotency key.');
    }
    const payload = await this.callTool(contract.toolName, args);
    const transactionId = safeText(
      payload.transaction_id ?? payload.transactionId ?? payload.external_id ?? payload.externalId ?? payload.id,
      255
    );
    if (!transactionId) throw new ProviderVerificationError('Direct-charge response has no transaction id.');
    return Object.freeze({ transactionId });
  }

  async getTransactionHistory() {
    const args = this.transactionHistoryArguments();
    if (!isPlainObject(args)) throw new ProviderVerificationError('Transaction history params are invalid.');
    return this.callTool('get_transaction_history', args);
  }

  async verifyTransaction({ transactionId, expectedAmountKopecks, currency = 'RUB' }) {
    const expectedId = safeIdentifier(transactionId, 'transaction id');
    const expectedAmount = positiveInteger(expectedAmountKopecks, 'expected transaction amount');
    const expectedCurrency = currencyCode(currency);
    const payload = await this.getTransactionHistory();
    const rows = Array.isArray(payload)
      ? payload
      : (payload.transactions ?? payload.items ?? payload.data ?? []);
    if (!Array.isArray(rows)) throw new ProviderVerificationError();
    const row = rows.find((candidate) => String(
      candidate?.transaction_id ?? candidate?.transactionId ?? candidate?.external_id ?? candidate?.id ?? ''
    ) === expectedId);
    if (!row) throw new ProviderVerificationError();
    const observedAmount = row.amount_kopecks !== undefined
      ? integerKopecksFromPayload(row.amount_kopecks, { label: 'transaction amount', allowZero: false })
      : row.amountKopecks !== undefined
        ? integerKopecksFromPayload(row.amountKopecks, { label: 'transaction amount', allowZero: false })
        : parseDecimalKopecks(row.amount, 'transaction amount');
    const observedCurrency = currencyCode(row.currency ?? expectedCurrency);
    if (observedAmount !== expectedAmount || observedCurrency !== expectedCurrency) {
      throw new ProviderVerificationError();
    }
    return Object.freeze({ transactionId: expectedId, amountKopecks: observedAmount, currency: observedCurrency });
  }

  async getBalance() {
    const args = this.balanceArguments();
    if (!isPlainObject(args)) throw new ProviderVerificationError('Balance params are invalid.');
    const payload = await this.callTool('get_balance', args);
    const explicitKopecks = payload.balance_kopecks ?? payload.balanceKopecks ?? payload.amount_kopecks;
    const rubleBalance = payload.amount ?? payload.balance;
    const balanceKopecks = explicitKopecks !== undefined
      ? integerKopecksFromPayload(explicitKopecks, { label: 'balance', allowZero: true })
      : parseDecimalKopecks(rubleBalance, 'balance');
    return Object.freeze({ balanceKopecks, currency: currencyCode(payload.currency ?? 'RUB') });
  }
}

export function createPolzaMcpClient(options) {
  return new PolzaMcpClient(options);
}
