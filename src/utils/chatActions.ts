import { supabase } from "@/integrations/supabase/client";

export const executeChatAction = async (userId: string, actionStr: string) => {
  try {
    // Find [ACTION:TYPE: header
    const headerMatch = actionStr.match(/\[ACTION:(\w+):/);
    if (!headerMatch) return null;
    const actionType = headerMatch[1];

    // Locate start of JSON payload (first { after the header)
    const headerEnd = actionStr.indexOf(headerMatch[0]) + headerMatch[0].length;
    if (actionStr[headerEnd] !== "{") return null;

    // Bracket-count to find end of JSON object — handles ] inside arrays
    let depth = 0, idx = headerEnd;
    while (idx < actionStr.length) {
      if (actionStr[idx] === "{") depth++;
      else if (actionStr[idx] === "}") { depth--; if (depth === 0) break; }
      idx++;
    }
    if (depth !== 0) return null;

    const data = JSON.parse(actionStr.slice(headerEnd, idx + 1));

    if (actionType === "updateSchedule") {
      const { data: current } = await supabase
        .from("user_settings")
        .select("onboarding_data")
        .eq("user_id", userId)
        .maybeSingle();
      const ob = (current?.onboarding_data as Record<string, unknown> | null) || {};
      const updated = { ...ob, schedule: data };
      await supabase.from("user_settings").update({ onboarding_data: updated }).eq("user_id", userId);
      return { type: "updateSchedule", message: "Calendário atualizado com sucesso!" };
    }

    if (actionType === "rescheduleWorkout") {
      const { from, to } = data;
      const { data: current } = await supabase
        .from("user_settings")
        .select("onboarding_data")
        .eq("user_id", userId)
        .maybeSingle();
      const ob = (current?.onboarding_data as Record<string, unknown> | null) || {};
      const schedule = ((ob.schedule as Record<string, string[]>) || {});
      schedule[to] = schedule[from] || [];
      schedule[from] = ["Descanso"];
      const updated = { ...ob, schedule };
      await supabase.from("user_settings").update({ onboarding_data: updated }).eq("user_id", userId);
      return { type: "rescheduleWorkout", message: `Treino movido de ${from} para ${to}!` };
    }

    if (actionType === "addGoal") {
      const goals = JSON.parse(localStorage.getItem(`liftmate_goals_${userId}`) || "[]");
      goals.push({ ...data, id: Date.now(), createdAt: new Date().toISOString(), progress: 0 });
      localStorage.setItem(`liftmate_goals_${userId}`, JSON.stringify(goals));
      return { type: "addGoal", message: `Meta criada: ${data.description}!` };
    }

    return null;
  } catch (e) {
    console.error("ChatAction error:", e);
    return null;
  }
};
