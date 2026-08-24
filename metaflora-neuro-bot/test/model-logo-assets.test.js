import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import sharp from 'sharp';

for (const brand of ['sakana', 'fugu']) {
  test(`${brand} has a clean transparent square custom-emoji asset`, async () => {
    const image = sharp(resolve('assets', 'model-icons', `${brand}.png`));
    const metadata = await image.metadata();
    const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let transparentPixels = 0;
    let visiblePixels = 0;

    for (let index = 3; index < data.length; index += info.channels) {
      if (data[index] === 0) transparentPixels += 1;
      else visiblePixels += 1;
    }

    assert.equal(metadata.width, 100);
    assert.equal(metadata.height, 100);
    assert.equal(metadata.hasAlpha, true);
    assert.ok(transparentPixels >= 2_000, { transparentPixels });
    assert.ok(visiblePixels >= 500, { visiblePixels });
  });
}

test('Sakana and Fugu render as visually distinct assets', async () => {
  const [sakana, fugu] = await Promise.all([
    sharp(resolve('assets/model-icons/sakana.png')).raw().toBuffer(),
    sharp(resolve('assets/model-icons/fugu.png')).raw().toBuffer()
  ]);

  assert.notDeepEqual(sakana, fugu);
});
