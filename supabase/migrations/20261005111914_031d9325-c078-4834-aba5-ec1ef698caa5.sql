CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Feature switches (all off by default)
CREATE TABLE public.app_settings (key text PRIMARY KEY, enabled boolean NOT NULL DEFAULT false, value jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.app_settings TO anon, authenticated; GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.app_settings (key, enabled, value) VALUES
 ('backend_content', false, '{}'), ('share_rewards', false, '{"instagram_handle":"","tag_discount_pct":0,"follow_discount_pct":0,"referrer_discount_pct":0,"friend_discount_pct":0,"max_discount_pct":0}');

-- Content tables
CREATE TABLE public.content_questions (id text PRIMARY KEY, mode text NOT NULL, title text NOT NULL, prompt text NOT NULL, context text, difficulty text NOT NULL DEFAULT 'Medium', time_limit int NOT NULL DEFAULT 90, target_skills text[] NOT NULL DEFAULT '{}', recommended_when text[] NOT NULL DEFAULT '{}', data jsonb NOT NULL DEFAULT '{}', sort int NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.content_modes (id text PRIMARY KEY, name text NOT NULL, tag text, description text, data jsonb NOT NULL DEFAULT '{}', sort int NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.content_patterns (id text PRIMARY KEY, name text NOT NULL, title text NOT NULL, line text, description text, data jsonb NOT NULL DEFAULT '{}', active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.content_drills (id text PRIMARY KEY, skill text NOT NULL, title text NOT NULL, data jsonb NOT NULL DEFAULT '{}', sort int NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.content_blocks (key text PRIMARY KEY, data jsonb NOT NULL, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['content_questions','content_modes','content_patterns','content_drills','content_blocks'] LOOP
  EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('CREATE POLICY "public read active" ON public.%I FOR SELECT TO anon, authenticated USING (active)', t);
  EXECUTE format('CREATE TRIGGER touch_%s BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t, t);
 END LOOP; END $$;

-- Referral / share rewards
CREATE TABLE public.referral_codes (user_id uuid PRIMARY KEY, code text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.referral_codes TO authenticated; GRANT ALL ON public.referral_codes TO service_role;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own code read" ON public.referral_codes FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.share_rewards (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, kind text NOT NULL, instagram_handle text, post_url text, status text NOT NULL DEFAULT 'pending', discount_code text, discount_pct int, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, kind));
GRANT SELECT, INSERT ON public.share_rewards TO authenticated; GRANT ALL ON public.share_rewards TO service_role;
ALTER TABLE public.share_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rewards read" ON public.share_rewards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own rewards claim" ON public.share_rewards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending' AND discount_code IS NULL AND discount_pct IS NULL AND kind IN ('tag','follow'));
CREATE TRIGGER touch_share_rewards BEFORE UPDATE ON public.share_rewards FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.referral_redemptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL, referrer_id uuid NOT NULL, friend_id uuid NOT NULL UNIQUE, status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.referral_redemptions TO authenticated; GRANT ALL ON public.referral_redemptions TO service_role;
ALTER TABLE public.referral_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "involved read" ON public.referral_redemptions FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = friend_id);