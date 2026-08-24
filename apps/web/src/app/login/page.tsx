import { Card, CardContent } from "@braincrew/ui";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[var(--ink)] p-14 text-white lg:flex lg:flex-col">
        <div className="absolute -right-28 -top-28 size-[440px] rounded-full bg-[var(--brand)] blur-[2px]" />
        <div className="absolute bottom-[-180px] left-[-100px] size-[420px] rounded-full bg-[var(--accent)] opacity-80" />
        <BrandMark className="relative z-10 text-white" />
        <div className="relative z-10 my-auto max-w-xl">
          <BadgeHero />
          <h1 className="mt-7 text-6xl font-black leading-[.98] tracking-[-0.065em]">
            Toute votre équipe IA.
            <br />
            <span className="text-[var(--accent)]">Un seul cockpit.</span>
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-white/55">
            Configurez des agents experts, faites-les collaborer et gardez le contrôle sur chaque
            action.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {["Isolation tenant", "Plugins contrôlés", "Logs complets"].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm font-semibold"
              >
                <Check className="mb-3 size-4 text-[var(--accent)]" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs text-white/30">
          braincrew.ai · Agent orchestration platform
        </p>
      </section>
      <section className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <BrandMark className="mb-12 lg:hidden" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
            Ravi de vous revoir
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">Monter à bord.</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Connectez-vous à votre espace entreprise.
          </p>
          <Card className="mt-8">
            <CardContent className="p-6">
              <LoginForm />
            </CardContent>
          </Card>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
            <ShieldCheck className="size-3.5" />
            Authentification sécurisée par Supabase
          </p>
        </div>
      </section>
    </main>
  );
}

function BadgeHero() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/70">
      <Sparkles className="size-3 text-[var(--accent)]" />
      L’orchestration IA, sans la complexité
    </span>
  );
}
