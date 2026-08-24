import { AI_AGENT_COUNT, AI_TOOL_COUNT, MODEL_CATALOG_COUNT } from './catalog-counts.js';
import { listAgents } from './agent-catalog.js';
import { agentSettingsProfileFor, cycleAgentSetting } from './agent-settings.js';
import { getAudioWorkflowById } from './audio-workflow-catalog.js';
import { AUDIO_WORKFLOW_EXECUTION_ROUTES } from './audio-workflow-executor.js';
import { ElevenLabsVoiceService } from './elevenlabs-voice-service.js';
import {
  buildModelCard,
  calculateModelMetacoinPrice,
  defaultModelSettings,
  getModelById,
  inputProfileForModel,
  listCatalogModels
} from './model-catalog.js';
import { SCENARIO_CATALOG } from './scenario-catalog.js';
import { cycleSettingValue } from './settings-cycle.js';
import { TOOL_CATALOG } from './tool-catalog.js';
import { modesForVideoModel } from './video-constructor.js';
import {
  buildOwnedVoiceCardMessage,
  buildVoiceLibraryMessage
} from './voice-library-ui.js';

function immutableRecords(records) {
  return Object.freeze(records.map((record) => Object.freeze({
    ...record,
    capabilities: Object.freeze((record.capabilities ?? []).map((capability) => Object.freeze({
      ...capability,
      ...(capability.modes ? { modes: Object.freeze([...capability.modes]) } : {}),
      ...(capability.scenarios ? { scenarios: Object.freeze([...capability.scenarios]) } : {})
    })))
  })));
}

function cyclicDefinitions(model) {
  return inputProfileForModel(model).filter(({ type, values }) => (
    type !== 'string' && values.length > 1
  ));
}

function modelCapabilities(model) {
  const capabilities = [];
  const cyclic = cyclicDefinitions(model);
  if (cyclic.length > 0) {
    const defaults = defaultModelSettings(model);
    const works = cyclic.every((definition) => (
      cycleSettingValue(defaults, definition)[definition.key] !== defaults[definition.key]
    ));
    capabilities.push({ id: 'cyclic_settings', status: works ? 'supported' : 'broken' });
  }
  const modes = modesForVideoModel(model);
  if (modes.length > 0) {
    capabilities.push({ id: 'video_constructor', status: 'supported', modes });
  }
  if (model.category === 'llm') {
    capabilities.push({ id: 'advanced_llm_settings', status: 'supported' });
  }
  const scenarios = SCENARIO_CATALOG
    .filter(({ targetId }) => targetId === model.id)
    .map(({ id }) => id);
  if (scenarios.length > 0) {
    capabilities.push({ id: 'scenario_target', status: 'supported', scenarios });
  }
  return capabilities;
}

function modelCoverage(model) {
  let card = false;
  let price = false;
  try {
    card = Boolean(buildModelCard(model)?.text?.trim());
    price = Number.isFinite(calculateModelMetacoinPrice(
      model,
      defaultModelSettings(model)
    ));
  } catch {
    // Validation reports the exact model instead of hiding a broken card or quote.
  }
  return {
    id: model.id,
    route: model.availability === 'available'
      && Boolean(model.provider)
      && Boolean(model.providerModelId ?? model.providerModels?.length),
    card,
    price,
    capabilities: modelCapabilities(model)
  };
}

function agentCoverage(agent) {
  const primary = getModelById(agent.primaryModel);
  const settings = agentSettingsProfileFor(agent);
  const defaults = Object.fromEntries(settings.map(({ key, defaultValue }) => [key, defaultValue]));
  const cyclic = settings.length > 0 && settings.every((definition) => (
    cycleAgentSetting(agent, defaults, definition.key)[definition.key] !== defaults[definition.key]
  ));
  return {
    id: agent.id,
    route: primary?.availability === 'available'
      && Boolean(primary.provider)
      && Boolean(primary.providerModelId ?? primary.providerModels?.length),
    card: Boolean(agent.name?.trim() && agent.description?.trim() && agent.inputHint?.trim()),
    runtime: Boolean(agent.systemPrompt?.trim() && agent.promptVersion?.trim()),
    capabilities: cyclic
      ? [{ id: 'cyclic_settings', status: 'supported' }]
      : [{ id: 'cyclic_settings', status: 'broken' }]
  };
}

function toolCoverage(tool) {
  const model = getModelById(tool.id);
  return {
    id: tool.id,
    route: tool.routes.filter(({ role }) => role === 'primary').length === 1
      && tool.routes.every(({ endpoint, provider, verified }) => (
        verified === true && Boolean(endpoint?.trim()) && Boolean(provider?.trim())
      )),
    card: Boolean(tool.card?.title?.trim() && tool.card?.description?.trim()),
    price: Boolean(tool.pricing?.type && tool.pricing?.currency && tool.pricing?.unit),
    runtime: Boolean(
      tool.runtime?.adapter?.trim()
      && tool.runtime?.outputPath?.trim()
      && tool.runtime?.inputMap
    ),
    capabilities: modelCapabilities(model)
  };
}

