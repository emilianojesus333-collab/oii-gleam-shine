import { motion } from 'framer-motion';
import { Droplets, Plus, Minus, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { HydrationSettings } from '@/hooks/useAlerts';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger } from
'@/components/ui/drawer';
import { Slider } from '@/components/ui/slider';

interface HydrationCardProps {
  settings: HydrationSettings;
  onUpdate: (updates: Partial<HydrationSettings>) => void;
  onAddWater: (liters: number) => void;
}

export const HydrationCard = ({ settings, onUpdate, onAddWater }: HydrationCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const percentage = Math.min(settings.currentIntake / settings.dailyGoalLiters * 100, 100);

  const waterLevels = [0.25, 0.5, 0.75, 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-5 border bg-[#0d0d11] border-[#0d0d11]">

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Droplets className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Hidratação</h3>
            <p className="text-xs text-gray-400">
              A cada {settings.intervalMinutes} min
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
                <DrawerTitle>Configurar Hidratação</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Ativar lembretes</span>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(enabled) => onUpdate({ enabled })} />

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
                    step={5} />

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
                    step={0.5} />

                </div>
              </div>
            </DrawerContent>
          </Drawer>
          
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => onUpdate({ enabled })} />

        </div>
      </div>

      {/* Progress Circle */}
      <div className="flex items-center gap-6 mb-4">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="42"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-blue-500/20" />

            <motion.circle
              cx="48"
              cy="48"
              r="42"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className="text-blue-400"
              initial={{ strokeDasharray: '0 264' }}
              animate={{ strokeDasharray: `${percentage * 2.64} 264` }}
              transition={{ duration: 0.5 }} />

          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-white">
              {settings.currentIntake.toFixed(1)}L
            </span>
            <span className="text-[10px] text-gray-400">
              /{settings.dailyGoalLiters}L
            </span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-2">
          {waterLevels.map((amount) =>
          <motion.button
            key={amount}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAddWater(amount)}
            className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 transition-colors border border-blue-500/20">

              <Plus className="w-3 h-3 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">{amount}L</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Quick reset */}
      {settings.currentIntake > 0 &&
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onUpdate({ currentIntake: Math.max(0, settings.currentIntake - 0.25) })}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-400 hover:text-white transition-colors">

          <Minus className="w-4 h-4" />
          Remover 0.25L
        </motion.button>
      }
    </motion.div>);

};