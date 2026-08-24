import assert from 'node:assert/strict';
import test from 'node:test';

import { informalizeText } from '../src/tone.js';

test('Telegram copy consistently addresses one person informally', () => {
  assert.equal(
    informalizeText('Выберите модель. Пришлите файл и укажите задачу.'),
    'Выбери модель. Пришли файл и укажи задачу.'
  );
});
