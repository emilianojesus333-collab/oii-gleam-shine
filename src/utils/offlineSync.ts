import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const saveToOfflineQueue = (userId: string, data: object, type: string) => {
  const key = `liftmate_offline_queue_${userId}`;
  const queue: { type: string; data: object; timestamp: string }[] = JSON.parse(
    localStorage.getItem(key) || "[]"
  );
  queue.push({ type, data, timestamp: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(queue));
};

export const getOfflineQueueLength = (userId: string): number => {
  const key = `liftmate_offline_queue_${userId}`;
  const queue = JSON.parse(localStorage.getItem(key) || "[]");
  return queue.length;
};

export const syncOfflineQueue = async (userId: string) => {
  const key = `liftmate_offline_queue_${userId}`;
  const queue: { type: string; data: object; timestamp: string }[] = JSON.parse(
    localStorage.getItem(key) || "[]"
  );
  if (queue.length === 0) return;

  const failed: typeof queue = [];

  for (const item of queue) {
    try {
      if (item.type === "workout_session") {
        await supabase.from("workout_sessions").insert(item.data as never);
      }
      if (item.type === "workout_set") {
        await supabase.from("workout_sets").insert(item.data as never);
      }
      if (item.type === "one_rm_record") {
        await supabase.from("one_rm_records").insert(item.data as never);
      }
    } catch {
      failed.push(item);
    }
  }

  if (failed.length === 0) {
    localStorage.removeItem(key);
    toast.success("Dados sincronizados com sucesso! ☁️");
  } else {
    localStorage.setItem(key, JSON.stringify(failed));
    toast.warning(`${failed.length} item(s) não sincronizados. A tentar novamente mais tarde.`);
  }
};
