import { getAgentById } from './agent-catalog.js';
import { cycleSettingValue } from './settings-cycle.js';

function option(value, label, instruction) {
  return Object.freeze({ value, label, instruction });
}

function definition(key, label, defaultValue, values) {
  return Object.freeze({
    key,
    label,
    defaultValue,
    values: Object.freeze(values)
  });
}

const definitions = Object.freeze({
  depth: definition('depth', 'глубина разбора', 'normal', [
    option('quick', 'быстро', 'дай короткий практический разбор без второстепенных деталей.'),
    option('normal', 'обычно', 'дай сбалансированный разбор с основными основаниями и выводами.'),
    option('deep', 'подробно', 'разбери существенные детали, допущения, риски и ограничения.')
  ]),
  toneCopy: definition('tone', 'тон текста', 'neutral', [
    option('neutral', 'нейтрально', 'пиши нейтрально и без рекламного нажима.'),
    option('business', 'делово', 'пиши деловым языком, прямо и конкретно.'),
    option('warm', 'дружелюбно', 'пиши дружелюбно, сохраняя точность.'),
    option('sales', 'продающе', 'усиль коммерческую подачу, не добавляя неподтверждённых обещаний.')
  ]),
  toneTranslation: definition('tone', 'стиль перевода', 'preserve', [
    option('preserve', 'сохранить оригинал', 'сохрани регистр и интонацию исходного текста.'),
    option('natural', 'естественно', 'адаптируй формулировки под естественную речь на целевом языке.'),
    option('formal', 'формально', 'используй формальный деловой регистр.')
  ]),
  toneRewrite: definition('tone', 'тон новой версии', 'preserve', [
    option('preserve', 'сохранить', 'сохрани тон исходного текста.'),
    option('neutral', 'нейтрально', 'сделай тон нейтральным.'),
    option('business', 'делово', 'сделай тон деловым и прямым.'),
    option('friendly', 'дружелюбно', 'сделай тон дружелюбным без фамильярности.')
  ]),
  length: definition('length', 'объём результата', 'normal', [
    option('short', 'короче', 'сожми результат и оставь только необходимое.'),
    option('normal', 'обычно', 'сохрани обычный объём без искусственного сокращения или раздувания.'),
    option('long', 'подробнее', 'раскрой материал подробнее, если исходных данных достаточно.')
  ]),
  variants: definition('variants', 'число вариантов', '3', [
    option('1', '1 вариант', 'подготовь один основной вариант.'),
    option('3', '3 варианта', 'подготовь три заметно различающихся варианта.'),
    option('5', '5 вариантов', 'подготовь пять заметно различающихся вариантов.')
  ]),
  ideaVariants: definition('variants', 'число идей', '10', [
    option('5', '5 идей', 'подготовь пять различающихся идей.'),
    option('10', '10 идей', 'подготовь десять различающихся идей.'),
    option('20', '20 идей', 'подготовь двадцать различающихся идей без повторов.')
  ]),
  editLevel: definition('edit_level', 'глубина редактуры', 'normal', [
    option('light', 'бережно', 'исправляй только явные проблемы и сохраняй исходную структуру.'),
    option('normal', 'обычно', 'исправляй смысл, структуру и язык там, где это улучшает текст.'),
    option('deep', 'глубоко', 'разрешена глубокая перестройка текста при сохранении фактов и голоса автора.')
  ]),
  changes: definition('changes', 'комментарии к правкам', 'important', [
    option('result', 'только результат', 'верни чистовой результат без перечня правок.'),
    option('important', 'важные правки', 'после результата кратко объясни только существенные изменения.'),
    option('all', 'все правки', 'после результата перечисли внесённые изменения по группам.')
  ]),
  sources: definition('sources', 'требования к источникам', 'official', [
    option('primary', 'первичные', 'опирайся прежде всего на первичные источники.'),
    option('official', 'официальные и профильные', 'отдавай приоритет официальным и профильным источникам.'),
    option('reliable', 'любые надёжные', 'можно использовать любые надёжные источники с понятным происхождением.')
  ]),
  learningLevel: definition('learning_level', 'уровень объяснения', 'middle', [
    option('beginner', 'начальный', 'объясняй с базовых понятий и расшифровывай термины.'),
    option('middle', 'средний', 'считай базовые понятия знакомыми, сложные шаги объясняй.'),
    option('advanced', 'продвинутый', 'используй профессиональные термины и задачи повышенной сложности.')
  ]),
  teachingMode: definition('teaching_mode', 'режим обучения', 'steps', [
    option('hints', 'подсказки', 'веди к решению вопросами и подсказками, не раскрывай ответ сразу.'),
    option('steps', 'по шагам', 'объясняй решение последовательно, по одному смысловому шагу.'),
    option('answer', 'сразу решение', 'сначала покажи готовое решение, затем коротко объясни ход.')
  ]),
  corrections: definition('corrections', 'исправление ошибок', 'after', [
    option('important', 'только важные', 'исправляй только ошибки, которые мешают пониманию или регулярно повторяются.'),
    option('after', 'после ответа', 'сначала продолжай диалог, затем кратко исправляй ошибки.'),
    option('immediate', 'сразу', 'исправляй существенные ошибки сразу перед продолжением диалога.')
  ]),
  codeScope: definition('code_scope', 'масштаб изменений', 'minimal', [
    option('minimal', 'минимальный патч', 'вноси минимальный патч без соседнего рефакторинга.'),
    option('normal', 'обычные правки', 'можно менять соседний код, если это прямо требуется для корректного решения.'),
    option('refactor', 'можно рефакторить', 'разрешён ограниченный рефакторинг, если он подтверждён тестами и уменьшает риск.')
  ]),
  reviewScope: definition('review_scope', 'глубина ревью', 'important', [
    option('blocking', 'только блокирующие', 'показывай только ошибки, из-за которых изменение нельзя принимать.'),
    option('important', 'важные замечания', 'показывай блокирующие и существенные замечания, без мелкой стилистики.'),
    option('all', 'все замечания', 'добавь мелкие замечания после блокирующих и существенных.')
  ]),
  testDepth: definition('test_depth', 'объём проверки', 'standard', [
    option('smoke', 'smoke', 'подготовь короткую smoke-проверку основных сценариев.'),
    option('standard', 'стандартно', 'покрой основные сценарии, границы и типовые ошибки.'),
    option('full', 'полностью', 'подготовь расширенную регрессионную проверку с редкими и ошибочными состояниями.')
  ]),
  punctuation: definition('punctuation', 'авторская пунктуация', 'normalize', [
    option('preserve', 'сохранить', 'сохраняй осознанную авторскую пунктуацию, исправляя только явные ошибки.'),
    option('normalize', 'нормализовать', 'приведи пунктуацию к нормативному нейтральному оформлению.')
  ]),
  boldness: definition('boldness', 'характер идей', 'balanced', [
    option('practical', 'практичные', 'предлагай прежде всего реалистичные идеи с низким порогом запуска.'),
    option('balanced', 'сбалансированные', 'смешай практичные и более смелые направления.'),
    option('unusual', 'необычные', 'ищи неожиданные направления, но соблюдай заданные ограничения.')
  ])
});

