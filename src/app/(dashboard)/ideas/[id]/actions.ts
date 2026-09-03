"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { IdeaStatus } from "@/lib/constants";

export type IdeaActionResult = { ok: true } | { ok: false; error: string };

export async function updateIdeaStatus(
  ideaId: string,
  rawStatus: string
): Promise<IdeaActionResult> {
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
