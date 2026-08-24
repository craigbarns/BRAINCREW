import {
  Activity,
  Bot,
  ChevronDown,
  LayoutDashboard,
  Network,
  PlugZap,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { BrandMark } from "./brand-mark";

const navigation = [
  { href: "/dashboard", label: "Vue d’ensemble", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/workflows", label: "Escouades", icon: Network },
  { href: "/executions", label: "Exécutions", icon: Activity },
  { href: "/integrations", label: "Intégrations", icon: PlugZap },
];

export function MobileNavigation({ active }: { active: string }) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 rounded-2xl border border-white/20 bg-[var(--ink)]/95 p-1.5 text-white shadow-2xl backdrop-blur-xl lg:hidden">
      {navigation.map((item) => {
        const Icon = item.icon;
        const selected = active === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-semibold ${selected ? "bg-white/10 text-[var(--accent)]" : "text-white/55"}`}
          >
            <Icon className="size-4" />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ active }: { active: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[260px] border-r border-black/[0.06] bg-[#f8f6f2]/90 px-4 py-5 backdrop-blur-xl lg:flex lg:flex-col">
      <BrandMark className="px-2" />
      <button className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-black/[0.07] bg-white/70 p-3 text-left shadow-sm">
        <span className="grid size-8 place-items-center rounded-xl bg-[var(--brand-soft)] text-xs font-black text-[var(--brand)]">
          BL
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">Braincrew Labs</span>
          <span className="block text-[11px] text-[var(--muted)]">Plan Growth</span>
        </span>
        <ChevronDown className="size-4 text-[var(--muted)]" />
      </button>

      <nav className="mt-7 space-y-1">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black/35">
          Piloter
        </p>
        {navigation.map((item) => {
          const Icon = item.icon;
          const selected = active === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${selected ? "bg-[var(--ink)] text-white shadow-lg" : "text-[var(--muted)] hover:bg-black/[0.04] hover:text-[var(--ink)]"}`}
            >
              <Icon className={`size-[18px] ${selected ? "text-[var(--accent)]" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="mb-4 rounded-[20px] bg-[var(--brand-soft)] p-4">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold">
            <span>Tokens du mois</span>
            <span>64%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
            <div className="h-full w-[64%] rounded-full bg-[var(--brand)]" />
          </div>
          <p className="mt-2 text-[11px] text-[var(--muted)]">2,3 M sur 3,6 M inclus</p>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--muted)] hover:bg-black/[0.04] hover:text-[var(--ink)]"
        >
          <Settings className="size-[18px]" /> Paramètres
        </Link>
      </div>
    </aside>
  );
}
