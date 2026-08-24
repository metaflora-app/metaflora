import {
  getAgentById,
  listAgentCategories,
  listAgents
} from './agent-catalog.js';
import { buildAgentButton, agentLogoHtml } from './agent-icons.js';
import { metacoinHtml } from './brand-icons.js';
import { calculateAgentRunPrice } from './agent-economics.js';
import { getAgentCardProfile } from './agent-card-copy.js';
import {
  agentSettingsProfileFor,
  defaultAgentSettings,
  sanitizeAgentSettings
} from './agent-settings.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function lower(value) {
  return String(value ?? '').toLocaleLowerCase('ru-RU');
}

function rows(items, size = 2) {
  return Array.from(
    { length: Math.ceil(items.length / size) },
    (_, index) => items.slice(index * size, index * size + size)
  );
}

function categoryById(categoryId) {
  return listAgentCategories().find(({ id }) => id === categoryId) ?? null;
}

function resolveAgent(agentOrId) {
  if (typeof agentOrId === 'string') return getAgentById(agentOrId);
  if (!agentOrId || typeof agentOrId !== 'object') return null;
  return getAgentById(agentOrId.id);
}

function categoryButton(category) {
  const fallback = category.fallback ?? category.emoji ?? '🗂️';
  return {
    text: `${fallback} ${lower(category.name)}`,
    callback_data: `agentcat:${category.id}`
  };
}

function backButton(text, callbackData) {
  return { text, callback_data: callbackData };
}

function navigationRows(backData, backText = '‹ назад') {
  return [
    [backButton('👤 профиль', 'task:profile')],
    [
      backButton(backText, backData),
      backButton('🏠 главное меню', 'task:menu')
    ]
  ];
}

function priceFor(agent) {
  return String(calculateAgentRunPrice(agent));
}

function metacoinLabel(value) {
  const amount = Math.abs(Number(value));
  const lastTwo = amount % 100;
  const last = amount % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return 'метакоинов';
  if (last === 1) return 'метакоин';
  if (last >= 2 && last <= 4) return 'метакоина';
  return 'метакоинов';
}

function withoutTerminalPunctuation(value) {
  return lower(value).trim().replace(/[.!?…]+$/u, '');
}

function highlightedHtml(text, highlights = []) {
  const ranges = highlights
    .map((highlight) => {
      const start = text.indexOf(highlight);
      return { start, end: start + highlight.length };
    })
    .filter(({ start }) => start >= 0)
    .sort((left, right) => left.start - right.start);
  const parts = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start < cursor) continue;
    parts.push(escapeHtml(text.slice(cursor, range.start)));
    parts.push(`<b>${escapeHtml(text.slice(range.start, range.end))}</b>`);
    cursor = range.end;
  }
  parts.push(escapeHtml(text.slice(cursor)));
  return parts.join('');
}

export function buildAgentCatalogMenu() {
  return {
    text: '<b>🤖 ИИ-агенты</b>\n\n50 специалистов для конкретных задач: договоров, стратегии, контента, разработки, учёбы и повседневных дел. у каждого свой порядок работы, требования к исходным данным и понятный формат результата.\n\nвыбери категорию и открой нужного агента. он включится сразу — останется прислать задачу и материалы.',
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...rows(listAgentCategories().map(categoryButton)),
        ...navigationRows('task:menu', '‹ назад')
      ]
    }
  };
}

export function buildAgentCategoryMessage(categoryId) {
  const category = categoryById(categoryId);
  if (!category) return buildAgentCatalogMenu();
  const agents = listAgents({ category: category.id });
  const description = lower(category.description ?? category.text);

  return {
    text: `<b>${escapeHtml(lower(category.name))}</b>\n\n${escapeHtml(description)}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...rows(agents.map((agent) => buildAgentButton(agent))),
        ...navigationRows('agents:home', '‹ назад к категориям')
      ]
    }
  };
}

export function buildAgentCard(agentOrId) {
  const agent = resolveAgent(agentOrId);
  if (!agent) return buildAgentCatalogMenu();
  const profile = getAgentCardProfile(agent.id);
  const description = lower(profile?.description ?? agent.description);
  const instruction = withoutTerminalPunctuation(profile?.instruction ?? agent.inputHint);
  const price = priceFor(agent);

  return {
    text: `${agentLogoHtml(agent)} <b>${escapeHtml(lower(agent.name))}</b>\n\n${highlightedHtml(description, profile?.highlights)}\n\n${escapeHtml(instruction)}👇\n\n<b>стоимость: ${metacoinHtml()} ${escapeHtml(price)} ${metacoinLabel(price)}</b>`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📝 новая задача', callback_data: `agent:new:${agent.id}` }],
        ...(agentSettingsProfileFor(agent).length
          ? [[backButton('⚙️ параметры', `agentsettings:${agent.id}`)]]
          : []),
        ...navigationRows(`agentcat:${agent.category}`, '‹ назад к списку')
      ]
    }
  };
}

function agentSettingLabel(definition, value) {
  return definition.values.find((entry) => entry.value === value)?.label
    ?? definition.values.find((entry) => entry.value === definition.defaultValue)?.label
    ?? value;
}

export function buildAgentSettingsMessage(agentOrId, source) {
  const agent = resolveAgent(agentOrId);
  if (!agent) return buildAgentCatalogMenu();
  const profile = agentSettingsProfileFor(agent);
  if (profile.length === 0) return buildAgentCard(agent);
  const current = sanitizeAgentSettings(agent, source ?? defaultAgentSettings(agent));
  const values = profile.map((definition) => (
    `<b>${escapeHtml(definition.label)}:</b> ${escapeHtml(agentSettingLabel(definition, current[definition.key]))}`
  ));
  const controls = profile.map((definition) => [
    backButton(
      `${definition.label}: ${agentSettingLabel(definition, current[definition.key])}`,
      `agentcycle:${agent.id}:${definition.key}`
    )
  ]);

  return {
    text: `<b>⚙️ параметры агента «${escapeHtml(lower(agent.name))}»</b>\n\n${values.join('\n')}\n\nвыбранные параметры применяются к следующим запросам этого агента.`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...controls,
        [
          { text: 'сбросить', callback_data: `agentsettings:reset:${agent.id}`, style: 'danger' },
          { text: 'готово', callback_data: `agent:${agent.id}`, style: 'success' }
        ],
        ...navigationRows(`agent:${agent.id}`, '‹ назад к карточке')
      ]
    }
  };
}

export function buildAgentSettingOptionsMessage(agentOrId, key, source) {
  const agent = resolveAgent(agentOrId);
  if (!agent) return buildAgentCatalogMenu();
  const profile = agentSettingsProfileFor(agent);
  const definition = profile.find((entry) => entry.key === key);
  if (!definition) return buildAgentSettingsMessage(agent, source);
  const current = sanitizeAgentSettings(agent, source ?? defaultAgentSettings(agent));

  return {
    text: `<b>⚙️ ${escapeHtml(definition.label)}</b>\n\nвыбери нужный вариант для агента «${escapeHtml(lower(agent.name))}».`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...definition.values.map(({ value, label }) => [{
          text: `${current[key] === value ? '✓ ' : ''}${label}`,
          callback_data: `agentset:${agent.id}:${key}:${value}`
        }]),
        ...navigationRows(`agentsettings:${agent.id}`, '‹ назад к параметрам')
      ]
    }
  };
}

export function buildAgentSelectedMessage(agentOrId) {
  return buildAgentCard(agentOrId);
}
