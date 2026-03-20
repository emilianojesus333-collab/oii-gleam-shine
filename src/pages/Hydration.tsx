import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Plus, Minus, Settings2, Target } from 'lucide-react';
import { useState, useMemo } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { useAlerts } from '@/hooks/useAlerts';
import { formatLiters, formatBottleSize, HYDRATION_BOTTLE_SIZES } from '@/lib/hydration';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const statusConfig = {
  low: { label: 'Baixo', color: 'text-destructive', ring: 'ring-destructive/30', bg: 'bg-destructive/10' },
  adequate: { label: 'Ok', color: 'text-chart-3', ring: 'ring-chart-3/30', bg: 'bg-chart-3/10' },
  optimal: { label: 'Ótimo', color: 'text-primary', ring: 'ring-primary/30', bg: 'bg-primary/10' },
} as const;

const impactMessages = {
  low: 'Recuperação muscular mais lenta. Bebe mais água.',
  adequate: 'Recuperação normal. Continua a hidratar-te.',
  optimal: 'Recuperação otimizada. Excelente hidratação.',
} as const;

const weekDayLabels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

function getBodyOpacity(pct: number): number {
  if (pct <= 30) return 0.25;
  if (pct <= 70) return 0.5;
  return 0.85;
}

function getBodyGlow(pct: number): string {
  if (pct >= 80) return 'drop-shadow-[0_0_24px_hsl(var(--primary)/0.5)]';
  if (pct >= 50) return 'drop-shadow-[0_0_12px_hsl(var(--primary)/0.25)]';
  return '';
}

function getWeeklyInsight(history: { metGoal: boolean; intake: number }[]): string | null {
  const metCount = history.filter((d) => d.metGoal).length;
  const yesterdayMet = history.length >= 2 ? history[history.length - 2]?.metGoal : null;

  if (metCount >= 6) return 'Excelente consistência esta semana.';
  if (metCount >= 4) return 'Boa consistência esta semana.';
  if (yesterdayMet === false) return 'Ontem ficaste abaixo da meta.';
  if (metCount <= 2) return 'Tenta melhorar a consistência esta semana.';
  return null;
}

