"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { analyzeCampaignAction } from "@/app/(dashboard)/campaigns/[id]/actions";
import { Sparkles } from "lucide-react";

/**
 * Run (or re-run) the AI campaign analysis. Result is persisted server-side;
 * the page refreshes to show the fresh analysis + opportunity score.
 */
export function AnalyzeCampaignButton({ campaignId }: { campaignId: string }) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const run = async () => {
    setRunning(true);
    setError(null);
    const result = await analyzeCampaignAction(campaignId);
    setRunning(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-2">
      <Button size="sm" onClick={run} disabled={running} className="w-full">
        <Sparkles className="size-4" aria-hidden />
        {running ? "Analyzing…" : "Analyze campaign"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
