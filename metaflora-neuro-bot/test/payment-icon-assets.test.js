import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import sharp from 'sharp';

const PAYMENT_ICONS = Object.freeze([
  Object.freeze({ key: 'ui_sbp', file: 'ui_sbp.png' }),
  Object.freeze({ key: 'ui_base', file: 'ui_base.png' })
]);

async function inspectIcon(file) {
  const image = sharp(resolve('assets', 'model-icons', file));
  const metadata = await image.metadata();
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  let opaquePixels = 0;
  let lightPixels = 0;
  let baseBluePixels = 0;
  const coarseColors = new Set();

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if (alpha === 0) continue;
      opaquePixels += 1;
      const red = data[(y * info.width + x) * info.channels];
      const green = data[(y * info.width + x) * info.channels + 1];
      const blue = data[(y * info.width + x) * info.channels + 2];
      if (red >= 225 && green >= 225 && blue >= 225) lightPixels += 1;
      if (red <= 20 && green <= 50 && blue >= 220) baseBluePixels += 1;
      if (alpha >= 220) coarseColors.add(`${red >> 5}:${green >> 5}:${blue >> 5}`);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return {
    metadata,
    bounds: Object.freeze({ minX, minY, maxX, maxY }),
    opaqueRatio: opaquePixels / (info.width * info.height),
    lightPixels,
    baseBluePixels,
    coarseColorCount: coarseColors.size
  };
}

for (const icon of PAYMENT_ICONS) {
  test(`${icon.key} is a transparent, tightly framed 100x100 Telegram emoji asset`, async () => {
    const inspected = await inspectIcon(icon.file);

    assert.equal(inspected.metadata.width, 100);
    assert.equal(inspected.metadata.height, 100);
    assert.equal(inspected.metadata.hasAlpha, true);
    if (icon.key === 'ui_sbp') {
      assert.ok(inspected.bounds.minX >= 4 && inspected.bounds.minX <= 14, inspected.bounds);
      assert.ok(inspected.bounds.minY >= 4 && inspected.bounds.minY <= 14, inspected.bounds);
      assert.ok(inspected.bounds.maxX >= 85 && inspected.bounds.maxX <= 95, inspected.bounds);
      assert.ok(inspected.bounds.maxY >= 85 && inspected.bounds.maxY <= 95, inspected.bounds);
      assert.ok(inspected.opaqueRatio >= 0.2 && inspected.opaqueRatio <= 0.72, inspected.opaqueRatio);
      assert.ok(inspected.coarseColorCount >= 5, inspected.coarseColorCount);
    } else {
      const contentWidth = inspected.bounds.maxX - inspected.bounds.minX + 1;
      const contentHeight = inspected.bounds.maxY - inspected.bounds.minY + 1;
      assert.ok(inspected.bounds.minX >= 4 && inspected.bounds.minX <= 10, inspected.bounds);
      assert.ok(inspected.bounds.maxX >= 89 && inspected.bounds.maxX <= 95, inspected.bounds);
      assert.ok(inspected.bounds.minY >= 30 && inspected.bounds.minY <= 40, inspected.bounds);
      assert.ok(inspected.bounds.maxY >= 59 && inspected.bounds.maxY <= 69, inspected.bounds);
      assert.ok(contentWidth / contentHeight >= 2.5, { contentWidth, contentHeight });
      assert.ok(inspected.baseBluePixels >= 800, inspected.baseBluePixels);
      assert.ok(inspected.lightPixels <= 10, inspected.lightPixels);
    }
  });
}
