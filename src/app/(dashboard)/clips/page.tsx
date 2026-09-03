import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ImportVideoDialog } from "@/components/clips/import-video-dialog";
import { DetectClipsButton } from "@/components/clips/detect-clips-button";
import { ClipStatusSelect } from "@/components/clips/clip-status-select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Clapperboard, ExternalLink, Flame } from "lucide-react";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

const VIDEO_STATUS_STYLES: Record<string, string> = {
  imported: "bg-muted text-muted-foreground",
  processing: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  ready: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

function videoStatusLabel(status: string): string {
  switch (status) {
    case "processing":
      return "Processing";
    case "ready":
      return "Ready";
    default:
      return "Imported";
  }
}

function formatClock(sec: number): string {
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
}

function viralColor(score: number): string {
  if (score >= 85) return "text-emerald-500";
  if (score >= 70) return "text-amber-500";
  return "text-muted-foreground";
}

export default async function ClipMakerPage() {
  const workspace = await prisma.workspace.findFirstOrThrow();
  const videos = await prisma.video.findMany({
    where: { workspaceId: workspace.id },
    include: { clips: { orderBy: { startSec: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const totalClips = videos.reduce((n, v) => n + v.clips.length, 0);

  return (
    <div className="py-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Clip Maker"
          description="Import long-form videos and find the moments worth clipping."
        />
        <ImportVideoDialog />
      </div>

      {videos.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          title="No source videos yet"
          description="Import a video to detect interesting moments."
        />
      ) : (
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground">
            {videos.length} video{videos.length === 1 ? "" : "s"} · {totalClips} clip{totalClips === 1 ? "" : "s"} detected
          </p>

          {videos.map((video) => (
            <Card key={video.id}>
              <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Clapperboard className="size-4" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{video.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      {video.sourceUrl ? (
                        <Link
                          href={video.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 truncate underline-offset-2 hover:underline"
                        >
                          <ExternalLink className="size-3 shrink-0" aria-hidden />
                          <span className="truncate">{video.sourceUrl}</span>
                        </Link>
                      ) : null}
                      {video.durationSec ? <span>{formatClock(video.durationSec)}</span> : null}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge className={cn("text-xs", VIDEO_STATUS_STYLES[video.status] ?? VIDEO_STATUS_STYLES.imported)}>
                    {videoStatusLabel(video.status)}
                  </Badge>
                  {video.clips.length === 0 ? <DetectClipsButton videoId={video.id} /> : null}
                </div>
              </CardHeader>

              {video.clips.length > 0 ? (
                <CardContent className="divide-y divide-border/60 p-0">
                  {video.clips.map((clip) => (
                    <div key={clip.id} className="flex items-center justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{clip.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {formatClock(clip.startSec)}–{formatClock(clip.endSec)}
                          {clip.hook ? <span className="text-foreground/70"> · “{clip.hook}”</span> : null}
                          {clip.reason ? <span> · {clip.reason}</span> : null}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {clip.viralScore != null ? (
                          <span className={cn("flex items-center gap-1 text-xs font-medium tabular-nums", viralColor(clip.viralScore))}>
                            <Flame className="size-3.5" aria-hidden />
                            {clip.viralScore}
                          </span>
                        ) : null}
                        <ClipStatusSelect clipId={clip.id} currentStatus={clip.status} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              ) : (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    No clips yet — run detection to find interesting moments.
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
