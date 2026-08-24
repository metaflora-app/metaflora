import { quoteMusicRouteMetacoins } from './music-provider-contracts.js';
import { metacoinHtml } from './brand-icons.js';
import { getAudioWorkflowById, listAudioWorkflows } from './audio-workflow-catalog.js';

const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const navigationRows = (backData, backText = '‹ назад к карточке') => [
  [{ text: '👤 профиль', callback_data: 'task:profile' }],
  [
    { text: backText, callback_data: backData },
    { text: '🏠 главное меню', callback_data: 'task:menu' }
  ]
];

export const MUSIC_STYLE_PRESETS = deepFreeze([
  ['indie_folk', 'инди-фолк', 'мягкий инди-фолк, акустическая гитара, тёплая камерная подача'],
  ['dark_pop', 'тёмный поп', 'тёмный минимал-поп, глубокий бас, сдержанная эмоциональная подача'],
  ['dance_pop', 'танцевальный поп', 'энергичный dance-pop, яркий припев, плотный современный бит'],
  ['piano_pop', 'фортепианный поп', 'фортепианный поп, выразительная мелодия, постепенное развитие'],
  ['synthwave', 'синтвейв', 'синтвейв, аналоговые синтезаторы, пульсирующий бас, ночная атмосфера'],
  ['melodic_edm', 'мелодичный EDM', 'мелодичный EDM, эмоциональный билд-ап, широкий фестивальный припев'],
  ['house', 'хаус', 'современный хаус, ровный танцевальный грув, воздушные синтезаторы'],
  ['drum_bass', 'drum & bass', 'мелодичный drum and bass, быстрые брейкбиты, энергичный бас'],
  ['hip_hop', 'хип-хоп', 'современный хип-хоп, плотный бит, выразительный речитатив'],
  ['trap', 'трэп', 'атмосферный трэп, глубокий 808-бас, редкая мелодия, чёткий речитатив'],
  ['rnb', 'R&B', 'кинематографичный R&B, мягкий грув, насыщенные гармонии'],
  ['soul', 'соул', 'эмоциональный соул, живая ритм-секция, богатые вокальные гармонии'],
  ['funk', 'фанк', 'грувовый фанк, живая бас-гитара, ритмичные гитары и духовые'],
  ['rock', 'рок', 'современный рок, живые барабаны, перегруженные гитары, сильный припев'],
  ['indie_rock', 'инди-рок', 'инди-рок, сухие барабаны, мелодичные гитары, естественная подача'],
  ['metal', 'метал', 'тяжёлый метал, плотные гитары, двойная бочка, драматичное развитие'],
  ['country', 'кантри', 'современное кантри, акустическая гитара, скрипка, ясный сюжет'],
  ['jazz', 'джаз', 'камерный джаз, контрабас, фортепиано, щётки, свободная динамика'],
  ['lofi', 'лоу-фай', 'спокойный lo-fi hip-hop, тёплый шум плёнки, мягкое фортепиано'],
  ['ambient', 'эмбиент', 'воздушный эмбиент, медленное развитие, мягкие текстуры без резких ударов'],
  ['cinematic', 'киношная музыка', 'кинематографичная оркестровая музыка, нарастающее напряжение, большой финал'],
  ['acoustic', 'акустика', 'акустическая баллада, гитара и фортепиано, близкая камерная запись'],
  ['kids', 'детская', 'добрая детская песня, простая запоминающаяся мелодия, лёгкие инструменты'],
  ['commercial', 'рекламная', 'короткая яркая рекламная музыка, быстрый хук, чистый современный звук']
].map(([id, name, prompt]) => ({ id, name, prompt })));

