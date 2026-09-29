"use client";

import { useEffect, useMemo } from "react";
import { useStore } from "./store";
import { derive } from "./derive";
import { todayISO } from "@/lib/engine/dates";

/** Loads the data once and returns raw records plus every derived figure for today. */
export function useApp() {
  const status = useStore((s) => s.status);
  const data = useStore((s) => s.data);
  const error = useStore((s) => s.error);
  const load = useStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  const today = useMemo(() => todayISO(), []);
  const result = useMemo(() => {
    if (!data) return { d: null, failure: null as string | null };
    try {
      return { d: derive(data, today), failure: null as string | null };
    } catch (e) {
      return { d: null, failure: e instanceof Error ? e.message : "Could not calculate your figures." };
    }
  }, [data, today]);

  return { status, data, d: result.d, today, error: error ?? result.failure };
}
