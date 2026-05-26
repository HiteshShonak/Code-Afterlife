/**
 * Expanded technology stack list organized by category.
 * Official stacks shown in UI picker; custom stacks stored as plain strings.
 */

// ─── Frontend ──────────────────────────────────────────────────────────────────
const FRONTEND = [
  'React', 'Next.js', 'Vue', 'Nuxt', 'Angular', 'Svelte', 'SvelteKit',
  'Solid', 'Astro', 'Remix', 'Qwik', 'Vite',
] as const;

// ─── Backend ───────────────────────────────────────────────────────────────────
const BACKEND = [
  'Node.js', 'Express', 'Fastify', 'NestJS', 'Hono', 'Bun', 'Deno',
  'tRPC',
] as const;

// ─── Languages ─────────────────────────────────────────────────────────────────
const LANGUAGES = [
  'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'Kotlin',
  'C#', 'PHP', 'Ruby', 'Elixir', 'Zig', 'Swift', 'Dart',
] as const;

// ─── Frameworks ────────────────────────────────────────────────────────────────
const FRAMEWORKS = [
  'Django', 'FastAPI', 'Flask', 'Ruby on Rails', 'Laravel',
  'Spring Boot', '.NET', 'Fiber', 'Gin', 'Echo',
] as const;

// ─── Database ──────────────────────────────────────────────────────────────────
const DATABASE = [
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'DynamoDB',
  'Supabase', 'PlanetScale', 'Neon', 'CockroachDB', 'Turso',
] as const;

// ─── ORM / Query ───────────────────────────────────────────────────────────────
const ORM = [
  'Prisma', 'Drizzle', 'TypeORM', 'Mongoose', 'SQLAlchemy', 'GORM',
] as const;

// ─── AI / ML ───────────────────────────────────────────────────────────────────
const AI_ML = [
  'PyTorch', 'TensorFlow', 'LangChain', 'OpenAI', 'Hugging Face',
  'Ollama', 'LlamaIndex', 'Anthropic', 'Vercel AI SDK',
] as const;

// ─── Mobile ────────────────────────────────────────────────────────────────────
const MOBILE = [
  'React Native', 'Expo', 'Flutter', 'Jetpack Compose',
] as const;

// ─── Testing ───────────────────────────────────────────────────────────────────
const TESTING = [
  'Vitest', 'Jest', 'Playwright', 'Cypress', 'Testing Library',
] as const;

// ─── Styling ───────────────────────────────────────────────────────────────────
const STYLING = [
  'Tailwind', 'CSS Modules', 'shadcn/ui', 'Radix UI', 'Styled Components',
] as const;

// ─── Cloud / Infra ─────────────────────────────────────────────────────────────
const CLOUD = [
  'Vercel', 'Cloudflare', 'AWS', 'GCP', 'Azure', 'Railway', 'Fly.io',
  'Docker', 'GitHub Actions',
] as const;

/**
 * Flat list of all officially recognized stacks for the UI picker.
 * Displayed in order: Frontend → Backend → Languages → Frameworks → DB → etc.
 */
export const AVAILABLE_STACKS = [
  ...FRONTEND,
  ...BACKEND,
  ...LANGUAGES,
  ...FRAMEWORKS,
  ...DATABASE,
  ...ORM,
  ...AI_ML,
  ...MOBILE,
  ...TESTING,
  ...STYLING,
  ...CLOUD,
] as const;

/**
 * Stack categories for grouped display in the tech stack picker.
 * Each category has a label and its stack options.
 */
export const STACK_CATEGORIES = [
  { label: 'Frontend',    stacks: FRONTEND   },
  { label: 'Backend',     stacks: BACKEND    },
  { label: 'Languages',   stacks: LANGUAGES  },
  { label: 'Frameworks',  stacks: FRAMEWORKS },
  { label: 'Database',    stacks: DATABASE   },
  { label: 'ORM / Query', stacks: ORM        },
  { label: 'AI / ML',     stacks: AI_ML      },
  { label: 'Mobile',      stacks: MOBILE     },
  { label: 'Testing',     stacks: TESTING    },
  { label: 'Styling',     stacks: STYLING    },
  { label: 'Cloud',       stacks: CLOUD      },
] as const;

/**
 * The most-used stacks shown immediately in the picker (no search needed).
 * Chosen by real-world developer survey data.
 */
export const POPULAR_STACKS = [
  'TypeScript', 'React', 'Next.js', 'Node.js',
  'Python', 'PostgreSQL', 'Prisma', 'Docker',
  'Tailwind', 'Go', 'Vue', 'Bun',
] as const;

/**
 * Standard defaults for project creation and initialization.
 */
export const PROJECT_DEFAULTS = {
  /** Starting health value. */
  initialHealth: 50,
  /** Initial lifecycle state assigned to project on creation. */
  initialState: 'BORN' as const,
  /** Maximum number of screenshots allowed per project. */
  maxScreenshots: 5,
  /** Maximum number of stacks (official + custom combined). */
  maxStacks: 15,
} as const;

/** Max character limit allowed for project url slug. */
export const SLUG_MAX_LENGTH = 80;
