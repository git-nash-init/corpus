"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { supabaseBrowser } from "@/lib/supabase/client";
import { FormMessage, friendlyAuthError, safeNext } from "./AuthShell";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);

  const urlError = params.get("error");

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Enter a valid email address.";
    if (!password) e.password = "Enter your password.";
    setErr(e);
    setFormError(null);
    if (Object.keys(e).length) return;
    setBusy(true);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      setFormError(friendlyAuthError(error.message));
      return;
    }
    router.replace(safeNext(params.get("next")));
    router.refresh();
  };

  const resend = async () => {
    const { error } = await supabaseBrowser().auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: `${location.origin}/auth/confirm?next=/app` } });
    if (error) setFormError(friendlyAuthError(error.message));
    else setResent(true);
  };

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(ev) => {
        ev.preventDefault();
        void submit();
      }}
    >
      {urlError ? <FormMessage tone="error">That link has expired or was already used. Log in, or request a new one.</FormMessage> : null}
      <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={err.email} />
      <TextField label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={err.password} />
      <div className="-mt-2 text-right text-[14px]">
        <Link href="/forgot-password" className="text-brass underline underline-offset-4">
          Forgot your password?
        </Link>
      </div>
      {formError ? <FormMessage tone="error">{formError}</FormMessage> : null}
      {formError?.toLowerCase().includes("confirm your email") ? (
        <Button variant="ghost" size="sm" onClick={() => void resend()} disabled={!email.trim()}>
          {resent ? "Confirmation email sent" : "Send the confirmation email again"}
        </Button>
      ) : null}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
        {busy ? "Logging in" : "Log in"}
      </Button>
    </form>
  );
}
