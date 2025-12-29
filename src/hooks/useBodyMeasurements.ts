import { useState, useEffect, useCallback, useMemo } from 'react';

export interface BodyMeasurement {
  id: string;
  date: string;
  weight: number; // kg
  bodyFat?: number; // percentage
  chest?: number; // cm
  waist?: number; // cm
  hips?: number; // cm
  bicepsLeft?: number; // cm
  bicepsRight?: number; // cm
  thighLeft?: number; // cm
  thighRight?: number; // cm
  calfLeft?: number; // cm
  calfRight?: number; // cm
  neck?: number; // cm
  shoulders?: number; // cm
  notes?: string;
}

interface MeasurementsState {
  measurements: BodyMeasurement[];
  goals: {
    targetWeight?: number;
    targetBodyFat?: number;
    targetWaist?: number;
  };
}

const STORAGE_KEY = 'liftmate_body_measurements';

export const useBodyMeasurements = () => {
  const [state, setState] = useState<MeasurementsState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { measurements: [], goals: {} };
      }
    }
    return { measurements: [], goals: {} };
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addMeasurement = useCallback((measurement: Omit<BodyMeasurement, 'id'>) => {
    const newMeasurement: BodyMeasurement = {
      ...measurement,
      id: Date.now().toString(),
    };
    setState(prev => ({
      ...prev,
      measurements: [...prev.measurements, newMeasurement].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    }));
  }, []);

  const updateMeasurement = useCallback((id: string, updates: Partial<BodyMeasurement>) => {
    setState(prev => ({
      ...prev,
      measurements: prev.measurements.map(m => 
        m.id === id ? { ...m, ...updates } : m
      ),
    }));
  }, []);

  const deleteMeasurement = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      measurements: prev.measurements.filter(m => m.id !== id),
    }));
  }, []);

  const setGoals = useCallback((goals: MeasurementsState['goals']) => {
    setState(prev => ({ ...prev, goals: { ...prev.goals, ...goals } }));
  }, []);

  // Get latest measurement
  const latestMeasurement = useMemo(() => {
    return state.measurements[0] || null;
  }, [state.measurements]);

  // Get progress data for charts
  const progressData = useMemo(() => {
    const sorted = [...state.measurements].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return sorted.map(m => ({
      date: m.date,
      weight: m.weight,
      bodyFat: m.bodyFat,
      waist: m.waist,
      chest: m.chest,
    }));
  }, [state.measurements]);

  // Calculate changes
  const changes = useMemo(() => {
    if (state.measurements.length < 2) return null;
    
    const sorted = [...state.measurements].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    return {
      weight: last.weight - first.weight,
      bodyFat: first.bodyFat && last.bodyFat ? last.bodyFat - first.bodyFat : null,
      waist: first.waist && last.waist ? last.waist - first.waist : null,
      chest: first.chest && last.chest ? last.chest - first.chest : null,
      daysBetween: Math.round((new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24)),
    };
  }, [state.measurements]);

  // Get measurements for last 30 days
  const last30Days = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return state.measurements.filter(m => new Date(m.date) >= thirtyDaysAgo);
  }, [state.measurements]);

  return {
    measurements: state.measurements,
    goals: state.goals,
    latestMeasurement,
    progressData,
    changes,
    last30Days,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
    setGoals,
  };
};
