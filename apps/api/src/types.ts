import type { AuthIdentity } from "@braincrew/auth";

export interface RequestContext extends AuthIdentity {
  organizationId: string;
}

declare module "fastify" {
  interface FastifyRequest {
    braincrew: RequestContext;
    rawBody?: string | Buffer;
  }
}
