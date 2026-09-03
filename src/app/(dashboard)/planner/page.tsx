import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PlatformBadge } from "@/components/platform-badge";
import { PlanIdeaDialog } from "@/components/planner/plan-idea-dialog";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function PlannerPage() {
  const workspace = await prisma.workspace.findFirstOrThrow();

  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
  const windowEnd = new Date(days[6]);
  windowEnd.setHours(23, 59, 59, 999);

  const [plans, ideas] = await Promise.all([
    prisma.contentPlan.findMany({
      where: { workspaceId: workspace.id },
      include: { idea: { select: { id: true, title: true, status: true } } },
      orderBy: { publishAt: "asc" },
    }),
    prisma.contentIdea.findMany({
      where: { workspaceId: workspace.id, status: { notIn: ["published", "archived"] } },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const overdue = plans.filter(
    (p) => p.publishAt && p.publishAt < today && p.status !== "published"
  );
  const unscheduled = plans.filter((p) => !p.publishAt);
  const later = plans.filter(
    (p) => p.publishAt && p.publishAt > windowEnd && p.status !== "published"
  );

  const statusTone = (s: string) =>
    s === "published"
      ? "default"
      : s === "in_production" || s === "ready"
        ? "outline"
        : "secondary";

  return (
    <div className="py-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Planner"
          description="Your publishing calendar for the week — what to produce, when it goes live."
        />
        <PlanIdeaDialog ideas={ideas} />
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing scheduled"
          description="Plan an idea to see it on your weekly calendar."
        />
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 ? (
            <div className="rounded-md border border-border bg-destructive/5 p-3 text-sm">
              <p className="font-medium text-foreground">Overdue — {overdue.length}</p>
              {overdue.map((p) => (
                <Link
                  key={p.id}
                  href={`/ideas/${p.ideaId}`}
                  className="mt-1 block text-muted-foreground hover:text-foreground"
                >
                  {p.idea.title} · planned {p.publishAt?.toLocaleDateString()}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-7">
            {days.map((day, i) => {
              const dayPlans = plans.filter(
                (p) => p.publishAt && sameDay(p.publishAt, day)
              );
              const isToday = sameDay(day, new Date());
              return (
                <Card
                  key={day.toISOString()}
                  className={isToday ? "border-primary/40" : "h-full"}
                >
                  <CardContent className="p-3">
                    <div className="mb-2 text-center">
                      <div className="text-xs text-muted-foreground">
                        {i === 0 ? "Today" : DAY_LABELS[day.getDay()]}
                      </div>
                      <div className="text-lg font-semibold text-foreground">{day.getDate()}</div>
                    </div>
                    <div className="space-y-2">
                      {dayPlans.map((p) => (
                        <Link
                          key={p.id}
                          href={`/ideas/${p.ideaId}`}
                          className="block rounded-md border border-border/60 bg-muted/40 p-2 transition-colors hover:bg-muted"
                        >
                          <p className="line-clamp-2 text-xs font-medium text-foreground">
                            {p.idea.title}
                          </p>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <PlatformBadge platform={p.platform} />
                            <Badge variant={statusTone(p.status)} className="text-[10px] capitalize">
                              {p.status}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {(unscheduled.length > 0 || later.length > 0) ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {unscheduled.length > 0 ? (
                <div className="rounded-md border border-dashed border-border p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Unscheduled
                  </p>
                  {unscheduled.map((p) => (
                    <Link key={p.id} href={`/ideas/${p.ideaId}`} className="block text-sm text-muted-foreground hover:text-foreground">
                      {p.idea.title}
                    </Link>
                  ))}
                </div>
              ) : null}
              {later.length > 0 ? (
                <div className="rounded-md border border-dashed border-border p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Later
                  </p>
                  {later.map((p) => (
                    <Link key={p.id} href={`/ideas/${p.ideaId}`} className="block text-sm text-muted-foreground hover:text-foreground">
                      {p.idea.title} · {p.publishAt?.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
