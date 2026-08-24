"use client";

import { Button, Input, Label } from "@braincrew/ui";
import { Bot, Check, Plus, X } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/api";

type AgentOption = { versions: Array<{ id: string }> };

export function WorkflowBuilder() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    const name = String(new FormData(event.currentTarget).get("name"));
    const slug = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    try {
      const agents = await apiRequest<AgentOption[]>("/v1/agents");
      const versionIds = agents.flatMap((agent) => agent.versions.slice(0, 1).map(({ id }) => id));
      if (versionIds.length === 0) {
        throw new Error("At least one agent is required");
      }
      const scoutVersionId = versionIds[0];
      const inboxVersionId = versionIds[1] ?? versionIds[0];
      await apiRequest("/v1/workflows", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug,
          description: "Escouade créée depuis le constructeur visuel Braincrew.",
          publish: true,
          nodes: [
            { key: "start", name: "Départ", kind: "START", positionX: 80, positionY: 120 },
            {
              key: "scout",
              name: "Éclaireur marché",
              kind: "AGENT",
              agentVersionId: scoutVersionId,
              positionX: 320,
              positionY: 120,
            },
            {
              key: "brief",
              name: "Inbox Captain",
              kind: "AGENT",
              agentVersionId: inboxVersionId,
              positionX: 560,
              positionY: 120,
            },
            { key: "end", name: "Terminé", kind: "END", positionX: 800, positionY: 120 },
          ],
          edges: [
            { sourceKey: "start", targetKey: "scout" },
            { sourceKey: "scout", targetKey: "brief" },
            { sourceKey: "brief", targetKey: "end" },
          ],
        }),
      });
      setCreated(true);
      setTimeout(() => setOpen(false), 900);
    } catch {
      setError("L’escouade n’a pas pu être créée. Vérifiez l’API et les agents publiés.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        data-testid="workflow-builder-open"
        variant="accent"
        size="lg"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Nouvelle escouade
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--ink)]/40 p-5 backdrop-blur-sm">
          <form
            onSubmit={submit}
            className="w-full max-w-2xl rounded-[26px] bg-[#f8f6f2] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[var(--brand)]">
                  Constructeur no-code
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">
                  Composer une escouade
                </h2>
              </div>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
                className="grid size-10 place-items-center rounded-full bg-black/5"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-7">
              <Label htmlFor="workflow-name">Nom du processus</Label>
              <Input
                id="workflow-name"
                name="name"
                defaultValue="Qualification des opportunités"
                required
              />
            </div>
            <div className="mt-7 overflow-x-auto rounded-2xl border border-black/[.07] bg-[radial-gradient(circle,#00000012_1px,transparent_1px)] bg-[size:20px_20px] p-6">
              <div className="flex min-w-[610px] items-center gap-3">
                {["Départ", "Éclaireur marché", "Inbox Captain", "Terminé"].map((label, index) => (
                  <div key={label} className="contents">
                    <div className="flex min-w-32 items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
                      <span className="grid size-8 place-items-center rounded-lg bg-[var(--brand-soft)]">
                        <Bot className="size-4 text-[var(--brand)]" />
                      </span>
                      <span className="text-xs font-bold">{label}</span>
                    </div>
                    {index < 3 ? <span className="h-px w-5 bg-black/20" /> : null}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
              Le résultat de chaque agent devient l’entrée du suivant. La version publiée reste
              immuable et traçable.
            </p>
            {error ? (
              <p role="alert" className="mt-4 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <div className="mt-7 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button
                data-testid="workflow-builder-submit"
                type="submit"
                variant="accent"
                disabled={pending}
              >
                {created ? (
                  <>
                    <Check className="size-4" />
                    Escouade créée
                  </>
                ) : pending ? (
                  "Création…"
                ) : (
                  "Créer et publier"
                )}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
