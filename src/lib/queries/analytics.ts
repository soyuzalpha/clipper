import { prisma } from "@/lib/db";

export interface PlatformRollup {
  views: number;
  engagements: number;
}

/**
 * Analytics rollups from publications + their latest snapshots.
 * Current totals (latest snapshot per publication), per-platform buckets,
 * and per-publication rows with previous snapshot for delta.
 */
export async function getAnalyticsData(workspaceId: string) {
  const publications = await prisma.publication.findMany({
    where: { content: { workspaceId } },
    include: {
      content: { select: { title: true } },
      snapshots: { orderBy: { capturedAt: "desc" } },
    },
  });

  const totals = { views: 0, engagements: 0, likes: 0, comments: 0, shares: 0, saves: 0 };
  const byPlatform = new Map<string, PlatformRollup>();
  const rows: { pub: (typeof publications)[number]; latest: (typeof publications)[number]["snapshots"][number] | undefined; prev: (typeof publications)[number]["snapshots"][number] | undefined }[] = [];
  let rateable = 0;
  let retentionSum = 0;
  let completionSum = 0;

  for (const pub of publications) {
    const [latest, prev] = pub.snapshots;
    rows.push({ pub, latest, prev });
    if (!latest) continue;

    const engagements = latest.likes + latest.comments + latest.shares + latest.saves;
    totals.views += latest.views;
    totals.engagements += engagements;
    totals.likes += latest.likes;
    totals.comments += latest.comments;
    totals.shares += latest.shares;
    totals.saves += latest.saves;
    rateable += 1;
    retentionSum += latest.retention ?? 0;
    completionSum += latest.completionRate ?? 0;

    const bucket = byPlatform.get(pub.platform) ?? { views: 0, engagements: 0 };
    byPlatform.set(pub.platform, {
      views: bucket.views + latest.views,
      engagements: bucket.engagements + engagements,
    });
  }

  return {
    rows,
    totals,
    byPlatform,
    avgRetention: rateable ? retentionSum / rateable : 0,
    avgCompletion: rateable ? completionSum / rateable : 0,
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsData>>;
