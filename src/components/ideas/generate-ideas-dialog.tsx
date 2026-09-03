"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateIdeasForCampaign } from "@/app/(dashboard)/ideas/actions";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerateIdeasDialogProps {
  campaigns: { id: string; name: string; brand: string | null }[];
}

export function GenerateIdeasDialog({ campaigns }: GenerateIdeasDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(campaigns[0]?.id ?? null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (campaigns.length === 0) return null;

  const run = async () => {
    if (!selectedId) return;
    setGenerating(true);
    setError(null);
    const result = await generateIdeasForCampaign(selectedId);
    setGenerating(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Sparkles className="size-4" aria-hidden />
            Generate ideas
          </Button>
        }
      />
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate content ideas</DialogTitle>
          <DialogDescription>
            Pick a campaign — we&apos;ll generate ideas from its requirements and brief.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {campaigns.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={selectedId === c.id}
              onClick={() => setSelectedId(c.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors",
                selectedId === c.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              )}
            >
              <span className="text-sm font-medium text-foreground">{c.name}</span>
              {c.brand ? (
                <span className="text-xs text-muted-foreground">{c.brand}</span>
              ) : null}
            </button>
          ))}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={run} disabled={!selectedId || generating}>
            {generating ? "Generating…" : "Generate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
