import { Badge, Button, Card, CardContent } from "@braincrew/ui";
import { Bot, GitBranch, Mail, Webhook, Zap } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RunButton } from "@/components/run-button";
import { WorkflowBuilder } from "@/components/workflow-builder";

const nodeStyle =
  "flex min-w-[170px] items-center gap-3 rounded-2xl border border-black/[0.08] bg-white p-3 shadow-sm";

export default function WorkflowsPage() {
  return (
    <DashboardShell active="/workflows">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Badge className="mb-4">Orchestration</Badge>
          <h1 className="text-4xl font-black tracking-[-0.055em] md:text-5xl">
            Escouades<span className="text-[var(--brand)]">.</span>
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            Faites collaborer plusieurs agents autour d’un processus métier.
          </p>
        </div>
        <WorkflowBuilder />
      </section>
      <section className="mt-9 grid gap-5 xl:grid-cols-[1.5fr_.6fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5">
            <div>
              <h2 className="font-black">Radar concurrentiel</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">Version 1 · publiée</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Modifier
              </Button>
              <RunButton kind="WORKFLOW" targetId="00000000-0000-4000-8000-000000000061" />
            </div>
          </div>
          <CardContent className="relative min-h-[520px] overflow-auto bg-[radial-gradient(circle,#00000012_1px,transparent_1px)] bg-[size:22px_22px] p-8">
            <div className="mx-auto flex w-max flex-col items-center gap-7">
              <WorkflowNode
                icon={Zap}
                tone="bg-[#e9ffd0]"
                title="Chaque lundi"
                detail="08:00 Europe/Paris"
              />
              <Connector />
              <WorkflowNode
                icon={Bot}
                tone="bg-[var(--brand-soft)] text-[var(--brand)]"
                title="Éclaireur marché"
                detail="Collecte les signaux"
              />
              <Connector />
              <WorkflowNode
                icon={GitBranch}
                tone="bg-[#ffe7cf]"
                title="Signal important ?"
                detail="Score supérieur à 70"
              />
              <Connector />
              <div className="flex gap-16">
                <WorkflowNode
                  icon={Mail}
                  tone="bg-[#ddf7f4]"
                  title="Envoyer le brief"
                  detail="Équipe stratégie"
                />
                <WorkflowNode
                  icon={Webhook}
                  tone="bg-black/[0.05]"
                  title="Archiver"
                  detail="Notion · veille"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                Performance
              </p>
              <p className="mt-5 text-4xl font-black">97,2%</p>
              <p className="mt-1 text-sm text-emerald-700">+1,4% ce mois</p>
              <div className="mt-6 h-2 rounded-full bg-black/[0.06]">
                <div className="h-full w-[97%] rounded-full bg-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                Dernier passage
              </p>
              <p className="mt-5 text-xl font-black">Ce matin, 08:00</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                14 sources analysées, 3 signaux retenus, 1 rapport envoyé.
              </p>
              <Badge className="mt-5 bg-emerald-50 text-emerald-700">Terminé en 1m 42s</Badge>
            </CardContent>
          </Card>
        </div>
      </section>
    </DashboardShell>
  );
}

function WorkflowNode({
  icon: Icon,
  tone,
  title,
  detail,
}: {
  icon: typeof Bot;
  tone: string;
  title: string;
  detail: string;
}) {
  return (
    <div className={nodeStyle}>
      <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="text-[10px] text-[var(--muted)]">{detail}</p>
      </div>
    </div>
  );
}

function Connector() {
  return <div className="h-7 w-px bg-black/20" />;
}