const PRESETS_BY_ID = new Map(MUSIC_STYLE_PRESETS.map((item) => [item.id, item]));
export const MUSIC_PERFORMER_PRESETS = deepFreeze([
  ['drake', 'Drake', ['hip-hop', 'trap', 'мужской вокал']],
  ['bruno_mars', 'Bruno Mars', ['funk', 'dance-pop', 'грув', 'мужской вокал']],
  ['fleetwood_mac', 'Fleetwood Mac', ['classic rock', 'мелодичный', 'гармонии']],
  ['ed_sheeran', 'Ed Sheeran', ['folk', 'акустическая гитара', 'мужской вокал']],
  ['tim_mcgraw', 'Tim McGraw', ['country', 'americana', 'мужской вокал']],
  ['elton_john', 'Elton John', ['piano pop-rock', 'театральный', 'мужской вокал']],
  ['avicii', 'Avicii', ['EDM', 'мелодичный', 'эйфоричный']],
  ['adele', 'Adele', ['soul', 'эмоциональный', 'женский вокал']],
  ['ariana_grande', 'Ariana Grande', ['pop', 'dance-pop', 'воздушный', 'женский вокал']],
  ['billie_eilish', 'Billie Eilish', ['pop', 'тёмный', 'минимализм', 'женский вокал']],
  ['the_weeknd', 'The Weeknd', ['R&B', 'тёмный', 'кинематографичный', 'мужской вокал']],
  ['dua_lipa', 'Dua Lipa', ['dance-pop', 'disco', 'уверенный', 'женский вокал']],
  ['lady_gaga', 'Lady Gaga', ['pop', 'театральный', 'dance', 'женский вокал']],
  ['taylor_swift', 'Taylor Swift', ['pop', 'storytelling', 'мелодичный', 'женский вокал']],
  ['lana_del_rey', 'Lana Del Rey', ['dream-pop', 'кинематографичный', 'женский вокал']],
  ['sia', 'Sia', ['pop', 'драматичный', 'мощный', 'женский вокал']],
  ['rihanna', 'Rihanna', ['pop', 'R&B', 'ритмичный', 'женский вокал']],
  ['beyonce', 'Beyoncé', ['R&B', 'soul', 'мощный', 'женский вокал']],
  ['amy_winehouse', 'Amy Winehouse', ['soul', 'jazz', 'ретро', 'женский вокал']],
  ['norah_jones', 'Norah Jones', ['jazz-pop', 'камерный', 'мягкий', 'женский вокал']],
  ['coldplay', 'Coldplay', ['alternative rock', 'атмосферный', 'мужской вокал']],
  ['imagine_dragons', 'Imagine Dragons', ['pop-rock', 'эпичный', 'мужской вокал']],
  ['linkin_park', 'Linkin Park', ['alternative rock', 'электроника', 'напряжённый']],
  ['arctic_monkeys', 'Arctic Monkeys', ['indie rock', 'гитарный', 'мужской вокал']],
  ['tame_impala', 'Tame Impala', ['psychedelic pop', 'синтезаторы', 'мужской вокал']],
  ['radiohead', 'Radiohead', ['alternative', 'экспериментальный', 'мужской вокал']],
  ['daft_punk', 'Daft Punk', ['electronic', 'disco', 'роботизированный вокал']],
  ['calvin_harris', 'Calvin Harris', ['EDM', 'dance-pop', 'клубный']],
  ['skrillex', 'Skrillex', ['dubstep', 'bass music', 'агрессивный']],
  ['kendrick_lamar', 'Kendrick Lamar', ['hip-hop', 'storytelling', 'мужской вокал']],
  ['eminem', 'Eminem', ['hip-hop', 'быстрый речитатив', 'мужской вокал']],
  ['post_malone', 'Post Malone', ['pop-rap', 'мелодичный', 'мужской вокал']],
  ['hozier', 'Hozier', ['folk-soul', 'госпел', 'мужской вокал']],
  ['hans_zimmer', 'Hans Zimmer', ['cinematic', 'оркестр', 'эпичный инструментал']],
  ['ludovico_einaudi', 'Ludovico Einaudi', ['неоклассика', 'фортепиано', 'инструментал']],
  ['max_richter', 'Max Richter', ['неоклассика', 'струнные', 'кинематографичный инструментал']]
].map(([id, name, tags]) => ({ id, name, tags, prompt: tags.join(', ') })));
const PERFORMERS_BY_ID = new Map(MUSIC_PERFORMER_PRESETS.map((item) => [item.id, item]));
const DURATIONS = Object.freeze([30, 60, 90, 120, 180, 240, 300, 420, 600]);
const CUSTOM_DURATION_IDS = new Set(['music_instrumental', 'music_jingle', 'music_loop']);

