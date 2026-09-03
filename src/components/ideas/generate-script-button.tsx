"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { generateScriptForIdea } from "@/app/(dashboard)/ideas/[id]/actions";
import { Wand2 } from "lucide-react";

export function GenerateScriptButton({ ideaId }: { ideaId: string }) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const run = async () => {
    setRunning(true);
    setError(null);
    const result = await generateScriptForIdea(ideaId);
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
        <Wand2 className="size-4" aria-hidden />
        {running ? "Writing script…" : "Generate script"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
