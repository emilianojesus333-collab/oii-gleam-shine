import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface OneRMRecord {
  id: string;
  exercise_name: string;
  weight_used: number;
  reps_performed: number;
  calculated_1rm: number;
  created_at: string;
}

export const useOneRMRecords = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<OneRMRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = async (exerciseName?: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from("one_rm_records")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (exerciseName) {
        query = query.ilike("exercise_name", `%${exerciseName}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setRecords(data || []);
    } catch (error: unknown) {
      console.error("Error fetching 1RM records:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveRecord = async (
    exerciseName: string,
    weightUsed: number,
    repsPerformed: number,
    calculated1RM: number
  ) => {
    if (!user) {
      toast.error("Precisas de fazer login para guardar o 1RM");
      return false;
    }

    try {
      const { error } = await supabase.from("one_rm_records").insert({
        user_id: user.id,
        exercise_name: exerciseName,
        weight_used: weightUsed,
        reps_performed: repsPerformed,
        calculated_1rm: calculated1RM,
      });

      if (error) throw error;
      
      toast.success("1RM guardado com sucesso!");
      await fetchRecords(exerciseName);
      return true;
    } catch (error: unknown) {
      console.error("Error saving 1RM record:", error);
      toast.error("Erro ao guardar o 1RM");
      return false;
    }
  };

  const getExerciseHistory = (exerciseName: string) => {
    return records.filter(
      (r) => r.exercise_name.toLowerCase() === exerciseName.toLowerCase()
    );
  };

  const getLatestRecord = (exerciseName: string) => {
    const history = getExerciseHistory(exerciseName);
    return history.length > 0 ? history[0] : null;
  };

  const getProgressData = (exerciseName: string) => {
    const history = getExerciseHistory(exerciseName).reverse();
    if (history.length < 2) return null;

    const first = history[0];
    const last = history[history.length - 1];
    const difference = last.calculated_1rm - first.calculated_1rm;
    const percentageChange = ((difference / first.calculated_1rm) * 100).toFixed(1);

    return {
      history,
      difference,
      percentageChange,
      isImprovement: difference > 0,
    };
  };

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  return {
    records,
    loading,
    saveRecord,
    fetchRecords,
    getExerciseHistory,
    getLatestRecord,
    getProgressData,
    isAuthenticated: !!user,
  };
};
