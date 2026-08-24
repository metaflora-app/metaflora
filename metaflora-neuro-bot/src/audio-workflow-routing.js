import { getAudioWorkflowById } from './audio-workflow-catalog.js';
import { getToolModelById } from './tool-model-adapter.js';

const EXECUTABLE_WORKFLOWS = Object.freeze([
  Object.freeze({ workflowId: 'music_instrumental', toolId: 'audio_music' }),
  Object.freeze({ workflowId: 'music_jingle', toolId: 'audio_music' }),
  Object.freeze({ workflowId: 'voice_tts', toolId: 'audio_tts' }),
  Object.freeze({ workflowId: 'voice_change', toolId: 'audio_voice_change' }),
  Object.freeze({ workflowId: 'voice_transcribe', toolId: 'audio_stt' }),
  Object.freeze({ workflowId: 'voice_cleanup', toolId: 'audio_isolation' })
]);

const toolIdByWorkflow = new Map(
  EXECUTABLE_WORKFLOWS.map(({ workflowId, toolId }) => [workflowId, toolId])
);

export function listExecutableAudioWorkflows() {
  return EXECUTABLE_WORKFLOWS;
}

export function getExecutableToolForWorkflow(workflowId) {
  const toolId = toolIdByWorkflow.get(workflowId);
  return toolId ? getToolModelById(toolId) : null;
}

export function getAudioWorkflowAvailability(workflowId, { audioWorkflowExecutor } = {}) {
  if (!getAudioWorkflowById(workflowId)) return Object.freeze({ state: 'missing' });
  if (
    ['voice_dub_video', 'music_song', 'music_instrumental'].includes(workflowId)
    && audioWorkflowExecutor?.getRoute?.(workflowId)?.state === 'runnable'
  ) {
    return Object.freeze({ state: 'active', executor: 'audio_workflow' });
  }
  return getExecutableToolForWorkflow(workflowId)
    ? Object.freeze({ state: 'active' })
    : Object.freeze({
      state: 'early_access',
      reason: 'маршрут ещё проходит проверку'
    });
}
