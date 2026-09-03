import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import type { GenerateOptions, AIProvider } from "../provider";

const DEFAULT_MODEL = process.env.AI_MODEL ?? "gpt-4o-mini";

/** OpenAI-backed provider. Structured output via the Responses API + JSON schema. */
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  async generate<T>(options: GenerateOptions<T>): Promise<T> {
    const { schema, schemaName, system, prompt } = options;
    const { object } = await generateObject({
      model: openai(DEFAULT_MODEL),
      schema,
      schemaName,
      system,
      prompt,
      // ponytail: cheap + fast is right for MVP; swap model via AI_MODEL env when quality demands.
    });
    return object;
  }
}
