-- Change update_conversation_timestamp to SECURITY INVOKER
-- This is safe because it runs when a user inserts a message, and the user already 
-- has UPDATE permission on their own conversations via RLS

CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$;

-- Note: handle_new_user_settings() and handle_new_user_subscription() MUST remain 
-- SECURITY DEFINER because they are triggered by auth.users INSERT (system context)
-- and need elevated permissions to insert into user_settings/user_subscriptions tables.
-- These functions are safe because:
-- 1. They have fixed search_path = 'public'
-- 2. They only do simple INSERT with ON CONFLICT DO NOTHING
-- 3. They use NEW.id which comes from trigger context (not user input)
-- 4. No dynamic SQL is used