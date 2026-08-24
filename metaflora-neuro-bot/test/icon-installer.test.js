import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { brandAssets, setCustomEmojiIds } from '../src/brand-icons.js';
import { installModelIcons, stickerBrandOrder, stickerUiOrder } from '../src/icon-installer.js';

test('Sakana and Fugu occupy separate stable installer slots', () => {
  assert.ok(stickerBrandOrder.includes('sakana'));
  assert.ok(stickerBrandOrder.includes('fugu'));
  assert.notEqual(stickerBrandOrder.indexOf('sakana'), stickerBrandOrder.indexOf('fugu'));
});

test('existing Telegram emoji pack is mapped to brands without another upload', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'metaflora-icons-'));
  const outputPath = resolve(directory, 'ids.json');
  let uploads = 0;
  const telegram = {
    async request(method) {
      assert.equal(method, 'getStickerSet');
      return {
        stickers: stickerBrandOrder.map((brand) => ({ custom_emoji_id: `id-${brand}` }))
      };
    },
    async requestMultipart() { uploads += 1; }
  };

  const result = await installModelIcons({ telegram, ownerId: 1, outputPath });
  const stored = JSON.parse(await readFile(outputPath, 'utf8'));

  assert.equal(result.count, Object.keys(brandAssets).length);
  assert.match(result.setName, /models_v2/);
  assert.equal(uploads, 0);
  assert.equal(stored.google, 'id-google');
  assert.equal(stored.nanobanana, 'id-nanobanana');
  assert.equal(stored.flux, 'id-flux');
  await rm(directory, { recursive: true, force: true });
});

test('missing brand icons are appended to an existing Telegram emoji pack', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'metaflora-icons-'));
  const outputPath = resolve(directory, 'ids.json');
  const brands = stickerBrandOrder;
  let count = 32;
  let uploads = 0;
  const telegram = {
    async request() {
      return { stickers: brands.slice(0, count).map((brand) => ({ custom_emoji_id: `id-${brand}` })) };
    },
    async requestMultipart(method) {
      assert.equal(method, 'addStickerToSet');
      uploads += 1;
      count += 1;
    }
  };

  const result = await installModelIcons({ telegram, ownerId: 1, outputPath });
  assert.equal(uploads, brands.length - 32);
  assert.equal(result.count, brands.length);
  await rm(directory, { recursive: true, force: true });
});

test('a fresh icon pack respects the Telegram initial sticker limit', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'metaflora-icons-'));
  const outputPath = resolve(directory, 'ids.json');
  const brands = stickerBrandOrder;
  let count = 0;
  let reads = 0;

  const telegram = {
    async request() {
      reads += 1;
      if (reads === 1) throw new Error('not found');
      return { stickers: brands.slice(0, count).map((brand) => ({ custom_emoji_id: `id-${brand}` })) };
    },
    async requestMultipart(method, form) {
      if (method === 'createNewStickerSet') {
        const stickers = JSON.parse(form.get('stickers'));
        assert.ok(stickers.length <= 50);
        count = stickers.length;
        return;
      }
      assert.equal(method, 'addStickerToSet');
      count += 1;
    }
  };

  const result = await installModelIcons({ telegram, ownerId: 1, outputPath });
  assert.equal(result.count, brands.length);
  assert.equal(count, brands.length);
  await rm(directory, { recursive: true, force: true });
});

test('UI custom emojis append after the stable model-logo order', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'metaflora-icons-ui-'));
  const outputPath = resolve(directory, 'ids.json');
  const all = [...stickerBrandOrder, ...stickerUiOrder];
  let count = stickerBrandOrder.length;
  let uploads = 0;
  const telegram = {
    async request() {
      return { stickers: all.slice(0, count).map((brand) => ({ custom_emoji_id: `id-${brand}` })) };
    },
    async requestMultipart(method) {
      assert.equal(method, 'addStickerToSet');
      uploads += 1;
      count += 1;
    }
  };

  const result = await installModelIcons({
    telegram,
    ownerId: 1,
    outputPath,
    includeUi: true
  });
  const stored = JSON.parse(await readFile(outputPath, 'utf8'));
  assert.equal(result.count, stickerBrandOrder.length);
  assert.equal(result.uiCount, stickerUiOrder.length);
  assert.equal(uploads, stickerUiOrder.length);
  assert.equal(stored.google, 'id-google');
  assert.equal(stored.ui_profile, 'id-ui_profile');
  await rm(directory, { recursive: true, force: true });
});

