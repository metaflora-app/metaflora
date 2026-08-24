import test from 'node:test';
import assert from 'node:assert/strict';

import { cardProfileFor } from '../src/model-profiles.js';
import { getModelById } from '../src/model-catalog.js';

test('карточка расшифровки прямо просит прислать текст или аудиофайл', () => {
  const profile = cardProfileFor(getModelById('gpt_4o_transcribe'));

  assert.match(profile.instruction, /пришли/iu);
  assert.match(profile.instruction, /пришли.*аудио/iu);
});
