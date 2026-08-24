import { providerCostUsdToMetacoins, repriceLegacyMetacoins } from './model-pricing.js';

const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
};

const textInput = (id, label, required = true) => ({ id, label, type: 'text', required });
const audioInput = (id, label, required = true) => ({ id, label, type: 'audio', required });
const videoInput = (id, label, required = true) => ({ id, label, type: 'video', required });
const imageInput = (id, label, required = false) => ({ id, label, type: 'image', required });
const voiceInput = (id, label, required = true) => ({ id, label, type: 'voice', required });

const enumParameter = (id, label, defaultValue, options) => ({
  id,
  label,
  type: 'enum',
  default: defaultValue,
  options
});

const booleanParameter = (id, label, defaultValue = false) => ({
  id,
  label,
  type: 'boolean',
  default: defaultValue
});

const numberParameter = (id, label, defaultValue, min, max, step) => ({
  id,
  label,
  type: 'number',
  default: defaultValue,
  min,
  max,
  step
});

const stringParameter = (id, label, defaultValue = '') => ({
  id,
  label,
  type: 'string',
  default: defaultValue
});

const price = (min, max, unit) => ({
  currency: 'METACOIN',
  min: repriceLegacyMetacoins(min),
  max: repriceLegacyMetacoins(max),
  unit
});

const providerPrice = (minUsd, maxUsd, unit) => ({
  currency: 'METACOIN',
  min: providerCostUsdToMetacoins(minUsd),
  max: providerCostUsdToMetacoins(maxUsd),
  unit
});

const routingStrategy = (requiredCapabilities, preferredProviders, fallbackPolicy) => ({
  requiredCapabilities,
  preferredProviders,
  fallbackPolicy
});

const workflow = ({
  id,
  kind,
  categoryId,
  name,
  description,
  instruction,
  highlight,
  customEmojiKey,
  customEmojiFallback,
  inputs,
  parameters,
  pricing,
  requiredCapabilities,
  preferredProviders
}) => deepFreeze({
  id,
  kind,
  categoryId,
  name,
  description,
  instruction,
  highlight,
  customEmojiKey,
  customEmojiFallback,
  inputs,
  parameters,
  pricing,
  routingStrategy: routingStrategy(
    requiredCapabilities,
    preferredProviders,
    'сначала используется доступный маршрут нужного качества, при технической ошибке выбирается совместимый запасной маршрут без повторного списания'
  )
});

export const AUDIO_WORKFLOW_CATEGORY_IDS = deepFreeze([
  'music_create',
  'music_rework',
  'music_finish',
  'voice_speak',
  'voice_transform',
  'voice_process'
]);

export const audioWorkflowCategories = deepFreeze([
  {
    id: 'music_create',
    kind: 'music',
    name: 'создать музыку',
    description: 'песни, инструменталы и короткие музыкальные формы с настройкой структуры, длительности и характера звучания.',
    customEmojiFallback: '🎵'
  },
  {
    id: 'music_rework',
    kind: 'music',
    name: 'переделать запись',
    description: 'продолжение, новая версия, ремикс, соединение и перепев готового музыкального материала.',
    customEmojiFallback: '🎛️'
  },
  {
    id: 'music_finish',
    kind: 'music',
    name: 'подготовить звук',
    description: 'разделение композиции, версия для караоке, финальная обработка и звуковая дорожка для сцены.',
    customEmojiFallback: '🎚️'
  },
  {
    id: 'voice_speak',
    kind: 'voice',
    name: 'озвучить текст',
    description: 'готовые голоса, длинные материалы, диалоги, рекламная подача и создание нового тембра по описанию.',
    customEmojiFallback: '🎙️'
  },
  {
    id: 'voice_transform',
    kind: 'voice',
    name: 'изменить голос',
    description: 'клонирование, замена тембра, дубляж, перевод с сохранением голоса и точечная правка реплик.',
    customEmojiFallback: '🗣️'
  },
  {
    id: 'voice_process',
    kind: 'voice',
    name: 'разобрать и очистить запись',
    description: 'расшифровка, разбор встреч, субтитры, очистка речи и сокращение записи с сохранением смысла.',
    customEmojiFallback: '🎧'
  }
]);

