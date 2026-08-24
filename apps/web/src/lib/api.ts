import { getSupabaseBrowserClient } from "./supabase";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const demoOrganizationId = "00000000-0000-4000-8000-000000000010";

export class BraincrewApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BraincrewApiError";
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const supabase = typeof window === "undefined" ? null : getSupabaseBrowserClient();
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  // The Supabase onboarding trigger creates the user's first organization with
  // the same UUID. This keeps the initial workspace deterministic while the API
  // remains ready for an explicit organization switcher in a later iteration.
  const organizationId = session?.user.id ?? demoOrganizationId;
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-organization-id": organizationId,
      ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let message = `Braincrew API ${response.status}`;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      // Keep the status-based fallback when an upstream proxy returns non-JSON.
    }
    throw new BraincrewApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}
