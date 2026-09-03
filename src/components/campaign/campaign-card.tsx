import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignStatusBadge } from "./campaign-status-badge";
import { PlatformBadge } from "@/components/platform-badge";
import { Gift, Clock } from "lucide-react";
import type { Campaign } from "@/generated/prisma/client";

function daysLeft(deadline: Date): number {
  return Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const platforms: string[] = campaign.platforms ? JSON.parse(campaign.platforms) : [];

  return (
    <Link href={`/campaigns/${campaign.id}`} className="group block">
      <Card className="h-full transition-colors group-hover:border-foreground/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{campaign.name}</CardTitle>
            <CampaignStatusBadge status={campaign.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {campaign.brand}
            {campaign.creator ? ` · ${campaign.creator}` : ""}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((p) => (
              <PlatformBadge key={p} platform={p} />
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {campaign.reward ? (
              <span className="inline-flex items-center gap-1.5">
                <Gift className="size-3.5" aria-hidden />
                {campaign.reward}
              </span>
            ) : null}
            {campaign.deadline ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden />
                {daysLeft(campaign.deadline)}d left
              </span>
            ) : null}
          </div>
        </CardContent>
        {campaign.opportunityScore != null ? (
          <CardFooter className="justify-between border-t border-border/60 pt-3! text-xs text-muted-foreground">
            <span>Opportunity score</span>
            <span className="font-semibold text-foreground">
              {Math.round(campaign.opportunityScore)}/100
            </span>
          </CardFooter>
        ) : null}
      </Card>
    </Link>
  );
}
