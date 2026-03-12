ALTER TABLE public.progression_logs ADD COLUMN IF NOT EXISTS fatigue_index_used integer;
ALTER TABLE public.progression_logs ADD COLUMN IF NOT EXISTS fatigue_adjusted boolean NOT NULL DEFAULT false;