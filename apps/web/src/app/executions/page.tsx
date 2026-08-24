import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@braincrew/ui";
import { CircleCheck, CircleX, Download, Filter, Radio } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { demoExecutions } from "@/lib/demo-data";

export default function ExecutionsPage() {
  return (
    <DashboardShell active="/executions">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Badge className="mb-4">Monitoring temps réel</Badge>
          <h1 className="text-4xl font-black tracking-[-0.055em] md:text-5xl">
            Exécutions<span className="text-[var(--brand)]">.</span>
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            Inspectez chaque décision, outil appelé, token et coût.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="size-4" />
            Filtrer
          </Button>
          <Button variant="outline">
            <Download className="size-4" />
            Exporter
          </Button>
        </div>
      </section>
      <section className="mt-9 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Flux des exécutions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoExecutions
              .concat(
                demoExecutions
                  .slice(0, 2)
                  .map((item, i) => ({ ...item, id: `RUN-${244 - i}`, time: `07:${40 - i * 12}` })),
              )
              .map((run, index) => (
                <div
                  key={run.id}
                  className={`flex items-center gap-4 rounded-2xl border p-4 transition hover:bg-black/[0.015] ${index === 1 ? "border-[var(--brand)] bg-[var(--brand-soft)]/30" : "border-black/[0.06]"}`}
                >
                  <span
                    className={`grid size-10 place-items-center rounded-2xl ${run.status === "SUCCEEDED" ? "bg-emerald-50 text-emerald-600" : run.status === "RUNNING" ? "bg-violet-50 text-violet-600" : "bg-red-50 text-red-600"}`}
                  >
                    {run.status === "SUCCEEDED" ? (
                      <CircleCheck className="size-5" />
                    ) : run.status === "RUNNING" ? (
                      <Radio className="size-5 animate-pulse" />
                    ) : (
                      <CircleX className="size-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold">{run.name}</p>
                      <span className="font-mono text-[10px] text-black/30">{run.id}</span>
                    </div>
                    <div className="mt-1 flex gap-3 text-[11px] text-[var(--muted)]">
                      <span>{run.duration}</span>
                      <span>{run.tokens} tokens</span>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--muted)]">{run.time}</span>
                </div>
              ))}
          </CardContent>
        </Card>
        <Card className="h-fit overflow-hidden">
          <div className="bg-[var(--ink)] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
                  RUN-247
                </p>
                <h2 className="mt-2 text-xl font-black">Triage boîte commerciale</h2>
              </div>
              <Badge className="border-white/10 bg-white/10 text-white">
                <i className="mr-2 size-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
                Running
              </Badge>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-white/[0.06] p-3">
                <p className="font-black">24s</p>
                <p className="mt-1 text-[9px] uppercase tracking-wider text-white/40">Durée</p>
              </div>
              <div className="rounded-xl bg-white/[0.06] p-3">
                <p className="font-black">3,1k</p>
                <p className="mt-1 text-[9px] uppercase tracking-wider text-white/40">Tokens</p>
              </div>
              <div className="rounded-xl bg-white/[0.06] p-3">
                <p className="font-black">0,04 €</p>
                <p className="mt-1 text-[9px] uppercase tracking-wider text-white/40">Coût</p>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">
              Journal en direct
            </p>
            <div className="space-y-0">
              {[
                {
                  time: "10:18:02",
                  title: "Agent démarré",
                  detail: "Inbox Captain · DeepSeek Chat",
                  done: true,
                },
                {
                  time: "10:18:07",
                  title: "Gmail interrogé",
                  detail: "18 messages non lus",
                  done: true,
                },
                {
                  time: "10:18:16",
                  title: "Classification",
                  detail: "3 urgents · 7 à suivre · 8 archivés",
                  done: true,
                },
                {
                  time: "maintenant",
                  title: "Préparation des réponses",
                  detail: "Génération en cours…",
                  done: false,
                },
              ].map((event, index) => (
                <div key={event.title} className="relative flex gap-4 pb-7 last:pb-0">
                  <div
                    className={`relative z-10 mt-1 size-3 rounded-full border-2 border-white ${event.done ? "bg-[var(--brand)]" : "animate-pulse bg-[var(--accent)]"}`}
                  />
                  {index < 3 && (
                    <div className="absolute left-[5px] top-4 h-full w-px bg-black/10" />
                  )}
                  <div>
                    <p className="text-sm font-bold">{event.title}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{event.detail}</p>
                    <p className="mt-1 font-mono text-[9px] text-black/30">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </DashboardShell>
  );
}
