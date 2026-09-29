import type { AppData } from "./demo-seed";
import { buildDemoData } from "./demo-seed";
import { todayISO } from "@/lib/engine/dates";

/**
 * Storage boundary. Phase 1 uses LocalRepository (browser storage, demo data). Phase 2 adds a Supabase
 * implementation of the same interface; no screen imports storage code directly.
 */
export interface Repository {
  load(): Promise<AppData>;
  save(data: AppData): Promise<void>;
  reset(): Promise<AppData>;
}

const KEY = "crorpus.demo.v1";

export class LocalRepository implements Repository {
  async load(): Promise<AppData> {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as AppData;
        if (parsed.version === 1) return parsed;
      }
    } catch {
      // Storage can be unavailable or corrupt (private windows, cleared data). Fall through to the seed.
    }
    return buildDemoData(todayISO());
  }

  async save(data: AppData): Promise<void> {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // Non-fatal: the session keeps working in memory.
    }
  }

  async reset(): Promise<AppData> {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    return buildDemoData(todayISO());
  }
}

export const repository: Repository = new LocalRepository();
