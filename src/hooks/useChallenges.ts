import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';

export interface Challenge {
  id: string;
  type: 'protein' | 'workouts' | 'water' | 'calories' | 'streak' | 'sleep' | 'custom';
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  startDate: string;
  endDate: string;
  completed: boolean;
  completedAt?: string;
  icon: string;
  color: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface ChallengesState {
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
  badges: Badge[];
  weeklyStreak: number;
  totalChallengesCompleted: number;
}

const STORAGE_KEY_PREFIX = 'liftmate_challenges_';

const defaultState: ChallengesState = {
  activeChallenges: [],
  completedChallenges: [],
  badges: [],
  weeklyStreak: 0,
  totalChallengesCompleted: 0,
};

// Weekly challenge templates
const weeklyTemplates: Omit<Challenge, 'id' | 'startDate' | 'endDate' | 'current' | 'completed'>[] = [
  {
    type: 'protein',
    title: 'Mestre da Proteína',
    description: 'Atinge a meta de proteína 5 dias esta semana',
    target: 5,
    unit: 'dias',
    icon: '💪',
    color: 'hsl(0, 84%, 60%)',
  },
  {
    type: 'workouts',
    title: 'Guerreiro do Ferro',
    description: 'Completa 4 treinos esta semana',
    target: 4,
    unit: 'treinos',
    icon: '🏋️',
    color: 'hsl(217, 91%, 60%)',
  },
  {
    type: 'water',
    title: 'Hidratação Perfeita',
    description: 'Bebe 3L de água todos os dias (7 dias)',
    target: 7,
    unit: 'dias',
    icon: '💧',
    color: 'hsl(199, 89%, 48%)',
  },
  {
    type: 'calories',
    title: 'Precisão Nutricional',
    description: 'Fica dentro da meta calórica 6 dias',
    target: 6,
    unit: 'dias',
    icon: '🎯',
    color: 'hsl(142, 71%, 45%)',
  },
  {
    type: 'streak',
    title: 'Consistência é Tudo',
    description: 'Mantém um streak de 7 dias de treino',
    target: 7,
    unit: 'dias',
    icon: '🔥',
    color: 'hsl(25, 95%, 53%)',
  },
  {
    type: 'sleep',
    title: 'Recuperação Máxima',
    description: 'Dorme 7+ horas durante 5 noites',
    target: 5,
    unit: 'noites',
    icon: '😴',
    color: 'hsl(271, 76%, 53%)',
  },
];

// Badge definitions
const badgeDefinitions: Omit<Badge, 'id' | 'unlockedAt'>[] = [
  { name: 'Primeiro Desafio', description: 'Completaste o teu primeiro desafio', icon: '🏅', rarity: 'common' },
  { name: 'Semana Perfeita', description: 'Completaste todos os desafios da semana', icon: '👑', rarity: 'epic' },
  { name: '10 Desafios', description: 'Completaste 10 desafios', icon: '🎖️', rarity: 'rare' },
  { name: 'Mestre da Disciplina', description: 'Completaste 25 desafios', icon: '🏆', rarity: 'epic' },
  { name: 'Lenda do Fitness', description: 'Completaste 50 desafios', icon: '⭐', rarity: 'legendary' },
  { name: 'Streak de Fogo', description: 'Mantiveste um streak de 14 dias', icon: '🔥', rarity: 'rare' },
  { name: 'Atleta de Elite', description: 'Streak de 30 dias', icon: '💎', rarity: 'legendary' },
];

export const useChallenges = () => {
  const { user } = useAuth();
  const [state, setState] = useState<ChallengesState>(defaultState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user-specific data when user changes
  useEffect(() => {
    if (!user?.id) {
      setState(defaultState);
      setIsInitialized(false);
      return;
    }

    const storageKey = `${STORAGE_KEY_PREFIX}${user.id}`;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch {
        setState(defaultState);
      }
    } else {
      setState(defaultState);
    }
    setIsInitialized(true);
  }, [user?.id]);

  // Persist state when it changes
  useEffect(() => {
    if (!user?.id || !isInitialized) return;
    const storageKey = `${STORAGE_KEY_PREFIX}${user.id}`;
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, user?.id, isInitialized]);

  // Generate weekly challenges if needed
  const generateWeeklyChallenges = useCallback(() => {
    if (!user?.id || !isInitialized) return;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const startDate = monday.toISOString().split('T')[0];
    const endDate = sunday.toISOString().split('T')[0];

    // Check if we already have challenges for this week
    const hasCurrentWeekChallenges = state.activeChallenges.some(c => c.startDate === startDate);
    if (hasCurrentWeekChallenges) return;

    // Move old challenges to completed if expired
    const expiredChallenges = state.activeChallenges.filter(c => new Date(c.endDate) < now);
    const stillActive = state.activeChallenges.filter(c => new Date(c.endDate) >= now);

    // Pick 3 random challenges for the week
    const shuffled = [...weeklyTemplates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);

    const newChallenges: Challenge[] = selected.map((template, index) => ({
      ...template,
      id: `${startDate}-${index}`,
      startDate,
      endDate,
      current: 0,
      completed: false,
    }));

    setState(prev => ({
      ...prev,
      activeChallenges: [...stillActive, ...newChallenges],
      completedChallenges: [...prev.completedChallenges, ...expiredChallenges],
    }));
  }, [state.activeChallenges, user?.id, isInitialized]);

  // Initialize challenges on mount
  useEffect(() => {
    if (isInitialized) {
      generateWeeklyChallenges();
    }
  }, [isInitialized]);

  // Update challenge progress
  const updateChallengeProgress = useCallback((type: Challenge['type'], increment: number = 1) => {
    setState(prev => {
      const newBadges: Badge[] = [];
      let newTotalCompleted = prev.totalChallengesCompleted;

      const updatedChallenges = prev.activeChallenges.map(challenge => {
        if (challenge.type !== type || challenge.completed) return challenge;
        
        const newCurrent = Math.min(challenge.current + increment, challenge.target);
        const isNowCompleted = newCurrent >= challenge.target;

        if (isNowCompleted && !challenge.completed) {
          newTotalCompleted++;

          // Check for badges
          if (newTotalCompleted === 1 && !prev.badges.find(b => b.name === 'Primeiro Desafio')) {
            const badge = badgeDefinitions.find(b => b.name === 'Primeiro Desafio')!;
            newBadges.push({ ...badge, id: Date.now().toString(), unlockedAt: new Date().toISOString() });
          }
          if (newTotalCompleted === 10 && !prev.badges.find(b => b.name === '10 Desafios')) {
            const badge = badgeDefinitions.find(b => b.name === '10 Desafios')!;
            newBadges.push({ ...badge, id: Date.now().toString() + '1', unlockedAt: new Date().toISOString() });
          }
          if (newTotalCompleted === 25 && !prev.badges.find(b => b.name === 'Mestre da Disciplina')) {
            const badge = badgeDefinitions.find(b => b.name === 'Mestre da Disciplina')!;
            newBadges.push({ ...badge, id: Date.now().toString() + '2', unlockedAt: new Date().toISOString() });
          }
          if (newTotalCompleted === 50 && !prev.badges.find(b => b.name === 'Lenda do Fitness')) {
            const badge = badgeDefinitions.find(b => b.name === 'Lenda do Fitness')!;
            newBadges.push({ ...badge, id: Date.now().toString() + '3', unlockedAt: new Date().toISOString() });
          }
        }

        return {
          ...challenge,
          current: newCurrent,
          completed: isNowCompleted,
          completedAt: isNowCompleted ? new Date().toISOString() : undefined,
        };
      });

      // Check if all weekly challenges are complete
      const allComplete = updatedChallenges.filter(c => !c.completed).length === 0 && updatedChallenges.length > 0;
      if (allComplete && !prev.badges.find(b => b.name === 'Semana Perfeita')) {
        const badge = badgeDefinitions.find(b => b.name === 'Semana Perfeita')!;
        newBadges.push({ ...badge, id: Date.now().toString() + '4', unlockedAt: new Date().toISOString() });
      }

      return {
        ...prev,
        activeChallenges: updatedChallenges,
        badges: [...prev.badges, ...newBadges],
        totalChallengesCompleted: newTotalCompleted,
      };
    });
  }, []);

  // Check streak for badge
  const checkStreakBadge = useCallback((streakDays: number) => {
    setState(prev => {
      const newBadges: Badge[] = [];

      if (streakDays >= 14 && !prev.badges.find(b => b.name === 'Streak de Fogo')) {
        const badge = badgeDefinitions.find(b => b.name === 'Streak de Fogo')!;
        newBadges.push({ ...badge, id: Date.now().toString(), unlockedAt: new Date().toISOString() });
      }
      if (streakDays >= 30 && !prev.badges.find(b => b.name === 'Atleta de Elite')) {
        const badge = badgeDefinitions.find(b => b.name === 'Atleta de Elite')!;
        newBadges.push({ ...badge, id: Date.now().toString() + '1', unlockedAt: new Date().toISOString() });
      }

      if (newBadges.length === 0) return prev;

      return {
        ...prev,
        badges: [...prev.badges, ...newBadges],
      };
    });
  }, []);

  // Get weekly progress
  const weeklyProgress = useMemo(() => {
    const total = state.activeChallenges.length;
    const completed = state.activeChallenges.filter(c => c.completed).length;
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [state.activeChallenges]);

  return {
    activeChallenges: state.activeChallenges,
    completedChallenges: state.completedChallenges,
    badges: state.badges,
    totalChallengesCompleted: state.totalChallengesCompleted,
    weeklyProgress,
    updateChallengeProgress,
    checkStreakBadge,
    generateWeeklyChallenges,
  };
};
