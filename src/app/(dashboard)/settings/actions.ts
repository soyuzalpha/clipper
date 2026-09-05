"use server";

import { requireAuth } from "@/lib/auth";
import { getAIConfigStatus } from "@/lib/ai/config";
import { probeAIConnection } from "@/lib/ai/services/connection-probe";
import { AIError } from "@/lib/ai/errors";

export type TestAIConnectionResult =
  | { ok: true; provider: "hemattoken" | "mock"; model?: string; latencyMs?: number }
  | { ok: false; provider: "hemattoken" | "mock"; error: string; missingVars?: string[] };

/**
 * Fire one real AI round-trip so the Settings UI can prove the gateway works.
 * In mock mode (or when gateway vars are incomplete) no call is attempted —
 * the result explains what is missing instead.
 */
export async function testAIConnection(): Promise<TestAIConnectionResult> {
  const unauth = await requireAuth();
  if (unauth) return { ok: false, provider: "mock", error: "Unauthorized" };

  const status = getAIConfigStatus();
  const provider = status.provider === "mock" ? "mock" : "hemattoken";

  if (!status.gatewayConfigured) {
    return {
      ok: false,
      provider,
      error:
        status.missingVars.length > 0
          ? `Gateway is missing: ${status.missingVars.join(", ")}.`
          : "AI is not configured.",
      missingVars: status.missingVars,
    };
  }

  try {
    const result = await probeAIConnection();
    return {
      ok: true,
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
    };
  } catch (error) {
    return {
      ok: false,
      provider,
      error: error instanceof AIError ? error.safeMessage : "The AI connection test failed.",
    };
  }
}
