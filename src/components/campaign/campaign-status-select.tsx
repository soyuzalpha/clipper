"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateCampaignStatus } from "@/app/(dashboard)/campaigns/actions";

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "content_created", label: "Content Created" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
];

export function CampaignStatusSelect({
  campaignId,
  currentStatus,
}: {
  campaignId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      onValueChange={(value) => {
        setStatus(value as string);
        startTransition(async () => {
          await updateCampaignStatus(campaignId, value as string);
        });
      }}
    >
      <SelectTrigger size="sm" aria-label="Change campaign status" className={isPending ? "opacity-60" : undefined}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
