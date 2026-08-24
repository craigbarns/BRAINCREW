import type { Prisma, PrismaClient } from "./generated/prisma/client.js";

export interface TenantContext {
  organizationId: string;
  userId?: string;
  worker?: boolean;
}

export type TenantTransaction = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * Runs all work on one connection and scopes PostgreSQL RLS with SET LOCAL.
 * The caller must derive organizationId from a verified membership or queue job.
 */
export async function withTenant<T>(
  prisma: PrismaClient,
  context: TenantContext,
  operation: (transaction: TenantTransaction) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`
      SELECT
        set_config('app.current_organization_id', ${context.organizationId}, true),
        set_config('app.current_user_id', ${context.userId ?? ""}, true),
        set_config('app.is_worker', ${context.worker ? "true" : "false"}, true)
    `;

    return operation(transaction);
  });
}

export function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
