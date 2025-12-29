-- Índices para nutrition_logs (consultas frequentes por user_id e date)
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_id ON public.nutrition_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_date ON public.nutrition_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON public.nutrition_logs(user_id, date DESC);

-- Índices para workout_sessions (consultas frequentes por user_id e date)
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON public.workout_sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON public.workout_sessions(user_id, date DESC);

-- Índices para body_measurements (consultas frequentes por user_id e date)
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_id ON public.body_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_date ON public.body_measurements(date DESC);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON public.body_measurements(user_id, date DESC);

-- Índices para one_rm_records (consultas por user_id e exercise_name)
CREATE INDEX IF NOT EXISTS idx_one_rm_records_user_id ON public.one_rm_records(user_id);
CREATE INDEX IF NOT EXISTS idx_one_rm_records_exercise ON public.one_rm_records(exercise_name);
CREATE INDEX IF NOT EXISTS idx_one_rm_records_user_exercise ON public.one_rm_records(user_id, exercise_name);
CREATE INDEX IF NOT EXISTS idx_one_rm_records_created_at ON public.one_rm_records(created_at DESC);

-- Índices para conversations e messages
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Índices para user_settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);