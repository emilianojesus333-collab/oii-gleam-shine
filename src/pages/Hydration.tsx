import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Minus, Settings2, Info } from 'lucide-react';
import { HexBadge } from '@/components/ui/HexBadge';
import { BottomNav } from '@/components/BottomNav';
import { useAlerts } from '@/hooks/useAlerts';
import { formatBottleSize, HYDRATION_BOTTLE_SIZES, MAX_HYDRATION_GOAL_LITERS } from '@/lib/hydration';
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

const CYAN = '#22D3EE';
const GREEN = '#34D399';
const CIRCUMFERENCE = 2 * Math.PI * 84; // ≈ 527.8
const PT_DAY_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const QUICK_ADDS = [
  { label: '+250ml', ml: 250, primary: false },
  { label: '+500ml', ml: 500, primary: true },
  { label: '+750ml', ml: 750, primary: false },
  { label: '+1L',    ml: 1000, primary: false },
];

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.25)',
  display: 'block',
};

const MAIN_CARD: React.CSSProperties = {
  background: '#1A1A1A',
  borderRadius: 0,
  border: 'none',
  borderBottom: '1px solid #2A2A2A',
  padding: '20px 16px 18px',
  width: '100%',
};

const HISTORY_CARD: React.CSSProperties = {
  background: '#1A1A1A',
  borderRadius: 0,
  border: 'none',
  borderBottom: '1px solid #2A2A2A',
  padding: '18px 16px',
  width: '100%',
};

