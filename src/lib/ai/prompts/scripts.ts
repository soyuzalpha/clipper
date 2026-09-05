/**
 * Script generation prompt. Turns one content idea into a spoken-word,
 * short-form script. Output contract enforced by ScriptSchema.
 */
export interface ScriptPromptInput {
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

const OUTPUT_CONTRACT = `Respond with JSON matching this exact schema:
{
  "hook": string,    // scroll-stopping opening line
  "intro": string,   // 1-2 sentences into the topic
  "body": string,    // main value, spoken-word pacing
  "payoff": string,  // the turn / takeaway
  "cta": string
}`;

export function buildScriptPrompt(input: ScriptPromptInput): { system: string; prompt: string } {
  const system = [
    "You are a short-form scriptwriter for clipper creators.",
    "Write a tight, spoken-word script with a scroll-stopping hook, a concise intro, a fast body that delivers value, a payoff, and a call to action.",
    "Match the pacing to the target duration. Write for the ear — short sentences, no fluff.",
    OUTPUT_CONTRACT,
  ].join(" ");

  const parts = [
    `Idea: ${input.ideaTitle}`,
    input.hook && `Original hook: ${input.hook}`,
    input.angle && `Angle: ${input.angle}`,
    input.audience && `Target audience: ${input.audience}`,
    input.format && `Format: ${input.format}`,
    input.platform && `Platform: ${input.platform}`,
    input.durationSec && `Target duration: ${input.durationSec} seconds`,
    input.outline && `Outline to follow:\n${input.outline}`,
    input.campaignName && `Campaign: ${input.campaignName}`,
    input.campaignGuidelines && `Campaign guidelines: ${input.campaignGuidelines}`,
    input.cta && `Intended CTA: ${input.cta}`,
    "Write the script now.",
  ];

  const prompt = parts.filter((x): x is string => Boolean(x)).join("\n");
  return { system, prompt };
}