function scenarioSurface() {
  return Object.freeze(SCENARIO_CATALOG.map(({ id, targetId }) => Object.freeze({
    id,
    targetId,
    status: getModelById(targetId)?.availability === 'available' ? 'supported' : 'broken'
  })));
}

function voiceLibrarySurface() {
  const profileId = 'vp_00000000-0000-4000-8000-000000000001';
  const message = buildVoiceLibraryMessage({
    profiles: [{ profileId, name: 'мой голос', provider: 'elevenlabs' }]
  });
  const callbacks = message.reply_markup.inline_keyboard.flat()
    .map(({ callback_data: callbackData }) => callbackData);
  const cardCallbacks = buildOwnedVoiceCardMessage({ profileId, name: 'мой голос' })
    .reply_markup.inline_keyboard.flat()
    .map(({ callback_data: callbackData }) => callbackData);
  return Object.freeze({
    status: message.text?.trim() && callbacks.includes(`ownedvoice:${profileId}`)
      ? 'supported'
      : 'broken',
    preview: cardCallbacks.includes(`ownedvoicepreview:${profileId}`),
    personalVoices: callbacks.includes(`ownedvoice:${profileId}`)
  });
}

function dubbingSurface() {
  const workflow = getAudioWorkflowById('voice_dub_video');
  const route = AUDIO_WORKFLOW_EXECUTION_ROUTES.find(({ workflowId }) => (
    workflowId === 'voice_dub_video'
  ));
  const sourceAudio = workflow?.parameters.find(({ id }) => id === 'source_audio');
  const hasVoice = workflow?.inputs.some(({ id }) => id === 'voice');
  const supported = route?.adapter === 'eleven'
    && route.operation === 'dubVideo'
    && typeof ElevenLabsVoiceService.prototype.dubVideo === 'function';
  return Object.freeze({
    workflowId: 'voice_dub_video',
    status: supported ? 'supported' : 'broken',
    executionRoute: `${route?.adapter}.${route?.operation}`,
    readyVoice: Boolean(hasVoice),
    personalVoice: Boolean(hasVoice),
    sourceAudioModes: Object.freeze([...(sourceAudio?.options ?? [])])
  });
}

export function buildCapabilityCoverage() {
  const publicModels = listCatalogModels().filter(({ source }) => source !== 'tool');
  return Object.freeze({
    models: immutableRecords(publicModels.map(modelCoverage)),
    agents: immutableRecords(listAgents().map(agentCoverage)),
    tools: immutableRecords(TOOL_CATALOG.map(toolCoverage)),
    surfaces: Object.freeze({
      scenarios: scenarioSurface(),
      voiceLibrary: voiceLibrarySurface(),
      dubbing: dubbingSurface()
    })
  });
}

export function validateCapabilityCoverage(coverage = buildCapabilityCoverage()) {
  const expectedCounts = Object.freeze({
    models: MODEL_CATALOG_COUNT,
    agents: AI_AGENT_COUNT,
    tools: AI_TOOL_COUNT
  });
  const errors = [];

  for (const [kind, expected] of Object.entries(expectedCounts)) {
    const records = coverage[kind] ?? [];
    if (records.length !== expected) errors.push(`${kind}: expected ${expected}, got ${records.length}`);
    if (new Set(records.map(({ id }) => id)).size !== records.length) {
      errors.push(`${kind}: duplicate ids`);
    }
    for (const record of records) {
      for (const [contract, valid] of Object.entries(record)) {
        if (!['id', 'capabilities'].includes(contract) && valid !== true) {
          errors.push(`${kind}:${record.id}:${contract}`);
        }
      }
      for (const capability of record.capabilities ?? []) {
        if (capability.status !== 'supported') {
          errors.push(`${kind}:${record.id}:capability:${capability.id}`);
        }
      }
    }
  }

  for (const scenario of coverage.surfaces?.scenarios ?? []) {
    if (scenario.status !== 'supported') errors.push(`scenario:${scenario.id}:target`);
  }
  if (coverage.surfaces?.voiceLibrary?.status !== 'supported') errors.push('voice_library:runtime');
  if (coverage.surfaces?.dubbing?.status !== 'supported') errors.push('dubbing:runtime');

  return Object.freeze({
    counts: Object.freeze(Object.fromEntries(
      Object.keys(expectedCounts).map((kind) => [kind, coverage[kind]?.length ?? 0])
    )),
    errors: Object.freeze(errors)
  });
}
