import { useState, useEffect, useCallback, useMemo } from 'react';

export interface ProgressPhoto {
  id: string;
  date: string;
  imageBase64: string;
  pose: 'front' | 'side' | 'back';
  weight?: number;
  notes?: string;
  aiAnalysis?: {
    analyzedAt: string;
    observations: string[];
    improvements?: string[];
  };
}

interface ProgressPhotosState {
  photos: ProgressPhoto[];
}

const STORAGE_KEY = 'liftmate_progress_photos';

export const useProgressPhotos = () => {
  const [state, setState] = useState<ProgressPhotosState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { photos: [] };
      }
    }
    return { photos: [] };
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addPhoto = useCallback((photo: Omit<ProgressPhoto, 'id'>) => {
    const newPhoto: ProgressPhoto = {
      ...photo,
      id: Date.now().toString(),
    };
    setState(prev => ({
      photos: [...prev.photos, newPhoto].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    }));
    return newPhoto.id;
  }, []);

  const updatePhoto = useCallback((id: string, updates: Partial<ProgressPhoto>) => {
    setState(prev => ({
      photos: prev.photos.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, []);

  const deletePhoto = useCallback((id: string) => {
    setState(prev => ({
      photos: prev.photos.filter(p => p.id !== id),
    }));
  }, []);

  // Get photos by pose
  const getPhotosByPose = useCallback((pose: ProgressPhoto['pose']) => {
    return state.photos.filter(p => p.pose === pose);
  }, [state.photos]);

  // Get comparison pairs (oldest vs latest for each pose)
  const comparisonPairs = useMemo(() => {
    const poses: ProgressPhoto['pose'][] = ['front', 'side', 'back'];
    return poses.map(pose => {
      const posePhotos = state.photos
        .filter(p => p.pose === pose)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (posePhotos.length < 2) return null;
      
      return {
        pose,
        before: posePhotos[0],
        after: posePhotos[posePhotos.length - 1],
        daysBetween: Math.round(
          (new Date(posePhotos[posePhotos.length - 1].date).getTime() - 
           new Date(posePhotos[0].date).getTime()) / (1000 * 60 * 60 * 24)
        ),
      };
    }).filter(Boolean);
  }, [state.photos]);

  // Get latest photo of each pose
  const latestPhotos = useMemo(() => {
    const poses: ProgressPhoto['pose'][] = ['front', 'side', 'back'];
    return poses.reduce((acc, pose) => {
      const posePhotos = state.photos.filter(p => p.pose === pose);
      if (posePhotos.length > 0) {
        acc[pose] = posePhotos[0]; // Already sorted by date desc
      }
      return acc;
    }, {} as Record<ProgressPhoto['pose'], ProgressPhoto | undefined>);
  }, [state.photos]);

  // Check if user should take photos (monthly reminder)
  const shouldTakePhotos = useMemo(() => {
    if (state.photos.length === 0) return true;
    
    const latestDate = new Date(state.photos[0].date);
    const daysSinceLastPhoto = Math.round(
      (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceLastPhoto >= 30;
  }, [state.photos]);

  return {
    photos: state.photos,
    latestPhotos,
    comparisonPairs,
    shouldTakePhotos,
    addPhoto,
    updatePhoto,
    deletePhoto,
    getPhotosByPose,
  };
};
