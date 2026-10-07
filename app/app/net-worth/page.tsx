"use client";

import Link from "next/link";
import { useState } from "react";
import { Meter } from "@/components/charts/Meter";
import { Badge, PageHeader, Section, Stat } from "@/components/app/kit";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Reveal } from "@/components/motion/Reveal";
import { formatINR, formatPercent } from "@/lib/engine/format";
import type { BalanceAsset, BalanceAssetKind, Liability } from "@/lib/data/types";
import { useApp } from "@/lib/state/useApp";
import { useStore } from "@/lib/state/store";

const num = (s: string) => (s.trim() === "" ? NaN : Number(s));
const KIND_LABEL: Record<BalanceAssetKind, string> = { Cash: "Cash and savings", RealEstate: "Real estate", Vehicle: "Vehicle", Other: "Other asset" };

type Editing = { type: "asset"; item: BalanceAsset | null } | { type: "liability"; item: Liability | null } | null;

export default function NetWorthPage() {
  const { data, d } = useApp();
  const upsertAsset = useStore((s) => s.upsertBalanceAsset);
  const upsertLiability = useStore((s) => s.upsertLiability);
  const removeLiability = useStore((s) => s.removeLiability);
  const [editing, setEditing] = useState<Editing>(null);

  if (!data || !d) return null;
  const nw = d.netWorth;

  const investmentLines = [
    { label: "Mutual funds", value: d.mf.currentValue, href: "/app/mutual-funds" },
    { label: "Direct stocks", value: d.stockSum.currentValue, href: "/app/stocks" },
    ...data.fixedAssets.map((a) => ({ label: a.name, value: a.currentValue, href: "/app/fixed-assets" })),
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Balance sheet"
        title="Net worth"
        subtitle="Investments flow in from the other screens. Add cash, property, vehicles and every loan here."
        actions={
          <>
            <Button onClick={() => setEditing({ type: "liability", item: null })}>Add a liability</Button>
            <Button variant="primary" onClick={() => setEditing({ type: "asset", item: null })}>
              Add an asset
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Total assets" value={nw.totalAssets} note="Gross wealth base" />
        <Stat label="Total liabilities" value={nw.totalLiabilities} note="All outstanding debts" delay={0.06} />
        <Stat label="Net worth" value={nw.netWorth} tone={nw.netWorth >= 0 ? "gain" : "loss"} note="Assets minus debts" delay={0.12} />
        <Stat label="Debt to assets" value={nw.debtToAsset} format={(n) => formatPercent(n, { decimals: 1 })} note={nw.healthy ? "Under the 30% guideline" : "Above the 30% guideline"} tone={nw.healthy ? undefined : "loss"} delay={0.18} />
      </div>

      <Reveal>
        <Section eyebrow="Solvency" title="Debt-to-asset ratio">
          <Meter value={nw.debtToAsset} max={0.6} threshold={0.3} tone={nw.healthy ? "gain" : "loss"} label="Debt to asset ratio, guideline 30 percent" />
          <div className="mt-3 flex justify-between text-sm text-ink-3">
            <span>0%</span>
            <span>30% guideline</span>
            <span>60%</span>
          </div>
          <p className="mt-4 text-sm text-ink-2">
            Debts are <span className="num text-ink">{formatPercent(nw.debtToAsset, { decimals: 1 })}</span> of your assets.{" "}
            <Badge tone={nw.healthy ? "gain" : "loss"}>{nw.healthy ? "Healthy" : "High"}</Badge>
          </p>
        </Section>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <Section eyebrow="What you own" title="Assets" flush>
            <div className="px-6 pb-2">
              <p className="eyebrow mb-1 mt-2">Investments (linked)</p>
              <ul className="divide-y divide-[var(--line)]">
                {investmentLines.map((l) => (
                  <li key={l.label} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <Link href={l.href} className="text-ink underline decoration-[var(--line-strong)] underline-offset-4 hover:decoration-[var(--brass)]">
                      {l.label}
                    </Link>
                    <span className="num text-ink-2">{formatINR(l.value, { decimals: 0 })}</span>
                  </li>
                ))}
              </ul>
              <p className="eyebrow mb-1 mt-6">Cash, property and personal assets</p>
              <ul className="divide-y divide-[var(--line)]">
                {data.balanceAssets.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span>
                      {a.name}
                      <span className="ml-2 text-ink-3">{KIND_LABEL[a.kind]}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="num text-ink-2">{formatINR(a.value, { decimals: 0 })}</span>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing({ type: "asset", item: a })} aria-label={`Edit ${a.name}`}>
                        Edit
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-line-strong py-4 text-sm font-semibold">
                <span>Total assets</span>
                <span className="num">{formatINR(nw.totalAssets, { decimals: 0 })}</span>
              </div>
            </div>
          </Section>
        </Reveal>

        <Reveal delay={0.08}>
          <Section eyebrow="What you owe" title="Liabilities" flush>
            <div className="px-6 pb-2">
              {data.liabilities.length === 0 ? (
                <p className="py-6 text-ink-2">No liabilities recorded.</p>
              ) : (
                <ul className="divide-y divide-[var(--line)]">
                  {data.liabilities.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <span>
                        {l.name}
                        <span className="ml-2 text-ink-3">{l.lender}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="num text-ink-2">{formatINR(l.outstanding, { decimals: 0 })}</span>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing({ type: "liability", item: l })} aria-label={`Edit ${l.name}`}>
                          Edit
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex items-center justify-between border-t border-line-strong py-4 text-sm font-semibold">
                <span>Total liabilities</span>
                <span className="num">{formatINR(nw.totalLiabilities, { decimals: 0 })}</span>
              </div>
            </div>
          </Section>
        </Reveal>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        variant="drawer"
        title={editing?.type === "asset" ? (editing.item ? "Edit asset" : "Add an asset") : editing?.item ? "Edit liability" : "Add a liability"}
      >
        {editing?.type === "asset" ? (
          <AssetForm
            key={editing.item?.id ?? "new"}
            item={editing.item}
            userId={data.userId}
            onCancel={() => setEditing(null)}
            onSave={(a) => {
              upsertAsset(a);
              setEditing(null);
            }}
          />
        ) : editing?.type === "liability" ? (
          <LiabilityForm
            key={editing.item?.id ?? "new"}
            item={editing.item}
            userId={data.userId}
            onCancel={() => setEditing(null)}
            onSave={(l) => {
              upsertLiability(l);
              setEditing(null);
            }}
            onDelete={(id) => {
              if (window.confirm("Delete this liability?")) {
                removeLiability(id);
                setEditing(null);
              }
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function AssetForm({ item, userId, onSave, onCancel }: { item: BalanceAsset | null; userId: string; onSave: (a: BalanceAsset) => void; onCancel: () => void }) {
  const [name, setName] = useState(item?.name ?? "");
  const [kind, setKind] = useState<BalanceAssetKind>(item?.kind ?? "Cash");
  const [value, setValue] = useState(String(item?.value ?? ""));
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Give this asset a name.";
    if (!(num(value) >= 0)) e.value = "Enter a value of zero or more.";
    setErr(e);
    if (Object.keys(e).length) return;
    onSave({ id: item?.id ?? crypto.randomUUID(), userId, name: name.trim(), kind, value: num(value) });
  };
  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <TextField label="Name" required value={name} onChange={(e) => setName(e.target.value)} error={err.name} />
      <SelectField label="Kind" value={kind} onChange={(e) => setKind(e.target.value as BalanceAssetKind)}>
        {(Object.keys(KIND_LABEL) as BalanceAssetKind[]).map((k) => (
          <option key={k} value={k}>
            {KIND_LABEL[k]}
          </option>
        ))}
      </SelectField>
      <TextField label="Current value (Rs)" type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} error={err.value} />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Save
        </Button>
      </div>
    </form>
  );
}

function LiabilityForm({ item, userId, onSave, onCancel, onDelete }: { item: Liability | null; userId: string; onSave: (l: Liability) => void; onCancel: () => void; onDelete: (id: string) => void }) {
  const [name, setName] = useState(item?.name ?? "");
  const [lender, setLender] = useState(item?.lender ?? "");
  const [amount, setAmount] = useState(String(item?.outstanding ?? ""));
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Give this liability a name.";
    if (!(num(amount) >= 0)) e.amount = "Enter the outstanding amount, zero if cleared.";
    setErr(e);
    if (Object.keys(e).length) return;
    onSave({ id: item?.id ?? crypto.randomUUID(), userId, name: name.trim(), lender: lender.trim(), outstanding: num(amount) });
  };
  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <TextField label="Name" required value={name} onChange={(e) => setName(e.target.value)} error={err.name} placeholder="Home loan (principal)" />
      <TextField label="Lender" value={lender} onChange={(e) => setLender(e.target.value)} />
      <TextField label="Outstanding (Rs)" type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} error={err.amount} />
      <div className="flex flex-wrap justify-between gap-3 pt-2">
        {item ? (
          <Button variant="danger" onClick={() => onDelete(item.id)}>
            Delete
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save
          </Button>
        </div>
      </div>
    </form>
  );
}
