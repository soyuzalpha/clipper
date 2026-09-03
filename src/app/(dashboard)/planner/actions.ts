"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Platform } from "@/lib/constants";

const createPlanSchema = z.object({
  ideaId: z.string().min(1, "Idea is required"),
  platform: Platform,
  publishAt: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
});

export type PlanActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createPlan(raw: unknown): Promise<PlanActionResult> {
  const parsed = createPlanSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { ideaId, platform, publishAt } = parsed.data;

  const idea = await prisma.contentIdea.findUnique({ where: { id: ideaId } });
  if (!idea) {
    return { ok: false, error: "Idea not found." };
  }

  const plan = await prisma.contentPlan.create({
    data: {
      workspaceId: idea.workspaceId,
      ideaId,
      platform,
      publishAt,
    },
  });

  revalidatePath("/planner");
  revalidatePath("/");
  return { ok: true, id: plan.id };
}
