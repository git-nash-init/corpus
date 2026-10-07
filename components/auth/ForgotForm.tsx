"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { supabaseBrowser } from "@/lib/supabase/client";
import { FormMessage, friendlyAuthError } from "./AuthShell";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setFormError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErr("Enter a valid email address.");
      return;
    }
    setErr(null);
    setBusy(true);
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/auth/confirm?next=/reset-password` });
    setBusy(false);
    if (error) setFormError(friendlyAuthError(error.message));
    else setSent(true);
  };

  if (sent) {
    return (
      <div className="space-y-3" role="status">
        <h2 className="font-display text-[26px]">Check your email</h2>
        <p className="text-ink-2">If an account exists for {email.trim()}, a reset link is on its way. It expires after an hour.</p>
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
      <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={err} />
      {formError ? <FormMessage tone="error">{formError}</FormMessage> : null}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
        {busy ? "Sending" : "Send reset link"}
      </Button>
    </form>
  );
}
