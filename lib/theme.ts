export type ThemePref = "system" | "light" | "dark";

const KEY = "crorpus.theme";

export function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function resolve(pref: ThemePref): "light" | "dark" {
  if (pref !== "system") return pref;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/** Applies a preference to the page and remembers it. "system" follows the device and clears the stored choice. */
export function applyPref(pref: ThemePref) {
  const root = document.documentElement;
  root.setAttribute("data-theme", resolve(pref));
  root.setAttribute("data-theme-pref", pref);
  try {
    if (pref === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    // Storage can be blocked; the choice still applies for this visit.
  }
}

/** Inline script run before first paint so there is no flash of the wrong theme. */
export const themeInitScript = `try{var p=localStorage.getItem("${KEY}");var pref=p==="light"||p==="dark"?p:"system";var t=pref==="system"?(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):pref;var r=document.documentElement;r.setAttribute("data-theme",t);r.setAttribute("data-theme-pref",pref)}catch(e){}`;
