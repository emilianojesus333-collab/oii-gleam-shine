import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface PersonalData {
  name: string;
  height: string;
  weight: string;
  gender: string;
  birthYear: string;
}

interface OnboardingData {
  personal: PersonalData;
  goal: string | null;
  experience: string | null;
  focus: string | null;
  schedule: Record<string, string[]>;
}

interface UserSettings {
  id: string;
  user_id: string;
  ai_name: string | null;
  alerts_config: Record<string, unknown> | null;
  onboarding_data: OnboardingData | null;
  has_completed_onboarding: boolean;
  fatigue_index: number | null;
  created_at: string;
  updated_at: string;
}

interface UseUserSettingsReturn {
  settings: UserSettings | null;
  isLoading: boolean;
  error: Error | null;
  updateSettings: (updates: Partial<Pick<UserSettings, 'ai_name' | 'alerts_config' | 'onboarding_data'>>) => Promise<void>;
  updateSchedule: (schedule: Record<string, string[]>) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useUserSettings = (): UseUserSettingsReturn => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        // Parse onboarding_data from JSON
        const parsedSettings: UserSettings = {
          ...data,
          onboarding_data: data.onboarding_data as unknown as OnboardingData | null,
          alerts_config: data.alerts_config as unknown as Record<string, unknown> | null,
          fatigue_index: data.fatigue_index,
        };
        setSettings(parsedSettings);
      } else {
        // No settings found, user needs onboarding
        setSettings(null);
      }
    } catch (err) {
      console.error("Error fetching user settings:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch settings"));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (
    updates: Partial<Pick<UserSettings, 'ai_name' | 'alerts_config' | 'onboarding_data'>>
  ) => {
    if (!user || !settings) {
      toast.error("Utilizador não autenticado");
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("user_settings")
        .update({
          ai_name: updates.ai_name !== undefined ? updates.ai_name : settings.ai_name,
          alerts_config: updates.alerts_config !== undefined 
            ? JSON.parse(JSON.stringify(updates.alerts_config)) 
            : settings.alerts_config,
          onboarding_data: updates.onboarding_data !== undefined 
            ? JSON.parse(JSON.stringify(updates.onboarding_data)) 
            : settings.onboarding_data,
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Update local state
      setSettings(prev => prev ? {
        ...prev,
        ...updates,
      } : null);

    } catch (err) {
      console.error("Error updating settings:", err);
      toast.error("Erro ao salvar configurações");
      throw err;
    }
  }, [user, settings]);

  const updateSchedule = useCallback(async (schedule: Record<string, string[]>) => {
    if (!user || !settings) {
      toast.error("Utilizador não autenticado");
      return;
    }

    try {
      const newOnboardingData = {
        ...(settings.onboarding_data || {}),
        schedule,
      };

      const { error: updateError } = await supabase
        .from("user_settings")
        .update({
          onboarding_data: JSON.parse(JSON.stringify(newOnboardingData)),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Update local state
      setSettings(prev => prev ? {
        ...prev,
        onboarding_data: newOnboardingData as OnboardingData,
      } : null);

    } catch (err) {
      console.error("Error updating schedule:", err);
      toast.error("Erro ao salvar calendário");
      throw err;
    }
  }, [user, settings]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    updateSchedule,
    refetch: fetchSettings,
  };
};
