# OVAG Netz – Smart Meter Prüfsystem (v1, UI-only)

A two-audience app: a mobile photo-upload flow for electricians and a dark-themed desktop triage dashboard for the office. This first version uses mock data and a simulated AI check — no backend yet, but the structure is clean enough to drop Supabase + a real vision model in later without rework.

## Design direction

- **Brand**: "OVAG Netz" wordmark, utility-company feel. Deep blue primary `#1a3a6b` (mobile header / CTAs), dark slate surfaces `#1a1f2e` / `#1e2435` (office dashboard), white cards on light gray for the mobile flow.
- **Status colors**: green = pass / auto-approved, red = fail / edge case, amber = warning.
- **Typography**: Inter for body, slightly heavier display weight for headers. All UI copy in German exactly as specified.
- **Mobile**: hard cap at 430px wide, large touch targets (min 48px), no hover-only states.
- **Desktop**: 3-column shell, dark theme only.

All colors, gradients, and component variants live in `index.css` + `tailwind.config.ts` as semantic tokens. No ad-hoc colors in components.

## Routes

```
/                → redirect to /login
/login           → shared login (mocked, any creds → choose role)
/check           → electrician mobile flow
/office          → office dashboard (Edge Case Queue default)
/office/:id      → same dashboard with right panel populated
```

## 1. Login (`/login`)

Centered card, dark background, "OVAG Netz" wordmark on top.
Email + password + "Anmelden" button. Submitting routes to `/check` or `/office` based on a small role toggle below the form (so reviewers can demo both sides easily). No registration, no password reset.

## 2. Electrician flow (`/check`)

Mobile-first, max-width 430px, centered on larger screens.

- **Header** (`#1a3a6b`): "Installationscheck" + "Bitte alle 4 Fotos aufnehmen" + a 4-step progress indicator (numbered circles connected by a line; completed = green check).
- **Step list**: completed steps collapse into compact rows (thumbnail · step name · "Aufgenommen ✓"). The active step renders as a white rounded card with the blue "SCHRITT X VON 4" eyebrow, bold title, gray description, and a large dashed upload area ("Tippen zum Fotografieren", camera icon). Tapping opens the native camera/file picker (`<input type="file" accept="image/*" capture="environment">`).
- **Bottom CTA**: disabled gray "Noch X Fotos ausstehend" while incomplete; once all 4 photos and a meter number are present, becomes the dark-blue "Alle Fotos bereit – Jetzt prüfen lassen".
- **After 4 photos**: "ERKANNTE ZÄHLERNUMMER" block with a dash placeholder, plus a manual input + "OK" button.
- **Submit**: full-screen loading state — spinner + "Prüfung läuft… (bis zu 60 Sekunden)" + animated progress bar (~6s simulated for demo; comment in code marks where to swap in the real AI call).
- **Result screen**: overall green/red banner, then each of the 4 photos with name + pass/fail icon and (on fail) reason text. If any photo failed, a modal appears first ("Foto [X] konnte nicht geprüft werden. Neu aufnehmen oder trotzdem fortfahren?") with "Neu aufnehmen" / "Trotzdem fortfahren".

The 4 step titles + descriptions use the exact German text from the spec.

## 3. Office dashboard (`/office`, `/office/:id`)

Dark theme, 3-column layout:

```
┌──────────┬──────────────┬──────────────────────┐
│ Sidebar  │ List panel   │ Detail panel         │
│ 220px    │ 380px        │ flex                 │
│ #1a1f2e  │ #1e2435      │ #1a1f2e              │
└──────────┴──────────────┴──────────────────────┘
```

- **Left sidebar**: "OVAG Netz" + "Smart Meter Prüfsystem", section label "PRÜFUNG", nav items with count badges:
  - Edge Case Queue (red badge)
  - Auto-Freigaben (green badge)
  - Alle Aufträge (no badge)
  Bottom: stats (Heute geprüft / Auto-Freigabe / Edge Cases). Top-right of the shell: avatar with initials + "Max Müller · Prüfer".

- **Middle panel** swaps based on the selected nav item:
  - **Edge Case Queue**: header + "Aktualisieren" link, tabs "Alle | Installation", list of cards (Job ID, electrician, date/time, red/yellow status badge, first-photo thumbnail). Empty state: green check + "Keine offenen Edge Cases 🎉".
  - **Auto-Freigaben**: same card layout, green badges.
  - **Alle Aufträge**: table (Job-ID · Elektriker · Datum · Zählernummer · Status), filter bar with electrician dropdown + date range, sortable headers, pagination.

- **Right detail panel**:
  - Empty: document icon + "Fall aus der Queue auswählen".
  - Selected (`/office/:id`): header (Job ID + date + electrician), 2×2 photo grid (click to enlarge in a dialog), per-photo AI label + confidence % + reasoning, overall banner, prominent "Zählernummer: …", and two action buttons "Freigeben" (green) / "Ablehnen" (red). Actions update local state and toast confirmation.

## Mock data

A single `src/lib/mockData.ts` exports ~8 installations with mixed statuses (edge cases, auto-approved, rejected). Photos use placeholder images. The `/check` flow writes a new mock installation into in-memory state on submit, so a freshly submitted job shows up in the office dashboard during the same session (via a lightweight Zustand store or React context — kept isolated so it can be swapped for Supabase queries later).

## File structure

```
src/
  pages/
    Login.tsx
    Check.tsx
    Office.tsx              // handles both /office and /office/:id
    NotFound.tsx
  components/
    check/
      StepProgress.tsx
      CompletedStepRow.tsx
      ActiveStepCard.tsx
      MeterNumberInput.tsx
      SubmitButton.tsx
      LoadingScreen.tsx
      ResultScreen.tsx
      RetakeModal.tsx
    office/
      Sidebar.tsx
      TopBar.tsx
      EdgeCaseQueue.tsx
      AutoApprovedList.tsx
      AllJobsTable.tsx
      InstallationCard.tsx
      DetailPanel.tsx
      PhotoGrid.tsx
      ResultBanner.tsx
    shared/
      StatusBadge.tsx
      Wordmark.tsx
  lib/
    mockData.ts
    types.ts                // Installation, PhotoCheck, Status enums
    installationsStore.ts   // in-memory store, swap for Supabase later
  index.css                 // tokens
tailwind.config.ts          // semantic colors, fonts
```

One component per file, fully typed, semantic Tailwind tokens throughout.

## Out of scope (v1)

- Real authentication, user roles, persistent storage
- Real AI vision / OCR
- Email notifications, audit log
- i18n switcher (German only as specified)

These can be layered on top — the store boundary in `installationsStore.ts` and the simulated check in `Check.tsx` are the only two places that need to change when wiring up Lovable Cloud + the AI Gateway.
