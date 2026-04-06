import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, Plus, TrendingDown, TrendingUp, Minus, 
  Calendar, ChevronRight, Ruler, X, Check
} from 'lucide-react';
import { useBodyMeasurements, BodyMeasurement } from '@/hooks/useBodyMeasurements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface BodyMeasurementsCardProps {
  onNavigate?: () => void;
}

export const BodyMeasurementsCard = ({ onNavigate }: BodyMeasurementsCardProps) => {
  const { latestMeasurement, changes, progressData } = useBodyMeasurements();
  const [showAddSheet, setShowAddSheet] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Scale className="w-4 h-4 text-purple-400" />
            </div>
            <span className="font-semibold text-sm">Medidas Corporais</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddSheet(true)}
            className="h-8 w-8 p-0 hover:bg-purple-500/20"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {latestMeasurement ? (
          <>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center p-2 rounded-lg bg-black/20">
                <p className="text-lg font-bold">{latestMeasurement.weight}kg</p>
                <p className="text-xs text-muted-foreground">Peso</p>
              </div>
              {latestMeasurement.bodyFat && (
                <div className="text-center p-2 rounded-lg bg-black/20">
                  <p className="text-lg font-bold">{latestMeasurement.bodyFat}%</p>
                  <p className="text-xs text-muted-foreground">Gordura</p>
                </div>
              )}
              {latestMeasurement.waist && (
                <div className="text-center p-2 rounded-lg bg-black/20">
                  <p className="text-lg font-bold">{latestMeasurement.waist}cm</p>
                  <p className="text-xs text-muted-foreground">Cintura</p>
                </div>
              )}
            </div>

            {changes && (
              <div className="flex items-center gap-2 text-xs">
                {changes.weight !== 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                    changes.weight < 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {changes.weight < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    <span>{Math.abs(changes.weight).toFixed(1)}kg</span>
                  </div>
                )}
                <span className="text-muted-foreground">em {changes.daysBetween} dias</span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">Nenhuma medida registada</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddSheet(true)}
              className="border-purple-500/30 hover:bg-purple-500/10"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar medida
            </Button>
          </div>
        )}

        {onNavigate && latestMeasurement && (
          <button 
            onClick={onNavigate}
            className="flex items-center justify-center w-full mt-3 text-xs text-purple-400 hover:text-purple-300"
          >
            Ver histórico completo
            <ChevronRight className="w-3 h-3 ml-1" />
          </button>
        )}
      </motion.div>

      <AddMeasurementSheet open={showAddSheet} onOpenChange={setShowAddSheet} />
    </>
  );
};

interface AddMeasurementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddMeasurementSheet = ({ open, onOpenChange }: AddMeasurementSheetProps) => {
  const { addMeasurement } = useBodyMeasurements();
  const [formData, setFormData] = useState({
    weight: '',
    bodyFat: '',
    chest: '',
    waist: '',
    hips: '',
    bicepsLeft: '',
    bicepsRight: '',
    thighLeft: '',
    thighRight: '',
    notes: '',
  });

