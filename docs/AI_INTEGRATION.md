# AI Integration — HematToken Gateway

## What this is

All production AI calls go through the **HematToken gateway** (`https://api.hemattoken.id/v1`), an OpenAI-compatible Chat Completions endpoint. The app never calls Anthropic, OpenAI, or Gemini directly. This document records the concrete integration: config, flow, error mapping, logging, and security boundaries.

Routing:

```
App → AI Service (campaign-analyzer, content-idea-generator, …)
   → AI Router (runAITask)
   → AIProvider (mock | hemattoken)
   → HematTokenProvider → gateway (Chat Completions) → upstream model
```

## Configuration

Environment (server-side only — never exposed to the client):

| Var | Purpose |
| --- | --- |
| `AI_PROVIDER` | `mock` (default) or `hemattoken` |
| `AI_GATEWAY_BASE_URL` | Gateway base, e.g. `https://api.hemattoken.id/v1` |
| `AI_GATEWAY_API_KEY` | Gateway key, `ht-…`. Server-only. |
| `AI_GATEWAY_MODEL` | Upstream model id the gateway routes to, e.g. `openai/gpt-5.2` |

`.env.example` holds placeholders only. Reading these is centralized in `src/lib/ai/config.ts`.

`getAIConfig()` throws a controlled `AIError("config", …)` if `hemattoken` is active but a var is missing. `getAIConfigStatus()` never throws — the settings page and `/api/ai/health` use it to report provider, model, `gatewayConfigured`, and the exact `missingVars` list.

## Providers

`src/lib/ai/provider.ts` defines the `AIProvider` contract: `name` + `generate<T>({ schema, schemaName, system, prompt, model? }) → Promise<AIResponse<T>>` where `AIResponse` carries `data` plus optional token `usage`.

- `mock` (`providers/mock.ts`) returns deterministic, schema-valid fixtures. No keys, no network — keeps the app fully usable in dev, tests, CI, and demos.
- `hemattoken` (`providers/hemat.ts`) talks to the gateway through the Vercel AI SDK (`generateText` over `createOpenAI({ baseURL, apiKey }).chat(model)`) — a plain OpenAI-compatible Chat Completions call. The HematToken gateway does **not** honor `response_format` (structured outputs), so the SDK's `generateObject` cannot be used: the upstream model emits a prose reasoning preamble and never returns strict JSON. Instead `generateText` returns the raw completion, `extractJSONObject` recovers the first balanced `{…}` object from the reply (tolerating the preamble), and the result is validated against the task's Zod schema at the provider boundary — structured output is guaranteed by the parse, not by the transport. Constructor overrides exist for tests; production settings come from env.

Provider selection lives in `provider.ts` (`getAIProvider()`). Nothing above it imports the gateway SDK — swap provider by env var, not code.

## AI Router

`src/lib/ai/router.ts` is the single choke point for every AI call:

- `AITask` names the task, not the model: `campaign_analysis`, `content_ideas`, `script_generation`, `hook_generation`, `clip_detection`, `viral_analysis`, `caption_generation`, `analytics_analysis`, `content_optimization`, `content_planning`, `general`.
- `runAITask(task, options, deps)` resolves provider + model, times the call, records a request-log row, and rethrows a controlled `AIError`.
- Today every task resolves to the one configured model. The task→model seam exists so tasks can later tier onto FAST/SMART/DEEP models (`resolveModelForTask`); see the `ponytail:` note in `router.ts`.

## Errors

All failures surface as `AIError` (in `src/lib/ai/errors.ts`) with a `kind` — never a raw vendor message, never key material. Mapping from the gateway/SDK:

| Kind | Source |
| --- | --- |
| `config` | missing env / missing model |
| `authentication` | HTTP 401 |
| `permission` | HTTP 403 |
| `rate_limit` | HTTP 429 |
| `invalid_model` | HTTP 400/404, `NoSuchModelError` |
| `server_error` | HTTP ≥ 500 |
| `validation` | zod schema mismatch (`TypeValidationError`, incl. when wrapped by `NoObjectGeneratedError`) |
| `invalid_response` | non-JSON body, no usable object |
| `timeout` | `AbortSignal.timeout` / network timeout |
| `unknown` | anything else |

`AIError` carries a `safeMessage` for the UI; server actions catch it and pass `safeMessage` up. The "never leaks `ht-…`" case is covered by a unit test.

## Request logging

Every call is recorded best-effort in the `AIRequestLog` table (task, provider, model, success, `errorKind`, `durationMs`, `inputTokens`/`outputTokens`/`totalTokens`, `createdAt`). A logging failure never fails the AI call it records. Logging is skipped when `deps.skipLog` is set or `NODE_ENV === "test"`, so unit tests stay hermetic. Keys, headers, and prompt bodies are never stored.

## Health check

`GET /api/ai/health` reports `{ ok, provider, model, baseURL, gatewayConfigured, missingVars }` (200/503). It returns no secrets and does not ping the gateway — cheap and safe for monitoring.

## Structured outputs & context

Services return data validated by the Zod schemas in `src/lib/ai/schemas.ts` before it enters app state (`CampaignAnalysisSchema`, `ContentIdeasSchema`, …). Prompts live in `src/lib/ai/prompts/`, and `src/lib/ai/context.ts` builds lean context strings (`CampaignBrief`, `PriorAnalysisSummary`, `CreatorPerformance`) — the prompt sees selected fields, never whole DB objects or row dumps.

## Security boundaries

- `AI_GATEWAY_API_KEY` is read only in server code (`providers/hemat.ts`); nothing imports it into a client component. No secret appears in any API response or persisted log.
- The provider abstraction is the only seam to the gateway — server actions and UI never hold the key.

## Testing

Run all unit tests with `npm test` (Node's test runner over `tsx`). No real gateway call is made:

- `providers/hemat.test.ts` — a local fake gateway (in-process HTTP server) exercises healthy responses, every HTTP error→kind mapping, schema mismatch → `validation`, non-JSON → `invalid_response`, timeout, and key-leak prevention.
- `services.test.ts` — campaign analyzer + idea generator run end-to-end through the router against a stub provider (`skipLog`), proving plumbing and schema validity.
- `config.test.ts` — provider registry, env validation, and mock mode.

## Status

- Implemented: config, providers, router, error mapping, structured schemas, prompts/context, request logging, health check, mock mode.
- Structured output against the gateway is handled by preamble-tolerant JSON extraction (`extractJSONObject` in `hemat.ts`), not by `response_format` — the gateway strips JSON-mode requests. If an upstream model ever wraps its JSON in markdown fences or emits multiple objects, extend the extractor rather than reintroducing `generateObject`.
