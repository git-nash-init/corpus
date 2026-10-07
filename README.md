# Crorpus

A wealth tracker for Indian investors. Crorpus keeps mutual funds, SIPs, direct stocks, PPF, EPF, NPS, deposits, gold, silver, property and loans in one ledger, and calculates returns, XIRR, net worth and progress toward a 1 crore goal from the transactions you enter. Fund NAVs and NSE share prices are pulled live from public data sources.

Live at **https://crorpus.vercel.app**

It began as an eight tab Google Sheet. Rebuilding it meant auditing every formula, so the calculation engine reproduces the sheet's results and fixes the places where the sheet was wrong.

## What it does

**Accounts and data**
- Email and password sign up with email confirmation, log in, forgot and reset password (Supabase Auth).
- Every record belongs to one user. Row level security in Postgres means a user can only ever read or change their own rows.
- Private file storage: a document vault (statements, contract notes, FD receipts) and profile photos. Files open only through short-lived signed links.
- Onboarding: name and avatar (8 preset portraits, or your own photo), what you track, import your spreadsheet, first goal.
- Spreadsheet import: upload the original Investment Tracker `.xlsx`. Funds are matched to live AMFI schemes, the NAV on every transaction date is looked up, and a preview is shown before anything is saved.
- Export everything as JSON, or delete all records and files, from Settings.

**Live market data (public sources, cached through our own route handlers)**
- Mutual funds: scheme search, latest NAV and full NAV history from [mfapi.in](https://www.mfapi.in) (AMFI data). The NAV on a SIP date is the latest NAV on or before it.
- Stocks: NSE prices and ticker search from Yahoo Finance's public endpoints, cached for five minutes.
- Prices refresh when the app opens and on demand. If a source is down, the last saved price is shown and flagged.

**Screens** (`/app`)

| Screen | What it calculates |
|---|---|
| Overview | Net worth, invested, gain, monthly SIP, goal progress, allocation, net worth trend, SIP debits this month |
| Mutual funds | Units = amount / NAV, value = units x latest NAV (manual override available), gain, XIRR, category mix, monthly SIP check |
| Stocks | Moving average cost, unrealised and realised gain, weights, XIRR, sector allocation, trade summary |
| Fixed and retirement | PPF, EPF, NPS, FD, SGB, gold, silver: principal, value, gain, liquidity ladder, maturities |
| Net worth | Assets minus liabilities, debt to asset ratio with a 30 percent guide line |
| Goals | Progress, SIP needed (PMT), projected value (FV), completion date (NPER), what-if sliders |
| Documents | Private vault with upload, download, delete, and links to holdings |
| Monthly review | Comparison with last month, checklist, notes, snapshot history with month on month growth |
| Settings | Profile, avatar, theme, spreadsheet import, export, delete data |

**Website**: landing page with a live sample dashboard, a spreadsheet vs Crorpus comparison, a 1 crore calculator, an XIRR explainer, FAQ, and privacy, terms, security and about pages.

**Phones first**: bottom tab bar, bottom-sheet dialogs, tables that become stacked cards, 48px touch targets, safe-area aware. Theme follows the device (light or dark) by default, with a System / Light / Dark control.

## Corrections to the original spreadsheet

1. The goal tab used the portfolio's total return as an annual rate. Now the user sets the expected return (default 12 percent).
2. Mixed monthly and annual compounding. Now monthly everywhere.
3. XIRR on holdings under a year gave absurd figures. Now absolute return under 365 days, XIRR after.
4. Average cost ignored sells. Now a moving average with realised gain tracked separately.
5. The sector table dropped sectors. The 20 directory labels are grouped into 12 sectors plus Other, all always shown.

## Tech stack

- Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript
- Supabase: Postgres + Auth + Storage (`@supabase/ssr`, `@supabase/supabase-js`)
- Tailwind CSS v4, Motion, Phosphor icons, hand written SVG charts
- Zustand for state, optimistic writes that roll back by reloading from the server on failure
- ExcelJS for spreadsheet import (loaded on demand)
- Vitest for the calculation engine, mappers and importer

## Project structure

```
app/(marketing)/   landing page and legal pages
app/(auth)/        log in, sign up, forgot and reset password
app/auth/confirm/  email link handler (token_hash and PKCE code)
app/app/           the signed-in application
app/api/           cached route handlers for mfapi.in and Yahoo Finance
components/        ui kit, charts, auth forms, app shell, marketing
lib/engine/        pure calculation code: xirr, tvm, funds, stocks, goals, net worth, review, formatting
lib/data/          domain types, row mappers, Supabase repository, documents, demo seed (landing page only)
lib/import/        spreadsheet parser and record builder
lib/market/        NAV lookup and API client helpers
lib/state/         store, live refresh, derived figures
proxy.ts           session refresh and /app guard
supabase/migrations/  the database schema, RLS policies, triggers and storage buckets
tests/             unit tests, plus opt-in end-to-end tests against a real database
```

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: the app falls back to the project in lib/supabase/config.ts
npm run dev                  # http://localhost:3000
npm run test                 # engine, mappers, importer
npm run lint
npm run build
```

### Database

The schema in `supabase/migrations/20261007_core_schema.sql` creates every table with row level security, the `handle_new_user` trigger (profile row plus the default monthly checklist), and the private `documents` and `avatars` storage buckets. Apply it to a new Supabase project with the SQL editor or `supabase db push`.

### Supabase dashboard settings

These cannot be set from code:

1. **Authentication, URL Configuration**: Site URL `https://crorpus.vercel.app`; Redirect URLs `https://crorpus.vercel.app/**` and `http://localhost:3000/**`.
2. **Authentication, Email Templates** (recommended, so links also work when opened on a different device): in *Confirm signup* set the link to
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/app`
   and in *Reset password* to
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`.
3. **Custom SMTP** (before launch): the built-in mailer allows only a few emails an hour.

### End-to-end tests (optional)

Run against a real project with a test user:

```bash
CRORPUS_E2E=1 E2E_EMAIL=you@example.com E2E_PASSWORD=... npm run test -- tests/e2e
```

They import the original workbook, reconcile it with the sheet's own figures, and check that files in the vault are private.

## Design

Dark "Vault" and light "Ledger" themes, brass accent, Newsreader serif and IBM Plex Sans, frosted glass buttons, tabular figures with Indian (lakh and crore) number formatting, and motion that respects `prefers-reduced-motion`.

## Roadmap

- Multiple portfolios and a family view
- Alerts for missed SIPs and maturities
- Tax gain reports
- Automatic month-end snapshots

## Disclaimer

Crorpus is a record keeping and calculation tool, not investment, tax or legal advice. Projections are illustrations of the inputs you provide. Market data comes from public third party sources and may be delayed or wrong.