test('payment custom emojis are safely replaced in place when an admin refresh is requested', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'metaflora-icons-payment-refresh-'));
  const outputPath = resolve(directory, 'ids.json');
  const all = [...stickerBrandOrder, ...stickerUiOrder];
  const replacements = [];
  const telegram = {
    async request(method) {
      assert.equal(method, 'getStickerSet');
      return {
        stickers: all.map((brand) => ({
          file_id: `file-${brand}`,
          custom_emoji_id: `id-${brand}`
        }))
      };
    },
    async requestMultipart(method, form) {
      assert.equal(method, 'replaceStickerInSet');
      const sticker = JSON.parse(form.get('sticker'));
      replacements.push({
        userId: form.get('user_id'),
        setName: form.get('name'),
        oldSticker: form.get('old_sticker'),
        attachment: sticker.sticker,
        format: sticker.format,
        emojiList: sticker.emoji_list,
        keyword: sticker.keywords[0]
      });
    }
  };

  const result = await installModelIcons({
    telegram,
    ownerId: 1,
    outputPath,
    includeUi: true,
    refreshPaymentUi: true
  });

  assert.deepEqual(replacements, [
    {
      userId: '1',
      setName: 'metaflora_ai_models_v2_by_neuro_metaflora_bot',
      oldSticker: 'file-ui_sbp',
      attachment: 'attach://ui_sbp',
      format: 'static',
      emojiList: ['🤖'],
      keyword: 'ui_sbp'
    },
    {
      userId: '1',
      setName: 'metaflora_ai_models_v2_by_neuro_metaflora_bot',
      oldSticker: 'file-ui_base',
      attachment: 'attach://ui_base',
      format: 'static',
      emojiList: ['🤖'],
      keyword: 'ui_base'
    }
  ]);
  assert.equal(result.refreshedUiCount, 2);
  await rm(directory, { recursive: true, force: true });
});

test('full refresh repairs semantic mappings even when the live sticker order drifted', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'metaflora-icons-full-refresh-'));
  const outputPath = resolve(directory, 'ids.json');
  const all = [...stickerBrandOrder, ...stickerUiOrder];
  const reversed = [...all].reverse();
  const replacements = [];
  setCustomEmojiIds(Object.fromEntries(all.map((brand) => [brand, `id-${brand}`])));
  const telegram = {
    async request(method) {
      assert.equal(method, 'getStickerSet');
      return {
        stickers: reversed.map((brand) => ({
          file_id: `file-${brand}`,
          custom_emoji_id: `id-${brand}`
        }))
      };
    },
    async requestMultipart(method, form) {
      assert.equal(method, 'replaceStickerInSet');
      replacements.push({
        oldSticker: form.get('old_sticker'),
        brand: JSON.parse(form.get('sticker')).keywords[0]
      });
    }
  };

  const result = await installModelIcons({
    telegram,
    ownerId: 1,
    outputPath,
    includeUi: true,
    refreshAll: true
  });
  const stored = JSON.parse(await readFile(outputPath, 'utf8'));

  assert.equal(replacements.length, all.length);
  assert.deepEqual(replacements.find(({ brand }) => brand === 'metacoin'), {
    oldSticker: 'file-metacoin',
    brand: 'metacoin'
  });
  assert.deepEqual(replacements.find(({ brand }) => brand === 'yandexcolor'), {
    oldSticker: 'file-yandexcolor',
    brand: 'yandexcolor'
  });
  assert.deepEqual(replacements.find(({ brand }) => brand === 'sakana'), {
    oldSticker: 'file-sakana',
    brand: 'sakana'
  });
  assert.equal(stored.metacoin, 'id-metacoin');
  assert.equal(stored.yandexcolor, 'id-yandexcolor');
  assert.equal(stored.sber, 'id-sber');
  assert.equal(result.refreshedBrandCount, stickerBrandOrder.length);
  setCustomEmojiIds({});
  await rm(directory, { recursive: true, force: true });
});
