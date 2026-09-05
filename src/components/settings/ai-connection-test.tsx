"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PlugZap, CheckCircle2, XCircle } from "lucide-react";
import { testAIConnection } from "@/app/(dashboard)/settings/actions";

type TestState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "success"; model?: string; latencyMs?: number }
  | { status: "error"; message: string };

export function AIConnectionTest() {
  const [state, setState] = useState<TestState>({ status: "idle" });

  const run = async () => {
    setState({ status: "running" });
    const result = await testAIConnection();
    if (result.ok) {
      setState({ status: "success", model: result.model, latencyMs: result.latencyMs });
    } else {
      setState({ status: "error", message: result.error });
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={run}
        disabled={state.status === "running"}
      >
        {state.status === "running" ? (
          <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden />
        ) : (
          <PlugZap className="mr-2 size-3.5" aria-hidden />
        )}
        Test AI connection
      </Button>

      {state.status === "success" ? (
        <p className="flex items-center gap-1.5 text-xs text-emerald-600">
          <CheckCircle2 className="size-3.5" aria-hidden />
          Connected{state.model ? ` — ${state.model}` : ""}
          {state.latencyMs != null ? ` in ${state.latencyMs} ms` : ""}.
        </p>
      ) : null}

      {state.status === "error" ? (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <XCircle className="size-3.5" aria-hidden />
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
