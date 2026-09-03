import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { LayoutDashboard } from "lucide-react";

export default function OverviewPage() {
  return (
    <div className="py-6">
      <PageHeader
        title="Overview"
        description="What should I do next?"
      />
      <EmptyState
        icon={LayoutDashboard}
        title="Dashboard coming soon"
        description="Today's priorities, campaign opportunities, and AI recommendations will appear here."
      />
    </div>
  );
}
