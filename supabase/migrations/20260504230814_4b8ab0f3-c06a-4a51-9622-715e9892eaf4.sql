CREATE TABLE IF NOT EXISTS public.custom_meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  foods JSONB NOT NULL DEFAULT '[]',
  total_calories INTEGER DEFAULT 0,
  total_protein INTEGER DEFAULT 0,
  total_carbs INTEGER DEFAULT 0,
  total_fat INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.custom_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own meals" ON public.custom_meals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.physique_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  photo_path TEXT,
  score NUMERIC,
  body_fat_estimate TEXT,
  strengths JSONB DEFAULT '[]',
  improvements JSONB DEFAULT '[]',
  action_plan JSONB DEFAULT '[]',
  motivational_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.physique_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own evaluations" ON public.physique_evaluations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);