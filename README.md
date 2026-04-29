# Lostark Central Web (Next.js)

Phase 1 migration tu `Lostark-helper-master` (Angular/Nx) sang Next.js de deploy tren Vercel.

## Da migrate trong phase 1

- Next.js App Router + TypeScript setup.
- App shell (sidebar + grouped menu) theo cau truc route goc.
- Tat ca route chinh:
  - `/`
  - `/checklist`
  - `/roster`
  - `/tasks-manager`
  - `/gold-planner`
  - `/friends`
  - `/party-planner`
  - `/mari-optimizer`
  - `/honing-cost-optimizer`
  - `/gearsets`
  - `/engraving-search`
  - `/settings`
  - `/other-tools`

## Chay local

```bash
npm install
npm run dev
```

## Deploy Vercel

1. Import project `lostark-central-web` vao Vercel.
2. Framework Preset: `Next.js` (tu dong nhan dien).
3. Build Command: `npm run build`.
4. Output Directory: mac dinh cua Next.js.

## Ke hoach phase 2

- Port logic tung trang tu Angular sang React/Next:
  - Checklist + tasks state.
  - Roster + settings state.
  - Cac optimizer (gold, mari, honing, gearsets, engraving).
  - Friends/party planner.
