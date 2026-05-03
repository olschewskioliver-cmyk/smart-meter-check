# OVAG Netz – Smart Meter Prüfsystem

AI-assisted photo QA platform for smart meter installations. Electricians photograph 4 checkpoints per installation on their phone; an AI model reviews each photo and flags edge cases for office staff to review.

## Project team

| Person | Role |
|--------|------|
| Oliver | Product lead, infrastructure, deployment |
| David  | AI integration, feature development |

Both work on the same codebase. Oliver owns the Supabase project and deployment pipeline.

---

## Tech stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **PWA:** vite-plugin-pwa — app is installable on mobile, works offline for the shell
- **Routing:** react-router-dom v6
- **Package manager:** npm

## Before implementing anything — read first

Claude should read the relevant source files before writing code in an unfamiliar area. The codebase is small enough to read key files quickly, and this prevents mismatched assumptions. Specifically:

- Changing auth behavior → read `src/context/AuthContext.tsx` first
- Changing the photo capture flow → read `src/pages/Check.tsx` first
- Adding Supabase queries → read `src/lib/database.types.ts` and `src/lib/supabase.ts` first
- Touching the office dashboard → read `src/pages/Office.tsx` and the components in `src/components/office/` first
- Adding Edge Functions → read existing functions if any exist in `supabase/functions/`

---

## What's already built

### Authentication (`src/context/AuthContext.tsx`)
Email/password login via Supabase Auth. Two roles: `electrician` and `office`, stored in the `profiles` table. The `useAuth()` hook provides `user`, `profile`, `signIn`, `signOut`, and `loading` to any component. Route protection is handled by `src/components/ProtectedRoute.tsx` — it redirects based on role automatically.

### Database schema (live in Supabase)
Three tables with RLS enabled:
- `profiles` — linked 1:1 to auth users, stores `full_name` and `role`
- `installations` — one row per job: `job_id`, `electrician_id`, `meter_number`, `status`, `ai_score`, `ai_feedback`, `ai_result_json`, `created_at`
- `installation_photos` — four rows per installation: `photo_number`, `storage_path`, `ai_type`, `ai_result`, `ai_confidence`, `ai_reasoning`, `electrician_override`

TypeScript types for all tables are in `src/lib/database.types.ts`. The Supabase client singleton is in `src/lib/supabase.ts` — import this, don't create a second one.

If the schema needs to change, coordinate with Oliver before running migrations since RLS policies may need updating too.

### Photo capture flow (`src/pages/Check.tsx`)
Electricians capture 4 photos in sequence. The flow has three phases: `capture → loading (AI) → saving → result`. The AI step is currently simulated — see David's task below. After AI results are confirmed, `saveInstallation()` uploads photos to Supabase Storage and writes records to the database.

### Photo storage
Bucket: `photos`. Path structure: `{user_id}/{installation_id}/{step}.jpg`. RLS policies restrict electricians to their own folder; office can read all.

### Office dashboard (`src/pages/Office.tsx`)
Three views: edge case queue, auto-approved list, all jobs. Currently reads from an in-memory store (`src/lib/installationsStore.ts`) — **this still needs to be wired to real Supabase data** (step 7 in the roadmap). The `DetailPanel` component shows full photo results for a selected installation.

### PWA
App is installable. Icons and manifest are configured. Service worker caches the app shell; Supabase API calls use network-first. Do not modify `vite.config.ts` PWA section or icon files without understanding the implications — the build pipeline generates the service worker from that config.

---

## David's main task: real AI photo analysis

### The integration point

`src/pages/Check.tsx` → `runSimulatedCheck()` (around line 51)

This function currently uses a `setTimeout` with deterministic fake results. Replace it with a real call to a Supabase Edge Function that runs Claude Vision (or another model) on each photo.

### What the function has available

```typescript
// photos: CapturedPhoto[]
interface CapturedPhoto {
  step: StepKey;   // "gateway" | "meter_wiring" | "cabinet" | "nameplate"
  dataUrl: string; // base64 image from device camera
}

// meterNumber: string — entered by the electrician
```

### What the function must produce

```typescript
// PhotoCheck — defined in src/lib/types.ts
interface PhotoCheck {
  step: StepKey;
  imageUrl: string;    // pass the dataUrl through unchanged
  status: "passed" | "failed";
  confidence: number;  // 0.0 – 1.0
  reasoning: string;   // one German sentence explaining the result
}
```

