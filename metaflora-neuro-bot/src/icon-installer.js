import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import {
  brandAssets,
  customEmojiIdForBrand,
  customEmojiPaths,
  setCustomEmojiIds
} from './brand-icons.js';

const setName = 'metaflora_ai_models_v2_by_neuro_metaflora_bot';
export const stickerUiOrder = Object.freeze([
  'ui_menu',
  'ui_profile',
  'ui_models',
  'ui_text',
  'ui_image',
  'ui_video',
  'ui_audio',
  'ui_speech',
  'ui_experimental',
  'ui_tools',
  'ui_settings',
  'ui_dialogs',
  'ui_support',
  'ui_invite',
  'ui_three_d',
  'ui_russian',
  'ui_back',
  'ui_sbp',
  'ui_base'
]);
export const stickerBrandOrder = Object.freeze(
  Object.keys(brandAssets).flatMap((brand) => {
    if (brand === 'flux') return ['nanobanana', 'flux'];
    if (brand === 'nanobanana') return [];
    return [brand];
  })
);
const refreshablePaymentUi = Object.freeze(['ui_sbp', 'ui_base']);

function stickerFile(brand) {
  return resolve('assets', 'model-icons', `${brand}.png`);
}

async function createStickerSet(telegram, ownerId, stickersToInstall) {
  const form = new FormData();
  const brands = stickersToInstall.slice(0, 50);
  const stickers = brands.map((brand) => ({
    sticker: `attach://${brand}`,
    format: 'static',
    emoji_list: ['🤖'],
    keywords: [brand]
  }));

  form.set('user_id', String(ownerId));
  form.set('name', setName);
  form.set('title', 'МЕТАФЛОРА* нейро · модели');
  form.set('stickers', JSON.stringify(stickers));
  form.set('sticker_type', 'custom_emoji');
  form.set('needs_repainting', 'false');

  for (const brand of brands) {
    const file = await readFile(stickerFile(brand));
    form.set(brand, new Blob([file], { type: 'image/png' }), `${brand}.png`);
  }

  await telegram.requestMultipart('createNewStickerSet', form, 60_000);
}

async function readStickerSet(telegram) {
  try {
    return await telegram.request('getStickerSet', { name: setName });
  } catch {
    return null;
  }
}

async function addSticker(telegram, ownerId, brand) {
  const form = new FormData();
  form.set('user_id', String(ownerId));
  form.set('name', setName);
  form.set('sticker', JSON.stringify({
    sticker: `attach://${brand}`,
    format: 'static',
    emoji_list: ['🤖'],
    keywords: [brand]
  }));
  const file = await readFile(stickerFile(brand));
  form.set(brand, new Blob([file], { type: 'image/png' }), `${brand}.png`);
  await telegram.requestMultipart('addStickerToSet', form, 60_000);
}

async function replaceSticker(telegram, ownerId, brand, oldSticker) {
  if (!oldSticker?.file_id) {
    throw new Error(`Telegram did not return file_id for ${brand}.`);
  }
  const form = new FormData();
  form.set('user_id', String(ownerId));
  form.set('name', setName);
  form.set('old_sticker', oldSticker.file_id);
  form.set('sticker', JSON.stringify({
    sticker: `attach://${brand}`,
    format: 'static',
    emoji_list: ['🤖'],
    keywords: [brand]
  }));
  const file = await readFile(stickerFile(brand));
  form.set(brand, new Blob([file], { type: 'image/png' }), `${brand}.png`);
  await telegram.requestMultipart('replaceStickerInSet', form, 60_000);
}

export async function installModelIcons({
  telegram,
  ownerId,
  outputPath,
  includeUi = false,
  refreshPaymentUi = false,
  refreshAll = false
}) {
  const stickersToInstall = Object.freeze([
    ...stickerBrandOrder,
    ...(includeUi ? stickerUiOrder : [])
  ]);
  let stickerSet = await readStickerSet(telegram);
  const existingStickerCount = stickerSet?.stickers?.length ?? 0;
  if (!stickerSet) {
    await createStickerSet(telegram, ownerId, stickersToInstall);
    stickerSet = await readStickerSet(telegram);
  }

  if (stickerSet && stickerSet.stickers.length < stickersToInstall.length) {
    for (const brand of stickersToInstall.slice(stickerSet.stickers.length)) {
      await addSticker(telegram, ownerId, brand);
    }
    stickerSet = await readStickerSet(telegram);
  }
  if (!stickerSet || stickerSet.stickers.length < stickersToInstall.length) {
    throw new Error('Telegram returned an incomplete custom emoji set.');
  }

  const targetIndexByBrand = new Map();
  let refreshedUiCount = 0;
  let refreshedBrandCount = 0;
  if (refreshAll || (includeUi && refreshPaymentUi)) {
    const refreshable = refreshAll ? stickersToInstall : refreshablePaymentUi;
    const indexByEmojiId = new Map(stickerSet.stickers.map((sticker, index) => [
      sticker.custom_emoji_id,
      index
    ]));
    for (const brand of refreshable) {
      const configuredId = customEmojiIdForBrand(brand);
      const configuredIndex = configuredId ? indexByEmojiId.get(configuredId) : undefined;
      const fallbackIndex = stickersToInstall.indexOf(brand);
      const index = Number.isInteger(configuredIndex) ? configuredIndex : fallbackIndex;
      if (index < 0 || index >= existingStickerCount) continue;
      targetIndexByBrand.set(brand, index);
      await replaceSticker(telegram, ownerId, brand, stickerSet.stickers[index]);
      if (brand.startsWith('ui_')) refreshedUiCount += 1;
      else refreshedBrandCount += 1;
    }
    if (refreshedUiCount > 0 || refreshedBrandCount > 0) stickerSet = await readStickerSet(telegram);
  }
  if (!stickerSet || stickerSet.stickers.length < stickersToInstall.length) {
    throw new Error('Telegram returned an incomplete custom emoji set after refresh.');
  }

  const ids = Object.freeze(Object.fromEntries(stickersToInstall.map((brand, fallbackIndex) => [
    brand,
    stickerSet.stickers[targetIndexByBrand.get(brand) ?? fallbackIndex].custom_emoji_id
  ])));
  const output = outputPath ?? customEmojiPaths().write;
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(ids, null, 2)}\n`, { mode: 0o600 });
  setCustomEmojiIds(ids);
  return {
    count: stickerBrandOrder.length,
    uiCount: includeUi ? stickerUiOrder.length : 0,
    refreshedUiCount,
    refreshedBrandCount,
    setName
  };
}
