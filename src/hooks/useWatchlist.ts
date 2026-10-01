import { useState, useEffect, useCallback } from 'react';
import { watchlistService, type WatchlistItem } from '../services/watchlistService';
import { useAuth } from './useAuth';

export const useWatchlist = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await watchlistService.getWatchlist(user?.id);
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchWatchlist();

    const handleWatchlistChange = () => {
      fetchWatchlist();
    };

    window.addEventListener('findat_watchlist_changed', handleWatchlistChange);
    return () => {
      window.removeEventListener('findat_watchlist_changed', handleWatchlistChange);
    };
  }, [fetchWatchlist]);

  const add = async (symbol: string, companyName?: string, exchange?: string) => {
    const res = await watchlistService.addToWatchlist(user?.id, symbol, companyName, exchange);
    await fetchWatchlist();
    return res;
  };

  const remove = async (symbol: string) => {
    const res = await watchlistService.removeFromWatchlist(user?.id, symbol);
    await fetchWatchlist();
    return res;
  };

  const has = (symbol: string) => {
    const upper = symbol.trim().toUpperCase();
    return items.some((i) => i.symbol.toUpperCase() === upper);
  };

  return {
    items,
    loading,
    error,
    refetch: fetchWatchlist,
    add,
    remove,
    has,
  };
};
