export function isPaidCallAllowed({ providerTestMode, enablePaidProviderCalls }) {
  return !providerTestMode && enablePaidProviderCalls;
}

export function isFreeLlmTestAllowed({ enableFreeLlmTestCalls }) {
  return enableFreeLlmTestCalls;
}

export function isAgentCallAllowed({ enableAgentProviderCalls }) {
  return enableAgentProviderCalls === true;
}

export function buildTestModeReply(category, modelName = '') {
  const label = {
    llm: 'текстовой модели',
    image: 'картинки',
    video: 'видео',
    audio: 'аудио',
    voice: 'голоса',
    tools: 'инструмента',
    russian: 'российской модели',
    beta: 'бета-модели',
    experimental: 'бета-модели'
  }[category] ?? 'задачи';
  const selected = modelName ? ` для ${modelName}` : '';
  return `сейчас генерация ${label}${selected} временно выключена. запрос не отправлен, метакоины не списаны.`;
}
