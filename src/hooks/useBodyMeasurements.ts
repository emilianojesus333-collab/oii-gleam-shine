import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { invalidateCachePattern } from './useDataCache';

export interface BodyMeasurement {
  id: string;
  date: string;
  weight: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  bicepsLeft?: number;
  bicepsRight?: number;
  thighLeft?: number;
  thighRight?: number;
  calfLeft?: number;
  calfRight?: number;
  neck?: number;
  shoulders?: number;
  notes?: string;
}

interface MeasurementsState {
  measurements: BodyMeasurement[];
  goals: {
    targetWeight?: number;
    targetBodyFat?: number;
    targetWaist?: number;
  };
  loading: boolean;
  synced: boolean;
}

const STORAGE_KEY = 'liftmate_body_measurements';
const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

const localCache = new Map<string, CacheEntry>();

const getCached = <T>(key: string): T | null => {
  const entry = localCache.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data as T;
  }
  localCache.delete(key);
  return null;
};

const setCache = <T>(key: string, data: T): void => {
  localCache.set(key, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_TTL,
  });
};

export const useBodyMeasurements = () => {
  const { user } = useAuth();
  const [state, setState] = useState<MeasurementsState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...parsed, loading: false, synced: false };
      } catch {
        return { measurements: [], goals: {}, loading: false, synced: false };
      }
    }
    return { measurements: [], goals: {}, loading: false, synced: false };
  });

  const syncInProgressRef = useRef(false);

  // Sync with Supabase
  useEffect(() => {
    if (!user || syncInProgressRef.current) return;

    const syncWithSupabase = async () => {
      syncInProgressRef.current = true;
      setState(prev => ({ ...prev, loading: true }));

      try {
        const cacheKey = `measurements_${user.id}`;
        const cached = getCached<BodyMeasurement[]>(cacheKey);

        if (cached) {
          setState(prev => ({
            ...prev,
            measurements: cached,
            loading: false,
            synced: true,
          }));
          return;
        }

        const { data, error } = await supabase
          .from('body_measurements')
          .select('*')
          .order('date', { ascending: false })
          .limit(100);

        if (error) throw error;

        const formatted: BodyMeasurement[] = (data || []).map(m => ({
          id: m.id,
          date: m.date,
          weight: m.weight || 0,
          bodyFat: m.body_fat || undefined,
          chest: m.chest || undefined,
          waist: m.waist || undefined,
          hips: m.hips || undefined,
          bicepsLeft: m.arms || undefined,
          thighLeft: m.thighs || undefined,
          notes: m.notes || undefined,
        }));

        setCache(cacheKey, formatted);

        setState(prev => ({
          ...prev,
          measurements: formatted,
          loading: false,
          synced: true,
        }));
      } catch (error) {
        console.error('Error syncing measurements:', error);
        setState(prev => ({ ...prev, loading: false }));
      } finally {
        syncInProgressRef.current = false;
      }
    };

    syncWithSupabase();
  }, [user]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addMeasurement = useCallback(async (measurement: Omit<BodyMeasurement, 'id'>) => {
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

    if (user) {
      try {
        const { data, error } = await supabase
          .from('body_measurements')
          .insert({
            user_id: user.id,
            date: measurement.date,
            weight: measurement.weight,
            body_fat: measurement.bodyFat,
            chest: measurement.chest,
            waist: measurement.waist,
            hips: measurement.hips,
            arms: measurement.bicepsLeft,
            thighs: measurement.thighLeft,
            notes: measurement.notes,
          })
          .select()
          .single();

        if (error) throw error;

        // Update with real ID
        setState(prev => ({
          ...prev,
          measurements: prev.measurements.map(m =>
            m.id === newMeasurement.id ? { ...m, id: data.id } : m
          ),
        }));

        invalidateCachePattern(`measurements_${user.id}`);
        localCache.delete(`measurements_${user.id}`);
      } catch (error) {
        console.error('Error saving measurement:', error);
      }
    }
  }, [user]);

  const updateMeasurement = useCallback(async (id: string, updates: Partial<BodyMeasurement>) => {
    setState(prev => ({
      ...prev,
      measurements: prev.measurements.map(m =>
        m.id === id ? { ...m, ...updates } : m
      ),
    }));

    if (user) {
      try {
        await supabase
          .from('body_measurements')
          .update({
            weight: updates.weight,
            body_fat: updates.bodyFat,
            chest: updates.chest,
            waist: updates.waist,
            hips: updates.hips,
            arms: updates.bicepsLeft,
            thighs: updates.thighLeft,
            notes: updates.notes,
          })
          .eq('id', id);

        invalidateCachePattern(`measurements_${user.id}`);
        localCache.delete(`measurements_${user.id}`);
      } catch (error) {
        console.error('Error updating measurement:', error);
      }
    }
  }, [user]);

  const deleteMeasurement = useCallback(async (id: string) => {
    setState(prev => ({
      ...prev,
      measurements: prev.measurements.filter(m => m.id !== id),
    }));

    if (user) {
      try {
        await supabase.from('body_measurements').delete().eq('id', id);
        invalidateCachePattern(`measurements_${user.id}`);
        localCache.delete(`measurements_${user.id}`);
      } catch (error) {
        console.error('Error deleting measurement:', error);
      }
    }
  }, [user]);

  const setGoals = useCallback((goals: MeasurementsState['goals']) => {
    setState(prev => ({ ...prev, goals: { ...prev.goals, ...goals } }));
  }, []);

  const latestMeasurement = useMemo(() => {
    return state.measurements[0] || null;
  }, [state.measurements]);

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

  const last30Days = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return state.measurements.filter(m => new Date(m.date) >= thirtyDaysAgo);
  }, [state.measurements]);

  return {
    measurements: state.measurements,
    goals: state.goals,
    loading: state.loading,
    synced: state.synced,
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
