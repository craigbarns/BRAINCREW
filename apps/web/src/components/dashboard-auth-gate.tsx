"use client";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      router.replace("/login?error=configuration");
      return;
    }

    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) setAuthorized(true);
      else router.replace("/login");
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!active) return;
        if (session) setAuthorized(true);
        else router.replace("/login");
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  if (!authorized) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--paper)]">
        <div className="text-center">
          <LoaderCircle className="mx-auto size-6 animate-spin text-[var(--brand)]" />
          <p className="mt-3 text-sm text-[var(--muted)]">Vérification de votre session…</p>
        </div>
      </main>
    );
  }

  return children;
}
