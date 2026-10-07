// Public by design: the URL and publishable key ship to every browser and only grant what RLS allows.
// Env vars take precedence so another project can be targeted without code changes.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://qhvlhiboaknvqhkpqtfk.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_QWtqPETpYa-V0XuFbFKBIw_N-zlueAb";
