import { motion } from 'framer-motion';
import { Droplets, Minus, Plus } from 'lucide-react';
import { HydrationSettings } from '@/hooks/useAlerts';
import { type HydrationSummary } from '@/lib/hydration';

interface HydrationCardProps {
  settings: HydrationSettings;
  hydrationSummary: HydrationSummary;
  onUpdate: (updates: Partial<HydrationSettings>) => void;
  onAddWater: (liters: number) => void;
}

export const HydrationCard = ({
  settings,
  hydrationSummary,
  onUpdate: _onUpdate,
  onAddWater,
}: HydrationCardProps) => {
  const bottleHeight = `${Math.max(hydrationSummary.bottleFillPercentage, 0)}%`;

  return (
    <div className="rounded-[28px] border border-border/40 bg-card/70 p-6 backdrop-blur-sm">
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-8">
        <div className="relative h-[210px] w-[110px]">
          <div className="absolute left-1/2 top-0 h-5 w-12 -translate-x-1/2 rounded-t-2xl border border-border/60 bg-card" />
          <div className="absolute inset-x-0 bottom-0 top-3 overflow-hidden rounded-[34px] border border-border/60 bg-background/40 p-2 shadow-[inset_0_1px_0_hsl(var(--background)/0.8)]">
            <motion.div
              className="absolute inset-x-2 bottom-2 rounded-[26px] bg-primary/80"
              animate={{ height: bottleHeight }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
            <div className="relative z-10 flex h-full items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border/50 bg-background/70 backdrop-blur-sm">
                <Droplets className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => onAddWater(-0.1)}
            disabled={hydrationSummary.currentIntakeLiters <= 0}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-border/50 bg-muted/20 text-foreground transition-colors hover:bg-muted/30 disabled:opacity-40"
            aria-label="Ajustar hidratação"
          >
            <Minus className="h-5 w-5" />
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => onAddWater(0.1)}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_14px_30px_-18px_hsl(var(--primary)/0.9)] transition-opacity hover:opacity-95"
            aria-label="Beber água"
          >
            <Plus className="h-6 w-6" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
