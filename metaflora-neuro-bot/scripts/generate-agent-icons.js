import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { validateAgentVisuals } from '../src/agent-icons.js';

export function buildAgentIconManifest(agents) {
  if (!Array.isArray(agents)) {
    throw new TypeError('agents должен быть массивом');
  }

  const ids = new Set();
  const records = agents.map((agent) => {
    validateAgentVisuals(agent);
    if (ids.has(agent.id)) {
      throw new TypeError(`повтор id агента: ${agent.id}`);
    }
    ids.add(agent.id);
    return {
      id: agent.id,
      customEmojiKey: agent.customEmojiKey,
      fallback: agent.fallback,
      primaryModel: agent.primaryModel
    };
  });

  return {
    version: 1,
    strategy: 'primary-model-brand',
    agents: records
  };
}

export async function generateAgentIconManifest(outputPath, providedAgents) {
  const agents = providedAgents ?? (await import('../src/agent-catalog.js')).listAgents();
  if (agents.length !== 50) {
    throw new RangeError(`ожидалось 50 агентов, получено: ${agents.length}`);
  }

  const manifest = buildAgentIconManifest(agents);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const outputPath = resolve(packageRoot, 'assets/agent-icons/manifest.json');
  const manifest = await generateAgentIconManifest(outputPath);
  process.stdout.write(`готово: ${manifest.agents.length} иконок, ${outputPath}\n`);
}
