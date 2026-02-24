import { motion } from 'framer-motion';
import { Pill, FlaskConical, Plus, Trash2, Clock } from 'lucide-react';
import { useState } from 'react';
import { SupplementReminder } from '@/hooks/useAlerts';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter } from
'@/components/ui/drawer';
import { Input } from '@/components/ui/input';

interface SupplementsCardProps {
  supplements: SupplementReminder[];
  onUpdate: (id: string, updates: Partial<SupplementReminder>) => void;
  onAdd: (supplement: Omit<SupplementReminder, 'id'>) => void;
  onRemove: (id: string) => void;
}

const iconMap = {
  pill: Pill,
  shake: FlaskConical,
  powder: FlaskConical,
  capsule: Pill
};

const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const SupplementsCard = ({ supplements, onUpdate, onAdd, onRemove }: SupplementsCardProps) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTime, setNewTime] = useState('09:00');

  const handleAdd = () => {
    if (!newName.trim()) return;

    onAdd({
      name: newName,
      time: newTime,
      enabled: true,
      days: [0, 1, 2, 3, 4, 5, 6],
      icon: 'pill',
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    });

    setNewName('');
    setNewTime('09:00');
    setIsAddOpen(false);
  };

  const toggleDay = (id: string, day: number, currentDays: number[]) => {
    const newDays = currentDays.includes(day) ?
    currentDays.filter((d) => d !== day) :
    [...currentDays, day].sort();
    onUpdate(id, { days: newDays });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-5 border border-[#0d0d11] bg-stone-950">

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Pill className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Suplementação</h3>
            <p className="text-xs text-gray-400">
              {supplements.filter((s) => s.enabled).length} lembretes ativos
            </p>
          </div>
        </div>

        <Drawer open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="w-5 h-5 text-purple-400" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Novo Suplemento</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Nome</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Omega 3, BCAA..." />

              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Horário</label>
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)} />

              </div>
            </div>
            <DrawerFooter>
              <Button onClick={handleAdd} className="w-full">
                Adicionar Suplemento
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="space-y-3">
        {supplements.map((supplement, index) => {
          const Icon = iconMap[supplement.icon];

          return (
            <motion.div
              key={supplement.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-3 rounded-xl border transition-all ${
              supplement.enabled ?
              'bg-white/5 border-white/10' :
              'bg-black/20 border-transparent opacity-60'}`
              }>

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${supplement.color}20` }}>

                  <Icon className="w-5 h-5" style={{ color: supplement.color }} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-white truncate">{supplement.name}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {supplement.time}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={supplement.enabled}
                    onCheckedChange={(enabled) => onUpdate(supplement.id, { enabled })} />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400/70 hover:text-red-400"
                    onClick={() => onRemove(supplement.id)}>

                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Day selector */}
              <div className="flex gap-1 mt-3">
                {dayLabels.map((label, dayIndex) =>
                <button
                  key={dayIndex}
                  onClick={() => toggleDay(supplement.id, dayIndex, supplement.days)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  supplement.days.includes(dayIndex) ?
                  'bg-primary text-primary-foreground' :
                  'bg-white/5 text-gray-400 hover:bg-white/10'}`
                  }>

                    {label}
                  </button>
                )}
              </div>
            </motion.div>);

        })}

        {supplements.length === 0 &&
        <div className="text-center py-6 text-gray-400">
            <Pill className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum suplemento configurado</p>
          </div>
        }
      </div>
    </motion.div>);

};