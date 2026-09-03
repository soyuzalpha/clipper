import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  className?: string;
}

export function MetricCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  className,
}: MetricCardProps) {
  return (
    <Card className={className}>
      <CardContent className="px-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        {delta ? (
          <p
            className={cn(
              "mt-1 text-xs",
              deltaTone === "positive" && "text-emerald-600 dark:text-emerald-400",
              deltaTone === "negative" && "text-red-600 dark:text-red-400",
              deltaTone === "neutral" && "text-muted-foreground"
            )}
          >
            {delta}
          </p>
        ) : null}
    </CardContent>
    </Card>
  );
}