const assignments = Object.freeze({
  business_lawyer: ['depth'],
  accountant: ['depth'],
  copywriter: ['toneCopy', 'length', 'variants'],
  editor: ['editLevel', 'changes'],
  article_author: ['length', 'sources'],
  fact_checker: ['depth', 'sources'],
  developer: ['codeScope', 'depth'],
  code_reviewer: ['reviewScope'],
  qa_engineer: ['testDepth'],
  data_analyst: ['depth'],
  tutor: ['learningLevel', 'teachingMode'],
  language_teacher: ['learningLevel', 'corrections'],
  examiner: ['depth'],
  translator: ['toneTranslation', 'changes'],
  abstract_writer: ['length'],
  proofreader: ['punctuation', 'changes'],
  paraphraser: ['toneRewrite', 'length'],
  document_analyst: ['depth'],
  spreadsheet_analyst: ['depth'],
  researcher: ['depth', 'sources'],
  idea_generator: ['boldness', 'ideaVariants']
});

function resolveAgent(agentOrId) {
  if (typeof agentOrId === 'string') return getAgentById(agentOrId);
  if (!agentOrId || typeof agentOrId !== 'object') return null;
  return getAgentById(agentOrId.id);
}

export function agentSettingsProfileFor(agentOrId) {
  const agent = resolveAgent(agentOrId);
  if (!agent) return Object.freeze([]);
  const definitionIds = [...new Set(['depth', 'length', ...(assignments[agent.id] ?? [])])];
  const uniqueKeys = new Set();
  return Object.freeze(definitionIds.flatMap((id) => {
    const item = definitions[id];
    if (!item || uniqueKeys.has(item.key)) return [];
    uniqueKeys.add(item.key);
    return [item];
  }));
}

export function defaultAgentSettings(agentOrId) {
  return Object.freeze(Object.fromEntries(
    agentSettingsProfileFor(agentOrId).map(({ key, defaultValue }) => [key, defaultValue])
  ));
}

export function applyAgentSetting(agentOrId, source, key, value) {
  const current = sanitizeAgentSettings(agentOrId, source);
  const selected = agentSettingsProfileFor(agentOrId)
    .find((definitionItem) => definitionItem.key === key);
  if (!selected?.values.some((entry) => entry.value === value)) return current;
  return Object.freeze({ ...current, [key]: value });
}

export function cycleAgentSetting(agentOrId, source, key) {
  const current = sanitizeAgentSettings(agentOrId, source);
  const selected = agentSettingsProfileFor(agentOrId)
    .find((definitionItem) => definitionItem.key === key);
  return selected ? cycleSettingValue(current, selected) : current;
}

export function sanitizeAgentSettings(agentOrId, source = {}) {
  const safeSource = source && typeof source === 'object' && !Array.isArray(source)
    ? source
    : {};
  return Object.freeze(Object.fromEntries(
    agentSettingsProfileFor(agentOrId).map((definitionItem) => {
      const candidate = String(safeSource[definitionItem.key] ?? '');
      const allowed = definitionItem.values.some(({ value }) => value === candidate);
      return [
        definitionItem.key,
        allowed ? candidate : definitionItem.defaultValue
      ];
    })
  ));
}

export function sanitizeAgentSettingsStore(source = {}) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
  return Object.fromEntries(
    Object.entries(source).flatMap(([agentId, values]) => {
      if (agentSettingsProfileFor(agentId).length === 0) return [];
      return [[agentId, sanitizeAgentSettings(agentId, values)]];
    })
  );
}

export function agentSettingInstructions(agentOrId, source = {}) {
  const profile = agentSettingsProfileFor(agentOrId);
  if (profile.length === 0) return '';
  const current = sanitizeAgentSettings(agentOrId, source);
  const selected = profile.map((definitionItem) => (
    definitionItem.values.find(({ value }) => value === current[definitionItem.key])
  ));
  return `настройки ответа пользователя: ${selected.map(({ instruction }) => instruction).join(' ')} параметры не заменяют обязательные уточнения по текущей задаче.`;
}
