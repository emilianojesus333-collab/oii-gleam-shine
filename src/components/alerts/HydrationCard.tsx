import { motion } from 'framer-motion';
import { Droplets, Settings2, Plus, Minus } from 'lucide-react';
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
import { formatLiters, type HydrationSummary } from '@/lib/hydration';

interface HydrationCardProps {
  settings: HydrationSettings;
  hydrationSummary: HydrationSummary;
  onUpdate: (updates: Partial<HydrationSettings>) => void;
  onAddWater: (liters: number) => void;
}

export const HydrationCard = ({
  settings,
  hydrationSummary,
  onUpdate,
  onAddWater,
}: HydrationCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const hydrationPercentage = Math.max(0, Math.min(100, Math.round(hydrationSummary.percentage)));
  const hydrationStateLabel =
    hydrationPercentage < 50
      ? 'Baixa hidratação'
      : hydrationPercentage < 80
        ? 'Hidratação adequada'
        : 'Hidratação ideal';

  return (
    <div className="relative rounded-[24px] border border-border/40 bg-card/70 p-4 backdrop-blur-sm">
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-8 w-8 rounded-full border border-border/50"
          >
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Configurar hidratação</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-6 p-4 pb-8">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Ativar lembretes</span>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(enabled) => onUpdate({ enabled })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Intervalo</span>
                <span className="font-medium text-foreground">{settings.intervalMinutes} min</span>
              </div>
              <Slider
                value={[settings.intervalMinutes]}
                onValueChange={([value]) => onUpdate({ intervalMinutes: value })}
                min={15}
                max={60}
                step={5}
              />
            </div>

            <div className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm text-muted-foreground">
              Meta atual: <span className="font-medium text-foreground">{formatLiters(hydrationSummary.goalLiters)} L</span>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <div className="flex flex-col items-center justify-center text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Hidratação
        </p>

        <div className="flex min-h-[116px] flex-col items-center justify-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-background/50">
            <Droplets className="h-5 w-5 text-primary" />
          </div>
          <p className="text-4xl font-black leading-none text-foreground">{hydrationPercentage}%</p>
          <p className="mt-2 max-w-[200px] truncate text-sm text-muted-foreground">
            {hydrationStateLabel}
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {formatLiters(hydrationSummary.currentIntakeLiters)} / {formatLiters(hydrationSummary.goalLiters)} L
          </p>
        </div>

        <div className="mt-2 grid w-full grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onAddWater(-0.1)}
            disabled={hydrationSummary.currentIntakeLiters <= 0}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border/50 bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/30 disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
            − ajustar
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onAddWater(0.1)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_14px_30px_-18px_hsl(var(--primary)/0.9)] transition-opacity hover:opacity-95"
          >
            <Plus className="h-4 w-4" />
            + beber
          </motion.button>
        </div>
      </div>
    </div>
  );
};
