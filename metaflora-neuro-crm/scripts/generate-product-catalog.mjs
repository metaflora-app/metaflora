import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const botRoot = resolve(projectRoot, "../metaflora-neuro-bot/src");

const optionalImport = async (path, fallback) => {
  try { return await import(path); } catch { return fallback; }
};

const [modelCatalog, { listAgents, getAgentById }, toolCatalog, { audioWorkflowCatalog }, { modesForVideoModel }, audioRouting, { SCENARIO_CATALOG }, userPreferences, { buildProductCapabilityCoverage }, entertainmentCatalog, entertainmentFlows, entertainmentInteractive, musicConstructor, musicContracts] = await Promise.all([
  import(resolve(botRoot, "model-catalog.js")),
  import(resolve(botRoot, "agent-catalog.js")),
  import(resolve(botRoot, "tool-catalog.js")),
  import(resolve(botRoot, "audio-workflow-catalog.js")),
  import(resolve(botRoot, "video-constructor.js")),
  import(resolve(botRoot, "audio-workflow-routing.js")),
  import(resolve(botRoot, "scenario-catalog.js")),
  import(resolve(botRoot, "user-preferences.js")),
  import(resolve(projectRoot, "server/product-capability-readiness.js")),
  optionalImport(resolve(botRoot, "entertainment-catalog.js"), { ENTERTAINMENT_CATALOG: [] }),
  optionalImport(resolve(botRoot, "entertainment-flows.js"), { ENTERTAINMENT_FLOWS: {} }),
  optionalImport(resolve(botRoot, "entertainment-interactive.js"), { entertainmentInteraction: () => null, buildInteractiveEntertainmentStart: () => null }),
  optionalImport(resolve(botRoot, "music-constructor.js"), { MUSIC_STYLE_PRESETS: [] }),
  optionalImport(resolve(botRoot, "music-provider-contracts.js"), { listActiveMusicProviderContracts: () => [] }),
]);
const { listCatalogModels, inputProfileForModel, getModelById } = modelCatalog;
const { TOOL_CATALOG, getToolById } = toolCatalog;

const safeText = (value, maximum = 160) => String(value ?? "").trim().slice(0, maximum);
const safeKeys = (value) => Object.keys(value && typeof value === "object" ? value : {}).map(safeText);
const safeList = (value) => [...new Set((Array.isArray(value) ? value : []).map(safeText).filter(Boolean))];
const fallbackModesFor = (model) => {
  const inputs = new Set(safeList(model.input?.required).concat(safeList(model.input?.optional)));
  if (model.category !== "video") return [];
  const modes = [];
  if (inputs.size === 0 || inputs.has("text")) modes.push("text_to_video");
  if (inputs.has("image") || inputs.has("first_frame")) modes.push("first_frame_to_video");
  if (inputs.has("images") || inputs.has("references")) modes.push("references_to_video");
  if (inputs.has("video") || /extend/u.test(model.id)) modes.push("extend_video");
  return modes;
};
const voiceLibrarySource = await readFile(resolve(botRoot, "voice-library.js"), "utf8");
const curatedVoiceCount = Number(/const CATALOG_SIZE = (\d+);/u.exec(voiceLibrarySource)?.[1] ?? 0);

const catalogModels = listCatalogModels();
const models = catalogModels
  .filter(({ source }) => source !== "tool")
  .map((model) => ({
    id: safeText(model.id),
    name: safeText(model.name),
    category: safeText(model.category),
    modes: safeList(modesForVideoModel(model)),
    settings: safeList(inputProfileForModel(model).map(({ key }) => key)),
  }));
