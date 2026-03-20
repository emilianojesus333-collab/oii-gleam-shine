import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Plus, Minus, Settings2 } from 'lucide-react';
import { useState } from 'react';
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

      {/* Main content — continuous flow, no cards */}
      <div className="px-6 pt-6">
        {/* Bottle visual + progress */}
        <div className="flex flex-col items-center">
          {/* Circular progress */}
          <div className="relative flex h-56 w-56 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 224 224">
              <circle
                cx="112"
                cy="112"
                r="100"
                fill="none"
                strokeWidth="8"
                className="stroke-muted/20"
              />
              <motion.circle
                cx="112"
                cy="112"
                r="100"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className="stroke-primary"
                strokeDasharray={628}
                animate={{ strokeDashoffset: 628 - (628 * fillPct) / 100 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </svg>
            <div className="flex flex-col items-center gap-1">
              <motion.span
                key={currentIntakeLiters}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-black tracking-tight text-foreground"
              >
                {formatLiters(currentIntakeLiters)}
              </motion.span>
              <span className="text-sm text-muted-foreground">
                / {formatLiters(goalLiters)} L
              </span>
              <span className={`mt-1 rounded-full px-3 py-0.5 text-xs font-semibold ${config.bg} ${config.color}`}>
                {config.label}
              </span>
            </div>
          </div>

          {/* Percentage */}
          <p className="mt-4 text-center text-sm tabular-nums text-muted-foreground">
            {Math.round(percentage)}% da meta diária
          </p>
        </div>

        {/* Action buttons */}
        <div className="mx-auto mt-8 flex max-w-xs gap-3">
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
            onClick={() => addWaterIntake(0.1)}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_28px_-12px_hsl(var(--primary)/0.7)] transition-opacity hover:opacity-95"
          >
            <Plus className="h-4 w-4" />
            + 100 ml
          </motion.button>
        </div>

        {/* Impact on recovery */}
        <div className="mt-10">
          <p className={`text-center text-sm leading-relaxed ${config.color}`}>
            {impactMessages[status]}
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Recuperação atual: {recoveryRatePerHour}% por hora
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

        {/* Workout intensity context */}
        {hydrationSummary.bonusLiters > 0 && (
          <p className="mt-8 text-center text-xs text-muted-foreground">
            +{formatLiters(hydrationSummary.bonusLiters)} L adicionado pela atividade de hoje
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Hydration;
