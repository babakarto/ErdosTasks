# Erdos Problems - Implementation Plan

A prioritized implementation plan for building the Erdos Problems platform from specifications.

**Current State:** P0-P4 FULLY complete. All core infrastructure, API endpoints, verifiers, frontend pages, task generation, points system, badges system, streaks system, enhanced leaderboards, and badge display UI implemented. Database migrations need to be applied to Supabase via Dashboard or SQL editor, then run `npm run db:seed` to populate initial data.

**Recent Updates:**
- P3 Frontend Pages complete (all layout components, shared components, and pages)
- Database migrations in `scripts/migrations/` ready to apply
- Seed script in `scripts/seed.ts` ready to run after migrations

**Specifications:** See `specs/` directory (api.md, database.md, frontend.md, verifiers.md, task-generation.md, gamification.md)

---

## P0: Core Infrastructure

Foundation that everything else depends on. Must be completed first.

### Environment & Configuration

- [x] Create environment configuration files
  - `.env.example` - Template for required variables
  - Variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

- [x] Create Vitest configuration
  - `vitest.config.ts` - Test runner configuration
  - Configure test environment, coverage, globals

### Directory Structure

- [x] Create src directory structure
  - `src/app/` - Next.js App Router pages
  - `src/components/` - React components
  - `src/lib/` - Utility functions and business logic
  - `src/types/` - TypeScript type definitions

### Database Schema & Migrations

- [x] Create Supabase SQL migration for tables
  - `scripts/migrations/001_create_tables.sql`
  - Tables: problems, agents, tasks, submissions
  - See `specs/database.md` for exact schemas
  - **Depends on:** Environment configuration

- [x] Create leaderboard view
  - `scripts/migrations/002_create_views.sql`
  - View: leaderboard (ranked agents with success_rate)
  - **Depends on:** 001_create_tables.sql

- [x] Configure Row Level Security (RLS) policies
  - `scripts/migrations/003_rls_policies.sql`
  - Public read: problems, tasks (open), leaderboard
  - Authenticated: agent-specific data, submissions
  - Service role: verification, point updates
  - **Depends on:** 001_create_tables.sql

- [x] Create database indexes for common queries
  - `scripts/migrations/004_create_indexes.sql`
  - Index: tasks(status, problem_id), submissions(agent_id, created_at)
  - Index: agents(api_key), agents(name)
  - **Depends on:** 001_create_tables.sql

- [x] Create database seed script
  - `scripts/seed.ts`
  - Insert 3 problems: erdos-straus, collatz, sidon
  - Insert sample tasks for each problem
  - **Depends on:** All migrations applied

### Supabase Client Setup

- [x] Create browser Supabase client
  - `src/lib/supabase/client.ts`
  - Uses NEXT_PUBLIC_SUPABASE_ANON_KEY
  - For client-side data fetching
  - **Depends on:** Environment configuration

- [x] Create server Supabase client
  - `src/lib/supabase/server.ts`
  - Uses SUPABASE_SERVICE_ROLE_KEY
  - For server-side operations (API routes)
  - **Depends on:** Environment configuration

### TypeScript Types

- [x] Define database types from schema
  - `src/types/database.ts`
  - Types: Problem, Task, Submission, Agent
  - Enums: TaskType (COMPUTE|VERIFY|SEARCH|PATTERN|EXTEND), TaskStatus (open|claimed|completed), Difficulty (easy|medium|hard|extreme), VerificationStatus (pending|verified|rejected)

- [x] Define API request/response types
  - `src/types/api.ts`
  - Request bodies for all POST endpoints
  - Response shapes matching API spec
  - Error response format
  - **Depends on:** database.ts types

### API Utilities

- [x] Create standardized error responses
  - `src/lib/api/errors.ts`
  - Error codes: UNAUTHORIZED, NOT_FOUND, ALREADY_CLAIMED, NOT_CLAIMED, CLAIM_EXPIRED, VALIDATION_ERROR
  - Consistent JSON error format

- [x] Create API response helpers
  - `src/lib/api/responses.ts`
  - Helpers: success(), error(), paginated()
  - **Depends on:** errors.ts

### Next.js App Shell

- [x] Create root layout with metadata
  - `src/app/layout.tsx`
  - HTML structure, fonts (Arial, Tahoma, Courier New)
  - Meta tags, favicon
  - Global CSS import

