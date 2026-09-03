import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformBadge } from "@/components/platform-badge";
import type { ContentIdea } from "@/generated/prisma/client";

export function IdeaCard({ idea }: { idea: ContentIdea }) {
  return (
    <Link href={`/ideas/${idea.id}`} className="group block">
      <Card className="h-full transition-colors group-hover:border-foreground/20">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2">
            {idea.platform ? <PlatformBadge platform={idea.platform} /> : null}
            {idea.difficulty ? (
              <Badge variant="outline" className="text-xs capitalize">{idea.difficulty}</Badge>
            ) : null}
          </div>
          <p className="text-sm font-medium leading-snug text-foreground">{idea.title}</p>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {idea.hook ? <p className="line-clamp-2">{idea.hook}</p> : null}
          {idea.angle ? <p className="mt-1.5 line-clamp-1 text-muted-foreground/80">{idea.angle}</p> : null}
        </CardContent>
        <CardFooter className="justify-between border-t border-border/60 pt-3! text-xs text-muted-foreground">
          <span className="capitalize">{idea.status}</span>
          {idea.viralScore != null ? (
            <span className="font-semibold text-foreground">{Math.round(idea.viralScore)}/100</span>
          ) : null}
        </CardFooter>
      </Card>
    </Link>
  );
}
