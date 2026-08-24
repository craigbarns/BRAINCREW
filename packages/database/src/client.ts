import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

const globalForPrisma = globalThis as unknown as {
  braincrewPrisma?: PrismaClient;
};

export function createPrismaClient(connectionString = process.env.DATABASE_URL): PrismaClient {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to create the Prisma client.");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.braincrewPrisma) {
    globalForPrisma.braincrewPrisma = createPrismaClient();
  }

  return globalForPrisma.braincrewPrisma;
}

export type BraincrewPrismaClient = PrismaClient;
