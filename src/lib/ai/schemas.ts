import { z } from "zod";
import { Platform, Difficulty, RequirementKind } from "@/lib/constants";

// ─── Campaign Analysis ───────────────────────────────────────────────────────

export const CampaignAnalysisSchema = z.object({
  summary: z.string(),
  requirements: z.array(
    z.object({
      kind: RequirementKind,
      text: z.string(),
    })
  ),
  risks: z.array(z.string()),
  strategy: z.object({
    angle: z.string(),
    audience: z.string(),
    tone: z.string(),
    hookDirection: z.string(),
    durationSec: z.number().int().positive(),
    cta: z.string(),
    structure: z.string(),
  }),
  opportunityScore: z.object({
    total: z.number().min(0).max(100),
    breakdown: z.object({
      reward: z.number().min(0).max(100),
      deadline: z.number().min(0).max(100),
      competition: z.number().min(0).max(100),
      contentAvailability: z.number().min(0).max(100),
      difficulty: z.number().min(0).max(100),
      viralPotential: z.number().min(0).max(100),
      creatorFit: z.number().min(0).max(100),
    }),
  }),
});
export type CampaignAnalysis = z.infer<typeof CampaignAnalysisSchema>;

// ─── Content Ideas ───────────────────────────────────────────────────────────

export const ContentIdeaSchema = z.object({
  title: z.string(),
  hook: z.string(),
  angle: z.string(),
  audience: z.string(),
  format: z.string(),
  durationSec: z.number().int().positive(),
  outline: z.string(),
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