  const handleSubmit = () => {
    if (!formData.weight) {
      toast.error('O peso é obrigatório');
      return;
    }

    addMeasurement({
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(formData.weight),
      bodyFat: formData.bodyFat ? parseFloat(formData.bodyFat) : undefined,
      chest: formData.chest ? parseFloat(formData.chest) : undefined,
      waist: formData.waist ? parseFloat(formData.waist) : undefined,
      hips: formData.hips ? parseFloat(formData.hips) : undefined,
      bicepsLeft: formData.bicepsLeft ? parseFloat(formData.bicepsLeft) : undefined,
      bicepsRight: formData.bicepsRight ? parseFloat(formData.bicepsRight) : undefined,
      thighLeft: formData.thighLeft ? parseFloat(formData.thighLeft) : undefined,
      thighRight: formData.thighRight ? parseFloat(formData.thighRight) : undefined,
      notes: formData.notes || undefined,
    });

    toast.success('Medidas registadas com sucesso!');
    setFormData({
      weight: '',
      bodyFat: '',
      chest: '',
      waist: '',
      hips: '',
      bicepsLeft: '',
      bicepsRight: '',
      thighLeft: '',
      thighRight: '',
      notes: '',
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] bg-zinc-900 border-white/10">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-purple-400" />
            Registar Medidas
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto max-h-[60vh] pb-4">
          {/* Essential measurements */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Peso (kg) *</label>
              <Input
                type="number"
                placeholder="75.5"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                className="bg-black/30 border-white/10"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">% Gordura</label>
              <Input
                type="number"
                placeholder="15"
                value={formData.bodyFat}
                onChange={(e) => setFormData(prev => ({ ...prev, bodyFat: e.target.value }))}
                className="bg-black/30 border-white/10"
              />
            </div>
          </div>

          {/* Body measurements */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Peito (cm)</label>
              <Input
                type="number"
                placeholder="100"
                value={formData.chest}
                onChange={(e) => setFormData(prev => ({ ...prev, chest: e.target.value }))}
                className="bg-black/30 border-white/10"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cintura (cm)</label>
              <Input
                type="number"
                placeholder="80"
                value={formData.waist}
                onChange={(e) => setFormData(prev => ({ ...prev, waist: e.target.value }))}
                className="bg-black/30 border-white/10"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Anca (cm)</label>
              <Input
                type="number"
                placeholder="95"
                value={formData.hips}
                onChange={(e) => setFormData(prev => ({ ...prev, hips: e.target.value }))}
                className="bg-black/30 border-white/10"
              />
            </div>
          </div>

          {/* Arms */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Bíceps Esq. (cm)</label>
              <Input
                type="number"
                placeholder="35"
                value={formData.bicepsLeft}
                onChange={(e) => setFormData(prev => ({ ...prev, bicepsLeft: e.target.value }))}
                className="bg-black/30 border-white/10"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Bíceps Dir. (cm)</label>
              <Input
                type="number"
                placeholder="35"
                value={formData.bicepsRight}
                onChange={(e) => setFormData(prev => ({ ...prev, bicepsRight: e.target.value }))}
                className="bg-black/30 border-white/10"
              />
            </div>
          </div>

          {/* Legs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Coxa Esq. (cm)</label>
              <Input
                type="number"
                placeholder="55"
                value={formData.thighLeft}
                onChange={(e) => setFormData(prev => ({ ...prev, thighLeft: e.target.value }))}
                className="bg-black/30 border-white/10"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Coxa Dir. (cm)</label>
              <Input
                type="number"
                placeholder="55"
                value={formData.thighRight}
                onChange={(e) => setFormData(prev => ({ ...prev, thighRight: e.target.value }))}
                className="bg-black/30 border-white/10"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSubmit} className="w-full mt-4">
          <Check className="w-4 h-4 mr-2" />
          Guardar Medidas
        </Button>
      </SheetContent>
    </Sheet>
  );
};

// Full measurements history component
export const MeasurementsHistory = () => {
  const { measurements, progressData, changes } = useBodyMeasurements();

  return (
    <div className="space-y-4">
      {/* Weight Chart */}
      {progressData.length > 1 && (
        <div className="rounded-2xl bg-card/50 border border-border/50 p-4">
          <h3 className="font-semibold mb-3">Evolução do Peso</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666"
                  fontSize={10}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis stroke="#666" fontSize={10} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-PT')}
                />
                <Line type="monotone" dataKey="weight" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Measurements list */}
      <div className="space-y-2">
        <h3 className="font-semibold">Histórico</h3>
        {measurements.map((m) => (
          <div key={m.id} className="p-3 rounded-xl bg-card/50 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {new Date(m.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="text-lg font-bold">{m.weight}kg</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {m.bodyFat && <span>Gordura: {m.bodyFat}%</span>}
              {m.waist && <span>Cintura: {m.waist}cm</span>}
              {m.chest && <span>Peito: {m.chest}cm</span>}
            </div>
          </div>
        ))}
        {measurements.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma medida registada ainda
          </p>
        )}
      </div>
    </div>
  );
};
