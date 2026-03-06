import { motion } from 'framer-motion';
import { Droplets, Settings2, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { HydrationSettings } from '@/hooks/useAlerts';
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

interface HydrationCardProps {
  settings: HydrationSettings;
  onUpdate: (updates: Partial<HydrationSettings>) => void;
  onAddWater: (liters: number) => void;
}

export const HydrationCard = ({ settings, onUpdate, onAddWater }: HydrationCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentMl = Math.round(settings.currentIntake * 1000);
  const goalMl = Math.round(settings.dailyGoalLiters * 1000);
  const remainingMl = Math.max(0, goalMl - currentMl);
  const percentage = Math.min(currentMl / goalMl * 100, 100);

  // Circle parameters matching Nutrition's MacroRings style
  const size = 144; // w-36 h-36
  const cx = size / 2;
  const cy = size / 2;
  const r = 64;
  const circumference = 2 * Math.PI * r; // ~402
  const filledDash = (percentage / 100) * circumference;

  return (
    <div>
      {/* Settings gear - top right */}
      <div className="flex justify-end mb-1">
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings2 className="w-4 h-4 text-gray-400" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Configurar Hidratação</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-medium">Ativar lembretes</span>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(enabled) => onUpdate({ enabled })}
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Intervalo</span>
                  <span className="text-sm font-medium">{settings.intervalMinutes} min</span>
                </div>
                <Slider
                  value={[settings.intervalMinutes]}
                  onValueChange={([v]) => onUpdate({ intervalMinutes: v })}
                  min={15}
                  max={60}
                  step={5}
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Meta diária</span>
                  <span className="text-sm font-medium">{settings.dailyGoalLiters}L</span>
                </div>
                <Slider
                  value={[settings.dailyGoalLiters]}
                  onValueChange={([v]) => onUpdate({ dailyGoalLiters: v })}
                  min={1}
                  max={5}
                  step={0.5}
                />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Circular progress - floating, no card */}
      <div className="flex items-center justify-center gap-6">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90">
            {/* Background circle */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-muted/20"
            />
            {/* Filled circle */}
            <motion.circle
              cx={cx}
              cy={cy}
              r={r}
              stroke="hsl(195, 100%, 50%)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: '0 402' }}
              animate={{ strokeDasharray: `${filledDash} ${circumference}` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Droplets className="w-5 h-5 text-cyan-400 mb-0.5" />
            <motion.span
              key={currentMl}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-white"
            >
              {currentMl}
            </motion.span>
            <span className="text-xs text-gray-400">/{goalMl} ml</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-center">
            <p className="text-sm text-gray-400">Restante</p>
            <p className="text-3xl font-bold text-white">
              {remainingMl}
            </p>
            <p className="text-xs text-gray-400">ml</p>
          </div>
        </div>
      </div>

      {/* Water control buttons */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onAddWater(-0.3)}
          className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 font-medium text-sm hover:bg-white/10 transition-colors"
        >
          <span className="flex items-center gap-1">
            <Minus className="w-3.5 h-3.5" />
            300 ml
          </span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onAddWater(0.3)}
          className="px-5 py-2 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-semibold text-sm hover:bg-cyan-500/25 transition-colors"
        >
          <span className="flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            300 ml
          </span>
        </motion.button>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-center gap-6 mt-5">
        <div className="text-center flex-1 border-r border-gray-700/50 pr-4">
          <p className="text-lg font-bold text-white">{currentMl} / {goalMl} ml</p>
          <p className="text-xs text-gray-400">Alvo de bebida diária</p>
        </div>
        <div className="text-center flex-1 pl-4">
          <p className="text-lg font-bold text-white">
            Restante <span className="text-cyan-400">{remainingMl} ml</span>
          </p>
        </div>
      </div>
    </div>
  );
};
