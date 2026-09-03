# Architecture

## High-Level Flow

Campaign
→ Campaign Analysis
→ Content Strategy
→ Content Ideas
→ Planning
→ Production
→ Clip
→ Publication
→ Analytics
→ AI Optimization

---

# Layers

## UI

React / Next.js components.

Responsible for:

- rendering
- user interactions
- forms
- navigation
- loading states

## Application

Responsible for:

- use cases
- workflows
- orchestration

## Domain

Responsible for:

- campaign rules
- content models
- scoring
- business logic

## Infrastructure

Responsible for:

- database
- AI providers
- storage
- video processing
- external APIs

---

# AI Provider

Use provider abstraction.

AIProvider

Implementations may include:

- OpenAI
- Anthropic
- Gemini
- Custom providers
- MockProvider

The application should depend on AIProvider rather than directly on a vendor SDK.

---

# Video Processing

Use a VideoProcessingService abstraction.

Potential future implementations:

- FFmpeg
- cloud video processing
- transcription providers
- AI video services

The MVP can use MockVideoProcessingService.

---

# Core Services

CampaignAnalyzer
ContentIdeaGenerator
ScriptGenerator
HookGenerator
ClipDetector
ViralScoreAnalyzer
CaptionGenerator
ContentOptimizer
AnalyticsAnalyzer
ContentPlanner

Each service should have:

- typed input
- typed output
- clear responsibility
- provider independence

---

# Data Flow

Campaign

↓

CampaignAnalysis

↓

ContentIdeas

↓

ContentPlan

↓

Content

↓

Clip

↓

Publication

↓

AnalyticsSnapshot

↓

AIRecommendation

↓

New Content Ideas

---

# Design Principle

Avoid premature abstraction.

Create abstractions where:

- external providers are involved
- multiple implementations are expected
- business logic needs isolation
- testing requires replacement implementations

Do not create abstractions simply to make the codebase look sophisticated.
