# Crorpus

A wealth tracker for Indian investors. Crorpus keeps mutual funds, SIPs, direct stocks, PPF, EPF, NPS, deposits, gold, silver, property and loans in one ledger, and calculates returns, XIRR, net worth and progress toward a 1 crore goal from the transactions you enter.

It began as an eight tab Google Sheet. Rebuilding it meant auditing every formula, so the calculation engine reproduces the sheet's results and fixes the places where the sheet was wrong.

> Status: phase 1. The full UI runs on demo data stored in the browser. Supabase (accounts and database), live prices and spreadsheet import are phase 2.

## What it does

**Landing page** with a live dashboard demo, a spreadsheet vs Crorpus comparison, a 1 crore calculator, an XIRR explainer, the monthly ritual, security, plans and FAQ. Legal pages: privacy, terms, security, about.

**App screens** (`/app`)

| Screen | What it calculates |
|---|---|
| Overview | Net worth, invested, gain, monthly SIP, goal progress, allocation, net worth trend, SIP debits this month |
| Mutual funds | Units = amount / NAV, value = units x latest NAV (manual override available), gain, XIRR, category mix, monthly SIP check |
| Stocks | Moving average cost, unrealised and realised gain, weights, XIRR, sector allocation, trade summary |
| Fixed and retirement | PPF, EPF, NPS, FD, SGB, gold, silver: principal, value, gain, liquidity ladder, maturities |
| Net worth | Assets minus liabilities, debt to asset ratio with a 30 percent guide line |
| Goals | Progress, SIP needed (PMT), projected value (FV), completion date (NPER), what-if sliders |
| Monthly review | Comparison with last month, checklist, notes, snapshot history with month on month growth |
| Settings | Theme, JSON export and import, reset |

## Corrections to the original spreadsheet

1. The goal tab used the portfolio's total return as an annual rate. Now the user sets the expected return (default 12 percent).
2. Mixed monthly and annual compounding. Now monthly everywhere.
3. XIRR on holdings under a year gave absurd figures. Now absolute return under 365 days, XIRR after.
4. Average cost ignored sells. Now a moving average with realised gain tracked separately.
5. The sector table dropped sectors. The 20 directory labels are grouped into 12 sectors, all always shown.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4, Motion, Phosphor icons
- Zustand for state, behind a repository interface (`lib/data/repository.ts`) so a Supabase implementation can replace browser storage
- Vitest for the calculation engine

## Project structure

```
app/(marketing)/   landing page and legal pages
app/app/           the application screens
components/        ui kit, charts (hand written SVG), marketing, app shell
lib/engine/        pure calculation code: xirr, tvm, funds, stocks, goals, net worth, review, formatting
lib/data/          types, demo seed, stock directory, repository interface
lib/state/         store and derived figures
tests/engine/      unit tests reproducing the spreadsheet's results
scripts/           brand asset generator
```

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run test     # calculation engine tests
npm run lint
npm run build
```

## Design

Dark "Vault" theme by default, light "Ledger" theme available. Frosted glass buttons, Newsreader serif and IBM Plex Sans, tabular figures with Indian (lakh and crore) number formatting, and motion that respects `prefers-reduced-motion`.

## Roadmap

- Supabase auth and database with row level security
- Live NSE prices and AMFI NAVs
- Import from the original spreadsheet layout
- Multiple portfolios, alerts for missed SIPs and maturities

## Disclaimer

Crorpus is a record keeping and calculation tool, not investment, tax or legal advice. Projections are illustrations of the inputs you provide.
