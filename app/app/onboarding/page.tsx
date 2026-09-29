"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/app/kit";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { useApp } from "@/lib/state/useApp";
import { useStore } from "@/lib/state/store";

const CLASSES = [
  { id: "mf", label: "Mutual funds and SIPs", note: "Units, NAV, XIRR and the monthly SIP check" },
  { id: "stocks", label: "Direct stocks", note: "Average cost, realised and unrealised gains" },
  { id: "fixed", label: "PPF, EPF, NPS and deposits", note: "Balances, maturity and liquidity" },
  { id: "gold", label: "Gold and silver", note: "Bonds, digital gold and ETFs" },
  { id: "property", label: "Property and vehicles", note: "Lives on the net worth balance sheet" },
  { id: "loans", label: "Loans and cards", note: "Debt against assets" },
];

const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

export default function OnboardingPage() {
  const router = useRouter();
  const { data, today } = useApp();
  const mutate = useStore((s) => s.mutate);
  const upsertGoal = useStore((s) => s.upsertGoal);
  const reduce = useReducedMotion();

  const [step, setStep] = useState(1);
  const [picked, setPicked] = useState<string[]>(["mf", "stocks", "fixed"]);
  const [start, setStart] = useState<"sample" | "empty">("sample");
  const [target, setTarget] = useState("10000000");
  const [date, setDate] = useState("");
  const [sip, setSip] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});

  if (!data) return null;

  const finish = async () => {
    const e: Record<string, string> = {};
    if (!(num(target) > 0)) e.target = "Enter a target above zero.";
    if (!date || date <= today) e.date = "Choose a date in the future.";
    setErr(e);
    if (Object.keys(e).length) return;
    if (start === "empty") {
      await mutate((d) => ({ ...d, funds: [], fundTxns: [], stockTxns: [], fixedAssets: [], balanceAssets: [], liabilities: [], goals: [], snapshots: [], reviewNotes: [] }));
    }
    upsertGoal({ id: "g-first", userId: data.userId, name: "My first goal", target: num(target), targetDate: date, expectedReturn: 0.12, monthlySip: sip.trim() === "" ? 0 : num(sip) });
    router.push("/app");
  };

  return (
    <div className="mx-auto max-w-[720px] space-y-8">
      <PageHeader eyebrow={`Step ${step} of 3`} title={step === 1 ? "What do you want to track?" : step === 2 ? "Choose a starting point" : "Set your first goal"} />
      <div className="flex gap-2" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step} aria-label="Setup progress">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-[3px] flex-1 rounded-[1px]" style={{ background: n <= step ? "var(--brass)" : "var(--line-strong)" }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduce ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -16 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === 1 ? (
            <fieldset>
              <legend className="sr-only">Asset classes</legend>
              <ul className="divide-y divide-[var(--line)] panel">
                {CLASSES.map((c) => {
                  const on = picked.includes(c.id);
                  return (
                    <li key={c.id}>
                      <label className="flex min-h-[64px] cursor-pointer items-center gap-4 px-5 py-3">
                        <input type="checkbox" checked={on} onChange={() => setPicked((p) => (on ? p.filter((x) => x !== c.id) : [...p, c.id]))} className="h-5 w-5 accent-[var(--brass)]" />
                        <span>
                          <span className="block text-[16px]">{c.label}</span>
                          <span className="block text-sm text-ink-3">{c.note}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ) : step === 2 ? (
            <div className="grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Starting point">
              {(
                [
                  ["sample", "Explore with sample data", "A realistic portfolio so you can see every screen working."],
                  ["empty", "Start empty", "A clean slate. Add your own funds, stocks and balances."],
                ] as const
              ).map(([id, title, body]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={start === id}
                  onClick={() => setStart(id)}
                  className="panel p-6 text-left transition-colors duration-200"
                  style={{ borderColor: start === id ? "var(--glass-brass-border)" : undefined, background: start === id ? "var(--glass-brass-fill)" : undefined }}
                >
                  <span className="font-display block text-[24px]">{title}</span>
                  <span className="mt-2 block text-sm text-ink-2">{body}</span>
                </button>
              ))}
            </div>
          ) : (
            <form
              className="panel space-y-5 p-6"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void finish();
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
      </AnimatePresence>

      <div className="flex justify-between">
        <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {step < 3 ? (
          <Button variant="primary" disabled={step === 1 && picked.length === 0} onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <Button variant="primary" onClick={() => void finish()}>
            Finish setup
          </Button>
        )}
      </div>
    </div>
  );
}
