import type { z } from "zod";
import { MockAIProvider } from "./providers/mock";
import { HematTokenProvider } from "./providers/hemat";
import type { AIProviderId } from "./config";

/**
 * Provider-agnostic AI interface. The app depends on this, never on a gateway
 * or vendor SDK. Structured output only — every call validates against a Zod
 * schema.
 */
export interface AIUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface AIResponse<T> {
  /** Schema-validated structured output. */
  data: T;
  /** Token usage when the gateway reports it — never invented otherwise. */
  usage?: AIUsage;
}

export interface AIProvider {
  readonly name: string;
  /** Generate a structured response validated against `schema`. */
  generate<T>(options: GenerateOptions<T>): Promise<AIResponse<T>>;
}

export interface GenerateOptions<T> {
  /** Schema the response must satisfy. */
  schema: z.ZodType<T>;
  /** Optional schema name — helps providers pick JSON modes / tool names. */
  schemaName?: string;
  system?: string;
  prompt: string;
  /**
   * Optional model override. Set by the AI Router when a task maps to a
   * specific tier; providers fall back to their configured default.
   */
  model?: string;
}

export type ProviderId = AIProviderId;

/**
 * Resolve the active provider from AI_PROVIDER. Mock works with zero keys,
 * so it's the safe default — the app must always function without credentials.
 */
export function getAIProvider(): AIProvider {
  const id = (process.env.AI_PROVIDER ?? "mock") as AIProviderId;
  switch (id) {
    case "hemattoken":
      return new HematTokenProvider();
    default:
      return new MockAIProvider();
  }
}
