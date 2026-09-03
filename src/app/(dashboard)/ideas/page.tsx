import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { IdeaCard } from "@/components/ideas/idea-card";
import { GenerateIdeasDialog } from "@/components/ideas/generate-ideas-dialog";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";
import { prisma } from "@/lib/db";

export default async function IdeasPage() {
  const workspace = await prisma.workspace.findFirstOrThrow();

  const [ideas, campaigns] = await Promise.all([
    prisma.contentIdea.findMany({
      where: { workspaceId: workspace.id },
      include: { campaign: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.campaign.findMany({
      where: { workspaceId: workspace.id, status: { in: ["open", "in_progress"] } },
      select: { id: true, name: true, brand: true },
      orderBy: { opportunityScore: "desc" },
    }),
  ]);

  return (
    <div className="py-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Content Ideas"
          description="Ideas generated from campaign requirements and your performance history."
        />
        <GenerateIdeasDialog campaigns={campaigns} />
      </div>

      {ideas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No ideas yet"
          description="Generate ideas from a campaign to fill your pipeline."
        />
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">{ideas.length} idea{ideas.length === 1 ? "" : "s"}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea) => (
              <div key={idea.id} className="flex flex-col">
                {idea.campaign ? (
                  <Link href={`/campaigns/${idea.campaignId}`} className="mb-1.5 ml-1 w-fit">
                    <Badge variant="secondary" className="text-xs">{idea.campaign.name}</Badge>
                  </Link>
                ) : null}
                <IdeaCard idea={idea} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
