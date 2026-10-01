import { useState, useEffect, useCallback } from 'react';
import { usePortfolioAnalytics } from './usePortfolioAnalytics';
import { useAuth } from './useAuth';
import { riskAnalysisService } from '../services/riskAnalysisService';
import type { PortfolioRiskAnalysisResult } from '../types/risk';
import type { AnalyticsHistoryRange } from '../types/analytics';

export const useRiskAnalysis = (
  portfolioId: string | undefined,
  initialRange: AnalyticsHistoryRange = '1Y'
) => {
  const { profile } = useAuth();
  const {
    analytics,
    holdings,
    range,
    setRange,
    loading: analyticsLoading,
    error: analyticsError,
    isDemoData,
    refetch: refetchAnalytics,
  } = usePortfolioAnalytics(portfolioId, initialRange);

  const [riskData, setRiskData] = useState<PortfolioRiskAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const computeRisk = useCallback(async () => {
    if (!analytics) return;
    setLoading(true);
    setError(null);

    try {
      const result = await riskAnalysisService.computeRiskAnalysis(
        analytics,
        holdings,
        profile?.risk_tolerance
      );
      setRiskData(result);
    } catch (err: unknown) {
      console.error('Failed to compute risk analysis:', err);
      setError(err instanceof Error ? err.message : 'Error evaluating risk engine');
    } finally {
      setLoading(false);
    }
  }, [analytics, holdings, profile?.risk_tolerance]);

  useEffect(() => {
    if (!analyticsLoading && analytics) {
      computeRisk();
    } else if (analyticsError) {
      setError(analyticsError);
      setLoading(false);
    }
  }, [analyticsLoading, analytics, analyticsError, computeRisk]);

  return {
    riskData,
    analytics,
    holdings,
    range,
    setRange,
    availableRanges: analytics?.availableRanges || ['1M', '3M', '6M', '1Y'],
    loading: analyticsLoading || loading,
    error: analyticsError || error,
    isDemoData,
    refetch: refetchAnalytics,
  };
};