const requiredInputsAreTextOnly = (workflow) => workflow.inputs.every(
  (input) => !input.required || input.type === 'text'
);

export function isMusicConstructorWorkflowId(workflowId) {
  const workflow = getAudioWorkflowById(workflowId);
  return Boolean(
    workflow
    && workflow.kind === 'music'
    && workflow.categoryId === 'music_create'
    && requiredInputsAreTextOnly(workflow)
  );
}

export function listMusicConstructorWorkflowIds() {
  return Object.freeze(listAudioWorkflows({ kind: 'music' })
    .filter((workflow) => workflow.categoryId === 'music_create')
    .filter(requiredInputsAreTextOnly)
    .map(({ id }) => id));
}

function musicWorkflow(workflowId) {
  const workflow = getAudioWorkflowById(workflowId);
  if (!workflow || !isMusicConstructorWorkflowId(workflowId)) {
    throw new RangeError('этот музыкальный сценарий пока не поддерживает конструктор');
  }
  return workflow;
}

function defaultDurationSeconds(workflow) {
  const parameter = workflow.parameters.find(({ id }) => id === 'duration_seconds');
  return Number(parameter?.default ?? (workflow.id === 'music_song' ? 120 : 90));
}

function defaultInstrumental(workflow) {
  if (workflow.id === 'music_instrumental') return true;
  if (workflow.id === 'music_song') return false;
  return Boolean(workflow.parameters.find(({ id }) => id === 'instrumental')?.default);
}

export function createMusicDraft(workflowId = 'music_song') {
  const workflow = musicWorkflow(workflowId);
  const instrumental = defaultInstrumental(workflow);
  return deepFreeze({
    workflowId,
    prompt: '',
    instrumental,
    lyricsMode: workflowId === 'music_song' && !instrumental ? 'auto' : 'none',
    lyricsText: '',
    styleText: '',
    stylePresetId: null,
    performerPresetId: null,
    durationSeconds: defaultDurationSeconds(workflow),
    referenceAudioUrl: null,
    awaiting: null
  });
}

function boundedText(value, label, maximum) {
  const normalized = String(value ?? '').trim();
  if (normalized.length > maximum) throw new RangeError(`${label} слишком длинный`);
  return normalized;
}

export function applyMusicSetting(draft, field, value) {
  if (!draft || typeof draft !== 'object') throw new TypeError('музыкальный черновик не найден');
  let patch;
  if (field === 'instrumental') {
    if (!hasInstrumentalControl(draft)) throw new RangeError('неверный режим инструментала');
    const instrumental = value === 'cycle' ? !draft.instrumental : Boolean(value);
    patch = {
      instrumental,
      lyricsMode: draft.workflowId === 'music_song' && !instrumental ? 'auto' : 'none',
      lyricsText: ''
    };
  } else if (field === 'lyrics') {
    if (draft.workflowId !== 'music_song' || !['auto', 'custom'].includes(value) || draft.instrumental) throw new RangeError('неверный режим текста песни');
    patch = { lyricsMode: value, lyricsText: value === 'auto' ? '' : draft.lyricsText };
  } else if (field === 'duration') {
    const durationSeconds = Number(value);
    const durations = durationRows(draft);
    if (!durations.includes(durationSeconds)) throw new RangeError('неверная длительность');
    patch = { durationSeconds };
  } else if (field === 'preset') {
    const preset = PRESETS_BY_ID.get(String(value));
    if (!preset) throw new RangeError('музыкальный пресет не найден');
    patch = { stylePresetId: preset.id, performerPresetId: null, styleText: preset.prompt };
  } else if (field === 'performer') {
    const performer = PERFORMERS_BY_ID.get(String(value));
    if (!performer) throw new RangeError('исполнитель не найден');
    patch = { performerPresetId: performer.id, stylePresetId: null, styleText: performer.prompt };
  } else if (field === 'prompt') {
    patch = { prompt: boundedText(value, 'промпт', 10_000), awaiting: null };
  } else if (field === 'styleText') {
    patch = { styleText: boundedText(value, 'описание стиля', 300), stylePresetId: null, performerPresetId: null, awaiting: null };
  } else if (field === 'lyricsText') {
    patch = { lyricsText: boundedText(value, 'текст песни', 3_000), awaiting: null };
  } else if (field === 'referenceAudioUrl') {
    const normalized = String(value ?? '').trim();
    let parsed;
    try { parsed = new URL(normalized); } catch { throw new RangeError('неверная ссылка на аудиореференс'); }
    if (parsed.protocol !== 'https:') throw new RangeError('неверная ссылка на аудиореференс');
    patch = { referenceAudioUrl: parsed.toString(), awaiting: null };
  } else if (field === 'awaiting') {
    if (![null, 'prompt', 'styleText', 'lyricsText', 'referenceAudio'].includes(value)) throw new RangeError('неверное состояние ввода');
    patch = { awaiting: value };
  } else {
    throw new RangeError('неизвестный музыкальный параметр');
  }
  return deepFreeze({ ...draft, ...patch });
}

