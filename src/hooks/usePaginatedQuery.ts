import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { registerCacheCleaner } from './cacheUtils';

interface PaginatedQueryOptions<T> {
  table: 'nutrition_logs' | 'workout_sessions' | 'body_measurements' | 'one_rm_records' | 'conversations' | 'messages';
  pageSize?: number;
  orderBy?: string;
  orderAscending?: boolean;
  filters?: Record<string, any>;
  cacheKey?: string;
  cacheTTL?: number; // in milliseconds
}

interface PaginatedQueryResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  totalCount: number;
  currentPage: number;
}

// Simple in-memory cache - keyed by user_id for isolation
const cache = new Map<string, { data: unknown[]; timestamp: number; totalCount: number }>();

// Clear all cache (called on logout)
export const clearPaginatedQueryCache = () => {
  console.log('[usePaginatedQuery] Clearing cache, entries:', cache.size);
  cache.clear();
};

// Register cache cleaner globally
registerCacheCleaner(() => cache.clear());

export function usePaginatedQuery<T>({
  table,
  pageSize = 20,
  orderBy = 'created_at',
  orderAscending = false,
  filters = {},
  cacheKey,
  cacheTTL = 5 * 60 * 1000, // 5 minutes default
}: PaginatedQueryOptions<T>): PaginatedQueryResult<T> {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const isFetchingRef = useRef(false);

  // Include user_id in cache key for isolation
  const getCacheKey = useCallback(() => {
    const userId = user?.id || 'anonymous';
    return cacheKey 
      ? `${userId}_${cacheKey}` 
      : `${userId}_${table}_${JSON.stringify(filters)}_${orderBy}_${orderAscending}`;
  }, [table, filters, orderBy, orderAscending, cacheKey, user?.id]);

  const fetchPage = useCallback(async (page: number, append: boolean = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    try {
      setLoading(true);
      setError(null);

      const from = page * pageSize;
      const to = from + pageSize - 1;

      // Check cache for first page
      if (page === 0 && !append) {
        const key = getCacheKey();
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < cacheTTL) {
          setData(cached.data as T[]);
          setTotalCount(cached.totalCount);
          setHasMore(cached.data.length >= pageSize);
          setLoading(false);
          isFetchingRef.current = false;
          return;
        }
      }

      const { data: fetchedData, error: fetchError, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .order(orderBy, { ascending: orderAscending })
        .range(from, to);

      if (fetchError) {
        throw fetchError;
      }

      const newData = fetchedData || [];
      
      if (append) {
        setData(prev => [...prev, ...(newData as T[])]);
      } else {
        setData(newData as T[]);
        // Cache first page
        const key = getCacheKey();
        cache.set(key, {
          data: newData,
          timestamp: Date.now(),
          totalCount: count || 0,
        });
      }

      setTotalCount(count || 0);
      setHasMore(newData.length === pageSize);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [table, pageSize, orderBy, orderAscending, filters, getCacheKey, cacheTTL]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchPage(currentPage + 1, true);
  }, [hasMore, loading, currentPage, fetchPage]);

  const refresh = useCallback(async () => {
    // Clear cache for this query
    const key = getCacheKey();
    cache.delete(key);
    setData([]);
    setCurrentPage(0);
    await fetchPage(0, false);
  }, [getCacheKey, fetchPage]);

  useEffect(() => {
    fetchPage(0, false);
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalCount,
    currentPage,
  };
}

// Utility to clear all cache
export function clearQueryCache() {
  cache.clear();
}

// Utility to clear specific cache
export function clearCacheForTable(table: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(table)) {
      cache.delete(key);
    }
  }
}
