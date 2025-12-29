-- Add DELETE policy for user_subscriptions table
CREATE POLICY "Users can delete their own subscription" 
ON public.user_subscriptions 
FOR DELETE 
USING (auth.uid() = user_id);