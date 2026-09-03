"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setClipStatus } from "@/app/(dashboard)/clips/actions";

const STATUSES = [
  { value: "detected", label: "Detected" },
  { value: "exported", label: "Exported" },
  { value: "published", label: "Published" },
];

/** Advance a clip through detected → exported → published. */
export function ClipStatusSelect({
  clipId,
  currentStatus,
}: {
  clipId: string;
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
          await setClipStatus(clipId, value as string);
        });
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label="Change clip status"
        className={isPending ? "opacity-60" : undefined}
      >
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
