# 📖 Code Afterlife Technical Documentation

This document covers the deep architectural, mathematical, and routing logic of Code Afterlife. For an overview of the platform's features, please see the [README.md](./README.md).

## Core Lifecycle Rules

The lifecycle is enforced in `src/lib/state-machine.ts`.

| From | Allowed next states |
| --- | --- |
| `BORN` | `ACTIVE`, `STALLED`, `DEAD` |
| `ACTIVE` | `STALLED`, `SHIPPED`, `DEAD` |
| `STALLED` | `ACTIVE`, `DEAD` |
| `SHIPPED` | none |
| `DEAD` | `ACTIVE` |

Transitions can also be source-limited. For example, `health_cron` can decay projects into `STALLED` or `DEAD`, manual actions can ship/archive, and AI Pulse or resurrection activity can revive eligible projects.

State evaluation uses `lastActivityAt` when present, otherwise `createdAt`. With the current configuration:

- `stalledDays`: `7`
- `deadDays`: `30`
- `deadHealthDecayDays`: `2`

`SHIPPED` is terminal. `DEAD` stays dead unless an explicit external transition revives it.

## Health Math

Health calculation lives in `src/lib/health-calculator.ts`.

The base score combines activity, consistency, and momentum. Activity uses a square-root curve over the configured activity window so early commits matter without letting high-volume repositories dominate.

| Signal | Weight |
| --- | ---: |
| Activity | `0.4` |
| Consistency | `0.3` |
| Momentum | `0.3` |

Current activity configuration:

| Setting | Value |
| --- | ---: |
| Window | `45` days |
| Max commits | `50` |

Then state-specific rules apply:

- `SHIPPED`: health is fixed into the `90-100` range.
- `ACTIVE` and `BORN`: health is capped at `95`.
- `STALLED`: health is capped at `60`.
- `DEAD`: health decays with `max(0, 10 - deadDecay)`.

The health batch worker lives in `src/services/health.service.ts` and processes every non-shipped project with a concurrency of `4`. It can fetch up to `60` days of GitHub commits, blend those metrics with timeline entries, derive the lifecycle state from health bands, and persist both health and the latest activity timestamp.

Health-derived state bands for non-terminal, non-`BORN` projects:

| Health | Derived state |
| ---: | --- |
| `>= 70` | `ACTIVE` |
| `>= 30` | `STALLED` |
| `< 30` | `DEAD` |

`BORN` projects stay `BORN` until explicit activity promotes them, but they still decay to `STALLED` after `7` inactive days and `DEAD` after `30` inactive days.

## Trending Math

The Trending algorithm drives the Explore feed and is calculated in `src/lib/trending.ts`.
It strongly prioritizes **Heat** (Votes: Ship vs Die) over simple likes or views.

| Signal | Weight |
| --- | ---: |
| Positive Vote (Ship) | `+10` |
| Negative Vote (Die) | `-15` (Severe Penalty) |
| Like | `+4` |
| Comment | `+3` |
| View | `+1` |
| Health | `+0.2` |

The total engagement score is then divided by a time-decay gravity curve: `Math.pow(ageInHours + 2, 1.5)`. This ensures that older projects naturally fall down the feed unless they maintain exceptionally high vote velocity.

## AI Pulse And GitHub Freshness

AI Pulse lives in `src/lib/ai-pulse.ts` and is used by:

- `src/app/api/projects/[id]/ai-pulse/route.ts`
- `src/app/api/cron/ai-pulse/route.ts`

The fetch window is deliberately bounded:

- `since = max(stalled freshness cutoff, project.createdAt, lastPulseCheckAt - 5 minutes)`
- `until = now + 5 minutes`

That `until` parameter prevents future-dated commits from dominating the first GitHub commits page before local filtering runs.

Local filtering still verifies every returned commit:

- commit must have a valid commit date
- commit date must be after `lastActivityAt` or `createdAt`
- commit date must be newer than the stale cutoff
- commit date must be no more than 5 minutes in the future

Owner verification uses GitHub author identity:

- prefer matching `author.id` to the project owner's GitHub id
- otherwise match `author.login` to the owner's username case-insensitively

This prevents unrelated commit authors from keeping or reviving somebody else's project through AI Pulse.

## Resurrection Model

Dead projects can be resurrected into child projects. The parent remains in place as part of the lineage; the child receives its own project row, repository URL, screenshots, stack, health, state, and slug.

The resurrection flow supports:

- one-click GitHub fork through the user's OAuth token
- manual fork URL entry
- inherited defaults from the dead parent
- editable child title and description
- 1 to 5 screenshots
- stack editing
- timeline entries on both the parent and child
- testament reveal after resurrection
- optional deployed/live app URL on project pages

If a user has already resurrected a dead project, the project page no longer shows a duplicate resurrection CTA. It links them back to their existing child project instead.

## Search And Discovery

Search is implemented in `src/services/search.service.ts`.

When a query is present, search uses weighted relevance:

| Match type | Score |
| --- | ---: |
| exact title | `120` |
| title prefix | `90` |
| title contains | `70` |
| description contains | `35` |
| summary contains | `25` |
| exact tech stack | `24` |
| partial tech stack | `16` |

Secondary ordering still respects the selected sort:

- `TRENDING`
- `NEWEST`
- `HEALTH`
- `MOST_LIKED`

Both the Search page and the Dashboard implement high-performance **Client-Side Pagination** using `IntersectionObserver`. Instead of hammering the database on every scroll, or freezing the browser by rendering thousands of DOM nodes, the client slices the locally cached array into chunks of 12 and seamlessly unlocks the next chunk as the user scrolls. This completely preserves the "instantaneous" speed of client-side filtering while remaining infinitely scalable.

