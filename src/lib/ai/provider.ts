import type { z } from "zod";
import { MockAIProvider } from "./providers/mock";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";

/**
 * Provider-agnostic AI interface. The app depends on this, never on a vendor SDK.
 * Structured output only — every call validates against a Zod schema.
 */
export interface AIProvider {
  readonly name: string;
  /** Generate a structured response validated against `schema`. */
  generate<T>(options: GenerateOptions<T>): Promise<T>;
}

export interface GenerateOptions<T> {
  /** Schema the response must satisfy. */
  schema: z.ZodType<T>;
  /** Optional schema name — helps providers pick JSON modes / tool names. */
  schemaName?: string;
  system?: string;
  prompt: string;
}

export type ProviderId = "mock" | "openai" | "anthropic";

/**
 * Resolve the active provider from env. Mock works with zero keys,
 * so it's the safe default — the app must always function without AI credentials.
 */
export function getAIProvider(): AIProvider {
  const id = (process.env.AI_PROVIDER ?? "mock") as ProviderId;
  switch (id) {
    case "openai":
      return new OpenAIProvider();
    case "anthropic":
      return new AnthropicProvider();
    default:
      return new MockAIProvider();
  }
}