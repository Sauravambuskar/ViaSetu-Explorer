# ViaSetu — AI Context (read first)

Single source of truth for any AI (Claude, GPT, Gemini…). Keep it short. **After every change, update "Current state" and append one line to "Change log".**

## What it is
ViaSetu = multi-courier app (compare courier rates, book pickup, track parcels) for India.
Mobile app is a **native WebView shell around https://www.viasetu.com** + native extras (location, camera, push, UPI deep links).

## Where things live
- `artifacts/mobile/` — Expo 54 / RN 0.81 app (the one shipped to stores)
  - `app/index.tsx` — main WebView screen (zoom lock, UPI/tel/whatsapp links, back button, location)
  - `app/onesignal.ts` — push notifications · `app/sentry.config.ts` — crash reporting · `app/config.ts` — env vars (`EXPO_PUBLIC_*`)
  - `app.json` — name, **version**, bundle id, permissions · `eas.json` — build/submit profiles
- `artifacts/api-server/` — Express 5 API · `lib/db` — Drizzle/Postgres · `lib/api-spec` — OpenAPI + Orval codegen
- `DOCUMENTATION.md` — long docs (only read if needed)

## Identifiers
- iOS/Android id: `com.viasetu.app` · Expo owner/project: `viasetu-pvt-ltd/viasetu-production`
- ASC App ID `6801613415` · Apple Team `96284SXU3T` · EAS login: `viasetuprod@gmail.com`
- `cli.appVersionSource: remote` → build numbers auto-increment on EAS; only bump `version` in `app.json` manually.

## Commands
- Package manager: **pnpm only** (npm/yarn blocked). Typecheck: `pnpm run typecheck`
- iOS release (run in `artifacts/mobile`): `npx eas-cli build -p ios --profile production --auto-submit --non-interactive --no-wait`
- Android release: `npx eas-cli build -p android --profile production --auto-submit --non-interactive --no-wait`
- Build status: `npx eas-cli build:view <id>`

## Release workflow
1. Make change → `pnpm run typecheck` must pass.
2. Bump `version` in `artifacts/mobile/app.json` (patch: 1.0.x) if the live version is already approved.
3. Run the release command → EAS builds + uploads to App Store Connect (free tier queue can be slow).
4. Manual in App Store Connect: create version, select build, fill "What's New", submit for review.
Store name/subtitle/keywords can only change together with a new version.

## Rules / gotchas
- Don't disable `minimumReleaseAge` in `pnpm-workspace.yaml` (supply-chain protection).
- Never commit secrets; config comes from `EXPO_PUBLIC_*` env vars.
- `react`/`react-dom` pinned to 19.1.0 (Expo requirement).
- Home-screen name stays `ViaSetu` (`app.json` name); store title is set in App Store Connect.
- User speaks Hinglish; reply in simple Hinglish.
- iOS push: fixed in commit 7f3a43a (permission prompts must be awaited one after another; OneSignal init runs in `_layout`; `remote-notification` background mode). Don't request the location and push permissions at the same time. The OneSignal dashboard must have the APNs .p8 key set (not in code).

## App Store listing (current target)
- Title: `ViaSetu: Multi Courier App` · Subtitle: `Compare Rates & Ship`
- Keywords: `shipping,parcel,delivery,tracking,pickup,booking,logistics,cod,ecommerce,dispatch,awb,cheap,send`

## Current state
- Version **1.0.3** building on EAS (2026-10-02). Title correction: "ViaSetu: Multi Courier App". Pending (manual): create 1.0.3 in ASC, set corrected title, select new build, submit.

## Change log (newest last, one line each)
- 2026-09-25 — Bumped 1.0.1→1.0.2 for App Store title/subtitle/keyword change; iOS build 15 + auto-submit started.
- 2026-10-02 — Bumped 1.0.2→1.0.3; title fix "Multi Courier" → "Multi Courier App"; new iOS build + auto-submit.
