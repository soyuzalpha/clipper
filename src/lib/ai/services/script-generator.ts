import { runAITask, type RunAITaskDeps } from "../router";
import { ScriptSchema, type GeneratedScript } from "../schemas";
import { buildScriptPrompt } from "../prompts/scripts";

export interface ScriptGenerationInput {
  ideaTitle: string;
  hook?: string | null;
  angle?: string | null;
  audience?: string | null;
  format?: string | null;
  durationSec?: number | null;
  outline?: string | null;
  cta?: string | null;
  campaignName?: string | null;
  campaignGuidelines?: string | null;
  platform?: string | null;
}

/**
 * Idea → spoken-word short-form script (hook / intro / body / payoff / CTA).
 * Routes through the AI Router and validates against ScriptSchema.
 */
export async function generateScript(
  input: ScriptGenerationInput,
  deps: RunAITaskDeps = {}
): Promise<GeneratedScript> {
  const { system, prompt } = buildScriptPrompt(input);

  return runAITask<GeneratedScript>(
    "script_generation",
    {
      schema: ScriptSchema,
      schemaName: "Script",
      system,
      prompt,
    },
    deps
  );
}
