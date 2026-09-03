import { z } from "zod";

// Enums as Zod unions — SQLite has no native enum type.
// These enforce valid values at the application boundary (API routes, forms).

export const CampaignStatus = z.enum([
  "draft",
  "open",
  "in_progress",
  "content_created",
  "submitted",
  "approved",
  "rejected",
  "completed",
]);
export type CampaignStatus = z.infer<typeof CampaignStatus>;

export const IdeaStatus = z.enum([
  "idea",
  "selected",
  "scripted",
  "production",
  "editing",
  "ready",
  "published",
  "archived",
]);
export type IdeaStatus = z.infer<typeof IdeaStatus>;

export const PlanStatus = z.enum([
  "planned",
  "in_production",
  "ready",
  "published",
  "missed",
]);
export type PlanStatus = z.infer<typeof PlanStatus>;

export const PublicationStatus = z.enum(["scheduled", "published", "failed"]);
export type PublicationStatus = z.infer<typeof PublicationStatus>;

export const Platform = z.enum(["tiktok", "instagram_reels", "youtube_shorts"]);
export type Platform = z.infer<typeof Platform>;

export const ContentType = z.enum([
  "video",
  "clip",
  "thumbnail",
  "script",
  "caption",
  "image",
  "audio",
  "document",
]);
export type ContentType = z.infer<typeof ContentType>;

export const ClipStatus = z.enum(["detected", "exported", "published"]);
export type ClipStatus = z.infer<typeof ClipStatus>;

export const VideoStatus = z.enum(["imported", "processing", "ready"]);
export type VideoStatus = z.infer<typeof VideoStatus>;

export const ContentStatus = z.enum(["draft", "editing", "ready", "published"]);
export type ContentStatus = z.infer<typeof ContentStatus>;

export const RequirementKind = z.enum([
  "must_do",
  "must_include",
  "must_mention",
  "must_avoid",
  "submission",
  "reward_condition",
]);
export type RequirementKind = z.infer<typeof RequirementKind>;

export const Difficulty = z.enum(["easy", "medium", "hard"]);
export type Difficulty = z.infer<typeof Difficulty>;

export const RecommendationKind = z.enum([
  "hook",
  "publishing",
  "format",
  "campaign",
  "performance",
]);
export type RecommendationKind = z.infer<typeof RecommendationKind>;

export const RecommendationStatus = z.enum(["new", "accepted", "dismissed"]);
export type RecommendationStatus = z.infer<typeof RecommendationStatus>;

export const AnalysisSubject = z.enum(["campaign", "idea", "clip", "analytics"]);
export type AnalysisSubject = z.infer<typeof AnalysisSubject>;

export const AnalysisKind = z.enum([
  "campaign_analysis",
  "viral_score",
  "analytics_patterns",
]);
export type AnalysisKind = z.infer<typeof AnalysisKind>;