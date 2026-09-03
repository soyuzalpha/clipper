import { PageHeader } from "@/components/layout/page-header";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { CreateCampaignDialog } from "@/components/campaign/create-campaign-dialog";
import { EmptyState } from "@/components/empty-state";
import { Target } from "lucide-react";
import { prisma } from "@/lib/db";

export default async function CampaignsPage() {
  const workspace = await prisma.workspace.findFirstOrThrow();
  const campaigns = await prisma.campaign.findMany({
    where: { workspaceId: workspace.id },
    orderBy: [{ opportunityScore: "desc" }, { deadline: "asc" }],
  });

  return (
    <div className="py-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Campaigns"
          description="Brand campaigns worth joining — requirements, rewards, and deadlines."
        />
        <CreateCampaignDialog />
      </div>
      {campaigns.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No campaigns yet"
          description="Add your first campaign to start analyzing opportunities."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </div>
  );
}