export function clearMusicPrompt(draft) {
  return applyMusicSetting(draft, 'prompt', '');
}

function selectedContract(draft) {
  if (draft.referenceAudioUrl && draft.lyricsMode === 'custom') return 'replicate_minimax_music_01';
  if (draft.workflowId === 'music_song' && !draft.instrumental && draft.lyricsMode === 'custom') {
    return 'fal_minimax_music_v2';
  }
  return 'polza_suno_generate';
}

export function musicDraftQuote(draft) {
  const contractId = selectedContract(draft);
  const missing = [];
  if (!draft.prompt && !(draft.lyricsMode === 'custom' && draft.lyricsText)) missing.push('промпт');
  if (contractId === 'fal_minimax_music_v2') {
    if (!draft.styleText) missing.push('стиль');
    if (!draft.lyricsText) missing.push('текст песни');
  }
  if (contractId === 'replicate_minimax_music_01' && !draft.lyricsText) missing.push('текст песни');
  if (
    contractId === 'polza_suno_generate'
    && [draft.styleText, draft.prompt].filter(Boolean).join('. ').length > 500
  ) missing.push('промпт до 500 символов');
  return deepFreeze({
    contractId,
    metacoins: quoteMusicRouteMetacoins(contractId, { durationSeconds: draft.durationSeconds }),
    ready: missing.length === 0,
    missing
  });
}

const short = (value, empty = 'не добавлен') => value
  ? escapeHtml(value.length > 80 ? `${value.slice(0, 77)}…` : value)
  : empty;

function modeLabel(draft) {
  if (draft.workflowId === 'music_song' || draft.workflowId === 'music_instrumental') {
    return draft.instrumental ? 'инструментал' : 'песня с вокалом';
  }
  return musicWorkflow(draft.workflowId).name;
}

function hasInstrumentalControl(draft) {
  if (draft.workflowId === 'music_song' || draft.workflowId === 'music_instrumental') return true;
  return musicWorkflow(draft.workflowId).parameters.some(({ id, type }) => id === 'instrumental' && type === 'boolean');
}

function supportsDurationControl(draft, quote) {
  if (['fal_minimax_music_v2', 'replicate_minimax_music_01'].includes(quote.contractId)) return false;
  return musicWorkflow(draft.workflowId).parameters.some(({ id }) => id === 'duration_seconds')
    || draft.workflowId === 'music_song'
    || draft.workflowId === 'music_instrumental';
}

function durationRows(draft) {
  if (!CUSTOM_DURATION_IDS.has(draft.workflowId)) return DURATIONS;
  const parameter = musicWorkflow(draft.workflowId).parameters.find(({ id }) => id === 'duration_seconds');
  const min = Number(parameter?.min);
  const max = Number(parameter?.max);
  const step = Number(parameter?.step) || 1;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return DURATIONS;
  const values = new Set([min, draft.durationSeconds, max]);
  for (let value = min; value <= max && values.size < 9; value += step * Math.max(1, Math.ceil((max - min) / (step * 8)))) {
    values.add(value);
  }
  return Object.freeze([...values].sort((left, right) => left - right).slice(0, 9));
}

