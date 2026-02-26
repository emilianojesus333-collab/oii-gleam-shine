
-- ENUMs
CREATE TYPE progression_decision AS ENUM ('progress', 'maintain', 'deload');
CREATE TYPE progression_confidence AS ENUM ('low', 'medium', 'high');

-- Table
CREATE TABLE progression_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exercise_id uuid NOT NULL REFERENCES exercises(id),
  session_id uuid REFERENCES workout_sessions(id),
  algorithm_version text NOT NULL DEFAULT 'v1.0',
  -- Decision
  score numeric NOT NULL,
  decision progression_decision NOT NULL,
  confidence progression_confidence NOT NULL,
  proximity text,
  -- Sub-scores
  fatigue_status text,
  fatigue_score numeric,
  fatigue_ratio numeric,
  rpe_avg numeric,
  rpe_score numeric,
  volume_trend_pct numeric,
  volume_trend_score numeric,
  frequency_days integer,
  frequency_score numeric,
  -- Weights + raw metrics
  base_weight numeric,
  suggested_weight numeric,
  suggested_increment_pct numeric,
  data_quality text,
  last_7_days_volume numeric,
  training_days_7d integer,
  training_days_3d integer,
  weights jsonb NOT NULL DEFAULT '{"fatigue":0.30,"rpe":0.30,"volume":0.25,"frequency":0.15}',
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id, session_id)
);

-- RLS
ALTER TABLE progression_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progression logs"
  ON progression_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progression logs"
  ON progression_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progression logs"
  ON progression_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progression logs"
  ON progression_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Index for common queries
CREATE INDEX idx_progression_logs_user_exercise ON progression_logs(user_id, exercise_id);
CREATE INDEX idx_progression_logs_created ON progression_logs(user_id, created_at DESC);
