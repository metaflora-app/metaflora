import gptunnelLogo from "../../assets/providers/gptunnel.svg";
import routerAiLogo from "../../assets/providers/routerai.svg";
import polzaLogo from "../../assets/providers/polza.svg";
import elevenLabsLogo from "../../assets/providers/elevenlabs.svg";
import falLogo from "../../assets/providers/fal.svg";
import openRouterLogo from "../../assets/providers/openrouter.svg";
import replicateLogo from "../../assets/providers/replicate.svg";
import sunoLogo from "../../assets/providers/suno.svg";
import requestyLogo from "../../assets/providers/requesty.png";

const IDENTITIES = Object.freeze({
  polza: Object.freeze({ label: "Polza", logo: polzaLogo }),
  gptunnel: Object.freeze({ label: "GPTunnel", logo: gptunnelLogo }),
  routerai: Object.freeze({ label: "RouterAI", logo: routerAiLogo }),
  openrouter: Object.freeze({ label: "OpenRouter", logo: openRouterLogo }),
  fal: Object.freeze({ label: "fal.ai", logo: falLogo }),
  replicate: Object.freeze({ label: "Replicate", logo: replicateLogo }),
  elevenlabs: Object.freeze({ label: "ElevenLabs", logo: elevenLabsLogo }),
  suno: Object.freeze({ label: "Suno", logo: sunoLogo }),
  requesty: Object.freeze({ label: "Requesty", logo: requestyLogo }),
});

export function resolveProviderIdentity(provider) {
  const identity = IDENTITIES[String(provider?.id ?? "").toLowerCase()];
  if (identity) return identity;
  return Object.freeze({
    label: String(provider?.name ?? provider?.id ?? "неизвестный провайдер"),
    logo: null,
  });
}

export { IDENTITIES as PROVIDER_IDENTITIES };
