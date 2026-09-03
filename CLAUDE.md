# AI Content OS - Project Instructions

## Product

This project is an AI-powered Content Operating System for clipper creators.

Core workflow:

Campaign
→ Analysis
→ Strategy
→ Ideas
→ Planning
→ Production
→ Clip Maker
→ Publishing
→ Analytics
→ Optimization

The product should help creators create the right content, for the right campaign, at the right time, based on evidence.

---

## Development Principles

- Build production-quality code.
- Inspect the existing codebase before making changes.
- Reuse existing components and utilities whenever possible.
- Do not rewrite working code unnecessarily.
- Keep business logic separate from UI.
- Use strict TypeScript.
- Prefer small, reusable components.
- Avoid unnecessary dependencies.
- Keep external integrations behind service abstractions.
- Use mock providers when real integrations are unavailable.
- Every feature should have loading, empty, error, and success states.
- Maintain responsive behavior.
- Maintain accessibility.
- Run typecheck and lint after meaningful implementation changes.

---

## AI Principles

AI is a contextual copilot, not just a chatbot.

Prefer contextual actions such as:

- Analyze Campaign
- Generate Ideas
- Generate Hooks
- Improve Script
- Find Best Clips
- Explain Performance
- Optimize Content
- Plan Next Week

AI services must use structured input/output whenever possible.

Do not hardcode the application to a single AI provider.

Use an abstraction such as:

AIProvider
├── OpenAIProvider
├── AnthropicProvider
├── GeminiProvider
└── CustomProvider

---

## Core AI Services

- CampaignAnalyzer
- ContentIdeaGenerator
- ScriptGenerator
- HookGenerator
- ClipDetector
- ViralScoreAnalyzer
- CaptionGenerator
- ContentOptimizer
- AnalyticsAnalyzer
- ContentPlanner

---

## UX Direction

The product should feel like a premium modern SaaS application.

Design references:

- Linear
- Vercel
- Notion
- Raycast
- modern AI developer tools

Prioritize:

- clarity
- speed
- information density
- excellent typography
- subtle borders
- restrained colors
- dark mode
- keyboard navigation
- contextual AI actions
- polished interactions

Avoid:

- generic admin dashboards
- excessive gradients
- giant decorative cards
- meaningless charts
- excessive illustrations
- UI that exists only for decoration

The dashboard should answer:

"What should I do next?"

---

## Technical Preferences

Preferred stack:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide
- PostgreSQL
- Prisma or Drizzle
- React Hook Form
- Zod
- Zustand / React Query where appropriate

Follow the existing project stack if the repository already has established choices.

Do not replace existing technologies without a strong reason.

---

## Product Architecture

Core entities:

- User
- Workspace
- Campaign
- CampaignRequirement
- ContentIdea
- ContentPlan
- Content
- Video
- Clip
- Script
- Asset
- Publication
- Platform
- Analytics
- AnalyticsSnapshot
- AIRecommendation
- AIAnalysis
- Tag

Core relationship:

Campaign
→ Content Ideas
→ Content
→ Clip
→ Publication
→ Analytics
→ AI Optimization

---

## MVP

The MVP should contain:

1. Dashboard
2. Campaign Management
3. Campaign AI Analyzer
4. Content Idea Generator
5. Content Planner
6. Production Workspace
7. Content Library
8. Analytics Dashboard
9. AI Assistant
10. Mock Clip Maker

Real video processing can initially be mocked.

The architecture must remain ready for:

- transcription
- video ingestion
- AI clip detection
- subtitle generation
- automatic reframing
- browser video editing
- social publishing
- analytics integrations

---

## Implementation Rules

Before implementing a feature:

1. Read CLAUDE.md.
2. Read the relevant documentation in docs/.
3. Inspect the existing codebase.
4. Identify reusable components.
5. Create or update the implementation plan.
6. Implement the smallest coherent unit.
7. Run typecheck/lint.
8. Fix issues.
9. Review the result against the product requirements.

Do not implement future functionality prematurely.

Keep the architecture extensible without over-engineering the MVP.
