import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

import { brandAssets } from '../src/brand-icons.js';

const sourceDirectory = resolve('node_modules/@lobehub/icons-static-svg/icons');
const localSourceDirectory = resolve('assets/model-icon-sources');
const outputDirectory = resolve('assets/model-icons');

await mkdir(outputDirectory, { recursive: true });

for (const [brand, filename] of Object.entries(brandAssets)) {
  const isLocal = filename.startsWith('local:');
  const source = await readFile(resolve(isLocal ? localSourceDirectory : sourceDirectory, isLocal ? filename.slice(6) : filename));
  const output = resolve(outputDirectory, `${brand}.png`);
  if (source.length === 0) {
    await access(output);
    continue;
  }
  await sharp(source, { density: 300 })
    .resize(76, 76, { fit: 'contain' })
    .extend({ top: 12, bottom: 12, left: 12, right: 12, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(output);
}

await writeFile(resolve(outputDirectory, '.generated'), `${Object.keys(brandAssets).length}\n`);
console.log(`generated ${Object.keys(brandAssets).length} icons in ${dirname(resolve(outputDirectory, '.generated'))}`);
