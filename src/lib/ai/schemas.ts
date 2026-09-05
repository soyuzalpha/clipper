import { z } from "zod";
import { Platform, Difficulty } from "@/lib/constants";

// ─── Campaign Analysis ───────────────────────────────────────────────────────

/**
 * AI contract for a campaign read. Flat and list-shaped so the model answers
 * exactly the questions the product surfaces — no invented nesting.
 */
export const CampaignAnalysisSchema = z.object({
  summary: z.string(),
  /** Must-do / must-include constraints the brand set, as plain strings. */
  requirements: z.array(z.string()),
  /** Hard limits (topics, claims, format bans) the content must respect. */
  restrictions: z.array(z.string()),
  risks: z.array(z.string()),
  targetAudience: z.array(z.string()),
  contentAngles: z.array(z.string()),
  strategy: z.array(z.string()),
  opportunityScore: z.number().min(0).max(100),
});
export type CampaignAnalysis = z.infer<typeof CampaignAnalysisSchema>;

// ─── Content Ideas ───────────────────────────────────────────────────────────

/**
 * One content idea. `duration` is seconds; `structure` is an ordered list of
 * beats (persisted as an outline). `platform` is retained beyond the spec list
 * because each idea is produced for a specific target platform.
 */
export const ContentIdeaSchema = z.object({
  title: z.string(),
  hook: z.string(),
  angle: z.string(),
  audience: z.string(),
  format: z.string(),
  duration: z.number().int().positive(),
  structure: z.array(z.string()).min(1),
  cta: z.string(),
  platform: Platform,
  viralScore: z.number().min(0).max(100),
  difficulty: Difficulty,
});
export type GeneratedContentIdea = z.infer<typeof ContentIdeaSchema>;

export const ContentIdeasSchema = z.object({
  ideas: z.array(ContentIdeaSchema).min(1).max(10),
});
export type GeneratedContentIdeas = z.infer<typeof ContentIdeasSchema>;

// ─── Script ──────────────────────────────────────────────────────────────────

export const ScriptSchema = z.object({
  hook: z.string(),
  intro: z.string(),
  body: z.string(),
  payoff: z.string(),
  cta: z.string(),
});
export type GeneratedScript = z.infer<typeof ScriptSchema>;

// ─── Hooks ───────────────────────────────────────────────────────────────────

export const HooksSchema = z.object({
  hooks: z.array(z.string()).min(3).max(7),
});
export type GeneratedHooks = z.infer<typeof HooksSchema>;

// ─── Viral Score ─────────────────────────────────────────────────────────────

export const ViralScoreSchema = z.object({
  total: z.number().min(0).max(100),
  breakdown: z.object({
    hook: z.number().min(0).max(100),
    curiosity: z.number().min(0).max(100),
    emotionalImpact: z.number().min(0).max(100),
    novelty: z.number().min(0).max(100),
    pacing: z.number().min(0).max(100),
    retentionPotential: z.number().min(0).max(100),
    shareability: z.number().min(0).max(100),
    clarity: z.number().min(0).max(100),
    storytelling: z.number().min(0).max(100),
  }),
  whyItWorks: z.string(),
  whatCouldHurt: z.string(),
});
export type GeneratedViralScore = z.infer<typeof ViralScoreSchema>;

// ─── Analytics Patterns ──────────────────────────────────────────────────────

export const AnalyticsPatternsSchema = z.object({
  patterns: z.array(
    z.object({
      pattern: z.string(),
      evidence: z.string(),
      recommendation: z.string(),
    })
  ).min(1).max(8),
  winningFormats: z.array(z.string()),
  weakFormats: z.array(z.string()),
  nextOpportunities: z.array(z.string()),
});
export type GeneratedAnalyticsPatterns = z.infer<typeof AnalyticsPatternsSchema>;

// ─── Assistant ─────────────────────────────────────────────────────────────────

/**
 * Open-ended assistant chat reply. Free-form text is wrapped in a single
 * structured field so the reply rides the same schema-validated router path as
 * every other AI call.
 */
export const AssistantReplySchema = z.object({
  reply: z.string(),
});
export type AssistantReply = z.infer<typeof AssistantReplySchema>;