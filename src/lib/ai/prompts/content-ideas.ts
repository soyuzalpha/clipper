/**
 * Content idea generation prompt. Ideas are generated for ONE campaign from
 * its brief plus (when available) the campaign analysis and creator
 * performance history — never as generic templates.
 */
import {
  buildCampaignContext,
  buildAnalysisSummaryContext,
  buildCreatorContext,
  type CampaignBrief,
  type PriorAnalysisSummary,
  type CreatorPerformance,
} from "../context";

export interface ContentIdeasPromptInput extends CampaignBrief {
  analysis?: PriorAnalysisSummary | null;
  creatorPerformance?: CreatorPerformance;
  count?: number;
}

const OUTPUT_CONTRACT = `Respond with JSON matching this exact schema:
{
  "ideas": [
    {
      "title": string,        // punchy, specific
      "hook": string,         // scroll-stopping first line
      "angle": string,        // the one distinct angle of this idea
      "audience": string,     // who it targets
      "format": string,       // content structure name
      "duration": number,     // seconds
      "structure": string[],  // ordered beats of the video
      "cta": string,
      "platform": "tiktok" | "instagram_reels" | "youtube_shorts",
      "viralScore": number,   // 0-100
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}`;

export function buildContentIdeasPrompt(
  input: ContentIdeasPromptInput,
  count: number
): { system: string; prompt: string } {
  const system = [
    "You are a senior short-form content strategist for clipper creators.",
    "Generate distinct, high-viral-potential content ideas for the given brand campaign.",
    "Ideas must be mutually distinct angles on the campaign, not variations of one idea.",
    "Respect the campaign's platforms and requirements. Do not invent prohibited topics.",
    "Only suggest platforms from the campaign's list.",
    OUTPUT_CONTRACT,
  ].join(" ");

  const parts = [
    buildCampaignContext(input),
    input.analysis ? buildAnalysisSummaryContext(input.analysis) : null,
    input.creatorPerformance
      ? buildCreatorContext(input.creatorPerformance)
      : null,
    `Generate exactly ${count} ideas.`,
  ];

  const prompt = parts.filter((x): x is string => Boolean(x)).join("\n\n");
  return { system, prompt };
}