export function buildMusicSettingsMessage(draft) {
  const quote = musicDraftQuote(draft);
  const songWithVocals = draft.workflowId === 'music_song' && !draft.instrumental;
  const lyricsLine = songWithVocals ? `\n<b>текст песни:</b> ${draft.lyricsMode === 'auto' ? 'создать автоматически' : short(draft.lyricsText)}` : '';
  const referenceLine = draft.referenceAudioUrl ? '\n<b>аудиореференс:</b> добавлен' : '';
  const showDuration = supportsDurationControl(draft, quote);
  return {
    text: `<b>⚙️ параметры</b>\n\n<b>результат:</b> ${modeLabel(draft)}\n<b>стиль:</b> ${short(draft.styleText)}${lyricsLine}${referenceLine}${showDuration ? `\n<b>длительность:</b> ${draft.durationSeconds} сек` : ''}\n\n<b>стоимость: ${metacoinHtml()} ${quote.metacoins} метакоинов</b>`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...(hasInstrumentalControl(draft) ? [[{ text: `🎙 ${modeLabel(draft)}`, callback_data: 'musicset:instrumental:cycle' }]] : []),
        [{ text: '🎛 стиль', callback_data: 'musicset:style:open' }],
        [{ text: '🎤 исполнители', callback_data: 'musicset:performer:open' }],
        ...(songWithVocals ? [[{ text: '📝 текст песни', callback_data: 'musicset:lyrics:open' }]] : []),
        ...(songWithVocals && draft.lyricsMode === 'custom' ? [[{ text: `🎧 аудиореференс${draft.referenceAudioUrl ? ' · добавлен' : ''}`, callback_data: 'musicset:reference:open' }]] : []),
        ...(showDuration ? [[{ text: `⏱ длительность: ${draft.durationSeconds} сек`, callback_data: 'musicset:duration:open' }]] : []),
        ...(draft.prompt ? [[{ text: '🗑 удалить промпт', callback_data: 'musicset:prompt:delete', style: 'danger' }]] : []),
        [{ text: 'готово', callback_data: 'musicset:confirm:open' }],
        ...navigationRows(`audioworkflow:${draft.workflowId}`)
      ]
    }
  };
}

export function buildMusicDurationMessage(draft) {
  const durations = durationRows(draft);
  const durationRowsMarkup = Array.from({ length: Math.ceil(durations.length / 3) }, (_, index) => durations.slice(index * 3, index * 3 + 3).map((seconds) => ({
    text: `${seconds === draft.durationSeconds ? '✓ ' : ''}${seconds} сек`,
    callback_data: `musicset:duration:${seconds}`
  })));
  return {
    text: '<b>⏱ длительность</b>\n\nвыбери длину трека. стоимость считается по фактическому тарифу выбранного маршрута.',
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [...durationRowsMarkup, ...navigationRows('musicsettings:home', '‹ назад к параметрам')] }
  };
}

export function buildMusicStyleMessage(draft) {
  const presetRows = Array.from({ length: Math.ceil(MUSIC_STYLE_PRESETS.length / 2) }, (_, index) =>
    MUSIC_STYLE_PRESETS.slice(index * 2, index * 2 + 2).map((preset) => ({
      text: `${preset.id === draft.stylePresetId ? '✓ ' : ''}${preset.name}`,
      callback_data: `musicpreset:${preset.id}`
    }))
  );
  return {
    text: `<b>🎛 стиль музыки</b>\n\nвыбери готовое звучание или опиши своё: жанр, настроение, темп, инструменты и характер вокала.\n\n<b>сейчас:</b> ${short(draft.styleText)}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '✍️ описать свой стиль', callback_data: 'musicset:style:custom' }],
        ...presetRows,
        ...navigationRows('musicsettings:home', '‹ назад к параметрам')
      ]
    }
  };
}

export function buildMusicPerformerMessage(draft, { page = 0 } = {}) {
  const pageSize = 8;
  const totalPages = Math.ceil(MUSIC_PERFORMER_PRESETS.length / pageSize);
  const safePage = Math.max(0, Math.min(totalPages - 1, Number(page) || 0));
  const items = MUSIC_PERFORMER_PRESETS.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const lines = items.map(({ name, tags }) => `<b>${escapeHtml(name)}</b> · ${escapeHtml(tags.join(' · '))}`);
  return {
    text: `<b>🎤 исполнители</b>\n\nвыбери исполнителя, чтобы подставить жанр, настроение и тип вокала. стиль после выбора можно отредактировать.\n\n${lines.join('\n')}\n\n${safePage + 1} из ${totalPages}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...items.map(({ id, name }) => [{ text: `${id === draft.performerPresetId ? '✓ ' : ''}${name}`, callback_data: `musicperformer:${id}` }]),
        [
          { text: '‹', callback_data: `musicperformers:${Math.max(0, safePage - 1)}` },
          { text: '›', callback_data: `musicperformers:${Math.min(totalPages - 1, safePage + 1)}` }
        ],
        ...navigationRows('musicsettings:home', '‹ назад к параметрам')
      ]
    }
  };
}

