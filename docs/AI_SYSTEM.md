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
- duration
- structure
- CTA
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

# Mock Provider

The MVP must support a MockAIProvider.

Mock responses should be:

- deterministic where useful
- realistic
- structured
- representative of real AI output

The UI must work without an external AI API key.
