import { useState, useEffect, useCallback } from 'react';
import { portfolioService } from '../services/portfolioService';
import type { Portfolio, PortfolioSummary } from '../types/portfolio';

export const usePortfolios = (userId: string | undefined) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await portfolioService.getPortfolios(userId || 'guest');
      setPortfolios(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolios');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  // Listen for portfolio mutations across the app
  useEffect(() => {
    const handleChanged = () => {
      fetchPortfolios();
    };
    window.addEventListener('findat_portfolio_changed', handleChanged);
    return () => window.removeEventListener('findat_portfolio_changed', handleChanged);
  }, [fetchPortfolios]);

  return { portfolios, loading, error, refetch: fetchPortfolios };
};

export const usePortfolioSummary = (portfolioId: string | undefined, currentPrices?: Record<string, number>) => {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!portfolioId) return;
    setLoading(true);
    try {
      const data = await portfolioService.getPortfolioSummary(portfolioId, currentPrices);
      setSummary(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio summary');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, currentPrices]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    const handleChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.portfolioId || detail.portfolioId === portfolioId) {
        fetchSummary();
      }
    };
    window.addEventListener('findat_portfolio_changed', handleChanged);
    return () => window.removeEventListener('findat_portfolio_changed', handleChanged);
  }, [fetchSummary, portfolioId]);

  return { summary, loading, error, refetch: fetchSummary };
};
