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
    "Showcase the pixel screen displaying live clock, weather, or a music visualizer",
    "Highlight the programmable 16x16 pixel art feature in at least one segment",
    "Show the Ditoo Plus unboxing moment in the first 15 seconds",
    "Mention that it doubles as a Bluetooth speaker",
    "Post between Feb 10 and Feb 17, 2026",
    "Top tier ($500) requires 50K+ organic views and 3%+ engagement",
  ],
  restrictions: [
    "No affiliate links in the first 30 seconds",
    "No competitor products visible on camera",
    "Do not claim battery life specs not provided in the brief",
  ],
  risks: [
    "Niche product — hard to manufacture broad appeal; needs lifestyle framing not spec-sheet review",
    "Short 7-day window overlaps with Valentine's Day content surge",
    "Strict must_do list increases chance of disqualification if any requirement is missed",
    "Competition high: 200+ creators already enrolled in tier 2",
  ],
  targetAudience: [
    "18-30 TikTok/Reels creators posting desk-setup and study-with-me content",
    "Retro-tech and pixel-art hobbyists who follow the Ditoo community",
  ],
  contentAngles: [
    "Retro-gadget ASMR meets productivity aesthetics — the display as a focus tool",
    "Pixel-art challenge content showing the programmable screen",
    "Desk-setup glow-up with the display as the centerpiece",
  ],
  strategy: [
    "Open on the screen doing something surprising (visualizer reacting to audio) rather than unboxing",
    "Warm, sensory, slightly playful tone — lean into the pixel glow and chiptune audio",
    "42-second runtime keeps retention inside the reward window",
    "End with a comment-bait CTA asking viewers to vote on the next pixel mode",
  ],
  opportunityScore: 74,
};
