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
import { CampaignForm } from "./campaign-form";
import { Plus } from "lucide-react";

export function CreateCampaignDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="size-4" aria-hidden />
            New campaign
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New campaign</DialogTitle>
          <DialogDescription>
            Add a brand campaign. Only the name is required — fill in requirements to get better AI analysis.
          </DialogDescription>
        </DialogHeader>
        <CampaignForm onSuccess={() => { setOpen(false); router.refresh(); }} />
      </DialogContent>
    </Dialog>
  );
}