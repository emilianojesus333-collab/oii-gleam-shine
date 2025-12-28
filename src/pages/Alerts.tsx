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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Alertas</h1>
                <p className="text-xs text-muted-foreground">O teu assistente de treino</p>
              </div>
            </div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-primary">Pro</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-4 py-6 space-y-4">
        {/* Notification Permission */}
        <NotificationPermissionCard
          permission={permission}
          isSupported={isSupported}
          onRequestPermission={requestPermission}
        />
        {/* Streak - Most important, always visible */}
        <StreakCard 
          streak={state.streak} 
          onRecordWorkout={recordWorkout} 
        />

        {/* Quick Timer - Easy access */}
        <QuickTimerCard
          timers={state.quickTimers}
          activeTimer={activeQuickTimer}
          remaining={quickTimerRemaining}
          onStart={startQuickTimer}
          onStop={stopQuickTimer}
        />

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
