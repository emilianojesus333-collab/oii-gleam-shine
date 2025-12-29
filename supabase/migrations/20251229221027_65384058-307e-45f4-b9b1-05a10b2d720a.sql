-- Add DELETE policy for nutrition_profiles table
CREATE POLICY "Users can delete their own nutrition profile" 
ON public.nutrition_profiles 
FOR DELETE 
USING (auth.uid() = user_id);