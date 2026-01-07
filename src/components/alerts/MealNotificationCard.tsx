import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Droplets, Clock, ChevronDown, ChevronUp, Plus, X, Bell } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';

interface MealTime {
  type: string;
  label: string;
  time: string;
  enabled: boolean;
}

interface MealNotificationSettings {
  enabled: boolean;
  meals: MealTime[];
  waterEnabled: boolean;
  waterStartTime: string;
  waterEndTime: string;
  waterIntervalHours: number;
}

const defaultMeals: MealTime[] = [
  { type: 'breakfast', label: 'Pequeno-Almoço', time: '07:30', enabled: true },
  { type: 'morning_snack', label: 'Lanche Manhã', time: '10:30', enabled: false },
  { type: 'lunch', label: 'Almoço', time: '12:30', enabled: true },
  { type: 'afternoon_snack', label: 'Lanche Tarde', time: '16:00', enabled: true },
  { type: 'dinner', label: 'Jantar', time: '19:30', enabled: true },
  { type: 'pre_workout', label: 'Pré-Treino', time: '17:00', enabled: false },
  { type: 'post_workout', label: 'Pós-Treino', time: '19:00', enabled: false },
];

const defaultSettings: MealNotificationSettings = {
  enabled: false,
  meals: defaultMeals,
  waterEnabled: false,
  waterStartTime: '08:00',
  waterEndTime: '22:00',
  waterIntervalHours: 2,
};

// Get user-specific storage key
const getStorageKey = (userId?: string) => userId ? `liftmate_meal_notifications_${userId}` : null;

export const MealNotificationCard = () => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const { permission, scheduleMealReminders, scheduleWaterReminders, cancelNotification } = usePushNotifications();
  
  const [settings, setSettings] = useState<MealNotificationSettings>(defaultSettings);

  // Load user-specific settings
  useEffect(() => {
    const key = getStorageKey(user?.id);
    if (key) {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setSettings(JSON.parse(saved));
        } catch {
          // ignore
        }
      } else {
        setSettings(defaultSettings);
      }
    } else {
      setSettings(defaultSettings);
    }
  }, [user?.id]);

  const saveSettings = (newSettings: MealNotificationSettings) => {
    setSettings(newSettings);
    
    // Save to user-specific key
    const key = getStorageKey(user?.id);
    if (key) {
      localStorage.setItem(key, JSON.stringify(newSettings));
    }
    
    // Schedule notifications if enabled
    if (permission === 'granted') {
      if (newSettings.enabled) {
        const activeMeals = newSettings.meals
          .filter(m => m.enabled)
          .map(m => ({ type: m.type, time: m.time }));
        scheduleMealReminders(activeMeals);
      }
      
      if (newSettings.waterEnabled) {
        scheduleWaterReminders(
          newSettings.waterStartTime,
          newSettings.waterEndTime,
          newSettings.waterIntervalHours
        );
      }
    }
  };

  const toggleMealEnabled = () => {
    saveSettings({ ...settings, enabled: !settings.enabled });
  };

  const toggleWaterEnabled = () => {
    saveSettings({ ...settings, waterEnabled: !settings.waterEnabled });
  };

  const toggleMeal = (index: number) => {
    const newMeals = [...settings.meals];
    newMeals[index] = { ...newMeals[index], enabled: !newMeals[index].enabled };
    saveSettings({ ...settings, meals: newMeals });
  };

  const updateMealTime = (index: number, time: string) => {
    const newMeals = [...settings.meals];
    newMeals[index] = { ...newMeals[index], time };
    saveSettings({ ...settings, meals: newMeals });
  };

  const updateWaterSettings = (key: keyof MealNotificationSettings, value: string | number) => {
    saveSettings({ ...settings, [key]: value });
  };

  const isDisabled = permission !== 'granted';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-[#1E1E1E]/50 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between"
        disabled={isDisabled}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white/90">Lembretes de Refeições</h3>
            <p className="text-sm text-gray-400/70">
              {isDisabled ? 'Ativa as notificações primeiro' : 
                settings.enabled 
                  ? `${settings.meals.filter(m => m.enabled).length} refeições ativas` 
                  : 'Desativado'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isDisabled && (
            <Switch 
              checked={settings.enabled} 
              onCheckedChange={toggleMealEnabled}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && !isDisabled && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 pb-4 space-y-4"
        >
          {/* Meal Times */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-400">Horários das Refeições</Label>
            <div className="space-y-2">
              {settings.meals.map((meal, index) => (
                <div 
                  key={meal.type} 
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                    meal.enabled ? 'bg-primary/10 border border-primary/30' : 'bg-black/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={meal.enabled}
                      onCheckedChange={() => toggleMeal(index)}
                      className="scale-90"
                    />
                    <span className={`text-sm ${meal.enabled ? 'text-white/90' : 'text-gray-500'}`}>
                      {meal.label}
                    </span>
                  </div>
                  <Input
                    type="time"
                    value={meal.time}
                    onChange={(e) => updateMealTime(index, e.target.value)}
                    disabled={!meal.enabled}
                    className="w-24 h-8 text-center text-sm bg-black/30 border-gray-700"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Water Reminders Section */}
          <div className="pt-4 border-t border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white/90">Lembretes de Água</h4>
                  <p className="text-xs text-gray-400/70">Hidratação ao longo do dia</p>
                </div>
              </div>
              <Switch
                checked={settings.waterEnabled}
                onCheckedChange={toggleWaterEnabled}
              />
            </div>

            {settings.waterEnabled && (
              <div className="space-y-3 pl-13">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-400">Início</Label>
                    <Input
                      type="time"
                      value={settings.waterStartTime}
                      onChange={(e) => updateWaterSettings('waterStartTime', e.target.value)}
                      className="mt-1 h-9 text-sm bg-black/30 border-gray-700"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Fim</Label>
                    <Input
                      type="time"
                      value={settings.waterEndTime}
                      onChange={(e) => updateWaterSettings('waterEndTime', e.target.value)}
                      className="mt-1 h-9 text-sm bg-black/30 border-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Intervalo (horas)</Label>
                  <div className="flex gap-2 mt-1">
                    {[1, 2, 3, 4].map((hours) => (
                      <Button
                        key={hours}
                        variant={settings.waterIntervalHours === hours ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateWaterSettings('waterIntervalHours', hours)}
                        className={`flex-1 ${
                          settings.waterIntervalHours === hours 
                            ? 'bg-blue-500 hover:bg-blue-600' 
                            : 'bg-black/30 border-gray-700 text-gray-400'
                        }`}
                      >
                        {hours}h
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
