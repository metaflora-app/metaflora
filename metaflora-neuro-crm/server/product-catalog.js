const safeText = (value, maximum = 160) => String(value ?? "").trim().slice(0, maximum);
const safeList = (value) => Object.freeze((Array.isArray(value) ? value : []).map((item) => safeText(item, 80)).filter(Boolean));

function safeEntry(value, { active = false } = {}) {
  const item = value && typeof value === "object" ? value : {};
  return Object.freeze({
    id: safeText(item.id, 100),
    name: safeText(item.name),
    category: safeText(item.category, 60),
    ...(active ? { active: item.active === true } : {}),
    modes: safeList(item.modes),
    settings: safeList(item.settings),
  });
}

function safeEntertainment(value) {
  const item = value && typeof value === "object" ? value : {};
  return Object.freeze({
    id: safeText(item.id, 100),
    name: safeText(item.name),
    category: "entertainment",
    description: safeText(item.description, 320),
    inputHint: safeText(item.inputHint, 240),
    readiness: item.readiness === "ready" ? "ready" : "partial",
    flowKind: item.flowKind === "guided" ? "guided" : "selectable",
    entryOptions: Math.max(0, Number.isSafeInteger(item.entryOptions) ? item.entryOptions : 0),
    accepts: safeList(item.accepts),
    output: safeText(item.output, 30),
  });
}

export function createProductCatalogView(manifest) {
  const source = manifest && typeof manifest === "object" ? manifest : {};
  const summary = source.summary && typeof source.summary === "object" ? source.summary : {};
  const count = (key) => Math.max(0, Number.isSafeInteger(summary[key]) ? summary[key] : 0);
  return Object.freeze({
    schemaVersion: safeText(source.schemaVersion, 20),
    release: Object.freeze({
      version: safeText(source.release?.version, 80),
      sourceHash: safeText(source.release?.sourceHash, 80),
    }),
    summary: Object.freeze({ models: count("models"), agents: count("agents"), tools: count("tools"), workflows: count("workflows"), voices: count("voices"), entertainments: count("entertainments") }),
    coverage: Object.freeze((Array.isArray(source.coverage) ? source.coverage : []).map((item) => Object.freeze({
      id: safeText(item?.id, 100), label: safeText(item?.label), state: safeText(item?.state, 30), scope: safeText(item?.scope, 30),
    }))),
    models: Object.freeze((Array.isArray(source.models) ? source.models : []).map((item) => safeEntry(item))),
    agents: Object.freeze((Array.isArray(source.agents) ? source.agents : []).map((item) => safeEntry(item, { active: true }))),
    tools: Object.freeze((Array.isArray(source.tools) ? source.tools : []).map((item) => safeEntry(item, { active: true }))),
    workflows: Object.freeze((Array.isArray(source.workflows) ? source.workflows : []).map((item) => Object.freeze({
      ...safeEntry(item),
      availability: safeText(item?.availability, 30),
    }))),
    entertainments: Object.freeze((Array.isArray(source.entertainments) ? source.entertainments : []).map(safeEntertainment)),
    entertainmentProfile: Object.freeze({
      cover: Object.freeze({
        key: safeText(source.entertainmentProfile?.cover?.key, 80),
        alt: safeText(source.entertainmentProfile?.cover?.alt, 160),
      }),
      ready: Math.max(0, Number.isSafeInteger(source.entertainmentProfile?.ready) ? source.entertainmentProfile.ready : 0),
      total: Math.max(0, Number.isSafeInteger(source.entertainmentProfile?.total) ? source.entertainmentProfile.total : 0),
      quizReady: source.entertainmentProfile?.quizReady === true,
    }),
    musicProfile: Object.freeze({
      constructorReady: source.musicProfile?.constructorReady === true,
      runnableWorkflows: Math.max(0, Number.isSafeInteger(source.musicProfile?.runnableWorkflows) ? source.musicProfile.runnableWorkflows : 0),
      activeRoutes: Math.max(0, Number.isSafeInteger(source.musicProfile?.activeRoutes) ? source.musicProfile.activeRoutes : 0),
      stylePresetCount: Math.max(0, Number.isSafeInteger(source.musicProfile?.stylePresetCount) ? source.musicProfile.stylePresetCount : 0),
      settings: safeList(source.musicProfile?.settings),
      sensitiveFieldsExposed: false,
    }),
    voiceProfile: Object.freeze({
      curatedCount: Math.max(0, Number.isSafeInteger(source.voiceProfile?.curatedCount) ? source.voiceProfile.curatedCount : 0),
      customVoiceSupported: source.voiceProfile?.customVoiceSupported === true,
      sensitiveFieldsExposed: false,
    }),
  });
}
