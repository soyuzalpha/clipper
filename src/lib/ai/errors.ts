/**
 * Controlled AI errors. Every failure an AI call can hit is mapped to one of
 * these so callers (server actions / UI) get a stable, safe message. Raw
 * gateway text, `ht-…` key fragments and auth headers never cross this boundary.
 */

export type AIErrorKind =
  | "config"
  | "authentication"
  | "permission"
  | "rate_limit"
  | "timeout"
  | "server_error"
  | "invalid_model"
  | "invalid_response"
  | "validation"
  | "unknown";

const KIND_LABELS: Record<AIErrorKind, string> = {
  config: "AI is not configured.",
  authentication: "The AI gateway rejected the API key.",
  permission: "The AI gateway refused this request.",
  rate_limit: "The AI gateway rate-limited the request. Try again shortly.",
  timeout: "The AI gateway timed out.",
  server_error: "The AI gateway had an error. Try again shortly.",
  invalid_model: "The configured AI model is not valid.",
  invalid_response: "The AI returned something that could not be used.",
  validation: "The AI response failed validation.",
  unknown: "The AI request failed unexpectedly.",
};

export class AIError extends Error {
  readonly kind: AIErrorKind;
  /** Safe, user-facing message (no secrets). */
  readonly safeMessage: string;

  constructor(kind: AIErrorKind, detail?: string) {
    super(detail ? `${KIND_LABELS[kind]} ${detail}` : KIND_LABELS[kind]);
    this.name = "AIError";
    this.kind = kind;
    this.safeMessage = KIND_LABELS[kind];
  }
}
