import { supabase } from "@/integrations/supabase/client";

export const getTrialStatus = (createdAt: string) => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  const trialDaysLeft = Math.max(0, 7 - diffDays);
  const isTrialActive = trialDaysLeft > 0;
  const isExpired = diffDays >= 7;
  return { trialDaysLeft, isTrialActive, isExpired, diffDays };
};

export const hasActiveSubscription = async (userId: string) => {
  const { data } = await supabase
    .from("user_subscriptions")
    .select("status, subscription_end_date")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return false;
  const isActive = data.status === "active" || data.status === "canceled_but_active";
  if (!isActive) return false;
  if (!data.subscription_end_date) return true;
  return new Date(data.subscription_end_date) > new Date();
};

export const canAccessApp = async (userId: string, createdAt: string) => {
  const { isTrialActive } = getTrialStatus(createdAt);
  if (isTrialActive) return true;
  const hasSub = await hasActiveSubscription(userId);
  return hasSub;
};
