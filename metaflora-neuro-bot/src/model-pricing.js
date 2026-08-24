import { getSubscriptionOffer, SUBSCRIPTION_PLANS } from './billing-catalog.js';
import { FINANCE_POLICY } from './finance-policy.js';
import { inputProfileFor } from './model-profiles.js';
import {
  confirmedProviderCostRangeRubles,
  confirmedProviderPriceFor,
  LLM_PRICE_RANGE_PROFILE,
  routeraiImageOutputTokensForSettings
} from './provider-pricing.js';

const FREE_MODEL_IDS = new Set([
  'gpt_oss_20b_free',
  'ling_30_flash_free',
  'nemotron_3_ultra_free',
  'nemotron_3_super_free',
  'gemma_4_31b_free',
  'north_mini_code_free',
  'nemotron_3_nano_omni_free'
]);

const PREMIUM_LLM = /(?:luna pro|terra pro|fable|opus|o3 pro|deepseek.*pro|gemini.*pro|grok.*heavy|kimi k3)/i;
const ECONOMY_LLM = /(?:mini|nano|flash|lite|small|free|scout|20b)/i;
const PREMIUM_IMAGE = /(?:gpt image 2|nano banana pro|midjourney|seedream 5.*pro|flux 2 pro|recraft.*pro)/i;
const ECONOMY_IMAGE = /(?:lite|mini|flash|schnell|upscal|remove|background)/i;
const PREMIUM_VIDEO = /(?:veo|sora|seedance 2\.0$|kling 3.*pro|higgsfield|runway)/i;
const ECONOMY_VIDEO = /(?:mini|fast|flash|lite|ltx|mochi)/i;
const PREMIUM_AUDIO = /(?:suno|elevenlabs music|udio|musicgen)/i;

export const METACOIN_PRICING_POLICY = Object.freeze({
  usdRubRate: 90,
  failoverReservePercent: FINANCE_POLICY.failoverReservePercent,
  polzaReservePercent: FINANCE_POLICY.polzaReservePercent,
  paymentFeePercent: FINANCE_POLICY.paymentFeePercent,
  targetGrossMarginPercent: FINANCE_POLICY.targetGrossMarginPercent
});

function paidSubscriptionOffers() {
  return SUBSCRIPTION_PLANS
    .filter(({ priceKopecks }) => priceKopecks > 0)
    .flatMap(({ id }) => [getSubscriptionOffer(id, 1), getSubscriptionOffer(id, 3)]);
}

export function minimumTariffRublesPerMetacoin() {
  return Math.min(...paidSubscriptionOffers().map(
    ({ priceKopecks, metacoins }) => (priceKopecks / 100) / metacoins
  ));
}

export function providerCostUsdToMetacoins(providerCostUsd, policy = METACOIN_PRICING_POLICY) {
  if (!Number.isFinite(providerCostUsd) || providerCostUsd < 0) {
    throw new TypeError('Provider cost must be a non-negative number.');
  }
  return providerCostRublesToMetacoins(providerCostUsd * policy.usdRubRate, policy);
}

export function providerCostRublesToMetacoins(providerCostRubles, policy = METACOIN_PRICING_POLICY) {
  if (!Number.isFinite(providerCostRubles) || providerCostRubles < 0) {
    throw new TypeError('Provider cost must be a non-negative number.');
  }
  if (providerCostRubles === 0) return 0;

  const retainedShare = 1
    - (policy.paymentFeePercent / 100)
    - (policy.targetGrossMarginPercent / 100)
    - ((policy.polzaReservePercent ?? 0) / 100);
  if (retainedShare <= 0) throw new RangeError('Pricing policy leaves no share for provider costs.');

  const reservedCostRubles = providerCostRubles * (1 + ((policy.failoverReservePercent ?? 0) / 100));
  const requiredRevenueRubles = reservedCostRubles / retainedShare;
  return Math.max(1, Math.ceil(requiredRevenueRubles / minimumTariffRublesPerMetacoin()));
}

