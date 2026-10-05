# Plan: Three user types, Razorpay checkout, questions from the database + AI

## 1. Free users
- Up to **5 questions per day**. The count resets at midnight India time, counted on the server from the person's saved free answers (not just the browser).
- After the daily limit: they can still open every page, with the deeper parts faded and locked (as today), plus a "Come back tomorrow, or unlock now" message.
- Name, email and phone are still collected after the first answer, before the result.

## 2. Sprint (one-off purchase)
Goals: Interview, Executive, Presentation, Leadership, High-stakes, Persuasion, Custom.

| Length | Price |
|---|---|
| 7 days | ₹499 (no trial) |
| 14 days | ₹799 |
| 28 days | ₹1,499 |
| 3 months | ₹999/month (₹2,997 total) |

- 14 days, 28 days and 3 months keep the free 3-day trial. After the trial, the person pays to continue.

## 3. Practice Pass (ongoing)
- Monthly, with the free 3-day trial kept.
- Price assumed to stay **₹499/month** for now (needs your confirmation; annual price not set).

## 4. Razorpay payments (built now, switched on when keys arrive)
- A "Pay with Razorpay" button on the Plans page opens Razorpay's own checkout.
- The server creates the order with the right amount, and a payment only counts after the server checks Razorpay's signature. Only then does the plan become paid.
- A Razorpay webhook address also confirms payments, in case the person closes the window too early.
- Every order and payment is saved (who, which plan, amount, status).
- Until you add the keys, the button shows "Payments coming soon" and trials keep working.
- Keys needed later: Key ID, Key Secret and Webhook Secret. I'll ask for them in a secure form.

## 5. Questions: database first, then AI
- Practice questions load from the database (switch turned on).
- When a topic has no unseen questions left for that person, AI writes a new one in the same format. It's saved to the database so it can be reused and checked.
- If both fail, the built-in questions are used, so the page never breaks.

## Technical details
- Migration: `payment_orders` table (user_id, product, plan, amount_paise, currency, razorpay_order_id unique, razorpay_payment_id, status, timestamps), with owner read and service-role writes; `content_questions.source` (`seed`/`ai`); turn on the `backend_content` switch.
- `src/lib/payments.functions.ts`: `createRazorpayOrder` (auth, price looked up on the server from a price table, never from the client), `verifyRazorpayPayment` (HMAC-SHA256 of `order_id|payment_id`, timing-safe compare) → writes `*_PAID` entitlement with `expires_at`.
- `src/routes/api/public/razorpay-webhook.ts`: verifies `X-Razorpay-Signature` over the raw body, handles `payment.captured`, and is safe to run twice.
- Razorpay checkout.js loaded on demand on /plans; a `paymentsLive` setting comes from whether the keys exist.
- Daily free limit: `PLAN_CONFIG.free.perDay = 5`; `freeRemaining` counts today's (IST) free attempts; the server checks `free_attempts` for today in `syncAccount`.
- `getQuestion`/`listQuestions` server functions: database read, then AI generation through Lovable AI with structured output → insert with `source='ai'`; the client falls back to local `SCENARIOS`.
- Update AGENTS.md (payment rule: PAID written only by verified Razorpay payments).

## Needs from you
- Practice Pass price (monthly, and annual if any).
- Razorpay keys, once you have them.
