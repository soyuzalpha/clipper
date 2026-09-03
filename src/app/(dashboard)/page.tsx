import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/metric-card";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { Target, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getOverviewData, getWorkspace } from "@/lib/queries/overview";

function formatCompact(n: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export default async function OverviewPage() {
  const workspace = await getWorkspace();
  const data = await getOverviewData(workspace.id);

  return (
    <div className="py-6">
      <PageHeader title="Overview" description="What should I do next?" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Active campaigns" value={String(data.activeCampaigns.length + data.closingCampaigns.length)} />
        <MetricCard label="Ideas in pipeline" value={String(data.pipelineIdeas)} />
        <MetricCard label="Planned this week" value={String(data.plansThisWeek)} />
        <MetricCard
          label="Total views"
          value={formatCompact(data.totalViews)}
          delta="+34% this week"
          deltaTone="positive"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Today's priorities */}
        <section aria-labelledby="priorities-heading">
          <h2 id="priorities-heading" className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
            <Target className="size-4" aria-hidden /> Today&apos;s priorities
          </h2>
          <Card>
            <CardContent className="divide-y divide-border/60 p-0">
              {data.closingCampaigns.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Nothing urgent right now.</p>
              ) : (
                data.closingCampaigns.map((c) => (
                  <Link
                    key={c.id}
                    href={`/campaigns/${c.id}`}
                    className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.brand}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline">closing soon</Badge>
                      <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        {/* AI recommendations */}
        <section aria-labelledby="recs-heading">
          <h2 id="recs-heading" className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
            <Sparkles className="size-4" aria-hidden /> AI recommendations
          </h2>
          <Card>
            <CardContent className="divide-y divide-border/60 p-0">
              {data.recommendations.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No recommendations yet.</p>
              ) : (
                data.recommendations.map((r) => (
                  <div key={r.id} className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{r.title}</p>
                      <Badge variant="secondary" className="capitalize">{r.kind}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{r.body}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Campaign opportunities */}
      <section aria-labelledby="opportunities-heading" className="mt-8">
        <h2 id="opportunities-heading" className="mb-3 text-base font-semibold text-foreground">
          Campaign opportunities
        </h2>
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.activeCampaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}