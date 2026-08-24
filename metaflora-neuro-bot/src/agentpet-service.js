import { invokeFreeLlm } from './llm-router.js';

export const AGENTPET_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';

export const AGENTPET_SYSTEM_PROMPT = `Ты анализируешь события Codex для локального помощника на macOS.

Верни только JSON без Markdown и пояснений:
{"state":"idle|working|needs_input|ready|blocked","title":"до 48 символов","summary":"до 220 символов","risk":"unknown|low|medium|high|critical","suggested_action":"до 180 символов"}

Правила:
1. Опирайся только на переданное событие. Не додумывай команды, ошибки и намерения.
2. Пиши по-русски, коротко и конкретно.
3. Никогда не разрешай и не запрещай действие. Решение принимает человек в Codex.
4. Ставь высокий риск для удаления данных, force push, деплоя, миграций, прав доступа, секретов и сетевых действий.
5. не повторяй секреты, токены, ключи и пароли. Напиши, что в данных найден секрет.
6. Не выдавай скрытые рассуждения. Если данных мало, прямо скажи об этом в summary.`;

const ALLOWED_FIELDS = Object.freeze(new Set([
  'session_id',
  'turn_id',
  'project',
  'hook_event_name',
  'model',
  'tool_name',
  'command',
  'last_assistant_message'
]));
const EVENT_NAMES = Object.freeze(new Set([
  'SessionStart',
  'UserPromptSubmit',
  'PreToolUse',
  'PermissionRequest',
  'PostToolUse',
  'Stop',
  'SessionEnd'
]));
const OUTPUT_STATES = Object.freeze(new Set(['idle', 'working', 'needs_input', 'ready', 'blocked']));
const OUTPUT_RISKS = Object.freeze(new Set(['unknown', 'low', 'medium', 'high', 'critical']));
const FIELD_LIMITS = Object.freeze({
  session_id: 160,
  turn_id: 160,
  project: 240,
  hook_event_name: 32,
  model: 160,
  tool_name: 160,
  command: 8_000,
  last_assistant_message: 8_000
});

function badRequest(message) {
  return Object.assign(new Error(message), { statusCode: 400 });
}

function validatedEvent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw badRequest('AgentPet event must be an object.');
  }
  for (const field of Object.keys(input)) {
    if (!ALLOWED_FIELDS.has(field)) throw badRequest(`Unsupported AgentPet field: ${field}.`);
  }
  const result = {};
  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    if (input[field] === undefined || input[field] === null) continue;
    if (typeof input[field] !== 'string') throw badRequest(`AgentPet field ${field} must be a string.`);
    if (input[field].length > limit) throw badRequest(`AgentPet field ${field} is too long.`);
    result[field] = input[field];
  }
  if (!result.session_id) throw badRequest('AgentPet session_id is required.');
  if (!EVENT_NAMES.has(result.hook_event_name)) throw badRequest('Unsupported AgentPet hook event.');
  return Object.freeze(result);
}

function redactSecrets(value) {
  return value
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]{8,}/giu, 'Bearer [REDACTED]')
    .replace(/\b(?:sk|pk|api)[_-][A-Za-z0-9_-]{8,}/giu, '[REDACTED]')
    .replace(/\b(password|passwd|token|secret|api[_-]?key)\s*[:=]\s*[^\s,;]+/giu, '$1=[REDACTED]');
}

function validatedAnalysis(text) {
  if (typeof text !== 'string' || text.includes('```')) {
    throw Object.assign(new Error('Nemotron did not return valid JSON.'), { statusCode: 502 });
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw Object.assign(new Error('Nemotron did not return valid JSON.'), { statusCode: 502 });
  }
  const fields = ['state', 'title', 'summary', 'risk', 'suggested_action'];
  if (
    !parsed
    || typeof parsed !== 'object'
    || Array.isArray(parsed)
    || Object.keys(parsed).some((field) => !fields.includes(field))
    || !OUTPUT_STATES.has(parsed.state)
    || !OUTPUT_RISKS.has(parsed.risk)
    || typeof parsed.title !== 'string'
    || parsed.title.length < 1
    || parsed.title.length > 48
    || typeof parsed.summary !== 'string'
    || parsed.summary.length < 1
    || parsed.summary.length > 220
    || typeof parsed.suggested_action !== 'string'
    || parsed.suggested_action.length < 1
    || parsed.suggested_action.length > 180
  ) {
    throw Object.assign(new Error('Nemotron response did not match the AgentPet schema.'), { statusCode: 502 });
  }
  return Object.freeze(Object.fromEntries(fields.map((field) => [field, parsed[field]])));
}

function createRateLimiter({ limit = 60, windowMs = 60 * 60 * 1_000, now = Date.now } = {}) {
  let records = new Map();
  return (key = 'unknown') => {
    const timestamp = now();
    const existing = records.get(key);
    const current = existing && timestamp - existing.startedAt < windowMs
      ? existing
      : Object.freeze({ count: 0, startedAt: timestamp });
    if (current.count >= limit) {
      throw Object.assign(new Error('AgentPet request limit reached.'), { statusCode: 429 });
    }
    records = new Map(records).set(
      key,
      Object.freeze({ count: current.count + 1, startedAt: current.startedAt })
    );
  };
}

export function createAgentPetService({
  providerKeys,
  invoke = invokeFreeLlm,
  rateLimit = createRateLimiter()
} = {}) {
  if (!providerKeys?.openrouter) throw new TypeError('OpenRouter is required for AgentPet.');
  return Object.freeze({
    async analyze(input, { clientKey = 'unknown' } = {}) {
      rateLimit(clientKey);
      const event = validatedEvent(input);
      const prompt = redactSecrets(JSON.stringify(event));
      const result = await invoke({
        prompt,
        provider: 'openrouter',
        providerModel: AGENTPET_MODEL,
        providerKeys,
        allowSecondaryProviders: false,
        allowFreeFallback: false,
        settings: {
          instructions: AGENTPET_SYSTEM_PROMPT,
          temperature: 0.1,
          max_tokens: 320
        }
      });
      return validatedAnalysis(result.text);
    }
  });
}
