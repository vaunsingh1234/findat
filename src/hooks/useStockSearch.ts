import { useState, useCallback } from 'react';
import { stockService } from '../services/stockService';
import type { Stock } from '../types/portfolio';

export const useStockSearch = () => {
  const [results, setResults] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const stocks = await stockService.searchStocks(trimmed);
      setResults(stocks);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, search };
};

