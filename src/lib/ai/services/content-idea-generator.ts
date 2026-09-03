import { getAIProvider } from "../provider";
import { ContentIdeasSchema, type GeneratedContentIdeas } from "../schemas";

export const DEFAULT_IDEA_COUNT = 5;

/** Everything the generator needs to know about the campaign. */
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
  requirements: string[];
}

/**
 * Campaign → content ideas. Provider-agnostic: resolves the active provider
 * (mock by default) and validates structured output against ContentIdeasSchema.
 */
export async function generateContentIdeas(
  input: IdeaGenerationInput,
  count: number = DEFAULT_IDEA_COUNT
): Promise<GeneratedContentIdeas> {
  const { platforms = [], hashtags = [], requirements = [] } = input;
  const provider = getAIProvider();

  const system = [
    "You are a senior short-form content strategist for clipper creators.",
    "Generate distinct, high-viral-potential content ideas for the given brand campaign.",
    "Each idea needs a punchy title, a hook written to stop the scroll in the first second, a clear angle, a specific target audience, a content structure, a platform, an estimated duration, a call to action, a viral-score estimate, and a difficulty rating.",
    "Ideas must be mutually distinct angles on the campaign, not variations of one idea.",
    "Respect the campaign's platforms and requirements. Do not invent prohibited topics.",
  ].join(" ");

  const parts = [
    `Campaign: ${input.name}`,
    input.brand && `Brand: ${input.brand}`,
    input.objective && `Objective: ${input.objective}`,
    input.audience && `Target audience: ${input.audience}`,
    input.format && `Preferred format: ${input.format}`,
    platforms.length > 0 && `Platforms: ${platforms.join(", ")}`,
    input.minDurationSec || input.maxDurationSec
      ? `Duration: ${input.minDurationSec ?? "?"}–${input.maxDurationSec ?? "?"} seconds`
      : null,
    hashtags.length > 0 && `Hashtags: ${hashtags.join(" ")}`,
    input.requiredCta && `Required CTA: ${input.requiredCta}`,
    input.guidelines && `Guidelines: ${input.guidelines}`,
    input.prohibitedTopics && `Prohibited topics: ${input.prohibitedTopics}`,
    input.sourceMaterial && `Source material: ${input.sourceMaterial}`,
    requirements.length > 0 &&
      `Campaign requirements (${requirements.length}):\n- ${requirements.join("\n- ")}`,
    `Generate exactly ${count} ideas.`,
  ]
    .filter((x): x is string => Boolean(x))
    .join("\n");

  return provider.generate<GeneratedContentIdeas>({
    schema: ContentIdeasSchema,
    schemaName: "ContentIdeas",
    system,
    prompt: parts,
  });
}
