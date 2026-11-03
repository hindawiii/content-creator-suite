CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own push subs" ON public.push_subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.reminders_sent (
  user_id uuid NOT NULL,
  schedule_id text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, schedule_id)
);
GRANT SELECT ON public.reminders_sent TO authenticated;
GRANT ALL ON public.reminders_sent TO service_role;
ALTER TABLE public.reminders_sent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reminders read" ON public.reminders_sent FOR SELECT TO authenticated USING (auth.uid() = user_id);