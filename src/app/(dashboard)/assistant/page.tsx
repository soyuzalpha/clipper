"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { askAssistant } from "./actions";
import { Loader2, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "What should I work on next?",
  "How are my campaigns doing?",
  "Any ideas worth producing?",
  "What does analytics say?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi — I'm your Clipper OS assistant. Ask me about campaigns, ideas, clips, or what to do next.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"hemattoken" | "mock" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: clean }]);
    setInput("");
    setBusy(true);
    const result = await askAssistant(clean);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMode(result.provider);
    setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
  };

  return (
    <div className="flex h-full flex-col py-6">
      <PageHeader
        title="AI Assistant"
        description="Context-aware help grounded in your workspace data."
      />

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardContent
          ref={scrollRef}
          role="log"
          aria-live="polite"
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                m.role === "user"
                  ? "self-end bg-primary text-primary-foreground"
                  : "self-start bg-muted text-foreground"
              )}
            >
              {m.content}
            </div>
          ))}
          {busy ? (
            <div className="flex items-center gap-2 self-start text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Thinking…
            </div>
          ) : null}
          {error ? <p className="self-center text-sm text-destructive">{error}</p> : null}
        </CardContent>

        {messages.length <= 1 && !busy ? (
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            {STARTERS.map((s) => (
              <Button
                key={s}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => send(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        ) : null}
      </Card>

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor="assistant-input" className="sr-only">
          Ask the assistant
        </label>
        <input
          id="assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your campaigns, ideas, or clips…"
          disabled={busy}
          className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
        />
        <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send">
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        </Button>
      </form>
      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <Sparkles className="size-3" aria-hidden />
        {mode === "mock"
          ? "Mock assistant — no API keys needed. Replies are rule-based from your data."
          : mode === "hemattoken"
            ? "Live — answered by your AI gateway from workspace data."
            : "Answers are drawn from your workspace data."}
      </p>
    </div>
  );
}