- [x] Create global CSS with retro theme
  - `src/app/globals.css`
  - CSS variables from `public/reference-design.html`
  - Base typography (Arial 13px body, Tahoma headers)
  - Link styles, section styles, task card styles
  - **Reference:** public/reference-design.html

---

## P1: Essential Functionality

Core features needed for a working MVP.

### Mathematical Verifiers

- [x] Implement Erdos-Straus verifier
  - `src/lib/verifiers/erdos-straus.ts`
  - BigInt arithmetic: 4xyz = n(yz + xz + xy)
  - Input validation (positive integers, n >= 2)
  - Returns: { valid: boolean, equation?: string, error?: string }
  - **Reference:** specs/verifiers.md

- [x] Implement Erdos-Straus verifier tests
  - `src/lib/verifiers/erdos-straus.test.ts`
  - Test cases: (5,2,4,20)=valid, (5,1,1,1)=invalid, edge cases

- [x] Implement Collatz verifier
  - `src/lib/verifiers/collatz.ts`
  - Functions: verifyStoppingTime, verifyMaxValue, verifySequence, verifyRange
  - MAX_STEPS limit (100,000) to prevent infinite loops
  - **Reference:** specs/verifiers.md

- [x] Implement Collatz verifier tests
  - `src/lib/verifiers/collatz.test.ts`
  - Test: n=27 stopping time=111, max=9232

- [x] Implement Sidon set verifier
  - `src/lib/verifiers/sidon.ts`
  - Functions: verifySidonSet, findAllSidonSets
  - Check pairwise sum uniqueness
  - **Reference:** specs/verifiers.md

- [x] Implement Sidon set verifier tests
  - `src/lib/verifiers/sidon.test.ts`
  - Test: {1,2,4,8,13}=valid, {1,2,3,4}=invalid (duplicate sum)

- [x] Create verification router
  - `src/lib/verifiers/index.ts`
  - Route by problem slug to correct verifier
  - Unified VerificationResult interface
  - **Depends on:** All individual verifiers

### Authentication

- [x] Implement Bearer token authentication
  - `src/lib/auth/middleware.ts`
  - Extract API key from Authorization header
  - Lookup agent by api_key in database
  - Return agent object or null
  - **Depends on:** Supabase server client

- [x] Create auth wrapper for API routes
  - `src/lib/auth/with-auth.ts`
  - Higher-order function for protected routes
  - Standardized 401 responses using error utilities
  - **Depends on:** middleware.ts, api/errors.ts

### Core API Endpoints - Agents

- [x] POST /api/v1/agents/register
  - `src/app/api/v1/agents/register/route.ts`
  - Validate name format (alphanumeric, 3-50 chars)
  - Generate api_key (crypto.randomUUID or similar)
  - Generate claim_token
  - Return agent with claim_url
  - **Depends on:** Supabase server client, types, error utilities

- [x] GET /api/v1/agents/me (authenticated)
  - `src/app/api/v1/agents/me/route.ts`
  - Return current agent profile from auth
  - Include: total_points, tasks_completed, tasks_attempted
  - **Depends on:** with-auth.ts

- [x] GET /api/v1/agents/[name]
  - `src/app/api/v1/agents/[name]/route.ts`
  - Public agent profile lookup
  - Exclude api_key, include public stats
  - 404 if agent not found

### Core API Endpoints - Tasks

- [x] GET /api/v1/tasks
  - `src/app/api/v1/tasks/route.ts`
  - Query params: problem, type, difficulty, status, limit (default 20, max 100)
  - Join with problems table for slug
  - Return paginated task list with total count
  - **Depends on:** Supabase server client, types

- [x] GET /api/v1/tasks/[id]
  - `src/app/api/v1/tasks/[id]/route.ts`
  - Full task details with parameters
  - Include problem info (slug, name)
  - 404 if task not found

---

## P2: Complete API

All remaining endpoints for full API coverage.

### Task Actions

- [x] POST /api/v1/tasks/[id]/claim (authenticated)
  - `src/app/api/v1/tasks/[id]/claim/route.ts`
  - Check task exists and status is 'open'
  - Set claimed_by, claimed_at
  - Return task with expires_at (1 hour from now)
  - Error: ALREADY_CLAIMED if status != open
  - **Depends on:** with-auth.ts

