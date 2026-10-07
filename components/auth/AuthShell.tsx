import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" aria-label="Crorpus home">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main id="main" className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center px-4 pb-16 pt-6 sm:px-0">
        <h1 className="font-display text-[clamp(34px,8vw,48px)] leading-[1.05]">{title}</h1>
        {subtitle ? <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{subtitle}</p> : null}
        <div className="panel mt-8 p-5 sm:p-8">{children}</div>
        {footer ? <div className="mt-6 text-center text-[15px] text-ink-2">{footer}</div> : null}
      </main>
    </div>
  );
}

export function FormMessage({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className="rounded-[4px] border px-4 py-3 text-[14px] leading-snug"
      style={{
        color: tone === "error" ? "var(--loss)" : "var(--gain)",
        borderColor: `color-mix(in srgb, ${tone === "error" ? "var(--loss)" : "var(--gain)"} 45%, transparent)`,
      }}
    >
      {children}
    </p>
  );
}

/** Maps Supabase auth errors to plain language. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "That email and password do not match. Check them and try again, or reset your password.";
  if (m.includes("email not confirmed")) return "Please confirm your email first. We sent you a link when you signed up.";
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with this email already exists. Try logging in instead.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a few minutes and try again.";
  if (m.includes("password") && m.includes("characters")) return "Choose a password of at least 8 characters.";
  if (m.includes("same password") || m.includes("different from the old")) return "Choose a password different from your current one.";
  if (m.includes("network") || m.includes("fetch")) return "We could not reach the server. Check your connection and try again.";
  return message;
}

/** Only allow redirects back into the signed-in area. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/app") && !next.startsWith("//") ? next : "/app";
}
