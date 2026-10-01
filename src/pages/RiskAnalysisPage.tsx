import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Layers,
  Building2,
  Compass,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BarChart3,
  Activity,
  Plus,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { usePortfolios } from '../hooks/usePortfolio';
import { useRiskAnalysis } from '../hooks/useRiskAnalysis';
import { FinDatRiskBlobCard } from '../components/common/FinDatRiskBlobCard';
import type { DrawdownPoint } from '../types/risk';
import type { AnalyticsHistoryRange } from '../types/analytics';

export const RiskAnalysisPage: React.FC = () => {
  const { portfolioId: paramPortfolioId } = useParams<{ portfolioId?: string }>();
  const { user } = useAuth();
  const { portfolios } = usePortfolios(user?.id);

  // Selected portfolio: from URL param, first user portfolio, or 'demo'
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>(
    paramPortfolioId || 'demo'
  );

  // Chart view modes
  const [chartMode, setChartMode] = useState<'drawdown' | 'valuation'>('drawdown');

  // Sync selected portfolio when user portfolios load
  useEffect(() => {
    if (paramPortfolioId) {
      setSelectedPortfolioId(paramPortfolioId);
    } else if (portfolios.length > 0 && selectedPortfolioId === 'demo') {
      setSelectedPortfolioId(portfolios[0].id);
    }
  }, [paramPortfolioId, portfolios, selectedPortfolioId]);

  const {
    riskData,
    analytics,
    holdings,
    range,
    setRange,
    availableRanges,
    loading,
    error,
    isDemoData,
    refetch,
  } = useRiskAnalysis(selectedPortfolioId, '1Y');

  if (loading && !riskData) {
    return (
      <div className="min-h-screen bg-warm-cream py-16 px-4 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-terracotta border-t-transparent rounded-full animate-spin" />
        <div className="text-center space-y-1">
          <p className="font-display font-bold text-lg text-ink">Calibrating Risk Analysis Engine</p>
          <p className="font-mono text-xs text-muted">
            Computing cross-asset beta, historical drawdowns, Value at Risk (VaR), and concentration metrics...
          </p>
        </div>
      </div>
    );
  }

  if (error && !riskData) {
    return (
      <div className="min-h-screen bg-warm-cream py-16 px-4">
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-surface border border-border-warm text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-terracotta mx-auto" />
          <h2 className="text-2xl font-display font-bold text-ink">Risk Engine Evaluation Error</h2>
          <p className="text-sm text-muted">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 rounded-xl bg-ink text-warm-cream text-xs font-semibold hover:bg-ink/90 transition-colors"
          >
            Retry Risk Calibration
          </button>
        </div>
      </div>
    );
  }

  const {
    overallRiskScore,
    riskCategory,
    riskExplanation,
    volatility,
    volatilityPeriod,
    beta,
    benchmarkName,
    maxDrawdown,
    sharpeRatio,
    riskFreeRate,
    valueAtRisk,
    diversificationScore,
    diversificationTier,
    concentration,
    riskFactors,
    sectorRisks,
    stockRisks,
    drawdownHistory,
    profileComparison,
    alerts,
  } = riskData || {
    overallRiskScore: 0,
    riskCategory: 'Low Risk' as const,
    riskExplanation: 'No active holdings.',
    volatility: null,
    volatilityPeriod: 'Insufficient data',
    beta: null,
    benchmarkName: 'NIFTY 50 Index (^NSEI)',
    maxDrawdown: null,
    maxDrawdownPeriod: 'Insufficient data',
    sharpeRatio: null,
    riskFreeRate: 6.5,
    valueAtRisk: {
      var95Percent: null,
      var95Amount: null,
      confidenceLevel: 95,
      horizon: '1-Day',
      isAvailable: false,
      disclaimer: '',
    },
    diversificationScore: 0,
    diversificationTier: 'Concentrated' as const,
    diversificationBasis: '',
    concentration: {
      largestHoldingPercent: 0,
      largestHoldingSymbol: '—',
      top3HoldingsPercent: 0,
      top5HoldingsPercent: 0,
      hhiScore: 0,
      sectorConcentrationLevel: 'Low' as const,
      largestSectorPercent: 0,
      largestSectorName: '—',
      isSectorDataAvailable: false,
      explanation: 'No holdings.',
    },
    riskFactors: {
      volatilityRisk: { name: 'Volatility Risk', score: 0, level: 'Low' as const, valueDisplay: '—', description: '' },
      marketRisk: { name: 'Market Risk', score: 0, level: 'Low' as const, valueDisplay: '—', description: '' },
      concentrationRisk: { name: 'Concentration Risk', score: 0, level: 'Low' as const, valueDisplay: '—', description: '' },
      sectorRisk: { name: 'Sector Risk', score: 0, level: 'Low' as const, valueDisplay: '—', description: '' },
      drawdownRisk: { name: 'Drawdown Risk', score: 0, level: 'Low' as const, valueDisplay: '—', description: '' },
      diversification: { name: 'Diversification', score: 0, level: 'Low' as const, valueDisplay: '—', description: '' },
    },
    sectorRisks: [],
    stockRisks: [],
    drawdownHistory: [],
    profileComparison: {
      userRiskProfile: 'Moderate' as const,
      portfolioRiskCategory: 'Low Risk' as const,
      isAligned: true,
      alignmentSummary: '',
      explanation: '',
    },
    alerts: [],
  };

  // Color mappings
  const isHighRisk = riskCategory === 'High Risk';
  const isLowRisk = riskCategory === 'Low Risk';

  // Check empty state
  const hasHoldings = holdings && holdings.length > 0;

  // Concentration bar data for top holdings
  const concentrationChartData = stockRisks.slice(0, 6).map((s) => ({
    symbol: s.symbol,
    allocation: s.allocationPercent,
  }));

  return (
    <div className="min-h-screen bg-warm-cream py-10 px-4 sm:px-6 lg:px-8 text-ink">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header & Portfolio Switcher */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-warm pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-olive font-bold">
                [QUANTITATIVE RISK ENGINE]
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-olive animate-pulse" />
              <span className="text-[11px] font-mono text-muted">Capital Protection & Volatility Telemetry</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink tracking-tight">
              Portfolio Risk Analysis
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Multi-factor volatility calibration, NIFTY 50 beta sensitivity, Value at Risk (VaR), and historical drawdown tracking.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {portfolios.length > 0 && (
              <select
                value={selectedPortfolioId}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-surface border border-border-warm text-ink text-xs font-mono font-bold outline-none focus:border-terracotta shadow-xs"
              >
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                <option value="demo">Sample Indian Equity Portfolio</option>
              </select>
            )}

            <Link
              to="/portfolio"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface border border-border-warm text-ink text-xs font-mono font-semibold hover:bg-warm-cream transition-colors shadow-xs"
            >
              <span>Manage Portfolio</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Demo Notice Banner */}
        {isDemoData && hasHoldings && (
          <div className="rounded-2xl border border-mustard/40 bg-mustard-light/50 p-4 flex items-center justify-between text-xs font-mono text-ink gap-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-mustard-hover shrink-0" />
              <span>
                Evaluating risk telemetry for <strong>Sample Indian Bluechip Portfolio</strong>. Add your own holdings in the Portfolio section to calibrate personal risk.
              </span>
            </div>
            <Link
              to="/portfolio"
              className="underline font-bold text-mustard-hover hover:text-ink whitespace-nowrap"
            >
              View Holdings
            </Link>
          </div>
        )}

        {/* Empty Portfolio State */}
        {!hasHoldings && (
          <div className="rounded-3xl border border-dashed border-border-warm bg-surface/60 p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-terracotta-light text-terracotta flex items-center justify-center mx-auto">
              <Layers className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-xl font-display font-bold text-ink">Risk Engine Requires Portfolio Holdings</h3>
              <p className="text-xs text-muted leading-relaxed font-sans">
                The quantitative risk engine calculates multi-factor volatility, market beta, historical drawdowns, and Value at Risk (VaR) from your actual equity securities. Add holdings to activate real-time risk calibration.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-warm-cream text-xs font-semibold hover:bg-ink/90 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" /> Go to Portfolio & Add Holdings
              </Link>
            </div>
          </div>
        )}

        {hasHoldings && (
          <>
            {/* 1. PORTFOLIO RISK OVERVIEW & SCORE HERO */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Primary Portfolio Risk Overview with Unlumen Fluid Blob Card Animation (5 cols) */}
              <div className="lg:col-span-5 flex">
                <FinDatRiskBlobCard
                  overallRiskScore={overallRiskScore}
                  riskCategory={riskCategory}
                  volatility={volatility}
                  volatilityPeriod={volatilityPeriod}
                  beta={beta}
                  benchmarkName={benchmarkName}
                  sharpeRatio={sharpeRatio}
                  riskFreeRate={riskFreeRate}
                  maxDrawdown={maxDrawdown}
                  riskExplanation={riskExplanation}
                />
              </div>

              {/* Key Metric Highlights (7 cols) */}
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Volatility */}
                <div className="editorial-card p-5 space-y-1.5 bg-surface flex flex-col justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
                    Volatility
                  </span>
                  <p className="text-2xl sm:text-3xl font-display font-black text-ink tabular-nums">
                    {volatility !== null ? `${volatility}%` : 'Insufficient data'}
                  </p>
                  <span className="text-[10px] font-mono text-muted">{volatilityPeriod}</span>
                </div>

                {/* Beta vs NIFTY 50 */}
                <div className="editorial-card p-5 space-y-1.5 bg-surface flex flex-col justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
                    Market Beta (β)
                  </span>
                  <p className="text-2xl sm:text-3xl font-display font-black text-ink tabular-nums">
                    {beta !== null ? beta : 'Benchmark data unavailable'}
                  </p>
                  <span className="text-[10px] font-mono text-muted truncate" title={benchmarkName}>
                    vs {benchmarkName}
                  </span>
                </div>

                {/* Sharpe Ratio */}
                <div className="editorial-card p-5 space-y-1.5 bg-surface flex flex-col justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
                    Sharpe Ratio
                  </span>
                  <p className="text-2xl sm:text-3xl font-display font-black text-ink tabular-nums">
                    {sharpeRatio !== null ? sharpeRatio : 'Insufficient data'}
                  </p>
                  <span className="text-[10px] font-mono text-muted">Rf = {riskFreeRate}% T-Bill yield</span>
                </div>

                {/* Maximum Drawdown */}
                <div className="editorial-card p-5 space-y-1.5 bg-surface flex flex-col justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
                    Max Drawdown
                  </span>
                  <p className="text-2xl sm:text-3xl font-display font-black text-terracotta tabular-nums">
                    {maxDrawdown !== null ? `${maxDrawdown}%` : 'Insufficient data'}
                  </p>
                  <span className="text-[10px] font-mono text-muted">Historical peak-to-trough</span>
                </div>

                {/* Value at Risk (VaR 95%) */}
                <div className="editorial-card p-5 space-y-1.5 bg-surface flex flex-col justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
                    Value at Risk (95%)
                  </span>
                  <p className="text-2xl sm:text-3xl font-display font-black text-terracotta tabular-nums">
                    {valueAtRisk.isAvailable && valueAtRisk.var95Percent !== null
                      ? `${valueAtRisk.var95Percent}%`
                      : 'Insufficient data'}
                  </p>
                  <span className="text-[10px] font-mono text-muted truncate">
                    {valueAtRisk.isAvailable && valueAtRisk.var95Amount !== null
                      ? `₹${valueAtRisk.var95Amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (1-Day)`
                      : '95% Confidence 1-Day'}
                  </span>
                </div>

                {/* Diversification Score */}
                <div className="editorial-card p-5 space-y-1.5 bg-surface flex flex-col justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
                    Diversification
                  </span>
                  <p className="text-2xl sm:text-3xl font-display font-black text-ink tabular-nums">
                    {diversificationScore}
                    <span className="text-xs font-normal text-muted font-mono">/100</span>
                  </p>
                  <span className="text-[10px] font-mono text-olive font-semibold">
                    {diversificationTier} Rating
                  </span>
                </div>
              </div>
            </section>

            {/* 2. RISK PROFILE COMPARISON SECTION */}
            <section className="rounded-3xl border border-border-warm bg-surface p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-warm pb-4">
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-olive" /> Risk Profile Calibration Comparison
                  </h3>
                  <p className="text-xs text-muted">
                    Comparing calculated portfolio risk characteristics with your investor onboarding risk profile.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-muted">Target Profile:</span>
                  <span className="px-2.5 py-1 rounded-md bg-warm-cream border border-border-warm font-bold text-ink">
                    {profileComparison.userRiskProfile}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2">
                <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1 text-xs">
                  <span className="text-[10px] font-mono uppercase text-muted block">Selected Profile</span>
                  <p className="text-base font-display font-bold text-ink">{profileComparison.userRiskProfile}</p>
                  <p className="text-muted">Preference calibrated in Profile Settings</p>
                </div>

                <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1 text-xs">
                  <span className="text-[10px] font-mono uppercase text-muted block">Calculated Portfolio Risk</span>
                  <p className={`text-base font-display font-bold ${isLowRisk ? 'text-olive' : isHighRisk ? 'text-terracotta' : 'text-mustard-hover'}`}>
                    {profileComparison.portfolioRiskCategory}
                  </p>
                  <p className="text-muted">Derived from real price and return series</p>
                </div>

                <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1 text-xs">
                  <span className="text-[10px] font-mono uppercase text-muted block">Alignment Status</span>
                  <p className="text-sm font-sans font-semibold text-ink">
                    {profileComparison.alignmentSummary}
                  </p>
                  <p className="text-muted text-[11px]">{profileComparison.explanation}</p>
                </div>
              </div>
            </section>

            {/* 3. MULTI-FACTOR RISK DECOMPOSITION */}
            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-display font-bold text-ink flex items-center gap-2">
                  <Activity className="w-5 h-5 text-olive" /> Multi-Factor Risk Decomposition
                </h2>
                <p className="text-xs font-mono text-muted">
                  Granular breakdown of the quantitative components contributing to overall portfolio risk
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Object.values(riskFactors).map((factor) => {
                  const isFactorHigh = factor.level === 'High';
                  const isFactorLow = factor.level === 'Low';
                  return (
                    <div key={factor.name} className="editorial-card p-6 space-y-4 bg-surface flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-display font-bold text-base text-ink">{factor.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                              isFactorLow
                                ? 'bg-olive-light text-olive border-olive/30'
                                : isFactorHigh
                                ? 'bg-terracotta-light text-terracotta border-terracotta/30'
                                : 'bg-mustard-light text-mustard-hover border-mustard/30'
                            }`}
                          >
                            {factor.level} Risk
                          </span>
                        </div>

                        <div className="font-mono text-sm font-bold text-ink">{factor.valueDisplay}</div>
                        <p className="text-xs text-muted leading-relaxed font-sans">{factor.description}</p>
                      </div>

                      {/* Factor Sub-score Bar */}
                      <div className="space-y-1 pt-2 border-t border-border-warm/60">
                        <div className="flex justify-between text-[10px] font-mono text-muted">
                          <span>Risk Contribution</span>
                          <span>{factor.score}/100</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-border-warm overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isFactorLow ? 'bg-olive' : isFactorHigh ? 'bg-terracotta' : 'bg-mustard-hover'
                            }`}
                            style={{ width: `${factor.score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 4. CONCENTRATION & SECTOR RISK GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Concentration Analysis (6 cols) */}
              <section className="lg:col-span-6 rounded-3xl border border-border-warm bg-surface p-6 sm:p-8 space-y-6 shadow-xs flex flex-col justify-between">
                <div className="space-y-1 border-b border-border-warm pb-4">
                  <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
                    <Layers className="w-5 h-5 text-terracotta" /> Concentration Analysis
                  </h3>
                  <p className="text-xs text-muted">
                    Evaluating single-stock dominance vs multi-holding capital spreading (HHI Index: {concentration.hhiScore.toLocaleString('en-IN')}).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 font-mono">
                  <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1">
                    <span className="text-[10px] uppercase text-muted block">Largest Holding</span>
                    <p className="text-2xl font-bold text-ink">{concentration.largestHoldingPercent}%</p>
                    <span className="text-[11px] text-muted truncate block">{concentration.largestHoldingSymbol}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1">
                    <span className="text-[10px] uppercase text-muted block">Top 3 Holdings</span>
                    <p className="text-2xl font-bold text-ink">{concentration.top3HoldingsPercent}%</p>
                    <span className="text-[11px] text-muted">Cum. Allocation</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1">
                    <span className="text-[10px] uppercase text-muted block">Top 5 Holdings</span>
                    <p className="text-2xl font-bold text-ink">{concentration.top5HoldingsPercent}%</p>
                    <span className="text-[11px] text-muted">Cum. Allocation</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1">
                    <span className="text-[10px] uppercase text-muted block">Sector Concentration</span>
                    <p className={`text-2xl font-bold ${
                      concentration.sectorConcentrationLevel === 'High' ? 'text-terracotta' : concentration.sectorConcentrationLevel === 'Low' ? 'text-olive' : 'text-mustard-hover'
                    }`}>
                      {concentration.sectorConcentrationLevel}
                    </p>
                    <span className="text-[11px] text-muted truncate block">{concentration.largestSectorName}</span>
                  </div>
                </div>

                {/* Concentration Bar Visualization */}
                {concentrationChartData.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-mono uppercase text-muted font-bold block">
                      Holding Weight Distribution
                    </span>
                    <div className="w-full h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={concentrationChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E8DAC6" opacity={0.6} />
                          <XAxis dataKey="symbol" stroke="#7A6B55" fontSize={10} tickLine={false} />
                          <YAxis stroke="#7A6B55" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}%`} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload || !payload.length) return null;
                              return (
                                <div className="bg-surface/95 backdrop-blur-md p-2 rounded-lg border border-border-warm shadow-xs text-xs font-mono">
                                  <p className="font-bold text-ink">{payload[0].payload.symbol}</p>
                                  <p className="text-terracotta font-semibold">Weight: {payload[0].value}%</p>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="allocation" fill="#D9633B" radius={[4, 4, 0, 0]}>
                            {concentrationChartData.map((_entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#D9633B' : '#7A6B55'} opacity={index === 0 ? 1 : 0.8} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-warm-cream/60 border border-border-warm text-xs text-muted font-mono leading-relaxed">
                  {concentration.explanation}
                </div>
              </section>

              {/* Sector Risk Breakdown (6 cols) */}
              <section className="lg:col-span-6 rounded-3xl border border-border-warm bg-surface p-6 sm:p-8 space-y-6 shadow-xs flex flex-col justify-between">
                <div className="space-y-1 border-b border-border-warm pb-4">
                  <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
                    <Compass className="w-5 h-5 text-olive" /> Sector Risk Contribution
                  </h3>
                  <p className="text-xs text-muted">
                    Highlights sectors where capital exposure exceeds standard 35% concentration thresholds.
                  </p>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1 no-scrollbar text-xs font-mono">
                  {sectorRisks.length > 0 ? (
                    sectorRisks.map((sec) => (
                      <div
                        key={sec.sector}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          sec.isHighConcentration
                            ? 'bg-terracotta-light/30 border-terracotta/40'
                            : 'bg-warm-cream/50 border-border-warm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-sm text-ink truncate max-w-xs">
                              {sec.sector}
                            </span>
                            {sec.isHighConcentration && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold bg-terracotta-light text-terracotta border border-terracotta/30">
                                High Concentration
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-ink">{sec.allocationPercent}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 rounded-full bg-border-warm overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              sec.isHighConcentration ? 'bg-terracotta' : 'bg-olive'
                            }`}
                            style={{ width: `${Math.min(100, sec.allocationPercent)}%` }}
                          />
                        </div>

                        {!sec.isAvailable && (
                          <span className="text-[10px] text-terracotta mt-1 block">
                            Sector data unavailable
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs font-mono text-muted">
                      Sector data unavailable
                    </div>
                  )}
                </div>

                <p className="text-[11px] font-mono text-muted">
                  SEBI portfolio diversification frameworks recommend avoiding single-sector concentration above 35%–40%.
                </p>
              </section>
            </div>

            {/* 5. HISTORICAL DRAWDOWN & VALUATION CHART */}
            <section className="rounded-3xl border border-border-warm bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-warm pb-4">
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-terracotta" /> Historical Portfolio Risk Trajectory
                  </h3>
                  <p className="text-xs text-muted">
                    Tracking historical peak-to-trough decline (drawdown) and valuation movements over time.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Mode Toggle */}
                  <div className="flex items-center bg-warm-cream p-1 rounded-xl border border-border-warm text-xs font-mono font-bold">
                    <button
                      onClick={() => setChartMode('drawdown')}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        chartMode === 'drawdown' ? 'bg-ink text-warm-cream shadow-xs' : 'text-muted hover:text-ink'
                      }`}
                    >
                      Drawdown (%)
                    </button>
                    <button
                      onClick={() => setChartMode('valuation')}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        chartMode === 'valuation' ? 'bg-ink text-warm-cream shadow-xs' : 'text-muted hover:text-ink'
                      }`}
                    >
                      Valuation (₹)
                    </button>
                  </div>

                  {/* Range Tabs (1M, 3M, 6M, 1Y) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {(['1M', '3M', '6M', '1Y'] as AnalyticsHistoryRange[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRange(r)}
                        disabled={!availableRanges.includes(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                          range === r
                            ? 'bg-ink text-warm-cream shadow-xs'
                            : 'bg-surface text-muted hover:text-ink hover:bg-warm-cream border border-border-warm'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full h-72 sm:h-80 pt-2">
                {drawdownHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartMode === 'drawdown' ? (
                      <AreaChart data={drawdownHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8FAF7E" stopOpacity={0.05} />
                            <stop offset="95%" stopColor="#D9633B" stopOpacity={0.4} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8DAC6" opacity={0.6} />
                        <XAxis
                          dataKey="date"
                          stroke="#7A6B55"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(val) => {
                            try {
                              const d = new Date(val);
                              return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                            } catch {
                              return val;
                            }
                          }}
                        />
                        <YAxis
                          stroke="#7A6B55"
                          fontSize={11}
                          tickLine={false}
                          orientation="right"
                          domain={['auto', 0]}
                          tickFormatter={(val) => `${val}%`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length) return null;
                            const data = payload[0].payload as DrawdownPoint;
                            return (
                              <div className="bg-surface/95 backdrop-blur-md p-3.5 rounded-xl border border-border-warm shadow-md text-xs font-mono space-y-1">
                                <p className="text-muted font-sans font-semibold">{data.date}</p>
                                <p className="text-ink font-bold text-sm">
                                  Portfolio Value: ₹{Number(data.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-muted text-[11px]">
                                  High-Water Mark: ₹{Number(data.peak).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-terracotta font-bold">
                                  Drawdown: {data.drawdownPercent.toFixed(2)}%
                                </p>
                              </div>
                            );
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="drawdownPercent"
                          stroke="#D9633B"
                          strokeWidth={2}
                          fill="url(#drawdownGradient)"
                          dot={false}
                        />
                      </AreaChart>
                    ) : (
                      <AreaChart data={analytics?.history || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D9633B" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#D9633B" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8DAC6" opacity={0.6} />
                        <XAxis
                          dataKey="date"
                          stroke="#7A6B55"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(val) => {
                            try {
                              const d = new Date(val);
                              return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                            } catch {
                              return val;
                            }
                          }}
                        />
                        <YAxis
                          stroke="#7A6B55"
                          fontSize={11}
                          tickLine={false}
                          orientation="right"
                          tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length) return null;
                            const point = payload[0].payload;
                            return (
                              <div className="bg-surface/95 backdrop-blur-md p-3.5 rounded-xl border border-border-warm shadow-md text-xs font-mono space-y-1">
                                <p className="text-muted font-sans font-semibold">{point.date}</p>
                                <p className="text-ink font-bold text-sm">
                                  Value: ₹{Number(point.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-muted text-[11px]">
                                  Invested: ₹{Number(point.invested).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            );
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#D9633B"
                          strokeWidth={2}
                          fill="url(#valueGradient)"
                          dot={false}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs font-mono text-muted">
                    Insufficient historical data points to construct trajectory.
                  </div>
                )}
              </div>
            </section>

            {/* 6. STOCK-LEVEL RISK TABLE */}
            <section className="rounded-3xl border border-border-warm bg-surface p-6 sm:p-8 space-y-6 shadow-xs overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-warm pb-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-olive" /> Stock-Level Risk & Volatility Matrix
                  </h3>
                  <p className="text-xs text-muted font-normal">
                    Disaggregated volatility, beta sensitivity, Sharpe ratio, and holding-specific risk ratings.
                  </p>
                </div>
                <span className="text-xs font-mono text-muted">{stockRisks.length} securities analyzed</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-border-warm text-muted uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4 text-right">Allocation</th>
                      <th className="py-3 px-4 text-right">Beta vs NIFTY</th>
                      <th className="py-3 px-4 text-right">Volatility (Ann.)</th>
                      <th className="py-3 px-4 text-right">Sharpe Ratio</th>
                      <th className="py-3 px-4 text-right">Max Drawdown</th>
                      <th className="py-3 px-4 text-right">Unrealized P/L</th>
                      <th className="py-3 px-4 text-center">Risk Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-warm/60">
                    {stockRisks.map((stock) => {
                      const isStockGain = stock.profitLoss >= 0;
                      const isStockHigh = stock.riskCategory === 'High';
                      const isStockLow = stock.riskCategory === 'Low';

                      return (
                        <tr key={stock.symbol} className="hover:bg-warm-cream/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <Link
                              to={`/stocks/${stock.symbol}`}
                              className="font-bold text-sm text-ink hover:text-terracotta transition-colors flex items-center gap-1 group"
                            >
                              <span>{stock.symbol}</span>
                              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            <span className="text-[11px] font-sans text-muted truncate block max-w-xs">
                              {stock.companyName}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-ink">
                            {stock.allocationPercent}%
                          </td>

                          <td className="py-3.5 px-4 text-right font-semibold text-ink">
                            {stock.beta !== null ? stock.beta : '—'}
                          </td>

                          <td className="py-3.5 px-4 text-right font-semibold text-ink">
                            {stock.volatility !== null ? `${stock.volatility}%` : '—'}
                          </td>

                          <td className="py-3.5 px-4 text-right font-semibold text-ink">
                            {stock.sharpeRatio !== null ? stock.sharpeRatio : '—'}
                          </td>

                          <td className="py-3.5 px-4 text-right font-semibold text-terracotta">
                            {stock.maxDrawdown !== null ? `${stock.maxDrawdown}%` : '—'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <span className={`font-bold ${isStockGain ? 'text-olive' : 'text-terracotta'}`}>
                              {isStockGain ? '+' : ''}₹{stock.profitLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="block text-[10px] text-muted">({stock.returnPercent}%)</span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                isStockLow
                                  ? 'bg-olive-light text-olive border-olive/30'
                                  : isStockHigh
                                  ? 'bg-terracotta-light text-terracotta border-terracotta/30'
                                  : 'bg-mustard-light text-mustard-hover border-mustard/30'
                              }`}
                            >
                              {stock.riskCategory}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 7. RISK ALERTS */}
            {alerts.length > 0 && (
              <section className="space-y-4">
                <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-terracotta" /> Active Risk Observations
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-2xl border flex items-start gap-3 ${
                        alert.type === 'warning'
                          ? 'bg-mustard-light/50 border-mustard/30 text-ink'
                          : 'bg-surface border-border-warm text-ink'
                      }`}
                    >
                      <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                        alert.type === 'warning' ? 'text-mustard-hover' : 'text-terracotta'
                      }`} />
                      <div className="space-y-0.5">
                        <h5 className="font-display font-bold text-sm text-ink">{alert.title}</h5>
                        <p className="text-xs text-muted leading-relaxed font-sans">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Value at Risk (VaR) Analytical Notice */}
            {valueAtRisk.isAvailable && (
              <div className="p-4 rounded-2xl bg-surface border border-border-warm flex items-start gap-3 text-xs text-muted font-mono">
                <Info className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                <p>
                  <strong>Analytical Note on Value at Risk (VaR):</strong> {valueAtRisk.disclaimer} Current estimated 95% 1-day capital risk is {valueAtRisk.var95Percent}% (₹{valueAtRisk.var95Amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}).
                </p>
              </div>
            )}
          </>
        )}

        {/* Financial Disclaimer */}
        <div className="pt-6 border-t border-border-warm text-center">
          <p className="text-xs font-mono text-muted max-w-xl mx-auto">
            Risk metrics are calculated dynamically from historical market session prices and Indian market benchmarks. Past volatility and drawdown trajectories do not guarantee future returns.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysisPage;
