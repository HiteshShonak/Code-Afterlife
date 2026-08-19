// Official Prisma v6 + Neon serverless driver setup.
// Docs: https://www.prisma.io/docs/orm/v6/overview/databases/neon#how-to-use-neons-serverless-driver-with-prisma-orm
//
// DATABASE_URL = pooler URL (-pooler hostname) → used at runtime via PrismaNeon adapter
// DIRECT_URL   = direct URL (no -pooler)       → used by Prisma CLI via prisma.config.ts

import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaNeon({ connectionString });

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
