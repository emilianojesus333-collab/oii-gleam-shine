import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { clearAllCache as clearDataCache } from "./useDataCache";
import { clearAllUserData } from "./cacheUtils";

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
      const newUser = session?.user ?? null;
      
      // Clear all caches when user logs out or changes
      if (event === 'SIGNED_OUT') {
        console.log('[useAuth] User signed out, clearing all data');
        clearDataCache();
        clearAllUserData();
      }
      
      setUser(newUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    console.log('[useAuth] Signing out, clearing all caches');
    // Clear caches before signing out
    clearDataCache();
    clearAllUserData();
    await supabase.auth.signOut();
  };

  return { user, loading, signOut };
};
