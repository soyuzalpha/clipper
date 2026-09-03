import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Lightbulb } from "lucide-react";

interface PageStubProps {
  title: string;
  description?: string;
  emptyTitle: string;
  emptyDescription?: string;
}

export function PageStub({
  title,
  description,
  emptyTitle,
  emptyDescription,
}: PageStubProps) {
  return (
    <div className="py-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Lightbulb}
        title={emptyTitle}
        description={emptyDescription}
      />
    </div>
  );
}
