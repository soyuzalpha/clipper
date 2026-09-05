import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/library/favorite-button";
import { UploadButton, UploadDropTarget } from "@/components/library/upload";
import { ImportUrlDialog } from "@/components/library/import-url-dialog";
import { AssetCardActions } from "@/components/library/asset-card-actions";
import { FolderOpen, FileVideo, FileImage, FileAudio, FileText, type LucideIcon } from "lucide-react";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

type TabKey = "videos" | "images" | "audio" | "documents";

const TABS: { key: TabKey | null; label: string }[] = [
  { key: null, label: "All" },
  { key: "videos", label: "Videos" },
  { key: "images", label: "Images" },
  { key: "audio", label: "Audio" },
  { key: "documents", label: "Documents" },
];

type Row = Awaited<ReturnType<typeof loadAssets>>[number];

async function loadAssets(workspaceId: string) {
  return prisma.asset.findMany({
    where: { workspaceId },
    include: { tags: true },
    orderBy: { updatedAt: "desc" },
  });
}

/** File-category a legacy `kind` maps to when mimeType is absent. */
const LEGACY_KIND_CATEGORY: Record<string, TabKey> = {
  video: "videos",
  clip: "videos",
  thumbnail: "images",
  image: "images",
  audio: "audio",
};

function categoryFor(a: Pick<Row, "mimeType" | "kind">): TabKey {
  const m = a.mimeType?.toLowerCase();
  if (m?.startsWith("video/")) return "videos";
  if (m?.startsWith("image/")) return "images";
  if (m?.startsWith("audio/")) return "audio";
  if (!a.mimeType && a.kind in LEGACY_KIND_CATEGORY) return LEGACY_KIND_CATEGORY[a.kind];
  return "documents"; // pdf + anything unclassified
}

const FILE_ICONS: Record<TabKey, LucideIcon> = {
  videos: FileVideo,
  images: FileImage,
  audio: FileAudio,
  documents: FileText,
};

const TAB_PLURAL: Record<TabKey, string> = {
  videos: "videos",
  images: "images",
  audio: "audio",
  documents: "documents",
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

function typeLabel(a: Pick<Row, "mimeType" | "kind">): string {
  if (a.mimeType) return a.mimeType.split("/").pop()?.toUpperCase() ?? a.mimeType;
  return a.kind;
}

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function LibraryPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const activeTab: TabKey | null =
    TABS.some((t) => t.key === tab) && tab !== undefined ? (tab as TabKey) : null;

  const workspace = await prisma.workspace.findFirstOrThrow();
  const assets = await loadAssets(workspace.id);

  const visible = activeTab ? assets.filter((a) => categoryFor(a) === activeTab) : assets;

  const allEmpty = assets.length === 0;

  return (
    <div className="py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Content Library"
          description="Videos, images, audio, and PDFs — stored on your server and available anywhere."
        />
        <div className="flex items-center gap-2">
          <ImportUrlDialog />
          <UploadButton />
        </div>
      </div>

      {/* File-category filter */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const active = activeTab === t.key;
          const href = t.key ? `/library?tab=${t.key}` : "/library";
          return (
            <Link
              key={t.label}
              href={href}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <UploadDropTarget>
        {visible.length === 0 ? (
          <EmptyState
            icon={activeTab ? FILE_ICONS[activeTab] : FolderOpen}
            title={activeTab ? `No ${TAB_PLURAL[activeTab]} yet` : allEmpty ? "Your library is empty" : "Nothing here"}
            description={
              allEmpty
                ? "Upload files from this device, or import from a URL, to start your library. You can also drop files anywhere on this page."
                : "Drop files anywhere to add them."
            }
            action={
              allEmpty ? (
                <div className="flex items-center gap-2">
                  <UploadButton />
                  <ImportUrlDialog />
                </div>
              ) : (
                <UploadButton />
              )
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((asset) => {
              const category = categoryFor(asset);
              const isImage = asset.mimeType?.toLowerCase().startsWith("image/");
              const Icon = FILE_ICONS[category];
              return (
                <Card key={asset.id} className="group flex flex-col overflow-hidden">
                  {/* Thumbnail / typed tile */}
                  {isImage ? (
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/content/${asset.id}/preview`}
                        alt={asset.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-muted/60">
                      <Icon className="size-8 text-muted-foreground/70" aria-hidden />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 flex-1 text-sm font-medium leading-snug text-foreground">
                        {asset.name}
                      </p>
                      <FavoriteButton assetId={asset.id} favorite={asset.favorite} />
                    </div>

                    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-medium text-muted-foreground">{typeLabel(asset)}</span>
                      {formatBytes(asset.sizeBytes) ? <span>· {formatBytes(asset.sizeBytes)}</span> : null}
                      <span>· {asset.updatedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                    </p>

                    {asset.folder ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <FolderOpen className="size-3" aria-hidden />
                        {asset.folder}
                      </p>
                    ) : null}

                    <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                      <div className="flex flex-wrap gap-1">
                        {asset.tags.map((tag) => (
                          <Badge key={tag.id} variant="secondary" className="gap-1 px-1.5 py-0 text-[0.65rem]">
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: tag.color ?? undefined }} />
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                      <div className="ml-auto flex shrink-0 items-center">
                        <AssetCardActions
                          asset={{ id: asset.id, name: asset.name, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </UploadDropTarget>
    </div>
  );
}
