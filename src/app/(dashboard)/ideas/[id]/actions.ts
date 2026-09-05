"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { IdeaStatus } from "@/lib/constants";
import { generateScript } from "@/lib/ai/services/script-generator";
import { AIError } from "@/lib/ai/errors";
import { requireAuth } from "@/lib/auth";

export type IdeaActionResult =
  | { ok: true; version?: number }
  | { ok: false; error: string };

export async function generateScriptForIdea(ideaId: string): Promise<IdeaActionResult> {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const idea = await prisma.contentIdea.findUnique({
    where: { id: ideaId },
    include: { campaign: true },
  });
  if (!idea) {
    return { ok: false, error: "Idea not found." };
  }

  let script: Awaited<ReturnType<typeof generateScript>>;
  try {
    script = await generateScript({
      ideaTitle: idea.title,
      hook: idea.hook,
      angle: idea.angle,
      audience: idea.audience,
      format: idea.format,
      durationSec: idea.durationSec,
      outline: idea.outline,
      cta: idea.cta,
      platform: idea.platform,
      campaignName: idea.campaign?.name,
      campaignGuidelines: idea.campaign?.guidelines,
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof AIError ? error.safeMessage : "Script generation failed unexpectedly.",
    };
  }

  const latest = await prisma.script.findFirst({
    where: { ideaId: idea.id },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const version = (latest?.version ?? 0) + 1;
  await prisma.script.create({
    data: {
      ideaId: idea.id,
      hook: script.hook,
      intro: script.intro,
      body: script.body,
      payoff: script.payoff,
      cta: script.cta,
      version,
    },
  });

  // A script implies the idea is at least scripted.
  if (idea.status === "idea" || idea.status === "selected") {
    await prisma.contentIdea.update({
      where: { id: idea.id },
      data: { status: "scripted" },
    });
  }

  revalidatePath(`/ideas/${idea.id}`);
  revalidatePath("/ideas");
  revalidatePath("/production");
  return { ok: true, version };
}

export async function updateIdeaStatus(
  ideaId: string,
  rawStatus: string
): Promise<IdeaActionResult> {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const parsed = IdeaStatus.safeParse(rawStatus);
  if (!parsed.success) {
    return { ok: false, error: "Invalid status" };
  }
  const idea = await prisma.contentIdea.findUnique({ where: { id: ideaId } });
  if (!idea) {
    return { ok: false, error: "Idea not found." };
  }
  await prisma.contentIdea.update({
    where: { id: ideaId },
    data: { status: parsed.data },
  });
  revalidatePath(`/ideas/${ideaId}`);
  revalidatePath("/ideas");
  revalidatePath("/");
  return { ok: true };
}
