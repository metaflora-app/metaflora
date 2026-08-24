import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import sharp from 'sharp';

const sourceDirectory = resolve('assets', 'model-icon-sources');

// Sakana publishes a sheet of logo variants. Extract only its red fish mark,
// then turn the sheet's white canvas transparent before the common icon build.
const sakanaCrop = await sharp(resolve(sourceDirectory, 'sakana.png'))
  .extract({ left: 600, top: 190, width: 205, height: 175 })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const sakanaPixels = Buffer.from(sakanaCrop.data);
for (let index = 0; index < sakanaPixels.length; index += sakanaCrop.info.channels) {
  const distanceFromWhite = Math.max(
    255 - sakanaPixels[index],
    255 - sakanaPixels[index + 1],
    255 - sakanaPixels[index + 2]
  );
  sakanaPixels[index + 3] = distanceFromWhite;
}
await sharp(sakanaPixels, { raw: sakanaCrop.info })
  .trim({ background: '#ffffff', threshold: 10 })
  .png()
  .toFile(resolve(sourceDirectory, 'sakana-symbol.png'));

// Fugu Ultra has no standalone publisher mark. Use a compact pufferfish mark
// derived from the model name, in Sakana's red/ink palette, without a wordmark
// or baked-in background. The shared generator adds Telegram-safe padding.
const fuguSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M55 128c0-50 38-86 88-86 39 0 71 20 86 50l18-15-5 39 5 39-18-15c-15 30-47 50-86 50-50 0-88-36-88-62Z" fill="#E60000" stroke="#1D1D1F" stroke-width="12"/>
    <path d="m73 77-30-26 7 41-40 4 35 21-31 27 41-5-2 42 27-32M112 46 99 10l35 27 21-34 4 42M112 187l-13 36 35-27 21 34 4-42" stroke="#1D1D1F" stroke-width="11"/>
    <circle cx="163" cy="96" r="9" fill="#1D1D1F" stroke="none"/>
    <path d="M157 137c18 11 35 9 47-4" stroke="#1D1D1F" stroke-width="10"/>
    <circle cx="106" cy="103" r="5" fill="#FFFFFF" stroke="none"/>
    <circle cx="126" cy="136" r="5" fill="#FFFFFF" stroke="none"/>
    <circle cx="90" cy="142" r="5" fill="#FFFFFF" stroke="none"/>
  </g>
</svg>`;

await writeFile(
  resolve(sourceDirectory, 'fugu-ultra.png'),
  await sharp(Buffer.from(fuguSvg)).png().toBuffer()
);
