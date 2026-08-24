import { Badge, Button, Card, CardContent } from "@braincrew/ui";
import { Globe2, Mail, Plus, RefreshCw, ShieldCheck, Webhook } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";

const integrations = [
  {
    name: "Web public",
    kind: "Accès Web",
    detail: "HTTPS · domaines publics",
    icon: Globe2,
    color: "#7C5CFC",
    active: true,
  },
  {
    name: "Gmail commercial",
    kind: "Google Workspace",
    detail: "sales@braincrew.ai",
    icon: Mail,
    color: "#EA4335",
    active: true,
  },
  {
    name: "CRM principal",
    kind: "Connecteur CRM",
    detail: "Contacts et opportunités",
    icon: Webhook,
    color: "#FF9B45",
    active: true,
  },
];

export default function IntegrationsPage() {
  return (
    <DashboardShell active="/integrations">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Badge className="mb-4">Coffre de capacités</Badge>
          <h1 className="text-4xl font-black tracking-[-0.055em] md:text-5xl">
            Intégrations<span className="text-[var(--brand)]">.</span>
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            Connectez les outils que vos agents auront le droit d’utiliser.
          </p>
        </div>
        <Button variant="accent" size="lg">
          <Plus className="size-4" />
          Connecter un outil
        </Button>
      </section>
      <div className="mt-9 rounded-[22px] border border-emerald-600/10 bg-emerald-50/70 p-5">
        <div className="flex gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="font-bold text-emerald-950">Secrets isolés par organisation</p>
            <p className="mt-1 text-sm leading-6 text-emerald-900/65">
              Les jetons OAuth et clés API sont chiffrés avant stockage. Un agent ne reçoit que les
              capacités explicitement attachées à sa version.
            </p>
          </div>
        </div>
      </div>
      <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map(({ icon: Icon, ...integration }) => (
          <Card key={integration.name}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <span
                  className="grid size-12 place-items-center rounded-[18px] text-white"
                  style={{ background: integration.color }}
                >
                  <Icon className="size-5" />
                </span>
                <Badge className="bg-emerald-50 text-emerald-700">
                  <i className="mr-1.5 size-1.5 rounded-full bg-emerald-500" />
                  Connecté
                </Badge>
              </div>
              <h2 className="mt-6 text-xl font-black tracking-[-0.03em]">{integration.name}</h2>
              <p className="mt-1 text-xs font-semibold text-[var(--brand)]">{integration.kind}</p>
              <p className="mt-4 text-sm text-[var(--muted)]">{integration.detail}</p>
              <div className="mt-6 flex gap-2">
                <Button variant="outline" className="flex-1">
                  <RefreshCw className="size-3.5" />
                  Tester
                </Button>
                <Button variant="ghost">Configurer</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </DashboardShell>
  );
}
