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
  sedentary: 'Sedentary',
  light: 'Light',
  moderate: 'Moderate',
  active: 'Active',
  very_active: 'Very Active',
};

const goalLabels = {
  cut: 'Cutting',
  maintain: 'Maintain',
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

      <DrawerContent className="max-h-[85vh] bg-zinc-900 border-white/10">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2 text-white">
            <Target className="w-5 h-5" />
            Configure Profile & Goals
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6 overflow-y-auto">
          {/* Basic info */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-white">
              <Scale className="w-4 h-4" />
              Physical Data
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Weight (kg)</label>
                <Input
                  type="number"
                  value={localProfile.weight}
                  onChange={(e) => setLocalProfile(p => ({ ...p, weight: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Height (cm)</label>
                <Input
                  type="number"
                  value={localProfile.height}
                  onChange={(e) => setLocalProfile(p => ({ ...p, height: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Age</label>
                <Input
                  type="number"
                  value={localProfile.age}
                  onChange={(e) => setLocalProfile(p => ({ ...p, age: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Gender</label>
                <div className="flex gap-2">
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setLocalProfile(p => ({ ...p, gender: g }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        localProfile.gender === g
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white/5 text-gray-400'
                      }`}
                    >
                      {g === 'male' ? '♂ Male' : '♀ Female'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activity level */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2 text-white">
              <Activity className="w-4 h-4" />
              Activity Level
            </h4>
            <div className="flex flex-wrap gap-2">
              {activityLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => setLocalProfile(p => ({ ...p, activityLevel: level }))}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    localProfile.activityLevel === level
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/5 text-gray-400'
                  }`}
                >
                  {activityLabels[level]}
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2 text-white">
              <Target className="w-4 h-4" />
              Goal
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
                        : 'bg-white/5 text-gray-400'
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
            <h4 className="font-medium mb-3 text-white">Calculated Goals</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Calories:</span>
                <span className="ml-2 font-semibold text-white">{goals.calories} kcal</span>
              </div>
              <div>
                <span className="text-gray-400">Protein:</span>
                <span className="ml-2 font-semibold text-white">{goals.protein}g</span>
              </div>
              <div>
                <span className="text-gray-400">Carbs:</span>
                <span className="ml-2 font-semibold text-white">{goals.carbs}g</span>
              </div>
              <div>
                <span className="text-gray-400">Fat:</span>
                <span className="ml-2 font-semibold text-white">{goals.fat}g</span>
              </div>
            </div>
          </div>

          {/* Custom goals toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white">Custom Goals</h4>
              <button
                onClick={() => setUseCustomGoals(!useCustomGoals)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  useCustomGoals
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/5 text-gray-400'
                }`}
              >
                {useCustomGoals ? 'Active' : 'Use calculated'}
              </button>
            </div>

            {useCustomGoals && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>Calories</span>
                    <span className="font-medium text-white">{customGoals.calories} kcal</span>
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
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>Protein</span>
                    <span className="font-medium text-white">{customGoals.protein}g</span>
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
            Save Changes
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
