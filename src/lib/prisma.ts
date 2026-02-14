import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL!;
const isPrismaPostgres = databaseUrl.startsWith("prisma+postgres://");

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    isPrismaPostgres
      ? { accelerateUrl: databaseUrl }
      : { datasourceUrl: databaseUrl }
  );

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
