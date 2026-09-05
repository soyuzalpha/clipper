# AI System

## Philosophy

AI should act as a contextual copilot throughout the content lifecycle.

It should not be limited to a standalone chatbot.

---

# AI Capabilities

## Campaign Analysis

Input:

Campaign data and requirements.

Output:

- summary
- requirements
- restrictions
- risks
- target audience
- content angles
- strategy
- opportunity score

---

# Content Idea Generation

Input:

- campaign
- campaign requirements
- target audience
- creator context
- historical performance

Output:

- title
- hook
- angle
- audience
- format
- duration (seconds)
- structure (beat-by-beat timeline)
- CTA
- platform
- viral score
- difficulty

---

# Script Generation

Input:

- content idea
- campaign requirements
- tone
- target platform

Output:

- hook
- introduction
- main content
- payoff
- CTA

---

# Viral Scoring

The system must treat viral scoring as prediction, not certainty.

Factors:

- hook strength
- curiosity
- novelty
- emotional impact
- pacing
- retention
- shareability
- relevance
- clarity
- storytelling

---

# Analytics Analysis

Input:

Historical content performance.

Output:

- patterns
- winning formats
- winning hooks
- weak formats
- recommendations
- next content opportunities

---

# Context

AI requests should include relevant context automatically.

Examples:

Campaign page:

- current campaign
- requirements
- deadline
- reward

Analytics page:

- selected content
- performance metrics
- historical benchmarks

Planner:

- calendar
- deadlines
- unfinished content
- historical posting performance

---

# Structured Outputs

Prefer structured JSON/schema-based responses over plain text.

All AI-generated entities should be validated before entering application state.

Use Zod schemas where appropriate.

---

# Provider Model

The active provider is chosen by the `AI_PROVIDER` env var — `mock` (default) or `hemattoken`. Production AI calls go through the HematToken gateway; the app never connects to Anthropic/OpenAI/Gemini directly.

The app depends on the AIProvider abstraction, never on a specific vendor SDK. Provider selection, configuration, the AI Router task model, error mapping, request logging, and security boundaries are recorded in docs/AI_INTEGRATION.md.

# Mock Provider

The MVP must support a MockAIProvider.

Mock responses should be:

- deterministic where useful
- realistic
- structured
- representative of real AI output

The UI must work without an external AI API key.
