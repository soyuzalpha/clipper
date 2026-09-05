"use server";

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getAIConfigStatus } from "@/lib/ai/config";
import { askAIAssistant } from "@/lib/ai/services/assistant";
import { AIError } from "@/lib/ai/errors";

export type AssistantActionResult =
  | { ok: true; reply: string; provider: "hemattoken" | "mock" }
  | { ok: false; error: string };

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Answer one assistant question. When the AI gateway is configured the question
 * is answered by a real model grounded in the workspace context below;
 * otherwise a deterministic rule-based reply keeps the chat useful with zero
 * keys (the app's established fallback).
 */
export async function askAssistant(
  prompt: string,
  context?: string
): Promise<AssistantActionResult> {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const clean = prompt.trim();
  if (!clean) {
    return { ok: false, error: "Ask me something first." };
  }

  const workspace = await prisma.workspace.findFirstOrThrow();
  const q = clean.toLowerCase();

  const [openCampaigns, topCampaign, ideas, plans, clips] = await Promise.all([
    prisma.campaign.count({ where: { workspaceId: workspace.id, status: { in: ["open", "in_progress"] } } }),
    prisma.campaign.findFirst({
      where: { workspaceId: workspace.id },
      orderBy: { opportunityScore: "desc" },
      select: { name: true, opportunityScore: true },
    }),
    prisma.contentIdea.count({ where: { workspaceId: workspace.id } }),
    prisma.contentPlan.count({ where: { workspaceId: workspace.id } }),
    prisma.clip.count({ where: { video: { workspaceId: workspace.id } } }),
  ]);

  if (getAIConfigStatus().gatewayConfigured) {
    const workspaceContext = [
      `Workspace: ${workspace.name}`,
      `Open campaigns: ${openCampaigns}`,
      topCampaign
        ? `Top campaign: "${topCampaign.name}" (opportunity score ${topCampaign.opportunityScore ?? "n/a"})`
        : null,
      `Content ideas: ${ideas}`,
      `Content plans: ${plans}`,
      `Detected clips: ${clips}`,
      context ? `Current page: ${context}` : null,
    ]
      .filter((x): x is string => Boolean(x))
      .join("\n");

    try {
      const { reply } = await askAIAssistant({
        question: clean,
        workspaceContext,
      });
      return { ok: true, reply, provider: "hemattoken" };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof AIError ? error.safeMessage : "The assistant failed unexpectedly.",
      };
    }
  }

  await delay(600);

  let reply: string;
  if (/(hi|hello|hey)\b/.test(q) && q.length < 20) {
    reply = `Hey! I'm your Clipper OS assistant. Ask me about your campaigns, ideas, clips, or what to do next in ${workspace.name}.`;
  } else if (/(campaign|opportunit|reward)/.test(q)) {
    reply =
      topCampaign
        ? `You have ${openCampaigns} active campaign${openCampaigns === 1 ? "" : "s"} right now. Your highest-signal one is “${topCampaign.name}” (opportunity score ${topCampaign.opportunityScore ?? "n/a"}). Want me to suggest next steps on it?`
        : `No open campaigns right now in ${workspace.name}. Add one from the Campaigns page and I can help you break it down.`;
  } else if (/(idea|content|hook|script)/.test(q)) {
    reply = `You have ${ideas} content idea${ideas === 1 ? "" : "s"} in the pipeline. Each is attached to a campaign with a hook and angle — open an idea to generate a script from it.`;
  } else if (/(clip|video|find the best)/.test(q)) {
    reply = `${clips} clip${clips === 1 ? "" : "s"} are detected across your source videos. Import a long-form video in Clip Maker and I'll rank the moments worth posting.`;
  } else if (/(analytics|performance|views|engagement)/.test(q)) {
    reply = `The Analytics page rolls up your publications' latest snapshots — views, engagement mix, and per-platform share. Check there for what's resonating.`;
  } else if (/(plan|schedule|calendar|next)/.test(q)) {
    reply = `You have ${plans} plan${plans === 1 ? "" : "s"} on the calendar. Head to the Planner to schedule the next idea.`;
  } else if (context && q.includes("page")) {
    reply = `Looking at ${context}. Everything on this page is live from your workspace data.`;
  } else {
    reply = `I can help you steer ${workspace.name}: try asking about your campaigns, content ideas, clips, analytics, or planning.`;
  }

  return { ok: true, reply, provider: "mock" };
}
