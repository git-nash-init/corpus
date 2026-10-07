"use client";

import { useEffect, useMemo, useState } from "react";
import { AllocationBar } from "@/components/charts/AllocationBar";
import { Meter } from "@/components/charts/Meter";
import { Badge, EmptyState, PageHeader, Section, Signed, Stat } from "@/components/app/kit";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Reveal } from "@/components/motion/Reveal";
import { displayReturn, FUND_CATEGORIES, type FundPosition } from "@/lib/engine/mutualFunds";
import { formatDate, formatINR, formatNumber, formatPercent } from "@/lib/engine/format";
import { useApp } from "@/lib/state/useApp";
import { useStore } from "@/lib/state/store";
import { fundHistory, fundLatest, searchFunds, type FundHit, type FundInfo } from "@/lib/market/api";
import { navOnOrBefore } from "@/lib/market/nav";
import { PriceStatus } from "@/components/app/PriceStatus";
import type { Fund, FundCategory, FundTxnType, SipStatus } from "@/lib/data/types";

const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

export default function MutualFundsPage() {
  const { data, d, today } = useApp();
  const addFund = useStore((s) => s.addFund);
  const updateFund = useStore((s) => s.updateFund);
  const removeFund = useStore((s) => s.removeFund);
  const addFundTxn = useStore((s) => s.addFundTxn);
  const removeFundTxn = useStore((s) => s.removeFundTxn);

  const [fundModal, setFundModal] = useState(false);
  const [txnModal, setTxnModal] = useState<string | null | undefined>(undefined); // undefined closed, null = pick fund
  const [detail, setDetail] = useState<string | null>(null);

  if (!data || !d) return null;
  const detailRow = d.fundRows.find((r) => r.fund.id === detail);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Mutual funds and SIPs"
        title="Mutual funds"
        subtitle="Units and value come from each transaction's NAV. Returns switch from absolute to XIRR once a holding is a year old."
        actions={
          <>
            <PriceStatus />
            <Button onClick={() => setFundModal(true)}>Add fund</Button>
            <Button variant="primary" onClick={() => setTxnModal(null)} disabled={data.funds.length === 0}>
              Log investment
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Total invested" value={d.mf.invested} note="Cost of units still held" />
        <Stat label="Current value" value={d.mf.currentValue} note="Units x latest NAV" delay={0.06} />
        <Stat
          label="Total gain"
          value={d.mf.gain}
          tone={d.mf.gain >= 0 ? "gain" : "loss"}
          note={<Signed value={d.mf.absReturn} kind="percent" />}
          delay={0.12}
        />
        <Stat label="Monthly SIP" value={d.mf.monthlySip} note={`${d.sip.activeCount} of ${data.funds.length} funds active`} delay={0.18} />
      </div>

      <Reveal>
        <Section eyebrow="Holdings" title="Your funds" flush>
          {data.funds.length === 0 ? (
            <EmptyState
              title="No funds yet"
              body="Add a fund, then log your SIPs and lumpsums. Crorpus works out units, value and returns from those entries."
              action={<Button variant="primary" onClick={() => setFundModal(true)}>Add your first fund</Button>}
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fund</th>
                    <th>Category</th>
                    <th className="r">Units</th>
                    <th className="r">Invested</th>
                    <th className="r">NAV</th>
                    <th className="r">Value</th>
                    <th className="r">Gain</th>
                    <th className="r">Return</th>
                    <th>SIP</th>
                  </tr>
                </thead>
                <tbody>
                  {d.fundRows.map(({ fund, position: p }) => {
                    const ret = displayReturn(p.daysHeld, p.absReturn, p.xirr);
                    return (
                      <tr key={fund.id}>
                        <td>
                          <button type="button" className="text-left text-ink underline decoration-[var(--line-strong)] underline-offset-4 hover:decoration-[var(--brass)]" onClick={() => setDetail(fund.id)}>
                            {fund.name}
                          </button>
                        </td>
                        <td className="text-ink-2">{fund.category}</td>
                        <td className="r num">{formatNumber(p.units, 3)}</td>
                        <td className="r num">{formatINR(p.invested, { decimals: 0 })}</td>
                        <td className="r num">{formatNumber(fund.latestNav, 2)}</td>
                        <td className="r num">{formatINR(p.currentValue, { decimals: 0 })}</td>
                        <td className="r">
                          <Signed value={p.gain} />
                        </td>
                        <td className="r">
                          <Signed value={ret.value} kind="percent" />
                          <span className="ml-2 text-[11px] uppercase tracking-wider text-ink-3">{ret.kind === "xirr" ? "XIRR" : "Abs"}</span>
                        </td>
                        <td>
                          {fund.sipStatus === "Active" ? (
                            <span className="num">{formatINR(fund.sipAmount, { decimals: 0 })}</span>
                          ) : (
                            <Badge>{fund.sipStatus}</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>Total portfolio</td>
                    <td className="r num">{formatINR(d.mf.invested, { decimals: 0 })}</td>
                    <td />
                    <td className="r num">{formatINR(d.mf.currentValue, { decimals: 0 })}</td>
                    <td className="r">
                      <Signed value={d.mf.gain} />
                    </td>
                    <td className="r">
                      <Signed value={d.mf.absReturn} kind="percent" />
                    </td>
                    <td className="num">{formatINR(d.mf.monthlySip, { decimals: 0 })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Section>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <Section eyebrow="This month" title="SIP check" actions={<Badge tone={d.sip.status === "Completed" ? "gain" : "brass"}>{d.sip.status}</Badge>}>
            <dl className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-ink-3">Planned</dt>
                <dd className="num mt-1 text-lg text-ink">{formatINR(d.sip.planned, { decimals: 0 })}</dd>
              </div>
              <div>
                <dt className="text-ink-3">Debited</dt>
                <dd className="num mt-1 text-lg text-ink">{formatINR(d.sip.completed, { decimals: 0 })}</dd>
              </div>
              <div>
                <dt className="text-ink-3">Remaining</dt>
                <dd className="num mt-1 text-lg text-ink">{formatINR(d.sip.remaining, { decimals: 0 })}</dd>
              </div>
            </dl>
            <div className="mt-5">
              <Meter value={d.sip.share} label="SIP debits completed this month" />
              <p className="mt-2 text-sm text-ink-3">{formatPercent(d.sip.share, { decimals: 0 })} of this month&rsquo;s SIPs have debited.</p>
            </div>
          </Section>
        </Reveal>
        <Reveal delay={0.08}>
          <Section eyebrow="Mix" title="Category allocation">
            <AllocationBar rows={d.mfAllocation.map((r) => ({ label: r.category, value: r.value, share: r.share }))} hideEmpty={false} />
          </Section>
        </Reveal>
      </div>

      <FundModal
        open={fundModal}
        onClose={() => setFundModal(false)}
        onSave={(f) => {
          addFund(f);
          setFundModal(false);
        }}
        today={today}
      />

      <TxnModal
        open={txnModal !== undefined}
        funds={data.funds}
        fundId={txnModal ?? null}
        today={today}
        onClose={() => setTxnModal(undefined)}
        onSave={(t) => {
          addFundTxn(t);
          setTxnModal(undefined);
        }}
      />

      <Modal
        open={detail !== null && !!detailRow}
        onClose={() => setDetail(null)}
        title={detailRow?.fund.name ?? "Fund"}
        description={detailRow ? `${detailRow.fund.category} fund, first invested ${detailRow.position.firstDate ? formatDate(detailRow.position.firstDate) : "not yet"}` : undefined}
        variant="drawer"
        footer={
          detailRow ? (
            <>
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm(`Delete ${detailRow.fund.name} and all of its transactions? This cannot be undone.`)) {
                    removeFund(detailRow.fund.id);
                    setDetail(null);
                  }
                }}
              >
                Delete fund
              </Button>
              <Button variant="primary" onClick={() => setTxnModal(detailRow.fund.id)}>
                Log investment
              </Button>
            </>
          ) : null
        }
      >
        {detailRow ? (
          <FundDetail
            fund={detailRow.fund}
            position={detailRow.position}
            txns={data.fundTxns.filter((t) => t.fundId === detailRow.fund.id).sort((a, b) => b.date.localeCompare(a.date))}
            onPatch={(patch) => updateFund(detailRow.fund.id, patch)}
            onRemoveTxn={removeFundTxn}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function FundDetail({
  fund,
  position,
  txns,
  onPatch,
  onRemoveTxn,
}: {
  fund: Fund;
  position: FundPosition;
  txns: { id: string; date: string; type: string; amount: number; nav: number }[];
  onPatch: (p: Partial<Fund>) => void;
  onRemoveTxn: (id: string) => void;
}) {
  const [nav, setNav] = useState(String(fund.latestNav));
  const [manual, setManual] = useState(fund.manualValue === undefined ? "" : String(fund.manualValue));
  const ret = displayReturn(position.daysHeld, position.absReturn, position.xirr);

  return (
    <div className="space-y-8">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <div>
          <dt className="text-ink-3">Units held</dt>
          <dd className="num mt-1 text-lg">{formatNumber(position.units, 3)}</dd>
        </div>
        <div>
          <dt className="text-ink-3">Current value</dt>
          <dd className="num mt-1 text-lg">{formatINR(position.currentValue, { decimals: 0 })}</dd>
        </div>
        <div>
          <dt className="text-ink-3">Invested</dt>
          <dd className="num mt-1 text-lg">{formatINR(position.invested, { decimals: 0 })}</dd>
        </div>
        <div>
          <dt className="text-ink-3">{ret.kind === "xirr" ? "XIRR" : "Absolute return"}</dt>
          <dd className="mt-1 text-lg">
            <Signed value={ret.value} kind="percent" />
          </dd>
        </div>
      </dl>

      <div className="space-y-4">
        <h3 className="text-[20px]">Valuation</h3>
        <TextField label="Latest NAV" type="number" inputMode="decimal" step="0.01" value={nav} onChange={(e) => setNav(e.target.value)} onBlur={() => Number.isFinite(num(nav)) && num(nav) > 0 && onPatch({ latestNav: num(nav), navDate: new Date().toISOString().slice(0, 10) })} hint="Value is units x this NAV." />
        <TextField
          label="Manual value override (optional)"
          type="number"
          inputMode="decimal"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onBlur={() => onPatch({ manualValue: manual.trim() === "" || !Number.isFinite(num(manual)) ? undefined : num(manual) })}
          hint="Leave empty to use units x NAV. Use this only if your statement differs."
        />
        <SelectField label="SIP status" value={fund.sipStatus} onChange={(e) => onPatch({ sipStatus: e.target.value as SipStatus })}>
          <option>Active</option>
          <option>Paused</option>
          <option>Stopped</option>
        </SelectField>
      </div>

      <div>
        <h3 className="text-[20px]">Transactions</h3>
        {txns.length === 0 ? (
          <p className="mt-3 text-sm text-ink-2">No transactions yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--line)]">
            {txns.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="num w-24 text-ink-3">{formatDate(t.date)}</span>
                <span className="flex-1 text-ink-2">{t.type}</span>
                <span className="num text-ink">{formatINR(t.amount, { decimals: 0 })}</span>
                <button type="button" className="btn btn-ghost btn-sm" aria-label={`Delete ${t.type} of ${formatINR(t.amount, { decimals: 0 })} on ${formatDate(t.date)}`} onClick={() => onRemoveTxn(t.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FundModal({ open, onClose, onSave, today }: { open: boolean; onClose: () => void; onSave: (f: Omit<Fund, "id" | "userId">) => void; today: string }) {
  const [query, setQuery] = useState("");
  const [pickError, setPickError] = useState<string | null>(null);
  const [picked, setPicked] = useState<FundInfo | null>(null);
  const [loadingPick, setLoadingPick] = useState(false);
  const [manual, setManual] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<FundCategory>("Equity");
  const [sip, setSip] = useState("");
  const [day, setDay] = useState("10");
  const [nav, setNav] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});

  // Debounced live search of the AMFI scheme directory. Results remember the query they answer,
  // so "searching" is simply "the latest query has no result yet".
  const [res, setRes] = useState<{ q: string; hits: FundHit[]; failed: boolean } | null>(null);
  const q = query.trim();
  const activeSearch = !picked && !manual && q.length >= 2;
  useEffect(() => {
    if (!activeSearch) return;
    const t = window.setTimeout(() => {
      searchFunds(q)
        .then((h) => setRes({ q, hits: h, failed: false }))
        .catch(() => setRes({ q, hits: [], failed: true }));
    }, 300);
    return () => window.clearTimeout(t);
  }, [q, activeSearch]);
  const answered = activeSearch && res?.q === q;
  const searching = activeSearch && !answered;
  const hits = answered ? res.hits : [];
  const searchFailed = answered && res.failed;

  const pick = async (h: FundHit) => {
    setLoadingPick(true);
    setPickError(null);
    try {
      const info = await fundLatest(h.code);
      setPicked(info);
      setCategory(info.category);
    } catch {
      setPickError("Could not load that fund's NAV. Try another, or enter it manually.");
    } finally {
      setLoadingPick(false);
    }
  };

  const reset = () => {
    setQuery("");
    setPicked(null);
    setManual(false);
    setName("");
    setSip("");
    setNav("");
    setErr({});
  };

  const submit = () => {
    const e: Record<string, string> = {};
    const finalName = picked ? picked.name : name.trim();
    const finalNav = picked ? picked.latest.nav : num(nav);
    if (!finalName) e.name = !manual ? "Search for your fund, or choose to enter it manually." : "Enter the fund name.";
    if (!(finalNav > 0)) e.nav = "Enter the latest NAV, for example 102.45.";
    if (sip.trim() !== "" && !(num(sip) >= 0)) e.sip = "SIP amount cannot be negative.";
    const dn = num(day);
    if (!(dn >= 1 && dn <= 28)) e.day = "Choose a day from 1 to 28.";
    setErr(e);
    if (Object.keys(e).length) return;
    const amt = sip.trim() === "" ? 0 : num(sip);
    onSave({
      name: finalName,
      category,
      amfiCode: picked?.code,
      sipAmount: amt,
      sipDay: dn,
      sipStatus: amt > 0 ? "Active" : "Stopped",
      latestNav: finalNav,
      navDate: picked ? picked.latest.date : today,
    });
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a fund"
      description="Search the AMFI directory so NAVs stay live, then log what you invest."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit}>
            Add fund
          </Button>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        {picked ? (
          <div className="rounded-[4px] border border-line p-4">
            <p className="text-[16px]">{picked.name}</p>
            <p className="mt-1 text-sm text-ink-2">
              {picked.house}, {picked.schemeCategory}
            </p>
            <p className="num mt-2 text-sm text-ink-2">
              NAV {formatNumber(picked.latest.nav, 2)} on {formatDate(picked.latest.date)}
            </p>
            <button type="button" className="mt-3 text-sm text-brass underline underline-offset-4" onClick={() => setPicked(null)}>
              Choose a different fund
            </button>
          </div>
        ) : manual ? (
          <>
            <TextField label="Fund name" required value={name} onChange={(e) => setName(e.target.value)} error={err.name} />
            <TextField label="Latest NAV" required type="number" inputMode="decimal" step="0.01" value={nav} onChange={(e) => setNav(e.target.value)} error={err.nav} />
            <button type="button" className="text-sm text-brass underline underline-offset-4" onClick={() => setManual(false)}>
              Search the directory instead
            </button>
          </>
        ) : (
          <div>
            <TextField label="Search for a fund" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="HDFC Mid Cap Direct Growth" error={err.name} autoComplete="off" hint="Type at least two letters of the fund name." />
            {searching || loadingPick ? <p className="mt-3 text-sm text-ink-3">{loadingPick ? "Loading the fund..." : "Searching..."}</p> : null}
            {searchFailed || pickError ? (
              <p className="mt-3 text-sm" style={{ color: "var(--loss)" }} role="alert">
                {pickError ?? "Search is unavailable right now. You can enter the fund manually."}
              </p>
            ) : null}
            {hits.length ? (
              <ul className="mt-3 max-h-[260px] divide-y divide-[var(--line)] overflow-y-auto rounded-[4px] border border-line" aria-label="Matching funds">
                {hits.slice(0, 12).map((h) => (
                  <li key={h.code}>
                    <button type="button" className="w-full px-4 py-3 text-left text-[15px] leading-snug transition-colors duration-150 hover:bg-[var(--glass-fill-hover)]" onClick={() => void pick(h)}>
                      {h.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.trim().length >= 2 && !searching && !searchFailed && !pickError ? (
              <p className="mt-3 text-sm text-ink-3">No funds matched. Try fewer words, for example the fund house and category.</p>
            ) : null}
            <button type="button" className="mt-4 text-sm text-brass underline underline-offset-4" onClick={() => setManual(true)}>
              Cannot find it? Enter it manually
            </button>
          </div>
        )}

        <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value as FundCategory)}>
          {FUND_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </SelectField>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Monthly SIP (Rs)" type="number" inputMode="numeric" value={sip} onChange={(e) => setSip(e.target.value)} error={err.sip} hint="Leave empty if none." />
          <TextField label="SIP day of month" type="number" inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value)} error={err.day} />
        </div>
        <button type="submit" className="sr-only" tabIndex={-1}>
          Add fund
        </button>
      </form>
    </Modal>
  );
}

function TxnModal({
  open,
  funds,
  fundId,
  today,
  onClose,
  onSave,
}: {
  open: boolean;
  funds: Fund[];
  fundId: string | null;
  today: string;
  onClose: () => void;
  onSave: (t: { fundId: string; date: string; type: FundTxnType; amount: number; nav: number }) => void;
}) {
  const [pick, setPick] = useState<string>("");
  const [date, setDate] = useState(today);
  const [type, setType] = useState<FundTxnType>("SIP");
  const [amount, setAmount] = useState("");
  const [nav, setNav] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});

  const chosen = useMemo(() => funds.find((f) => f.id === (fundId ?? pick)) ?? funds[0], [funds, fundId, pick]);
  const code = chosen?.amfiCode;

  // The NAV in force on the chosen date, from the public AMFI history. The result carries the key it answers.
  const [navRes, setNavRes] = useState<{ key: string; hit: { nav: number; date: string } | null } | null>(null);
  const navKey = open && code && date ? `${code}|${date}` : null;
  useEffect(() => {
    if (!navKey || !code) return;
    let live = true;
    fundHistory(code)
      .then((h) => live && setNavRes({ key: navKey, hit: navOnOrBefore(h, date) }))
      .catch(() => live && setNavRes({ key: navKey, hit: null }));
    return () => {
      live = false;
    };
  }, [navKey, code, date]);
  const answeredNav = navKey !== null && navRes?.key === navKey;
  const auto = answeredNav ? navRes.hit : null;
  const autoState: "idle" | "loading" | "missing" = navKey === null ? "idle" : !answeredNav ? "loading" : navRes.hit ? "idle" : "missing";

  const effectiveNav = nav.trim() !== "" ? num(nav) : (auto?.nav ?? chosen?.latestNav ?? NaN);
  const units = num(amount) > 0 && effectiveNav > 0 ? num(amount) / effectiveNav : null;

  const submit = () => {
    const e: Record<string, string> = {};
    if (!chosen) e.fund = "Choose a fund.";
    if (!date || date > today) e.date = "Choose a date that is not in the future.";
    if (!(num(amount) > 0)) e.amount = "Enter an amount greater than zero.";
    if (!(effectiveNav > 0)) e.nav = "Enter the NAV on that date.";
    setErr(e);
    if (Object.keys(e).length || !chosen) return;
    onSave({ fundId: chosen.id, date, type, amount: num(amount), nav: effectiveNav });
    setAmount("");
    setNav("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log an investment"
      description="Units are worked out as amount divided by the NAV on the date."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit}>
            Save
          </Button>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <SelectField label="Fund" value={chosen?.id ?? ""} onChange={(e) => setPick(e.target.value)} error={err.fund} disabled={fundId !== null}>
          {funds.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </SelectField>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Date" type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} error={err.date} />
          <SelectField label="Type" value={type} onChange={(e) => setType(e.target.value as FundTxnType)}>
            <option value="SIP">SIP</option>
            <option value="Lumpsum">Lumpsum</option>
            <option value="Redemption">Redemption</option>
          </SelectField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Amount (Rs)" type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} error={err.amount} />
          <TextField
            label="NAV on the date"
            type="number"
            inputMode="decimal"
            step="0.0001"
            value={nav}
            onChange={(e) => setNav(e.target.value)}
            placeholder={auto ? String(auto.nav) : chosen ? String(chosen.latestNav) : ""}
            error={err.nav}
            hint={
              autoState === "loading"
                ? "Looking up the NAV..."
                : auto
                  ? `Live AMFI NAV${auto.date !== date ? ` from ${formatDate(auto.date)}` : ""}. Edit to override.`
                  : code
                    ? "No NAV found for that date. Enter it, or the latest NAV is used."
                    : "Empty uses the latest NAV."
            }
          />
        </div>
        {units !== null ? <p className="num text-sm text-ink-2">About {formatNumber(units, 3)} units</p> : null}
        <button type="submit" className="sr-only" tabIndex={-1}>
          Save
        </button>
      </form>
    </Modal>
  );
}
