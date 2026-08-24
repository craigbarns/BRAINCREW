import { Badge, Card, CardContent, CardHeader, CardTitle } from "@braincrew/ui";
import { CreditCard, KeyRound, Palette, Shield, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { BrandingForm } from "@/components/branding-form";
import { BillingActions } from "@/components/billing-actions";

export default function SettingsPage() {
  return (
    <DashboardShell active="/settings">
      <section>
        <Badge className="mb-4">Administration</Badge>
        <h1 className="text-4xl font-black tracking-[-0.055em] md:text-5xl">
          Paramètres<span className="text-[var(--brand)]">.</span>
        </h1>
        <p className="mt-3 text-[var(--muted)]">Organisation, marque, accès et facturation.</p>
      </section>
      <section className="mt-9 grid gap-5 xl:grid-cols-[260px_1fr]">
        <nav className="space-y-1">
          {[
            { label: "Marque blanche", icon: Palette, active: true },
            { label: "Membres", icon: Users },
            { label: "Sécurité", icon: Shield },
            { label: "Clés API", icon: KeyRound },
            { label: "Facturation", icon: CreditCard },
          ].map(({ icon: Icon, ...item }) => (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${item.active ? "bg-[var(--ink)] text-white" : "text-[var(--muted)] hover:bg-black/[0.04]"}`}
            >
              <Icon className={`size-4 ${item.active ? "text-[var(--accent)]" : ""}`} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Marque blanche</CardTitle>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Cette identité visuelle sera appliquée au dashboard et aux emails.
              </p>
            </CardHeader>
            <CardContent>
              <BrandingForm />
              <div className="mt-9 border-t border-black/[0.06] pt-7">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Aperçu
                </p>
                <div className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-[#f4f1ed]">
                  <div className="flex items-center gap-3 border-b border-black/[0.06] bg-white/80 p-4">
                    <span className="grid size-8 place-items-center rounded-xl bg-[var(--ink)] text-xs font-black text-[var(--accent)]">
                      BL
                    </span>
                    <span className="font-black">Braincrew Labs</span>
                  </div>
                  <div className="p-6">
                    <div className="h-3 w-32 rounded-full bg-[var(--brand)]" />
                    <div className="mt-4 h-20 rounded-2xl bg-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Facturation Stripe</CardTitle>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Souscription et portail client sécurisés.
              </p>
            </CardHeader>
            <CardContent>
              <BillingActions />
            </CardContent>
          </Card>
        </div>
      </section>
    </DashboardShell>
  );
}