After producing results, the existing code handles showing the retake modal and saving — no changes needed there unless you want to improve the UX.

### What each photo step means

| StepKey | What to check |
|---------|--------------|
| `gateway` | Smart meter gateway with clearly visible LED (red/orange/green) |
| `meter_wiring` | Full meter with complete cabling to the gateway visible |
| `cabinet` | Open meter cabinet photographed from outside — full installation context |
| `nameplate` | Close-up of nameplate — meter number sharp and fully legible |

### Recommended architecture

1. Create a Supabase Edge Function at `supabase/functions/analyze-photos/index.ts`
2. Accept POST body with base64 images + step keys
3. Call AI model with a targeted German prompt per photo
4. Return array matching the `PhotoCheck` shape
5. In `Check.tsx`, replace the `setTimeout` block with a `fetch` to that Edge Function

The Edge Function runs server-side — AI API keys go in Supabase Edge Function secrets (dashboard → Settings → Edge Functions), not in `.env.local` or the frontend.

### Status thresholds — discuss before changing

Currently: any failed photo → `edge_case`, all passed → `auto_approved`. Oliver may want to add a `warning` state for low-confidence passes. Coordinate before changing this logic since it affects what office staff see.

### `ai_result_json` and `ai_feedback` fields

The `installations` table has `ai_result_json` (full raw model response) and `ai_feedback` (summary string) — currently not populated. Feel free to populate these from the Edge Function response; they're designed for exactly this purpose.

### `electrician_override` field

`installation_photos` has an `electrician_override boolean` — intended for when an electrician overrides a failed AI result and submits anyway. Currently not surfaced in the UI but the field exists in the DB. Could be a useful feature to add.

---

## Office dashboard — wiring to real data (step 7, not yet done)

The office dashboard reads from `src/lib/installationsStore.ts`, which is an in-memory mock. This needs to be replaced with live Supabase queries. The store's interface (`list()`, `get(id)`, `updateStatus()`, `subscribe()`) can guide what queries to write. TanStack Query is already installed and configured — it's the right tool for the office dashboard data fetching.

---

## Environment setup

Create `.env.local` from `.env.local.example` (ask Oliver for the key):

```
VITE_SUPABASE_URL=https://mqiunwgmppxpzfbulndu.supabase.co
VITE_SUPABASE_ANON_KEY=<ask Oliver>
VERCEL_PERSONAL_TOKEN=<ask Oliver — personal Vercel account token>
```

```bash
npm install
npm run dev    # http://localhost:8080
npm run build  # production build
```

## Deploying to Vercel

Oliver has two Vercel accounts. This project belongs to the **personal account** (`olschewskioliver-9465`). The `.vercel/project.json` is already configured correctly.

Always deploy using the personal token stored in `.env.local`:

```bash
TOKEN=$(grep VERCEL_PERSONAL_TOKEN .env.local | cut -d= -f2) && vercel --token "$TOKEN" --prod --yes
```

Never run `vercel --prod` without the `--token` flag — the global CLI auth may be set to the work account.

**Critical: always push to GitHub after deploying.** This is a collaborative codebase — Oliver and David work in parallel. Deploying without pushing means the other person's Claude Code works on outdated code. The correct sequence is always:

```bash
# 1. Deploy
TOKEN=$(grep VERCEL_PERSONAL_TOKEN .env.local | cut -d= -f2) && vercel --token "$TOKEN" --prod --yes
# 2. Commit and push
git add <changed files> && git commit -m "..." && git push origin main
```

Never skip the git push.

## Key files

```
src/
  lib/
    supabase.ts            ← client singleton
    database.types.ts      ← all DB table types
    types.ts               ← StepKey, PhotoCheck, Installation…
    saveInstallation.ts    ← photo upload + DB write on submit
    installationsStore.ts  ← in-memory store (to be replaced by Supabase queries)
  context/
    AuthContext.tsx         ← auth state, useAuth() hook
  components/
    ProtectedRoute.tsx      ← role-based route guard
    check/                  ← electrician capture UI
    office/                 ← office dashboard UI
  pages/
    Check.tsx               ← ⬅ replace runSimulatedCheck() with real AI call
    Office.tsx              ← office dashboard (reads installationsStore today)
    Login.tsx               ← auth page
supabase/
  functions/               ← create Edge Functions here
```
