"use client";

import { Button, Input, Label } from "@braincrew/ui";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      router.push("/dashboard");
      return;
    }

    const result = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (result.error) {
      setError(result.error.message);
      setPending(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function signInWithGoogle() {
    setPending(true);
    setError(undefined);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      router.push("/dashboard");
      return;
    }
    const result = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (result.error) {
      setError(result.error.message);
      setPending(false);
    }
  }

  return (
    <>
      <form className="space-y-5" onSubmit={signIn}>
        <div>
          <Label htmlFor="email">Email professionnel</Label>
          <Input id="email" name="email" type="email" placeholder="vous@entreprise.com" required />
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••••••"
            required
          />
        </div>
        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <Button variant="accent" size="lg" className="w-full" disabled={pending}>
          {pending ? "Connexion…" : "Continuer"} <ArrowRight className="size-4" />
        </Button>
      </form>
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-black/[0.07]" />
        <span className="text-[10px] uppercase tracking-wider text-black/30">ou</span>
        <div className="h-px flex-1 bg-black/[0.07]" />
      </div>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={signInWithGoogle}
      >
        Continuer avec Google
      </Button>
    </>
  );
}
