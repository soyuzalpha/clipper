"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { parseJsonArray } from "@/lib/parse";
import { analyzeCampaign } from "@/lib/ai/services/campaign-analyzer";
import { getAIProvider } from "@/lib/ai/provider";
import { AIError } from "@/lib/ai/errors";

export type CampaignActionResult =
  | { ok: true; provider: string }
  | { ok: false; error: string };

/**
 * Run the AI campaign analysis (mock by default) and persist the result as an
 * AIAnalysis row. Also fold the opportunity score back onto the campaign so
 * list/overview ranking reflects the analysis.
 */
export async function analyzeCampaignAction(campaignId: string): Promise<CampaignActionResult> {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { requirements: { select: { kind: true, text: true } } },
  });
  if (!campaign) {
    return { ok: false, error: "Campaign not found." };
  }

  let analysis: Awaited<ReturnType<typeof analyzeCampaign>>;
  try {
    analysis = await analyzeCampaign({
      name: campaign.name,
      brand: campaign.brand,
      creator: campaign.creator,
      description: campaign.description,
      objective: campaign.objective,
      reward: campaign.reward,
      deadline: campaign.deadline,
      format: campaign.format,
      audience: campaign.audience,
      minDurationSec: campaign.minDurationSec,
      maxDurationSec: campaign.maxDurationSec,
      requiredCta: campaign.requiredCta,
      guidelines: campaign.guidelines,
      prohibitedTopics: campaign.prohibitedTopics,
      submissionProcedure: campaign.submissionProcedure,
      rewardConditions: campaign.rewardConditions,
      sourceMaterial: campaign.sourceMaterial,
      platforms: parseJsonArray(campaign.platforms),
      hashtags: parseJsonArray(campaign.hashtags),
      mentions: parseJsonArray(campaign.mentions),
      requirements: campaign.requirements.map((r) => ({ kind: r.kind, text: r.text })),
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof AIError ? error.safeMessage : "Analysis failed unexpectedly.",
    };
  }

  const provider = getAIProvider().name;

  await prisma.$transaction([
    prisma.aIAnalysis.create({
      data: {
        campaignId: campaign.id,
        subjectType: "campaign",
        subjectId: campaign.id,
        kind: "campaign_analysis",
        input: JSON.stringify({ scope: "full_campaign" }),
        output: JSON.stringify(analysis),
        provider,
      },
    }),
    prisma.campaign.update({
      where: { id: campaign.id },
      data: { opportunityScore: analysis.opportunityScore },
    }),
  ]);

  revalidatePath(`/campaigns/${campaign.id}`);
  revalidatePath("/campaigns");
  revalidatePath("/");
  return { ok: true, provider };
}
