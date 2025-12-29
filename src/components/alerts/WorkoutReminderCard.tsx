import { motion } from 'framer-motion';
import { Dumbbell, Settings2, MessageSquare, Clock } from 'lucide-react';
import { useState } from 'react';
import { WorkoutReminder } from '@/hooks/useAlerts';
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

interface WorkoutReminderCardProps {
  settings: WorkoutReminder;
  onUpdate: (updates: Partial<WorkoutReminder>) => void;
}

const motivationalQuotes = [
  "A dor de hoje é a vitória de amanhã! 💪",
  "Cada repetição conta. Bora treinar!",
  "O único treino mau é o que não fizeste!",
  "Levanta, treina, repete. 🔥",
];

export const WorkoutReminderCard = ({ settings, onUpdate }: WorkoutReminderCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-5 border border-amber-500/20"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Lembrete de Treino</h3>
            <p className="text-xs text-gray-400">
              {settings.minutesBefore}min antes do treino
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
                <DrawerTitle>Configurar Lembrete</DrawerTitle>
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
                    <span className="text-sm text-muted-foreground">Avisar antes</span>
                    <span className="text-sm font-medium">{settings.minutesBefore} min</span>
                  </div>
                  <Slider
                    value={[settings.minutesBefore]}
                    onValueChange={([v]) => onUpdate({ minutesBefore: v })}
                    min={15}
                    max={120}
                    step={15}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Mensagem motivacional</span>
                  </div>
                  <Switch
                    checked={settings.motivationalMessage}
                    onCheckedChange={(motivationalMessage) => onUpdate({ motivationalMessage })}
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

      {/* Preview notification */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-4 rounded-xl bg-white/5 border border-white/10"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm text-white">Hora de Treinar!</span>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>agora</span>
              </div>
            </div>
            {settings.motivationalMessage && (
              <p className="text-xs text-gray-400 line-clamp-2">
                {randomQuote}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Pré-visualização da notificação
      </p>
    </motion.div>
  );
};
