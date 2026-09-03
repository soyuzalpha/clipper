import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { parseJsonArray } from "@/lib/parse";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignStatusBadge } from "@/components/campaign/campaign-status-badge";
import { PlatformBadge } from "@/components/platform-badge";
import { Clock, Gift, ExternalLink } from "lucide-react";
import { CampaignStatusSelect } from "@/components/campaign/campaign-status-select";
import { AnalyzeCampaignButton } from "@/components/campaign/analyze-campaign-button";
import { CampaignAnalysisSchema, type CampaignAnalysis } from "@/lib/ai/schemas";

type Props = { params: Promise<{ id: string }> };

function daysLeft(deadline: Date): number {
  return Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export default async function CampaignPage({ params }: Props) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      requirements: { orderBy: { kind: "asc" } },
      analyses: { where: { kind: "campaign_analysis" }, orderBy: { createdAt: "desc" }, take: 1 },
      ideas: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!campaign) notFound();

  const platforms = parseJsonArray(campaign.platforms);
  const hashtags = parseJsonArray(campaign.hashtags);
  const mentions = parseJsonArray(campaign.mentions);

  // Latest campaign analysis (seeded or produced by the Analyze button).
  let analysis: CampaignAnalysis | null = null;
  let analysisProvider: string | null = null;
  if (campaign.analyses[0]) {
    analysisProvider = campaign.analyses[0].provider;
    const parsed = CampaignAnalysisSchema.safeParse(
      JSON.parse(campaign.analyses[0].output ?? "{}")
    );
    if (parsed.success) analysis = parsed.data;
  }
  const scoreFactors = analysis
    ? Object.entries(analysis.opportunityScore.breakdown)
    : [];

  return (
    <div className="py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/campaigns" className="text-sm text-muted-foreground hover:text-foreground">
              ← Campaigns
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{campaign.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {campaign.brand}
              {campaign.creator ? ` · ${campaign.creator}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <CampaignStatusBadge status={campaign.status} />
            <CampaignStatusSelect campaignId={campaign.id} currentStatus={campaign.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: key facts + requirements */}
        <div className="space-y-6 lg:col-span-2">
          {/* Key facts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key facts</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  { label: "Reward", value: campaign.reward, icon: Gift },
                  { label: "Deadline", value: campaign.deadline ? `${daysLeft(campaign.deadline)}d left` : "—", icon: Clock },
                  { label: "Format", value: campaign.format },
                  { label: "Audience", value: campaign.audience },
                  { label: "Duration", value: campaign.minDurationSec ? `${campaign.minDurationSec}–${campaign.maxDurationSec}s` : "—" },
                  { label: "Objective", value: campaign.objective },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs text-muted-foreground">{item.label}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-foreground">{item.value ?? "—"}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {platforms.map((p) => (
                  <PlatformBadge key={p} platform={p} />
                ))}
                {hashtags.map((h) => (
                  <Badge key={h} variant="outline" className="text-xs">{h}</Badge>
                ))}
                {mentions.map((m) => (
                  <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          {campaign.requirements.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(["must_do", "must_include", "must_mention", "must_avoid", "submission", "reward_condition"] as const).map((kind) => {
                  const reqs = campaign.requirements.filter((r) => r.kind === kind);
                  if (reqs.length === 0) return null;
                  return (
                    <div key={kind}>
                      <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {kind.replace(/_/g, " ")}
                      </h4>
                      <ul className="mt-2 space-y-1">
                        {reqs.map((r) => (
                          <li key={r.id} className="flex items-center gap-2 text-sm text-foreground">
                            <div className="size-1.5 rounded-full bg-muted-foreground" />
                            {r.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : null}

          {/* Guidelines */}
          {campaign.guidelines || campaign.prohibitedTopics ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {campaign.guidelines ? (
                  <div>
                    <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Content guidelines</h4>
                    <p className="text-sm text-foreground">{campaign.guidelines}</p>
                  </div>
                ) : null}
                {campaign.prohibitedTopics ? (
                  <div>
                    <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Prohibited</h4>
                    <p className="text-sm text-foreground">{campaign.prohibitedTopics}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Submission & reward */}
          {campaign.submissionProcedure || campaign.rewardConditions || campaign.campaignUrl ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Submission & reward</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {campaign.submissionProcedure ? (
                  <div>
                    <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Submission</h4>
                    <p className="text-foreground">{campaign.submissionProcedure}</p>
                  </div>
                ) : null}
                {campaign.rewardConditions ? (
                  <div>
                    <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Reward conditions</h4>
                    <p className="text-foreground">{campaign.rewardConditions}</p>
                  </div>
                ) : null}
                {campaign.campaignUrl ? (
                  <a href={campaign.campaignUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    Campaign website <ExternalLink className="size-3" aria-hidden />
                  </a>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Right column: source material, AI analysis, ideas */}
        <div className="space-y-6">
          {/* AI analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                AI analysis
                {analysisProvider ? (
                  <span className="text-xs font-normal text-muted-foreground capitalize">{analysisProvider}</span>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-semibold">{Math.round(analysis.opportunityScore.total)}/100</span>
                    <span className="text-xs text-muted-foreground">opportunity</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                  {scoreFactors.length > 0 ? (
                    <dl className="space-y-1 border-t border-border/60 pt-3">
                      {scoreFactors.map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between gap-3 text-xs">
                          <dt className="text-muted-foreground">{key.replace(/([A-Z])/g, " $1").toLowerCase()}</dt>
                          <dd className="flex w-24 items-center gap-2">
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-foreground/70"
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span className="w-6 text-right tabular-nums text-foreground">{Math.round(value)}</span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Run the analysis to get a strategy read and opportunity score.
                </p>
              )}
              <AnalyzeCampaignButton campaignId={campaign.id} />
            </CardContent>
          </Card>

          {/* Ideas for this campaign */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                Ideas
                <span className="text-xs font-normal text-muted-foreground">{campaign.ideas.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/60 p-0">
              {campaign.ideas.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No ideas yet.</p>
              ) : (
                campaign.ideas.map((idea) => (
                  <Link key={idea.id} href={`/ideas/${idea.id}`} className="block p-4 transition-colors hover:bg-muted/50">
                    <p className="text-sm font-medium text-foreground">{idea.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{idea.hook}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs capitalize">{idea.status}</Badge>
                      {idea.viralScore != null ? (
                        <span className="text-xs text-muted-foreground">{Math.round(idea.viralScore)} score</span>
                      ) : null}
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Source material */}
          {campaign.sourceMaterial ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Source material</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{campaign.sourceMaterial}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}