import { runAITask, type RunAITaskDeps } from "../router";
import { AssistantReplySchema, type AssistantReply } from "../schemas";
import { buildAssistantPrompt } from "../prompts/assistant";

/** Everything the assistant needs to answer one open-ended question. */
export interface AssistantInput {
  question: string;
  /** Compact workspace summary the caller already assembled server-side. */
  workspaceContext: string;
}

/**
 * Question → grounded assistant reply. Routes through the AI Router on the
 * `general` task. Returns the schema-validated reply text.
 */
export async function askAIAssistant(
  input: AssistantInput,
  deps: RunAITaskDeps = {}
): Promise<AssistantReply> {
  const { system, prompt } = buildAssistantPrompt(input);

  return runAITask<AssistantReply>(
    "general",
    {
      schema: AssistantReplySchema,
      schemaName: "AssistantReply",
      system,
      prompt,
    },
    deps
  );
}
