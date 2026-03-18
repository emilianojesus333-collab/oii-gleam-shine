import { motion } from 'framer-motion';
import { Droplets, Settings2, Plus, Minus, Activity } from 'lucide-react';
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
import { formatBottleSize, formatLiters, type HydrationSummary } from '@/lib/hydration';

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

  const progressWidth = `${Math.min(hydrationSummary.percentage, 100)}%`;

  return (
    <div className="rounded-[28px] border border-border/40 bg-card/70 p-5 backdrop-blur-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Hidratação diária
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-black text-foreground">
              {formatLiters(hydrationSummary.currentIntakeLiters)} L
            </span>
            <span className="pb-1 text-sm text-muted-foreground">
              / {formatLiters(hydrationSummary.goalLiters)} L
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Meta base {formatLiters(hydrationSummary.baseGoalLiters)} L
            {hydrationSummary.bonusLiters > 0 && ` + ${formatLiters(hydrationSummary.bonusLiters)} L pelo treino`}
          </p>
        </div>

        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-border/50">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Configurar Hidratação</DrawerTitle>
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

              <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">Garrafa ativa</p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {formatBottleSize(hydrationSummary.bottleSizeMl)}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  O tamanho da garrafa é definido nas Definições do perfil e o registo usa passos rápidos de 100 ml.
                </p>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-muted/30">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: progressWidth }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="order-2 md:order-1">
          <div className="relative mx-auto h-[280px] w-[150px]">
            <div className="absolute left-1/2 top-0 h-6 w-14 -translate-x-1/2 rounded-t-2xl border border-border/60 bg-card" />
            <div className="absolute inset-x-0 bottom-0 top-4 overflow-hidden rounded-[40px] border border-border/60 bg-background/40 p-2 shadow-[inset_0_1px_0_hsl(var(--background)/0.8)]">
              <motion.div
                className="absolute inset-x-2 bottom-2 rounded-[32px] bg-primary/80"
                animate={{ height: `${hydrationSummary.bottleFillPercentage}%` }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
              <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border/50 bg-background/70 backdrop-blur-sm">
                  <Droplets className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">
                    {hydrationSummary.bottleRemainingMl}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    ml restantes
                  </p>
                </div>
                <p className="max-w-[110px] text-xs leading-relaxed text-muted-foreground">
                  {formatBottleSize(hydrationSummary.bottleSizeMl)} pronta para o próximo registo.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 space-y-4 md:order-2">
          <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Recuperação & hidratação</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {hydrationSummary.message}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Velocidade atual de recuperação: {hydrationSummary.recoveryRatePerHour}% por hora.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onAddWater(-0.1)}
              disabled={hydrationSummary.currentIntakeLiters <= 0}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border/50 bg-muted/20 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/30 disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
              − ajustar
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onAddWater(0.1)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_14px_30px_-18px_hsl(var(--primary)/0.9)] transition-opacity hover:opacity-95"
            >
              <Plus className="h-4 w-4" />
              + beber
            </motion.button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/40 bg-background/40 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Na garrafa</p>
              <p className="mt-2 text-lg font-bold text-foreground">
                {hydrationSummary.bottleConsumedMl} ml
              </p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-background/40 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Hoje</p>
              <p className="mt-2 text-lg font-bold text-foreground">
                {Math.round(hydrationSummary.percentage)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
