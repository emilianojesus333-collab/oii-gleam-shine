
-- Add 'planned' to session_status enum
ALTER TYPE public.session_status ADD VALUE IF NOT EXISTS 'planned';

-- Create planned_exercises table
CREATE TABLE public.planned_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  exercise_name text NOT NULL,
  sets integer NOT NULL DEFAULT 3,
  reps text NOT NULL DEFAULT '10',
  rest integer NOT NULL DEFAULT 90,
  order_index integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'ai',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.planned_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own planned exercises"
  ON public.planned_exercises FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own planned exercises"
  ON public.planned_exercises FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own planned exercises"
  ON public.planned_exercises FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planned exercises"
  ON public.planned_exercises FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
