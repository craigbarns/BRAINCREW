"use client";

import { Button, Input, Label } from "@braincrew/ui";
import { Check, Upload } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/api";

export function BrandingForm() {
  const [primary, setPrimary] = useState("#7C5CFC");
  const [accent, setAccent] = useState("#B8FF65");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/v1/organization/branding", {
        method: "PATCH",
        body: JSON.stringify({
          primaryColor: primary,
          secondaryColor: "#12101A",
          accentColor: accent,
          customDomain: String(form.get("domain")) || null,
          emailFromName: "Braincrew Labs",
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1400);
    } catch {
      setError("La marque n’a pas pu être enregistrée. Vérifiez la connexion à l’API.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <div>
        <Label>Logo de l’organisation</Label>
        <button
          type="button"
          className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-black/15 bg-white/50 p-4 text-left"
        >
          <span className="grid size-14 place-items-center rounded-2xl bg-[var(--ink)] font-black text-[var(--accent)]">
            BL
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold">Déposer un nouveau logo</span>
            <span className="mt-1 block text-xs text-[var(--muted)]">
              PNG, SVG ou WebP · 2 Mo maximum
            </span>
          </span>
          <Upload className="size-4 text-[var(--muted)]" />
        </button>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <ColorField id="primary" label="Couleur principale" value={primary} onChange={setPrimary} />
        <ColorField id="accent" label="Couleur accent" value={accent} onChange={setAccent} />
      </div>
      <div>
        <Label htmlFor="domain">Domaine personnalisé</Label>
        <Input id="domain" name="domain" defaultValue="crew.braincrew-labs.com" />
        <p className="mt-2 text-xs text-[var(--muted)]">
          Un enregistrement CNAME sera demandé avant activation.
        </p>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="accent">
        {saved ? (
          <>
            <Check className="size-4" />
            Enregistré
          </>
        ) : (
          "Enregistrer la marque"
        )}
      </Button>
    </form>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-14 cursor-pointer rounded-xl border border-black/10 bg-white p-1"
        />
        <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </div>
  );
}
