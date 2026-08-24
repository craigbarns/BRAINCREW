import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const uuid = z.uuid();

export interface AuthIdentity {
  userId: string;
  email?: string;
}

export interface ResolveIdentityOptions {
  authorization?: string;
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  bypass?: boolean;
  bypassUserId?: string;
}

export class AuthenticationError extends Error {
  readonly statusCode = 401;

  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

function bearerToken(authorization?: string): string | undefined {
  if (!authorization) return undefined;
  const [scheme, token] = authorization.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : undefined;
}

export async function resolveIdentity(options: ResolveIdentityOptions): Promise<AuthIdentity> {
  if (options.bypass) {
    const userId = uuid.parse(options.bypassUserId ?? "00000000-0000-4000-8000-000000000001");
    return { userId, email: "founder@braincrew.ai" };
  }

  const token = bearerToken(options.authorization);
  if (!token || !options.supabaseUrl || !options.supabasePublishableKey) {
    throw new AuthenticationError();
  }

  const supabase = createClient(options.supabaseUrl, options.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new AuthenticationError("Invalid or expired Supabase token");
  }

  return {
    userId: uuid.parse(data.user.id),
    ...(data.user.email ? { email: data.user.email } : {}),
  };
}
