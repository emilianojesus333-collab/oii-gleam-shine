import { supabase } from "@/integrations/supabase/client";
const sb = supabase as unknown as { from: (table: string) => any };

export const saveMemory = async (userId: string, type: string, content: string) => {
  await sb.from("chat_memory").insert({
    user_id: userId,
    memory_type: type,
    content
  });
};

export const loadMemories = async (userId: string) => {
  const { data } = await sb
    .from("chat_memory")
    .select("*")
    .eq("user_id", userId)
    .or("expires_at.is.null,expires_at.gt.now()")
    .order("created_at", { ascending: false })
    .limit(20);
  return data || [];
};

export const detectAndSaveMemories = async (userId: string, userMessage: string) => {
  const lowerMsg = userMessage.toLowerCase();
  if (lowerMsg.includes("dor") || lowerMsg.includes("lesão") || lowerMsg.includes("magoei")) {
    await saveMemory(userId, "injury", `Utilizador mencionou: "${userMessage}"`);
  }
  if (lowerMsg.includes("prefiro") || lowerMsg.includes("gosto mais") || lowerMsg.includes("não gosto")) {
    await saveMemory(userId, "preference", `Preferência: "${userMessage}"`);
  }
  if (lowerMsg.includes("quero") && (lowerMsg.includes("chegar") || lowerMsg.includes("atingir") || lowerMsg.includes("alcançar"))) {
    await saveMemory(userId, "goal", `Objetivo mencionado: "${userMessage}"`);
  }
};

export const formatMemoriesForAI = (memories: { memory_type: string; content: string; created_at: string }[]) => {
  if (!memories.length) return "";
  const lines = memories.map(m => {
    const date = new Date(m.created_at).toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
    return `- [${m.memory_type.toUpperCase()}] ${m.content} (${date})`;
  });
  return `\n🧠 MEMÓRIAS IMPORTANTES DO UTILIZADOR:\n${lines.join("\n")}`;
};
