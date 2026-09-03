"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { detectClips } from "@/app/(dashboard)/clips/actions";
import { Loader2, Sparkles } from "lucide-react";

/** Run mock clip detection on an imported video (no clips yet). */
export function DetectClipsButton({ videoId }: { videoId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const result = await detectClips(videoId);
          setBusy(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.refresh();
        }}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="size-4" aria-hidden />
        )}
        Detect clips
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
