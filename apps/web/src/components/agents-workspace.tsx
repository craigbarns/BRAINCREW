"use client";

import { Badge, Button, Card, CardContent } from "@braincrew/ui";
import { Bot, LoaderCircle, Play, Puzzle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AgentBuilder } from "@/components/agent-builder";
import { apiRequest, BraincrewApiError } from "@/lib/api";

type AgentRecord = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  updatedAt: string;
  versions: Array<{
    id: string;
    systemPrompt: string;
    model: { displayName: string };
    plugins: Array<{ installation: { id: string; name: string } }>;
  }>;
};

const hues = ["#7C5CFC", "#6B9348", "#F28C3A", "#247BA0", "#D1495B"];

export function AgentsWorkspace({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentRecord[]>();
  const [error, setError] = useState<string>();

  const loadAgents = useCallback(async () => {
    try {
      const records = await apiRequest<AgentRecord[]>("/v1/agents");
      setAgents(records);
      setError(undefined);
    } catch (caught) {
      if (caught instanceof BraincrewApiError && caught.status === 401) {
        router.replace("/login");
        return;
      }
      setError(caught instanceof Error ? caught.message : "Impossible de charger vos agents.");
    }
  }, [router]);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  return (
    <>
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Badge className="mb-4">
            {agents ? agents.length : "—"} équipier{agents?.length === 1 ? "" : "s"}
          </Badge>
          <h1 className="text-4xl font-black tracking-[-0.055em] md:text-5xl">
            Vos agents<span className="text-[var(--brand)]">.</span>
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            Configurez chaque cerveau, ses outils et ses limites.
          </p>
        </div>
        <AgentBuilder defaultOpen={defaultOpen} onCreated={loadAgents} />
      </section>

      {error ? (
        <Card className="mt-9 border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" onClick={() => void loadAgents()}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!agents && !error ? (
        <div className="mt-16 text-center text-[var(--muted)]">
          <LoaderCircle className="mx-auto size-6 animate-spin text-[var(--brand)]" />
          <p className="mt-3 text-sm">Chargement de l’équipage…</p>
        </div>
      ) : null}

      {agents?.length === 0 ? (
        <Card className="mt-9 border-dashed">
          <CardContent className="p-10 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]">
              <Bot className="size-6" />
            </span>
            <h2 className="mt-5 text-xl font-black">Votre équipage est prêt à prendre forme.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
              Créez votre premier agent, choisissez son cerveau et autorisez uniquement les outils
              dont il a besoin.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {agents && agents.length > 0 ? (
        <section className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent, index) => {
            const version = agent.versions[0];
            return (
              <Card
                key={agent.id}
                className="animate-rise overflow-hidden"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="h-1.5" style={{ background: hues[index % hues.length] }} />
                <CardContent className="p-6">
                  <div
                    className="grid size-12 place-items-center rounded-[18px] text-white shadow-lg"
                    style={{ background: hues[index % hues.length] }}
                  >
                    <Bot className="size-5" />
                  </div>
                  <div className="mt-6 flex items-center gap-2">
                    <h2 className="text-xl font-black tracking-[-0.035em]">{agent.name}</h2>
                    <span
                      className={`size-2 rounded-full ${agent.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-400"}`}
                    />
                  </div>
                  <p className="mt-2 line-clamp-3 min-h-16 text-sm leading-6 text-[var(--muted)]">
                    {agent.description ??
                      version?.systemPrompt ??
                      "Agent Braincrew en configuration."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {version?.model ? <Badge>{version.model.displayName}</Badge> : null}
                    {version?.plugins.map(({ installation }) => (
                      <Badge
                        key={installation.id}
                        className="bg-[var(--brand-soft)] text-[var(--brand)]"
                      >
                        <Puzzle className="mr-1 size-3" />
                        {installation.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-6 border-t border-black/[0.06] pt-5">
                    <p className="text-sm font-bold">Version 1 · {agent.status.toLowerCase()}</p>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">
                      Mis à jour {formatDate(agent.updatedAt)}
                    </p>
                  </div>
                  <Button variant="outline" className="mt-5 w-full" disabled>
                    <Play className="size-4" />
                    Test bientôt disponible
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>
      ) : null}
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
