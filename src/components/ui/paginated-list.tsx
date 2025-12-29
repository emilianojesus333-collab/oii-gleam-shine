import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface PaginatedListProps<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
  showRefreshButton?: boolean;
}

export function PaginatedList<T>({
  data,
  loading,
  error,
  hasMore,
  loadMore,
  refresh,
  renderItem,
  emptyMessage = 'Nenhum item encontrado',
  className = '',
  showRefreshButton = true,
}: PaginatedListProps<T>) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={refresh} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
        {showRefreshButton && (
          <Button variant="ghost" onClick={refresh} size="sm" className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {showRefreshButton && data.length > 0 && (
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      )}
      
      <div className="space-y-2">
        {data.map((item, index) => (
          <React.Fragment key={index}>
            {renderItem(item, index)}
          </React.Fragment>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {!loading && hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={loadMore} size="sm">
            Carregar mais
          </Button>
        </div>
      )}
    </div>
  );
}
