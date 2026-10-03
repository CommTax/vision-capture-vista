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
- All app state lives in `src/lib/store.ts` (localStorage) with shapes mirroring planned backend tables (profiles, responses, response_analysis, user_progress) — so Lovable Cloud can replace it without UI changes.
- AI feedback goes through `analyzeResponse()` in `src/lib/analysis.ts`; currently a local heuristic provider — swap the provider for a server function, never call AI from components.
- App pages wrap content in `AppShell`, which gates on profile/onboarding client-side.
- Real AI coaching runs server-side in `coach.server.ts` (Lovable AI Gateway, Responses API, structured output) behind the `getCoaching` server function; results are saved on the response record. The rule-based `analyzeResponse` stays as the instant scorer.
- Access is driven by `src/lib/entitlements.ts` (FREE / PRACTICE_TRIAL / PRACTICE_PAID / SPRINT_TRIAL / SPRINT_PAID), stored apart from profile, lead and marketing consent; pages use `Gate`/`useEntitlement`, never a paid boolean — so one practice engine serves all plans.
- PAID status is only written by a future payment integration; the client may start configured trials or record interest only — avoids fake subscriptions.
- `buildRecommendations(rs, focus?)` is the single recommendation engine; Sprint narrows it by its focus skills.
- Free users can open every app page; deeper sections are wrapped in `Locked` (faded peek + one contextual unlock linking to /plans) instead of full-page gates, and plan names appear only on /plans — so Free feels like the real product.
