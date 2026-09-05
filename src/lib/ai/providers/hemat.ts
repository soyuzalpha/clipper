import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  APICallError,
  NoSuchModelError,
} from "ai";
import type { z } from "zod";
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
 *
 * Why generateText and not generateObject: the HematToken gateway passes
 * Chat Completions through without honoring `response_format` (structured
 * outputs / json_object). generateObject therefore always fails — the upstream
 * model emits a plain-text reasoning preamble then chats. We instead request a
 * normal completion, have the prompt demand JSON, and recover the object from
 * the reply text with extractJSON (which tolerates the preamble), then
 * validate it with zod. Structured output is still guaranteed — by the schema
 * parse at this boundary, not by the transport.
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
    const { schema, system, prompt, model } = options;

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
      const result = await generateText({
        model: provider.chat(model ?? config.model),
        system,
        prompt,
        abortSignal: AbortSignal.timeout(timeoutMs),
        maxRetries: this.overrides?.maxRetries ?? 2,
      });
      const data = parseStructured(result.text, schema);
      const { inputTokens, outputTokens, totalTokens } = result.usage ?? {};
      const computedTotal =
        inputTokens != null || outputTokens != null
          ? (inputTokens ?? 0) + (outputTokens ?? 0)
          : undefined;
      return {
        data,
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

/**
 * Recover a schema-valid object from a gateway reply. The upstream model often
 * prefixes its answer with a reasoning preamble, so we scan for the first
 * balanced JSON object, parse it, then validate against `schema`.
 */
function parseStructured<T>(text: string, schema: z.ZodType<T>): T {
  let json: string;
  try {
    json = extractJSONObject(text);
  } catch {
    throw new AIError("invalid_response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new AIError("invalid_response");
  }

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    throw new AIError("validation");
  }
  return validated.data;
}

/** Return the first balanced `{ … }` substring, honoring strings + escapes. */
function extractJSONObject(text: string): string {
  const start = text.indexOf("{");
  if (start === -1) {
    throw new Error("no JSON object in response");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  throw new Error("unbalanced JSON object in response");
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

  // Native network errors (fetch failure, connection refused, aborted).
  const name = error instanceof Error ? error.name : "";
  if (name === "TimeoutError" || name === "AbortError" || name === "ETIMEDOUT") {
    return new AIError("timeout");
  }

  return new AIError("unknown", error instanceof Error ? error.message : undefined);
}
