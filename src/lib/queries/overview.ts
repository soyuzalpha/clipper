import { prisma } from "@/lib/db";

/**
 * Overview dashboard data. All queries workspace-scoped.
 * Single-workspace MVP: resolve the workspace once.
 *
 * Production pipeline stage order — mirrors the COLUMNS set in
 * `src/app/(dashboard)/production/page.tsx`. Keep the two in sync.
 */
export const PRODUCTION_STAGES = ["selected", "scripted", "production", "editing", "ready"] as const;

/** Week window helpers. Sunday-start (JS getDay), preserving the original Overview semantics. */
export function weekWindow(now = new Date()) {
  const weekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { weekStart, weekEnd };
}

export async function getWorkspace() {
  return prisma.workspace.findFirstOrThrow();
}

export async function getOverviewData(workspaceId: string) {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { weekStart, weekEnd } = weekWindow(now);

  const [
    activeCampaignCount,
    activeCampaigns,
    closingCampaigns,
    pipelineIdeas,
    plansThisWeek,
    publishedThisWeek,
    upcomingPlans,
    inProduction,
    recommendations,
  ] = await Promise.all([
    // KPI: total open/in_progress campaigns (activeCampaigns below is capped at 3).
    prisma.campaign.count({
      where: { workspaceId, status: { in: ["open", "in_progress"] } },
    }),
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
    prisma.publication.count({
      where: { content: { workspaceId }, publishedAt: { gte: weekStart, lte: now } },
    }),
    prisma.contentPlan.findMany({
      where: { workspaceId, publishAt: { gte: now, lte: in7Days }, status: { not: "published" } },
      include: { idea: { select: { id: true, title: true } } },
      orderBy: { publishAt: "asc" },
      take: 4,
    }),
    // In-flight content for the mini pipeline.
    prisma.contentIdea.findMany({
      where: { workspaceId, status: { in: [...PRODUCTION_STAGES] } },
      select: { id: true, title: true, platform: true, status: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.aIRecommendation.findMany({
      where: { workspaceId, status: "new" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const stageCounts = PRODUCTION_STAGES.map((stage) => ({
    stage,
    count: inProduction.filter((i) => i.status === stage).length,
  }));
  const totalInProduction = stageCounts.reduce((sum, s) => sum + s.count, 0);

  return {
    activeCampaignCount,
    activeCampaigns,
    closingCampaigns,
    pipelineIdeas,
    plansThisWeek,
    publishedThisWeek,
    upcomingPlans,
    inProduction,
    totalInProduction,
    stageCounts,
    recommendations,
  };
}

export type OverviewData = Awaited<ReturnType<typeof getOverviewData>>;
