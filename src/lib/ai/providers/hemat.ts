import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  APICallError,
  TypeValidationError,
  NoObjectGeneratedError,
  JSONParseError,
  NoSuchModelError,
} from "ai";
import type { GenerateOptions, AIProvider, AIResponse } from "../provider";
import { AIError } from "../errors";
import { getAIConfig } from "../config";

/**
 * Gateway-backed provider.
 *
 * The app never calls Anthropic/OpenAI/Gemini directly — it calls the
 * HematToken gateway, which routes `provider/model` or combo names to the
 * underlying model. We speak the gateway's OpenAI-compatible Chat Completions
 * interface through the Vercel AI SDK.
 *
 * Settings are read from AI_GATEWAY_* env (server-side only). Constructor
 * overrides exist for tests; the client is built lazily per call so tests can
 * point at a local fake gateway.
 */
export interface HematTokenSettings {
  baseURL?: string;
  apiKey?: string;
  model?: string;
  /** Per-call gateway timeout in ms. Default 60s. */
  timeoutMs?: number;
  /** Transient-failure retries. Tests set 0 to avoid retry backoff. */
  maxRetries?: number;
}

export class HematTokenProvider implements AIProvider {
  readonly name = "hemattoken";
  private readonly overrides?: HematTokenSettings;

  constructor(overrides?: HematTokenSettings) {
    this.overrides = overrides;
  }

  async generate<T>(options: GenerateOptions<T>): Promise<AIResponse<T>> {
    const { schema, schemaName, system, prompt, model } = options;

    // Config is required only when this provider is actually used, so mock
    // mode keeps working with zero keys. Overrides are for tests only.
    const config = this.overrides
      ? {
          baseURL: this.overrides.baseURL ?? "",
          apiKey: this.overrides.apiKey ?? "",
          model: this.overrides.model ?? "",
        }
      : {
          baseURL: getAIConfig().baseURL ?? "",
          apiKey: process.env.AI_GATEWAY_API_KEY ?? "",
          model: getAIConfig().model ?? "",
        };

    if (!config.baseURL || !config.apiKey || !config.model) {
      throw new AIError(
        "config",
        "Missing AI_GATEWAY_BASE_URL, AI_GATEWAY_API_KEY or AI_GATEWAY_MODEL."
      );
    }

    const provider = createOpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey,
    });

    const timeoutMs = this.overrides?.timeoutMs ?? 60_000;

    try {
      const result = await generateObject({
        model: provider.chat(model ?? config.model),
        schema,
        schemaName,
        system,
        prompt,
        abortSignal: AbortSignal.timeout(timeoutMs),
        maxRetries: this.overrides?.maxRetries ?? 2,
        // ponytail: gateway JSON-mode support varies by upstream model. If a
        // backend rejects response_format, add a retry with mode:"json" here.
      });
      const { inputTokens, outputTokens, totalTokens } = result.usage ?? {};
      const computedTotal =
        inputTokens != null || outputTokens != null
          ? (inputTokens ?? 0) + (outputTokens ?? 0)
          : undefined;
      return {
        data: result.object,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: totalTokens ?? computedTotal,
        },
      };
    } catch (error) {
      throw mapAIError(error);
    }
  }
}

/** Translate gateway/SDK failures into controlled, secret-free AI errors. */
function mapAIError(error: unknown): AIError {
  if (error instanceof AIError) return error;

  // HTTP-level failures from the gateway.
  if (error instanceof APICallError) {
    const status = error.statusCode;
    switch (status) {
      case 400:
        return new AIError("invalid_model", `(HTTP ${status})`);
      case 401:
        return new AIError("authentication", `(HTTP ${status})`);
      case 403:
        return new AIError("permission", `(HTTP ${status})`);
      case 404:
        return new AIError("invalid_model", `(HTTP ${status})`);
      case 429:
        return new AIError("rate_limit", `(HTTP ${status})`);
      default:
        return status && status >= 500
          ? new AIError("server_error", `(HTTP ${status})`)
          : new AIError("unknown", `(HTTP ${status ?? "?"})`);
    }
  }

  if (error instanceof NoSuchModelError) {
    return new AIError("invalid_model");
  }
  if (error instanceof TypeValidationError) {
    return new AIError("validation");
  }
  if (error instanceof JSONParseError) {
    return new AIError("invalid_response");
  }
  if (error instanceof NoObjectGeneratedError) {
    // The SDK wraps a zod mismatch in NoObjectGeneratedError with the real
    // TypeValidationError as its cause. Surface that as validation, not a
    // generic invalid_response.
    const cause = (error as { cause?: unknown }).cause;
    if (cause instanceof TypeValidationError) return new AIError("validation");
    return new AIError("invalid_response");
  }

  // Native network errors (fetch failure, connection refused, aborted).
  const name = error instanceof Error ? error.name : "";
  if (name === "TimeoutError" || name === "AbortError" || name === "ETIMEDOUT") {
    return new AIError("timeout");
  }

  return new AIError("unknown", error instanceof Error ? error.message : undefined);
}
