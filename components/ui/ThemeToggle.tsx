"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

type Theme = "dark" | "light";

const read = (): Theme => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore<Theme>(subscribe, read, () => "dark");

  const flip = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("crorpus.theme", next);
    } catch {
      // Storage may be blocked; the choice still applies for this visit.
    }
  };

  return (
    <button
      type="button"
      onClick={flip}
      className={`btn btn-icon btn-sm ${className}`}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? <Sun size={18} weight="light" /> : <Moon size={18} weight="light" />}
    </button>
  );
}
