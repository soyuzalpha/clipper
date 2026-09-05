import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { z } from "zod";
import { HematTokenProvider } from "@/lib/ai/providers/hemat";
import { AIError } from "@/lib/ai/errors";

const ProbeSchema = z.object({ summary: z.string(), score: z.number() });

type Handler = (req: IncomingMessage, res: ServerResponse, body: string) => void;

/** Start a fake gateway. Returns baseURL + close(). */
async function startGateway(handler: Handler): Promise<{ baseURL: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => handler(req, res, body));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseURL: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      }),
  };
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(data));
}

function okCompletion(content: string) {
  return {
    id: "chatcmpl-1",
    object: "chat.completion",
    created: 1,
    model: "m",
    choices: [
      { index: 0, message: { role: "assistant", content }, finish_reason: "stop" },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  };
}

function provider(baseURL: string) {
  return new HematTokenProvider({
    baseURL,
    apiKey: "ht-test-key",
    model: "openai/gpt-5.2",
    timeoutMs: 2000,
    maxRetries: 0,
  });
}

test("HematTokenProvider: returns schema-validated data + usage on a healthy gateway", async () => {
  const gw = await startGateway((_req, res) =>
    json(res, 200, okCompletion(JSON.stringify({ summary: "hi", score: 5 })))
  );
  try {
    const result = await provider(gw.baseURL).generate({
      schema: ProbeSchema,
      schemaName: "Probe",
      system: "sys",
      prompt: "probe",
    });
    assert.deepEqual(result.data, { summary: "hi", score: 5 });
    assert.deepEqual(result.usage, {
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15,
    });
  } finally {
    await gw.close();
  }
});

test("HematTokenProvider: missing gateway settings throws controlled config error", async () => {
  const p = new HematTokenProvider({}); // overrides given but empty
  await assert.rejects(
    () =>
      p.generate({
        schema: ProbeSchema,
        schemaName: "Probe",
        system: "s",
        prompt: "p",
      }),
    (e) => e instanceof AIError && e.kind === "config"
  );
});

test("HematTokenProvider: 401 maps to authentication", async () => {
  const gw = await startGateway((_req, res) =>
    json(res, 401, { error: { message: "invalid api key", type: "invalid_request_error" } })
  );
  try {
    await assert.rejects(
      () =>
        provider(gw.baseURL).generate({
          schema: ProbeSchema,
          schemaName: "Probe",
          system: "s",
          prompt: "p",
        }),
      (e) => e instanceof AIError && e.kind === "authentication"
    );
  } finally {
    await gw.close();
  }
});

test("HematTokenProvider: 403 maps to permission", async () => {
  const gw = await startGateway((_req, res) =>
    json(res, 403, { error: { message: "forbidden" } })
  );
  try {
    await assert.rejects(
      () =>
        provider(gw.baseURL).generate({
          schema: ProbeSchema,
          schemaName: "Probe",
          system: "s",
          prompt: "p",
        }),
      (e) => e instanceof AIError && e.kind === "permission"
    );
  } finally {
    await gw.close();
  }
});

test("HematTokenProvider: 429 maps to rate_limit", async () => {
  const gw = await startGateway((_req, res) =>
    json(res, 429, { error: { message: "rate limited" } })
  );
  try {
    await assert.rejects(
      () =>
        provider(gw.baseURL).generate({
          schema: ProbeSchema,
          schemaName: "Probe",
          system: "s",
          prompt: "p",
        }),
      (e) => e instanceof AIError && e.kind === "rate_limit"
    );
  } finally {
    await gw.close();
  }
});

test("HematTokenProvider: 400 maps to invalid_model", async () => {
  const gw = await startGateway((_req, res) =>
    json(res, 400, { error: { message: "unknown model 'nope'" } })
  );
  try {
    await assert.rejects(
      () =>
        provider(gw.baseURL).generate({
          schema: ProbeSchema,
          schemaName: "Probe",
          system: "s",
          prompt: "p",
        }),
      (e) => e instanceof AIError && e.kind === "invalid_model"
    );
  } finally {
    await gw.close();
  }
});

test("HematTokenProvider: 5xx maps to server_error", async () => {
  const gw = await startGateway((_req, res) =>
    json(res, 500, { error: { message: "boom" } })
  );
  try {
    await assert.rejects(
      () =>
        provider(gw.baseURL).generate({
          schema: ProbeSchema,
          schemaName: "Probe",
          system: "s",
          prompt: "p",
        }),
      (e) => e instanceof AIError && e.kind === "server_error"
    );
  } finally {
    await gw.close();
  }
});

test("HematTokenProvider: gateway timeout maps to timeout", async () => {
  const gw = await startGateway((_req, res) => {
    // Never respond — the provider's abortSignal should fire first.
    setTimeout(() => json(res, 200, okCompletion("{}")), 10_000);
  });
  try {
    const slow = new HematTokenProvider({
      baseURL: gw.baseURL,
      apiKey: "ht-test-key",
      model: "openai/gpt-5.2",
      timeoutMs: 150,
      maxRetries: 0,
    });
    await assert.rejects(
      () =>
        slow.generate({
          schema: ProbeSchema,
          schemaName: "Probe",
          system: "s",
          prompt: "p",
        }),
      (e) => e instanceof AIError && e.kind === "timeout"
    );
  } finally {
    await gw.close();
  }
});

test("HematTokenProvider: schema-mismatched JSON maps to validation", async () => {
  const gw = await startGateway((_req, res) =>
    json(res, 200, okCompletion(JSON.stringify({ wrong: "shape" })))
  );
  try {
    await assert.rejects(
      () =>
        provider(gw.baseURL).generate({
          schema: ProbeSchema,
          schemaName: "Probe",
          system: "s",
          prompt: "p",
        }),
      (e) => e instanceof AIError && e.kind === "validation"
    );
  } finally {
    await gw.close();
  }
});

test("HematTokenProvider: non-JSON body maps to invalid_response", async () => {
  const gw = await startGateway((_req, res) =>
    json(res, 200, okCompletion("definitely not json"))
  );
  try {
    await assert.rejects(
      () =>
        provider(gw.baseURL).generate({
          schema: ProbeSchema,
          schemaName: "Probe",
          system: "s",
          prompt: "p",
        }),
      (e) => e instanceof AIError && e.kind === "invalid_response"
    );
  } finally {
    await gw.close();
  }
});

test("HematTokenProvider: never leaks key material into the safe message", async () => {
  const gw = await startGateway((_req, res) =>
    json(res, 401, { error: { message: "ht-abcdef is invalid" } })
  );
  try {
    await assert.rejects(
      () =>
        provider(gw.baseURL).generate({
          schema: ProbeSchema,
          schemaName: "Probe",
          system: "s",
          prompt: "p",
        }),
      (e) => {
        assert.ok(e instanceof AIError);
        assert.ok(!e.message.includes("ht-"));
        return true;
      }
    );
  } finally {
    await gw.close();
  }
});
