"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Bank,
  ChartLineUp,
  ClipboardText,
  Coins,
  GearSix,
  House,
  List,
  Scales,
  Target,
} from "@phosphor-icons/react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "./kit";
import { useStore } from "@/lib/state/store";
import { useApp } from "@/lib/state/useApp";

const NAV = [
  { href: "/app", label: "Overview", icon: House },
  { href: "/app/mutual-funds", label: "Mutual funds", icon: ChartLineUp },
  { href: "/app/stocks", label: "Stocks", icon: Coins },
  { href: "/app/fixed-assets", label: "Fixed and retirement", icon: Bank },
  { href: "/app/net-worth", label: "Net worth", icon: Scales },
  { href: "/app/goals", label: "Goals", icon: Target },
  { href: "/app/review", label: "Monthly review", icon: ClipboardText },
  { href: "/app/settings", label: "Settings", icon: GearSix },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/app" ? path === "/app" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className="flex min-h-[44px] items-center gap-3 rounded-[4px] border px-3 text-[15px] transition-colors duration-200"
            style={{
              background: active ? "var(--glass-brass-fill)" : "transparent",
              borderColor: active ? "var(--glass-brass-border)" : "transparent",
              color: active ? "var(--brass-strong)" : "var(--text-2)",
              fontWeight: active ? 600 : 500,
            }}
          >
            <Icon size={20} weight="light" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const { status, error } = useApp();
  const reset = useStore((s) => s.reset);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="glass sticky top-0 hidden h-dvh flex-col justify-between rounded-none border-y-0 border-l-0 p-5 lg:flex">
        <div>
          <Link href="/" aria-label="Crorpus home" className="block px-2 py-3">
            <Logo />
          </Link>
          <div className="mt-8">
            <NavList />
          </div>
        </div>
        <div className="space-y-3 px-1">
          <Badge tone="brass">Demo data</Badge>
          <p className="text-[13px] leading-snug text-ink-3">Everything here is sample data stored in your browser.</p>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="glass sticky top-0 z-30 flex h-16 items-center justify-between rounded-none border-x-0 border-t-0 px-4 sm:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <button type="button" className="btn btn-icon btn-sm" onClick={() => setMenu(true)} aria-label="Open menu">
              <List size={20} weight="light" />
            </button>
            <Link href="/" aria-label="Crorpus home">
              <Logo size={24} />
            </Link>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="hidden sm:inline-flex" onClick={() => void reset()}>
              Reset demo
            </Button>
            <ThemeToggle />
          </div>
        </div>

        <main id="main" className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-8 sm:py-12">
          {status === "error" ? (
            <div className="panel p-8" role="alert">
              <h2 className="text-[24px]">We could not load your data</h2>
              <p className="mt-2 text-ink-2">{error}</p>
              <Button className="mt-6" onClick={() => void reset()}>
                Reload demo data
              </Button>
            </div>
          ) : status !== "ready" ? (
            <PageSkeleton />
          ) : (
            children
          )}
        </main>
      </div>

      <Modal open={menu} onClose={() => setMenu(false)} title="Menu" variant="drawer">
        <NavList onNavigate={() => setMenu(false)} />
      </Modal>
    </div>
  );
}
