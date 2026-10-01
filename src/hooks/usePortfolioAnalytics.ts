import { useState, useEffect, useCallback } from 'react';
import { portfolioService } from '../services/portfolioService';
import { portfolioAnalyticsService } from '../services/portfolioAnalyticsService';
import type { Holding } from '../types/portfolio';
import type { PortfolioAnalyticsResult, AnalyticsHistoryRange } from '../types/analytics';

// Sample Indian bluechip holdings for empty-state preview / demo
export const DEMO_HOLDINGS: Holding[] = [
  {
    id: 'demo-1',
    portfolio_id: 'demo-portfolio',
    stock_symbol: 'RELIANCE',
    quantity: 45,
    purchase_price: 2450.0,
    purchase_date: '2025-04-10',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    portfolio_id: 'demo-portfolio',
    stock_symbol: 'TCS',
    quantity: 30,
    purchase_price: 3820.0,
    purchase_date: '2025-05-15',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    portfolio_id: 'demo-portfolio',
    stock_symbol: 'HDFCBANK',
    quantity: 80,
    purchase_price: 1540.0,
    purchase_date: '2025-06-01',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-4',
    portfolio_id: 'demo-portfolio',
    stock_symbol: 'INFY',
    quantity: 65,
    purchase_price: 1610.0,
    purchase_date: '2025-07-20',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-5',
    portfolio_id: 'demo-portfolio',
    stock_symbol: 'TATAMOTORS',
    quantity: 110,
    purchase_price: 780.0,
    purchase_date: '2025-08-12',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const usePortfolioAnalytics = (
  portfolioId: string | undefined,
  initialRange: AnalyticsHistoryRange = '1Y'
) => {
  const [analytics, setAnalytics] = useState<PortfolioAnalyticsResult | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [range, setRange] = useState<AnalyticsHistoryRange>(initialRange);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoData, setIsDemoData] = useState<boolean>(false);

  const fetchAndCompute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let currentHoldings: Holding[] = [];

      if (portfolioId === 'demo') {
        currentHoldings = await portfolioService.getHoldings('demo');
        setIsDemoData(true);
      } else if (portfolioId) {
        currentHoldings = await portfolioService.getHoldings(portfolioId);
        setIsDemoData(false);
      } else {
        currentHoldings = [];
        setIsDemoData(false);
      }


      setHoldings(currentHoldings);

      const result = await portfolioAnalyticsService.computePortfolioAnalytics(currentHoldings, range);
      setAnalytics(result);
    } catch (err: unknown) {
      console.error('Failed to compute portfolio analytics:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analytics computation');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, range]);

  useEffect(() => {
    fetchAndCompute();
  }, [fetchAndCompute]);

  // Reactive listener for portfolio updates across components
  useEffect(() => {
    const handlePortfolioChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.portfolioId || detail.portfolioId === portfolioId) {
        fetchAndCompute();
      }
    };
    window.addEventListener('findat_portfolio_changed', handlePortfolioChange);
    return () => window.removeEventListener('findat_portfolio_changed', handlePortfolioChange);
  }, [fetchAndCompute, portfolioId]);

  return {
    analytics,
    holdings,
    range,
    setRange,
    loading,
    error,
    isDemoData,
    refetch: fetchAndCompute,
  };
};
