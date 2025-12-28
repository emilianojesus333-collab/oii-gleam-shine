import { motion } from 'framer-motion';
import { Settings2, Target, Scale, Ruler, Calendar, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useState } from 'react';
import { UserProfile, MacroGoals } from '@/hooks/useNutrition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from '@/components/ui/drawer';

interface ProfileSetupProps {
  profile: UserProfile;
  goals: MacroGoals;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onSetGoals: (goals: Partial<MacroGoals>) => void;
}

const activityLabels = {
  sedentary: 'Sedentário',
  light: 'Leve',
  moderate: 'Moderado',
  active: 'Ativo',
  very_active: 'Muito Ativo',
};

const goalLabels = {
  cut: 'Cutting',
  maintain: 'Manter',
  bulk: 'Bulking',
};

const goalIcons = {
  cut: TrendingDown,
  maintain: Minus,
  bulk: TrendingUp,
};

export const ProfileSetup = ({ profile, goals, onUpdateProfile, onSetGoals }: ProfileSetupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);
  const [customGoals, setCustomGoals] = useState(goals);
  const [useCustomGoals, setUseCustomGoals] = useState(false);

  const handleSave = () => {
    onUpdateProfile(localProfile);
    if (useCustomGoals) {
      onSetGoals(customGoals);
    }
    setIsOpen(false);
  };

  const activityLevels: UserProfile['activityLevel'][] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
  const goalTypes: UserProfile['goal'][] = ['cut', 'maintain', 'bulk'];

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Settings2 className="w-5 h-5" />
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Configurar Perfil & Metas
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6 overflow-y-auto">
          {/* Basic info */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Dados Físicos
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Peso (kg)</label>
                <Input
                  type="number"
                  value={localProfile.weight}
                  onChange={(e) => setLocalProfile(p => ({ ...p, weight: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Altura (cm)</label>
                <Input
                  type="number"
                  value={localProfile.height}
                  onChange={(e) => setLocalProfile(p => ({ ...p, height: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Idade</label>
                <Input
                  type="number"
                  value={localProfile.age}
                  onChange={(e) => setLocalProfile(p => ({ ...p, age: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Género</label>
                <div className="flex gap-2">
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setLocalProfile(p => ({ ...p, gender: g }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        localProfile.gender === g
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      {g === 'male' ? '♂ Masc' : '♀ Fem'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activity level */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Nível de Atividade
            </h4>
            <div className="flex flex-wrap gap-2">
              {activityLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => setLocalProfile(p => ({ ...p, activityLevel: level }))}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    localProfile.activityLevel === level
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {activityLabels[level]}
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Objetivo
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {goalTypes.map((goal) => {
                const Icon = goalIcons[goal];
                return (
                  <button
                    key={goal}
                    onClick={() => setLocalProfile(p => ({ ...p, goal }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                      localProfile.goal === goal
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{goalLabels[goal]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calculated goals preview */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
            <h4 className="font-medium mb-3">Metas Calculadas</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Calorias:</span>
                <span className="ml-2 font-semibold">{goals.calories} kcal</span>
              </div>
              <div>
                <span className="text-muted-foreground">Proteína:</span>
                <span className="ml-2 font-semibold">{goals.protein}g</span>
              </div>
              <div>
                <span className="text-muted-foreground">Carbs:</span>
                <span className="ml-2 font-semibold">{goals.carbs}g</span>
              </div>
              <div>
                <span className="text-muted-foreground">Gordura:</span>
                <span className="ml-2 font-semibold">{goals.fat}g</span>
              </div>
            </div>
          </div>

          {/* Custom goals toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Metas Personalizadas</h4>
              <button
                onClick={() => setUseCustomGoals(!useCustomGoals)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  useCustomGoals
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                {useCustomGoals ? 'Ativo' : 'Usar calculado'}
              </button>
            </div>

            {useCustomGoals && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Calorias</span>
                    <span className="font-medium">{customGoals.calories} kcal</span>
                  </div>
                  <Slider
                    value={[customGoals.calories]}
                    onValueChange={([v]) => setCustomGoals(g => ({ ...g, calories: v }))}
                    min={1200}
                    max={5000}
                    step={50}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Proteína</span>
                    <span className="font-medium">{customGoals.protein}g</span>
                  </div>
                  <Slider
                    value={[customGoals.protein]}
                    onValueChange={([v]) => setCustomGoals(g => ({ ...g, protein: v }))}
                    min={50}
                    max={400}
                    step={5}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <DrawerFooter>
          <Button onClick={handleSave} className="w-full">
            Guardar Alterações
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
