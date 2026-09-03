import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  content_created: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  submitted: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
  completed: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300",
};

const LABELS: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  in_progress: "In Progress",
  content_created: "Content Created",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

export function CampaignStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STYLES[status])}>
      {LABELS[status] ?? status}
    </Badge>
  );
}
