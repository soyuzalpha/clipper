import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformBadge } from "@/components/platform-badge";
import { EmptyState } from "@/components/empty-state";
import { BarChart3, ExternalLink } from "lucide-react";
import { getAnalyticsData } from "@/lib/queries/analytics";
import { prisma } from "@/lib/db";

function formatCompact(n: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function pct(a: number, b: number): string {
  if (b === 0) return "—";
  const d = ((a - b) / b) * 100;
  return `${d >= 0 ? "+" : ""}${d.toFixed(0)}%`;
}

export async function getWorkspaceForPage() {
  return prisma.workspace.findFirstOrThrow();
}

export default async function AnalyticsPage() {
  const workspace = await getWorkspaceForPage();
  const data = await getAnalyticsData(workspace.id);
  const { rows, byPlatform, avgRetention, avgCompletion } = data;
  const { views: totalViews, engagements: totalEngagements, likes, comments, shares, saves } = data.totals;

  return (
    <div className="py-6">
      <PageHeader
        title="Analytics"
        description="How published content is performing across platforms."
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No published content yet"
          description="Analytics appear once you publish content."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Total views" value={formatCompact(totalViews)} />
            <MetricCard label="Engagements" value={formatCompact(totalEngagements)} />
            <MetricCard
              label="Avg retention"
              value={`${Math.round(avgRetention * 100)}%`}
            />
            <MetricCard
              label="Avg completion"
              value={`${Math.round(avgCompletion * 100)}%`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* By platform */}
            <Card>
              <CardHeader><CardTitle className="text-base">By platform</CardTitle></CardHeader>
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
                          <div
                            className="h-full rounded-full bg-foreground/70"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Engagement mix */}
            <Card>
              <CardHeader><CardTitle className="text-base">Engagement mix</CardTitle></CardHeader>
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
            <CardHeader><CardTitle className="text-base">Posts</CardTitle></CardHeader>
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
                              {" "}· {pct(latest.views, prev.views)}
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
    </div>
  );
}
