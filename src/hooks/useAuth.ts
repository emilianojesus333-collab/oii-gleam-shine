import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { clearAllCache as clearDataCache } from "./useDataCache";

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
];

const clearUserLocalStorage = (userId?: string) => {
  // Clear all user-specific localStorage keys
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      // Check if key matches any user-specific pattern
      const isUserData = USER_DATA_KEYS_PATTERNS.some(pattern => key.startsWith(pattern));
      if (isUserData) {
        keysToRemove.push(key);
      }
      // Also remove old global keys (without user_id suffix) for migration
      if (key === 'liftmate_workout_history' ||
          key === 'liftmate_body_measurements' ||
          key === 'nutrition_data' ||
          key === 'liftmate_meal_notifications' ||
          key === 'liftmate_coaching_tips' ||
          key === 'liftmate_user_goals' ||
          key === 'liftmate_physique_evaluation') {
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
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
        clearDataCache();
        clearUserLocalStorage(previousUser?.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Clear caches before signing out
    clearDataCache();
    clearUserLocalStorage(user?.id);
    await supabase.auth.signOut();
  };

  return { user, loading, signOut };
};
