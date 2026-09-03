import type { CampaignAnalysis } from "../schemas";

/**
 * Realistic campaign analysis fixture. Deterministic and schema-valid so the
 * app works end-to-end without AI keys. Mirrors a tiered creator campaign
 * (reward tiers, strict requirements, short deadline).
 */
export const mockCampaignAnalysis: CampaignAnalysis = {
  summary:
    "High-reward launch campaign for the Divoom Ditoo Plus retro pixel display. Strong deadline-driven scarcity with a $500 top tier, but the must_do framing requirements are strict and the product is niche — reach wins depend on bold, format-specific hooks.",
  requirements: [
    {
      kind: "must_do",
      text: "Showcase the pixel screen displaying live clock, weather, or a music visualizer",
    },
    { kind: "must_do", text: "Highlight the programmable 16x16 pixel art feature in at least one segment" },
    { kind: "must_include", text: "Show the Ditoo Plus unboxing moment in the first 15 seconds" },
    { kind: "must_mention", text: "Mention that it doubles as a Bluetooth speaker" },
    { kind: "must_avoid", text: "No affiliate links in the first 30 seconds" },
    { kind: "submission", text: "Post between Feb 10 and Feb 17, 2026" },
    { kind: "reward_condition", text: "Top tier ($500) requires 50K+ organic views and 3%+ engagement" },
  ],
  risks: [
    "Niche product — hard to manufacture broad appeal; needs lifestyle framing not spec-sheet review",
    "Short 7-day window overlaps with Valentine's Day content surge",
    "Strict must_do list increases chance of disqualification if any requirement is missed",
    "Competition high: 200+ creators already enrolled in tier 2",
  ],
  strategy: {
    angle: "Retro-gadget ASMR meets productivity aesthetics — the display as a focus tool for deep work",
    audience: "18-30 TikTok/Reels creators who post desk-setup and study-with-me content",
    tone: "Warm, sensory, slightly playful — lean into the pixel glow and chiptune audio",
    hookDirection: "Open on the screen doing something surprising (visualizer reacting to audio) rather than unboxing",
    durationSec: 42,
    cta: "Which pixel screen mode should I try next? Drop your vote in the comments.",
    structure: "Hook (visualizer) → unboxing beat → feature tour → speaker reveal → CTA",
  },
  opportunityScore: {
    total: 74,
    breakdown: {
      reward: 72,
      deadline: 58,
      competition: 66,
      contentAvailability: 81,
      difficulty: 55,
      viralPotential: 68,
      creatorFit: 88,
    },
  },
};
