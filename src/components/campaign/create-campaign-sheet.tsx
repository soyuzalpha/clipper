"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CampaignForm } from "./campaign-form";
import { Plus } from "lucide-react";

/**
 * Create-a-campaign slide-over. A right-side Sheet fits the long campaign form
 * better than a centered dialog — more width for the two-column fields and
 * room to scroll sections without covering the whole screen.
 */
export function CreateCampaignSheet() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button size="sm">
            <Plus className="size-4" aria-hidden />
            New campaign
          </Button>
        }
      />
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-5 pt-5">
          <SheetTitle>New campaign</SheetTitle>
          <SheetDescription>
            Add a brand campaign. Only the name is required — fill in requirements to get better AI analysis.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <CampaignForm
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
