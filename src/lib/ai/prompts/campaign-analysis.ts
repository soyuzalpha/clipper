/**
 * Campaign analysis prompt. Produces the structured read the campaign detail
 * page shows. The output contract is documented here AND enforced by
 * CampaignAnalysisSchema at the provider boundary.
 */
import {
  buildCampaignContext,
  type CampaignBrief,
} from "../context";

export interface CampaignAnalysisPromptInput extends CampaignBrief {
  /** Persisted analysis context only where it already exists. */
  priorAnalysis?: string | null;
}

const OUTPUT_CONTRACT = `Respond with JSON matching this exact schema:
{
  "summary": string,                // 2-4 sentence strategic read
  "requirements": string[],         // each requirement as one plain string
  "restrictions": string[],         // hard limits on topics/claims/format
  "risks": string[],                // what could hurt success
  "targetAudience": string[],       // concrete audience segments
  "contentAngles": string[],        // distinct content directions
  "strategy": string[],             // ordered, concrete moves
  "opportunityScore": number        // 0-100
}`;

export function buildCampaignAnalysisPrompt(
  input: CampaignAnalysisPromptInput
): { system: string; prompt: string } {
  const system = [
    "You are a senior campaign strategist for short-form creators.",
    "Analyze the brand campaign and produce a concise strategic read.",
    "Be specific and concrete — reference the campaign's actual audience, platforms, and constraints.",
    "Never invent requirements, restrictions, or rewards the brief does not state.",
    OUTPUT_CONTRACT,
  ].join(" ");

  const context = buildCampaignContext(input);
  const prompt = [
    context,
    input.priorAnalysis
      ? `Note: a previous analysis exists — do not repeat it verbatim; refine and build on it.\n${input.priorAnalysis}`
      : null,
    "Produce the analysis JSON now.",
  ]
    .filter((x): x is string => Boolean(x))
    .join("\n\n");

  return { system, prompt };
}
