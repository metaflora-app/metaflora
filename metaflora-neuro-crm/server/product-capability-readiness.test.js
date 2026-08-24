import assert from "node:assert/strict";
import test from "node:test";

import { buildProductCapabilityCoverage } from "./product-capability-readiness.js";

test("early-access dubbing cannot be projected as ready and catalog counts remain exact", () => {
  const summary = Object.freeze({ models: 409, agents: 50, tools: 42, workflows: 30, voices: 80, entertainments: 15 });
  const result = buildProductCapabilityCoverage({
    summary,
    models: [
      { id: "video", category: "video", modes: ["text_to_video", "first_frame", "references"] , settings: ["duration"] },
      { id: "llm", category: "llm", modes: [], settings: ["reasoning_effort"] },
    ],
    tools: [
      { id: "video_extend", category: "video", active: true, modes: ["extend"], settings: [] },
    ],
    workflows: [
      { id: "voice_tts", availability: "active" },
      { id: "voice_clone", availability: "early_access" },
      { id: "voice_dub_video", availability: "early_access" },
    ],
    scenarios: [{ id: "edit_video", runnable: true }],
    entertainments: Array.from({ length: 15 }, (_, index) => ({ id: `ent-${index}`, runnable: true })),
    musicProfile: { constructorReady: true, runnableWorkflows: 2, settings: ["result", "style", "lyrics", "duration", "prompt"] },
  });

  assert.deepEqual(result.summary, summary);
  assert.equal(result.coverage.find(({ id }) => id === "video-dubbing").state, "early_access");
  assert.notEqual(result.coverage.find(({ id }) => id === "voice-library").state, "ready");
  assert.equal(result.coverage.find(({ id }) => id === "video-builder").state, "ready");
  assert.equal(result.coverage.find(({ id }) => id === "entertainment-catalog").state, "ready");
  assert.equal(result.coverage.find(({ id }) => id === "music-studio").state, "ready");
});
