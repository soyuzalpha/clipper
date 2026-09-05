"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { generateContentIdeas } from "@/lib/ai/services/content-idea-generator";
import { CampaignAnalysisSchema } from "@/lib/ai/schemas";
import { AIError } from "@/lib/ai/errors";
import { requireAuth } from "@/lib/auth";

export type IdeasActionResult = { ok: true; created: number } | { ok: false; error: string };

/**
 * Generate content ideas for a campaign through the AI Router (mock by
 * default) and persist them. Workspace resolved from the campaign to stay
 * scoped. When a campaign analysis already exists, its summary is fed back in
 * as context so ideas build on the analysis instead of regenerating it.
 */
export async function generateIdeasForCampaign(campaignId: string): Promise<IdeasActionResult> {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { requirements: { select: { kind: true, text: true } } },
  });
  if (!campaign) {
    return { ok: false, error: "Campaign not found." };
  }

  // Reuse a persisted analysis if there is one — never re-analyze here.
  const latestAnalysis = await prisma.aIAnalysis.findFirst({
    where: { campaignId: campaign.id, kind: "campaign_analysis" },
    orderBy: { createdAt: "desc" },
    take: 1,
  });
  let analysis: { summary: string; targetAudience: string[]; contentAngles: string[]; strategy: string[]; opportunityScore: number } | null = null;
  if (latestAnalysis?.output) {
    const parsed = CampaignAnalysisSchema.safeParse(JSON.parse(latestAnalysis.output));
    if (parsed.success) {
      const a = parsed.data;
      analysis = {
        summary: a.summary,
        targetAudience: a.targetAudience,
        contentAngles: a.contentAngles,
        strategy: a.strategy,
        opportunityScore: a.opportunityScore,
      };
    }
  }

  let result: Awaited<ReturnType<typeof generateContentIdeas>>;
  try {
    result = await generateContentIdeas({
      name: campaign.name,
      brand: campaign.brand,
      objective: campaign.objective,
      audience: campaign.audience,
      format: campaign.format,
      minDurationSec: campaign.minDurationSec,
      maxDurationSec: campaign.maxDurationSec,
      requiredCta: campaign.requiredCta,
      guidelines: campaign.guidelines,
      prohibitedTopics: campaign.prohibitedTopics,
      sourceMaterial: campaign.sourceMaterial,
      platforms: campaign.platforms ? JSON.parse(campaign.platforms) : [],
      hashtags: campaign.hashtags ? JSON.parse(campaign.hashtags) : [],
      mentions: campaign.mentions ? JSON.parse(campaign.mentions) : [],
      requirements: campaign.requirements,
      analysis,
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof AIError ? error.safeMessage : "Idea generation failed unexpectedly.",
    };
  }

  await prisma.contentIdea.createMany({
    data: result.ideas.map((idea) => ({
      workspaceId: campaign.workspaceId,
      campaignId: campaign.id,
      title: idea.title,
      hook: idea.hook,
      angle: idea.angle,
      audience: idea.audience,
      format: idea.format,
      durationSec: idea.duration,
      outline: idea.structure.join("\n"),
      cta: idea.cta,
      platform: idea.platform,
      viralScore: idea.viralScore,
      difficulty: idea.difficulty,
    })),
  });

  revalidatePath("/ideas");
  revalidatePath("/campaigns");
  revalidatePath("/");
  return { ok: true, created: result.ideas.length };
}