## Environment Variables

Create `.env.local` from `.env.sample`.

Required for the core app:

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="your-random-secret"
AUTH_GITHUB_ID="your-github-oauth-client-id"
AUTH_GITHUB_SECRET="your-github-oauth-client-secret"
AUTH_TRUST_HOST="true"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="your-cron-secret"
```

Optional integrations:

```bash
GITHUB_TOKEN="server-side-github-token"
GITHUB_WEBHOOK_SECRET="optional-webhook-secret"
GROQ_API_KEY="your-groq-api-key"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"
RESEND_API_KEY="your-resend-key"
CONTACT_EMAIL="you@example.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Architecture Map

The codebase follows a lightweight service-oriented App Router architecture.

```txt
src/
  actions/       Server Actions for mutations
  animations/    Shared animation primitives
  app/           Next.js 16 App Router pages, layouts, loading states, and API routes
  components/    Shared UI and product components
  config/        Health, project, and animation constants
  features/      Larger page-specific experiences such as landing and graveyard
  hooks/         Client-side state abstractions
  lib/           Core utilities, state machine, AI Pulse, auth, Prisma, env, and health math
  schemas/       Zod validation schemas
  services/      Database and business logic orchestration
  types/         Shared TypeScript types
  __tests__/     Vitest coverage for core lifecycle logic
```

Key patterns:

- Prisma singleton in `src/lib/prisma.ts` (with built-in dynamic injection of `connection_limit=5` and `pool_timeout=30` to prevent serverless Neon DB exhaustion).
- standardized API response helpers
- `asyncHandler` for route/action error normalization
- Zod validation at mutation/API boundaries
- service layer for business logic
- Framer Motion for app animation, GSAP reserved for landing choreography

## Important Routes

| Route | Purpose |
| --- | --- |
| `/` | Cinematic landing page |
| `/dashboard` | User project dashboard |
| `/new` | Project creation entry |
| `/explore` | Social discovery feed |
| `/search` | Filtered and weighted project search |
| `/graveyard` | 3D graveyard for dead projects |
| `/legacy` | Shipped/legacy showcase |
| `/project/[slug]` | Project detail, timeline, chat, owner actions, resurrection CTA |
| `/project/[slug]/unseal` | Time capsule reveal |
| `/project/resurrect/[id]` | Resurrection setup flow |
| `/resurrect/[slug]/revealed` | Testament reveal after resurrection |
| `/lineage/[slug]` | Lineage graph |
| `/u/[username]` | User profile |

## API Routes

| Route | Purpose |
| --- | --- |
| `/api/projects` | Project collection API |
| `/api/projects/[id]` | Project detail/update API |
| `/api/projects/[id]/state` | Manual lifecycle state updates |
| `/api/projects/[id]/timeline` | Manual timeline updates |
| `/api/projects/[id]/ai-pulse` | Manual AI Pulse trigger |
| `/api/cron/ai-pulse` | Scheduled AI Pulse worker |
| `/api/health/recalculate` | Health recalculation worker |
| `/api/projects/[id]/resurrect` | Resurrection mutation API |
| `/api/projects/[id]/chat` | Project AI chatbot |
| `/api/projects/[id]/comments` | Comments |
| `/api/projects/[id]/like` | Likes |
| `/api/projects/[id]/vote` | Will Ship / Will Die votes |
| `/api/projects/[id]/follow` | Project follows |
| `/api/projects/[id]/view` | View tracking |
| `/api/projects/[id]/time-capsules` | Time capsule management |
| `/api/github/repos` | Authenticated GitHub repo list |
| `/api/github/fork` | Authenticated GitHub fork helper |
| `/api/search` | Search and discovery feed |
| `/api/upload/sign` | Cloudinary upload signature |
| `/api/contact` | Contact form email |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Run Vitest with coverage |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push Prisma schema to the database |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database with Prisma migrate reset |

## Test Focus

The most important tests are the mathematical and lifecycle systems:

- `src/__tests__/state-machine.test.ts`
- `src/__tests__/health-calculator.test.ts`
- `src/__tests__/ai-pulse.test.ts`

Run:

```bash
npm run test
```

## Operational Notes

- Both cron routes (`/api/health/recalculate` and `/api/cron/ai-pulse`) expect `CRON_SECRET`. In `vercel.json`, they are staggered by 3 hours to prevent Vercel timeouts and allow GitHub API rate limits to reset between jobs. Health recalculation runs at `30 3 * * *` (03:30 UTC / 9:00 AM IST) and AI Pulse runs at `30 6 * * *` (06:30 UTC / 12:00 Noon IST). Users can manually trigger a pulse fetch via the UI every 6 hours, entirely decoupled from the server's cron cycle.
- AI summaries silently fall back when `GROQ_API_KEY` is missing.
- Screenshot upload depends on Cloudinary credentials.
- GitHub one-click fork depends on the signed-in user's stored GitHub OAuth access token.
- Server-side GitHub commit fetching can use `GITHUB_TOKEN` to improve rate limits.
- Contact form delivery depends on `RESEND_API_KEY` and optionally `CONTACT_EMAIL`; submitted HTML content is escaped before sending.
- Project owners can store `deployedUrl` for the live app section; the value must be an absolute `http` or `https` URL.
- The app uses Next.js 16 App Router conventions; check `node_modules/next/dist/docs/` before changing framework-level code.
