import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeCampaign } from "@/lib/ai/services/campaign-analyzer";
import { generateContentIdeas } from "@/lib/ai/services/content-idea-generator";
import { askAIAssistant } from "@/lib/ai/services/assistant";
import { CampaignAnalysisSchema, ContentIdeasSchema, AssistantReplySchema } from "@/lib/ai/schemas";
import type { AIProvider, AIResponse, GenerateOptions } from "@/lib/ai/provider";
import { AIError } from "@/lib/ai/errors";

/**
 * Provider that never touches a network or DB — returns a fixed fixture per
 * schemaName so we exercise the service→router plumbing, not the transport.
 */
class StubProvider implements AIProvider {
  readonly name = "stub";
  calls: Array<{ schemaName?: string; system?: string; prompt: string }> = [];

  constructor(
    private readonly fixtures: Record<string, unknown>,
    private readonly fail?: (schemaName?: string) => AIError
  ) {}

  async generate<T>(options: GenerateOptions<T>): Promise<AIResponse<T>> {
    this.calls.push({
      schemaName: options.schemaName,
      system: options.system,
      prompt: options.prompt,
    });
    if (this.fail) throw this.fail(options.schemaName);
    return { data: this.fixtures[options.schemaName ?? ""] as T };
  }
}

const campaignInput = {
  name: "Test Campaign",
  description: "Launch a new product",
  objective: "awareness",
  platforms: ["tiktok", "instagram_reels"],
  hashtags: ["#launch"],
  mentions: ["@brand"],
  requirements: [{ kind: "technical", text: "10-60s vertical video" }],
};

const analysisFixture = {
  summary: "Solid brief with clear audience",
  requirements: ["vertical video required"],
  restrictions: ["no music from major labels"],
  risks: ["tight deadline"],
  targetAudience: ["18-30 creators"],
  contentAngles: ["day-in-the-life"],
  strategy: ["tease early, reveal late"],
  opportunityScore: 87,
};

const ideasFixture = {
  ideas: [
    {
      title: "Why your hooks die",
      hook: "Your hook isn't failing because it's bad.",
      angle: "science-backed",
      audience: "TikTok creators 20-35",
      format: "Hook → Problem → Solution → CTA",
      duration: 45,
      structure: ["Tease (0-5s)", "Problem (5-15s)", "CTA (35-45s)"],
      cta: "Comment below",
      platform: "tiktok",
      viralScore: 76,
      difficulty: "medium",
    },
  ],
};

test("analyzeCampaign routes through provider and returns schema-valid analysis", async () => {
  const provider = new StubProvider({ CampaignAnalysis: analysisFixture });
  const result = await analyzeCampaign(campaignInput, {
    provider,
    skipLog: true,
  });
  assert.equal(CampaignAnalysisSchema.safeParse(result).success, true);
  assert.equal(result.opportunityScore, 87);
  assert.equal(provider.calls.length, 1);
  const [call] = provider.calls;
  assert.ok(call);
  assert.equal(call.schemaName, "CampaignAnalysis");
  // Context goes into the prompt as text, never the whole DB objects.
  assert.ok(call.prompt.includes("Test Campaign"));
  assert.ok(call.system && call.system.length > 0);
});

test("generateContentIdeas returns schema-valid ideas and forwards the count context", async () => {
  const provider = new StubProvider({ ContentIdeas: ideasFixture });
  const result = await generateContentIdeas(
    { ...campaignInput, requirements: [{ kind: "technical", text: "10-60s" }] },
    3,
    { provider, skipLog: true }
  );
  assert.equal(ContentIdeasSchema.safeParse(result).success, true);
  assert.equal(result.ideas.length, 1);
  assert.equal(provider.calls.length, 1);
  const [call] = provider.calls;
  assert.ok(call);
  assert.equal(call.schemaName, "ContentIdeas");
  assert.ok(call.prompt.includes("Test Campaign"));
});

test("askAIAssistant returns schema-valid reply grounded in the workspace context", async () => {
  const provider = new StubProvider({ AssistantReply: { reply: "Open 3 campaigns." } });
  const result = await askAIAssistant(
    { question: "How many campaigns are open?", workspaceContext: "Open campaigns: 3" },
    { provider, skipLog: true }
  );
  assert.equal(AssistantReplySchema.safeParse(result).success, true);
  assert.equal(result.reply, "Open 3 campaigns.");
  assert.equal(provider.calls.length, 1);
  const [call] = provider.calls;
  assert.ok(call);
  assert.equal(call.schemaName, "AssistantReply");
  assert.ok(call.prompt.includes("How many campaigns are open?"));
  assert.ok(call.prompt.includes("Open campaigns: 3"));
});

test("service rethrows provider AIError kinds unchanged (no swallowing)", async () => {
  const provider = new StubProvider(
    {},
    () => new AIError("rate_limit", "(HTTP 429)")
  );
  await assert.rejects(
    () => analyzeCampaign(campaignInput, { provider, skipLog: true }),
    (e) => e instanceof AIError && e.kind === "rate_limit"
  );
});
