import { test } from "node:test";
import assert from "node:assert/strict";
import { getAIConfigStatus, getAIConfig, AI_PROVIDERS } from "@/lib/ai/config";
import { MockAIProvider } from "@/lib/ai/providers/mock";
import { CampaignAnalysisSchema } from "@/lib/ai/schemas";
import type { AIProvider } from "@/lib/ai/provider";

const OLD_ENV = { ...process.env };

test.afterEach(() => {
  process.env = { ...OLD_ENV };
});

test("config: AI_PROVIDERS contains only mock and hemattoken", () => {
  assert.deepEqual(AI_PROVIDERS, ["mock", "hemattoken"]);
});

test("config: mock provider requires no gateway env and reports unconfigured gateway", () => {
  delete process.env.AI_GATEWAY_BASE_URL;
  delete process.env.AI_GATEWAY_API_KEY;
  delete process.env.AI_GATEWAY_MODEL;
  process.env.AI_PROVIDER = "mock";
  const status = getAIConfigStatus();
  assert.equal(status.provider, "mock");
  assert.equal(status.gatewayConfigured, false);
  assert.deepEqual(status.missingVars, []);
  // getAIConfig() in mock mode must not throw.
  const config = getAIConfig();
  assert.equal(config.provider, "mock");
});

test("config: hemattoken without gateway vars throws controlled config error", () => {
  delete process.env.AI_GATEWAY_BASE_URL;
  delete process.env.AI_GATEWAY_API_KEY;
  delete process.env.AI_GATEWAY_MODEL;
  process.env.AI_PROVIDER = "hemattoken";
  assert.throws(() => getAIConfig());
});

test("config: getAIConfigStatus reports missing vars for hemattoken", () => {
  delete process.env.AI_GATEWAY_API_KEY;
  process.env.AI_PROVIDER = "hemattoken";
  process.env.AI_GATEWAY_BASE_URL = "https://api.hemattoken.id/v1";
  process.env.AI_GATEWAY_MODEL = "openai/gpt-5.2";
  const status = getAIConfigStatus();
  assert.equal(status.gatewayConfigured, false);
  assert.deepEqual(status.missingVars, ["AI_GATEWAY_API_KEY"]);
});

test("config: getAIConfigStatus gatewayConfigured when all vars present", () => {
  process.env.AI_PROVIDER = "hemattoken";
  process.env.AI_GATEWAY_BASE_URL = "https://api.hemattoken.id/v1";
  process.env.AI_GATEWAY_API_KEY = "ht-test-key";
  process.env.AI_GATEWAY_MODEL = "anthropic/claude-sonnet-4.5";
  const status = getAIConfigStatus();
  assert.equal(status.gatewayConfigured, true);
  assert.equal(status.model, "anthropic/claude-sonnet-4.5");
});

test("MockAIProvider returns schema-valid campaign analysis and reports name mock", async () => {
  const provider: AIProvider = new MockAIProvider();
  assert.equal(provider.name, "mock");
  const res = await provider.generate({
    schema: CampaignAnalysisSchema,
    schemaName: "CampaignAnalysis",
    system: "s",
    prompt: "p",
  });
  const parsed = CampaignAnalysisSchema.safeParse(res.data);
  assert.equal(parsed.success, true);
});
