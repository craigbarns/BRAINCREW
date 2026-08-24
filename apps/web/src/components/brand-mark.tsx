import { cn } from "@braincrew/ui";

export function BrandMark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)} aria-label="Braincrew">
      <div className="relative grid size-10 place-items-center overflow-hidden rounded-[14px] bg-[var(--ink)] text-[var(--accent)] shadow-lg">
        <span className="absolute -right-2 -top-2 size-6 rounded-full bg-[var(--brand)]" />
        <svg viewBox="0 0 32 32" className="relative size-6" fill="none" aria-hidden="true">
          <path
            d="M8 9.5C8 6.46 10.46 4 13.5 4c1.5 0 2.86.6 3.85 1.56A5.48 5.48 0 0 1 21 4c3.04 0 5.5 2.46 5.5 5.5 0 1.13-.34 2.18-.92 3.05A6 6 0 0 1 23 23.75V27H9v-3.25a6 6 0 0 1-2.58-11.2A5.46 5.46 0 0 1 8 9.5Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M12 11v8M16 9v12M20 11v8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {!compact && (
        <div>
          <div className="text-[17px] font-black tracking-[-0.04em]">braincrew</div>
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            agent operations
          </div>
        </div>
      )}
    </div>
  );
}
