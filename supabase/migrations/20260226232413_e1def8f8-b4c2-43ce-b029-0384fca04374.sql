-- Create session_status enum
CREATE TYPE public.session_status AS ENUM ('in_progress', 'completed');

-- Add status column to workout_sessions with default 'completed' 
-- (existing sessions are assumed completed)
ALTER TABLE public.workout_sessions 
  ADD COLUMN status public.session_status NOT NULL DEFAULT 'completed';