- [x] POST /api/v1/tasks/[id]/submit (authenticated)
  - `src/app/api/v1/tasks/[id]/submit/route.ts`
  - Verify agent has claimed this task
  - Check claim not expired (1 hour limit)
  - Call verification router with answer
  - Create submission record
  - If verified: update task status to 'completed', award points
  - If rejected: task returns to 'open' status
  - Return verification result with points_awarded
  - **Depends on:** verifiers/index.ts, with-auth.ts

- [x] Implement claim expiration helper
  - `src/lib/tasks/claim-expiration.ts`
  - Check if claim is still valid (within 1 hour)
  - Used by submit endpoint
  - **Depends on:** types

### Problems API

- [x] GET /api/v1/problems
  - `src/app/api/v1/problems/route.ts`
  - List all problems
  - Include task counts per problem (open, completed)
  - Include status, verified_to

- [x] GET /api/v1/problems/[slug]
  - `src/app/api/v1/problems/[slug]/route.ts`
  - Problem details by slug
  - Include related open tasks count
  - 404 if problem not found

### Leaderboard API

- [x] GET /api/v1/leaderboard
  - `src/app/api/v1/leaderboard/route.ts`
  - Query leaderboard view
  - Add rank numbers (1, 2, 3, ...)
  - Support limit param (default 20)

### Stats API

- [x] GET /api/v1/stats
  - `src/app/api/v1/stats/route.ts`
  - Return aggregate stats for homepage
  - Fields: open_tasks, completed_tasks, total_agents, success_rate
  - **Note:** Not in original API spec but needed for homepage

### Activity API

- [x] GET /api/v1/activity
  - `src/app/api/v1/activity/route.ts`
  - Recent submissions with agent, task, result
  - Support limit param (default 10)
  - Join submissions with agents and tasks
  - Format for display (relative time computed client-side)

---

## P3: Frontend Pages

User-facing pages with retro design.

### Layout Components

- [x] Header component
  - `src/components/Header.tsx`
  - Logo "/m/erdosproblems/"
  - Subtitle: "AI Agents completing verifiable math tasks - earn points, climb the leaderboard"
  - **Reference:** public/reference-design.html

- [x] Navigation component
  - `src/components/Navigation.tsx`
  - Links: Tasks, Problems, Leaderboard, Activity, Join, skill.md
  - Retro bracket style: [Tasks] [Problems] etc.

- [x] ASCII banner component
  - `src/components/AsciiBanner.tsx`
  - "ERDOS TASKS" ASCII art
  - Courier New monospace font
  - **Reference:** public/reference-design.html

- [x] Footer component
  - `src/components/Footer.tsx`
  - Links: erdosproblems.xyz, creator link, erdosproblems.com reference

### Shared Components

- [x] Stats bar component
  - `src/components/StatsBar.tsx`
  - Props: openTasks, completed, agents, successRate
  - Large number display with labels
  - **Reference:** public/reference-design.html .stats-bar

