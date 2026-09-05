import { runAITask, type RunAITaskDeps } from "../router";
import { ContentIdeasSchema, type GeneratedContentIdeas } from "../schemas";
import { buildContentIdeasPrompt } from "../prompts/content-ideas";
import type {
  PriorAnalysisSummary,
  CreatorPerformance,
} from "../context";

export const DEFAULT_IDEA_COUNT = 5;

/** Campaign context the generator needs, plus optional prior analysis and
 * creator performance to ground ideas in evidence rather than templates. */
export interface IdeaGenerationInput {
  name: string;
  brand?: string | null;
  objective?: string | null;
  audience?: string | null;
  format?: string | null;
  minDurationSec?: number | null;
  maxDurationSec?: number | null;
  requiredCta?: string | null;
  guidelines?: string | null;
  prohibitedTopics?: string | null;
  sourceMaterial?: string | null;
  platforms: string[];
  hashtags: string[];
  mentions?: string[];
  requirements: { kind: string; text: string }[];
  /** Structured analysis of this campaign, if one has already been persisted. */
  analysis?: PriorAnalysisSummary | null;
  /** Learned creator preferences (winning hooks, durations, topics...). */
  creatorPerformance?: CreatorPerformance;
}

/**
 * Campaign → content ideas. Routes through the AI Router and validates
 * structured output against ContentIdeasSchema before persisting.
 */
export async function generateContentIdeas(
  input: IdeaGenerationInput,
  count: number = DEFAULT_IDEA_COUNT,
  deps: RunAITaskDeps = {}
): Promise<GeneratedContentIdeas> {
  const { system, prompt } = buildContentIdeasPrompt(input, count);

  return runAITask<GeneratedContentIdeas>(
    "content_ideas",
    {
      schema: ContentIdeasSchema,
      schemaName: "ContentIdeas",
      system,
      prompt,
    },
    deps
  );
}
