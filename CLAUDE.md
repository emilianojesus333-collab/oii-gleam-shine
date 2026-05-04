# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run build:dev    # Dev-mode build (keeps source maps)
npm run lint         # ESLint
npm run preview      # Preview production build locally
```

No test runner is configured — there are no test files in this project.

The `@` alias resolves to `src/`. Vite runs on port **8080** (not 3000).

## App Identity

The app is named **LiftMate** (`capacitor.config.ts`, `vite.config.ts`). The repository/folder name is a codename; all user-facing strings and app IDs use "LiftMate". The app is primarily Portuguese (pt-PT / pt-BR) but supports 12 languages via i18next.

## Architecture

### Stack
- **React 18 + TypeScript + Vite** (SWC) — PWA via `vite-plugin-pwa`
- **Capacitor 8** — wraps the web app for iOS/Android; `appId: com.liftmate.app`
- **Supabase** — auth, Postgres DB, and Edge Functions (Deno/TypeScript)
- **Stripe** — subscription billing, orchestrated entirely through Supabase Edge Functions
- **TanStack Query** — all async data fetching; no Redux or Zustand

### Route & Auth Flow
```
/ → /auth → /onboarding → /processing → /paywall → /home (+ all feature routes)
```
`ProtectedRoute` accepts two flags: `requireOnboarding` (blocks before onboarding is done) and `requireSubscription` (blocks without active Stripe sub). The subscription state lives in `SubscriptionContext` which wraps the entire router.

### Subscription Gate (`src/contexts/SubscriptionContext.tsx`)
- On boot: reads local `user_subscriptions` table first (fast), then syncs with Stripe's `check-subscription` edge function in the background
- Statuses: `never_subscribed` → `active` → `canceled_but_active` → `expired`
- `isDeveloper` flag bypasses the paywall entirely
- No polling — subscription is only re-checked on auth state change events

### Supabase Edge Functions (`supabase/functions/`)
All heavy logic lives here. Key functions:
- **AI**: `chat`, `ai-coaching`, `generate-workout`, `analyze-food`, `analyze-physique`, `speech-to-text`, `text-to-speech`, `progression-engine`, `training-metrics`
- **Billing**: `create-checkout`, `check-subscription`, `customer-portal`, `stripe-webhook`
- **Data**: `complete-workout`, `delete-account`

Edge functions must be called via `invokeWithAuth()` from `src/lib/supabaseHelpers.ts` — not `supabase.functions.invoke()` directly — because Capacitor doesn't automatically attach auth headers.

### Data Layer Pattern
Each feature domain has a dedicated hook in `src/hooks/` (e.g. `useWorkoutSession`, `useNutrition`, `useMuscleFatigue`). Hooks use TanStack Query and query Supabase directly. Business logic that crosses domains lives in `src/services/` (`workoutService.ts`, `progressionService.ts`).

### Workout Completion Flow
1. Active session tracked in `localStorage` during workout
2. On finish → `completeWorkout()` in `workoutService.ts` calls the `complete-workout` edge function
3. Edge function syncs to DB, runs `progression-engine` per exercise, returns `ProgressionResult[]` + `CelebrationEvent[]`
4. Caller clears localStorage only after successful response

### Mobile / Capacitor Specifics
- Dev: Capacitor points to `http://localhost:8080` (live reload)
- Prod: serves from `dist/` folder
- `waitForAuthReady()` in `supabaseHelpers.ts` handles the async auth load on cold mobile starts (3s timeout)
- Native features used: Camera (`@capacitor/camera`), Push Notifications (`@capacitor/push-notifications`)

### i18n
Locale files are in `src/i18n/locales/`. Portuguese (pt-PT) is the primary language — UI strings in new components should use `useTranslation()` from `react-i18next`. Hard-coded Portuguese is acceptable for page-specific strings that aren't in the translation files yet.
