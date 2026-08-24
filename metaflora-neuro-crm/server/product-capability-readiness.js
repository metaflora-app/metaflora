const coverageItem = (id, label, scope, state, evidence) => Object.freeze({
  id,
  label,
  scope,
  state,
  evidence: Object.freeze([...evidence]),
});

function workflowState(workflows, id) {
  return workflows.find((workflow) => workflow.id === id)?.availability ?? "missing";
}

function combinedState(states) {
  if (states.every((state) => state === "active" || state === "runnable")) return "ready";
  if (states.some((state) => state === "early_access")) return "early_access";
  if (states.some((state) => state === "active" || state === "runnable")) return "partial";
  return "unavailable";
}

export function buildProductCapabilityCoverage(source = {}) {
  const models = Array.isArray(source.models) ? source.models : [];
  const tools = Array.isArray(source.tools) ? source.tools : [];
  const workflows = Array.isArray(source.workflows) ? source.workflows : [];
  const scenarios = Array.isArray(source.scenarios) ? source.scenarios : [];
  const entertainments = Array.isArray(source.entertainments) ? source.entertainments : [];
  const allModes = new Set([...models, ...tools].flatMap(({ modes }) => Array.isArray(modes) ? modes : []));
  const videoModeContract = ["text_to_video", "first_frame", "references", "extend"];
  const configuredSettings = [...models, ...tools].filter(({ settings }) => Array.isArray(settings) && settings.length > 0).length;
  const llmSettings = new Set(Array.isArray(source.llmPreferenceKeys) ? source.llmPreferenceKeys : []);
  const requiredLlmSettings = ["length", "reasoning", "reasoningSummary", "documents"];
  const scenarioState = scenarios.length > 0 && scenarios.every(({ runnable }) => runnable === true) ? "ready"
    : scenarios.some(({ runnable }) => runnable === true) ? "partial" : "unavailable";
  const voiceStates = [workflowState(workflows, "voice_tts"), workflowState(workflows, "voice_clone")];
  const dubbingState = workflowState(workflows, "voice_dub_video");
  const entertainmentState = entertainments.length === 15 && entertainments.every(({ runnable }) => runnable === true)
    ? "ready" : entertainments.some(({ runnable }) => runnable === true) ? "partial" : "unavailable";
  const musicSettings = new Set(Array.isArray(source.musicProfile?.settings) ? source.musicProfile.settings : []);
  const requiredMusicSettings = ["result", "style", "lyrics", "duration", "prompt"];
  const musicState = source.musicProfile?.constructorReady === true
    && Number(source.musicProfile?.runnableWorkflows) > 0
    && requiredMusicSettings.every((setting) => musicSettings.has(setting)) ? "ready"
    : source.musicProfile?.constructorReady === true ? "partial" : "unavailable";

  return Object.freeze({
    summary: source.summary,
    coverage: Object.freeze([
      coverageItem("voice-library", "библиотека голосов и свой голос", "voice", combinedState(voiceStates), voiceStates),
      coverageItem("video-dubbing", "озвучка видео и управление исходным звуком", "video", combinedState([dubbingState]), [dubbingState]),
      coverageItem("quick-settings", "быстрые настройки генерации", "all", configuredSettings > 0 ? "ready" : "unavailable", [`configured:${configuredSettings}`]),
      coverageItem("video-builder", "режимы видео", "video", videoModeContract.every((mode) => allModes.has(mode)) ? "ready" : allModes.size > 0 ? "partial" : "unavailable", videoModeContract.map((mode) => `${mode}:${allModes.has(mode)}`)),
      coverageItem("llm-settings", "расширенные настройки текста", "llm", requiredLlmSettings.every((key) => llmSettings.has(key)) && source.systemInstructionsSupported === true ? "ready" : llmSettings.size > 0 ? "partial" : "unavailable", [...requiredLlmSettings.map((key) => `${key}:${llmSettings.has(key)}`), `instructions:${source.systemInstructionsSupported === true}`]),
      coverageItem("scenario-catalog", "каталог прикладных сценариев", "tools", scenarioState, [`runnable:${scenarios.filter(({ runnable }) => runnable === true).length}/${scenarios.length}`]),
      coverageItem("music-studio", "музыкальный конструктор", "music", musicState, [`runnable:${Number(source.musicProfile?.runnableWorkflows) || 0}`, ...requiredMusicSettings.map((setting) => `${setting}:${musicSettings.has(setting)}`)]),
      coverageItem("entertainment-catalog", "развлекательные сценарии", "entertainment", entertainmentState, [`runnable:${entertainments.filter(({ runnable }) => runnable === true).length}/${entertainments.length}`]),
    ]),
  });
}
