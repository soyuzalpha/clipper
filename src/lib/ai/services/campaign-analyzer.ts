import { getAIProvider } from "../provider";
import { CampaignAnalysisSchema, type CampaignAnalysis } from "../schemas";

/** Everything the analyzer needs to know about the campaign. */
export interface CampaignAnalysisInput {
  name: string;
  brand?: string | null;
  creator?: string | null;
  description?: string | null;
  objective?: string | null;
  reward?: string | null;
  deadline?: Date | null;
  format?: string | null;
  audience?: string | null;
  minDurationSec?: number | null;
  maxDurationSec?: number | null;
  requiredCta?: string | null;
  guidelines?: string | null;
  prohibitedTopics?: string | null;
  submissionProcedure?: string | null;
  rewardConditions?: string | null;
  sourceMaterial?: string | null;
  platforms: string[];
  hashtags: string[];
  mentions: string[];
  requirements: { kind: string; text: string }[];
}

/**
 * Campaign → strategic analysis (summary, requirements read, risks, strategy,
 * opportunity score). Provider-agnostic and schema-validated on output.
 */
export async function analyzeCampaign(
  input: CampaignAnalysisInput
): Promise<CampaignAnalysis> {
  const {
    platforms = [],
    hashtags = [],
    mentions = [],
    requirements = [],
  } = input;
  const provider = getAIProvider();

  const system = [
    "You are a campaign strategist for short-form creators.",
    "Analyze the brand campaign and produce a concise strategic read: summary, the requirements that shape content, the main risks, a recommended content strategy, and an opportunity score out of 100.",
    "Be specific and concrete — reference the campaign's actual audience, platforms, and constraints.",
  ].join(" ");

  const parts = [
    `Campaign: ${input.name}`,
    input.brand && `Brand: ${input.brand}`,
    input.creator && `Creator / person: ${input.creator}`,
    input.description && `Description: ${input.description}`,
    input.objective && `Objective: ${input.objective}`,
    input.reward && `Reward: ${input.reward}`,
    input.deadline && `Deadline: ${input.deadline.toISOString()}`,
    input.format && `Format: ${input.format}`,
    input.audience && `Target audience: ${input.audience}`,
    input.minDurationSec || input.maxDurationSec
      ? `Duration: ${input.minDurationSec ?? "?"}–${input.maxDurationSec ?? "?"} seconds`
      : null,
    platforms.length > 0 && `Platforms: ${platforms.join(", ")}`,
    hashtags.length > 0 && `Hashtags: ${hashtags.join(" ")}`,
    mentions.length > 0 && `Mentions: ${mentions.join(" ")}`,
    input.requiredCta && `Required CTA: ${input.requiredCta}`,
    input.guidelines && `Guidelines: ${input.guidelines}`,
    input.prohibitedTopics && `Prohibited topics: ${input.prohibitedTopics}`,
    input.submissionProcedure && `Submission: ${input.submissionProcedure}`,
    input.rewardConditions && `Reward conditions: ${input.rewardConditions}`,
    input.sourceMaterial && `Source material: ${input.sourceMaterial}`,
    requirements.length > 0
      ? `Campaign requirements (${requirements.length}):\n- ${requirements
          .map((r) => `${r.kind}: ${r.text}`)
          .join("\n- ")}`
      : null,
  ]
    .filter((x): x is string => Boolean(x))
    .join("\n");

  return provider.generate<CampaignAnalysis>({
    schema: CampaignAnalysisSchema,
    schemaName: "CampaignAnalysis",
    system,
    prompt: parts,
  });
}
