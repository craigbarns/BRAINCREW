"use client";

import { Button, Input, Label, Select, Textarea } from "@braincrew/ui";
import { Bot, Check, Globe2, Mail, PanelsTopLeft, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest, BraincrewApiError } from "@/lib/api";

const capabilities = [
  {
    id: "web-access",
    label: "Accès Web",
    detail: "Recherche et lecture",
    icon: Globe2,
  },
  { id: "gmail", label: "Gmail", detail: "Lire, trier, préparer", icon: Mail },
  { id: "crm", label: "CRM", detail: "Contacts et opportunités", icon: PanelsTopLeft },
];

type ModelOption = { id: string; key: string; displayName: string };
type PluginOption = {
  id: string;
  status: string;
  definition: { key: string; displayName: string };
};

const fallbackModels: ModelOption[] = [
  {
    id: "00000000-0000-4000-8000-000000000020",
    key: "deepseek-chat",
    displayName: "DeepSeek Chat",
  },
  {
    id: "00000000-0000-4000-8000-000000000021",
    key: "deepseek-reasoner",
    displayName: "DeepSeek Reasoner",
  },
];

export function AgentBuilder({
  defaultOpen = false,
  onCreated,
}: {
  defaultOpen?: boolean;
  onCreated?: () => void | Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [selected, setSelected] = useState(["web-access"]);
  const [models, setModels] = useState<ModelOption[]>(fallbackModels);
  const [plugins, setPlugins] = useState<PluginOption[]>([]);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open) return;
    let active = true;
    void Promise.all([
      apiRequest<ModelOption[]>("/v1/models"),
      apiRequest<PluginOption[]>("/v1/plugins"),
    ])
      .then(([availableModels, availablePlugins]) => {
        if (!active) return;
        if (availableModels.length > 0) setModels(availableModels);
        setPlugins(availablePlugins.filter((plugin) => plugin.status === "ACTIVE"));
      })
      .catch(() => {
        // Submission will surface the actionable API error; the form stays usable.
      });
    return () => {
      active = false;
    };
  }, [open]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const slug = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    try {
      await apiRequest("/v1/agents", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug,
          systemPrompt: String(form.get("systemPrompt")),
          modelDefinitionId: String(form.get("model")),
          pluginInstallationIds: plugins
            .filter((plugin) => selected.includes(plugin.definition.key))
            .map((plugin) => plugin.id),
        }),
      });
      await onCreated?.();
      setSaved(true);
      setTimeout(() => {
        setOpen(false);
        setSaved(false);
      }, 900);
    } catch (caught) {
      if (caught instanceof BraincrewApiError && caught.status === 401) {
        setError("Votre session a expiré. Reconnectez-vous pour créer l’agent.");
        setTimeout(() => router.replace("/login"), 900);
      } else {
        setError(
          caught instanceof Error
            ? caught.message
            : "Impossible de créer l’agent. Réessayez dans un instant.",
        );
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button variant="accent" size="lg" onClick={() => setOpen(true)}>
        <Sparkles className="size-4" />
        Créer un agent
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 bg-[var(--ink)]/35 backdrop-blur-[3px]"
          onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
        >
          <div className="absolute inset-y-0 right-0 w-full max-w-[620px] overflow-y-auto bg-[#f8f6f2] shadow-[-30px_0_80px_rgba(0,0,0,.18)]">
            <form onSubmit={submit} className="min-h-full">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.06] bg-[#f8f6f2]/90 px-6 py-5 backdrop-blur-xl">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--brand)]">
                    Nouvel équipier
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                    Configurer l’agent
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Fermer"
                  onClick={() => setOpen(false)}
                  className="grid size-10 place-items-center rounded-full bg-black/[0.05]"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-8 p-6 md:p-8">
                <section>
                  <StepTitle number="01">Identité et mission</StepTitle>
                  <div className="grid gap-5">
                    <div>
                      <Label htmlFor="agent-name">Nom de l’agent</Label>
                      <Input
                        id="agent-name"
                        name="name"
                        defaultValue="Analyste opportunités"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="agent-prompt">Instructions système</Label>
                      <Textarea
                        id="agent-prompt"
                        name="systemPrompt"
                        rows={7}
                        defaultValue="Tu es un analyste commercial B2B. Analyse les signaux collectés, qualifie les opportunités et présente les trois actions prioritaires avec leurs preuves."
                        required
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <StepTitle number="02" tone="lime">
                    Cerveau
                  </StepTitle>
                  <Label htmlFor="model">Modèle sous-jacent</Label>
                  <Select key={models[0]?.id} id="model" name="model" defaultValue={models[0]?.id}>
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.displayName}
                        {model.key === "deepseek-reasoner"
                          ? " — analyse complexe"
                          : " — rapide et polyvalent"}
                      </option>
                    ))}
                  </Select>
                </section>

                <section>
                  <StepTitle number="03" tone="orange">
                    Capacités autorisées
                  </StepTitle>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {capabilities.map((capability) => {
                      const Icon = capability.icon;
                      const active = selected.includes(capability.id);
                      return (
                        <button
                          key={capability.id}
                          type="button"
                          onClick={() =>
                            setSelected((current) =>
                              active
                                ? current.filter((id) => id !== capability.id)
                                : [...current, capability.id],
                            )
                          }
                          className={`relative rounded-2xl border p-4 text-left transition ${active ? "border-[var(--brand)] bg-[var(--brand-soft)]/60" : "border-black/[0.08] bg-white hover:border-black/20"}`}
                        >
                          <Icon className="mb-4 size-5" />
                          <p className="text-sm font-bold">{capability.label}</p>
                          <p className="mt-1 text-[11px] leading-4 text-[var(--muted)]">
                            {capability.detail}
                          </p>
                          {active ? (
                            <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-[var(--brand)] text-white">
                              <Check className="size-3" />
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-[20px] bg-[var(--ink)] p-5 text-white">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-2xl bg-[var(--accent)] text-[var(--ink)]">
                      <Bot className="size-5" />
                    </div>
                    <div>
                      <p className="font-bold">Prêt à rejoindre l’équipage</p>
                      <p className="text-xs text-white/50">Version 1 créée en brouillon</p>
                    </div>
                  </div>
                </section>
                {error ? (
                  <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-black/[0.06] bg-[#f8f6f2]/90 p-5 backdrop-blur-xl">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" variant="accent" disabled={pending}>
                  {saved ? (
                    <>
                      <Check className="size-4" />
                      Agent créé
                    </>
                  ) : pending ? (
                    "Création…"
                  ) : (
                    <>
                      Créer l’agent <Sparkles className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function StepTitle({
  number,
  tone = "violet",
  children,
}: {
  number: string;
  tone?: "violet" | "lime" | "orange";
  children: React.ReactNode;
}) {
  const classes = {
    violet: "bg-[var(--brand-soft)] text-[var(--brand)]",
    lime: "bg-[#e9ffd0] text-[#47751b]",
    orange: "bg-[#ffe7cf] text-[#a55413]",
  };
  return (
    <div className="mb-5 flex items-center gap-3">
      <span
        className={`grid size-8 place-items-center rounded-xl text-xs font-black ${classes[tone]}`}
      >
        {number}
      </span>
      <h3 className="font-bold">{children}</h3>
    </div>
  );
}
