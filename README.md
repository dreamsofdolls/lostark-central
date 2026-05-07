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
  - `/friends`
  - `/settings`

## Da migrate trong phase 2 (hien tai)

- `/roster`: quan ly nhieu account trong 1 discord user, them/sua/xoa character theo account (class + iLvl + weekly gold, show-all-tasks).
- `/checklist`: port logic checklist core:
  - Daily/weekly/bi-weekly reset countdown.
  - Group task theo tan suat + scope (character/roster).
  - Danh dau tien do task, reset task, Ctrl+Click de complete nhanh.
  - Luu trang thai bang localStorage (roster + completion).

## Da migrate trong phase 3

- `/tasks-manager`: quan ly task tu localStorage (them moi, bat/tat, xoa, reset ve default, tim kiem).
- `/settings`: bat/tat task tracking theo tung character + hide completed task.
- Data layer chung:
  - `tasks`, `settings`, `roster`, `completion` dung key rieng va co migration version.
- `/checklist` da duoc noi voi data layer moi:
  - Doc task tu tasks-manager.
  - Ap dung settings cho hide completed + task tracking on/off.
  - Hien thi character kem account de tranh trung ten giua nhieu account.

## MongoDB schema + shared DB

- Da bo sung ket noi Mongo theo mau `db.js`:
  - `lib/mongo/db.ts` (lazy connect + DNS fallback + index ensure).
- Da bo sung User schema theo cau truc `user.js`:
  - `lib/mongo/models/User.ts` (giu form field de dung chung DB, bo sung `centralWebState` de luu state web).
- API luu/doc state web:
  - `GET /api/user/state?discordId=...`
  - `POST /api/user/state` voi body `{ discordId, state }`
  - Dong bo `accounts.characters.sideTasks` cho 3 task: `Solo Shop`, `Paradise`, `Howl's Hourglass` de dung chung format voi raid-bot.
  - Dong bo `accounts.characters.isGoldEarner` + `accounts.characters.assignedRaids` tu roster web de nhat quan voi raid-bot khi dung chung MongoDB.
  - `lib/lostark/raids.ts` mirror theo `lostark-manage-raid-bot/bot/models/Raid.js` de giu chung raid options/gates/mode.
  - `Manage Roster` co the chon side tasks theo character tu `lib/lostark/sideTasks.ts`; checklist se loc theo danh sach da chon.

Env can thiet:

```bash
MONGO_URI=...
MONGO_DB_NAME=manage
DNS_SERVERS=8.8.8.8,1.1.1.1
MONGO_ENSURE_INDEXES=true
```

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
