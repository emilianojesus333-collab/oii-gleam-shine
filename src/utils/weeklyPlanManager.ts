import { supabase } from "@/integrations/supabase/client";

export type DayPlan =
  | "descanso"
  | { principal: string; secundario?: string | null };

export type WeeklyPlan = Record<string, DayPlan>;

/**
 * Substitui COMPLETAMENTE o plano semanal do utilizador.
 * Escreve em user_settings.onboarding_data.schedule no formato
 * Record<dia, string[]> (compatível com o resto do app).
 */
export const updateWeeklyPlan = async (
  userId: string,
  newPlan: WeeklyPlan
): Promise<boolean> => {
  try {
    // Converter para o formato interno (dia -> string[])
    const schedule: Record<string, string[]> = {};
    for (const [day, value] of Object.entries(newPlan)) {
      if (!value || value === "descanso") {
        schedule[day] = [];
      } else {
        const muscles: string[] = [];
        if (value.principal) muscles.push(value.principal);
        if (value.secundario) muscles.push(value.secundario);
        schedule[day] = muscles;
      }
    }

    // Ler onboarding_data atual e substituir só o schedule
    const { data: current } = await supabase
      .from("user_settings")
      .select("onboarding_data")
      .eq("user_id", userId)
      .maybeSingle();

    const newOnboarding = {
      ...((current?.onboarding_data as Record<string, unknown>) || {}),
      schedule,
    };

    const { error } = await supabase
      .from("user_settings")
      .update({ onboarding_data: newOnboarding })
      .eq("user_id", userId);

    if (error) {
      console.error("[weeklyPlanManager] update error:", error);
      return false;
    }

    try {
      localStorage.setItem(
        `liftmate_weekly_plan_${userId}`,
        JSON.stringify(newPlan)
      );
    } catch {
      /* ignore */
    }

    return true;
  } catch (e) {
    console.error("[weeklyPlanManager] exception:", e);
    return false;
  }
};