const Hydration = () => {
  const {
    state,
    hydrationSummary,
    weeklyHistory,
    updateHydration,
    addWaterIntake,
  } = useAlerts();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const { status, percentage, currentIntakeLiters, goalLiters, recoveryRatePerHour } = hydrationSummary;
  const config = statusConfig[status];
  const fillPct = Math.min(percentage, 100);
  const goalReached = currentIntakeLiters >= goalLiters;
  const remainingMl = Math.max(0, Math.round((goalLiters - currentIntakeLiters) * 1000));

  const weeklyInsight = useMemo(() => getWeeklyInsight(weeklyHistory), [weeklyHistory]);

  const handleAdd = () => {
    if (goalReached) {
      toast.info('Meta atingida. Ajusta a meta nas definições se precisares de mais.');
      return;
    }
    addWaterIntake(0.1);
  };

  const handleBottleSizeChange = (sizeMl: number) => {
    updateHydration({ bottleSizeMl: sizeMl });
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-6 pb-2 pt-14">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Droplets className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Hidratação</h1>
          </div>
          <Drawer open={settingsOpen} onOpenChange={setSettingsOpen}>
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
                  <span className="font-medium text-foreground">Lembretes</span>
                  <Switch
                    checked={state.hydration.enabled}
                    onCheckedChange={(enabled) => updateHydration({ enabled })}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Intervalo</span>
                    <span className="font-medium text-foreground">{state.hydration.intervalMinutes} min</span>
                  </div>
                  <Slider
                    value={[state.hydration.intervalMinutes]}
                    onValueChange={([v]) => updateHydration({ intervalMinutes: v })}
                    min={15}
                    max={60}
                    step={5}
                  />
                </div>
                <div>
                  <p className="mb-3 text-sm font-medium text-foreground">Tamanho da garrafa</p>
                  <div className="grid grid-cols-4 gap-2">
                    {HYDRATION_BOTTLE_SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => handleBottleSizeChange(size)}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                          state.hydration.bottleSizeMl === size
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border/50 text-muted-foreground hover:bg-muted/30'
                        }`}
                      >
                        {formatBottleSize(size)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Main content */}
      <div className="px-6 pt-4">

        {/* Body silhouette with dynamic hydration visual */}
        <div className="relative mx-auto flex h-[340px] w-full max-w-[300px] items-center justify-center">
          {/* Human body silhouette */}
          <motion.svg
            viewBox="0 0 200 400"
            className={`h-[300px] w-auto ${getBodyGlow(fillPct)}`}
            animate={{ opacity: getBodyOpacity(fillPct) }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Simplified human silhouette */}
            <defs>
              <linearGradient id="bodyFill" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
                <motion.stop
                  offset="100%"
                  stopColor="hsl(var(--primary))"
                  animate={{ stopOpacity: fillPct > 80 ? 0.7 : 0.15 }}
                  transition={{ duration: 0.8 }}
                />
              </linearGradient>
              <clipPath id="bodyClip">
                <path d="M100,10 C115,10 125,25 125,40 C125,55 115,65 100,65 C85,65 75,55 75,40 C75,25 85,10 100,10 Z M70,72 L60,75 L35,95 L30,105 L35,110 L55,100 L65,90 L65,160 L55,250 L50,330 L55,340 L70,340 L80,260 L100,210 L120,260 L130,340 L145,340 L150,330 L145,250 L135,160 L135,90 L145,100 L165,110 L170,105 L165,95 L140,75 L130,72 Z" />
              </clipPath>
            </defs>
            {/* Body outline */}
            <path
              d="M100,10 C115,10 125,25 125,40 C125,55 115,65 100,65 C85,65 75,55 75,40 C75,25 85,10 100,10 Z M70,72 L60,75 L35,95 L30,105 L35,110 L55,100 L65,90 L65,160 L55,250 L50,330 L55,340 L70,340 L80,260 L100,210 L120,260 L130,340 L145,340 L150,330 L145,250 L135,160 L135,90 L145,100 L165,110 L170,105 L165,95 L140,75 L130,72 Z"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              strokeOpacity="0.3"
            />
            {/* Fill level inside body */}
            <g clipPath="url(#bodyClip)">
              <rect x="0" y="0" width="200" height="400" fill="hsl(var(--primary))" fillOpacity="0.08" />
              <motion.rect
                x="0"
                width="200"
                height="400"
                fill="url(#bodyFill)"
                animate={{ y: 400 - (400 * fillPct) / 100 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </g>
          </motion.svg>

          {/* Intake display overlaid */}
          <div className="absolute inset-0 flex flex-col items-end justify-between py-2 pr-1">
            {/* Top — goal */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-primary tabular-nums">
                {Math.round(goalLiters * 1000)} ml
              </span>
              <Target className="h-3.5 w-3.5 text-primary" />
            </div>

            {/* Middle — current percentage */}
            <span className="text-sm font-bold text-primary/70 tabular-nums">
              {Math.round(fillPct)}%
            </span>

            {/* Bottom — 0% */}
            <span className="text-xs text-muted-foreground tabular-nums">0%</span>
          </div>
        </div>

        {/* Current intake prominent display */}
        <div className="mt-2 flex flex-col items-center gap-1">
          <motion.span
            key={currentIntakeLiters}
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-black tracking-tight text-foreground tabular-nums"
          >
            {Math.round(currentIntakeLiters * 1000)} ml
          </motion.span>

          <AnimatePresence mode="wait">
            {goalReached ? (
              <motion.span
                key="done"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary"
              >
                Meta concluída
              </motion.span>
            ) : (
              <motion.span
                key="remaining"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                Faltam {remainingMl} ml
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="mx-auto mt-6 flex max-w-xs gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => addWaterIntake(-0.1)}
            disabled={currentIntakeLiters <= 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border/50 bg-muted/10 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/20 disabled:opacity-30"
          >
            <Minus className="h-4 w-4" />
            Ajustar
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleAdd}
            disabled={goalReached}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all ${
              goalReached
                ? 'bg-primary/20 text-primary/60'
                : 'bg-primary text-primary-foreground shadow-[0_12px_28px_-12px_hsl(var(--primary)/0.7)] hover:opacity-95'
            }`}
          >
            <Plus className="h-4 w-4" />
            {goalReached ? 'Meta atingida' : '+ 100 ml'}
          </motion.button>
        </div>

        {/* Impact on recovery */}
        <div className="mt-8">
          <p className={`text-center text-sm leading-relaxed ${config.color}`}>
            {impactMessages[status]}
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Recuperação: {recoveryRatePerHour}%/h
          </p>
        </div>

        {/* Weekly consistency */}
        <div className="mt-10">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Últimos 7 dias
          </p>
          <div className="flex items-center justify-between gap-1">
            {weeklyHistory.map((day, i) => {
              const dayOfWeek = new Date(day.date).getDay();
              const label = weekDayLabels[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
              const isToday = i === weeklyHistory.length - 1;

              return (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${day.date}-${day.metGoal}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                        day.metGoal
                          ? 'bg-primary/20'
                          : day.intake > 0
                            ? 'bg-muted/30'
                            : 'bg-transparent'
                      } ${isToday ? 'ring-2 ring-primary/40' : ''}`}
                    >
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          day.metGoal
                            ? 'bg-primary'
                            : day.intake > 0
                              ? 'bg-muted-foreground/40'
                              : 'bg-muted/20'
                        }`}
                      />
                    </motion.div>
                  </AnimatePresence>
                  <span className={`text-[10px] ${isToday ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly insight */}
        {weeklyInsight && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-center text-xs text-muted-foreground"
          >
            {weeklyInsight}
          </motion.p>
        )}

        {/* Workout intensity context */}
        {hydrationSummary.bonusLiters > 0 && (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            +{formatLiters(hydrationSummary.bonusLiters)} L adicionado pela atividade de hoje
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Hydration;