export function buildMusicLyricsMessage(draft) {
  if (draft.workflowId !== 'music_song' || draft.instrumental) return buildMusicSettingsMessage(draft);
  return {
    text: `<b>📝 текст песни</b>\n\nбот может написать текст по промпту или использовать твой готовый текст. для своего текста пришли куплеты и припев одним сообщением.\n\n<b>режим:</b> ${draft.lyricsMode === 'custom' ? 'свой текст' : 'создать автоматически'}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: `${draft.lyricsMode === 'auto' ? '✓ ' : ''}создать автоматически`, callback_data: 'musicset:lyrics:auto' }],
        [{ text: `${draft.lyricsMode === 'custom' ? '✓ ' : ''}свой текст`, callback_data: 'musicset:lyrics:custom' }],
        ...navigationRows('musicsettings:home', '‹ назад к параметрам')
      ]
    }
  };
}

export function buildMusicInputPrompt(draft, field) {
  const content = field === 'prompt'
    ? 'пришли идею песни или точное описание результата одним сообщением.'
    : field === 'styleText'
      ? 'пришли описание стиля до 300 символов: жанр, темп, настроение, инструменты и характер вокала.'
      : 'пришли готовый текст песни одним сообщением, до 3000 символов.';
  return {
    text: `<b>✍️ ввод</b>\n\n${content}`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: navigationRows('musicsettings:home', '‹ назад к параметрам') }
  };
}

export function buildMusicConfirmationMessage(draft) {
  const quote = musicDraftQuote(draft);
  const createLabel = musicWorkflow(draft.workflowId).name;
  const showDuration = supportsDurationControl(draft, quote);
  return {
    text: `<b>👁‍🗨 проверь, что всё на месте</b>\n\n<b>результат:</b> ${modeLabel(draft)}\n<b>стиль:</b> ${short(draft.styleText, 'из промпта')}${draft.workflowId === 'music_song' && !draft.instrumental ? `\n<b>текст песни:</b> ${draft.lyricsMode === 'auto' ? 'создать автоматически' : short(draft.lyricsText)}` : ''}${showDuration ? `\n<b>длительность:</b> ${draft.durationSeconds} сек` : ''}\n<b>промпт:</b> ${short(draft.prompt)}\n\n<b>стоимость: ${metacoinHtml()} ${quote.metacoins} метакоинов</b>${quote.ready ? '' : `\n\nдобавь: ${quote.missing.join(', ')}.`}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...(quote.ready ? [[{ text: `▶️ ${createLabel}`, callback_data: 'musicrun:confirm' }]] : []),
        ...(draft.prompt ? [[{ text: '🗑 удалить промпт', callback_data: 'musicset:prompt:delete', style: 'danger' }]] : []),
        ...navigationRows('musicsettings:home', '‹ назад к параметрам')
      ]
    }
  };
}

export function musicProviderRequest(draft) {
  const quote = musicDraftQuote(draft);
  if (!quote.ready) throw new TypeError(`не заполнено: ${quote.missing.join(', ')}`);
  const inputs = quote.contractId === 'fal_minimax_music_v2'
    ? { prompt: draft.styleText, lyrics: draft.lyricsText }
    : quote.contractId === 'replicate_minimax_music_01'
      ? { lyrics: draft.lyricsText, referenceAudioUrl: draft.referenceAudioUrl }
      : { prompt: [draft.styleText, draft.prompt].filter(Boolean).join('. '), instrumental: draft.instrumental, durationSeconds: draft.durationSeconds };
  return deepFreeze({ contractId: quote.contractId, inputs, metacoins: quote.metacoins });
}
