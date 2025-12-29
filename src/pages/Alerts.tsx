import { motion } from 'framer-motion';
import { Bell, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { useAlerts } from '@/hooks/useAlerts';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { HydrationCard } from '@/components/alerts/HydrationCard';
import { SupplementsCard } from '@/components/alerts/SupplementsCard';
import { SleepCard } from '@/components/alerts/SleepCard';
import { StreakCard } from '@/components/alerts/StreakCard';
import { QuickTimerCard } from '@/components/alerts/QuickTimerCard';
import { WorkoutReminderCard } from '@/components/alerts/WorkoutReminderCard';
import { NotificationPermissionCard } from '@/components/alerts/NotificationPermissionCard';
import { MealNotificationCard } from '@/components/alerts/MealNotificationCard';

const Alerts = () => {
  const {
    state,
    updateHydration,
    addWaterIntake,
    updateSupplement,
    addSupplement,
    removeSupplement,
    updateWorkoutReminder,
    updateSleep,
    getSleepHours,
    recordWorkout,
    startQuickTimer,
    stopQuickTimer,
    activeQuickTimer,
    quickTimerRemaining,
  } = useAlerts();

  const {
    permission,
    isSupported,
    requestPermission,
    scheduleHydrationReminder,
    scheduleSupplementReminder,
    scheduleSleepReminder,
    cancelAllNotifications,
  } = usePushNotifications();

  // Schedule notifications when settings change
  useEffect(() => {
    if (permission !== 'granted') return;

    // Clear existing and reschedule
    cancelAllNotifications();

    // Hydration reminders
    if (state.hydration.enabled) {
      scheduleHydrationReminder(state.hydration.intervalMinutes);
    }

    // Supplement reminders
    state.supplements
      .filter(s => s.enabled)
      .forEach(supplement => {
        scheduleSupplementReminder(supplement.name, supplement.time, supplement.days);
      });

    // Sleep reminder
    if (state.sleep.enabled) {
      scheduleSleepReminder(state.sleep.bedtime, state.sleep.reminderMinutesBefore);
    }
  }, [
    permission,
    state.hydration.enabled,
    state.hydration.intervalMinutes,
    state.supplements,
    state.sleep.enabled,
    state.sleep.bedtime,
    state.sleep.reminderMinutesBefore,
    scheduleHydrationReminder,
    scheduleSupplementReminder,
    scheduleSleepReminder,
    cancelAllNotifications,
  ]);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero Background Gradient */}
      <div className="absolute inset-x-0 top-0 h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/25 via-blue-600/10 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400/15 via-transparent to-transparent" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-6 pt-12 pb-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/20 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Bell className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground">Alertas</h1>
              <p className="text-xs text-cyan-500">O teu assistente de treino</p>
            </div>
          </div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span className="text-xs font-medium text-cyan-500">Pro</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 px-6 py-4 space-y-4">
        {/* Notification Permission */}
        <NotificationPermissionCard
          permission={permission}
          isSupported={isSupported}
          onRequestPermission={requestPermission}
        />
        {/* Streak */}
        <StreakCard 
          streak={state.streak} 
          onRecordWorkout={recordWorkout} 
        />

        {/* Quick Timer */}
        <QuickTimerCard
          timers={state.quickTimers}
          activeTimer={activeQuickTimer}
          remaining={quickTimerRemaining}
          onStart={startQuickTimer}
          onStop={stopQuickTimer}
        />

        {/* Meal & Water Notifications - NEW */}
        <MealNotificationCard />

        {/* Hydration */}
        <HydrationCard
          settings={state.hydration}
          onUpdate={updateHydration}
          onAddWater={addWaterIntake}
        />

        {/* Supplements */}
        <SupplementsCard
          supplements={state.supplements}
          onUpdate={updateSupplement}
          onAdd={addSupplement}
          onRemove={removeSupplement}
        />

        {/* Workout Reminder */}
        <WorkoutReminderCard
          settings={state.workout}
          onUpdate={updateWorkoutReminder}
        />

        {/* Sleep */}
        <SleepCard
          settings={state.sleep}
          sleepHours={getSleepHours()}
          onUpdate={updateSleep}
        />
      </div>

      <BottomNav />
    </div>
  );
};

export default Alerts;
