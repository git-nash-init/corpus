"use client";

import { ArrowsClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/state/store";

/** Shows when live prices were last refreshed and lets the user refresh them. */
export function PriceStatus() {
  const prices = useStore((s) => s.prices);
  const refresh = useStore((s) => s.refreshPrices);
  const loading = prices.state === "loading";
  const time = prices.at ? new Date(prices.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : null;
  const text = loading
    ? "Updating live prices..."
    : prices.state === "ok"
      ? `Live prices at ${time}`
      : prices.state === "partial"
        ? `Some prices could not be fetched (${prices.missed.slice(0, 3).join(", ")})`
        : prices.state === "error"
          ? "Live prices are unavailable. Showing the last saved values."
          : "";
  return (
    <div className="flex items-center gap-3">
      {text ? (
        <span className="text-[13px] text-ink-3" role="status" aria-live="polite">
          {text}
        </span>
      ) : null}
      <Button size="sm" onClick={() => void refresh()} disabled={loading} aria-label="Refresh live prices">
        <ArrowsClockwise size={18} weight="light" aria-hidden="true" />
        Refresh
      </Button>
    </div>
  );
}
