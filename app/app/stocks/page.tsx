"use client";

import { useState } from "react";
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
            <Button onClick={() => setPricesOpen(true)}>Update prices</Button>
            <Button variant="primary" onClick={() => setTradeOpen(true)}>
              Record a trade
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
  const [type, setType] = useState<"Buy" | "Sell">("Buy");
  const [date, setDate] = useState(today);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [cmp, setCmp] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});

  const symbol = ticker.trim().toUpperCase();
  const entry = STOCK_DIRECTORY.find((e) => e.ticker === symbol);
  const hasQuote = quotes.some((q) => q.ticker === symbol);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!symbol) e.ticker = "Enter a ticker, for example HDFCBANK.";
    else if (!entry && !hasQuote) e.ticker = "This ticker is not in the directory yet. Pick one from the list.";
    if (!date || date > today) e.date = "Choose a date that is not in the future.";
    if (!(num(qty) > 0) || !Number.isInteger(num(qty))) e.qty = "Enter a whole number of shares.";
    if (!(num(price) > 0)) e.price = "Enter the price per share.";
    if (!hasQuote && !(num(cmp) > 0)) e.cmp = "Enter today's price so the holding can be valued.";
    setErr(e);
    if (Object.keys(e).length) return;
    const quote: StockQuote | null = hasQuote || !entry ? null : { ticker: symbol, name: entry.name, sector: entry.sector, cmp: num(cmp) };
    const problem = onSave({ ticker: symbol, date, type, quantity: num(qty), price: num(price) }, quote);
    if (problem) {
      setErr({ qty: problem });
      return;
    }
    setTicker("");
    setQty("");
    setPrice("");
    setCmp("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record a trade"
      description="Sells are checked against what you hold on that date."
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
        <div className="field">
          <label htmlFor="ticker">Ticker *</label>
          <input id="ticker" className="input" list="tickers" value={ticker} onChange={(e) => setTicker(e.target.value)} aria-invalid={err.ticker ? true : undefined} autoComplete="off" placeholder="HDFCBANK" />
          <datalist id="tickers">
            {STOCK_DIRECTORY.map((e) => (
              <option key={e.ticker} value={e.ticker}>
                {e.name}
              </option>
            ))}
          </datalist>
          {err.ticker ? (
            <p className="error" role="alert">
              {err.ticker}
            </p>
          ) : entry ? (
            <p className="hint">
              {entry.name}, {entry.sector}
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
          <TextField label="Price per share (Rs)" type="number" inputMode="decimal" step="0.05" value={price} onChange={(e) => setPrice(e.target.value)} error={err.price} />
        </div>
        {!hasQuote && symbol && entry ? (
          <TextField label="Today's price (Rs)" type="number" inputMode="decimal" step="0.05" value={cmp} onChange={(e) => setCmp(e.target.value)} error={err.cmp} hint="Used to value this holding until live prices are connected." />
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
      description="Live NSE prices arrive with the database connection. Until then, enter current prices by hand."
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
