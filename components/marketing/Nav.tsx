"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { List } from "@phosphor-icons/react";
import { Logo } from "@/components/brand/Logo";
import { LinkButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const LINKS = [
  { href: "/#product", label: "Product" },
  { href: "/#calculator", label: "Calculator" },
  { href: "/#security", label: "Security" },
  { href: "/#faq", label: "FAQ" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-40 transition-colors duration-300"
        style={{
          background: scrolled ? "color-mix(in srgb, var(--bg) 62%, transparent)" : "transparent",
          borderBottom: `1px solid ${scrolled ? "var(--line)" : "transparent"}`,
          backdropFilter: scrolled ? "blur(16px) saturate(150%)" : undefined,
          WebkitBackdropFilter: scrolled ? "blur(16px) saturate(150%)" : undefined,
        }}
      >
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-4 sm:px-8">
          <Link href="/" aria-label="Crorpus home">
            <Logo />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-[15px] text-ink-2 transition-colors duration-200 hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:inline-flex" />
            <LinkButton href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
              Log in
            </LinkButton>
            <LinkButton href="/signup" variant="primary" size="sm" className="hidden sm:inline-flex">
              Create account
            </LinkButton>
            <button type="button" className="btn btn-icon btn-sm md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <List size={20} weight="light" />
            </button>
          </div>
        </div>
      </header>

      <Modal open={open} onClose={() => setOpen(false)} title="Menu" variant="drawer">
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex min-h-[52px] items-center border-b border-line text-[18px]">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 flex items-center gap-3">
          <LinkButton href="/signup" variant="primary" onClick={() => setOpen(false)}>
            Create account
          </LinkButton>
          <LinkButton href="/login" onClick={() => setOpen(false)}>
            Log in
          </LinkButton>
        </div>
        <div className="mt-6">
          <ThemeToggle />
        </div>
      </Modal>
    </>
  );
}
