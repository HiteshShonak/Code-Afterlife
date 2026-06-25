import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '5');
      }
      if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '30'); 
      }
      if (!url.searchParams.has('connect_timeout')) {
        url.searchParams.set('connect_timeout', '30'); 
      }
      return new PrismaClient({
        datasources: { db: { url: url.toString() } },
      });
    } catch {
    }
  }
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
