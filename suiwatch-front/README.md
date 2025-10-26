<!-- prettier-ignore -->
# Portfolio Checker — SuiWatch

An elegant, focused dashboard to inspect Sui on-chain portfolios, analyze pool positions, and preview airdrop eligibility.

Built for designers and devs who want fast glanceable insights plus the ability to deep-dive into wallet holdings.

Highlights
- Polished token portfolio view with balances, prices and USD value
- Pool Checker: shows positions, TVL, pending fees and reward APRs
- Airdrop Checker: snapshot-driven eligibility list with token amounts and expiration
- Wallet connect integration for interactive flows
- Small backend/API layer for lookups and snapshot hosting

Quick demo (what you'll see)
- Net worth summary, top token breakdown and a compact holdings chart
- Token table with aligned columns: Price · Balance · USD value · actions
- Pool rows with overlapping token icons, TVL, fees and APR breakdown
- Airdrop list showing project, token, eligibility and expiration

Quick start

Requirements
- Node.js (16+) and npm

Install & run

```bash
npm install
npm run dev
```

Start the small server (optional)

```bash
node server/index.js
```

Build for production

```bash
npm run build
```

Project layout

- `src/` — Vue 3 frontend (components, composables, styles)
- `server/` — tiny express-like endpoints and snapshot fixtures
- `api/` — serverless routes used by the UI (proxy / helpers)
- `img/`, `public/` — static assets and icons

Airdrop & snapshots

Drop JSON snapshot files into `server/snapshots/` (example format: array of addresses or eligibility objects). The UI uses `/api/airdrop-list` to load demo data — you can wire it to your own snapshot lookup route.

What I already wired for you
- Airdrop fetcher and UI (reads /api/airdrop-list) with expiration, token amounts and USD estimates
- Pool positions fetch (mmt-positions) and a responsive grid layout
- Token enrichment and price refresh helper

Developer notes
- Uses Tailwind CSS for utilities and responsive layout
- SFCs use `<script setup lang="ts">` (TypeScript-aware) — some components are imported with a `.default ||` fallback to avoid SFC default-export warnings in some TypeScript configs
- Format helpers: `formatUSD`, `formatNumber`, `formatAprWithPercent` live in `src/App.vue` for now — feel free to extract to `src/utils` for reuse

Ideas / next steps
- Add a claim flow connected to a wallet (tx construction + signing)
- Add snapshot management UI & scheduled snapshot import from external sources
- Add unit tests for the airdrop mapping and pool parsing logic

Contributing

1. Fork & create a feature branch
2. Run `npm install` and `npm run dev`
3. Open a PR with screenshots and a short description of the change

License

This repo doesn't include a license file yet — add a `LICENSE` (MIT/Apache/Business) to clarify reuse terms.

Need it prettier? I can:
- add a hero screenshot and badges
- generate multi-size favicons and a manifest
- scaffold a `server/snapshots/example.json` and a test route

Happy to polish further — tell me which part you'd like spruced up (screenshots, badges, or a one-page README landing section).

