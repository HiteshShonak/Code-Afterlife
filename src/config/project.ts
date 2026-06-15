// lists of tech stacks

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

// all valid stacks
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

// group stacks
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

// popular stacks
export const POPULAR_STACKS = [
  'TypeScript', 'React', 'Next.js', 'Node.js',
  'Python', 'PostgreSQL', 'Prisma', 'Docker',
  'Tailwind', 'Go', 'Vue', 'Bun',
] as const;

// default values
export const PROJECT_DEFAULTS = {
  // start health
  initialHealth: 50,
  // start state
  initialState: 'BORN' as const,
  // max screens
  maxScreenshots: 5,
  // max stacks
  maxStacks: 15,
} as const;

// max slug len
export const SLUG_MAX_LENGTH = 80;
