/**
 * AIContextBuilder — assembles the compact, task-relevant context sent to the
 * model. The point is token economy: never ship whole database objects, only
 * the fields a task actually reasons over. Reused analysis is passed in from
 * the caller (already persisted), never re-fetched or re-sent wholesale.
 */

export interface CampaignBrief {
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
  sourceMaterial?: string | null;
  platforms: string[];
  hashtags: string[];
  mentions?: string[];
  requirements: { kind: string; text: string }[];
}

/** Structured, already-validated analysis of the same campaign (if any). */
export interface PriorAnalysisSummary {
  summary: string;
  targetAudience: string[];
  contentAngles: string[];
  strategy: string[];
  opportunityScore: number;
}

export interface CreatorPerformance {
  /** Concise learned preferences (winning hooks, durations, topics...). */
  insights: string[];
}

function fmtDate(d: Date): string {
  return d.toISOString();
}

/**
 * Build the campaign block shared by analysis and idea-generation prompts.
 * Only non-empty fields are emitted; arrays are joined to one line each so the
 * context stays tight.
 */
export function buildCampaignContext(input: CampaignBrief): string {
  const {
    platforms = [],
    hashtags = [],
    mentions = [],
    requirements = [],
  } = input;

  const lines = [
    `Campaign: ${input.name}`,
    input.brand && `Brand: ${input.brand}`,
    input.creator && `Creator / person: ${input.creator}`,
    input.description && `Description: ${input.description}`,
    input.objective && `Objective: ${input.objective}`,
    input.reward && `Reward: ${input.reward}`,
    input.deadline && `Deadline: ${fmtDate(input.deadline)}`,
    input.format && `Format: ${input.format}`,
    input.audience && `Target audience: ${input.audience}`,
    (input.minDurationSec || input.maxDurationSec) &&
      `Duration: ${input.minDurationSec ?? "?"}–${input.maxDurationSec ?? "?"} seconds`,
    platforms.length > 0 && `Platforms: ${platforms.join(", ")}`,
    hashtags.length > 0 && `Hashtags: ${hashtags.join(" ")}`,
    mentions.length > 0 && `Mentions: ${mentions.join(" ")}`,
    input.requiredCta && `Required CTA: ${input.requiredCta}`,
    input.guidelines && `Guidelines: ${input.guidelines}`,
    input.prohibitedTopics && `Prohibited topics: ${input.prohibitedTopics}`,
    input.sourceMaterial && `Source material: ${input.sourceMaterial}`,
    requirements.length > 0 &&
      `Campaign requirements (${requirements.length}):\n- ${requirements
        .map((r) => `${r.kind}: ${r.text}`)
        .join("\n- ")}`,
  ];

  return lines.filter((x): x is string => Boolean(x)).join("\n");
}

/**
 * Compact summary of a prior analysis, for when a task builds on it (e.g. idea
 * generation). Kept short — the full analysis JSON is not re-sent.
 */
export function buildAnalysisSummaryContext(input: PriorAnalysisSummary): string {
  const blocks = [
    `Known opportunity score: ${input.opportunityScore}/100`,
    input.summary && `Prior analysis: ${input.summary}`,
    input.targetAudience.length > 0 &&
      `Audience insights: ${input.targetAudience.join(" | ")}`,
    input.contentAngles.length > 0 &&
      `Angles already identified: ${input.contentAngles.join(" | ")}`,
    input.strategy.length > 0 &&
      `Strategy already outlined: ${input.strategy.join(" | ")}`,
  ];
  return blocks.filter((x): x is string => Boolean(x)).join("\n");
}

/** Creator performance context for idea generation / optimization tasks. */
export function buildCreatorContext(input: CreatorPerformance): string {
  if (input.insights.length === 0) return "No creator performance history yet.";
  return `Creator performance history:\n- ${input.insights.join("\n- ")}`;
}
