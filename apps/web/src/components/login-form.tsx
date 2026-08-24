"use client";

import { Button, Input, Label } from "@braincrew/ui";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace("/dashboard");
    })();
  }, [router]);

  async function submitCredentials(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setMessage(undefined);
    const form = new FormData(event.currentTarget);
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setError("Supabase Auth n’est pas configuré sur ce déploiement.");
      setPending(false);
      return;
    }

    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const result =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                first_name: String(form.get("firstName")),
                company_name: String(form.get("companyName")),
              },
              emailRedirectTo: `${window.location.origin}/dashboard`,
            },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setError(result.error.message);
      setPending(false);
      return;
    }

    if (!result.data.session) {
      setMessage("Compte créé. Ouvrez l’email de confirmation pour activer votre cockpit.");
      setPending(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  async function signInWithGoogle() {
    setPending(true);
    setError(undefined);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase Auth n’est pas configuré sur ce déploiement.");
      setPending(false);
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
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-black/[0.04] p-1">
        <button
          type="button"
          className={`rounded-lg px-3 py-2 text-sm font-bold transition ${mode === "signin" ? "bg-white shadow-sm" : "text-[var(--muted)]"}`}
          onClick={() => {
            setMode("signin");
            setError(undefined);
            setMessage(undefined);
          }}
        >
          Connexion
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-2 text-sm font-bold transition ${mode === "signup" ? "bg-white shadow-sm" : "text-[var(--muted)]"}`}
          onClick={() => {
            setMode("signup");
            setError(undefined);
            setMessage(undefined);
          }}
        >
          Créer un compte
        </button>
      </div>
      <form className="space-y-5" onSubmit={submitCredentials}>
        {mode === "signup" ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" name="firstName" autoComplete="given-name" required />
            </div>
            <div>
              <Label htmlFor="companyName">Entreprise</Label>
              <Input id="companyName" name="companyName" autoComplete="organization" required />
            </div>
          </div>
        ) : null}
        <div>
          <Label htmlFor="email">Email professionnel</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="vous@entreprise.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={8}
            placeholder="••••••••••••"
            required
          />
        </div>
        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
        <Button variant="accent" size="lg" className="w-full" disabled={pending}>
          {pending
            ? mode === "signup"
              ? "Création…"
              : "Connexion…"
            : mode === "signup"
              ? "Créer mon cockpit"
              : "Continuer"}{" "}
          <ArrowRight className="size-4" />
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