export const audioWorkflowCatalog = deepFreeze([
  workflow({
    id: 'music_song',
    kind: 'music',
    categoryId: 'music_create',
    name: 'создать песню',
    description: 'текст песни или короткая идея превращаются в законченный трек с куплетами, припевом и вокалом. можно задать жанр, темп, настроение, тип голоса и примерную длительность, а затем получить несколько версий для выбора.',
    instruction: 'пришли текст или опиши сюжет песни, затем укажи жанр, голос и желаемую длительность',
    highlight: 'законченный трек с куплетами, припевом и вокалом',
    customEmojiKey: 'music_song',
    customEmojiFallback: '🎤',
    inputs: [textInput('prompt', 'идея или текст песни'), audioInput('reference_audio', 'музыкальный референс', false), imageInput('cover_image', 'обложка для настроения', false)],
    parameters: [
      enumParameter('mode', 'режим', 'сбалансированно', ['быстрее', 'сбалансированно', 'лучшее качество']),
      enumParameter('vocal', 'вокал', 'автоматически', ['автоматически', 'мужской', 'женский', 'дуэт']),
      numberParameter('duration_seconds', 'длительность в секундах', 120, 30, 600, 30)
    ],
    pricing: price(9, 34, 'за песню'),
    requiredCapabilities: ['text_to_song', 'lyrics_control', 'vocal_generation'],
    preferredProviders: ['kie', 'fal', 'replicate']
  }),
  workflow({
    id: 'music_instrumental',
    kind: 'music',
    categoryId: 'music_create',
    name: 'создать инструментал',
    description: 'описание превращается в музыкальную дорожку без вокала. в настройках доступны жанр, темп, длительность и развитие композиции, поэтому результат можно использовать в ролике, подкасте, игре или презентации.',
    instruction: 'опиши жанр, инструменты и настроение, затем выбери длительность и формат результата',
    highlight: 'музыкальную дорожку без вокала',
    customEmojiKey: 'music_instrumental',
    customEmojiFallback: '🎹',
    inputs: [textInput('prompt', 'описание музыки'), audioInput('reference_audio', 'музыкальный референс', false)],
    parameters: [
      enumParameter('mode', 'режим', 'сбалансированно', ['быстрее', 'сбалансированно', 'лучшее качество']),
      enumParameter('structure', 'структура', 'с развитием', ['ровный фон', 'с развитием', 'с ярким финалом']),
      numberParameter('duration_seconds', 'длительность в секундах', 90, 10, 600, 10)
    ],
    pricing: providerPrice(0.15 * (10 / 60), 0.15 * 10, 'за дорожку'),
    requiredCapabilities: ['text_to_music', 'instrumental_only', 'duration_control'],
    preferredProviders: ['fal', 'kie', 'replicate']
  }),
  workflow({
    id: 'music_video_score',
    kind: 'music',
    categoryId: 'music_create',
    name: 'написать музыку к видео',
    description: 'видео получает музыкальную дорожку, которая следует монтажу, смене сцен и общему темпу. исходный звук можно оставить отдельным слоем, а ключевые моменты отметить вручную, если акцент должен попасть в конкретный кадр.',
    instruction: 'прикрепи видео, опиши характер музыки и при необходимости укажи важные моменты по времени',
    highlight: 'следует монтажу, смене сцен и общему темпу',
    customEmojiKey: 'music_video_score',
    customEmojiFallback: '🎞️',
    inputs: [videoInput('video', 'исходное видео'), textInput('prompt', 'описание музыки'), audioInput('reference_audio', 'музыкальный референс', false)],
    parameters: [
      enumParameter('mode', 'режим', 'сбалансированно', ['быстрее', 'сбалансированно', 'лучшее качество']),
      booleanParameter('keep_source_audio', 'сохранить исходный звук', true),
      stringParameter('cue_points', 'временные отметки для акцентов')
    ],
    pricing: price(7, 61, 'за минуту видео'),
    requiredCapabilities: ['video_to_audio', 'music_generation', 'timeline_alignment'],
    preferredProviders: ['fal', 'replicate']
  }),
  workflow({
    id: 'music_jingle',
    kind: 'music',
    categoryId: 'music_create',
    name: 'создать заставку',
    description: 'короткая идея превращается в законченную музыкальную заставку для канала, подкаста, рекламы или приложения. можно указать точную длительность, набор инструментов и характер финального удара, чтобы запись сразу легла в монтаж.',
    instruction: 'опиши задачу заставки, укажи длительность и выбери, нужен ли короткий вокальный слоган',
    highlight: 'точную длительность и характер финального удара',
    customEmojiKey: 'music_jingle',
    customEmojiFallback: '📻',
    inputs: [textInput('prompt', 'описание заставки'), textInput('slogan', 'текст слогана', false)],
    parameters: [
      enumParameter('mode', 'режим', 'сбалансированно', ['быстрее', 'сбалансированно', 'лучшее качество']),
      numberParameter('duration_seconds', 'длительность в секундах', 10, 3, 30, 1),
      booleanParameter('instrumental', 'без вокала', true)
    ],
    pricing: price(5, 45, 'за заставку'),
    requiredCapabilities: ['text_to_music', 'short_form_audio', 'exact_duration'],
    preferredProviders: ['fal', 'kie', 'replicate']
  }),
  workflow({
    id: 'music_loop',
    kind: 'music',
    categoryId: 'music_create',
    name: 'создать музыкальную петлю',
    description: 'описание превращается в зацикленный фрагмент без слышимого стыка между концом и началом. режим подходит для игры, трансляции, меню и фоновой сцены, где музыка должна повторяться без пауз и резких переходов.',
    instruction: 'опиши звучание, выбери длину одного цикла и укажи, какие инструменты должны остаться на переднем плане',
    highlight: 'без слышимого стыка между концом и началом',
    customEmojiKey: 'music_loop',
    customEmojiFallback: '🔁',
    inputs: [textInput('prompt', 'описание музыкальной петли'), audioInput('reference_audio', 'референс', false)],
    parameters: [
      enumParameter('mode', 'режим', 'сбалансированно', ['быстрее', 'сбалансированно', 'лучшее качество']),
      numberParameter('duration_seconds', 'длина цикла в секундах', 20, 5, 120, 1),
      enumParameter('ending', 'стык цикла', 'мягкий', ['мягкий', 'ритмический', 'с затуханием'])
    ],
    pricing: price(3, 12, 'за петлю'),
    requiredCapabilities: ['text_to_music', 'seamless_loop', 'exact_duration'],
    preferredProviders: ['fal', 'replicate']
  }),
  workflow({
    id: 'music_hum_to_track',
    kind: 'music',
    categoryId: 'music_create',
    name: 'собрать трек из напева',
    description: 'напетая мелодия становится основой полноценной аранжировки, при этом ход мелодии и ритмический рисунок исходника сохраняются. можно выбрать инструменты, стиль и наличие вокала, не записывая партии вручную.',
    instruction: 'прикрепи чистую запись напева, опиши желаемую аранжировку и выбери длительность трека',
    highlight: 'ход мелодии и ритмический рисунок исходника сохраняются',
    customEmojiKey: 'music_hum_to_track',
    customEmojiFallback: '🎶',
    inputs: [audioInput('melody_audio', 'запись напева'), textInput('prompt', 'описание аранжировки')],
    parameters: [
      enumParameter('mode', 'режим', 'лучшее качество', ['быстрее', 'сбалансированно', 'лучшее качество']),
      booleanParameter('keep_melody', 'точно сохранить мелодию', true),
      enumParameter('vocal', 'вокал в результате', 'без вокала', ['без вокала', 'оставить исходный', 'создать новый'])
    ],
    pricing: price(12, 38, 'за трек'),
    requiredCapabilities: ['audio_to_music', 'melody_conditioning', 'arrangement_generation'],
    preferredProviders: ['kie', 'fal', 'replicate']
  }),
  workflow({
    id: 'music_extend',
    kind: 'music',
    categoryId: 'music_rework',
    name: 'продолжить трек',
    description: 'к загруженному треку добавляется новый фрагмент с тем же темпом, тональностью и характером звучания. продолжение можно направить в припев, проигрыш или финал, а точку начала выбрать по временной отметке.',
    instruction: 'прикрепи трек, укажи точку продолжения и опиши, как должна развиваться следующая часть',
    highlight: 'с тем же темпом, тональностью и характером звучания',
    customEmojiKey: 'music_extend',
    customEmojiFallback: '⏭️',
    inputs: [audioInput('audio', 'исходный трек'), textInput('prompt', 'описание продолжения', false)],
    parameters: [
      enumParameter('section', 'новая часть', 'автоматически', ['автоматически', 'куплет', 'припев', 'проигрыш', 'финал']),
      numberParameter('start_second', 'начать с секунды', 0, 0, 600, 1),
      numberParameter('extension_seconds', 'длина продолжения', 30, 10, 180, 5)
    ],
    pricing: price(7, 24, 'за продолжение'),
    requiredCapabilities: ['music_extension', 'audio_conditioning', 'continuation_control'],
    preferredProviders: ['kie', 'fal', 'replicate']
  }),
  workflow({
    id: 'music_rework',
    kind: 'music',
    categoryId: 'music_rework',
    name: 'сделать новую версию',
    description: 'готовая композиция получает другое звучание при сохранении мелодии и структуры. можно сменить жанр, инструменты, темп или плотность аранжировки, а степень сходства с исходником регулируется отдельно.',
    instruction: 'прикрепи трек, опиши новое звучание и укажи, какие части исходника нужно сохранить без изменений',
    highlight: 'при сохранении мелодии и структуры',
    customEmojiKey: 'music_rework',
    customEmojiFallback: '🪄',
    inputs: [audioInput('audio', 'исходный трек'), textInput('prompt', 'описание новой версии')],
    parameters: [
      enumParameter('mode', 'режим', 'лучшее качество', ['быстрее', 'сбалансированно', 'лучшее качество']),
      numberParameter('source_strength', 'сходство с исходником', 70, 10, 100, 10),
      booleanParameter('keep_vocals', 'сохранить вокал', true)
    ],
    pricing: price(10, 34, 'за версию'),
    requiredCapabilities: ['music_to_music', 'style_transfer', 'source_strength'],
    preferredProviders: ['kie', 'fal', 'replicate']
  }),
  workflow({
    id: 'music_remix',
    kind: 'music',
    categoryId: 'music_rework',
    name: 'сделать ремикс',
    description: 'исходная композиция перестраивается под новый темп, ритм и клубную или спокойную подачу. вокал и узнаваемые музыкальные фразы можно сохранить, а вступление и финал подготовить под сведение с другими треками.',
    instruction: 'прикрепи композицию, укажи стиль ремикса, темп и части, которые должны остаться узнаваемыми',
    highlight: 'вступление и финал подготовить под сведение',
    customEmojiKey: 'music_remix',
    customEmojiFallback: '💿',
    inputs: [audioInput('audio', 'исходная композиция'), textInput('prompt', 'описание ремикса')],
    parameters: [
      enumParameter('mode', 'режим', 'лучшее качество', ['быстрее', 'сбалансированно', 'лучшее качество']),
      numberParameter('tempo_bpm', 'темп', 120, 60, 200, 1),
      booleanParameter('keep_vocals', 'сохранить вокал', true)
    ],
    pricing: price(12, 39, 'за ремикс'),
    requiredCapabilities: ['music_remix', 'tempo_control', 'stem_conditioning'],
    preferredProviders: ['kie', 'fal', 'replicate']
  }),
  workflow({
    id: 'music_mashup',
    kind: 'music',
    categoryId: 'music_rework',
    name: 'соединить треки',
    description: 'две композиции сводятся в одну версию с общей тональностью, темпом и согласованными переходами. можно выбрать основной трек, точку смены и части каждого исходника, которые должны попасть в результат.',
    instruction: 'прикрепи два трека, выбери основной и отметь желаемый порядок частей или момент перехода',
    highlight: 'с общей тональностью, темпом и согласованными переходами',
    customEmojiKey: 'music_mashup',
    customEmojiFallback: '🔀',
    inputs: [audioInput('primary_audio', 'первый трек'), audioInput('secondary_audio', 'второй трек'), textInput('prompt', 'описание соединения', false)],
    parameters: [
      enumParameter('main_track', 'основной трек', 'первый', ['первый', 'второй', 'поровну']),
      enumParameter('transition', 'переход', 'плавный', ['плавный', 'по удару', 'резкий']),
      numberParameter('duration_seconds', 'длительность результата', 180, 30, 600, 10)
    ],
    pricing: price(14, 42, 'за соединение'),
    requiredCapabilities: ['multi_audio_conditioning', 'tempo_matching', 'key_matching'],
    preferredProviders: ['fal', 'replicate']
  }),
  workflow({
    id: 'music_cover',
    kind: 'music',
    categoryId: 'music_rework',
    name: 'перепеть демо',
    description: 'черновая вокальная запись превращается в чистую исполненную версию с выбранным тембром и подачей. мелодия, слова и длительность сохраняются, а шум и неточные ноты исходного демо не переходят в готовую дорожку.',
    instruction: 'прикрепи демо и минус или полный трек, затем выбери голос и степень сохранения исходной подачи',
    highlight: 'мелодия, слова и длительность сохраняются',
    customEmojiKey: 'music_cover',
    customEmojiFallback: '🎙️',
    inputs: [audioInput('demo_audio', 'вокальное демо'), audioInput('backing_audio', 'минус или полный трек'), voiceInput('voice', 'голос', false)],
    parameters: [
      enumParameter('mode', 'режим', 'лучшее качество', ['сбалансированно', 'лучшее качество']),
      numberParameter('performance_strength', 'сохранить исходную подачу', 70, 10, 100, 10),
      booleanParameter('pitch_correction', 'исправить неточные ноты', true)
    ],
    pricing: price(16, 48, 'за перепев'),
    requiredCapabilities: ['singing_voice_conversion', 'melody_preservation', 'lyrics_preservation'],
    preferredProviders: ['fal', 'replicate']
  }),
  workflow({
    id: 'audio_stems',
    kind: 'music',
    categoryId: 'music_finish',
    name: 'разделить на дорожки',
    description: 'готовая композиция раскладывается на вокал, барабаны, бас и остальные инструменты. можно выгрузить полный набор дорожек или выбрать только нужные партии для ремикса, караоке и дальнейшего монтажа.',
    instruction: 'прикрепи композицию, выбери нужные партии и формат файлов для выгрузки',
    highlight: 'на вокал, барабаны, бас и остальные инструменты',
    customEmojiKey: 'audio_stems',
    customEmojiFallback: '🎚️',
    inputs: [audioInput('audio', 'музыкальный файл')],
    parameters: [
      enumParameter('stems', 'набор дорожек', 'четыре дорожки', ['вокал и музыка', 'четыре дорожки', 'шесть дорожек']),
      enumParameter('format', 'формат файлов', 'wav', ['wav', 'mp3', 'flac']),
      booleanParameter('zip_output', 'собрать в один архив', true)
    ],
    pricing: price(5, 14, 'за минуту'),
    requiredCapabilities: ['source_separation', 'multi_stem_output', 'lossless_audio'],
    preferredProviders: ['fal', 'replicate']
  }),
  workflow({
    id: 'audio_karaoke',
    kind: 'music',
    categoryId: 'music_finish',
    name: 'сделать караоке',
    description: 'вокал удаляется из песни, а оставшаяся музыка выравнивается по громкости и очищается от заметных следов голоса. дополнительно можно получить синхронизированный текст и отдельную дорожку исходного вокала.',
    instruction: 'прикрепи песню и выбери, нужны ли отдельный вокал, текст и временные отметки для строк',
    highlight: 'синхронизированный текст и отдельную дорожку исходного вокала',
    customEmojiKey: 'audio_karaoke',
    customEmojiFallback: '🎤',
    inputs: [audioInput('audio', 'песня'), textInput('lyrics', 'готовый текст песни', false)],
    parameters: [
      enumParameter('quality', 'качество разделения', 'лучшее качество', ['быстрее', 'лучшее качество']),
      booleanParameter('return_vocals', 'вернуть отдельный вокал', true),
      booleanParameter('sync_lyrics', 'синхронизировать текст', false)
    ],
    pricing: price(6, 18, 'за минуту'),
    requiredCapabilities: ['vocal_removal', 'source_separation', 'optional_lyrics_alignment'],
    preferredProviders: ['fal', 'replicate']
  }),
  workflow({
    id: 'audio_master',
    kind: 'music',
    categoryId: 'music_finish',
    name: 'подготовить мастер',
    description: 'готовый микс получает ровную громкость, контролируемый бас и запас по пикам без заметного искажения. можно выбрать назначение записи и получить обработанный файл вместе с коротким отчётом о громкости.',
    instruction: 'прикрепи финальный микс без лимитера и выбери площадку или формат, для которого готовится запись',
    highlight: 'обработанный файл вместе с коротким отчётом о громкости',
    customEmojiKey: 'audio_master',
    customEmojiFallback: '🎛️',
    inputs: [audioInput('audio', 'финальный микс'), audioInput('reference_audio', 'референс по звучанию', false)],
    parameters: [
      enumParameter('target', 'назначение', 'стриминг', ['стриминг', 'видео', 'подкаст', 'клуб']),
      enumParameter('intensity', 'сила обработки', 'средняя', ['мягкая', 'средняя', 'плотная']),
      enumParameter('format', 'формат результата', 'wav', ['wav', 'flac', 'mp3'])
    ],
    pricing: price(5, 16, 'за минуту'),
    requiredCapabilities: ['audio_mastering', 'loudness_targeting', 'peak_control'],
    preferredProviders: ['fal', 'replicate']
  }),
  workflow({
    id: 'audio_scene_sfx',
    kind: 'music',
    categoryId: 'music_finish',
    name: 'озвучить сцену',
    description: 'видеосцена получает синхронные шаги, движения, удары, шум окружения и другие звуки без готовой речи. можно сохранить исходную дорожку, задать плотность эффектов и отдельно выгрузить новые слои для монтажа.',
    instruction: 'прикрепи видео, перечисли обязательные звуки и укажи, насколько плотной должна быть звуковая дорожка',
    highlight: 'синхронные шаги, движения, удары, шум окружения',
    customEmojiKey: 'audio_scene_sfx',
    customEmojiFallback: '🎬',
    inputs: [videoInput('video', 'видеосцена'), textInput('prompt', 'описание нужных звуков', false)],
    parameters: [
      enumParameter('density', 'плотность звуков', 'средняя', ['редкая', 'средняя', 'плотная']),
      booleanParameter('keep_source_audio', 'сохранить исходный звук', true),
      booleanParameter('separate_layers', 'вернуть отдельные слои', false)
    ],
    pricing: price(8, 32, 'за минуту видео'),
    requiredCapabilities: ['video_to_audio', 'sound_effect_generation', 'timeline_alignment'],
    preferredProviders: ['fal', 'replicate']
  }),
  workflow({
    id: 'voice_tts',
    kind: 'voice',
    categoryId: 'voice_speak',
    name: 'озвучить текст',
    description: 'текст превращается в речь на выбранном голосе с настройкой темпа, подачи и формата файла. короткое превью помогает проверить произношение до полного запуска, а словарь сохраняет имена и термины для следующих записей.',
    instruction: 'пришли текст, выбери голос и при необходимости добавь подсказки по произношению',
    highlight: 'короткое превью помогает проверить произношение',
    customEmojiKey: 'voice_tts',
    customEmojiFallback: '🔊',
    inputs: [textInput('text', 'текст для озвучки'), voiceInput('voice', 'голос')],
    parameters: [
      enumParameter('mode', 'режим', 'сбалансированно', ['быстрее', 'сбалансированно', 'лучшее качество']),
      numberParameter('speed', 'скорость речи', 1, 0.7, 1.3, 0.05),
      enumParameter('format', 'формат файла', 'mp3', ['mp3', 'wav', 'opus'])
    ],
    pricing: price(6, 12, 'за тысячу знаков'),
    requiredCapabilities: ['text_to_speech', 'voice_selection', 'speed_control'],
    preferredProviders: ['elevenlabs', 'fal']
  }),
  workflow({
    id: 'voice_longform',
    kind: 'voice',
    categoryId: 'voice_speak',
    name: 'озвучить большой текст',
    description: 'книга, статья или учебный материал делятся на главы и озвучиваются единым голосом без скачков темпа между частями. длинная задача сохраняется как проект, поэтому отдельный фрагмент можно исправить без повторной генерации всей записи.',
    instruction: 'пришли текст или файл, выбери голос и отметь заголовки, которые должны стать отдельными главами',
    highlight: 'отдельный фрагмент можно исправить без повторной генерации',
    customEmojiKey: 'voice_longform',
    customEmojiFallback: '📚',
    inputs: [textInput('text', 'текст или содержимое документа'), voiceInput('voice', 'голос')],
    parameters: [
      enumParameter('mode', 'режим', 'сбалансированно', ['быстрее', 'сбалансированно', 'лучшее качество']),
      enumParameter('split', 'разделение', 'по заголовкам', ['по заголовкам', 'по абзацам', 'автоматически']),
      booleanParameter('chapter_files', 'отдельный файл на главу', true)
    ],
    pricing: price(6, 12, 'за тысячу знаков'),
    requiredCapabilities: ['long_form_tts', 'consistent_voice', 'segment_regeneration'],
    preferredProviders: ['elevenlabs', 'fal']
  }),
  workflow({
    id: 'voice_dialogue',
    kind: 'voice',
    categoryId: 'voice_speak',
    name: 'озвучить диалог',
    description: 'реплики нескольких участников превращаются в цельную сцену с отдельным голосом для каждого. паузы, эмоции и очередность сохраняются по разметке, а результат можно получить общим файлом и отдельными дорожками.',
    instruction: 'пришли диалог с именами участников, назначь голоса и при необходимости укажи эмоции в отдельных репликах',
    highlight: 'общим файлом и отдельными дорожками',
    customEmojiKey: 'voice_dialogue',
    customEmojiFallback: '💬',
    inputs: [textInput('script', 'сценарий диалога'), voiceInput('voices', 'голоса участников')],
    parameters: [
      enumParameter('mode', 'режим', 'лучшее качество', ['сбалансированно', 'лучшее качество']),
      numberParameter('pause_ms', 'пауза между репликами', 350, 0, 2000, 50),
      booleanParameter('separate_tracks', 'вернуть отдельные дорожки', true)
    ],
    pricing: price(12, 16, 'за тысячу знаков'),
    requiredCapabilities: ['multi_speaker_tts', 'dialogue_timing', 'separate_speaker_tracks'],
    preferredProviders: ['elevenlabs', 'fal']
  }),
  workflow({
    id: 'voice_ad',
    kind: 'voice',
    categoryId: 'voice_speak',
    name: 'записать рекламу',
    description: 'рекламный текст озвучивается с нужным темпом, акцентами и точной длительностью под ролик. можно приложить видео или музыку, отметить обязательные ударения и получить несколько вариантов подачи для выбора.',
    instruction: 'пришли текст, приложи ролик или музыку при наличии и укажи точную длительность записи',
    highlight: 'с точной длительностью под ролик',
    customEmojiKey: 'voice_ad',
    customEmojiFallback: '📣',
    inputs: [textInput('text', 'рекламный текст'), voiceInput('voice', 'голос'), videoInput('video', 'ролик для синхронизации', false), audioInput('music', 'фоновая музыка', false)],
    parameters: [
      enumParameter('delivery', 'подача', 'уверенная', ['спокойная', 'уверенная', 'энергичная']),
      numberParameter('duration_seconds', 'точная длительность', 20, 3, 180, 1),
      numberParameter('variants', 'число вариантов', 2, 1, 4, 1)
    ],
    pricing: price(12, 19, 'за тысячу знаков'),
    requiredCapabilities: ['directed_tts', 'exact_duration', 'multiple_variants'],
    preferredProviders: ['elevenlabs', 'fal']
  }),
  workflow({
    id: 'voice_design',
    kind: 'voice',
    categoryId: 'voice_speak',
    name: 'создать голос',
    description: 'описание тембра, возраста, манеры речи и акцента превращается в новый голос с несколькими пробами. выбранный вариант сохраняется в личной библиотеке, где его можно переименовать, проверить и удалить.',
    instruction: 'опиши голос обычными словами, добавь короткий текст для пробы и выбери один из полученных вариантов',
    highlight: 'сохраняется в личной библиотеке',
    customEmojiKey: 'voice_design',
    customEmojiFallback: '🧬',
    inputs: [textInput('prompt', 'описание голоса'), textInput('preview_text', 'текст для пробы')],
    parameters: [
      enumParameter('language', 'основной язык', 'русский', ['русский', 'английский', 'многоязычный']),
      numberParameter('variants', 'число вариантов', 3, 2, 5, 1),
      enumParameter('quality', 'качество пробы', 'лучшее качество', ['сбалансированно', 'лучшее качество'])
    ],
    pricing: price(169, 338, 'за созданный голос'),
    requiredCapabilities: ['voice_design', 'voice_preview', 'persistent_voice_id'],
    preferredProviders: ['elevenlabs']
  }),
  workflow({
    id: 'voice_clone',
    kind: 'voice',
    categoryId: 'voice_transform',
    name: 'клонировать мой голос',
    description: 'чистая запись речи создаёт личный голос для дальнейшей озвучки. перед запуском нужно подтвердить право на использование, после чего профиль можно прослушать, переименовать и удалить вместе с исходным образцом.',
    instruction: 'запиши или прикрепи чистую речь, подтверди право на голос и укажи название для личной библиотеки',
    highlight: 'удалить вместе с исходным образцом',
    customEmojiKey: 'voice_clone',
    customEmojiFallback: '🪪',
    inputs: [audioInput('sample_audio', 'образец чистой речи'), textInput('voice_name', 'название голоса')],
    parameters: [
      enumParameter('quality', 'тип клона', 'быстрый', ['быстрый', 'точный']),
      enumParameter('retention', 'хранение образца', 'удалить после создания', ['удалить после создания', 'хранить до удаления профиля']),
      booleanParameter('rights_confirmed', 'право на использование подтверждено', false)
    ],
    pricing: price(169, 499, 'за голосовой профиль'),
    requiredCapabilities: ['voice_cloning', 'persistent_voice_id', 'sample_deletion'],
    preferredProviders: ['elevenlabs', 'fal']
  }),
  workflow({
    id: 'voice_change',
    kind: 'voice',
    categoryId: 'voice_transform',
    name: 'изменить голос',
    description: 'готовая речь переозвучивается выбранным голосом с сохранением слов, темпа и интонации исходной записи. фон можно оставить, очистить или вернуть отдельной дорожкой, чтобы результат было проще свести с видео.',
    instruction: 'прикрепи запись речи, выбери новый голос и укажи, что сделать с фоновыми звуками',
    highlight: 'с сохранением слов, темпа и интонации',
    customEmojiKey: 'voice_change',
    customEmojiFallback: '🎭',
    inputs: [audioInput('audio', 'исходная речь'), voiceInput('voice', 'новый голос')],
    parameters: [
      enumParameter('mode', 'режим', 'лучшее качество', ['быстрее', 'лучшее качество']),
      enumParameter('background', 'фон', 'сохранить', ['сохранить', 'очистить', 'вернуть отдельно']),
      numberParameter('similarity', 'сходство с новым голосом', 80, 10, 100, 10)
    ],
    pricing: price(14, 34, 'за минуту'),
    requiredCapabilities: ['speech_to_speech', 'prosody_preservation', 'voice_selection'],
    preferredProviders: ['elevenlabs', 'fal']
  }),
  workflow({
    id: 'voice_dub_video',
    kind: 'voice',
    categoryId: 'voice_transform',
    name: 'дублировать видео',
    description: 'речь в видео переводится или переозвучивается с разделением участников и сохранением временных границ реплик. можно назначить каждому человеку голос, оставить музыку и получить готовое видео вместе с субтитрами.',
    instruction: 'прикрепи видео, выбери язык результата и назначь голоса участникам после распознавания речи',
    highlight: 'с разделением участников и сохранением временных границ',
    customEmojiKey: 'voice_dub_video',
    customEmojiFallback: '🎥',
    inputs: [videoInput('video', 'исходное видео'), textInput('target_language', 'язык результата'), voiceInput('voice', 'готовый или личный голос', false)],
    parameters: [
      enumParameter('lip_sync', 'синхронизация губ', 'обычная', ['без синхронизации', 'обычная', 'точная']),
      enumParameter('source_audio', 'исходный звук', 'сохранить', ['сохранить', 'убрать', 'смешать']),
      numberParameter('source_audio_mix', 'громкость исходного звука', 25, 0, 100, 5),
      booleanParameter('subtitles', 'добавить субтитры', true)
    ],
    pricing: price(57, 129, 'за минуту и язык'),
    requiredCapabilities: ['video_dubbing', 'speaker_diarization', 'translated_tts', 'timeline_alignment'],
    preferredProviders: ['elevenlabs', 'fal']
  }),
  workflow({
    id: 'voice_translate_preserve',
    kind: 'voice',
    categoryId: 'voice_transform',
    name: 'перевести с тем же голосом',
    description: 'аудиозапись переводится на другой язык с сохранением тембра, интонации и темпа исходного человека. результат можно подогнать под прежнюю длительность и выгрузить вместе с переводом текста и временными отметками.',
    instruction: 'прикрепи запись, выбери язык перевода и укажи, нужно ли точно сохранить исходную длительность',
    highlight: 'с сохранением тембра, интонации и темпа',
    customEmojiKey: 'voice_translate_preserve',
    customEmojiFallback: '🌍',
    inputs: [audioInput('audio', 'исходная речь'), textInput('target_language', 'язык перевода')],
    parameters: [
      enumParameter('mode', 'режим', 'лучшее качество', ['сбалансированно', 'лучшее качество']),
      booleanParameter('match_duration', 'сохранить длительность', true),
      booleanParameter('return_transcript', 'вернуть текст и перевод', true)
    ],
    pricing: price(57, 102, 'за минуту'),
    requiredCapabilities: ['speech_translation', 'voice_preservation', 'duration_matching'],
    preferredProviders: ['elevenlabs', 'fal']
  }),
  workflow({
    id: 'voice_replace_phrase',
    kind: 'voice',
    categoryId: 'voice_transform',
    name: 'заменить фразу в записи',
    description: 'выбранный фрагмент речи заменяется новой фразой с тем же голосом и похожей подачей. остальная запись не пересобирается, а стык по громкости и фону выравнивается, чтобы правка не выбивалась на слух.',
    instruction: 'прикрепи запись, укажи начало и конец фрагмента, затем напиши новую фразу',
    highlight: 'остальная запись не пересобирается',
    customEmojiKey: 'voice_replace_phrase',
    customEmojiFallback: '✂️',
    inputs: [audioInput('audio', 'исходная запись'), textInput('replacement_text', 'новая фраза')],
    parameters: [
      numberParameter('start_second', 'начало фрагмента', 0, 0, 3600, 0.1),
      numberParameter('end_second', 'конец фрагмента', 5, 0.1, 3600, 0.1),
      booleanParameter('match_background', 'подогнать фон и громкость', true)
    ],
    pricing: price(12, 29, 'за замену'),
    requiredCapabilities: ['speech_editing', 'voice_cloning', 'audio_inpainting'],
    preferredProviders: ['elevenlabs', 'fal', 'replicate']
  }),
  workflow({
    id: 'voice_transcribe',
    kind: 'voice',
    categoryId: 'voice_process',
    name: 'расшифровать речь',
    description: 'аудио или видео переводится в текст с временными отметками, определением языка и разделением участников. имена, названия и рабочие термины можно добавить в подсказки, а результат выгрузить обычным текстом или таблицей.',
    instruction: 'прикрепи аудио или видео, укажи язык при необходимости и добавь список редких имён или терминов',
    highlight: 'с временными отметками, определением языка и разделением участников',
    customEmojiKey: 'voice_transcribe',
    customEmojiFallback: '📝',
    inputs: [audioInput('audio', 'аудиозапись'), videoInput('video', 'видеозапись', false), textInput('terms', 'имена и термины', false)],
    parameters: [
      enumParameter('language', 'язык', 'определить', ['определить', 'русский', 'английский', 'другой']),
      booleanParameter('diarization', 'разделить участников', true),
      enumParameter('format', 'формат результата', 'текст', ['текст', 'таблица', 'субтитры'])
    ],
    pricing: price(1, 5, 'за минуту'),
    requiredCapabilities: ['speech_to_text', 'timestamps', 'language_detection'],
    preferredProviders: ['elevenlabs', 'fal']
  }),
  workflow({
    id: 'voice_meeting',
    kind: 'voice',
    categoryId: 'voice_process',
    name: 'разобрать встречу',
    description: 'запись встречи превращается в расшифровку с участниками, решениями, задачами и временными отметками. можно задать имена заранее, выбрать подробность итогов и получить отдельный список поручений без ручного просмотра всей записи.',
    instruction: 'прикрепи запись встречи, перечисли участников при возможности и выбери подробность итогового разбора',
    highlight: 'решениями, задачами и временными отметками',
    customEmojiKey: 'voice_meeting',
    customEmojiFallback: '👥',
    inputs: [audioInput('audio', 'запись встречи'), textInput('participant_names', 'имена участников', false)],
    parameters: [
      enumParameter('summary', 'подробность итогов', 'средняя', ['краткая', 'средняя', 'подробная']),
      booleanParameter('action_items', 'выделить поручения', true),
      booleanParameter('speaker_labels', 'подписать участников', true)
    ],
    pricing: price(3, 9, 'за минуту'),
    requiredCapabilities: ['speech_to_text', 'speaker_diarization', 'structured_summary'],
    preferredProviders: ['elevenlabs', 'fal']
  }),
  workflow({
    id: 'voice_subtitles',
    kind: 'voice',
    categoryId: 'voice_process',
    name: 'сделать субтитры',
    description: 'речь из видео превращается в субтитры с аккуратными строками и временными границами. можно выбрать язык, длину строки, перевод и формат файла, а затем получить готовое видео или отдельный файл для монтажа.',
    instruction: 'прикрепи видео, выбери язык субтитров и укажи, нужно ли встроить их в изображение',
    highlight: 'с аккуратными строками и временными границами',
    customEmojiKey: 'voice_subtitles',
    customEmojiFallback: '💬',
    inputs: [videoInput('video', 'исходное видео'), textInput('target_language', 'язык перевода', false)],
    parameters: [
      enumParameter('format', 'формат', 'srt', ['srt', 'vtt', 'встроить в видео']),
      numberParameter('line_length', 'знаков в строке', 42, 20, 60, 1),
      booleanParameter('translate', 'перевести субтитры', false)
    ],
    pricing: price(2, 8, 'за минуту'),
    requiredCapabilities: ['speech_to_text', 'subtitle_segmentation', 'timestamps'],
    preferredProviders: ['elevenlabs', 'fal']
  }),
  workflow({
    id: 'voice_cleanup',
    kind: 'voice',
    categoryId: 'voice_process',
    name: 'очистить запись',
    description: 'речь отделяется от шума, музыки, эха и посторонних голосов без повторной озвучки. можно выбрать степень очистки, сохранить естественное звучание помещения и получить отдельную фоновую дорожку для последующего сведения.',
    instruction: 'прикрепи запись, выбери силу очистки и укажи, нужно ли вернуть фон отдельным файлом',
    highlight: 'от шума, музыки, эха и посторонних голосов',
    customEmojiKey: 'voice_cleanup',
    customEmojiFallback: '🧹',
    inputs: [audioInput('audio', 'аудиозапись'), videoInput('video', 'видеозапись', false)],
    parameters: [
      enumParameter('strength', 'сила очистки', 'средняя', ['мягкая', 'средняя', 'сильная']),
      booleanParameter('remove_reverb', 'убрать эхо', true),
      booleanParameter('return_background', 'вернуть фон отдельно', false)
    ],
    pricing: price(8, 18, 'за минуту'),
    requiredCapabilities: ['voice_isolation', 'noise_removal', 'optional_dereverb'],
    preferredProviders: ['elevenlabs', 'fal', 'replicate']
  }),
  workflow({
    id: 'voice_shorten',
    kind: 'voice',
    categoryId: 'voice_process',
    name: 'сократить речь',
    description: 'длинная запись сокращается до выбранной длительности с сохранением основных мыслей и голоса автора. паузы, повторы и лишние фрагменты удаляются, а места склеек выравниваются по фону и громкости.',
    instruction: 'прикрепи запись, задай итоговую длительность и отметь фрагменты, которые нельзя удалять',
    highlight: 'с сохранением основных мыслей и голоса автора',
    customEmojiKey: 'voice_shorten',
    customEmojiFallback: '⏱️',
    inputs: [audioInput('audio', 'исходная запись'), textInput('must_keep', 'обязательные фрагменты', false)],
    parameters: [
      numberParameter('target_minutes', 'итоговая длительность в минутах', 5, 1, 120, 1),
      enumParameter('editing', 'плотность монтажа', 'средняя', ['мягкая', 'средняя', 'плотная']),
      booleanParameter('return_transcript', 'вернуть сокращённый текст', true)
    ],
    pricing: price(7, 18, 'за минуту исходника'),
    requiredCapabilities: ['speech_to_text', 'semantic_audio_editing', 'audio_inpainting'],
    preferredProviders: ['fal', 'replicate']
  })
]);

const workflowsById = new Map(audioWorkflowCatalog.map((item) => [item.id, item]));

export const getAudioWorkflowById = (id) => workflowsById.get(id) ?? null;

export const listAudioWorkflows = ({ kind, categoryId } = {}) => audioWorkflowCatalog.filter(
  (item) => (!kind || item.kind === kind) && (!categoryId || item.categoryId === categoryId)
);