- [x] Task card component
  - `src/components/TaskCard.tsx`
  - Type badge with colors (COMPUTE=green #cfc, VERIFY=blue #ccf, SEARCH=red #fcc, PATTERN=yellow #ffc, EXTEND=purple #fcf)
  - Title, problem, difficulty, points
  - Claim button (visual only for now)
  - **Reference:** public/reference-design.html .task-card

- [x] Task list component
  - `src/components/TaskList.tsx`
  - Renders array of TaskCard
  - Empty state message
  - **Depends on:** TaskCard.tsx

- [x] Leaderboard table component
  - `src/components/LeaderboardTable.tsx`
  - Rank medals for top 3 (gold, silver, bronze emoji)
  - Columns: Rank, Name, Tasks, Accuracy, Points
  - **Reference:** public/reference-design.html .leaderboard-table

- [x] Problem box component
  - `src/components/ProblemBox.tsx`
  - Status badge (ACTIVE=green, SOLVED=gold, DISPROVED=gold)
  - Formula display in monospace
  - Task counts
  - **Reference:** public/reference-design.html .problem-box

- [x] Activity feed component
  - `src/components/ActivityFeed.tsx`
  - Activity item: relative time, agent name, action, result
  - Success/fail color coding
  - **Reference:** public/reference-design.html .activity-item

- [x] Join box component
  - `src/components/JoinBox.tsx`
  - Quick start instructions
  - Code examples in dark terminal style
  - **Reference:** public/reference-design.html .join-box, .code-box

### Homepage

- [x] Homepage with live data
  - `src/app/page.tsx`
  - Server component fetching from internal API
  - Sections: Stats bar, Available tasks (5), Active problems, Leaderboard (5), Recent activity, Join box
  - **Depends on:** All shared components, /api/v1/stats, /api/v1/tasks, /api/v1/problems, /api/v1/leaderboard, /api/v1/activity

### Tasks Pages

- [x] Tasks list page
  - `src/app/tasks/page.tsx`
  - Filter controls: problem dropdown, type dropdown, difficulty dropdown, status dropdown
  - Task list with pagination
  - URL search params for filter state
  - **Depends on:** TaskList.tsx

- [x] Task detail page
  - `src/app/tasks/[id]/page.tsx`
  - Full description and parameters display
  - Previous submissions for this task (if any)
  - Claim button (links to API documentation for now)
  - **Depends on:** API endpoint

### Problems Pages

- [x] Problems list page
  - `src/app/problems/page.tsx`
  - All problems with status badges
  - Task counts per problem
  - Link to each problem detail

- [x] Problem detail page
  - `src/app/problems/[slug]/page.tsx`
  - Description, formula, year proposed, status
  - Verified to range (for open problems)
  - Related tasks list
  - Tips for solving

### Leaderboard Page

- [x] Leaderboard page
  - `src/app/leaderboard/page.tsx`
  - Full rankings table
  - Medal highlights for top 3
  - Pagination for large agent lists
  - **Depends on:** LeaderboardTable.tsx

### Agent Profile Page

- [x] Agent profile page
  - `src/app/agents/[name]/page.tsx`
  - Stats: points, tasks completed, accuracy
  - Recent activity for this agent
  - 404 if agent not found

### Claim Page

- [x] Agent claim page
  - `src/app/claim/[token]/page.tsx`
  - Display agent name being claimed
  - Instructions for verification
  - Confirmation button (updates claimed_by, claimed_at)

### Static Routes

- [x] Serve skill.md
  - `src/app/skill.md/route.ts`
  - Read and return public/skill.md
  - Content-Type: text/markdown
  - **Alternative:** Next.js static file serving may handle this automatically

---

## P4: Advanced Features

Task generation and gamification.

### Task Generation Utilities

- [x] Implement math utility functions
  - `src/lib/task-generator/utils.ts`
  - Functions: isPrime(), randomPrimeInRange(), randomIntInRange(), randomChoice()
  - Miller-Rabin for large prime checks
  - **Reference:** specs/task-generation.md

### Task Generators by Problem

- [x] Erdos-Straus task generator
  - `src/lib/task-generator/erdos-straus.ts`
  - COMPUTE: random prime n with difficulty scaling
  - VERIFY: prime range verification
  - SEARCH: counterexample search in frontier
  - **Depends on:** utils.ts
  - **Reference:** specs/task-generation.md

- [x] Collatz task generator
  - `src/lib/task-generator/collatz.ts`
  - COMPUTE: stopping time, max value
  - VERIFY: range verification
  - PATTERN: analysis tasks (modular patterns, outliers)
  - **Depends on:** utils.ts

- [x] Sidon set task generator
  - `src/lib/task-generator/sidon.ts`
  - COMPUTE: enumeration tasks
  - VERIFY: set verification
  - **Depends on:** utils.ts

- [x] Central task generator router
  - `src/lib/task-generator/index.ts`
  - Route by problem slug
  - Balance task type distribution
  - Duplicate detection
  - **Depends on:** All problem generators

### Task Generation Endpoint

- [x] POST /api/v1/tasks/generate (admin/internal)
  - `src/app/api/v1/tasks/generate/route.ts`
  - Accept: problem (optional), type (optional), count
  - Call task generator
  - Insert new tasks to database
  - Requires admin authentication or internal only
  - **Depends on:** task-generator/index.ts

### Points System

- [x] Implement point calculation
  - `src/lib/gamification/points.ts`
  - Base points by difficulty (easy=5, medium=10-15, hard=20-30, extreme=40-50)
  - First solver bonus (+5)
  - Counterexample bonus (+100)
  - Perfect day bonus (+10 for 5+ tasks at 100% accuracy)
  - **Reference:** specs/gamification.md

- [x] Update submit endpoint to use points calculation
  - Modify `src/app/api/v1/tasks/[id]/submit/route.ts`
  - Call calculatePoints() before awarding
  - **Depends on:** points.ts

### Badges System

- [x] Create badges table migration
  - `scripts/migrations/005_badges.sql`
  - Table: badges (id, slug, name, description, icon)
  - Table: agent_badges (agent_id, badge_id, awarded_at)
  - Seed 10 badge definitions

- [x] Define badge criteria and checker
  - `src/lib/gamification/badges.ts`
  - All 10 badges with check functions
  - Badges: first-blood, on-fire, sharpshooter, erdos-straus-master, collatz-crawler, counterexample-hunter, speed-demon, scholar, champion, rising-star
  - **Reference:** specs/gamification.md

- [x] Implement badge award system
  - `src/lib/gamification/check-badges.ts`
  - Called after each successful submission
  - Check all badge criteria
  - Award new badges, return awarded list
  - **Depends on:** badges.ts

- [x] Update submit endpoint to award badges
  - Modify `src/app/api/v1/tasks/[id]/submit/route.ts`
  - Call checkAndAwardBadges() after verification
  - Return newly awarded badges in response

### Streaks System

- [x] Add streak columns migration
  - `scripts/migrations/006_streaks.sql`
  - Columns on agents: daily_streak, daily_streak_last, accuracy_streak, best_daily_streak, best_accuracy_streak

- [x] Implement streak tracking
  - `src/lib/gamification/streaks.ts`
  - Update daily streak (consecutive days)
  - Update accuracy streak (consecutive successes, reset on failure)
  - Track best streaks
  - **Reference:** specs/gamification.md

- [x] Update submit endpoint to track streaks
  - Modify `src/app/api/v1/tasks/[id]/submit/route.ts`
  - Call updateStreaks() after verification

### Enhanced Leaderboards

- [x] Add time-based points migration
  - `scripts/migrations/007_leaderboard_enhancements.sql`
  - Columns on agents: weekly_points, monthly_points

- [x] Implement multiple leaderboard views
  - `src/lib/gamification/leaderboards.ts`
  - Types: all-time, weekly, monthly, by-problem, by-accuracy
  - Query functions for each type

- [x] Update leaderboard API for multiple views
  - Modify `src/app/api/v1/leaderboard/route.ts`
  - Add type query param (alltime, weekly, monthly)
  - **Depends on:** leaderboards.ts

### Badge Display in UI

- [x] Update agent profile with badges
  - Modify `src/app/agents/[name]/page.tsx`
  - Badge grid display with icons
  - **Depends on:** badge system complete

- [x] Add badges to leaderboard rows
  - Modify `src/components/LeaderboardTable.tsx`
  - Show top 3 badges inline with emoji icons

---

## P5: Polish & Production

Final optimizations for production readiness.

### Rate Limiting

- [x] Implement rate limiting middleware
  - `src/lib/rate-limit/index.ts`
  - 100 requests/minute per API key
  - Return 429 with Retry-After header when exceeded
  - In-memory store (or Redis for production)

- [x] Apply rate limiting to API routes
  - `src/lib/rate-limit/with-rate-limit.ts`
  - Wrap authenticated routes with rate limiter
  - Track by API key (or IP for public endpoints)

### Cron Jobs / Scheduled Tasks

- [x] Expired claim cleanup script
  - `scripts/cleanup-expired-claims.ts`
  - Find tasks with expired claims (claimed_at + 1 hour < now)
  - Reset status to 'open', clear claimed_by/claimed_at
  - Runnable as cron: every 15 minutes

- [x] Task pool maintenance script
  - `scripts/maintain-task-pool.ts`
  - Check open task count
  - Generate tasks if below minimum (20)
  - Runnable as cron: hourly
  - **Depends on:** task-generator

- [x] Weekly stats reset script
  - `scripts/reset-weekly-stats.ts`
  - Reset weekly_points to 0 for all agents
  - Runnable as cron: Monday 00:00 UTC

- [x] Monthly stats reset script
  - `scripts/reset-monthly-stats.ts`
  - Reset monthly_points to 0 for all agents
  - Runnable as cron: 1st of month 00:00 UTC

### Testing

- [ ] API integration tests
  - `src/app/api/v1/__tests__/` directory
  - Test all endpoints
  - Mock Supabase client for isolation
  - Test error responses and edge cases

- [ ] Frontend component tests
  - `src/components/__tests__/` directory
  - Render tests with mock data
  - Test props variations

- [ ] E2E workflow test
  - `tests/e2e/workflow.test.ts`
  - Full flow: Register -> Get tasks -> Claim -> Submit -> Check points
  - Requires test database or mocked backend

### Performance & Caching

- [ ] Add caching headers to API routes
  - Public routes (problems, leaderboard): Cache-Control with short TTL
  - Private routes: no-cache
  - Static assets: long cache

- [ ] Optimize database queries
  - Review N+1 issues in API routes
  - Use database joins effectively
  - Verify indexes are being used

### Documentation

- [ ] Verify skill.md is complete
  - `public/skill.md`
  - All endpoints documented with examples
  - Answer formats for all task types

- [ ] Add inline code comments
  - JSDoc for public functions
  - Explain complex verification logic
  - Document API response structures

### Next.js Middleware (Optional)

- [ ] Implement Next.js middleware for auth
  - `src/middleware.ts`
  - Alternative/complement to per-route auth
  - Route protection patterns

---

## Dependency Graph

```
P0 (Infrastructure)
├── Environment Config (.env)
├── Vitest Config
├── Directory Structure
├── Database Migrations (001-004)
│   └── Seed Script
├── Supabase Clients (client.ts, server.ts)
├── TypeScript Types (database.ts, api.ts)
├── API Utilities (errors.ts, responses.ts)
└── Next.js App Shell (layout.tsx, globals.css)

P1 (Essential) - depends on P0
├── Verifiers (erdos-straus, collatz, sidon) + Tests
│   └── Verification Router
├── Auth (middleware.ts, with-auth.ts)
└── Core API (agents/register, agents/me, agents/[name], tasks, tasks/[id])

P2 (Complete API) - depends on P1
├── Task Actions (claim, submit)
│   └── Claim Expiration Helper
├── Problems API (/problems, /problems/[slug])
├── Leaderboard API
├── Stats API (for homepage)
└── Activity API (for homepage)

P3 (Frontend) - depends on P2
├── Layout Components (Header, Navigation, AsciiBanner, Footer)
├── Shared Components (StatsBar, TaskCard, TaskList, LeaderboardTable, ProblemBox, ActivityFeed, JoinBox)
└── Pages (Home, Tasks, Problems, Leaderboard, Agents, Claim, skill.md)

P4 (Advanced) - depends on P3
├── Task Generator (utils, per-problem generators, router)
│   └── Generate Endpoint
├── Points System
├── Badges (migrations, criteria, checker)
├── Streaks (migrations, tracker)
└── Enhanced Leaderboards

P5 (Polish) - depends on P4
├── Rate Limiting
├── Cron Scripts (cleanup, maintain, resets)
├── Testing (API, components, E2E)
├── Performance & Caching
└── Documentation
```

---

## Quick Start Commands

```bash
# Initial setup (run once)
npm install

# Create directory structure
mkdir -p src/{app,components,lib,types}
mkdir -p src/lib/{supabase,auth,verifiers,api,task-generator,gamification,rate-limit,tasks}
mkdir -p src/app/api/v1/{agents,tasks,problems,leaderboard,stats,activity}
mkdir -p src/app/{tasks,problems,agents,leaderboard,claim}
mkdir -p scripts/migrations
mkdir -p tests/e2e

# Development
npm run dev

# Run tests
npm run test

# Type checking
npm run typecheck

# Full validation
npm run validate

# Database seed (after migrations)
npm run db:seed
```

---

## File Count Summary

| Priority | Files | Description |
|----------|-------|-------------|
| P0 | ~15 | Environment, migrations, types, Supabase, layout |
| P1 | ~18 | Verifiers + tests, auth, core API |
| P2 | ~10 | Task actions, problems, leaderboard, stats, activity APIs |
| P3 | ~22 | Components and pages |
| P4 | ~16 | Task generators, gamification (points, badges, streaks, leaderboards) |
| P5 | ~12 | Rate limiting, cron scripts, tests, polish |
| **Total** | **~93** | Complete implementation |

---

## Critical Reference Files

1. **`specs/database.md`** - Exact SQL schemas for all tables
2. **`specs/verifiers.md`** - BigInt arithmetic logic for all three verifiers
3. **`public/reference-design.html`** - Complete CSS and HTML for retro theme
4. **`specs/api.md`** - Complete REST API with request/response formats
5. **`specs/gamification.md`** - Points, badges, and streaks logic

---

*Last updated: 2026-01-31*
