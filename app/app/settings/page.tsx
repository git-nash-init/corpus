"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AvatarPicker } from "@/components/app/AvatarPicker";
import { SpreadsheetImport } from "@/components/app/SpreadsheetImport";
import { PageHeader, Section } from "@/components/app/kit";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useApp } from "@/lib/state/useApp";
import { useStore } from "@/lib/state/store";

export default function SettingsPage() {
  const router = useRouter();
  const { data, profile } = useApp();
  const updateProfile = useStore((s) => s.updateProfile);
  const wipeData = useStore((s) => s.wipeData);
  const clear = useStore((s) => s.clear);

  const [name, setName] = useState(profile?.displayName ?? "");
  const [saved, setSaved] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!data || !profile) return null;

  const exportJson = () => {
    const { documents: _docs, ...portable } = data;
    void _docs;
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...portable }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crorpus-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteAccountData = async () => {
    setBusy(true);
    setMsg(null);
    // Files first (the vault and the avatar), then every record. The sign-in itself is removed on request by email.
    const sb = supabaseBrowser();
    try {
      for (const bucket of ["documents", "avatars"] as const) {
        const { data: files } = await sb.storage.from(bucket).list(data.userId, { limit: 1000 });
        if (files?.length) await sb.storage.from(bucket).remove(files.map((f) => `${data.userId}/${f.name}`));
      }
      await sb.from("documents").delete().not("id", "is", null);
      await wipeData();
      await updateProfile({ avatar: null });
      setConfirmText("");
      setMsg("Your records and files have been deleted.");
    } catch {
      setMsg("Something went wrong while deleting. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Account" title="Settings" subtitle="Your profile, appearance, data import and export." />

      <Section eyebrow="Profile" title="About you">
        <div className="max-w-[560px] space-y-6">
          <p className="text-sm text-ink-3">Signed in as {profile.email}</p>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              void updateProfile({ displayName: name.trim() }).then(() => {
                setSaved(true);
                window.setTimeout(() => setSaved(false), 2500);
              });
            }}
          >
            <div className="flex-1">
              <TextField label="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </div>
            <Button type="submit" disabled={!name.trim() || name.trim() === profile.displayName}>
              {saved ? "Saved" : "Save name"}
            </Button>
          </form>
          <div>
            <p className="mb-3 text-[13px] font-medium text-ink-2">Avatar</p>
            <AvatarPicker value={profile.avatar} userId={data.userId} name={profile.displayName} onChange={(v) => void updateProfile({ avatar: v })} />
          </div>
        </div>
      </Section>

      <Section eyebrow="Appearance" title="Theme">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <ThemeToggle onChange={(t) => void updateProfile({ theme: t })} />
          <p className="max-w-[56ch] text-ink-2">Match device follows your phone or computer, switching automatically between light and dark.</p>
        </div>
      </Section>

      <Section eyebrow="Bring data in" title="Import your spreadsheet">
        <SpreadsheetImport hasData={data.funds.length + data.stockTxns.length + data.fixedAssets.length + data.balanceAssets.length > 0} />
      </Section>

      <Section eyebrow="Your data" title="Export">
        <p className="max-w-[62ch] text-ink-2">Download everything you have recorded as a JSON file. Your documents stay in the vault and can be downloaded one by one.</p>
        <Button className="mt-6" onClick={exportJson}>
          Export as JSON
        </Button>
      </Section>

      <Section eyebrow="Session" title="Log out">
        <Button
          onClick={async () => {
            await supabaseBrowser().auth.signOut();
            clear();
            router.replace("/");
            router.refresh();
          }}
        >
          Log out of this device
        </Button>
      </Section>

      <Section eyebrow="Danger zone" title="Delete my records and files">
        <p className="max-w-[62ch] text-ink-2">
          This permanently deletes every fund, trade, asset, goal, note, snapshot and uploaded file in your account. Your login stays, so you can start again. To remove the account itself, email us from your sign-in address.
        </p>
        <div className="mt-6 flex max-w-[460px] flex-col gap-3">
          <TextField label={`Type DELETE to confirm`} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
          <Button variant="danger" disabled={confirmText !== "DELETE" || busy} onClick={() => void deleteAccountData()}>
            {busy ? "Deleting" : "Delete everything"}
          </Button>
          {msg ? (
            <p className="text-sm text-ink-2" role="status">
              {msg}
            </p>
          ) : null}
        </div>
      </Section>
    </div>
  );
}
