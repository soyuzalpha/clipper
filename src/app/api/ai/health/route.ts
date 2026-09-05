import { NextResponse } from "next/server";
import { getAIConfigStatus } from "@/lib/ai/config";

/**
 * Development-safe AI health check. Verifies configuration exists and the
 * provider can initialize. Returns NO secrets — never the gateway key or
 * headers. A live gateway probe is deliberately not attempted here to keep
 * this endpoint cheap and safe to hit from monitoring.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const status = getAIConfigStatus();

  const healthy =
    status.provider === "mock" || status.gatewayConfigured;

  return NextResponse.json(
    {
      ok: healthy,
      provider: status.provider,
      model: status.model ?? null,
      baseURL: status.baseURL ?? null,
      gatewayConfigured: status.gatewayConfigured,
      missingVars: status.missingVars,
      // ponytail: a real gateway round-trip probe can be added when there is a
      // non-production gateway to ping without burning tokens.
      message: healthy
        ? "AI configuration OK"
        : `AI provider "${status.provider}" is missing gateway env vars.`,
    },
    { status: healthy ? 200 : 503 }
  );
}
