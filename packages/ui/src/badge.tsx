import type { HTMLAttributes } from "react";
import { cn } from "./lib";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-black/[0.07] bg-black/[0.035] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]",
        className,
      )}
      {...props}
    />
  );
}
