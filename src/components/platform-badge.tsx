import { Badge } from "@/components/ui/badge";
import type { Platform } from "@/lib/constants";

const LABELS: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram_reels: "Reels",
  youtube_shorts: "YT Shorts",
};

export function PlatformBadge({ platform }: { platform: string }) {
  const label = LABELS[platform as Platform] ?? platform;
  return <Badge variant="secondary">{label}</Badge>;
}
