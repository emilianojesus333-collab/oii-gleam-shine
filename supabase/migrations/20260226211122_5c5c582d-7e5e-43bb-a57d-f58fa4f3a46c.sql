
-- ENUM: muscle_group
CREATE TYPE muscle_group AS ENUM (
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'quadriceps', 'hamstrings', 'glutes',
  'calves', 'abs', 'traps'
);

-- ENUM: set_type
CREATE TYPE set_type AS ENUM (
  'working', 'warmup', 'dropset', 'failure', 'backoff'
);

-- Catálogo de exercícios
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  primary_muscle muscle_group NOT NULL,
  secondary_muscles muscle_group[] DEFAULT '{}',
  equipment TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, user_id)
);

-- Sets individuais normalizados
CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  set_number INTEGER NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  rpe NUMERIC,
  set_type set_type NOT NULL DEFAULT 'working',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recovery logs
CREATE TABLE recovery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  sleep_hours NUMERIC,
  sleep_quality INTEGER,
  fatigue_level INTEGER,
  stress_level INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Índices
CREATE INDEX idx_workout_sets_session ON workout_sets(user_id, session_id);
CREATE INDEX idx_workout_sets_exercise ON workout_sets(user_id, exercise_id);
CREATE INDEX idx_exercises_muscle ON exercises(primary_muscle);
CREATE INDEX idx_exercises_user ON exercises(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_recovery_user_date ON recovery_logs(user_id, date);

-- RLS: exercises
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view global exercises"
  ON exercises FOR SELECT
  USING (user_id IS NULL);

CREATE POLICY "Users can view their custom exercises"
  ON exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create custom exercises"
  ON exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their custom exercises"
  ON exercises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their custom exercises"
  ON exercises FOR DELETE
  USING (auth.uid() = user_id);

-- RLS: workout_sets
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sets"
  ON workout_sets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sets"
  ON workout_sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sets"
  ON workout_sets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sets"
  ON workout_sets FOR DELETE
  USING (auth.uid() = user_id);

-- RLS: recovery_logs
ALTER TABLE recovery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recovery logs"
  ON recovery_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recovery logs"
  ON recovery_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recovery logs"
  ON recovery_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recovery logs"
  ON recovery_logs FOR DELETE
  USING (auth.uid() = user_id);
