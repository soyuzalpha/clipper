# Implementation Plan

**Based on codebase inspection 2026-09-03. Update this document when architecture decisions are made.**

---

## 1. Current Project Architecture

Clean slate. A pristine [Create Next App](https://nextjs.org/blog/create-next-app) scaffold using Next.js 16.3.4 (App Router, React canary).

```
/
├── docs/                      # PRD, architecture, roadmap, AI system docs
├── public/                   # Static assets (stock SVGs)
├── src/app/                  # Next.js App Router root
│   ├── favicon.ico
│   ├── globals.css           # Tailwind v4 + CSS variables, dark mode
│   ├── layout.tsx           # Root layout (Geist font, antialiased, flex body)
│   └── page.tsx             # Stock landing page (placeholder)
├── .gitignore
├── .git/
├── .next/                    # Build output (gitignored)
├── AGENTS.md
├── CLAUDE.md
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
└── tsconfig.json
```

**Next.js 16.3.4 notes** (beyond training data):

- `params` in route handlers is now `Promise<{ ... }>` — must `await`
- `RouteContext<'/path'>` helper for typed route handler params
- `LayoutProps<T>` for typed layout/searchParams props
- Route handlers return `Response.json()` (Web standard), not `NextResponse`
- App Router default; React canary (React 19) built-in

---

## 2. Existing Reusable Components

**None.** No components directory. No UI library. No shared utilities.

The stock `page.tsx` has inline Tailwind utility classes — pattern to reuse (colocate small components in the same file if truly single-use, extract when reused).

---

## 3. Existing Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.3.4 | Framework |
| `react` | 19.2.8 | UI |
| `react-dom` | 19.2.8 | UI |
| `tailwindcss` | ^4 | Styling |
| `@tailwindcss/postcss` | ^4 | Tailwind v4 PostCSS plugin |
| `typescript` | ^5 | Type safety |
| `eslint` | ^9 | Linting |
| `eslint-config-next` | 16.3.4 | ESLint rules |

**Nothing else.** No UI component library, no state management, no validation, no AI SDK, no database, no ORM, no icons, no dates, no forms, no HTTP client.

---

## 4. Existing Routes/Pages

Only one route: `/` → `src/app/page.tsx`. A stock "To get started, edit the page.tsx file" landing page.

**No other routes exist.**

---

## 5. Existing Design System

Tailwind CSS v4 (CSS-first configuration, `@theme` block in `globals.css`).

**Current tokens:**

```css
/* globals.css */
:root {
  --background: #ffffff;
  --foreground: #171717;
}
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

Geist Sans + Geist Mono fonts loaded via `next/font/google`. Minimal — white/black with CSS variable theming and `dark:` variants.

**Target design direction** (from CLAUDE.md):

- Linear, Vercel, Notion, Raycast aesthetic
- Dark mode by default
- Premium feel: subtle borders, restrained colors, excellent typography
- Information-dense but clear
- Keyboard navigation
- Minimal decoration, no generic dashboard look

**No shadcn/ui installed.** Per CLAUDE.md, shadcn/ui is the preferred component library — must be added and components initialized.

---

## 6. Existing State Management

**None.** No Zustand, no React Query, no Jotai, no Context providers, no localStorage persistence.

---

## 7. Existing API / Backend Structure

**None.** No API routes, no server actions, no service layer.

---

## 8. Existing Database Structure

**None.** No Prisma, no Drizzle, no database config, no `.env` file.

---

## 9. What Can Be Reused

| Category | What Exists | What Can Be Reused |
|---|---|---|
| Styling foundation | Tailwind v4 + `@theme` block | CSS variable tokens, dark mode, font setup |
| Fonts | Geist Sans + Geist Mono via `next/font` | Keep or swap for Inter/PK (per shadcn defaults) |
| Dark mode | CSS `prefers-color-scheme` | Extend with class-based toggle later |
| TypeScript config | `@/*` path alias, strict mode | Keep as-is |
| ESLint | `eslint-config-next` (core-web-vitals + typescript) | Keep as-is |
| File conventions | Next.js App Router structure | `layout.tsx`, `page.tsx`, `route.ts`, `loading.tsx`, `error.tsx` patterns |
| `LayoutProps<T>` | Used in root layout | Pattern for typed layout props |
| Route handlers | `Response.json()` + `Promise<params>` | Standard for API routes |
| Product docs | Full PRD, architecture, roadmap, AI system | Reference for all decisions |

---

## 10. What Needs to Be Created

### Infrastructure
- [ ] **Install all dependencies**: shadcn/ui, Lucide, Zustand, React Query, React Hook Form, Zod, AI SDK (OpenAI + Anthropic + mock), Prisma/Drizzle, SQLite for local dev, uuid, date-fns
- [ ] **Initialize shadcn/ui** with defaults (dark mode, CSS variables, Inter font)
- [ ] **Configure Tailwind v4 + shadcn** integration (existing `@import "tailwindcss"` needs `@source "../.."` for shadcn)
- [ ] **Set up Prisma** with SQLite (`dev.db`) for local dev; define schema from entities in CLAUDE.md
- [ ] **Create `.env.example`** documenting required env vars (AI API keys, DATABASE_URL)
- [ ] **Set up shadcn theme** aligned with Linear/Vercel aesthetic (zinc or slate palette, no blue/purple gradients)

### AI Layer
- [ ] **`src/lib/ai/providers/`**: `AIProvider` interface + `MockAIProvider` + `OpenAIProvider` + `AnthropicProvider`
- [ ] **`src/lib/ai/services/`**: `CampaignAnalyzer`, `ContentIdeaGenerator`, `ScriptGenerator`, `HookGenerator`, `ViralScoreAnalyzer`, `CaptionGenerator`, `ContentOptimizer`, `AnalyticsAnalyzer`, `ContentPlanner` — each with typed input/output and provider independence
- [ ] **`src/lib/ai/schemas/`**: Zod schemas for all AI input/output types
- [ ] **Mock data fixtures** — realistic campaigns, ideas, clips, analytics for UI demo without AI keys

### Core Domain
- [ ] **`src/lib/db/`**: Prisma client singleton
- [ ] **`src/lib/validators/`**: Zod schemas for all domain entities
- [ ] **`src/lib/types/`**: TypeScript types mirroring Prisma schema + derived types
- [ ] **AI provider abstraction** (see above)

### Layout & Navigation
- [ ] **`src/app/(dashboard)/layout.tsx`**: Shell with sidebar nav, top bar, dark mode
- [ ] **`src/components/layout/`**: `Sidebar`, `TopBar`, `CommandMenu` (Raycast-style)
- [ ] **Navigation routes**: Overview, Campaigns, Content Ideas, Planner, Production, Clip Maker, Content Library, Analytics, AI Assistant, Settings
- [ ] **Root layout update**: remove stock styling, add font/scss, metadata, favicon

### Pages (App Router, each with loading/error/empty states)
- [ ] **`/` (Overview)**: Dashboard — "Today's Priorities", campaign opportunities, quick actions
- [ ] **`/campaigns`**: List/create/manage campaigns; status workflow
- [ ] **`/campaigns/[id]`**: Campaign detail + AI analyzer panel
- [ ] **`/campaigns/[id]/ideas`**: Content ideas for a campaign
- [ ] **`/ideas`**: All content ideas across campaigns
- [ ] **`/planner`**: Calendar + board view; AI scheduling recommendations
- [ ] **`/production`**: Production workspace per idea (script, hooks, requirements, clips)
- [ ] **`/clips`**: Clip maker — mock input (YouTube URL → fake clip detection)
- [ ] **`/library`**: Content library — folders, tags, search, filters, favorites
- [ ] **`/analytics`**: Performance dashboard — views, engagement, retention, platform breakdown
- [ ] **`/assistant`**: Global AI assistant — contextual (uses current page's data)
- [ ] **`/settings`**: API keys, preferences, workspace settings

### API Routes (Next.js Route Handlers)
- [ ] **`/api/campaigns`**: CRUD
- [ ] **`/api/campaigns/[id]/analyze`**: Campaign analysis AI endpoint
- [ ] **`/api/ideas`**: CRUD + AI generation
- [ ] **`/api/ideas/[id]/generate-script`**: Script generation
- [ ] **`/api/ideas/[id]/generate-hooks`**: Hook generation
- [ ] **`/api/plan`**: Content planner endpoints
- [ ] **`/api/clips`**: Clip CRUD + mock clip detection
- [ ] **`/api/library`**: Asset management
- [ ] **`/api/analytics`**: Analytics endpoints
- [ ] **`/api/ai/*`**: AI service proxies (with structured I/O)
- [ ] **`/api/assistant`**: Chat endpoint with context injection

### State Management
- [ ] **React Query** for server state (campaigns, ideas, analytics) — TanStack Query
- [ ] **Zustand** for client UI state (sidebar open, selected campaign, theme, command menu)
- [ ] **React Hook Form + Zod** for all forms (campaign create, idea generation, clip settings)

### Shared UI Components
- [ ] **`src/components/ui/`**: shadcn/ui components (Button, Input, Dialog, DropdownMenu, Tabs, Card, Table, Badge, Skeleton, EmptyState, etc.)
- [ ] **`src/components/campaign/`**: `CampaignCard`, `CampaignStatusBadge`, `CampaignForm`
- [ ] **`src/components/idea/`**: `IdeaCard`, `IdeaStatusBadge`, `IdeaGenerator`
- [ ] **`src/components/ai/`**: `AIButton`, `AIPanel`, `AIRecommendation`, `LoadingState`
- [ ] **`src/components/analytics/`**: `MetricCard`, `Chart` (placeholder or recharts)
- [ ] **`src/components/layout/`**: `PageHeader`, `Section`, `EmptyState`, `ErrorState`
- [ ] **Shared hooks**: `useCampaigns`, `useIdeas`, `useAI`, `useAnalytics`

### Quality
- [ ] Run `typecheck` (next build or `tsc --noEmit`) after every meaningful change
- [ ] Run `lint` (eslint) after every meaningful change
- [ ] Every page has loading.tsx, error.tsx, not-found.tsx
- [ ] Every AI action has loading + error + empty + success states in UI

---

## 11. Recommended Implementation Order

### Phase 0: Foundation
1. Install dependencies (shadcn/ui, Lucide, TanStack Query, Zustand, React Hook Form, Zod, AI SDK, Prisma, uuid, date-fns)
2. Initialize shadcn/ui — dark theme, Inter font, CSS variables
3. Configure Tailwind + shadcn integration
4. Set up Prisma with SQLite — full schema from CLAUDE.md entities
5. Create `.env.example`
6. Set up `src/lib/db/` Prisma client singleton
7. Update root `layout.tsx` and `globals.css` with shadcn base + dark mode + proper metadata

### Phase 1: Layout Shell
8. Build `Sidebar` navigation component
9. Build `TopBar` with command menu trigger
10. Create `(dashboard)` route group with shell layout
11. Stub all pages with basic layout (header + empty state) so nav works

### Phase 2: Core UI + Mock Data
12. Install shadcn/ui components: Button, Card, Badge, Input, Dialog, DropdownMenu, Tabs, Select, Textarea, Skeleton
13. Build shared `PageHeader`, `EmptyState`, `ErrorState`, `LoadingState` components
14. Create mock data fixtures — 2-3 realistic campaigns, ideas, clips, analytics snapshots
15. Wire mock data into stub pages so the app feels alive without AI

### Phase 3: Campaign Management
16. `/campaigns` — list view with filters (status, platform)
17. Campaign CRUD form with React Hook Form + Zod
18. Campaign status workflow
19. `/campaigns/[id]` — campaign detail page

### Phase 4: AI Layer
20. `AIProvider` interface + `MockAIProvider` (deterministic, realistic mock responses using Zod schemas)
21. `OpenAIProvider` + `AnthropicProvider` implementations
22. AI service functions (CampaignAnalyzer, ContentIdeaGenerator, etc.) using provider abstraction
23. `useAI` hook for client-side AI calls

### Phase 5: AI-Powered Features
24. Campaign AI Analyzer (`/campaigns/[id]` — analyze button, results panel)
25. Content Idea Generator (`/campaigns/[id]/ideas` — generate button, list)
26. Hook + Script generation (from idea detail)
27. Viral score display on ideas
28. AI Assistant (contextual, reads current page state)

### Phase 6: Planner + Production
29. `/planner` — calendar + board views
30. Production workspace per idea
31. Clip maker (mock — URL input → fake detected clips)
32. Content library with folders/tags/search

### Phase 7: Analytics
33. Analytics dashboard — metric cards, leaderboard, platform breakdown
34. AI analytics patterns (from mock data)
35. AI recommendations

### Phase 8: Polish + Quality
36. Loading states for all async operations
37. Error boundaries per page
38. Empty states per domain
39. Keyboard navigation (command menu)
40. Responsive check (mobile breakpoints)
41. Accessibility audit (ARIA labels, focus management)
42. Typecheck + lint clean run

---

## 12. Risks and Architectural Concerns

### Critical

1. **No real backend yet.** Prisma + SQLite is local-only. For multi-user/hosted, need a real DB (PostgreSQL) + auth. Architecture supports this (entities are user/workspace-scoped in CLAUDE.md), but MVP ships as single-user local app.

2. **AI abstraction leak.** If service functions call the SDK directly instead of going through `AIProvider`, adding providers later requires rewriting. Must enforce provider abstraction from day one.

3. **Mock vs real data boundary.** The UI must work identically with mock and real AI. If mock responses differ structurally from real ones, every feature needs two implementations. Use Zod schemas for both input validation and output parsing.

4. **Tailwind v4 + shadcn integration.** Tailwind v4 uses CSS-first config (`@theme`), not `tailwind.config.ts`. shadcn/ui v1 uses `tailwind.config.ts`. Verify shadcn/ui supports Tailwind v4 before initializing, or use the Tailwind v4-compatible shadcn setup. Check `npx shadcn@latest init --help` for `--tailwind-version` flag.

### Moderate

5. **Next.js 16.3.4 API changes.** `params` is now async in route handlers. Every dynamic route handler needs `await params`. Existing tutorials and stack overflow answers may be stale.

6. **shadcn/ui initialization with Next 16.** shadcn/ui is typically installed into Pages Router or older App Router projects. Verify it works cleanly with Next 16 + Tailwind v4 + ESLint v9 (flat config). May need manual intervention.

7. **AI structured outputs.** OpenAI and Anthropic have different APIs for forced JSON output. The `AIProvider` interface must abstract this. OpenAI: `response_format: { type: "json_object" }`. Anthropic: `output: { type: "json", schema: ... }` (beta). Mock provider must mirror the same interface.

8. **State management scope creep.** TanStack Query + Zustand is the right tool for this app. Don't add Context API for data that belongs in Query/Store. Reserve Context for truly global UI (theme, sidebar open, command menu).

### Low / Trade-offs

9. **Database choice.** SQLite via Prisma for MVP is correct (zero setup). PostgreSQL via Drizzle (per CLAUDE.md preference) would be better long-term. Keep Prisma schema portable — minimal ORM-specific features, standard relations.

10. **Video processing.** Real video processing (FFmpeg, transcription, clip detection) is Phase 2+. MVP uses mock data. The `VideoProcessingService` abstraction from ARCHITECTURE.md should be created as a stub interface now, so Phase 2 drops in without page rewrites.

11. **Auth.** No auth in MVP. Workspace/User scoping in entities suggests future multi-tenancy. Design Prisma schema with `userId` on all entities now, even though no auth middleware exists yet. Prevents a migration later.

12. **Monorepo vs single repo.** Not applicable now. If clip-maker, analytics, and other tools diverge significantly, evaluate `turbo` or `nx`. Premature.

13. **CSS strategy.** Tailwind v4 + shadcn means CSS variables for theming. No Tailwind `config.ts` file. `globals.css` is the source of truth. Don't add a `tailwind.config.ts` unless shadcn requires it.

14. **Icon library.** Lucide React (shadcn default). Don't mix with other icon sets. Single source.

15. **Performance.** No image optimization configured. `next/image` is set up. For campaign thumbnails, video thumbnails: use `next/image` with `unoptimized` for external URLs, proper `sizes` for responsive.

16. **TypeScript strictness.** `tsconfig.json` has `"strict": true`. No `any` casts. All AI response parsing must be validated with Zod, not type-asserted.

---

*Plan based on inspection of: src/ (4 files), docs/ (4 files), package.json, all configs. No assumptions made about code not present.*
