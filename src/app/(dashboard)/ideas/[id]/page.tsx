import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformBadge } from "@/components/platform-badge";
import { IdeaStatusSelect } from "@/components/ideas/idea-status-select";
import { CalendarDays, Target, ArrowLeft } from "lucide-react";

type Props = { params: Promise<{ id: string }> };

export default async function IdeaPage({ params }: Props) {
  const { id } = await params;

  const idea = await prisma.contentIdea.findUnique({
    where: { id },
    include: {
      campaign: true,
      scripts: { orderBy: { version: "desc" }, take: 1 },
      plans: true,
    },
  });
  if (!idea) notFound();

  return (
    <div className="py-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/ideas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" aria-hidden />
          Ideas
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{idea.title}</h1>
          <IdeaStatusSelect ideaId={idea.id} currentStatus={idea.status} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {idea.platform ? <PlatformBadge platform={idea.platform} /> : null}
          {idea.difficulty ? (
            <Badge variant="outline" className="text-xs capitalize">{idea.difficulty}</Badge>
          ) : null}
          {idea.viralScore != null ? (
            <Badge variant="secondary" className="text-xs">
              {Math.round(idea.viralScore)} viral score
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main: idea content */}
        <div className="space-y-6 lg:col-span-2">
          {idea.hook ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Hook</CardTitle></CardHeader>
              <CardContent>
                <p className="text-lg font-medium leading-snug text-foreground">{idea.hook}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader><CardTitle className="text-base">Overview</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-x-4 gap-y-4 text-sm sm:grid-cols-2">
                {[
                  { label: "Angle", value: idea.angle },
                  { label: "Target audience", value: idea.audience },
                  { label: "Format", value: idea.format },
                  { label: "Platform", value: idea.platform ? idea.platform.replace(/_/g, " ") : null },
                  { label: "Duration", value: idea.durationSec ? `${idea.durationSec}s` : null },
                  { label: "CTA", value: idea.cta },
                ].map((f) => (
                  <div key={f.label}>
                    <dt className="text-xs text-muted-foreground">{f.label}</dt>
                    <dd className="mt-0.5 font-medium text-foreground first-letter:capitalize">
                      {f.value ?? "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {idea.outline ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Outline</CardTitle></CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-foreground">{idea.outline}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          {idea.campaign ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="size-4 text-muted-foreground" aria-hidden />
                  Campaign
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/campaigns/${idea.campaign.id}`} className="text-sm font-medium text-foreground hover:underline">
                  {idea.campaign.name}
                </Link>
                {idea.campaign.brand ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{idea.campaign.brand}</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {idea.plans.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
                  Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {idea.plans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-muted-foreground">{plan.platform}</span>
                    <span className="text-foreground">
                      {plan.publishAt
                        ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(plan.publishAt)
                        : "unscheduled"}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
