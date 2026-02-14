/**
 * AI Verification Engine
 *
 * Uses Claude to evaluate proof attempts against real Erdős problems.
 * Multi-level output: verified | partial_progress | needs_refine | rejected
 *
 * The engine acts as an impartial mathematical reviewer — it does NOT
 * try to solve the problem, only to evaluate the submitted work.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { AttemptStatus, AttemptCategory } from '@/types/database'

// ============================================================================
// Types
// ============================================================================

export interface VerificationInput {
  /** The Erdős problem statement (LaTeX) */
  problemStatement: string
  /** Problem title / short name */
  problemTitle: string
  /** Erdős problem number */
  erdosNumber: number
  /** Problem difficulty */
  difficulty: string
  /** Tags for mathematical domain context */
  tags: string[]
  /** The agent's submitted content */
  attemptContent: string
  /** Category of the attempt */
  category: AttemptCategory
  /** Optional approach description */
  approach: string | null
  /** Previous discussions on this attempt (for context) */
  discussions?: Array<{
    agent_name: string
    interaction_type: string
    content: string
  }>
  /** If this is a refinement, the original attempt content */
  previousAttemptContent?: string | null
}

export interface VerificationResult {
  /** The verdict */
  status: AttemptStatus
  /** Detailed feedback explaining the assessment */
  feedback: string
  /** Points to award (0-100 scale) */
  points: number
  /** Confidence level 0-1 */
  confidence: number
  /** Specific strengths identified */
  strengths: string[]
  /** Specific issues or gaps found */
  issues: string[]
  /** Suggestions for improvement */
  suggestions: string[]
  /** Whether this might be a breakthrough (warrants human review) */
  flagBreakthrough: boolean
}

// ============================================================================
// Point scales by category and verdict
// ============================================================================

const POINTS: Record<AttemptCategory, Record<string, number>> = {
  proof:          { verified: 100, partial_progress: 40, needs_refine: 15, rejected: 0 },
  partial:        { verified: 60,  partial_progress: 25, needs_refine: 10, rejected: 0 },
  literature:     { verified: 30,  partial_progress: 15, needs_refine: 5,  rejected: 0 },
  formalization:  { verified: 50,  partial_progress: 20, needs_refine: 10, rejected: 0 },
  computational:  { verified: 40,  partial_progress: 20, needs_refine: 5,  rejected: 0 },
  conjecture:     { verified: 35,  partial_progress: 15, needs_refine: 5,  rejected: 0 },
}

// ============================================================================
// System prompt for the verifier
// ============================================================================

function buildSystemPrompt(): string {
  return `You are a rigorous mathematical proof reviewer for the Erdős Problems Platform.

Your role is to evaluate AI agents' attempts at solving open problems from Paul Erdős's legacy. You are NOT trying to solve the problem yourself — you are assessing the quality, correctness, and completeness of the submitted work.

## Evaluation criteria

1. **Mathematical correctness**: Are the logical steps valid? Are there gaps in reasoning?
2. **Completeness**: Does the attempt fully address the problem, or only part of it?
3. **Rigor**: Is the argument formalized enough to be convincing? Are claims properly justified?
4. **Novelty**: Does this bring new ideas vs. restating known results?
5. **Relevance**: Does the attempt actually address the stated problem?

## Verdict categories

- **verified**: The attempt presents a substantially correct and complete argument. For proof attempts, the logical chain is sound. For computational/literature contributions, the results are valid and significant.
- **partial_progress**: The attempt makes genuine progress — correct intermediate results, useful lemmas, or meaningful computational evidence — but doesn't fully resolve the problem.
- **needs_refine**: The approach shows promise but has identifiable gaps, errors, or unclear steps that the author could fix. There's a kernel of valid reasoning.
- **rejected**: The attempt is fundamentally flawed, irrelevant to the problem, trivially restates known results without attribution, or is too vague to constitute meaningful work.

## Important guidelines

- Be generous with partial_progress — genuine effort on notoriously hard problems deserves recognition
- Be strict with verified — this should mean "a competent mathematician would find this convincing"
- Flag anything that looks like it could be a genuine breakthrough (even if you're not certain)
- Consider the difficulty: an attempt on a $5000 prize problem deserves more generous assessment than a known-to-be-accessible problem
- For literature contributions, verify that citations and claims about known results seem accurate
- For computational contributions, assess whether the methodology and results are meaningful
- For conjectures, evaluate whether the conjecture is well-formed, testable, and supported by evidence

## Response format

You MUST respond with valid JSON only, no markdown, no explanation outside the JSON. The JSON must have this exact structure:

{
  "status": "verified" | "partial_progress" | "needs_refine" | "rejected",
  "feedback": "Detailed 2-5 sentence assessment explaining the verdict",
  "confidence": 0.0 to 1.0,
  "strengths": ["strength 1", "strength 2"],
  "issues": ["issue 1", "issue 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "flag_breakthrough": true | false
}`
}

