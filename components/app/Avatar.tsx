"use client";

import { useEffect, useState } from "react";
import { initials, isPreset, presetKey, presetUrl } from "@/lib/avatars";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Shows a preset portrait, an uploaded photo (via a short-lived signed URL) or the user's initials. */
export function Avatar({ avatar, name, email, size = 40 }: { avatar: string | null; name?: string | null; email?: string; size?: number }) {
  const [signed, setSigned] = useState<{ path: string; url: string } | null>(null);
  const uploaded = avatar && !isPreset(avatar) ? avatar : null;

  useEffect(() => {
    if (!uploaded) return;
    let live = true;
    void supabaseBrowser()
      .storage.from("avatars")
      .createSignedUrl(uploaded, 3600)
      .then(({ data }) => live && data && setSigned({ path: uploaded, url: data.signedUrl }));
    return () => {
      live = false;
    };
  }, [uploaded]);

  const src = isPreset(avatar) ? presetUrl(presetKey(avatar)) : uploaded && signed?.path === uploaded ? signed.url : null;

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-line-strong bg-[var(--glass-fill)] text-[13px] font-semibold text-brass"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials(name, email)}</span>
      )}
    </span>
  );
}
