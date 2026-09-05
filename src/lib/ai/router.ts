/**
 * AI Router — maps an internal task to the model tier that should handle it
 * and dispatches the call through the active provider, logging every request.
 *
 * The app never names a provider or model directly; it names a task:
 *
 *   Campaign → AI Service → AI Router → HematTokenProvider → gateway → model
 *
 * Today every task resolves to the single configured gateway model
 * (AI_GATEWAY_MODEL). The seam exists so tasks can later be tiered:
 *
 *   simple extraction → AI_FAST_MODEL
 *   campaign strategy → AI_SMART_MODEL
 *   deep analytics    → AI_DEEP_MODEL
 *
 * ponytail: tiering is speculative for the MVP — all tiers collapse to the one
 * configured model until measurement shows cheap/strong models earn their env.
 */
import { getAIConfig } from "./config";
import { getAIProvider, type AIProvider, type GenerateOptions } from "./provider";
import { AIError } from "./errors";
import { prisma } from "@/lib/db";

export type AITask =
  | "campaign_analysis"
  | "content_ideas"
  | "script_generation"
  | "hook_generation"
  | "clip_detection"
  | "viral_analysis"
  | "caption_generation"
  | "analytics_analysis"
  | "content_optimization"
  | "content_planning"
  | "general";

export interface RunAITaskDeps {
  /** Override provider selection (tests inject a fake here). */
  provider?: AIProvider;
  /** Skip persistence of the request log (unit tests). */
  skipLog?: boolean;
}

/**
 * Resolve the model id for a task. Mock mode has no model — callers only hit
 * this for a real gateway provider.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- task→tier mapping is the future seam; today all tasks share one model.
export function resolveModelForTask(_task: AITask): string {
  const config = getAIConfig();
  if (!config.model) {
    throw new AIError("config", "No AI_GATEWAY_MODEL configured.");
  }
  return config.model;
}

/**
 * Run one AI task end-to-end: resolve provider + model, call it, time it,
 * record a request log row. The response is already schema-validated by the
 * provider before it is returned here.
 */
export async function runAITask<T>(
  task: AITask,
  options: GenerateOptions<T>,
  deps: RunAITaskDeps = {}
): Promise<T> {
  const provider = deps.provider ?? getAIProvider();
  const model =
    provider.name === "hemattoken" ? resolveModelForTask(task) : undefined;

  const startedAt = Date.now();
  try {
    const response = await provider.generate<T>({ ...options, model });
    const { usage } = response;
    await logRequest(task, provider, model, {
      success: true,
      durationMs: Date.now() - startedAt,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
    }, deps);
    return response.data;
  } catch (error) {
    const aiError = error instanceof AIError ? error : new AIError("unknown");
    await logRequest(task, provider, model, {
      success: false,
      errorKind: aiError.kind,
      durationMs: Date.now() - startedAt,
    }, deps);
    throw aiError;
  }
}

interface LogRequestData {
  success: boolean;
  errorKind?: string;
  durationMs: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

/**
 * Best-effort request log. A logging failure must never fail the AI call it
 * records, and unit tests opt out so they stay hermetic.
 */
async function logRequest(
  task: AITask,
  provider: AIProvider,
  model: string | undefined,
  data: LogRequestData,
  deps: RunAITaskDeps
): Promise<void> {
  if (deps.skipLog || process.env.NODE_ENV === "test") return;

  try {
    await prisma.aIRequestLog.create({
      data: {
        task,
        provider: provider.name,
        model: model ?? null,
        success: data.success,
        errorKind: data.errorKind ?? null,
        durationMs: data.durationMs,
        inputTokens: data.inputTokens ?? null,
        outputTokens: data.outputTokens ?? null,
        totalTokens: data.totalTokens ?? null,
      },
    });
  } catch {
    // Non-fatal: the request itself already succeeded or failed on its own.
  }
}
