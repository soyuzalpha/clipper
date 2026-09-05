import { runAITask, type RunAITaskDeps } from "../router";
import { CampaignAnalysisSchema, type CampaignAnalysis } from "../schemas";
import { buildCampaignAnalysisPrompt } from "../prompts/campaign-analysis";

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
 * Campaign → strategic analysis. Routes through the AI Router (provider-agnostic,
 * mock by default) and returns a schema-validated CampaignAnalysis.
 */
export async function analyzeCampaign(
  input: CampaignAnalysisInput,
  deps: RunAITaskDeps = {}
): Promise<CampaignAnalysis> {
  const { system, prompt } = buildCampaignAnalysisPrompt(input);

  return runAITask<CampaignAnalysis>(
    "campaign_analysis",
    {
      schema: CampaignAnalysisSchema,
      schemaName: "CampaignAnalysis",
      system,
      prompt,
    },
    deps
  );
}
