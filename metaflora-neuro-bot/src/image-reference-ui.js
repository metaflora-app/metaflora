import { inputContractFor } from './model-profiles.js';

const ROUTERAI_REFERENCE_MODELS = new Set([
  'flux_2_max', 'mai_image_25', 'mai_image_25_pro', 'krea_2_large', 'krea_2_medium',
  'krea_2_turbo', 'qwen_image_3', 'qwen_image_3_pro', 'recraft_41_pro',
  'recraft_41_vector', 'recraft_41_pro_vector', 'grok_image_20',
  'riverflow_25_pro', 'riverflow_25_fast'
]);

const CURATED_REFERENCE_MODELS = new Set([
  'nano_banana_pro', 'nano_banana_2', 'nano_banana_2_lite', 'gpt_image_2',
  'seedream_50_pro', 'seedream_50_lite', 'kling_kolors'
]);

export const IMAGE_REFERENCE_PRODUCT_CAP = 16;

export function imageReferenceLimit(model) {
  if (!model || model.category !== 'image' || model.availability !== 'available') return null;
  if (!ROUTERAI_REFERENCE_MODELS.has(model.id) && !CURATED_REFERENCE_MODELS.has(model.id)) return null;
  return inputContractFor(model)?.maximum?.image ?? IMAGE_REFERENCE_PRODUCT_CAP;
}

export function supportsImageReferences(model) {
  return imageReferenceLimit(model) !== null
    || ROUTERAI_REFERENCE_MODELS.has(model?.id)
    || CURATED_REFERENCE_MODELS.has(model?.id);
}

export function buildImageReferenceMessage(model, references = [], error = null) {
  const limit = imageReferenceLimit(model);
  const limitText = limit ? ` из ${limit}` : '';
  const errorText = error ? `\n\n❌ ${String(error)}` : '';
  return Object.freeze({
    text: `<b>🖼 референсы ${model.name}</b>\n\nпришли сюда изображения отдельными сообщениями. они сохранятся для следующей генерации.${limit ? ` за один запуск в боте можно добавить <b>до ${limit}</b>.` : ''}\n\n<b>добавлено:</b> ${references.length}${limitText}${errorText}`,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'сбросить', callback_data: 'imagerefs:reset', style: 'danger' },
          { text: 'готово', callback_data: 'imagerefs:done', style: 'success' }
        ],
        [{ text: '‹ назад к карточке', callback_data: `model:${model.id}` }]
      ]
    }
  });
}

export const IMAGE_REFERENCE_MODEL_IDS = Object.freeze([
  ...ROUTERAI_REFERENCE_MODELS,
  ...CURATED_REFERENCE_MODELS
]);