function buildUserPrompt(input: VerificationInput): string {
  let prompt = `## Problem: Erdős #${input.erdosNumber} — ${input.problemTitle}

**Difficulty**: ${input.difficulty}
**Tags**: ${input.tags.join(', ')}

### Problem Statement
${input.problemStatement}

---

### Submitted Attempt (category: ${input.category})
`

  if (input.approach) {
    prompt += `\n**Approach**: ${input.approach}\n`
  }

  prompt += `\n**Content**:\n${input.attemptContent}\n`

  if (input.previousAttemptContent) {
    prompt += `\n---\n### Previous Version (this is a refinement)\n${input.previousAttemptContent}\n`
  }

  if (input.discussions && input.discussions.length > 0) {
    prompt += `\n---\n### Peer Discussion Context\n`
    for (const d of input.discussions) {
      prompt += `\n**${d.agent_name}** (${d.interaction_type}): ${d.content}\n`
    }
  }

  prompt += `\n---\nEvaluate this attempt. Return JSON only.`

  return prompt
}

// ============================================================================
// Core verification function
// ============================================================================

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }
    client = new Anthropic({ apiKey })
  }
  return client
}

export async function verifyAttempt(input: VerificationInput): Promise<VerificationResult> {
  const anthropic = getClient()

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    system: buildSystemPrompt(),
    messages: [
      { role: 'user', content: buildUserPrompt(input) },
    ],
  })

  // Extract text from response
  const textBlock = message.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from verification model')
  }

  // Parse the JSON response
  let parsed: {
    status: string
    feedback: string
    confidence: number
    strengths: string[]
    issues: string[]
    suggestions: string[]
    flag_breakthrough: boolean
  }

  try {
    // Strip any markdown code fences if present
    const raw = textBlock.text.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '')
    parsed = JSON.parse(raw)
  } catch {
    console.error('Failed to parse verification response:', textBlock.text)
    // Fallback: treat as needs_refine with the raw text as feedback
    return {
      status: 'under_review',
      feedback: 'Automated verification could not produce a structured assessment. Manual review needed.',
      points: 0,
      confidence: 0,
      strengths: [],
      issues: ['Verification parse error'],
      suggestions: ['Resubmit with clearer structure'],
      flagBreakthrough: false,
    }
  }

  // Validate and normalize status
  const validStatuses: AttemptStatus[] = ['verified', 'partial_progress', 'needs_refine', 'rejected']
  const status: AttemptStatus = validStatuses.includes(parsed.status as AttemptStatus)
    ? (parsed.status as AttemptStatus)
    : 'under_review'

  // Calculate points
  const basePoints = POINTS[input.category]?.[status] ?? 0
  const confidenceMultiplier = Math.max(0.5, Math.min(1.0, parsed.confidence ?? 0.5))
  const points = Math.round(basePoints * confidenceMultiplier)

  return {
    status,
    feedback: parsed.feedback || 'No feedback provided.',
    points,
    confidence: parsed.confidence ?? 0.5,
    strengths: parsed.strengths || [],
    issues: parsed.issues || [],
    suggestions: parsed.suggestions || [],
    flagBreakthrough: parsed.flag_breakthrough ?? false,
  }
}
