import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { clearAllCache as clearDataCache } from "./useDataCache";
import { clearMeasurementsCache } from "./useBodyMeasurements";
import { clearNutritionCache } from "./useNutrition";

// Keys that need to be cleared on logout (user-specific data)
const USER_DATA_KEYS_PATTERNS = [
  'liftmate_workout_history_',
  'liftmate_body_measurements_',
  'nutrition_data_',
  'liftmate_favorites_',
  'gymAlerts_',
  'liftmate_meal_notifications_',
  'liftmate_coaching_tips_',
  'liftmate_user_goals_',
  'liftmate_physique_evaluation_',
  'liftmate_workout_time_',
  'liftmate_continuous_mode_',
  'liftmate_name_banner_dismissed_',
  'liftmate_onboarding_',
  'liftmate_ai_name_',
];

// Global keys to remove (legacy without user_id)
const LEGACY_GLOBAL_KEYS = [
  'liftmate_workout_history',
  'liftmate_body_measurements',
  'nutrition_data',
  'liftmate_meal_notifications',
  'liftmate_coaching_tips',
  'liftmate_user_goals',
  'liftmate_physique_evaluation',
  'liftmate_workout_time',
  'liftmate_continuous_mode',
  'liftmate_name_banner_dismissed',
  'liftmate_onboarding',
  'liftmate_ai_name',
];

const clearUserLocalStorage = () => {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      // Check if key matches any user-specific pattern
      const isUserData = USER_DATA_KEYS_PATTERNS.some(pattern => key.startsWith(pattern));
      if (isUserData) {
        keysToRemove.push(key);
      }
      // Also remove legacy global keys
      if (LEGACY_GLOBAL_KEYS.includes(key)) {
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

const clearAllCaches = () => {
  // Clear global data cache
  clearDataCache();
  // Clear local caches from hooks
  clearMeasurementsCache();
  clearNutritionCache();
  // Clear user-specific localStorage
  clearUserLocalStorage();
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const previousUser = user;
      const newUser = session?.user ?? null;
      
      setUser(newUser);
      
      // Clear all caches when user logs out or changes
      if (event === 'SIGNED_OUT' || (previousUser && newUser && previousUser.id !== newUser.id)) {
        clearAllCaches();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Clear caches before signing out
    clearAllCaches();
    await supabase.auth.signOut();
  };

  return { user, loading, signOut };
};
