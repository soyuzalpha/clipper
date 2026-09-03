import type { GenerateOptions, AIProvider } from "../provider";
import type {
  GeneratedContentIdeas,
  GeneratedScript,
  GeneratedHooks,
  GeneratedViralScore,
  GeneratedAnalyticsPatterns,
} from "../schemas";
import { mockCampaignAnalysis } from "./mock-data";

/**
 * Zero-config mock provider. Returns deterministic, schema-valid mock data
 * with just enough variance to feel alive. Works without any API keys so the
 * app is fully functional in any environment.
 */
export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async generate<T>(options: GenerateOptions<T>): Promise<T> {
    const { schemaName } = options;
    const data = this.mockFor(schemaName);
    // z.infer already validated the shape at build time; we trust the mock
    // data matches the schema. A runtime parse would be safer but adds overhead.
    return data as unknown as T;
  }

  private mockFor(schemaName?: string): unknown {
    switch (schemaName) {
      case "CampaignAnalysis":
        return mockCampaignAnalysis;
      case "ContentIdeas":
        return mockContentIdeas;
      case "Script":
        return mockScript;
      case "Hooks":
        return mockHooks;
      case "ViralScore":
        return mockViralScore;
      case "AnalyticsPatterns":
        return mockAnalyticsPatterns;
      default:
        return { summary: "This is a mock response.", risks: [], requirements: [] };
    }
  }
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const mockContentIdeas: GeneratedContentIdeas = {
  ideas: [
    {
      title: "The One Secret Your Competitors Don't Want You to Know",
      hook: "Stop wasting hours on content that doesn't convert — here's the exact 3-step hook formula that got my last video 2M views in 48 hours.",
      angle: "Competitive advantage through contrarian positioning",
      audience: "TikTok creators 18-30, intermediate level",
      format: "Hook → Problem → Solution → CTA",
      durationSec: 45,
      outline: "1) Tease the secret 0-5s, 2) Show the problem 5-15s, 3) Reveal the formula 15-35s, 4) CTA 35-45s",
      cta: "Save this video — it's your shortcut to viral hooks.",
      platform: "tiktok",
      viralScore: 87,
      difficulty: "easy",
    },
    {
      title: "Why Your Hooks Die in the First 3 Seconds",
      hook: "Your hook isn't failing because it's bad — it's failing because you're not hooking the right brain hemisphere. Here's neuroscience-backed proof.",
      angle: "Science-backed content strategy",
      audience: "YouTube Shorts creators 20-35",
      format: "Story → Evidence → Application → CTA",
      durationSec: 52,
      outline: "1) Hook with surprising stat, 2) Explain the science, 3) Show real example, 4) Challenge viewer",
      cta: "Comment your biggest hook struggle below.",
      platform: "youtube_shorts",
      viralScore: 76,
      difficulty: "medium",
    },
    {
      title: "The Algorithm Gave Me 500K Followers (Here's What Changed)",
      hook: "I went from shadowbanned to 500K followers in 3 weeks. The 2 things I stopped doing are probably killing your growth too.",
      angle: "Personal transformation story with replicable steps",
      audience: "Instagram Reels creators, growth-focused",
      format: "Before → Crisis → Solution → Results",
      durationSec: 60,
      outline: "1) Before state hook, 2) The crisis moment, 3) The pivot, 4) Before/after data",
      cta: "Which tactic are you doing wrong? Drop a comment.",
      platform: "instagram_reels",
      viralScore: 92,
      difficulty: "easy",
    },
  ],
};

const mockScript: GeneratedScript = {
  hook: "Here's why 95% of creators never break through — and how you're probably sabotaging yourself without knowing it.",
  intro: "If you're watching this and you've been posting consistently for 6+ months with no growth, this one's for you.",
  body: "The algorithm isn't broken — you're optimizing for the wrong metric. Most creators chase views instead of engagement depth. The fix is counterintuitive but it works every time.",
  payoff: "Flip your hook-to-CTA ratio. Keep them engaged, not entertained. Then watch your retention soar.",
  cta: "Save this before you post your next video — it's your retention cheat code.",
};

const mockHooks: GeneratedHooks = {
  hooks: [
    "I tested 10 different hooks in 24 hours — only 3 broke past 100K views.",
    "Your competitors are stealing your ideas — here's how to make them uncopyable.",
    "Stop posting at optimal times — start posting when your audience's brains are primed.",
    "The engagement hack nobody talks about: it's not what you say, it's what you don't say.",
    "I reverse-engineered the top 0.1% creator's hooks — here's the pattern they all use.",
    "Your hook dies in 0.3 seconds. Here's the exact word count that forces a pause.",
    "Why your hooks work for everyone else but not your audience (it's the algorithm, not you).",
  ],
};

const mockViralScore: GeneratedViralScore = {
  total: 78,
  breakdown: {
    hook: 85,
    curiosity: 72,
    emotionalImpact: 68,
    novelty: 65,
    pacing: 80,
    retentionPotential: 75,
    shareability: 70,
    clarity: 82,
    storytelling: 74,
  },
  whyItWorks: "Strong hook with curiosity gap. The brain teaser format triggers cognitive dissonance.",
  whatCouldHurt: "Novelty is below 70 — the brain teaser is a known format. Add a specific personal story.",
};

const mockAnalyticsPatterns: GeneratedAnalyticsPatterns = {
  patterns: [
    {
      pattern: "Clips with hooks mentioning 'secret' or 'hidden' avg 47% higher CTR",
      evidence: "12 of last 20 top-performing clips used these words in first 3 seconds",
      recommendation: "Incorporate scarcity language into all hook variants",
    },
    {
      pattern: "Videos posted 9-11 AM local time see 32% higher completion rates",
      evidence: "Completion rate drops to 58% when posted outside this window",
      recommendation: "Schedule production clips within this time slot",
    },
  ],
  winningFormats: ["Hook + Stat → Personal Story → 3-Step Formula", "Problem → Pain Amplification → Quick Fix"],
  weakFormats: ["Listicles without personal anecdote", "Reaction content without commentary"],
  nextOpportunities: [
    "Test 'secret' hook formula on 3 clips this week",
    "Schedule 2 videos in the 9-11 AM window",
    "Add personal story to all listicle hooks",
  ],
};
