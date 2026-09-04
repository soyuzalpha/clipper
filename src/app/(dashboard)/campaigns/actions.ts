"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { CampaignStatus, Platform } from "@/lib/constants";
import { requireAuth } from "@/lib/auth";

const createCampaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().optional(),
  creator: z.string().optional(),
  description: z.string().optional(),
  objective: z.string().optional(),
  reward: z.string().optional(),
  deadline: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
  platforms: z.array(Platform).optional(),
  format: z.string().optional(),
  audience: z.string().optional(),
  minDurationSec: z.coerce.number().int().positive().optional(),
  maxDurationSec: z.coerce.number().int().positive().optional(),
  requiredCta: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
  prohibitedTopics: z.string().optional(),
  guidelines: z.string().optional(),
  submissionProcedure: z.string().optional(),
  rewardConditions: z.string().optional(),
  sourceMaterial: z.string().optional(),
  campaignUrl: z.string().url().optional().or(z.literal("")),
});

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export async function createCampaign(raw: unknown): Promise<ActionResult> {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const parsed = createCampaignSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const workspace = await prisma.workspace.findFirstOrThrow();

  const campaign = await prisma.campaign.create({
    data: {
      workspaceId: workspace.id,
      name: data.name,
      brand: data.brand || null,
      creator: data.creator || null,
      description: data.description || null,
      objective: data.objective || null,
      reward: data.reward || null,
      deadline: data.deadline,
      platforms: data.platforms?.length ? JSON.stringify(data.platforms) : null,
      format: data.format || null,
      audience: data.audience || null,
      minDurationSec: data.minDurationSec ?? null,
      maxDurationSec: data.maxDurationSec ?? null,
      requiredCta: data.requiredCta || null,
      hashtags: data.hashtags?.length ? JSON.stringify(data.hashtags) : null,
      mentions: data.mentions?.length ? JSON.stringify(data.mentions) : null,
      prohibitedTopics: data.prohibitedTopics || null,
      guidelines: data.guidelines || null,
      submissionProcedure: data.submissionProcedure || null,
      rewardConditions: data.rewardConditions || null,
      sourceMaterial: data.sourceMaterial || null,
      campaignUrl: data.campaignUrl || null,
    },
  });

  revalidatePath("/campaigns");
  revalidatePath("/");
  return { ok: true, id: campaign.id };
}

export async function updateCampaignStatus(
  campaignId: string,
  rawStatus: string
): Promise<ActionResult> {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const parsed = CampaignStatus.safeParse(rawStatus);
  if (!parsed.success) {
    return { ok: false, error: "Invalid status" };
  }
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: parsed.data },
  });
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
  return { ok: true };
}