import { useState, useEffect, useCallback } from 'react';
import { stockService } from '../services/stockService';
import type { StockDetail } from '../types/market';

export const useStockDetail = (symbol: string | undefined, range: string = '1Y') => {
  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const data = await stockService.getStockDetail(symbol, range);
      if (!data) {
        setError(`Security '${symbol}' could not be resolved in the Indian stock master.`);
      } else {
        setDetail(data);
        setError(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock detail');
    } finally {
      setLoading(false);
    }
  }, [symbol, range]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { detail, loading, error, refetch: fetchDetail };
};

