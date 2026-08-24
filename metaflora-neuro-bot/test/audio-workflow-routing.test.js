import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getAudioWorkflowAvailability,
  getExecutableToolForWorkflow,
  listExecutableAudioWorkflows
} from '../src/audio-workflow-routing.js';

const VERIFIED = new Map([
  ['music_instrumental', 'audio_music'],
  ['music_jingle', 'audio_music'],
  ['voice_tts', 'audio_tts'],
  ['voice_change', 'audio_voice_change'],
  ['voice_transcribe', 'audio_stt'],
  ['voice_cleanup', 'audio_isolation']
]);

test('исполняются только сценарии с уже проверенным маршрутом', () => {
  assert.deepEqual(
    new Map(listExecutableAudioWorkflows().map(({ workflowId, toolId }) => [workflowId, toolId])),
    VERIFIED
  );
  for (const [workflowId, toolId] of VERIFIED) {
    assert.equal(getExecutableToolForWorkflow(workflowId)?.id, toolId);
    assert.equal(getAudioWorkflowAvailability(workflowId).state, 'active');
  }
});

test('неподключённый сценарий остаётся видимым, но не может вызвать провайдера или списание', () => {
  assert.equal(getExecutableToolForWorkflow('voice_clone'), null);
  assert.equal(getExecutableToolForWorkflow('music_song'), null);
  assert.deepEqual(getAudioWorkflowAvailability('voice_clone'), {
    state: 'early_access',
    reason: 'маршрут ещё проходит проверку'
  });
  assert.equal(getAudioWorkflowAvailability('missing').state, 'missing');
});

test('дубляж активируется только внедрённым runnable executor', () => {
  assert.equal(getAudioWorkflowAvailability('voice_dub_video').state, 'early_access');
  assert.deepEqual(getAudioWorkflowAvailability('voice_dub_video', {
    audioWorkflowExecutor: { getRoute: () => ({ state: 'runnable' }) }
  }), { state: 'active', executor: 'audio_workflow' });
});

test('песня активируется только внедрённым runnable executor', () => {
  assert.equal(getAudioWorkflowAvailability('music_song').state, 'early_access');
  assert.deepEqual(getAudioWorkflowAvailability('music_song', {
    audioWorkflowExecutor: { getRoute: () => ({ state: 'runnable' }) }
  }), { state: 'active', executor: 'audio_workflow' });
});
