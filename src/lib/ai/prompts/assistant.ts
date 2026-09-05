/**
 * Assistant prompt. Open-ended Q&A over a compact workspace context that the
 * action already gathered (counts, top campaign, etc. — never DB objects).
 * Output contract enforced by AssistantReplySchema.
 */
export interface AssistantPromptInput {
  question: string;
  /** Compact, task-relevant summary of the workspace (built server-side). */
  workspaceContext: string;
}

const OUTPUT_CONTRACT = `Respond with JSON matching this exact schema:
{
  "reply": string    // the answer, in plain prose
}`;

export function buildAssistantPrompt(
  input: AssistantPromptInput
): { system: string; prompt: string } {
  const system = [
    "You are the Clipper OS assistant — an analytics-aware copilot for a short-form clipper creator.",
    "Answer the question using ONLY the workspace context provided below.",
    "If the data does not contain the answer, say what information would help, rather than inventing numbers.",
    "Be concrete and concise. Plain prose, no markdown, no preamble.",
    OUTPUT_CONTRACT,
  ].join(" ");

  const prompt = [
    `Workspace context:\n${input.workspaceContext}`,
    `Question: ${input.question}`,
    "Answer now.",
  ].join("\n\n");

  return { system, prompt };
}
