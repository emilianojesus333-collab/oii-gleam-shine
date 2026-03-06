import { motion } from 'framer-motion';
import { Droplets, Settings2 } from 'lucide-react';
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

  const currentMl = Math.round(settings.currentIntake * 1000);
  const goalMl = Math.round(settings.dailyGoalLiters * 1000);
  const remainingMl = Math.max(0, goalMl - currentMl);
  const percentage = Math.min(currentMl / goalMl * 100, 100);

  // Arc parameters - semicircle arc at top
  const cx = 120;
  const cy = 120;
  const r = 100;
  const startAngle = -210; // degrees from 3 o'clock
  const endAngle = 30;
  const totalAngle = endAngle - startAngle; // 240 degrees
  const circumference = totalAngle / 360 * 2 * Math.PI * r;
  const filledLength = percentage / 100 * circumference;

  const polarToCartesian = (angle: number) => {
    const rad = angle * Math.PI / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  };

  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const largeArc = totalAngle > 180 ? 1 : 0;

  const bgArcPath = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 border-cyan-500/10 bg-[#0d1117] border-0">
      
      {/* Settings gear */}
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
      </div>

      {/* Arc progress */}
      <div className="flex flex-col items-center">
        <div className="relative w-[240px] h-[160px]">
          <svg width="240" height="160" viewBox="0 0 240 160" className="overflow-visible">
            {/* Glow filter */}
            <defs>
              <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            {/* Background arc */}
            <path
              d={bgArcPath}
              fill="none"
              stroke="hsl(200, 80%, 30%)"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.25" />
            
            
            {/* Filled arc */}
            <motion.path
              d={bgArcPath}
              fill="none"
              stroke="hsl(195, 100%, 60%)"
              strokeWidth="10"
              strokeLinecap="round"
              filter="url(#arcGlow)"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - filledLength }}
              transition={{ duration: 0.8, ease: 'easeOut' }} />
            
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
            <span className="text-4xl font-bold text-white">{currentMl} ml</span>
            <span className="text-sm text-gray-400 mt-1">{currentMl} ml</span>
          </div>
        </div>

        {/* +300 ml button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onAddWater(0.3)}
          className="mt-2 px-8 py-2.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-semibold text-sm hover:bg-cyan-500/25 transition-colors shadow-lg shadow-cyan-500/10">
          
          +300 ml
        </motion.button>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-6 mt-5 w-full">
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
    </motion.div>);

};