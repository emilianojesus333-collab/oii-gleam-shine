// Centralized cache clearing utilities to avoid circular dependencies
// This module contains functions for clearing all user-related caches

// Keys that need to be cleared on logout (user-specific data patterns)
export const USER_DATA_KEYS_PATTERNS = [
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
  'liftmate_chat_history_',
  'liftmate_progress_photos_',
  'liftmate_challenges_',
  'liftmate_one_rm_',
];

// Global keys to remove (legacy without user_id)
export const LEGACY_GLOBAL_KEYS = [
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

// Clear all user-specific localStorage entries
export const clearUserLocalStorage = () => {
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
  console.log(`[CacheUtils] Cleared ${keysToRemove.length} localStorage entries`);
};

// Registry for cache clearing functions from various hooks
type CacheClearFn = () => void;
const cacheCleaners: CacheClearFn[] = [];

export const registerCacheCleaner = (cleaner: CacheClearFn) => {
  if (!cacheCleaners.includes(cleaner)) {
    cacheCleaners.push(cleaner);
  }
};

export const unregisterCacheCleaner = (cleaner: CacheClearFn) => {
  const index = cacheCleaners.indexOf(cleaner);
  if (index > -1) {
    cacheCleaners.splice(index, 1);
  }
};

// Clear all registered in-memory caches
export const clearAllInMemoryCaches = () => {
  cacheCleaners.forEach(cleaner => {
    try {
      cleaner();
    } catch (e) {
      console.error('[CacheUtils] Error clearing cache:', e);
    }
  });
  console.log(`[CacheUtils] Cleared ${cacheCleaners.length} in-memory caches`);
};

// Main function to clear all user data
export const clearAllUserData = () => {
  console.log('[CacheUtils] Clearing all user data...');
  clearUserLocalStorage();
  clearAllInMemoryCaches();
  console.log('[CacheUtils] All user data cleared');
};
