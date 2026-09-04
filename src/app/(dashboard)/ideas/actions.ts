"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { generateContentIdeas } from "@/lib/ai/services/content-idea-generator";
import { requireAuth } from "@/lib/auth";

export type IdeasActionResult = { ok: true; created: number } | { ok: false; error: string };

/**
 * Generate content ideas for a campaign via the AI provider (mock by default)
 * and persist them. Workspace resolved from the campaign to stay scoped.
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

  const result = await generateContentIdeas({
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
    requirements: campaign.requirements.map((r) => `${r.kind}: ${r.text}`),
  });

  await prisma.contentIdea.createMany({
    data: result.ideas.map((idea) => ({
      workspaceId: campaign.workspaceId,
      campaignId: campaign.id,
      title: idea.title,
      hook: idea.hook,
      angle: idea.angle,
      audience: idea.audience,
      format: idea.format,
      durationSec: idea.durationSec,
      outline: idea.outline,
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
