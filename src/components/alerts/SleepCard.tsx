import { motion } from 'framer-motion';
import { Moon, Sun, BedDouble, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { SleepSettings } from '@/hooks/useAlerts';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/hooks/useLanguage';

interface SleepCardProps {
  settings: SleepSettings;
  sleepHours: number;
  onUpdate: (updates: Partial<SleepSettings>) => void;
}

export const SleepCard = ({ settings, sleepHours, onUpdate }: SleepCardProps) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  const getQualityColor = () => {
    if (sleepHours >= 7.5) return 'text-green-400';
    if (sleepHours >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getQualityLabel = () => {
    if (sleepHours >= 8) return t("sleep.excellent");
    if (sleepHours >= 7) return t("sleep.good");
    if (sleepHours >= 6) return t("sleep.fair");
    return t("sleep.insufficient");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-2xl p-5 border border-indigo-500/20"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <BedDouble className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{t("sleep.title")}</h3>
            <p className="text-xs text-gray-400">
              {t("sleep.reminderBefore")} {settings.reminderMinutesBefore} {t("sleep.minBefore")}
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
                <DrawerTitle>{t("sleep.configure")}</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("sleep.enableReminders")}</span>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(enabled) => onUpdate({ enabled })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      {t("sleep.sleep")}
                    </label>
                    <Input
                      type="time"
                      value={settings.bedtime}
                      onChange={(e) => onUpdate({ bedtime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      {t("sleep.wake")}
                    </label>
                    <Input
                      type="time"
                      value={settings.wakeTime}
                      onChange={(e) => onUpdate({ wakeTime: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t("sleep.reminderBeforeLabel")}</span>
                    <span className="text-sm font-medium">{settings.reminderMinutesBefore} min</span>
                  </div>
                  <Slider
                    value={[settings.reminderMinutesBefore]}
                    onValueChange={([v]) => onUpdate({ reminderMinutesBefore: v })}
                    min={15}
                    max={60}
                    step={15}
                  />
                </div>
              </div>
            </DrawerContent>
          </Drawer>
          
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => onUpdate({ enabled })}
          />
        </div>
      </div>

      {/* Sleep schedule visualization */}
      <div className="relative h-20 bg-gradient-to-r from-indigo-900/30 via-indigo-500/10 to-amber-500/20 rounded-xl overflow-hidden mb-4">
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-lg font-semibold text-white">{settings.bedtime}</p>
              <p className="text-[10px] text-gray-400">{t("sleep.sleep")}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <span className={`text-2xl font-bold ${getQualityColor()}`}>
              {sleepHours.toFixed(1)}h
            </span>
            <span className={`text-xs ${getQualityColor()}`}>{getQualityLabel()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-lg font-semibold text-white">{settings.wakeTime}</p>
              <p className="text-[10px] text-gray-400">{t("sleep.wake")}</p>
            </div>
            <Sun className="w-5 h-5 text-amber-400" />
          </div>
        </div>
        
        {/* Decorative stars */}
        <div className="absolute top-2 left-8 w-1 h-1 bg-white/40 rounded-full" />
        <div className="absolute top-4 left-16 w-0.5 h-0.5 bg-white/30 rounded-full" />
        <div className="absolute bottom-3 left-12 w-1 h-1 bg-white/20 rounded-full" />
      </div>

      {/* Quick tips */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-500/10">
          <span>💪</span>
          <span className="text-gray-300">{t("sleep.sleepEqualsGains")}</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-500/10">
          <span>🔋</span>
          <span className="text-gray-300">{t("sleep.recoversMusles")}</span>
        </div>
      </div>
    </motion.div>
  );
};