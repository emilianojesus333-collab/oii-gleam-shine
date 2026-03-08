import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useEffect, useCallback, useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { useAlerts } from '@/hooks/useAlerts';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { HydrationCard } from '@/components/alerts/HydrationCard';
import { NotificationPermissionCard } from '@/components/alerts/NotificationPermissionCard';
import { Switch } from '@/components/ui/switch';

import illustWorkout from '@/assets/illust-workout.png';
import illustMeals from '@/assets/illust-meals.png';
import illustSupplements from '@/assets/illust-supplements.png';
import illustSleep from '@/assets/illust-sleep.png';

interface ReminderCardProps {
  illustration: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  onClick?: () => void;
  delay?: number;
}

const ReminderCard = ({ illustration, title, subtitle, enabled, onToggle, onClick, delay = 0 }: ReminderCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    onClick={onClick}
    className="relative overflow-hidden rounded-2xl bg-[#111827]/90 border border-white/[0.06] cursor-pointer h-[100px]"
  >
    {/* Illustration positioned right */}
    <img
      src={illustration}
      alt={title}
      className="absolute right-0 bottom-0 h-full w-auto object-contain opacity-60 pointer-events-none"
      style={{ maxWidth: '45%' }}
    />
    {/* Content */}
    <div className="relative z-10 flex items-center justify-between h-full px-5">
      <div className="flex-1 min-w-0 pr-3">
        <h3 className="font-bold text-white text-base">{title}</h3>
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  </motion.div>
);

const Alerts = () => {
  const {
    state,
    updateHydration,
    addWaterIntake,
    updateSupplement,
    updateWorkoutReminder,
    updateSleep,
    getSleepHours,
  } = useAlerts();

  const {
    permission,
    isSupported,
    requestPermission,
    scheduleHydrationReminder,
    scheduleSupplementReminder,
    scheduleSleepReminder,
    scheduleWaterReminders,
    scheduleMealReminders,
    cancelAllNotifications,
  } = usePushNotifications();

  const [mealEnabled, setMealEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('liftmate_meal_notifications_global');
      return saved ? JSON.parse(saved) : false;
    } catch { return false; }
  });

  const toggleMealEnabled = (v: boolean) => {
    setMealEnabled(v);
    localStorage.setItem('liftmate_meal_notifications_global', JSON.stringify(v));
  };

  const scheduleAllNotifications = useCallback(() => {
    if (permission !== 'granted') return;
    cancelAllNotifications();
    if (state.hydration.enabled) {
      scheduleHydrationReminder(state.hydration.intervalMinutes);
    }
    state.supplements
      .filter(s => s.enabled)
      .forEach(supplement => {
        scheduleSupplementReminder(supplement.name, supplement.time, supplement.days);
      });
    if (state.sleep.enabled) {
      scheduleSleepReminder(state.sleep.bedtime, state.sleep.reminderMinutesBefore);
    }
    scheduleWaterReminders('08:00', '22:00', 2);
    scheduleMealReminders([
      { type: 'breakfast', time: '08:00' },
      { type: 'morning_snack', time: '10:30' },
      { type: 'lunch', time: '13:00' },
      { type: 'afternoon_snack', time: '16:00' },
      { type: 'dinner', time: '20:00' },
    ]);
  }, [
    permission, state.hydration.enabled, state.hydration.intervalMinutes,
    state.supplements, state.sleep.enabled, state.sleep.bedtime,
    state.sleep.reminderMinutesBefore, scheduleHydrationReminder,
    scheduleSupplementReminder, scheduleSleepReminder,
    scheduleWaterReminders, scheduleMealReminders, cancelAllNotifications,
  ]);

  useEffect(() => {
    scheduleAllNotifications();
  }, [scheduleAllNotifications]);

  const sleepHours = getSleepHours();

  return (
    <div className="min-h-screen bg-black pb-32">
      {/* Background gradient - matching Nutrition style with cyan */}
      <div className="absolute inset-x-0 top-0 h-[420px] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-600/30 via-cyan-500/10 via-60% to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_var(--tw-gradient-stops))] from-cyan-400/15 via-transparent to-transparent" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-6 pt-12 pb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/20 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Bell className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Alertas</h1>
            <p className="text-xs text-cyan-400">Lembretes para melhorar a tua rotina</p>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 px-6 py-4 space-y-5">
        {/* Notification Permission */}
        <NotificationPermissionCard
          permission={permission}
          isSupported={isSupported}
          onRequestPermission={requestPermission}
        />

        {/* Hydration - floating, no card */}
        <HydrationCard
          settings={state.hydration}
          onUpdate={updateHydration}
          onAddWater={addWaterIntake}
        />

        {/* Reminder Cards with illustrations */}
        <div className="space-y-3">
          <ReminderRow
            illustration={iconWorkout}
            iconBg="bg-amber-500/20"
            title="Lembrete de Treino"
            subtitle={`Lembrete ${state.workout.minutesBefore} min antes`}
            enabled={state.workout.enabled}
            onToggle={(enabled) => updateWorkoutReminder({ enabled })}
            delay={0.05}
          />

          <ReminderRow
            illustration={iconMeals}
            iconBg="bg-green-500/20"
            title="Refeições"
            subtitle="Lembretes das refeições diárias"
            enabled={mealEnabled}
            onToggle={toggleMealEnabled}
            delay={0.1}
          />

          <ReminderRow
            illustration={iconSupplements}
            iconBg="bg-purple-500/20"
            title="Suplementos"
            subtitle={`${state.supplements.filter(s => s.enabled).length} lembretes ativos`}
            enabled={state.supplements.length > 0 && state.supplements.some(s => s.enabled)}
            onToggle={(enabled) => {
              state.supplements.forEach(s => updateSupplement(s.id, { enabled }));
            }}
            delay={0.15}
          />

          <ReminderRow
            illustration={iconSleep}
            iconBg="bg-indigo-500/20"
            title="Sono & Recuperação"
            subtitle={`${state.sleep.bedtime} → ${state.sleep.wakeTime} · ${sleepHours.toFixed(0)}h estimadas`}
            enabled={state.sleep.enabled}
            onToggle={(enabled) => updateSleep({ enabled })}
            delay={0.2}
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Alerts;
