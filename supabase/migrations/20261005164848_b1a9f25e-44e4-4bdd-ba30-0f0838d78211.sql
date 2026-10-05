CREATE TABLE public.payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product text NOT NULL,
  plan text NOT NULL,
  amount_paise integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  razorpay_order_id text NOT NULL UNIQUE,
  razorpay_payment_id text,
  status text NOT NULL DEFAULT 'created',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_orders TO authenticated;
GRANT ALL ON public.payment_orders TO service_role;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own orders read" ON public.payment_orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER touch_payment_orders BEFORE UPDATE ON public.payment_orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
ALTER TABLE public.content_questions ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'seed';
GRANT ALL ON public.content_questions TO service_role;