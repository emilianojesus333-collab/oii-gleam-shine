-- Create table for storing 1RM calculations history
CREATE TABLE public.one_rm_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  weight_used NUMERIC NOT NULL,
  reps_performed INTEGER NOT NULL,
  calculated_1rm NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.one_rm_records ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own 1RM records" 
ON public.one_rm_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own 1RM records" 
ON public.one_rm_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own 1RM records" 
ON public.one_rm_records 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries by user and exercise
CREATE INDEX idx_one_rm_user_exercise ON public.one_rm_records(user_id, exercise_name);
CREATE INDEX idx_one_rm_created_at ON public.one_rm_records(created_at DESC);