"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";

export type ClipsActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const createVideoSchema = z.object({
  sourceUrl: z.string().url("Enter a valid video URL"),
  title: z.string().trim().max(200).optional(),
});

/** Paste a source URL → Video row (status "imported"). */
export async function createVideo(raw: unknown): Promise<ClipsActionResult> {
  const parsed = createVideoSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { sourceUrl, title } = parsed.data;

  const workspace = await prisma.workspace.findFirstOrThrow();
  const video = await prisma.video.create({
    data: {
      workspaceId: workspace.id,
      title: title || sourceUrl.replace(/^https?:\/\/(www\.)?/, "").split(/[/?#]/)[0] || "Untitled video",
      sourceUrl,
      status: "imported",
    },
  });

  revalidatePath("/clips");
  return { ok: true, id: video.id };
}

/**
 * Mock clip detection: deterministic, derived from the video's own title/URL,
 * so it needs no provider and repeats identically on re-detect. Replaces any
 * prior clips (idempotent re-run) and flips the video to "ready".
 */
export async function detectClips(videoId: string): Promise<ClipsActionResult> {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    return { ok: false, error: "Video not found." };
  }

  const clips = mockClipsFor(video.title, video.sourceUrl, video.durationSec ?? 1800);

  await prisma.$transaction([
    prisma.video.update({ where: { id: videoId }, data: { status: "ready" } }),
    prisma.clip.deleteMany({ where: { videoId } }),
    prisma.clip.createMany({ data: clips.map((c) => ({ videoId, ...c })) }),
  ]);

  revalidatePath("/clips");
  return { ok: true };
}

const CLIP_TEMPLATES = [
  { title: "The moment it gets real", hook: "Wait — did they just say that?", reason: "reaction-worthy payoff" },
  { title: "Hot take worth arguing about", hook: "This take is going to split the comments", reason: "strong opinion, sparks debate" },
  { title: "Quick win tip", hook: "Write this down — it actually works", reason: "actionable, high save rate" },
  { title: "Behind-the-scenes gem", hook: "You never see this part on the main channel", reason: "exclusive insight" },
  { title: "The summary line", hook: "Everything above, in one sentence", reason: "tight recap, easy to clip" },
];

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function mockClipsFor(
  title: string,
  sourceUrl: string | null,
  durationSec: number
): { title: string; startSec: number; endSec: number; hook: string; reason: string; viralScore: number; status: string }[] {
  const seed = hashCode(`${title}::${sourceUrl ?? ""}`);
  const count = 3 + (seed % 2); // 3-4 clips
  const usable = Math.max(durationSec - 30, 60);
  const clips = [];

  for (let i = 0; i < count; i++) {
    const t = CLIP_TEMPLATES[(seed + i * 7) % CLIP_TEMPLATES.length];
    const window = 45 + ((seed >> (i * 3)) % 90); // 45-135s per clip
    const start = ((seed >> i) * 137) % usable;
    clips.push({
      title: `${title ? title.split(" ").slice(0, 4).join(" ") : "Video"} — ${t.title}`.slice(0, 200),
      startSec: start,
      endSec: Math.min(start + window, usable),
      hook: t.hook,
      reason: t.reason,
      viralScore: 55 + ((seed >> (i + 1)) % 40), // 55-94
      status: "detected",
    });
  }

  return clips.sort((a, b) => a.startSec - b.startSec);
}

const CLIP_STATUS = ["detected", "exported", "published"] as const;

export async function setClipStatus(
  clipId: string,
  rawStatus: string
): Promise<ClipsActionResult> {
  if (!(CLIP_STATUS as readonly string[]).includes(rawStatus)) {
    return { ok: false, error: "Invalid clip status." };
  }
  const clip = await prisma.clip.findUnique({ where: { id: clipId } });
  if (!clip) {
    return { ok: false, error: "Clip not found." };
  }
  await prisma.clip.update({
    where: { id: clipId },
    data: { status: rawStatus },
  });
  revalidatePath("/clips");
  return { ok: true };
}
