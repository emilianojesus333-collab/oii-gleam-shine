import { motion } from 'framer-motion';
import { Bell, Dumbbell, UtensilsCrossed, Pill, BedDouble } from 'lucide-react';
import { useEffect, useCallback, useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { useAlerts } from '@/hooks/useAlerts';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { HydrationCard } from '@/components/alerts/HydrationCard';
import { NotificationPermissionCard } from '@/components/alerts/NotificationPermissionCard';
import { Switch } from '@/components/ui/switch';

// Compact reminder row matching the mockup style
interface ReminderRowProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  onClick?: () => void;
  delay?: number;
}

const ReminderRow = ({ icon, iconBg, title, subtitle, enabled, onToggle, onClick, delay = 0 }: ReminderRowProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    onClick={onClick}
    className="flex items-center gap-3 p-4 rounded-2xl bg-[#111827]/80 border border-[#1F2937]/60 cursor-pointer"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-white text-[15px]">{title}</h3>
      <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
    </div>
    <Switch
      checked={enabled}
      onCheckedChange={onToggle}
      onClick={(e) => e.stopPropagation()}
    />
  </motion.div>
);

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

  // Meal notifications local state
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

  // Notification scheduling
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
      {/* Background gradient */}
      <div className="absolute inset-x-0 top-0 h-[500px] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/15 via-cyan-600/5 via-60% to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,_var(--tw-gradient-stops))] from-cyan-400/10 via-transparent to-transparent" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-6 pt-14 pb-2"
      >
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-black text-white">Alertas</h1>
            <p className="text-sm text-gray-400">Lembretes para melhorar a tua rotina</p>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 px-5 py-4 space-y-3">
        {/* Notification Permission */}
        <NotificationPermissionCard
          permission={permission}
          isSupported={isSupported}
          onRequestPermission={requestPermission}
        />

        {/* Hydration Block */}
        <HydrationCard
          settings={state.hydration}
          onUpdate={updateHydration}
          onAddWater={addWaterIntake}
        />

        {/* Compact Reminder Cards */}
        <ReminderRow
          icon={<Dumbbell className="w-6 h-6 text-amber-400" />}
          iconBg="bg-amber-500/20"
          title="Lembrete de Treino"
          subtitle={`Lembrete ${state.workout.minutesBefore} min antes`}
          enabled={state.workout.enabled}
          onToggle={(enabled) => updateWorkoutReminder({ enabled })}
          delay={0.05}
        />

        <ReminderRow
          icon={<UtensilsCrossed className="w-6 h-6 text-green-400" />}
          iconBg="bg-green-500/20"
          title="Refeições"
          subtitle="Lembretes das refeições diárias"
          enabled={mealEnabled}
          onToggle={toggleMealEnabled}
          delay={0.1}
        />

        <ReminderRow
          icon={<Pill className="w-6 h-6 text-purple-400" />}
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
          icon={<BedDouble className="w-6 h-6 text-indigo-400" />}
          iconBg="bg-indigo-500/20"
          title="Sono & Recuperação"
          subtitle={`${state.sleep.bedtime} → ${state.sleep.wakeTime} · ${sleepHours.toFixed(0)}h estimadas`}
          enabled={state.sleep.enabled}
          onToggle={(enabled) => updateSleep({ enabled })}
          delay={0.2}
        />
      </div>

      <BottomNav />
    </div>
  );
};

export default Alerts;
