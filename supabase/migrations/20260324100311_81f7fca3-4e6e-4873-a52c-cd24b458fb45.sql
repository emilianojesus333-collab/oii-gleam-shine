ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS renewal_attempts integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_attempt_date timestamptz;