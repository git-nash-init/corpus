"use client";

import { useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { Button } from "@/components/ui/Button";
import { AVATAR_PRESETS, PRESET_PREFIX, isPreset, presetKey, presetUrl } from "@/lib/avatars";
import { supabaseBrowser } from "@/lib/supabase/client";

const OK = ["image/png", "image/jpeg", "image/webp"];

/** Eight preset portraits, or the user's own photo uploaded to the private avatars bucket. */
export function AvatarPicker({ value, userId, name, onChange }: { value: string | null; userId: string; name?: string | null; onChange: (v: string) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upload = async (f: File) => {
    setErr(null);
    if (!OK.includes(f.type)) return setErr("Choose a PNG, JPG or WebP image.");
    if (f.size > 2 * 1024 * 1024) return setErr("Photos can be up to 2 MB.");
    setBusy(true);
    const sb = supabaseBrowser();
    const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from("avatars").upload(path, f, { contentType: f.type, upsert: false });
    if (error) {
      setBusy(false);
      return setErr(`Upload failed: ${error.message}`);
    }
    // Remove the previous upload so old photos do not pile up.
    if (value && !isPreset(value)) void sb.storage.from("avatars").remove([value]);
    setBusy(false);
    onChange(path);
  };

  return (
    <div>
      <div role="radiogroup" aria-label="Choose an avatar" className="grid grid-cols-4 gap-3 sm:gap-4">
        {AVATAR_PRESETS.map((a) => {
          const on = value === `${PRESET_PREFIX}${a.key}`;
          return (
            <button
              key={a.key}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={a.label}
              title={a.label}
              onClick={() => onChange(`${PRESET_PREFIX}${a.key}`)}
              className="relative aspect-square overflow-hidden rounded-[4px] border-2 transition-colors duration-200"
              style={{ borderColor: on ? "var(--brass)" : "var(--line)", opacity: value && !on ? 0.72 : 1 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={presetUrl(a.key)} alt="" className="h-full w-full object-cover" width={96} height={96} loading="lazy" />
            </button>
          );
        })}
      </div>
      {isPreset(value) ? <p className="mt-3 text-sm text-ink-2">{AVATAR_PRESETS.find((a) => a.key === presetKey(value))?.label}</p> : null}
      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-line pt-5">
        {value && !isPreset(value) ? <Avatar avatar={value} name={name} size={56} /> : null}
        <Button size="sm" onClick={() => file.current?.click()} disabled={busy}>
          {busy ? "Uploading" : "Upload your own photo"}
        </Button>
        <input
          ref={file}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-label="Choose a profile photo"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
        <span className="text-[13px] text-ink-3">PNG, JPG or WebP, up to 2 MB. Only you can see it.</span>
      </div>
      {err ? (
        <p role="alert" className="mt-3 text-sm" style={{ color: "var(--loss)" }}>
          {err}
        </p>
      ) : null}
    </div>
  );
}
