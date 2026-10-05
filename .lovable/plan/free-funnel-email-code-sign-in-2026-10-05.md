# Free funnel + email-code sign in

Paid Practice/Sprint pages stay exactly as they are. Only the free journey and sign-in change.

## What users will see

**Free (signed out or Free plan)**
1. "Try Unspoken Free" / "Start Practising" opens Practice. No details asked first.
2. Simplified practice screen: one large situation card (category, task, "Hard · ~90 sec"), a big "Start speaking" control with live waveform, timer and Done, plus a "Type instead" option.
3. Submit, then a short "Listening to your response…" screen.
4. "Before we show you what got lost": Name, Email, Phone (with country code). Optional tips checkbox, unticked by default. Terms of Use and Privacy Policy links shown separately.
5. Compact result: pattern (for example SLOW START · 25s, "Your point came too late."), What got lost, One thing to fix, then Try Again if free attempts remain. Returning free users with details on file skip step 4.

**Paid sign in**
- "Sign in" opens: Email → Continue → "Enter your code" (6 digits), Verify, and Resend code with a 60-second wait. No password, phone or name.
- After verifying, the app loads the person's plan and history. Practice goes to Dashboard, Sprint goes to Sprint, Free continues the free journey. Signed-in users never see "Sign in".

**Same email = same person**: the free details step creates or links the account using the email, so upgrading later keeps the history.

## Rules kept
- A free attempt is used only when an answer is actually submitted.
- Free limit and plan logic stay the same. Access is decided by plan state, never by "has an email".
- The full analysis view is not copied. Free users get one small result card.

## Technical section
- Turn on Lovable Cloud. Add the tables `profiles` (name, email, phone, country code, marketing_consent, consent_at), `entitlements`, `responses` and `free_attempts` (scenario_id, attempt_number, submitted_at, response_id, entitlement_type, analysis_id), with RLS scoped to `auth.uid()` and GRANTs.
- Free contact step: a server function upserts the person by email and starts a session without asking for a code, so the result shows straight away. Signing in later with an email code links to the same user.
- Paid sign in: Cloud email OTP (`signInWithOtp` / `verifyOtp`). The signup page is replaced by an email + code screen, and password fields are removed.
- The store keeps its current shape. A sync layer loads and saves entitlement and responses through Cloud for signed-in users, so paid pages need no UI changes.
- Practice question page: entitlement-aware branch. FREE renders `FreePracticeFlow` (scenario → record/type → listening → contact → `FreeResult`). Paid plans render the existing page unchanged.
- Demo accounts stay preview-only.

## Open questions
- Seeding existing paid users: right now plans exist only in each browser, so no real paid accounts are on the server yet. Demo accounts will be seeded for testing.