const agents = listAgents({ activeOnly: false }).map((agent) => ({
  id: safeText(agent.id), name: safeText(agent.name), category: safeText(agent.category), active: agent.active === true,
}));
const tools = TOOL_CATALOG.map((tool) => ({
  id: safeText(tool.id), name: safeText(tool.name), category: safeText(tool.category), active: tool.active === true,
  modes: safeList(modesForVideoModel({ ...tool, source: "tool", availability: tool.active ? "available" : "unavailable" })).length
    ? safeList(modesForVideoModel({ ...tool, source: "tool", availability: tool.active ? "available" : "unavailable" }))
    : fallbackModesFor(tool),
  settings: safeKeys(tool.settings),
}));
const workflows = audioWorkflowCatalog.map((workflow) => ({
  id: safeText(workflow.id), name: safeText(workflow.name), category: safeText(workflow.kind),
  availability: safeText(audioRouting.getAudioWorkflowAvailability(workflow.id).state),
  modes: [], settings: safeList(workflow.parameters?.map(({ id }) => id)),
}));
const entertainmentMedia = Object.freeze({
  ent_calorie_estimator: ["image"], ent_visual_age: ["image"], ent_meme_sticker: ["text", "image"],
  ent_congratulator: ["text", "audio"], ent_sound_postcard: ["text", "audio"],
});
const entertainmentOutputs = Object.freeze({
  ent_congratulator: "audio", ent_meme_sticker: "image", ent_sound_postcard: "audio",
});
const entertainments = entertainmentCatalog.ENTERTAINMENT_CATALOG.map((item) => {
  const guided = entertainmentInteractive.buildInteractiveEntertainmentStart(item.id);
  const selectable = entertainmentFlows.ENTERTAINMENT_FLOWS?.[item.id];
  const interaction = entertainmentInteractive.entertainmentInteraction(item.id);
  const entryOptions = guided?.reply_markup?.inline_keyboard?.flat()
    .filter(({ callback_data: callback }) => String(callback ?? "").startsWith("entflow:") || String(callback ?? "").startsWith("entcongrats:") || String(callback ?? "").startsWith("entmeme:") || String(callback ?? "").startsWith("entquiz:"))
    .length ?? selectable?.options?.length ?? 0;
  const hasFlow = Boolean(guided || selectable);
  const runnable = getAgentById(item.targetAgentId)?.active === true && hasFlow && Boolean(interaction?.modelId || selectable);
  return {
    id: safeText(item.id), name: safeText(item.name), category: "entertainment",
    description: safeText(item.description, 320), inputHint: safeText(item.inputHint, 240),
    runnable, readiness: runnable ? "ready" : "partial", flowKind: guided ? "guided" : "selectable",
    entryOptions, accepts: entertainmentMedia[item.id] ?? ["text"], output: entertainmentOutputs[item.id] ?? "text",
  };
});
const quiz = entertainments.find(({ id }) => id === "ent_quiz");
const entertainmentProfile = Object.freeze({
  cover: Object.freeze({ key: "entertainment-section", sourceFile: "гембла.png", alt: "развлечения с ИИ" }),
  ready: entertainments.filter(({ readiness }) => readiness === "ready").length,
  total: entertainments.length,
  quizReady: quiz?.readiness === "ready" && quiz.entryOptions >= 3,
});
const musicWorkflowIds = new Set(["music_song", "music_instrumental"]);
const musicWorkflows = workflows.filter(({ id }) => musicWorkflowIds.has(id));
const musicProfile = {
  constructorReady: typeof musicConstructor.createMusicDraft === "function" && typeof musicConstructor.musicProviderRequest === "function",
  runnableWorkflows: musicWorkflows.filter(({ availability }) => availability === "active").length,
  stylePresetCount: musicConstructor.MUSIC_STYLE_PRESETS.length,
  settings: ["result", "style", "lyrics", "duration", "prompt"],
  activeRoutes: typeof musicContracts.listActiveMusicProviderContracts === "function" ? musicContracts.listActiveMusicProviderContracts().length : 0,
};

const scenarios = SCENARIO_CATALOG.map((scenario) => {
  const target = getToolById(scenario.targetId) ?? getModelById(scenario.targetId);
  return {
    id: safeText(scenario.id),
    runnable: target?.source === "tool" || getToolById(scenario.targetId)
      ? target?.active === true
      : target?.availability === "available",
  };
});

const summary = { models: models.length, agents: agents.length, tools: tools.length, workflows: workflows.length, voices: curatedVoiceCount, entertainments: entertainments.length };
const capabilityProjection = buildProductCapabilityCoverage({
  summary,
  models,
  tools,
  workflows,
  scenarios,
  entertainments,
  musicProfile,
  llmPreferenceKeys: Object.keys(userPreferences.defaultUserPreferences()),
  systemInstructionsSupported: typeof modelCatalog.buildModelSettingsMessage === "function",
});
const stableSource = JSON.stringify({ models, agents, tools, workflows, scenarios, entertainments, entertainmentProfile, musicProfile, coverage: capabilityProjection.coverage });
const sourceHash = createHash("sha256").update(stableSource).digest("hex").slice(0, 16);
const manifest = {
  schemaVersion: "1.2.0",
  release: { version: `catalog-${sourceHash}`, sourceHash },
  summary: capabilityProjection.summary,
  coverage: capabilityProjection.coverage,
  models, agents, tools, workflows, entertainments, entertainmentProfile,
  musicProfile,
  voiceProfile: { curatedCount: curatedVoiceCount, customVoiceSupported: true, sensitiveFieldsExposed: false },
};

const target = resolve(projectRoot, "src/generated/product-catalog.v1.json");
await mkdir(dirname(target), { recursive: true });
await writeFile(target, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
process.stdout.write(`generated ${target}: ${models.length} models, ${agents.length} agents, ${tools.length} tools, ${workflows.length} workflows, ${entertainments.length} entertainments\n`);
