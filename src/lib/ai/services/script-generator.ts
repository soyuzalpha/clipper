import { getAIProvider } from "../provider";
import { ScriptSchema, type GeneratedScript } from "../schemas";

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
 * Provider-agnostic and schema-validated on output.
 */
export async function generateScript(
  input: ScriptGenerationInput
): Promise<GeneratedScript> {
  const provider = getAIProvider();

  const system = [
    "You are a short-form scriptwriter for clipper creators.",
    "Write a tight, spoken-word script with a scroll-stopping hook, a concise intro, a fast body that delivers value, a payoff, and a call to action.",
    "Match the pacing to the target duration. Write for the ear — short sentences, no fluff.",
  ].join(" ");

  const parts = [
    `Idea: ${input.ideaTitle}`,
    input.hook && `Original hook: ${input.hook}`,
    input.angle && `Angle: ${input.angle}`,
    input.audience && `Target audience: ${input.audience}`,
    input.format && `Format: ${input.format}`,
    input.platform && `Platform: ${input.platform}`,
    input.durationSec && `Target duration: ${input.durationSec} seconds`,
    input.outline && `Outline: ${input.outline}`,
    input.cta && `CTA to include: ${input.cta}`,
    input.campaignName && `Campaign: ${input.campaignName}`,
    input.campaignGuidelines && `Campaign guidelines: ${input.campaignGuidelines}`,
  ]
    .filter((x): x is string => Boolean(x))
    .join("\n");

  return provider.generate<GeneratedScript>({
    schema: ScriptSchema,
    schemaName: "Script",
    system,
    prompt: parts,
  });
}
