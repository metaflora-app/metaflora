import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const EXPECTED = Object.freeze({
  'favicon.ico': '02598f39e75b0495289a430bafcbe441eb4056a3732b11678a76e9be0e1a8711',
  'favicon.png': '7b86b22eb03427a53c15474521a89eada651fa4ec811baf29ce03c81c37c05c9',
  'apple-touch-icon.png': 'a8b11f843e975dec83745876855c1c190a23a256bd73dd828a5dc64d56f45f49'
});

test('CRM uses the exact Metaflora library favicon set', async () => {
  for (const [name, expectedHash] of Object.entries(EXPECTED)) {
    const bytes = await readFile(new URL(`../public/${name}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedHash);
  }
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /href="\/favicon\.ico\?v=4"/u);
  assert.match(html, /href="\/favicon\.png\?v=4"/u);
  assert.match(html, /href="\/apple-touch-icon\.png\?v=4"/u);
});
