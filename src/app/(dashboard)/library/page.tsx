import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/library/favorite-button";
import { FolderOpen, File } from "lucide-react";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

const KIND_LABELS: Record<string, string> = {
  video: "Video",
  clip: "Clip",
  thumbnail: "Thumbnail",
  script: "Script",
  caption: "Caption",
  image: "Image",
  audio: "Audio",
  document: "Document",
};

function formatBytes(n: number | null): string {
  if (n == null) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

type Props = { searchParams: Promise<{ kind?: string }> };

export default async function LibraryPage({ searchParams }: Props) {
  const { kind } = await searchParams;
  const workspace = await prisma.workspace.findFirstOrThrow();

  const assets = await prisma.asset.findMany({
    where: { workspaceId: workspace.id, ...(kind ? { kind } : {}) },
    include: { tags: true },
    orderBy: [{ folder: "asc" }, { name: "asc" }],
  });

  const activeKind = kind && kind in KIND_LABELS ? kind : null;

  return (
    <div className="py-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Content Library"
          description="Source material, clips, thumbnails, and captions — tagged and organized."
        />
      </div>

      {/* Kind filter */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        <Link
          href="/library"
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
            !activeKind
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          All
        </Link>
        {Object.entries(KIND_LABELS).map(([value, label]) => (
          <Link
            key={value}
            href={`/library?kind=${value}`}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
              activeKind === value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={activeKind ? `No ${activeKind} assets` : "No assets yet"}
          description="Uploaded source material and exports will appear here."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <Card key={asset.id} className="flex flex-col">
              <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <File className="size-4" aria-hidden />
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {KIND_LABELS[asset.kind] ?? asset.kind}
                  </Badge>
                </div>
                <FavoriteButton assetId={asset.id} favorite={asset.favorite} />
              </CardHeader>
              <CardContent className="flex-1 pb-2">
                <p className="text-sm font-medium leading-snug text-foreground">{asset.name}</p>
                {asset.folder ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <FolderOpen className="size-3" aria-hidden />
                    {asset.folder}
                  </p>
                ) : null}
              </CardContent>
              <CardFooter className="flex items-center justify-between border-t border-border/60 pt-2! text-xs text-muted-foreground">
                <span>{formatBytes(asset.sizeBytes)}</span>
                <div className="flex gap-1">
                  {asset.tags.map((tag) => (
                    <span key={tag.id} className="inline-flex items-center gap-1">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: tag.color ?? undefined }}
                      />
                      {tag.name}
                    </span>
                  ))}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
