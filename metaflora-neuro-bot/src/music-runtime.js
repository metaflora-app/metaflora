import { createFalClient } from '@fal-ai/client';
import { invokeMediaTool } from './media-router.js';

import {
  MUSIC_ROUTE_ENDPOINT_ALLOWLIST,
  buildMusicProviderInput,
  getMusicProviderContract,
  normalizeMusicOutput
} from './music-provider-contracts.js';

const OPERATIONS = new Set(['generate_song']);

export function createMusicRuntime({ falKey, polzaKey, replicateToken, subscribe, invoke = invokeMediaTool, fetchImpl = fetch } = {}) {
  let falSubscribe = subscribe;
  const hasFal = typeof falKey === 'string' && falKey.length > 0;

  const runtimeSubscribe = () => {
    if (!hasFal) throw new Error('FAL_KEY не настроен для музыкального маршрута.');
    falSubscribe ??= createFalClient({ credentials: falKey }).subscribe;
    return falSubscribe;
  };

  return Object.freeze({
    supports(operation) {
      return Boolean((hasFal || polzaKey || replicateToken) && OPERATIONS.has(operation));
    },
    async execute({ operation, inputs, markExternalStarted }) {
      if (!OPERATIONS.has(operation)) throw new RangeError('музыкальная операция недоступна');
      const contractId = String(inputs?.contractId ?? '');
      const contract = getMusicProviderContract(contractId);
      if (!contract || contract.active !== true) throw new RangeError('музыкальный маршрут неактивен');
      if (!MUSIC_ROUTE_ENDPOINT_ALLOWLIST.has(contract.submitEndpoint)) {
        throw new RangeError('endpoint музыкального маршрута не разрешён');
      }
      const input = buildMusicProviderInput(contractId, inputs);
      if (contract.provider === 'polza') {
        if (!polzaKey) throw new Error('POLZA_API_KEY не настроен для музыкального маршрута.');
        if (typeof markExternalStarted !== 'function') throw new TypeError('markExternalStarted обязателен');
        const output = await invoke({ routeId: 'music', input }, {
          fetchImpl,
          onAttempt: async () => markExternalStarted(),
          config: {
            pollIntervalMs: 2_000,
            maxPollAttempts: 120,
            requestTimeoutMs: 15_000,
            requestRetries: 2,
            retryDelayMs: 250,
            providers: { polza: { apiKey: polzaKey } },
            routes: {
              music: [{
                provider: 'polza',
                providerModelId: 'suno/generate',
                model: 'suno/generate',
                endpoint: contract.submitEndpoint,
                statusEndpoint: contract.pollEndpoint,
                type: 'audio',
                mimeType: 'audio/mpeg',
                runtime: { async: true }
              }]
            }
          }
        });
        return normalizeMusicOutput(contractId, output);
      }
      if (contract.provider === 'replicate') {
        if (!replicateToken) throw new Error('REPLICATE_API_TOKEN не настроен для музыкального маршрута.');
        const headers = { Authorization: `Token ${replicateToken}`, 'Content-Type': 'application/json' };
        if (typeof markExternalStarted !== 'function') throw new TypeError('markExternalStarted обязателен');
        markExternalStarted();
        const submitted = await fetchImpl(contract.submitEndpoint, {
          method: 'POST', headers, body: JSON.stringify({ input })
        });
        if (!submitted.ok) throw new Error('Replicate отклонил музыкальный запрос.');
        let prediction = await submitted.json();
        for (let attempt = 0; attempt < 60 && !['succeeded', 'failed', 'canceled'].includes(prediction.status); attempt += 1) {
          const pollUrl = prediction?.urls?.get;
          if (typeof pollUrl !== 'string' || !pollUrl.startsWith('https://api.replicate.com/')) {
            throw new Error('Replicate вернул неверный адрес проверки.');
          }
          const polled = await fetchImpl(pollUrl, { headers: { Authorization: `Token ${replicateToken}` } });
          if (!polled.ok) throw new Error('Replicate не вернул состояние музыки.');
          prediction = await polled.json();
        }
        if (prediction.status !== 'succeeded') throw new Error('Replicate не создал музыку.');
        return normalizeMusicOutput(contractId, prediction.output);
      }
      if (contract.provider !== 'fal') throw new RangeError('провайдер маршрута не подключён');
      if (typeof markExternalStarted !== 'function') throw new TypeError('markExternalStarted обязателен');
      markExternalStarted();
      const response = await runtimeSubscribe()(contract.submitEndpoint, {
        input,
        logs: false
      });
      return normalizeMusicOutput(contractId, response?.data ?? response);
    }
  });
}
