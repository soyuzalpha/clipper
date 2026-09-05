/**
 * Server-side AI gateway configuration.
 *
 * The app talks to AI through a gateway/router (HematToken), never to a
 * vendor API directly. Credentials live only here, on the server — nothing
 * in this module is safe to import from client components.
 *
 * AI_PROVIDER selects the layer: `mock` (default, zero keys) or `hemattoken`.
 */
import { z } from "zod";

export const AI_PROVIDERS = ["mock", "hemattoken"] as const;
export type AIProviderId = (typeof AI_PROVIDERS)[number];

const gatewaySchema = z.object({
  AI_PROVIDER: z.enum(AI_PROVIDERS).default("mock"),
  AI_GATEWAY_BASE_URL: z.string().url(),
  AI_GATEWAY_API_KEY: z.string().min(1),
  AI_GATEWAY_MODEL: z.string().min(1),
});

export interface AIConfig {
  provider: AIProviderId;
  /** Base URL for the gateway (unset in mock mode). */
  baseURL?: string;
  /** Gateway model id — `provider/model` or a combo name (unset in mock mode). */
  model?: string;
  /** True when the gateway key is present server-side (never sent to the client). */
  gatewayConfigured: boolean;
}

/**
 * Lazy-read the resolved AI config. Throws a controlled error if a real
 * (non-mock) provider is selected but its gateway settings are incomplete,
 * so misconfiguration surfaces loudly instead of half-working.
 */
export function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER ?? "mock") as AIProviderId;

  if (provider === "mock") {
    return { provider, gatewayConfigured: false };
  }

  const parsed = gatewaySchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => i.path.join("."))
      .join(", ");
    throw new Error(
      `AI provider "${provider}" requires gateway env vars: ${missing}. ` +
        `Set AI_GATEWAY_BASE_URL, AI_GATEWAY_API_KEY and AI_GATEWAY_MODEL in .env.`
    );
  }

  return {
    provider: parsed.data.AI_PROVIDER,
    baseURL: parsed.data.AI_GATEWAY_BASE_URL,
    model: parsed.data.AI_GATEWAY_MODEL,
    gatewayConfigured: true,
  };
}

/** Non-throwing status probe for health checks / settings UI. */
export function getAIConfigStatus(): AIConfig & { missingVars: string[] } {
  const provider = (process.env.AI_PROVIDER ?? "mock") as AIProviderId;
  const required = ["AI_GATEWAY_BASE_URL", "AI_GATEWAY_API_KEY", "AI_GATEWAY_MODEL"];
  const missingVars =
    provider === "hemattoken"
      ? required.filter((k) => !process.env[k])
      : [];

  const gatewayConfigured =
    provider === "hemattoken" && missingVars.length === 0;

  return {
    provider,
    baseURL: process.env.AI_GATEWAY_BASE_URL,
    model: process.env.AI_GATEWAY_MODEL,
    gatewayConfigured,
    missingVars,
  };
}
