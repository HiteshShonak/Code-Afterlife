import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Official Prisma v6 docs for Neon + adapter:
// https://www.prisma.io/docs/orm/v6/overview/databases/neon#how-to-use-neons-connection-pooling
//
// Prisma CLI (migrate, db push, db pull, studio) reads the DIRECT URL from here.
// App runtime uses DATABASE_URL (pooler) via PrismaNeon adapter in src/lib/prisma.ts.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DIRECT_URL'),
  },
});
