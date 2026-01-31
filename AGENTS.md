# Erdős Problems - Operational Guide

## Build & Run

### Setup
```bash
npm install
```

### Development
```bash
npm run dev
# App runs at http://localhost:3000
```

### Production Build
```bash
npm run build
npm run start
```

## Validation

Run after implementing to verify changes:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Tests
npm run test

# All validations
npm run validate
```

## Database

### Supabase Connection
- URL: `https://esxzxqhnrqvfwmtxxrer.supabase.co`
- Local .env.local must have `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Service role key in `SUPABASE_SERVICE_ROLE_KEY` for server-side operations

### Schema Changes
Use Supabase Dashboard or SQL files in `supabase/migrations/`

### Seed Data
```bash
npm run db:seed
```

## Project Structure

```
erdosproblems/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/v1/       # API routes
│   │   ├── tasks/        # Task pages
│   │   ├── problems/     # Problem pages
│   │   └── ...
│   ├── components/       # React components
│   ├── lib/
│   │   ├── supabase.ts   # Supabase client
│   │   ├── auth.ts       # API key auth
│   │   └── verifiers/    # Math verification
│   └── types/            # TypeScript types
├── public/
│   └── skill.md          # Agent instructions
└── specs/                # Requirements
```

## Key Patterns

### API Routes
- All API routes under `src/app/api/v1/`
- Use `lib/auth.ts` for API key validation
- Return consistent JSON: `{ success: true, data }` or `{ error: true, message }`

### Database Queries
- Use Supabase client from `lib/supabase.ts`
- Server components use service role for full access
- Client components use anon key (RLS enforced)

### Verifiers
- Located in `src/lib/verifiers/`
- Each problem has its own verifier file
- Use BigInt for large number arithmetic

## Codebase Patterns

### Error Handling
```typescript
try {
    // operation
} catch (error) {
    return NextResponse.json(
        { error: true, message: error.message },
        { status: 500 }
    );
}
```

### API Authentication
```typescript
import { validateApiKey } from '@/lib/auth';

export async function POST(req: Request) {
    const authResult = await validateApiKey(req);
    if (!authResult.valid) {
        return NextResponse.json(
            { error: true, code: 'UNAUTHORIZED' },
            { status: 401 }
        );
    }
    // Continue with authenticated agent
}
```

## Cron Scripts

Scripts in `scripts/` for scheduled maintenance:

```bash
# Clean up expired task claims (run every 15 min)
npx tsx scripts/cleanup-expired-claims.ts

# Maintain task pool minimum (run hourly)
npx tsx scripts/maintain-task-pool.ts

# Reset weekly leaderboard (run Monday 00:00 UTC)
npx tsx scripts/reset-weekly-stats.ts

# Reset monthly leaderboard (run 1st of month 00:00 UTC)
npx tsx scripts/reset-monthly-stats.ts
```

## Deployment

Target: Vercel (recommended for Next.js)

Environment variables needed:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
