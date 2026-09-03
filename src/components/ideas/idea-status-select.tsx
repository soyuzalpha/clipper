"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateIdeaStatus } from "@/app/(dashboard)/ideas/[id]/actions";

const STATUSES = [
  { value: "idea", label: "Idea" },
  { value: "selected", label: "Selected" },
  { value: "scripted", label: "Scripted" },
  { value: "production", label: "Production" },
  { value: "editing", label: "Editing" },
  { value: "ready", label: "Ready" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export function IdeaStatusSelect({
  ideaId,
  currentStatus,
}: {
  ideaId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      onValueChange={(value) => {
        const next = value ?? "idea";
        setStatus(next);
        startTransition(async () => {
          await updateIdeaStatus(ideaId, next);
        });
      }}
    >
      <SelectTrigger size="sm" aria-label="Change idea status" className={isPending ? "opacity-60" : undefined}>
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
