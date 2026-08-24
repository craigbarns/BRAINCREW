import { Badge, Button, Card, CardContent } from "@braincrew/ui";
import { Bot, MoreHorizontal, Play, Plus, Puzzle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AgentBuilder } from "@/components/agent-builder";
import { demoAgents } from "@/lib/demo-data";

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const query = await searchParams;
  return (
    <DashboardShell active="/agents">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Badge className="mb-4">8 équipiers</Badge>
          <h1 className="text-4xl font-black tracking-[-0.055em] md:text-5xl">
            Vos agents<span className="text-[var(--brand)]">.</span>
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            Configurez chaque cerveau, ses outils et ses limites.
          </p>
        </div>
        <AgentBuilder defaultOpen={query.create === "1"} />
      </section>
      <section className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {demoAgents.map((agent, index) => (
          <Card
            key={agent.id}
            className="animate-rise overflow-hidden"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="h-1.5" style={{ background: agent.hue }} />
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div
                  className="grid size-12 place-items-center rounded-[18px] text-white shadow-lg"
                  style={{ background: agent.hue }}
                >
                  <Bot className="size-5" />
                </div>
                <button className="grid size-9 place-items-center rounded-full hover:bg-black/[0.05]">
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <h2 className="text-xl font-black tracking-[-0.035em]">{agent.name}</h2>
                <span
                  className={`size-2 rounded-full ${agent.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-400"}`}
                />
              </div>
              <p className="mt-2 min-h-12 text-sm leading-6 text-[var(--muted)]">
                {agent.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge>{agent.model}</Badge>
                {agent.plugins.map((plugin) => (
                  <Badge key={plugin} className="bg-[var(--brand-soft)] text-[var(--brand)]">
                    <Puzzle className="mr-1 size-3" />
                    {plugin}
                  </Badge>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-black/[0.06] pt-5">
                <div>
                  <p className="text-2xl font-black">{agent.runs}</p>
                  <p className="text-[11px] text-[var(--muted)]">exécutions</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{agent.lastRun}</p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">dernière activité</p>
                </div>
              </div>
              <Button variant="outline" className="mt-5 w-full">
                <Play className="size-4" />
                Lancer un test
              </Button>
            </CardContent>
          </Card>
        ))}
        <button className="group min-h-[390px] rounded-[24px] border-2 border-dashed border-black/10 p-8 text-center transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]/25">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-black/[0.04] transition group-hover:bg-[var(--brand)] group-hover:text-white">
            <Plus className="size-5" />
          </span>
          <p className="mt-5 font-bold">Ajouter un équipier</p>
          <p className="mx-auto mt-2 max-w-[220px] text-sm leading-6 text-[var(--muted)]">
            Partez d’un rôle vierge ou d’un modèle métier.
          </p>
        </button>
      </section>
    </DashboardShell>
  );
}
