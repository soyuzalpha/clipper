import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/metric-card";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformBadge } from "@/components/platform-badge";
import { EmptyState } from "@/components/empty-state";
import { Target, ArrowRight, BarChart3, ExternalLink, CalendarClock, AlertTriangle, Clapperboard } from "lucide-react";
import Link from "next/link";
import { getOverviewData, getWorkspace } from "@/lib/queries/overview";
import { getAnalyticsData } from "@/lib/queries/analytics";

function daysLeft(deadline: Date): number {
  return Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

function daysLeftLabel(deadline: Date): string {
  const d = daysLeft(deadline);
  if (d === 0) return "due today";
  if (d === 1) return "1 day left";
  return `${d} days left`;
}

/** Describe pipeline focus for the KPI sub-line, e.g. "busiest: scripted (2)". */
function activeStageLabel(
  stageCounts: { stage: string; count: number }[]
): string {
  const active = stageCounts.filter((s) => s.count > 0);
  if (active.length === 0) return "Pipeline is clear";
  const busiest = active.reduce((a, b) => (b.count > a.count ? b : a));
  return active.length === 1
    ? `all ${busiest.count} in ${busiest.stage}`
    : `busiest: ${busiest.stage} (${busiest.count})`;
}

function formatCompact(n: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function pct(a: number, b: number): string {
  if (b === 0) return "—";
  const d = ((a - b) / b) * 100;
  return `${d >= 0 ? "+" : ""}${d.toFixed(0)}%`;
}

function fmtDelta(current: number, delta: number): { text: string; tone: "positive" | "negative" | "neutral" } {
  if (delta === 0) return { text: "no change since last check", tone: "neutral" };
  const sign = delta > 0 ? "+" : "−";
  return { text: `${sign}${formatCompact(Math.abs(delta))} since last check`, tone: delta > 0 ? "positive" : "negative" };
}

function SectionHeading({
  id,
  icon,
  children,
  href,
  linkLabel,
}: {
  id: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2
        id={id}
        className="flex items-center gap-2 text-base font-semibold text-foreground"
      >
        {icon}
        {children}
      </h2>
      {href ? (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {linkLabel ?? "View all"}
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

export default async function OverviewPage() {
  const workspace = await getWorkspace();
  const [data, analytics] = await Promise.all([getOverviewData(workspace.id), getAnalyticsData(workspace.id)]);
  const { rows, byPlatform, avgRetention, avgCompletion, totalsDelta } = analytics;
  const { views: totalViews, engagements, likes, comments, shares, saves } = analytics.totals;
  const viewsDelta = fmtDelta(totalViews, totalsDelta.views);
  const engDelta = fmtDelta(engagements, totalsDelta.engagements);

  const inFlightLatest = data.inProduction.slice(0, 3);

  const hasNeeds = data.closingCampaigns.length > 0 || data.recommendations.length > 0;

  return (
    <div className="py-6">
      <PageHeader title="Overview" description="What should I do next?" />

      {/* KPI strip — operational funnel only; analytics live in Performance below */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href="/campaigns" className="group block">
          <MetricCard
            label="Active campaigns"
            value={String(data.activeCampaignCount)}
            delta={
              data.closingCampaigns.length > 0
                ? `${data.closingCampaigns.length} closing soon`
                : "No deadlines soon"
            }
            deltaTone={data.closingCampaigns.length > 0 ? "negative" : "neutral"}
            className="group-hover:border-foreground/20"
          />
        </Link>
        <Link href="/production" className="group block">
          <MetricCard
            label="Content in progress"
            value={String(data.totalInProduction)}
            delta={activeStageLabel(data.stageCounts)}
            className="group-hover:border-foreground/20"
          />
        </Link>
        <Link href="/planner" className="group block">
          <MetricCard
            label="Publishing this week"
            value={String(data.plansThisWeek)}
            delta={data.upcomingPlans[0] ? `next: ${data.upcomingPlans[0].idea.title}` : "Nothing scheduled"}
            className="group-hover:border-foreground/20"
          />
        </Link>
        <Link href="/library" className="group block">
          <MetricCard
            label="Published this week"
            value={String(data.publishedThisWeek)}
            delta={
              data.publishedThisWeek === 0
                ? "no posts yet"
                : data.publishedThisWeek === 1
                  ? "post went live"
                  : "posts went live"
            }
            className="group-hover:border-foreground/20"
          />
        </Link>
      </div>

      {/* On deck + Needs attention */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Publishing next */}
          <section aria-labelledby="publishing-heading">
            <SectionHeading id="publishing-heading" icon={<CalendarClock className="size-4" aria-hidden />} href="/planner">
              Publishing next
            </SectionHeading>
            {data.upcomingPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing scheduled in the next 7 days.{" "}
                <Link href="/planner" className="text-primary hover:underline">
                  Open the planner
                </Link>{" "}
                to queue content.
              </p>
            ) : (
              <Card>
                <CardContent className="divide-y divide-border/60 p-0">
                  {data.upcomingPlans.map((p) => (
                    <Link
                      key={p.id}
                      href={`/ideas/${p.idea.id}`}
                      className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <PlatformBadge platform={p.platform} />
                        <p className="truncate text-sm font-medium text-foreground">{p.idea.title}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {p.publishAt?.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </section>

          {/* In production */}
          <section aria-labelledby="production-heading">
            <SectionHeading id="production-heading" icon={<Clapperboard className="size-4" aria-hidden />} href="/production">
              In production
            </SectionHeading>
            {data.totalInProduction === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing in the pipeline yet.{" "}
                <Link href="/production" className="text-primary hover:underline">
                  Start producing content
                </Link>
                .
              </p>
            ) : (
              <Card>
                <CardContent className="space-y-4 p-4">
                  {/* Stage labels + counts */}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {data.stageCounts.map(({ stage, count }) => (
                      <span key={stage} className="capitalize">
                        {stage} <span className="font-semibold text-foreground">{count}</span>
                      </span>
                    ))}
                  </div>
                  {/* Proportional stage bar */}
                  <div
                    className="flex h-2 overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={`${data.totalInProduction} ${data.totalInProduction === 1 ? "item" : "items"} across ${data.stageCounts.length} stages`}
                  >
                    {data.stageCounts.map(({ stage, count }) =>
                      count > 0 ? (
                        <div
                          key={stage}
                          className="bg-foreground/70"
                          style={{ width: `${(count / data.totalInProduction) * 100}%` }}
                        />
                      ) : null
                    )}
                  </div>
                  {/* Recently updated ideas */}
                  <div className="divide-y divide-border/60">
                    {inFlightLatest.map((idea) => (
                      <Link
                        key={idea.id}
                        href={`/ideas/${idea.id}`}
                        className="flex items-center justify-between gap-3 py-2 transition-colors hover:text-foreground"
                      >
                        <p className="truncate text-sm font-medium text-foreground">{idea.title}</p>
                        <Badge variant="secondary" className="shrink-0 capitalize">
                          {idea.status}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </section>
        </div>

        {/* Needs attention rail */}
        <aside className="space-y-6">
          <section aria-labelledby="attention-heading">
            <SectionHeading id="attention-heading" icon={<AlertTriangle className="size-4" aria-hidden />}>
              Needs attention
            </SectionHeading>
            {!hasNeeds ? (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Nothing needs you right now.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="divide-y divide-border/60 p-0">
                  {data.closingCampaigns.map((c) => (
                    <Link
                      key={c.id}
                      href={`/campaigns/${c.id}`}
                      className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.deadline
                            ? `closes ${c.deadline.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                            : c.brand}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {c.deadline ? daysLeftLabel(c.deadline) : "closing soon"}
                      </Badge>
                    </Link>
                  ))}
                  {data.recommendations.map((r) => (
                    <div key={r.id} className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{r.title}</p>
                        <Badge variant="secondary" className="capitalize">
                          {r.kind}
                        </Badge>
                      </div>
                      {r.body ? <p className="mt-1 text-xs text-muted-foreground">{r.body}</p> : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </section>
        </aside>
      </div>

      {/* Campaign opportunities */}
      <section aria-labelledby="opportunities-heading" className="mt-8">
        <SectionHeading id="opportunities-heading" icon={<Target className="size-4" aria-hidden />} href="/campaigns">
          Campaign opportunities
        </SectionHeading>
        {data.activeCampaigns.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No active campaigns"
            description="Join a campaign to see opportunities here."
            action={
              <Link
                href="/campaigns"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Browse campaigns <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.activeCampaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </section>

      {/* Performance (moved from Analytics) */}
      <section aria-labelledby="performance-heading" className="mt-8">
        <SectionHeading id="performance-heading" icon={<BarChart3 className="size-4" aria-hidden />}>
          Performance
        </SectionHeading>

        {rows.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No published content yet"
            description="Analytics appear once you publish content."
          />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard label="Total views" value={formatCompact(totalViews)} delta={viewsDelta.text} deltaTone={viewsDelta.tone} />
              <MetricCard label="Engagements" value={formatCompact(engagements)} delta={engDelta.text} deltaTone={engDelta.tone} />
              <MetricCard label="Avg retention" value={`${Math.round(avgRetention * 100)}%`} />
              <MetricCard label="Avg completion" value={`${Math.round(avgCompletion * 100)}%`} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* By platform */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">By platform</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {byPlatform.size === 0 ? (
                    <p className="text-sm text-muted-foreground">No data yet.</p>
                  ) : (
                    [...byPlatform.entries()].map(([platform, d]) => {
                      const share = totalViews ? (d.views / totalViews) * 100 : 0;
                      return (
                        <div key={platform}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <PlatformBadge platform={platform} />
                            <span className="text-xs text-muted-foreground">
                              {formatCompact(d.views)} views · {share.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-foreground/70" style={{ width: `${share}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Engagement mix */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Engagement mix</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    {[
                      { label: "Likes", value: likes },
                      { label: "Comments", value: comments },
                      { label: "Shares", value: shares },
                      { label: "Saves", value: saves },
                    ].map((m) => (
                      <div key={m.label}>
                        <div className="text-lg font-semibold text-foreground">{formatCompact(m.value)}</div>
                        <div className="text-xs text-muted-foreground">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Per-publication */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Posts</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border/60 p-0">
                {rows.map(({ pub, latest, prev }) => (
                  <div key={pub.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {pub.content?.title ?? pub.url ?? "Untitled"}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <PlatformBadge platform={pub.platform} />
                        {latest ? (
                          <span className="text-xs text-muted-foreground">
                            {formatCompact(latest.views)} views
                            {prev ? (
                              <span className={prev.views <= latest.views ? "text-emerald-500" : "text-destructive"}>
                                {" · "}
                                {pct(latest.views, prev.views)}
                              </span>
                            ) : null}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {pub.url ? (
                      <a
                        href={pub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        aria-label="Open post"
                      >
                        <ExternalLink className="size-4" aria-hidden />
                      </a>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
