
-- Use DROP + CREATE to ensure all triggers are properly attached
-- Skip auth.users triggers since they already exist

-- 3. Trigger to update conversation timestamp on new message
DROP TRIGGER IF EXISTS on_message_created_update_conversation ON public.messages;
CREATE TRIGGER on_message_created_update_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();

-- 4. Triggers for updated_at on relevant tables
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_workout_sessions_updated_at ON public.workout_sessions;
CREATE TRIGGER update_workout_sessions_updated_at
  BEFORE UPDATE ON public.workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_nutrition_logs_updated_at ON public.nutrition_logs;
CREATE TRIGGER update_nutrition_logs_updated_at
  BEFORE UPDATE ON public.nutrition_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_nutrition_profiles_updated_at ON public.nutrition_profiles;
CREATE TRIGGER update_nutrition_profiles_updated_at
  BEFORE UPDATE ON public.nutrition_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
