import { z } from "zod";
import { getAIProvider } from "../provider";
import { getAIConfigStatus } from "../config";
import { AIError } from "../errors";

const ProbeSchema = z.object({ ok: z.boolean() });

export interface AIProbeResult {
  provider: "hemattoken" | "mock";
  /** Present only when a real gateway call succeeded. */
  model?: string;
  /** Round-trip latency in ms (gateway call only). */
  latencyMs?: number;
}

/**
 * One real AI round-trip against the configured gateway. Reports provider
 * state; when hemattoken is configured, fires a minimal call through the same
 * provider the app uses and returns latency. Used by the Settings
 * "Test AI connection" button — it would have caught the gateway returning
 * unparseable output that the config-only health check misses.
 */
export async function probeAIConnection(): Promise<AIProbeResult> {
  const status = getAIConfigStatus();

  if (!status.gatewayConfigured) {
    return {
      provider: status.provider === "mock" ? "mock" : "hemattoken",
    };
  }

  const startedAt = Date.now();
  try {
    await getAIProvider().generate({
      schema: ProbeSchema,
      schemaName: "AIProbe",
      system: "You are a connectivity check. Reply only with JSON.",
      prompt: 'Reply with exactly: {"ok": true}',
    });
    return {
      provider: "hemattoken",
      model: status.model,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    // Re-throw the controlled AIError so the caller maps it to a safe message.
    throw error instanceof AIError
      ? error
      : new AIError("unknown");
  }
}