const Hydration = () => {
  const {
    state,
    hydrationSummary,
    weeklyHistory,
    updateHydration,
    addWaterIntake,
  } = useAlerts();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const { percentage, currentIntakeLiters, goalLiters } = hydrationSummary;

  const currentMl  = Math.round(currentIntakeLiters * 1000);
  const goalMl     = Math.round(goalLiters * 1000);
  const pct        = Math.min(100, Math.round(percentage));
  const remainMl   = Math.max(0, goalMl - currentMl);
  const goalReached = currentIntakeLiters >= goalLiters;

  const dashOffset = CIRCUMFERENCE * (1 - Math.min(1, currentIntakeLiters / goalLiters));

  const tipText = useMemo(() => {
    if (pct < 50)  return 'Estás desidratado. Bebe água agora para melhorar o desempenho.';
    if (pct < 80)  return 'Bebe mais 500ml antes do treino de hoje para melhorar a recuperação.';
    return 'Boa hidratação! Mantém este ritmo até ao fim do dia.';
  }, [pct]);

  const avgMl = useMemo(() => {
    if (!weeklyHistory.length) return 0;
    return Math.round(weeklyHistory.reduce((s, d) => s + d.intake, 0) / weeklyHistory.length * 1000);
  }, [weeklyHistory]);

  const handleGoalChange = ([value]: number[]) => {
    updateHydration({ customDailyGoalLiters: Math.min(value / 1000, MAX_HYDRATION_GOAL_LITERS) });
  };

  return (
    <div className="min-h-screen bg-black pb-28">
      {/* Header */}
      <div style={{ background: "#1A1A1A", borderBottom: "1px solid #2A2A2A", padding: "56px 16px 16px" }} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HexBadge label="H₂" />
          <Droplets className="h-5 w-5" style={{ color: CYAN }} />
          <h1 className="text-xl font-bold text-white">Hidratação</h1>
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
                  min={15} max={60} step={5}
                />
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Meta diária</span>
                  <span className="font-medium text-foreground">{goalMl} ml</span>
                </div>
                <Slider
                  value={[goalMl]}
                  onValueChange={handleGoalChange}
                  min={500} max={MAX_HYDRATION_GOAL_LITERS * 1000} step={100}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Ajusta livremente até {MAX_HYDRATION_GOAL_LITERS} L.
                </p>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-foreground">Tamanho da garrafa</p>
                <div className="grid grid-cols-4 gap-2">
                  {HYDRATION_BOTTLE_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => updateHydration({ bottleSizeMl: size })}
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

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* ── MAIN CARD ── */}
        <div style={MAIN_CARD}>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            {/* Left */}
            <div>
              <span style={{ ...SECTION_LABEL, marginBottom: 4 }}>HIDRATAÇÃO DE HOJE</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 30, fontWeight: 900, color: 'white', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {currentMl}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>ml</span>
              </div>
            </div>
            {/* Right */}
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: CYAN, letterSpacing: '-0.02em', display: 'block', lineHeight: 1 }}>
                {pct}%
              </span>
              <span style={{ fontSize: 10, color: 'rgba(34,211,238,0.5)', marginTop: 2, display: 'block' }}>
                da meta
              </span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 3, display: 'block' }}>
                Faltam <span style={{ color: 'rgba(255,255,255,0.45)' }}>{remainMl}</span> ml
              </span>
            </div>
          </div>

          {/* Ring */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ position: 'relative', width: 200, height: 200 }}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                {/* Track */}
                <circle cx="100" cy="100" r="84" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
                {/* Progress */}
                <circle
                  cx="100" cy="100" r="84"
                  fill="none"
                  stroke={goalReached ? GREEN : CYAN}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 100 100)"
                  style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s ease' }}
                />
                {/* Inner decorative ring */}
                <circle cx="100" cy="100" r="68" fill="none" stroke="rgba(34,211,238,0.06)" strokeWidth="1" />
              </svg>
              {/* Center content */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 2,
              }}>
                <Droplets size={22} color="rgba(34,211,238,0.6)" style={{ marginBottom: 4 }} />
                <span style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {currentMl}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>ml bebidos</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: CYAN, marginTop: 2 }}>{pct}% da meta</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 12,
              padding: 10,
            }}>
              <span style={{ ...SECTION_LABEL, color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>META</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: 'white' }}>{goalMl}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>ml</span>
              </div>
            </div>
            <div style={{
              flex: 1,
              background: 'rgba(34,211,238,0.08)',
              border: '1px solid rgba(34,211,238,0.15)',
              borderRadius: 12,
              padding: 10,
            }}>
              <span style={{ ...SECTION_LABEL, color: 'rgba(255,255,255,0.28)', marginBottom: 3 }}>FALTAM</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: CYAN }}>{remainMl}</span>
                <span style={{ fontSize: 10, color: 'rgba(34,211,238,0.5)' }}>ml</span>
              </div>
            </div>
          </div>

          {/* Quick add row */}
          <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
            {QUICK_ADDS.map(({ label, ml, primary }) => (
              <motion.button
                key={ml}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => addWaterIntake(ml / 1000)}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  ...(primary
                    ? { background: '#0EA5E9', color: 'white', border: 'none', boxShadow: '0 4px 14px rgba(14,165,233,0.3)' }
                    : { background: 'rgba(34,211,238,0.09)', color: CYAN, border: '1px solid rgba(34,211,238,0.18)' }),
                }}
              >
                {label}
              </motion.button>
            ))}
          </div>

          {/* Action buttons row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={() => addWaterIntake(-0.1)}
              disabled={currentIntakeLiters <= 0}
              style={{
                width: 52,
                height: 52,
                flexShrink: 0,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: currentIntakeLiters <= 0 ? 0.3 : 1,
              }}
            >
              <Minus size={18} color="rgba(255,255,255,0.5)" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => addWaterIntake(0.2)}
              style={{
                flex: 1,
                padding: 15,
                borderRadius: 14,
                background: '#0EA5E9',
                color: 'white',
                boxShadow: '0 4px 16px rgba(14,165,233,0.35)',
                fontSize: 14,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Droplets size={18} />
              Adicionar água
            </motion.button>
          </div>
        </div>

        {/* ── TIP ROW ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 16px',
          background: 'rgba(34,211,238,0.07)',
          borderBottom: '1px solid #2A2A2A',
        }}>
          <Info size={14} color={CYAN} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'rgba(34,211,238,0.75)', fontWeight: 500 }}>
            {tipText}
          </span>
        </div>

        {/* ── 7 DAYS HISTORY CARD ── */}
        <div style={HISTORY_CARD}>
          <span style={{ ...SECTION_LABEL, marginBottom: 14 }}>ÚLTIMOS 7 DIAS</span>

          {/* Bar chart */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 60, marginBottom: 6 }}>
            {weeklyHistory.map((day, i) => {
              const isToday = i === weeklyHistory.length - 1;
              const fillH = Math.min(52, Math.round((day.intake / goalLiters) * 52));
              const fillColor = day.metGoal ? GREEN : CYAN;
              return (
                <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: 52 }}>
                  <div style={{ width: 8, height: 52, borderRadius: 4, background: 'rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden' }}>
                    <motion.div
                      animate={{ height: fillH }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: isToday ? (goalReached ? GREEN : CYAN) : fillColor,
                        borderRadius: 4,
                        height: fillH,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Day labels */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {weeklyHistory.map((day, i) => {
              const isToday = i === weeklyHistory.length - 1;
              const label = PT_DAY_SHORT[new Date(day.date).getDay()];
              return (
                <div key={day.date} style={{ flex: 1, textAlign: 'center' }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: isToday ? 800 : 600,
                    color: isToday ? CYAN : 'rgba(255,255,255,0.22)',
                  }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>
              Média: {avgMl} ml/dia
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
              <div style={{ width: 7, height: 7, borderRadius: 2, background: GREEN }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>Meta atingida</span>
            </div>
          </div>
        </div>

      </div>

      <BottomNav />
    </div>
  );
};

export default Hydration;
