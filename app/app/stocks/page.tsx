"use client";

import { useEffect, useState } from "react";
import { AllocationBar } from "@/components/charts/AllocationBar";
import { Badge, EmptyState, PageHeader, Section, Signed, Stat } from "@/components/app/kit";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Reveal } from "@/components/motion/Reveal";
import { displayReturn } from "@/lib/engine/mutualFunds";
import { formatDate, formatINR, formatNumber, formatPercent } from "@/lib/engine/format";
import { STOCK_DIRECTORY } from "@/lib/data/stock-directory";
import type { StockQuote } from "@/lib/data/types";
import { useApp } from "@/lib/state/useApp";
import { useStore } from "@/lib/state/store";
import { searchStocks, stockQuotes, type StockHit } from "@/lib/market/api";
import { PriceStatus } from "@/components/app/PriceStatus";

const num = (s: string) => (s.trim() === "" ? NaN : Number(s));

export default function StocksPage() {
  const { data, d, today } = useApp();
  const addStockTxn = useStore((s) => s.addStockTxn);
  const removeStockTxn = useStore((s) => s.removeStockTxn);
  const upsertQuotes = useStore((s) => s.upsertQuotes);

  const [tradeOpen, setTradeOpen] = useState(false);
  const [pricesOpen, setPricesOpen] = useState(false);

  if (!data || !d) return null;

  const trades = [...data.stockTxns].sort((a, b) => b.date.localeCompare(a.date));
  const totalReturn = displayReturn(
    Math.max(0, ...d.positions.map((p) => p.daysHeld)),
    d.stockSum.absReturn,
    d.stockSum.xirr,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Direct equity"
        title="Stocks"
        subtitle="Average cost moves with every buy and sell, so selling part of a holding books a realised gain instead of distorting your cost."
        actions={
          <>
            <PriceStatus />
            <Button onClick={() => setPricesOpen(true)}>Edit prices</Button>
            <Button variant="primary" onClick={() => setTradeOpen(true)}>
              Record a trade
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Invested" value={d.stockSum.invested} note={`${d.stockSum.holdings} companies held`} />
        <Stat label="Current value" value={d.stockSum.currentValue} note="Quantity x current price" delay={0.06} />
        <Stat
          label="Unrealised gain"
          value={d.stockSum.gain}
          tone={d.stockSum.gain >= 0 ? "gain" : "loss"}
          note={
            <>
              <Signed value={d.stockSum.absReturn} kind="percent" />
              <span className="ml-2 text-ink-3">{totalReturn.kind === "xirr" ? `XIRR ${formatPercent(totalReturn.value ?? 0, { sign: true, decimals: 1 })}` : "absolute"}</span>
            </>
          }
          delay={0.12}
        />
        <Stat
          label="Realised gain"
          value={d.stockSum.realised}
          tone={d.stockSum.realised >= 0 ? "gain" : "loss"}
          note="Profit booked on sells"
          delay={0.18}
        />
      </div>

      <Reveal>
        <Section eyebrow="Holdings" title="Equity portfolio" flush>
          {d.positions.length === 0 ? (
            <EmptyState
              title="No holdings yet"
              body="Record your first buy. Crorpus tracks quantity, average cost, returns and sector mix from your trades."
              action={<Button variant="primary" onClick={() => setTradeOpen(true)}>Record a trade</Button>}
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Company</th>
                    <th>Sector</th>
                    <th className="r">Qty</th>
                    <th className="r">Avg cost</th>
                    <th className="r">Price</th>
                    <th className="r">Invested</th>
                    <th className="r">Value</th>
                    <th className="r">Gain</th>
                    <th className="r">Return</th>
                    <th className="r">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {d.positions.map((p) => {
                    const ret = displayReturn(p.daysHeld, p.absReturn, p.xirr);
                    return (
                      <tr key={p.ticker}>
                        <td className="font-medium">{p.ticker}</td>
                        <td className="text-ink-2">{p.name}</td>
                        <td className="text-ink-2">{p.sector}</td>
                        <td className="r num">{formatNumber(p.quantity, 0)}</td>
                        <td className="r num">{formatNumber(p.avgCost, 2)}</td>
                        <td className="r num">{p.cmp > 0 ? formatNumber(p.cmp, 2) : <Badge tone="loss">No price</Badge>}</td>
                        <td className="r num">{formatINR(p.invested, { decimals: 0 })}</td>
                        <td className="r num">{formatINR(p.currentValue, { decimals: 0 })}</td>
                        <td className="r">
                          <Signed value={p.gain} />
                        </td>
                        <td className="r">
                          <Signed value={ret.value} kind="percent" />
                          <span className="ml-2 text-[11px] uppercase tracking-wider text-ink-3">{ret.kind === "xirr" ? "XIRR" : "Abs"}</span>
                        </td>
                        <td className="r num text-ink-2">{formatPercent(p.weight, { decimals: 1 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6}>Total equity portfolio</td>
                    <td className="r num">{formatINR(d.stockSum.invested, { decimals: 0 })}</td>
                    <td className="r num">{formatINR(d.stockSum.currentValue, { decimals: 0 })}</td>
                    <td className="r">
                      <Signed value={d.stockSum.gain} />
                    </td>
                    <td className="r">
                      <Signed value={d.stockSum.absReturn} kind="percent" />
                    </td>
                    <td className="r num">100.0%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Section>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <Section eyebrow="Spread" title="Sector allocation">
            <AllocationBar rows={d.stockSectors.map((s) => ({ label: s.sector, value: s.value, share: s.share }))} />
          </Section>
        </Reveal>
        <Reveal delay={0.08}>
          <Section eyebrow="Activity" title="Trade summary">
            <dl className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <dt className="text-ink-3">Total purchases</dt>
                <dd className="num mt-1 text-xl text-ink">{formatINR(d.trades.purchases, { decimals: 0 })}</dd>
              </div>
              <div>
                <dt className="text-ink-3">Sales realised</dt>
                <dd className="num mt-1 text-xl text-ink">{formatINR(d.trades.sales, { decimals: 0 })}</dd>
              </div>
              <div>
                <dt className="text-ink-3">Net cash deployed</dt>
                <dd className="num mt-1 text-xl text-ink">{formatINR(d.trades.netDeployed, { decimals: 0 })}</dd>
              </div>
              <div>
                <dt className="text-ink-3">Orders recorded</dt>
                <dd className="num mt-1 text-xl text-ink">{d.trades.trades}</dd>
              </div>
            </dl>
          </Section>
        </Reveal>
      </div>

      <Reveal>
        <Section eyebrow="Log" title="Trade history" flush>
          {trades.length === 0 ? (
            <EmptyState title="No trades recorded" body="Your buys and sells will be listed here, newest first." />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Ticker</th>
                    <th>Type</th>
                    <th className="r">Qty</th>
                    <th className="r">Price</th>
                    <th className="r">Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => (
                    <tr key={t.id}>
                      <td className="num text-ink-2">{formatDate(t.date)}</td>
                      <td className="font-medium">{t.ticker}</td>
                      <td>
                        <Badge tone={t.type === "Buy" ? "gain" : "brass"}>{t.type}</Badge>
                      </td>
                      <td className="r num">{formatNumber(t.quantity, 0)}</td>
                      <td className="r num">{formatNumber(t.price, 2)}</td>
                      <td className="r num">{formatINR(t.quantity * t.price, { decimals: 0 })}</td>
                      <td className="r">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          aria-label={`Remove ${t.type} of ${t.quantity} ${t.ticker} on ${formatDate(t.date)}`}
                          onClick={() => {
                            if (window.confirm("Remove this trade? Holdings and returns will be recalculated.")) removeStockTxn(t.id);
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </Reveal>

      <TradeModal
        open={tradeOpen}
        onClose={() => setTradeOpen(false)}
        today={today}
        quotes={data.quotes}
        onSave={(t, quote) => {
          if (quote) upsertQuotes([quote]);
          const problem = addStockTxn(t);
          if (!problem) setTradeOpen(false);
          return problem;
        }}
      />

      <PricesModal
        open={pricesOpen}
        onClose={() => setPricesOpen(false)}
        quotes={data.quotes}
        onSave={(qs) => {
          upsertQuotes(qs);
          setPricesOpen(false);
        }}
      />
    </div>
  );
}

function TradeModal({
  open,
  onClose,
  today,
  quotes,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  today: string;
  quotes: StockQuote[];
  onSave: (t: { ticker: string; date: string; type: "Buy" | "Sell"; quantity: number; price: number }, quote: StockQuote | null) => string | null;
}) {
  const [ticker, setTicker] = useState("");
  const [picked, setPicked] = useState<StockHit | null>(null);
  const [type, setType] = useState<"Buy" | "Sell">("Buy");
  const [date, setDate] = useState(today);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [cmp, setCmp] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});

  const symbol = (picked?.ticker ?? ticker).trim().toUpperCase();
  const known = STOCK_DIRECTORY.find((e) => e.ticker === symbol);
  const stored = quotes.find((q) => q.ticker === symbol);

  // Debounced live search while the user types. Results remember the query they answer.
  const [res, setRes] = useState<{ q: string; hits: StockHit[] } | null>(null);
  const q = ticker.trim();
  const activeSearch = !picked && q.length >= 1;
  useEffect(() => {
    if (!activeSearch) return;
    const t = window.setTimeout(() => {
      searchStocks(q)
        .then((h) => setRes({ q, hits: h }))
        .catch(() => setRes({ q, hits: [] }));
    }, 250);
    return () => window.clearTimeout(t);
  }, [q, activeSearch]);
  const searchDone = activeSearch && res?.q === q;
  const searching = activeSearch && !searchDone;
  const hits = searchDone ? res.hits : [];

  // Live NSE price for the chosen symbol.
  const [liveRes, setLiveRes] = useState<{ symbol: string; quote: { price: number; time: number } | null } | null>(null);
  const liveKey = open && /^[A-Z0-9&-]{1,20}$/.test(symbol) && (picked || known || stored) ? symbol : null;
  useEffect(() => {
    if (!liveKey) return;
    let alive = true;
    stockQuotes([liveKey])
      .then((m) => alive && setLiveRes({ symbol: liveKey, quote: m[liveKey] ? { price: m[liveKey].price, time: m[liveKey].time } : null }))
      .catch(() => alive && setLiveRes({ symbol: liveKey, quote: null }));
    return () => {
      alive = false;
    };
  }, [liveKey]);
  const liveAnswered = liveKey !== null && liveRes?.symbol === liveKey;
  const live = liveAnswered ? liveRes.quote : null;
  const liveState: "idle" | "loading" | "missing" = liveKey === null ? "idle" : !liveAnswered ? "loading" : liveRes.quote ? "idle" : "missing";

  const needsManualCmp = !stored && !live;

  const submit = () => {
    const e: Record<string, string> = {};
    if (!symbol) e.ticker = "Search for a company or enter a ticker, for example HDFCBANK.";
    else if (!picked && !known && !stored) e.ticker = "Pick a company from the suggestions so we can find its price.";
    if (!date || date > today) e.date = "Choose a date that is not in the future.";
    if (!(num(qty) > 0) || !Number.isInteger(num(qty))) e.qty = "Enter a whole number of shares.";
    const px = price.trim() !== "" ? num(price) : (live?.price ?? NaN);
    if (!(px > 0)) e.price = "Enter the price per share.";
    if (needsManualCmp && !(num(cmp) > 0)) e.cmp = "Live price is unavailable. Enter today's price so the holding can be valued.";
    setErr(e);
    if (Object.keys(e).length) return;
    const quote: StockQuote | null = stored
      ? null
      : {
          ticker: symbol,
          name: picked?.name ?? known?.name ?? symbol,
          sector: ((picked?.sector ?? known?.sector ?? "Other") as StockQuote["sector"]),
          cmp: live?.price ?? num(cmp),
        };
    const problem = onSave({ ticker: symbol, date, type, quantity: num(qty), price: px }, quote);
    if (problem) {
      setErr({ qty: problem });
      return;
    }
    setTicker("");
    setPicked(null);
    setQty("");
    setPrice("");
    setCmp("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record a trade"
      description="Search any NSE stock. Sells are checked against what you hold on that date."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit}>
            Save trade
          </Button>
        </>
      }
    >
      <form
        className="space-y-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div>
          {picked ? (
            <div className="rounded-[4px] border border-line p-4">
              <p className="text-[16px]">
                {picked.ticker} <span className="text-ink-2">{picked.name}</span>
              </p>
              <button
                type="button"
                className="mt-2 text-sm text-brass underline underline-offset-4"
                onClick={() => {
                  setPicked(null);
                  setTicker("");
                }}
              >
                Choose a different stock
              </button>
            </div>
          ) : (
            <>
              <TextField label="Stock" required value={ticker} onChange={(e) => setTicker(e.target.value)} error={err.ticker} placeholder="HDFC Bank or HDFCBANK" autoComplete="off" />
              {searching ? <p className="mt-2 text-sm text-ink-3">Searching...</p> : null}
              {hits.length ? (
                <ul className="mt-2 max-h-[220px] divide-y divide-[var(--line)] overflow-y-auto rounded-[4px] border border-line" aria-label="Matching stocks">
                  {hits.map((h) => (
                    <li key={h.ticker}>
                      <button type="button" className="flex w-full items-baseline justify-between gap-3 px-4 py-3 text-left text-[15px] transition-colors duration-150 hover:bg-[var(--glass-fill-hover)]" onClick={() => setPicked(h)}>
                        <span className="font-medium">{h.ticker}</span>
                        <span className="truncate text-ink-2">{h.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
          {symbol && (picked || known || stored) ? (
            <p className="mt-2 text-sm text-ink-2" role="status">
              {liveState === "loading" ? "Fetching the live price..." : live ? `Live NSE price ${formatNumber(live.price, 2)}` : stored ? `Last saved price ${formatNumber(stored.cmp, 2)}` : "Live price unavailable right now."}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Type" value={type} onChange={(e) => setType(e.target.value as "Buy" | "Sell")}>
            <option>Buy</option>
            <option>Sell</option>
          </SelectField>
          <TextField label="Date" type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} error={err.date} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Quantity" type="number" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} error={err.qty} />
          <TextField label="Price per share (Rs)" type="number" inputMode="decimal" step="0.05" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={live ? String(live.price) : ""} error={err.price} hint={live && date === today ? "Empty uses the live price." : undefined} />
        </div>
        {needsManualCmp && symbol && (picked || known) && liveState !== "loading" ? (
          <TextField label="Today's price (Rs)" type="number" inputMode="decimal" step="0.05" value={cmp} onChange={(e) => setCmp(e.target.value)} error={err.cmp} hint="Used to value this holding because a live price could not be fetched." />
        ) : null}
        <button type="submit" className="sr-only" tabIndex={-1}>
          Save trade
        </button>
      </form>
    </Modal>
  );
}

function PricesModal({ open, onClose, quotes, onSave }: { open: boolean; onClose: () => void; quotes: StockQuote[]; onSave: (q: StockQuote[]) => void }) {
  const [vals, setVals] = useState<Record<string, string>>({});

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="drawer"
      title="Update prices"
      description="Live prices refresh automatically. Use this only to override a price by hand."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              const next = quotes.map((q) => (num(vals[q.ticker] ?? "") > 0 ? { ...q, cmp: num(vals[q.ticker]) } : q));
              onSave(next);
              setVals({});
            }}
          >
            Save prices
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {quotes.map((q) => (
          <TextField
            key={q.ticker}
            label={`${q.ticker}  ${q.name}`}
            type="number"
            inputMode="decimal"
            step="0.05"
            value={vals[q.ticker] ?? String(q.cmp)}
            onChange={(e) => setVals((v) => ({ ...v, [q.ticker]: e.target.value }))}
          />
        ))}
      </div>
    </Modal>
  );
}
