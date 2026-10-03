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
