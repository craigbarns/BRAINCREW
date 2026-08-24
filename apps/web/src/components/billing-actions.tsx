"use client";

import { Button } from "@braincrew/ui";
import { CreditCard, ExternalLink } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/api";

export function BillingActions() {
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function redirect(path: string) {
    setPending(true);
    setError(undefined);
    try {
      const { url } = await apiRequest<{ url: string }>(path, { method: "POST" });
      window.location.assign(url);
    } catch {
      setError("Stripe n’est pas encore configuré sur cet environnement.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" onClick={() => redirect("/v1/billing/checkout")} disabled={pending}>
        <CreditCard className="size-4" />
        Choisir une offre
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => redirect("/v1/billing/portal")}
        disabled={pending}
      >
        Gérer l’abonnement <ExternalLink className="size-4" />
      </Button>
      {error ? (
        <p role="alert" className="w-full text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