export function repriceLegacyMetacoins(
  metacoins,
  {
    baselineGrossMarginPercent = 40,
    policy = METACOIN_PRICING_POLICY
  } = {}
) {
  if (!Number.isFinite(metacoins) || metacoins < 0) {
    throw new TypeError('Metacoin price must be a non-negative number.');
  }
  if (metacoins === 0) return 0;

  const baselineRetainedShare = 1
    - (policy.paymentFeePercent / 100)
    - (baselineGrossMarginPercent / 100);
  const targetRetainedShare = 1
    - (policy.paymentFeePercent / 100)
    - (policy.targetGrossMarginPercent / 100)
    - ((policy.polzaReservePercent ?? 0) / 100);
  if (baselineRetainedShare <= 0 || targetRetainedShare <= 0) {
    throw new RangeError('Pricing policy leaves no share for provider costs.');
  }

  return Math.max(1, Math.ceil(
    metacoins * (baselineRetainedShare / targetRetainedShare)
  ));
}

function numeric(value, fallback = 1) {
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolutionFactor(value) {
  const normalized = String(value ?? '').toLowerCase();
  if (/(?:4k|uhd|2160|4096)/.test(normalized)) return 2.5;
  if (/(?:2k|1440|1536|1792|2048)/.test(normalized)) return 1.55;
  if (/(?:1080|1k|1024|square_hd|portrait_hd|landscape_hd)/.test(normalized)) return 1.2;
  if (/(?:480|512|540|580)/.test(normalized)) return 0.72;
  return 1;
}

function resolutionMegapixels(value) {
  const normalized = String(value ?? '').toLowerCase();
  if (/(?:2k|2048)/.test(normalized)) return 4;
  if (/(?:1280)/.test(normalized)) return 1.5625;
  if (/(?:512)/.test(normalized)) return 0.25;
  return 1;
}

function qualityFactor(value) {
  if (value === 'low') return 0.65;
  if (value === 'medium') return 0.82;
  return 1;
}

function seconds(value, fallback = 5) {
  if (value === 'auto') return fallback;
  return Math.max(1, numeric(String(value).replace(/s$/i, ''), fallback));
}

const APPROVED_SEEDANCE_RETAIL_RATES = Object.freeze({
  seedance_20: Object.freeze({
    default: 32
  }),
  seedance_25: Object.freeze({ default: 48 })
});

function retailRublesToMetacoins(retailRubles) {
  return Math.max(1, Math.ceil(retailRubles / minimumTariffRublesPerMetacoin()));
}

function costRange(kind, minUsd, maxUsd) {
  return Object.freeze({ kind, minUsd, maxUsd });
}

function unitCost(kind, usd, options = {}) {
  return Object.freeze({ kind, usd, ...options });
}

function confirmedProviderPricesForModel(model) {
  const providerModelIds = [...new Set([
    model?.providerModelId,
    ...(model?.providerModels ?? [])
  ].filter(Boolean))];
  const routedPrices = providerModelIds
    .map((providerModelId) => confirmedProviderPriceFor(providerModelId))
    .filter(Boolean);
  // A routed live provider price must win over a stale pricing payload copied
  // into an old card. Keep that payload only for a genuine Polza-only card.
  return routedPrices.length > 0
    ? routedPrices
    : model?.providerPricing
      ? [model.providerPricing]
      : [];
}

function confirmedModelCostRangeRubles(model) {
  for (const price of confirmedProviderPricesForModel(model)) {
    const range = confirmedProviderCostRangeRubles(price);
    if (range) return range;
  }
  return null;
}

function settingForTierCondition(settings, key) {
  if (key === 'sound') return String(settings.generate_audio ?? 'false');
  if (key === 'mode') return String(settings.resolution ?? '');
  if (key === 'has_video') return String(settings.has_video ?? 'false');
  return String(settings[key] ?? '');
}

function tierCostRubles(price, settings) {
  const matches = (price?.tierPrices ?? [])
    .filter(({ conditions }) => Object.entries(conditions).every(
      ([key, value]) => settingForTierCondition(settings, key) === String(value)
    ))
    .sort((left, right) => Object.keys(right.conditions).length - Object.keys(left.conditions).length);
  return matches[0]?.costRubles ?? null;
}

function confirmedModelSettingsCostRubles(model, settings, usage = {}) {
  const prices = confirmedProviderPricesForModel(model);
  for (const price of prices) {
    const range = confirmedProviderCostRangeRubles(price);
    if (!range) continue;
    const selectedTierCost = tierCostRubles(price, settings);
    if (range.kind === 'llm') {
      const inputTokens = Math.max(1, numeric(
        usage.inputTokens,
        LLM_PRICE_RANGE_PROFILE.maxInputTokens
      ));
      const outputTokens = Math.max(1, numeric(
        usage.outputTokens,
        LLM_PRICE_RANGE_PROFILE.maxOutputTokens
      ));
      return (
        (price.inputRublesPerMillion * inputTokens)
        + (price.outputRublesPerMillion * outputTokens)
      ) / 1_000_000;
    }
    if (range.kind === 'video_seconds') {
      return (selectedTierCost ?? range.minRubles) * seconds(settings.duration, 5);
    }
    if (range.kind === 'request_units') {
      return selectedTierCost ?? (range.maxRubles * Math.max(1, numeric(settings.num_images, 1)));
    }
    if (range.kind === 'image_output_tokens') {
      const inputTokens = Math.max(1, numeric(
        usage.inputTokens,
        LLM_PRICE_RANGE_PROFILE.maxInputTokens
      ));
      const outputTokens = Math.max(1, numeric(
        usage.outputTokens,
        LLM_PRICE_RANGE_PROFILE.maxOutputTokens
      ));
      const textCost = (
        (price.inputRublesPerMillion * inputTokens)
        + (price.outputRublesPerMillion * outputTokens)
      ) / 1_000_000;
      const imageCost = price.rublesPerImageOutputToken
        * routeraiImageOutputTokensForSettings(settings, price.providerModelId)
        * Math.max(1, numeric(settings.num_images, 1));
      return textCost + imageCost;
    }
    if (range.kind === 'image_megapixels') {
      const requestedReferences = Math.max(0, numeric(usage.imageReferences, 0));
      const referenceCount = Math.min(price.maxInputReferences, requestedReferences);
      const imageCount = Math.max(1, numeric(settings.num_images, 1));
      return (
        price.outputRublesPerMegapixel
        * price.maxOutputMegapixels
        * imageCount
      ) + (
        price.inputRublesPerMegapixel
        * price.maxInputMegapixels
        * referenceCount
      );
    }
    if (range.kind === 'audio_minutes') {
      return range.maxRubles * Math.max(1 / 60, seconds(settings.duration, 60) / 60);
    }
    if (range.kind === 'character_million') {
      const characters = Math.max(1, numeric(usage.characters, 1));
      return range.maxRubles * (characters / 1_000);
    }
    if (range.kind === 'token_million') {
      const tokens = Math.max(1, numeric(usage.tokens, 1));
      return range.maxRubles * (tokens / 1_000_000);
    }
    throw new TypeError(`Unsupported confirmed provider cost kind: ${range.kind}`);
  }
  return null;
}

export function confirmedProviderModelMetacoinRange(providerModelId) {
  const range = confirmedProviderCostRangeRubles(confirmedProviderPriceFor(providerModelId));
  if (!range) return null;
  if (range.kind === 'video_seconds') {
    return Object.freeze({
      min: providerCostRublesToMetacoins(range.minRubles),
      max: providerCostRublesToMetacoins(range.maxRubles)
    });
  }
  return Object.freeze({
    min: providerCostRublesToMetacoins(range.minRubles),
    max: providerCostRublesToMetacoins(range.maxRubles)
  });
}

function classifyProviderCost(model) {
  const label = `${model.id} ${model.name}`;
  if (FREE_MODEL_IDS.has(model.id) || /(?:^|\s)free(?:$|\s)/i.test(label)) {
    return costRange('free', 0, 0);
  }

  if (model.category === 'llm' || model.category === 'experimental') {
    if (PREMIUM_LLM.test(label)) return costRange('llm', 0.045, 0.18);
    if (ECONOMY_LLM.test(label)) return costRange('llm', 0.008, 0.035);
    return costRange('llm', 0.018, 0.09);
  }

  if (model.category === 'image') {
    if (/nano banana pro/i.test(label)) return unitCost('image', 0.15);
    if (PREMIUM_IMAGE.test(label)) return unitCost('image', 0.09);
    if (ECONOMY_IMAGE.test(label)) return unitCost('image', 0.025);
    return unitCost('image', 0.055);
  }

  if (model.category === 'video') {
    if (/minimax h3|minimax-h3/i.test(label)) {
      return unitCost('video', 0.1825, { audioIncluded: true });
    }
    if (/seedance 2(?:\.0)? fast/i.test(label)) {
      return unitCost('video', 0.2419, {
        audioIncluded: true,
        resolutionFactors: { '720p': 1, '1080p': 2.819 }
      });
    }
    if (/seedance 2/i.test(label)) {
      return unitCost('video', 0.3034, {
        audioIncluded: true,
        resolutionFactors: { '720p': 1, '1080p': 2.248 }
      });
    }
    if (/kling 3.*pro/i.test(label)) {
      return unitCost('video', 0.112, { audioMultiplier: 1.5 });
    }
    if (/kling 3/i.test(label)) {
      return unitCost('video', 0.084, { audioMultiplier: 1.5 });
    }
    if (/veo/i.test(label)) return unitCost('video', 0.15);
    if (/kling/i.test(label)) return unitCost('video', 0.075, { audioMultiplier: 1.5 });
    if (/sora/i.test(label)) return unitCost('video', 0.1);
    if (/seedance.*mini/i.test(label)) return unitCost('video', 0.12, { audioIncluded: true });
    if (/seedance/i.test(label)) return unitCost('video', 0.18, { audioIncluded: true });
    if (PREMIUM_VIDEO.test(label)) return unitCost('video', 0.08);
    if (ECONOMY_VIDEO.test(label)) return unitCost('video', 0.02);
    return unitCost('video', 0.04);
  }

  if (model.category === 'audio') {
    return unitCost('audio', PREMIUM_AUDIO.test(label) ? 0.12 : 0.055);
  }

  if (model.category === 'voice') {
    return /clone|клон|eleven/i.test(label)
      ? costRange('voice', 0.015, 0.12)
      : costRange('voice', 0.008, 0.06);
  }

  if (model.category === '3d') return unitCost('3d', 0.22);
  if (model.category === 'tools') return costRange('tools', 0.015, 0.16);

  if (model.category === 'russian') {
    if (/art|kandinsky/i.test(label)) return unitCost('image', 0.04);
    if (/gigaam/i.test(label)) return costRange('voice', 0.008, 0.045);
    return costRange('llm', 0.008, 0.055);
  }

  return costRange('tools', 0.015, 0.12);
}

export function calculateMetacoinPrice(model, settings = {}, usage = {}) {
  const seedanceRetailRates = APPROVED_SEEDANCE_RETAIL_RATES[model.id];
  if (seedanceRetailRates) {
    const seedanceRetailRate = seedanceRetailRates[settings.resolution]
      ?? seedanceRetailRates.default;
    const retailMetacoins = retailRublesToMetacoins(
      seedanceRetailRate * seconds(settings.duration, model.id === 'seedance_25' ? 8 : 10)
    );
    const confirmedCostRubles = confirmedModelSettingsCostRubles(model, settings);
    return confirmedCostRubles === null
      ? retailMetacoins
      : Math.max(retailMetacoins, providerCostRublesToMetacoins(confirmedCostRubles));
  }

  const confirmedCostRubles = confirmedModelSettingsCostRubles(model, settings, usage);
  if (confirmedCostRubles !== null) return providerCostRublesToMetacoins(confirmedCostRubles);

  const quantity = Math.max(1, numeric(settings.num_images, 1));
  const megapixels = resolutionMegapixels(settings.resolution);
  if (model.id === 'ideogram_4' || model.id === 'ideogram_4_fast') {
    const rates = model.id === 'ideogram_4'
      ? { turbo: 0.0075, balanced: 0.015, quality: 0.025 }
      : { turbo: 0.00525, balanced: 0.0105, quality: 0.0175 };
    const rate = rates[settings.quality] ?? rates.balanced;
    return providerCostUsdToMetacoins(rate * megapixels * quantity);
  }
  if (model.id === 'cosmos_3_super') {
    const expansion = settings.prompt_expansion === true || settings.prompt_expansion === 'true';
    return providerCostUsdToMetacoins((0.04 + (expansion ? 0.02 : 0)) * quantity);
  }
  if (model.id === 'flux_2_klein_4b' || model.id === 'flux_2_klein_9b') {
    const rate = model.id === 'flux_2_klein_4b' ? 0.005 : 0.006;
    return providerCostUsdToMetacoins(rate * megapixels * quantity);
  }

  const cost = classifyProviderCost(model);
  if (cost.kind === 'free') return 0;
  if (Number.isFinite(cost.minUsd)) return providerCostUsdToMetacoins(cost.minUsd);

  const resolution = resolutionFactor(settings.resolution);
  const quality = qualityFactor(settings.quality);
  let providerCostUsd = cost.usd;

  if (cost.kind === 'image') {
    providerCostUsd *= resolution * quality * quantity;
  } else if (cost.kind === 'video') {
    const duration = seconds(settings.duration, 5);
    const audioEnabled = settings.generate_audio === true || settings.generate_audio === 'true';
    const audio = audioEnabled && !cost.audioIncluded ? (cost.audioMultiplier ?? 1.18) : 1;
    const exactResolution = cost.resolutionFactors?.[settings.resolution];
    providerCostUsd *= duration * (exactResolution ?? resolution) * audio;
  } else if (cost.kind === 'audio') {
    const duration = seconds(settings.duration, 60);
    providerCostUsd *= Math.max(1, duration / 60);
  } else if (cost.kind === '3d') {
    providerCostUsd *= resolution;
  }

  return providerCostUsdToMetacoins(providerCostUsd);
}

export function calculateProviderFloorMetacoins(model, settings = {}, usage = {}) {
  const confirmedCostRubles = confirmedModelSettingsCostRubles(model, settings, usage);
  if (confirmedCostRubles !== null) {
    return providerCostRublesToMetacoins(confirmedCostRubles);
  }
  return calculateMetacoinPrice(model, settings, usage);
}

function settingCandidates(model) {
  return inputProfileFor(model).map((definition) => [
    definition.key,
    definition.values.map(({ value }) => value)
  ]);
}

function settingCombinations(candidates, index = 0, current = {}) {
  if (index >= candidates.length) return [current];
  const [key, values] = candidates[index];
  return values.flatMap((value) => settingCombinations(
    candidates,
    index + 1,
    { ...current, [key]: value }
  ));
}

export function getMetacoinPriceRange(model) {
  const confirmedRange = confirmedModelCostRangeRubles(model);
  if (confirmedRange && ['request_units', 'video_seconds', 'image_output_tokens', 'image_megapixels'].includes(confirmedRange.kind)) {
    const combinations = settingCombinations(settingCandidates(model));
    if (combinations.length > 1 || Object.keys(combinations[0] ?? {}).length > 0) {
      const values = combinations.map((settings) => calculateMetacoinPrice(model, settings));
      const providerBounds = ['request_units', 'image_megapixels'].includes(confirmedRange.kind)
        ? [
          providerCostRublesToMetacoins(confirmedRange.minRubles),
          providerCostRublesToMetacoins(confirmedRange.maxRubles)
        ]
        : [];
      return {
        min: Math.min(...providerBounds, ...values),
        max: Math.max(...providerBounds, ...values)
      };
    }
    const providerBounds = [
      providerCostRublesToMetacoins(confirmedRange.minRubles),
      providerCostRublesToMetacoins(confirmedRange.maxRubles)
    ];
    const values = ['video_seconds', 'image_output_tokens', 'image_megapixels'].includes(confirmedRange.kind)
      ? [calculateMetacoinPrice(model, {})]
      : [];
    return {
      min: Math.min(...providerBounds, ...values),
      max: Math.max(...providerBounds, ...values)
    };
  }
  if (confirmedRange && ['llm', 'audio_minutes', 'character_million', 'token_million'].includes(confirmedRange.kind)) {
    return {
      min: providerCostRublesToMetacoins(confirmedRange.minRubles),
      max: providerCostRublesToMetacoins(confirmedRange.maxRubles)
    };
  }

  const cost = classifyProviderCost(model);
  if (cost.kind === 'free') return { min: 0, max: 0 };
  if (Number.isFinite(cost.minUsd) && Number.isFinite(cost.maxUsd)) {
    return {
      min: providerCostUsdToMetacoins(cost.minUsd),
      max: providerCostUsdToMetacoins(cost.maxUsd)
    };
  }

  const combinations = settingCombinations(settingCandidates(model));
  const values = combinations.map((settings) => calculateMetacoinPrice(model, settings));
  return { min: Math.min(...values), max: Math.max(...values) };
}

export function formatMetacoinPrice(model, settings) {
  const cost = classifyProviderCost(model);
  if (settings && !['llm', 'voice', 'tools'].includes(cost.kind)) {
    return String(calculateMetacoinPrice(model, settings));
  }
  const { min, max } = getMetacoinPriceRange(model);
  return min === max ? String(min) : `${min}–${max}`;
}
