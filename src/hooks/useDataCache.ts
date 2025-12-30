import { useCallback, useEffect, useRef, useState } from 'react';
import { registerCacheCleaner } from './cacheUtils';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh
}

const globalCache = new Map<string, CacheEntry<any>>();

// Default TTL of 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

export function useDataCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const { ttl = DEFAULT_TTL, staleWhileRevalidate = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (fetchingRef.current && !forceRefresh) return;
    
    // Check cache first
    const cached = globalCache.get(key);
    const now = Date.now();

    if (cached && !forceRefresh) {
      const isExpired = now >= cached.expiresAt;
      
      if (!isExpired) {
        // Fresh data, use it
        setData(cached.data);
        setLoading(false);
        setIsStale(false);
        return;
      }
      
      if (staleWhileRevalidate) {
        // Stale but usable, show it and refetch in background
        setData(cached.data);
        setLoading(false);
        setIsStale(true);
      }
    }

    fetchingRef.current = true;
    
    try {
      if (!cached || !staleWhileRevalidate) {
        setLoading(true);
      }
      setError(null);
      
      const freshData = await fetcher();
      
      // Update cache
      globalCache.set(key, {
        data: freshData,
        timestamp: now,
        expiresAt: now + ttl,
      });
      
      setData(freshData);
      setIsStale(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [key, fetcher, ttl, staleWhileRevalidate]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    globalCache.delete(key);
    setData(null);
    setIsStale(false);
  }, [key]);

  useEffect(() => {
    fetchData();
  }, [key]);

  return {
    data,
    loading,
    error,
    isStale,
    refresh,
    invalidate,
  };
}

// Utility functions for cache management
export function invalidateCache(key: string) {
  globalCache.delete(key);
}

export function invalidateCachePattern(pattern: string) {
  for (const key of globalCache.keys()) {
    if (key.includes(pattern)) {
      globalCache.delete(key);
    }
  }
}

export function clearAllCache() {
  console.log('[useDataCache] Clearing all cache, entries:', globalCache.size);
  globalCache.clear();
}

// Register the cache cleaner globally
registerCacheCleaner(() => globalCache.clear());

// Clear cache for a specific user (used on logout)
export function clearUserCache(userId: string) {
  for (const key of globalCache.keys()) {
    if (key.includes(userId)) {
      globalCache.delete(key);
    }
  }
}

export function getCacheStats() {
  const entries = Array.from(globalCache.entries());
  const now = Date.now();
  
  return {
    totalEntries: entries.length,
    staleEntries: entries.filter(([_, v]) => now >= v.expiresAt).length,
    freshEntries: entries.filter(([_, v]) => now < v.expiresAt).length,
    keys: entries.map(([k]) => k),
  };
}

// Prefetch utility for anticipated data needs
export async function prefetchData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
) {
  if (globalCache.has(key)) {
    const cached = globalCache.get(key)!;
    if (Date.now() < cached.expiresAt) {
      return; // Already fresh, no need to prefetch
    }
  }

  try {
    const data = await fetcher();
    const now = Date.now();
    globalCache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  } catch (error) {
    console.error('Prefetch failed for key:', key, error);
  }
}
