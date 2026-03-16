
CREATE TABLE public.muscle_fatigue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  muscle_group text NOT NULL,
  fatigue_pct numeric NOT NULL DEFAULT 0,
  last_trained_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, muscle_group)
);

ALTER TABLE public.muscle_fatigue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own muscle fatigue"
  ON public.muscle_fatigue FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own muscle fatigue"
  ON public.muscle_fatigue FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own muscle fatigue"
  ON public.muscle_fatigue FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own muscle fatigue"
  ON public.muscle_fatigue FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
