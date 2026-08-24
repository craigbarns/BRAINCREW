import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@braincrew/ui";
import { ArrowUpRight, Bot, CircleDollarSign, Network, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { demoExecutions, demoOverview } from "@/lib/demo-data";

const bars = [32, 48, 38, 62, 52, 72, 58, 86, 68, 92, 76, 100, 82, 94];

export default function DashboardPage() {
  const stats = [
    {
      label: "Agents actifs",
      value: demoOverview.agents,
      delta: "+2 ce mois",
      icon: Bot,
      color: "bg-[#e7e0ff] text-[#6f4ff2]",
    },
    {
      label: "Escouades",
      value: demoOverview.workflows,
      delta: "3 planifiées",
      icon: Network,
      color: "bg-[#e9ffd0] text-[#47751b]",
    },
    {
      label: "Exécutions",
      value: demoOverview.executions,
      delta: "+18,4%",
      icon: Zap,
      color: "bg-[#ffe7cf] text-[#a55413]",
    },
    {
      label: "Coût du mois",
      value: `${demoOverview.cost.toFixed(2)} €`,
      delta: "−7,2% / run",
      icon: CircleDollarSign,
      color: "bg-[#ddf7f4] text-[#13756b]",
    },
  ];

  return (
    <DashboardShell active="/dashboard">
      <section className="animate-rise flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Badge className="mb-4 border-[var(--brand)]/15 bg-[var(--brand-soft)] text-[var(--brand)]">
            Lundi 24 août
          </Badge>
          <h1 className="text-4xl font-black tracking-[-0.055em] md:text-5xl">
            Bonjour Gregory<span className="text-[var(--brand)]">.</span>
          </h1>
          <p className="mt-3 max-w-xl text-[var(--muted)]">
            Votre équipage a traité 31 tâches depuis ce matin. Deux signaux demandent votre
            attention.
          </p>
        </div>
        <Button variant="accent" size="lg" asChild>
          <Link href="/agents?create=1">
            <Sparkles className="size-4" />
            Créer un agent
          </Link>
        </Button>
      </section>

      <section className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="animate-rise"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`grid size-10 place-items-center rounded-2xl ${stat.color}`}>
                    <Icon className="size-[18px]" />
                  </div>
                  <ArrowUpRight className="size-4 text-black/25" />
                </div>
                <p className="mt-6 text-3xl font-black tracking-[-0.04em]">{stat.value}</p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-[var(--muted)]">{stat.label}</span>
                  <span className="font-semibold text-emerald-700">{stat.delta}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.85fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Activité de l’équipage</CardTitle>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Exécutions sur les 14 derniers jours
              </p>
            </div>
            <Badge>14 jours</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-end gap-2 rounded-[18px] bg-gradient-to-b from-[var(--brand-soft)]/50 to-transparent px-4 pb-4 pt-8">
              {bars.map((height, index) => (
                <div key={index} className="group relative flex-1">
                  <div
                    className="rounded-t-md bg-[var(--brand)]/25 transition-all group-hover:bg-[var(--brand)]"
                    style={{ height: `${height * 1.65}px` }}
                  />
                  <span className="absolute -bottom-5 left-1/2 hidden -translate-x-1/2 text-[9px] text-black/35 first:block sm:block">
                    {index % 3 === 0 ? index + 11 : ""}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-7 flex items-center gap-5 text-xs text-[var(--muted)]">
              <span className="flex items-center gap-2">
                <i className="size-2 rounded-full bg-[var(--brand)]" />
                248 réussies
              </span>
              <span className="flex items-center gap-2">
                <i className="size-2 rounded-full bg-[#ff8f70]" />7 en erreur
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-[var(--ink)] text-white">
          <CardHeader>
            <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-[var(--accent)] text-[var(--ink)]">
              <Sparkles className="size-5" />
            </div>
            <CardTitle className="text-2xl">Le signal du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-7 text-white/65">
              Éclaireur marché a détecté une nouvelle offre “Enterprise AI” chez deux concurrents.
              Les prix semblent converger autour de 890 €/mois.
            </p>
            <Button
              variant="outline"
              className="mt-7 border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white"
            >
              Ouvrir le rapport <ArrowUpRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card className="mt-5">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Dernières exécutions</CardTitle>
            <p className="mt-1 text-sm text-[var(--muted)]">Ce qui se passe dans votre équipage</p>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/executions">
              Tout voir <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 pb-2">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-y border-black/[0.05] bg-black/[0.015] text-[10px] uppercase tracking-[0.12em] text-black/40">
              <tr>
                <th className="px-6 py-3 font-semibold">Run</th>
                <th className="px-4 py-3 font-semibold">Escouade</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold">Durée</th>
                <th className="px-4 py-3 font-semibold">Tokens</th>
                <th className="px-6 py-3 text-right font-semibold">Heure</th>
              </tr>
            </thead>
            <tbody>
              {demoExecutions.map((run) => (
                <tr key={run.id} className="border-b border-black/[0.045] last:border-0">
                  <td className="px-6 py-4 font-mono text-xs text-black/45">{run.id}</td>
                  <td className="px-4 py-4 font-semibold">{run.name}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${run.status === "SUCCEEDED" ? "bg-emerald-50 text-emerald-700" : run.status === "RUNNING" ? "bg-violet-50 text-violet-700" : "bg-red-50 text-red-700"}`}
                    >
                      <i
                        className={`size-1.5 rounded-full ${run.status === "SUCCEEDED" ? "bg-emerald-500" : run.status === "RUNNING" ? "animate-pulse bg-violet-500" : "bg-red-500"}`}
                      />
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[var(--muted)]">{run.duration}</td>
                  <td className="px-4 py-4 text-[var(--muted)]">{run.tokens}</td>
                  <td className="px-6 py-4 text-right text-[var(--muted)]">{run.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
