import { motion } from 'framer-motion';
import { Dumbbell, Settings2, MessageSquare, Clock, CalendarClock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { WorkoutReminder } from '@/hooks/useAlerts';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

interface WorkoutReminderCardProps {
  settings: WorkoutReminder;
  onUpdate: (updates: Partial<WorkoutReminder>) => void;
}

const motivationalQuotesEn = [
  "Today's pain is tomorrow's victory! 💪",
  "Every rep counts. Let's train!",
  "The only bad workout is the one you didn't do!",
  "Rise, train, repeat. 🔥",
];

// Get user-specific storage key
const getStorageKey = (userId?: string) => userId ? `liftmate_workout_time_${userId}` : null;

export const WorkoutReminderCard = ({ settings, onUpdate }: WorkoutReminderCardProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [workoutTime, setWorkoutTime] = useState('18:00');
  
  // Load user-specific workout time
  useEffect(() => {
    const key = getStorageKey(user?.id);
    if (key) {
      const saved = localStorage.getItem(key);
      if (saved) {
        setWorkoutTime(saved);
      }
    }
  }, [user?.id]);
  
  // Fix: Use useState with initializer to prevent re-renders causing text flickering
  const [randomQuote] = useState(() => 
    motivationalQuotesEn[Math.floor(Math.random() * motivationalQuotesEn.length)]
  );
  
  const { permission, scheduleWorkoutReminder, cancelNotification } = usePushNotifications();

  // Schedule workout notification when settings change
  useEffect(() => {
    if (permission !== 'granted' || !settings.enabled || !user?.id) {
      return;
    }

    // Parse workout time and create Date for today/tomorrow
    const [hours, minutes] = workoutTime.split(':').map(Number);
    const now = new Date();
    const workoutDate = new Date(now);
    workoutDate.setHours(hours, minutes, 0, 0);
    
    // If workout time passed today, schedule for tomorrow
    if (workoutDate <= now) {
      workoutDate.setDate(workoutDate.getDate() + 1);
    }

    // Schedule the notification
    scheduleWorkoutReminder(workoutDate, settings.minutesBefore, settings.motivationalMessage);

    // Save workout time - USER SPECIFIC
    const key = getStorageKey(user.id);
    if (key) {
      localStorage.setItem(key, workoutTime);
    }
  }, [settings.enabled, settings.minutesBefore, settings.motivationalMessage, workoutTime, permission, scheduleWorkoutReminder, user?.id]);

  const handleTimeChange = (time: string) => {
    setWorkoutTime(time);
  };

  const isDisabled = permission !== 'granted';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-5 border border-amber-500/20"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{t("workoutReminder.title")}</h3>
            <p className="text-xs text-gray-400">
              {settings.minutesBefore} {t("workoutReminder.minBeforeWorkout")}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings2 className="w-4 h-4 text-gray-400" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{t("workoutReminder.configure")}</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("workoutReminder.enableReminders")}</span>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(enabled) => onUpdate({ enabled })}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarClock className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">{t("workoutReminder.workoutTime")}</Label>
                  </div>
                  <Input
                    type="time"
                    value={workoutTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="w-full bg-background/50"
                    disabled={isDisabled}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t("workoutReminder.notifyBefore")}</span>
                    <span className="text-sm font-medium">{settings.minutesBefore} min</span>
                  </div>
                  <Slider
                    value={[settings.minutesBefore]}
                    onValueChange={([v]) => onUpdate({ minutesBefore: v })}
                    min={15}
                    max={120}
                    step={15}
                    disabled={isDisabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{t("workoutReminder.motivationalMessage")}</span>
                  </div>
                  <Switch
                    checked={settings.motivationalMessage}
                    onCheckedChange={(motivationalMessage) => onUpdate({ motivationalMessage })}
                    disabled={isDisabled}
                  />
                </div>

                {isDisabled && (
                  <p className="text-xs text-amber-400/80 text-center pt-2">
                    {t("workoutReminder.enableNotificationsFirst")}
                  </p>
                )}
              </div>
            </DrawerContent>
          </Drawer>
          
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => onUpdate({ enabled })}
            disabled={isDisabled}
          />
        </div>
      </div>

      {/* Preview notification */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-4 rounded-xl bg-white/5 border border-white/10"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm text-white">{t("workoutReminder.timeToTrain")}</span>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{t("workoutReminder.now")}</span>
              </div>
            </div>
            {settings.motivationalMessage && (
              <p className="text-xs text-gray-400 line-clamp-2">
                {randomQuote}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        {t("workoutReminder.notificationPreview")}
      </p>
    </motion.div>
  );
};