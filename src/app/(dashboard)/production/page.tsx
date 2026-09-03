import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { PlatformBadge } from "@/components/platform-badge";
import { Clapperboard, FileText } from "lucide-react";
import { prisma } from "@/lib/db";

const COLUMNS: { status: string; label: string }[] = [
  { status: "selected", label: "Selected" },
  { status: "scripted", label: "Scripted" },
  { status: "production", label: "Production" },
  { status: "editing", label: "Editing" },
  { status: "ready", label: "Ready" },
];

export default async function ProductionPage() {
  const workspace = await prisma.workspace.findFirstOrThrow();

  const ideas = await prisma.contentIdea.findMany({
    where: {
      workspaceId: workspace.id,
      status: { in: COLUMNS.map((c) => c.status) },
    },
    include: {
      scripts: { orderBy: { version: "desc" }, take: 1, select: { version: true } },
      campaign: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="py-6">
      <PageHeader
        title="Production"
        description="Ideas moving through the pipeline — script, produce, edit, ship."
      />

      {ideas.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          title="Nothing in production"
          description="Select an idea and generate a script to move it into the pipeline."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {COLUMNS.map((col) => {
            const items = ideas.filter((i) => i.status === col.status);
            return (
              <div key={col.status}>
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 className="text-sm font-medium text-foreground">{col.label}</h2>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((idea) => (
                    <Link
                      key={idea.id}
                      href={`/ideas/${idea.id}`}
                      className="block rounded-md border border-border/60 bg-card p-3 transition-colors hover:border-foreground/20"
                    >
                      <p className="text-sm font-medium leading-snug text-foreground line-clamp-2">
                        {idea.title}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                        {idea.platform ? <PlatformBadge platform={idea.platform} /> : null}
                        <Badge
                          variant="secondary"
                          className={idea.scripts.length > 0 ? "" : "opacity-50"}
                        >
                          <FileText className="mr-1 size-3" aria-hidden />
                          {idea.scripts.length > 0 ? `v${idea.scripts[0].version}` : "no script"}
                        </Badge>
                      </div>
                      {idea.campaign ? (
                        <p className="mt-1.5 truncate text-xs text-muted-foreground">
                          {idea.campaign.name}
                        </p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
