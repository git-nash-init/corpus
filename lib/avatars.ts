export interface AvatarPreset {
  key: string;
  label: string;
}

/** Preset portraits in /public/avatars/<key>.jpg. A profile stores "preset:<key>" or a path in the avatars bucket. */
export const AVATAR_PRESETS: AvatarPreset[] = [
  { key: "analyst", label: "The Analyst" },
  { key: "compounder", label: "The Compounder" },
  { key: "contrarian", label: "The Contrarian" },
  { key: "saver", label: "The Saver" },
  { key: "quant", label: "The Quant" },
  { key: "sipper", label: "The SIP Loyalist" },
  { key: "goldbug", label: "The Gold Bug" },
  { key: "planner", label: "The Planner" },
];

export const PRESET_PREFIX = "preset:";

export const presetUrl = (key: string) => `/avatars/${key}.jpg`;
export const isPreset = (v: string | null | undefined): v is string => Boolean(v?.startsWith(PRESET_PREFIX));
export const presetKey = (v: string) => v.slice(PRESET_PREFIX.length);

export function initials(name: string | null | undefined, email?: string): string {
  const src = (name ?? "").trim() || (email ?? "").split("@")[0] || "?";
  const parts = src.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : src.slice(0, 2)).toUpperCase();
}
