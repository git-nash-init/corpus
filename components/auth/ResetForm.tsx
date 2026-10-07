"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { supabaseBrowser } from "@/lib/supabase/client";
import { FormMessage, friendlyAuthError } from "./AuthShell";

export function ResetForm() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabaseBrowser()
      .auth.getUser()
      .then(({ data }) => setReady(Boolean(data.user)));
  }, []);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (password.length < 8) e.password = "Use at least 8 characters.";
    if (confirm !== password) e.confirm = "The passwords do not match.";
    setErr(e);
    setFormError(null);
    if (Object.keys(e).length) return;
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setFormError(friendlyAuthError(error.message));
      return;
    }
    router.replace("/app");
    router.refresh();
  };

  if (ready === null) return <p className="text-ink-2">Checking your link...</p>;
  if (!ready) {
    return (
      <div className="space-y-4">
        <FormMessage tone="error">This reset link is invalid or has expired.</FormMessage>
        <Link href="/forgot-password" className="btn btn-primary w-full">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(ev) => {
        ev.preventDefault();
        void submit();
      }}
    >
      <TextField label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={err.password} hint="At least 8 characters." />
      <TextField label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={err.confirm} />
      {formError ? <FormMessage tone="error">{formError}</FormMessage> : null}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
        {busy ? "Saving" : "Set new password"}
      </Button>
    </form>
  );
}
