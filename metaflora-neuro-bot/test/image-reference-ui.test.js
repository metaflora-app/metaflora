import assert from 'node:assert/strict';
import test from 'node:test';

import { getModelById, buildModelCard } from '../src/model-catalog.js';
import {
  buildImageReferenceMessage,
  imageReferenceLimit,
  supportsImageReferences
} from '../src/image-reference-ui.js';

test('confirmed image models open a separate reference screen with a safe bot cap', () => {
  const router = getModelById('krea_2_large');
  assert.equal(supportsImageReferences(router), true);
  assert.equal(imageReferenceLimit(router), 16);
  assert.match(buildImageReferenceMessage(router).text, /в боте.*до 16/su);
  assert.ok(buildModelCard(router).reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data === 'imagerefs:open'));
  assert.equal(buildModelCard(router).reply_markup.inline_keyboard.flat()
    .find(({ callback_data }) => callback_data === 'imagerefs:open').text, '🖼 референсы');
});

test('image reference copy starts lowercase and names the model without a separator', () => {
  const model = getModelById('nano_banana_2');
  const message = buildImageReferenceMessage(model);
  assert.match(message.text, /^<b>🖼 референсы Nano Banana 2<\/b>\n\nпришли/u);
  assert.doesNotMatch(message.text, /референсы ·/u);
});

test('video cards with selectable modes explain the immediate prompt or mode choice', () => {
  const model = getModelById('flux_3');
  const message = buildModelCard(model);
  assert.match(message.text, /опиши сцену сразу или выбери другой режим генерации по кнопке ниже👇/u);
});

test('text-only image models never promise references', () => {
  const textOnly = getModelById('ideogram_4');
  assert.equal(supportsImageReferences(textOnly), false);
  assert.equal(buildModelCard(textOnly).reply_markup.inline_keyboard.flat()
    .some(({ callback_data }) => callback_data === 'imagerefs:open'), false);
});
