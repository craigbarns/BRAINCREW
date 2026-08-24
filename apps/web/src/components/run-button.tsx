"use client";

import { Button } from "@braincrew/ui";
import { Check, Play } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/api";

export function RunButton({
  kind,
  targetId,
  className,
  size = "sm",
}: {
  kind: "AGENT" | "WORKFLOW";
  targetId: string;
  className?: string;
  size?: "sm" | "default";
}) {
  const [state, setState] = useState<"idle" | "pending" | "queued" | "error">("idle");
  async function run() {
    setState("pending");
    try {
      await apiRequest("/v1/executions", {
        method: "POST",
        body: JSON.stringify({
          kind,
          ...(kind === "AGENT" ? { agentVersionId: targetId } : { workflowVersionId: targetId }),
          input: { source: "dashboard", requestedAt: new Date().toISOString() },
        }),
      });
      setState("queued");
    } catch {
      setState("error");
    }
  }
  return (
    <Button
      data-testid={`run-${kind.toLowerCase()}`}
      type="button"
      variant={state === "error" ? "outline" : "default"}
      size={size}
      className={className}
      onClick={run}
      disabled={state === "pending"}
    >
      {state === "queued" ? (
        <>
          <Check className="size-4" />
          En file
        </>
      ) : state === "pending" ? (
        "Lancement…"
      ) : state === "error" ? (
        "Réessayer"
      ) : (
        <>
          <Play className="size-4" />
          Lancer
        </>
      )}
    </Button>
  );
}
