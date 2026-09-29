"use client";

import { useRef, useState } from "react";
import { PageHeader, Section } from "@/components/app/kit";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { AppData } from "@/lib/data/demo-seed";
import { useApp } from "@/lib/state/useApp";
import { useStore } from "@/lib/state/store";

export default function SettingsPage() {
  const { data } = useApp();
  const reset = useStore((s) => s.reset);
  const mutate = useStore((s) => s.mutate);
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [bad, setBad] = useState(false);

  if (!data) return null;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crorpus-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (f: File) => {
    try {
      const parsed = JSON.parse(await f.text()) as AppData;
      const arrays: (keyof AppData)[] = ["funds", "fundTxns", "stockTxns", "quotes", "fixedAssets", "balanceAssets", "liabilities", "goals", "snapshots", "reviewItems", "reviewNotes"];
      if (parsed.version !== 1 || arrays.some((k) => !Array.isArray(parsed[k]))) throw new Error("This file is not a Crorpus export.");
      await mutate(() => parsed);
      setBad(false);
      setMsg("Import complete. Your data has been replaced with the file's contents.");
    } catch (e) {
      setBad(true);
      setMsg(e instanceof Error ? e.message : "The file could not be read.");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Preferences" title="Settings" subtitle="Appearance, data export and reset. Accounts, sync and spreadsheet import arrive with the database connection." />

      <Section eyebrow="Appearance" title="Theme">
        <div className="flex flex-wrap items-center gap-4">
          <ThemeToggle />
          <p className="text-ink-2">Switch between the dark Vault theme and the light Ledger theme. Your choice is remembered on this device.</p>
        </div>
      </Section>

      <Section eyebrow="Your data" title="Export and import">
        <p className="max-w-[62ch] text-ink-2">
          Everything is stored in this browser for now. Export a copy to keep it safe or move it to another device, and import it back the same way.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={exportJson}>Export as JSON</Button>
          <Button onClick={() => file.current?.click()}>Import from JSON</Button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-label="Choose a Crorpus export file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importJson(f);
              e.target.value = "";
            }}
          />
        </div>
        {msg ? (
          <p className={`mt-4 text-sm ${bad ? "loss" : "gain"}`} role={bad ? "alert" : "status"}>
            {msg}
          </p>
        ) : null}
      </Section>

      <Section eyebrow="Danger zone" title="Reset demo data">
        <p className="max-w-[62ch] text-ink-2">Replace everything with a fresh copy of the sample portfolio. Your current entries will be lost.</p>
        <Button
          className="mt-6"
          variant="danger"
          onClick={() => {
            if (window.confirm("Replace all data with the sample portfolio? This cannot be undone.")) void reset();
          }}
        >
          Reset to sample data
        </Button>
      </Section>
    </div>
  );
}
