"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Desktop, Moon, Sun } from "@phosphor-icons/react";
import { applyPref, readPref, type ThemePref } from "@/lib/theme";

const read = (): ThemePref => {
  const v = document.documentElement.getAttribute("data-theme-pref");
  return v === "light" || v === "dark" ? v : "system";
};

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme-pref"] });
  return () => mo.disconnect();
}

const OPTIONS: { value: ThemePref; label: string; Icon: typeof Sun }[] = [
  { value: "system", label: "Match device", Icon: Desktop },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

/** Keeps "system" live: when the device flips between light and dark, the page follows. Mount once. */
export function ThemeSync() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const on = () => {
      if (readPref() === "system") applyPref("system");
    };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return null;
}

/** Three-way theme control. Defaults to the device setting. */
export function ThemeToggle({ className = "", onChange }: { className?: string; onChange?: (p: ThemePref) => void }) {
  const pref = useSyncExternalStore<ThemePref>(subscribe, read, () => "system");

  return (
    <div role="radiogroup" aria-label="Theme" className={`glass inline-flex rounded-[4px] p-[2px] ${className}`}>
      {OPTIONS.map(({ value, label, Icon }) => {
        const on = pref === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={label}
            title={label}
            onClick={() => {
              applyPref(value);
              onChange?.(value);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-[3px] transition-colors duration-200"
            style={{ background: on ? "var(--glass-brass-fill)" : "transparent", color: on ? "var(--brass-strong)" : "var(--text-2)" }}
          >
            <Icon size={18} weight="light" />
          </button>
        );
      })}
    </div>
  );
}
