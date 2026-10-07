"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AvatarPicker } from "@/components/app/AvatarPicker";
import { SpreadsheetImport } from "@/components/app/SpreadsheetImport";
import { PageHeader } from "@/components/app/kit";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { AVATAR_PRESETS, PRESET_PREFIX } from "@/lib/avatars";
import { useApp } from "@/lib/state/useApp";
import { useStore } from "@/lib/state/store";

const CLASSES = [
  { id: "mf", label: "Mutual funds and SIPs", note: "Units, live NAV, XIRR and the monthly SIP check" },
  { id: "stocks", label: "Direct stocks", note: "Average cost, live prices, realised and unrealised gains" },
  { id: "fixed", label: "PPF, EPF, NPS and deposits", note: "Balances, maturity and liquidity" },
  { id: "gold", label: "Gold and silver", note: "Bonds, digital gold and ETFs" },
  { id: "property", label: "Property and vehicles", note: "Lives on the net worth balance sheet" },
  { id: "loans", label: "Loans and cards", note: "Debt against assets" },
];

const STEPS = ["About you", "What you track", "Your data", "A first goal"] as const;
const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

export default function OnboardingPage() {
  const router = useRouter();
  const { data, profile, today } = useApp();
  const updateProfile = useStore((s) => s.updateProfile);
  const upsertGoal = useStore((s) => s.upsertGoal);
  const reduce = useReducedMotion();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(profile?.displayName ?? "");
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar ?? `${PRESET_PREFIX}${AVATAR_PRESETS[0].key}`);
  const [picked, setPicked] = useState<string[]>(["mf", "stocks", "fixed"]);
  const [target, setTarget] = useState("10000000");
  const [date, setDate] = useState("");
  const [sip, setSip] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  if (!data || !profile) return null;
  const hasGoal = data.goals.length > 0;

  const next = async () => {
    if (step === 1) {
      if (!name.trim()) return setErr({ name: "Tell us what to call you." });
      setErr({});
      await updateProfile({ displayName: name.trim(), avatar });
    }
    setStep((s) => s + 1);
  };

  const finish = async (skipGoal: boolean) => {
    const e: Record<string, string> = {};
    if (!skipGoal && !hasGoal) {
      if (!(num(target) > 0)) e.target = "Enter a target above zero.";
      if (!date || date <= today) e.date = "Choose a date in the future.";
    }
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    if (!skipGoal && !hasGoal) {
      upsertGoal({ id: crypto.randomUUID(), userId: data.userId, name: "My first goal", target: num(target), targetDate: date, expectedReturn: 0.12, monthlySip: sip.trim() === "" ? 0 : num(sip) });
    }
    await updateProfile({ onboardedAt: new Date().toISOString() });
    router.replace("/app");
  };

  return (
    <div className="mx-auto max-w-[720px] space-y-8">
      <PageHeader eyebrow={`Step ${step} of ${STEPS.length}: ${STEPS[step - 1]}`} title={["", "Welcome. Who is this ledger for?", "What do you want to track?", "Bring your data in", "Set your first goal"][step]} />
      <div className="flex gap-2" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step} aria-label="Setup progress">
        {STEPS.map((_, i) => (
          <div key={i} className="h-[3px] flex-1 rounded-[1px]" style={{ background: i < step ? "var(--brass)" : "var(--line-strong)" }} />
        ))}
      </div>

      <div>
        <motion.div
          key={step}
          initial={reduce ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === 1 ? (
            <div className="panel space-y-6 p-5 sm:p-8">
              <TextField label="Your name" required value={name} onChange={(e) => setName(e.target.value)} error={err.name} autoComplete="name" />
              <div>
                <p className="mb-3 text-[13px] font-medium text-ink-2">Pick an avatar</p>
                <AvatarPicker value={avatar} userId={data.userId} name={name} onChange={setAvatar} />
              </div>
            </div>
          ) : step === 2 ? (
            <fieldset>
              <legend className="sr-only">Asset classes</legend>
              <ul className="panel divide-y divide-[var(--line)]">
                {CLASSES.map((c) => {
                  const on = picked.includes(c.id);
                  return (
                    <li key={c.id}>
                      <label className="flex min-h-[64px] cursor-pointer items-center gap-4 px-5 py-3">
                        <input type="checkbox" checked={on} onChange={() => setPicked((p) => (on ? p.filter((x) => x !== c.id) : [...p, c.id]))} className="h-5 w-5 shrink-0 accent-[var(--brass)]" />
                        <span>
                          <span className="block text-[16px]">{c.label}</span>
                          <span className="block text-sm text-ink-3">{c.note}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-sm text-ink-3">Every screen stays available. This just tells us where you are starting.</p>
            </fieldset>
          ) : step === 3 ? (
            <div className="space-y-6">
              <div className="panel p-5 sm:p-8">
                <h2 className="font-display text-[24px]">Import your spreadsheet</h2>
                <p className="mb-5 mt-2 text-ink-2">Have the original Investment Tracker workbook? Bring everything across in a minute.</p>
                <SpreadsheetImport hasData={data.funds.length + data.stockTxns.length + data.fixedAssets.length > 0} />
              </div>
              <p className="text-sm text-ink-2">Or start with a clean ledger and add your holdings as you go. You can import later from Settings.</p>
            </div>
          ) : hasGoal ? (
            <div className="panel p-5 sm:p-8">
              <p className="text-ink-2">Your spreadsheet already included a goal, so you are all set. You can fine tune it in Goals.</p>
            </div>
          ) : (
            <form
              className="panel space-y-5 p-5 sm:p-8"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void finish(false);
              }}
            >
              <TextField label="Target amount (Rs)" type="number" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} error={err.target} hint="1 crore is 1,00,00,000." />
              <TextField label="Target date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} error={err.date} />
              <TextField label="Monthly SIP you can commit (Rs)" type="number" inputMode="numeric" value={sip} onChange={(e) => setSip(e.target.value)} hint="Optional. You can change it any time." />
              <button type="submit" className="sr-only" tabIndex={-1}>
                Finish
              </button>
            </form>
          )}
        </motion.div>
      </div>

      <div className="flex justify-between gap-3">
        <Button variant="ghost" disabled={step === 1 || busy} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {step < STEPS.length ? (
          <Button variant="primary" disabled={(step === 2 && picked.length === 0) || busy} onClick={() => void next()}>
            {step === 3 ? "Continue" : "Continue"}
          </Button>
        ) : (
          <div className="flex gap-3">
            {!hasGoal ? (
              <Button variant="ghost" onClick={() => void finish(true)} disabled={busy}>
                Skip for now
              </Button>
            ) : null}
            <Button variant="primary" onClick={() => void finish(hasGoal)} disabled={busy}>
              {busy ? "Finishing" : "Finish setup"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
