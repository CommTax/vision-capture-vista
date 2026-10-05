<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Signed-in accounts sync through `src/lib/cloud-sync.ts` + `account.functions.ts` (Lovable Cloud tables profiles, entitlements, responses, free_attempts); the server entitlement always overrides the browser copy, and existing emails never get a session without an email code — prevents account takeover.
- All app state lives in `src/lib/store.ts` (localStorage) with shapes mirroring planned backend tables (profiles, responses, response_analysis, user_progress) — so Lovable Cloud can replace it without UI changes.
- AI feedback goes through `analyzeResponse()` in `src/lib/analysis.ts`; currently a local heuristic provider — swap the provider for a server function, never call AI from components.
- App pages wrap content in `AppShell`, which gates on profile/onboarding client-side.
- Real AI coaching runs server-side in `coach.server.ts` (Lovable AI Gateway, Responses API, structured output) behind the `getCoaching` server function; results are saved on the response record. The rule-based `analyzeResponse` stays as the instant scorer.
- Access is driven by `src/lib/entitlements.ts` (FREE / PRACTICE_TRIAL / PRACTICE_PAID / SPRINT_TRIAL / SPRINT_PAID), stored apart from profile, lead and marketing consent; pages use `Gate`/`useEntitlement`, never a paid boolean — so one practice engine serves all plans.
- PAID status is only written by a future payment integration; the client may start configured trials or record interest only — avoids fake subscriptions.
- `buildRecommendations(rs, focus?)` is the single recommendation engine; Sprint narrows it by its focus skills.
- Free users can open every app page; deeper sections are wrapped in `Locked` (faded peek + one contextual unlock linking to /plans) instead of full-page gates, and plan names appear only on /plans — so Free feels like the real product.
- Contact details (name, email, phone + country code) live on the profile and are captured by `ContactDetails`, pre-filled before every paid plan/trial — one source of truth, never per-subscription copies.
- QA demo accounts (`src/lib/demo-accounts.ts`, `/demo`) seed real profile/entitlement/response records and are shown only when `demoModeEnabled()` (dev/preview hosts) — so they exercise real entitlement checks without exposing a production feature.
- Browser state uses the `unspoken-state-v1` key and reads the legacy product key as a fallback — so the product rename preserves existing users' data.
- Homepage/marketing content and demo metrics are typed in `src/content/types.ts`, with fallback values only in `src/content/fallback.ts`, read through `dataProvider` in `src/services/data-provider.ts` (`withFallback`/`fetchWithFallback`) — so a backend can replace content without touching UI.
- Practice Moments link to `/practice?mode=<category>`; the Practice page preselects that category from the search param.
- Mobile navigation is one entitlement-aware `MobileNav` (Home · Practice · Learn · More sheet) shared by the landing page and `AppShell` — so every user state gets the same navigation.
- Backend content and share rewards live in Cloud tables behind `app_settings` switches (start off); `growth.functions.ts` reads them and returns null/disabled until switched on — so content can move to the database without UI changes.
