import { prisma } from "@/lib/db";

/**
 * Overview dashboard data. All queries workspace-scoped.
 * Single-workspace MVP: resolve the workspace once.
 */
export async function getWorkspace() {
  return prisma.workspace.findFirstOrThrow();
}

export async function getOverviewData(workspaceId: string) {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const weekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    activeCampaigns,
    closingCampaigns,
    pipelineIdeas,
    plansThisWeek,
    publications,
    recommendations,
  ] = await Promise.all([
    // Campaign opportunities: open campaigns worth joining, best first.
    prisma.campaign.findMany({
      where: { workspaceId, status: { in: ["open", "in_progress"] } },
      orderBy: { opportunityScore: "desc" },
      take: 3,
    }),
    // Priorities: campaigns closing within 7 days.
    prisma.campaign.findMany({
      where: {
        workspaceId,
        status: { in: ["open", "in_progress"] },
        deadline: { lte: in7Days },
      },
      orderBy: { deadline: "asc" },
    }),
    prisma.contentIdea.count({
      where: { workspaceId, status: { in: ["idea", "selected", "scripted", "production", "editing", "ready"] } },
    }),
    prisma.contentPlan.count({
      where: { workspaceId, publishAt: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.publication.findMany({
      where: { content: { workspaceId } },
      include: { snapshots: { orderBy: { capturedAt: "desc" }, take: 2 } },
    }),
    prisma.aIRecommendation.findMany({
      where: { workspaceId, status: "new" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  // Latest snapshot per publication = current totals; previous = delta.
  let totalViews = 0;
  let totalEngagements = 0;
  for (const pub of publications) {
    const [latest, prev] = pub.snapshots;
    if (latest) {
      totalViews += latest.views;
      totalEngagements += latest.likes + latest.comments + latest.shares + latest.saves;
    }
    void prev;
  }

  return {
    activeCampaigns,
    closingCampaigns,
    pipelineIdeas,
    plansThisWeek,
    totalViews,
    totalEngagements,
    recommendations,
  };
}

export type OverviewData = Awaited<ReturnType<typeof getOverviewData>>;
