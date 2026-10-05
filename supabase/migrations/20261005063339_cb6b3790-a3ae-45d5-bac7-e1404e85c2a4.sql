CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  email text NOT NULL UNIQUE,
  phone text,
  phone_country_code text,
  marketing_consent boolean NOT NULL DEFAULT false,
  consent_at timestamptz,
  prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Access is written only by trusted server code (trials) or a future payment integration.
CREATE TABLE public.entitlements (
  user_id uuid PRIMARY KEY,
  state text NOT NULL DEFAULT 'FREE',
  data jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.entitlements TO authenticated;
GRANT ALL ON public.entitlements TO service_role;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own entitlement read" ON public.entitlements FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.responses (
  id text PRIMARY KEY,
  user_id uuid NOT NULL,
  record jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX responses_user_idx ON public.responses(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.responses TO authenticated;
GRANT ALL ON public.responses TO service_role;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own responses read" ON public.responses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own responses insert" ON public.responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own responses update" ON public.responses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own responses delete" ON public.responses FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.free_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scenario_id text NOT NULL,
  attempt_number int NOT NULL,
  submitted_at timestamptz NOT NULL,
  response_id text NOT NULL UNIQUE,
  entitlement_type text NOT NULL DEFAULT 'FREE',
  analysis_id text
);
GRANT SELECT, INSERT ON public.free_attempts TO authenticated;
GRANT ALL ON public.free_attempts TO service_role;
ALTER TABLE public.free_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts read" ON public.free_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own attempts insert" ON public.free_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);