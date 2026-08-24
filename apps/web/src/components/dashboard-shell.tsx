import { Bell, Command, Search } from "lucide-react";
import { BrandMark } from "./brand-mark";
import { DashboardAuthGate } from "./dashboard-auth-gate";
import { MobileNavigation, Sidebar } from "./sidebar";

export function DashboardShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthGate>
      <div className="min-h-screen min-w-0 overflow-x-clip lg:pl-[260px]">
        <Sidebar active={active} />
        <header className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b border-black/[0.05] bg-[var(--paper)]/80 px-5 backdrop-blur-xl md:px-8 lg:px-10">
          <BrandMark className="md:hidden" />
          <div className="relative hidden w-full max-w-sm md:block">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-black/35" />
            <input
              className="h-10 w-full rounded-full border border-black/[0.07] bg-white/60 pl-10 pr-16 text-sm outline-none focus:border-[var(--brand)]"
              placeholder="Rechercher agents, runs…"
            />
            <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md border border-black/10 bg-white px-1.5 py-0.5 text-[10px] text-black/40">
              <Command className="size-2.5" /> K
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative grid size-10 place-items-center rounded-full border border-black/[0.07] bg-white/70">
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-[var(--danger)]" />
            </button>
            <div className="grid size-10 place-items-center rounded-full bg-[var(--ink)] text-xs font-bold text-white">
              GB
            </div>
          </div>
        </header>
        <main className="mx-auto min-w-0 max-w-[1480px] px-5 pb-28 pt-8 md:px-8 lg:px-10 lg:py-10">
          {children}
        </main>
        <MobileNavigation active={active} />
      </div>
    </DashboardAuthGate>
  );
}
