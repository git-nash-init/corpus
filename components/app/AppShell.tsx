"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bank,
  ChartLineUp,
  ClipboardText,
  Coins,
  DotsThree,
  Files,
  GearSix,
  House,
  Scales,
  SignOut,
  Target,
  X,
} from "@phosphor-icons/react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { applyPref, readPref } from "@/lib/theme";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useStore } from "@/lib/state/store";
import { useApp } from "@/lib/state/useApp";
import { Avatar } from "./Avatar";
import { StackTables } from "./StackTables";

const NAV = [
  { href: "/app", label: "Overview", short: "Home", icon: House },
  { href: "/app/mutual-funds", label: "Mutual funds", short: "Funds", icon: ChartLineUp },
  { href: "/app/stocks", label: "Stocks", short: "Stocks", icon: Coins },
  { href: "/app/goals", label: "Goals", short: "Goals", icon: Target },
  { href: "/app/fixed-assets", label: "Fixed and retirement", short: "Fixed", icon: Bank },
  { href: "/app/net-worth", label: "Net worth", short: "Net worth", icon: Scales },
  { href: "/app/documents", label: "Documents", short: "Documents", icon: Files },
  { href: "/app/review", label: "Monthly review", short: "Review", icon: ClipboardText },
  { href: "/app/settings", label: "Settings", short: "Settings", icon: GearSix },
] as const;

const BOTTOM = NAV.slice(0, 4);
const MORE = NAV.slice(4);

const isActive = (path: string, href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(path, href);
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

function BottomNav({ onMore }: { onMore: () => void }) {
  const path = usePathname();
  const moreActive = MORE.some((m) => isActive(path, m.href));
  const item = "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-200";
  return (
    <nav
      aria-label="Primary"
      className="glass fixed inset-x-0 bottom-0 z-40 flex rounded-none border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] lg:hidden"
      style={{ background: "color-mix(in srgb, var(--bg) 78%, transparent)" }}
    >
      {BOTTOM.map(({ href, short, icon: Icon }) => {
        const active = isActive(path, href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={item} style={{ color: active ? "var(--brass-strong)" : "var(--text-2)" }}>
            <Icon size={24} weight={active ? "regular" : "light"} aria-hidden="true" />
            {short}
          </Link>
        );
      })}
      <button type="button" onClick={onMore} className={item} style={{ color: moreActive ? "var(--brass-strong)" : "var(--text-2)" }} aria-haspopup="dialog">
        <DotsThree size={24} weight="bold" aria-hidden="true" />
        More
      </button>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [more, setMore] = useState(false);
  const { status, error, profile } = useApp();
  const notice = useStore((s) => s.notice);
  const dismissNotice = useStore((s) => s.dismissNotice);
  const updateProfile = useStore((s) => s.updateProfile);
  const refreshPrices = useStore((s) => s.refreshPrices);
  const clear = useStore((s) => s.clear);

  // Send people who have not finished setup to onboarding.
  useEffect(() => {
    if (status === "ready" && profile && !profile.onboardedAt && path !== "/app/onboarding") router.replace("/app/onboarding");
  }, [status, profile, path, router]);

  // Pull fresh NAVs and prices once per visit, after the data has loaded.
  useEffect(() => {
    if (status === "ready") void refreshPrices();
  }, [status, refreshPrices]);

  // A saved explicit choice follows the account to new devices. "system" is the default and stays local.
  useEffect(() => {
    if (profile && profile.theme !== "system" && readPref() === "system") applyPref(profile.theme);
  }, [profile]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(dismissNotice, 8000);
    return () => window.clearTimeout(t);
  }, [notice, dismissNotice]);

  const logout = async () => {
    await supabaseBrowser().auth.signOut();
    clear();
    router.replace("/");
    router.refresh();
  };

  const accountBlock = (
    <div className="flex items-center gap-3">
      <Avatar avatar={profile?.avatar ?? null} name={profile?.displayName} email={profile?.email} size={44} />
      <div className="min-w-0">
        <p className="truncate text-[15px] font-medium">{profile?.displayName || "Your account"}</p>
        <p className="truncate text-[13px] text-ink-3">{profile?.email}</p>
      </div>
    </div>
  );

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
        <div className="space-y-4 border-t border-line pt-5">
          {accountBlock}
          <div className="flex items-center justify-between gap-2">
            <ThemeToggle onChange={(t) => void updateProfile({ theme: t })} />
            <Button size="sm" variant="ghost" onClick={() => void logout()}>
              <SignOut size={18} weight="light" aria-hidden="true" />
              Log out
            </Button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="glass sticky top-0 z-30 flex h-14 items-center justify-between rounded-none border-x-0 border-t-0 px-4 pt-[env(safe-area-inset-top)] sm:px-8 lg:hidden">
          <Link href="/app" aria-label="Crorpus overview">
            <Logo size={24} />
          </Link>
          <button type="button" onClick={() => setMore(true)} aria-label="Open account menu" className="rounded-[4px]">
            <Avatar avatar={profile?.avatar ?? null} name={profile?.displayName} email={profile?.email} size={36} />
          </button>
        </div>

        <main id="main" className="mx-auto w-full max-w-[1240px] px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-8 sm:py-12 lg:pb-12">
          {status === "error" ? (
            <div className="panel p-6 sm:p-8" role="alert">
              <h2 className="text-[24px]">We could not load your data</h2>
              <p className="mt-2 text-ink-2">{error}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="primary" onClick={() => window.location.reload()}>
                  Try again
                </Button>
                <Button variant="ghost" onClick={() => void logout()}>
                  Log out
                </Button>
              </div>
            </div>
          ) : status !== "ready" ? (
            <PageSkeleton />
          ) : (
            children
          )}
        </main>
      </div>

      <StackTables />
      <BottomNav onMore={() => setMore(true)} />

      <Modal open={more} onClose={() => setMore(false)} title="Menu" variant="drawer">
        <div className="space-y-6 lg:hidden">
          {accountBlock}
          <nav aria-label="More" className="flex flex-col gap-1">
            {MORE.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMore(false)} className="flex min-h-[52px] items-center gap-3 border-b border-line text-[17px]">
                <Icon size={22} weight="light" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center justify-between gap-3">
            <ThemeToggle onChange={(t) => void updateProfile({ theme: t })} />
            <Button onClick={() => void logout()}>
              <SignOut size={18} weight="light" aria-hidden="true" />
              Log out
            </Button>
          </div>
        </div>
      </Modal>

      {notice ? (
        <div
          role="alert"
          className="glass fixed inset-x-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-50 flex items-start gap-3 rounded-[4px] px-4 py-3 text-[14px] sm:left-auto sm:right-8 sm:max-w-[420px] lg:bottom-8"
          style={{ background: "color-mix(in srgb, var(--bg-raised) 92%, transparent)", borderColor: "var(--loss)" }}
        >
          <span className="flex-1">{notice}</span>
          <button type="button" onClick={dismissNotice} className="btn btn-ghost btn-icon btn-sm -my-2 -mr-2" aria-label="Dismiss message">
            <X size={18} weight="light" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
