import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { GenerateOptions, AIProvider } from "../provider";

const DEFAULT_MODEL = process.env.AI_MODEL ?? "claude-3-5-haiku-latest";

/** Anthropic-backed provider. Structured output via tool use + JSON schema. */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  async generate<T>(options: GenerateOptions<T>): Promise<T> {
    const { schema, schemaName, system, prompt } = options;
    const { object } = await generateObject({
      model: anthropic(DEFAULT_MODEL),
      schema,
      schemaName,
      system,
      prompt,
    });
    return object;
  }
}
