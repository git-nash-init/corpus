"use client";

import { useState } from "react";
import { AllocationBar } from "@/components/charts/AllocationBar";
import { Badge, EmptyState, PageHeader, Section, Signed, Stat } from "@/components/app/kit";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Reveal } from "@/components/motion/Reveal";
import { daysBetween } from "@/lib/engine/dates";
import { formatDate, formatINR, formatPercent } from "@/lib/engine/format";
import type { FixedAsset, FixedAssetKind, LiquidityTag } from "@/lib/data/types";
import { useApp } from "@/lib/state/useApp";
import { useStore } from "@/lib/state/store";

const KINDS: FixedAssetKind[] = ["PPF", "EPF", "NPS", "FD", "SGB", "Gold", "Silver"];
const LIQUIDITY: LiquidityTag[] = ["Highly Liquid", "Semi-Liquid", "Locked"];
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const num = (s: string) => (s.trim() === "" ? 0 : Number(s));

export default function FixedAssetsPage() {
  const { data, d, today } = useApp();
  const upsert = useStore((s) => s.upsertFixedAsset);
  const remove = useStore((s) => s.removeFixedAsset);
  const [editing, setEditing] = useState<FixedAsset | "new" | null>(null);

  if (!data || !d) return null;

  const upcoming = data.fixedAssets
    .filter((a) => isDate(a.maturity) && daysBetween(today, a.maturity) >= 0 && daysBetween(today, a.maturity) <= 365)
    .sort((a, b) => a.maturity.localeCompare(b.maturity));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Fixed income, retirement and commodities"
        title="Fixed and retirement"
        subtitle="PPF, EPF, NPS, deposits, gold and silver. Enter the latest balance from your statement and Crorpus does the rest."
        actions={
          <Button variant="primary" onClick={() => setEditing("new")}>
            Add an asset
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Principal contributed" value={d.fixed.invested} note="Money you put in" />
        <Stat label="Current value" value={d.fixed.currentValue} note="Latest verified balance" delay={0.06} />
        <Stat label="Gain or interest" value={d.fixed.gain} tone={d.fixed.gain >= 0 ? "gain" : "loss"} note="Value minus principal" delay={0.12} />
        <Stat label="Annual contribution" value={d.fixed.annualContribution} note="Scheduled yearly savings" delay={0.18} />
      </div>

      <Reveal>
        <Section eyebrow="Holdings" title="Assets" flush>
          {data.fixedAssets.length === 0 ? (
            <EmptyState title="Nothing here yet" body="Add a PPF, EPF, NPS, fixed deposit, gold or silver holding." action={<Button variant="primary" onClick={() => setEditing("new")}>Add an asset</Button>} />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Provider</th>
                    <th className="r">Invested</th>
                    <th className="r">Value</th>
                    <th className="r">Gain</th>
                    <th className="r">Per year</th>
                    <th>Matures</th>
                    <th>Liquidity</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.fixedAssets.map((a) => (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                      <td className="text-ink-2">{a.provider}</td>
                      <td className="r num">{formatINR(a.invested, { decimals: 0 })}</td>
                      <td className="r num">{formatINR(a.currentValue, { decimals: 0 })}</td>
                      <td className="r">
                        <Signed value={a.currentValue - a.invested} />
                      </td>
                      <td className="r num text-ink-2">{a.annualContribution > 0 ? formatINR(a.annualContribution, { decimals: 0 }) : "None"}</td>
                      <td className="text-ink-2">{isDate(a.maturity) ? formatDate(a.maturity) : a.maturity || "Open"}</td>
                      <td>
                        <Badge tone={a.liquidity === "Highly Liquid" ? "gain" : a.liquidity === "Locked" ? "loss" : "brass"}>{a.liquidity}</Badge>
                      </td>
                      <td className="r">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(a)} aria-label={`Edit ${a.name}`}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>Total</td>
                    <td className="r num">{formatINR(d.fixed.invested, { decimals: 0 })}</td>
                    <td className="r num">{formatINR(d.fixed.currentValue, { decimals: 0 })}</td>
                    <td className="r">
                      <Signed value={d.fixed.gain} />
                    </td>
                    <td className="r num">{formatINR(d.fixed.annualContribution, { decimals: 0 })}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Section>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <Section eyebrow="Access" title="Liquidity ladder">
            <AllocationBar rows={d.ladder.map((l) => ({ label: l.liquidity, value: l.value, share: l.share }))} hideEmpty={false} />
            <p className="mt-4 text-sm text-ink-3">
              {formatPercent(d.ladder.find((l) => l.liquidity === "Highly Liquid")?.share ?? 0, { decimals: 0 })} of this bucket can be turned into cash on demand.
            </p>
          </Section>
        </Reveal>
        <Reveal delay={0.08}>
          <Section eyebrow="Next 12 months" title="Upcoming maturities">
            {upcoming.length === 0 ? (
              <p className="text-ink-2">Nothing matures in the next year.</p>
            ) : (
              <ul className="divide-y divide-[var(--line)]">
                {upcoming.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-3 text-sm">
                    <span className="flex-1">{a.name}</span>
                    <span className="num text-ink-2">{formatDate(a.maturity)}</span>
                    <Badge tone="brass">{daysBetween(today, a.maturity)} days</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </Reveal>
      </div>

      <AssetModal
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={(a) => {
          upsert(a);
          setEditing(null);
        }}
        onDelete={(id) => {
          if (window.confirm("Delete this asset?")) {
            remove(id);
            setEditing(null);
          }
        }}
        userId={data.userId}
      />
    </div>
  );
}

function AssetModal({
  editing,
  onClose,
  onSave,
  onDelete,
  userId,
}: {
  editing: FixedAsset | "new" | null;
  onClose: () => void;
  onSave: (a: FixedAsset) => void;
  onDelete: (id: string) => void;
  userId: string;
}) {
  const asset = editing && editing !== "new" ? editing : null;
  // Remount the form whenever a different asset is opened so fields reset.
  return (
    <Modal open={editing !== null} onClose={onClose} title={asset ? "Edit asset" : "Add an asset"} variant="drawer">
      {editing !== null ? <AssetForm key={asset?.id ?? "new"} asset={asset} userId={userId} onSave={onSave} onCancel={onClose} onDelete={onDelete} /> : null}
    </Modal>
  );
}

function AssetForm({ asset, userId, onSave, onCancel, onDelete }: { asset: FixedAsset | null; userId: string; onSave: (a: FixedAsset) => void; onCancel: () => void; onDelete: (id: string) => void }) {
  const [kind, setKind] = useState<FixedAssetKind>(asset?.kind ?? "FD");
  const [name, setName] = useState(asset?.name ?? "");
  const [provider, setProvider] = useState(asset?.provider ?? "");
  const [invested, setInvested] = useState(String(asset?.invested ?? ""));
  const [value, setValue] = useState(String(asset?.currentValue ?? ""));
  const [contrib, setContrib] = useState(String(asset?.annualContribution ?? ""));
  const [maturity, setMaturity] = useState(asset?.maturity ?? "");
  const [liquidity, setLiquidity] = useState<LiquidityTag>(asset?.liquidity ?? "Semi-Liquid");
  const [err, setErr] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Give this asset a name.";
    if (!(num(invested) >= 0) || Number.isNaN(num(invested))) e.invested = "Enter the principal you put in.";
    if (!(num(value) >= 0) || Number.isNaN(num(value))) e.value = "Enter the current value.";
    if (maturity && !isDate(maturity) && kind !== "EPF" && kind !== "NPS" && kind !== "Gold" && kind !== "Silver") e.maturity = "Use a date, for example 2031-04-01.";
    setErr(e);
    if (Object.keys(e).length) return;
    onSave({
      id: asset?.id ?? `fa-${Math.random().toString(36).slice(2, 9)}`,
      userId,
      kind,
      name: name.trim(),
      provider: provider.trim(),
      invested: num(invested),
      currentValue: num(value),
      annualContribution: num(contrib),
      maturity,
      liquidity,
    });
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
      <SelectField label="Type" value={kind} onChange={(e) => setKind(e.target.value as FixedAssetKind)}>
        {KINDS.map((k) => (
          <option key={k}>{k}</option>
        ))}
      </SelectField>
      <TextField label="Name" required value={name} onChange={(e) => setName(e.target.value)} error={err.name} placeholder="Bank Fixed Deposit" />
      <TextField label="Provider" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="HDFC Bank" />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Invested (Rs)" type="number" inputMode="decimal" value={invested} onChange={(e) => setInvested(e.target.value)} error={err.invested} />
        <TextField label="Current value (Rs)" type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} error={err.value} />
      </div>
      <TextField label="Yearly contribution (Rs)" type="number" inputMode="decimal" value={contrib} onChange={(e) => setContrib(e.target.value)} hint="What you add each year, if anything." />
      <TextField label="Maturity" value={maturity} onChange={(e) => setMaturity(e.target.value)} error={err.maturity} placeholder="2031-04-01, Age 60 or Anytime" />
      <SelectField label="Liquidity" value={liquidity} onChange={(e) => setLiquidity(e.target.value as LiquidityTag)}>
        {LIQUIDITY.map((l) => (
          <option key={l}>{l}</option>
        ))}
      </SelectField>
      <div className="flex flex-wrap justify-between gap-3 pt-2">
        {asset ? (
          <Button variant="danger" onClick={() => onDelete(asset.id)}>
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
