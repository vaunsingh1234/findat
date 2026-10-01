import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Compass,
  CheckCircle2,
  Filter,
  Layers,
  Activity,
  Plus,
  Info,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePortfolios } from '../hooks/usePortfolio';
import { usePortfolioAnalytics } from '../hooks/usePortfolioAnalytics';
import { useRiskAnalysis } from '../hooks/useRiskAnalysis';
import {
  recommendationService,
  type AnalyticalCandidate,
  type WhatIfSimulationResult,
} from '../services/recommendationService';

export const RecommendationsPage: React.FC = () => {
  const { user } = useAuth();
  const { portfolios } = usePortfolios(user?.id);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('demo');

  useEffect(() => {
    if (portfolios.length > 0 && selectedPortfolioId === 'demo') {
      setSelectedPortfolioId(portfolios[0].id);
    }
  }, [portfolios, selectedPortfolioId]);

  const { analytics, holdings } = usePortfolioAnalytics(selectedPortfolioId, '1Y');
  const { riskData } = useRiskAnalysis(selectedPortfolioId, '1Y');

  // Recommendation State
  const [loading, setLoading] = useState(true);
  const [portfolioObservations, setPortfolioObservations] = useState<string[]>([]);
  const [diversificationOpportunities, setDiversificationOpportunities] = useState<string[]>([]);
  const [riskObservations, setRiskObservations] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<AnalyticalCandidate[]>([]);

  // Filter States
  const [sectorFilter, setSectorFilter] = useState('All');
  const [capFilter, setCapFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');

  // What-If Simulation State
  const [selectedCandidate, setSelectedCandidate] = useState<AnalyticalCandidate | null>(null);
  const [simQuantity, setSimQuantity] = useState<number>(20);
  const [simResult, setSimResult] = useState<WhatIfSimulationResult | null>(null);

  useEffect(() => {
    async function loadInsights() {
      setLoading(true);
      try {
        const res = await recommendationService.generateRecommendations(
          analytics?.holdings || [],
          analytics?.sectorAllocation || [],
          riskData
        );
        setPortfolioObservations(res.portfolioObservations);
        setDiversificationOpportunities(res.diversificationOpportunities);
        setRiskObservations(res.riskObservations);
        setCandidates(res.candidates);
        if (res.candidates.length > 0 && !selectedCandidate) {
          setSelectedCandidate(res.candidates[0]);
        }
      } catch (err) {
        console.error('Failed generating recommendations:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInsights();
  }, [analytics, riskData]);

  // Recalculate What-If Simulation whenever candidate or quantity changes
  useEffect(() => {
    if (selectedCandidate && analytics) {
      const res = recommendationService.simulateHoldingAddition(
        analytics.holdings,
        analytics.sectorAllocation,
        selectedCandidate.symbol,
        simQuantity,
        selectedCandidate.currentPrice,
        riskData?.beta || 1.0
      );
      setSimResult(res);
    }
  }, [selectedCandidate, simQuantity, analytics, riskData]);

  // Apply filters
  const filteredCandidates = candidates.filter((c) => {
    if (sectorFilter !== 'All' && c.sector !== sectorFilter) return false;
    if (capFilter !== 'All' && c.marketCap !== capFilter) return false;
    if (riskFilter !== 'All' && c.volatilityTier !== riskFilter) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-ink">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-warm pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-widest text-olive font-bold">
              [ANALYTICAL SIGNALS & SELECTION ENGINE]
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-olive animate-pulse" />
            <span className="text-[11px] font-mono text-muted">SEBI Compliance Aligned</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink tracking-tight">
            Recommendations & Signals
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Data-driven diversification signals, concentration observations, and signature What-If impact simulation.
          </p>
        </div>

        {/* Portfolio Switcher */}
        {portfolios.length > 0 && (
          <select
            value={selectedPortfolioId}
            onChange={(e) => setSelectedPortfolioId(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-surface border border-border-warm text-ink text-xs font-mono font-bold outline-none focus:border-terracotta shadow-xs"
          >
            {portfolios.map((p) => (
              <option key={p.id} value={p.id}>
                Target: {p.name}
              </option>
            ))}
            <option value="demo">Target: Sample Indian Equity Portfolio</option>
          </select>
        )}
      </div>

      {/* Distinction Banner: Analytical Signal vs Financial Advice */}
      <div className="p-4 rounded-2xl bg-surface border border-border-warm flex items-start gap-3 text-xs font-mono text-muted shadow-xs">
        <Info className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-ink">
            Regulatory Notice: Quantitative Analytical Signals, Not Financial Advice
          </p>
          <p className="font-sans leading-relaxed text-[11px]">
            FinDat delivers deterministic mathematical observations based on historical variances, covariance, and portfolio concentration limits. These signals identify asset diversification opportunities and do not constitute registered personalized investment advice, guaranteed profit forecasts, or stock recommendations.
          </p>
        </div>
      </div>

      {/* 1. PORTFOLIO-AWARE OBSERVATIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Concentration Observations */}
        <div className="editorial-card p-6 space-y-3 bg-surface flex flex-col justify-between">
          <div className="space-y-2">
            <span className="font-display font-bold text-base text-ink flex items-center gap-2">
              <Layers className="w-4 h-4 text-terracotta" /> Concentration Signals
            </span>
            <div className="space-y-2 text-xs font-sans text-muted leading-relaxed">
              {portfolioObservations.length > 0 ? (
                portfolioObservations.map((obs, idx) => (
                  <p key={idx} className="p-2.5 rounded-xl bg-warm-cream/50 border border-border-warm/70">
                    {obs}
                  </p>
                ))
              ) : (
                <p className="p-2.5 rounded-xl bg-warm-cream/50">Portfolio asset weights remain within standard prudential boundaries.</p>
              )}
            </div>
          </div>
          <span className="text-[10px] font-mono text-muted">Targeting HHI index stability</span>
        </div>

        {/* Diversification Opportunities */}
        <div className="editorial-card p-6 space-y-3 bg-surface flex flex-col justify-between">
          <div className="space-y-2">
            <span className="font-display font-bold text-base text-ink flex items-center gap-2">
              <Compass className="w-4 h-4 text-olive" /> Diversification Breadth
            </span>
            <div className="space-y-2 text-xs font-sans text-muted leading-relaxed">
              {diversificationOpportunities.map((obs, idx) => (
                <p key={idx} className="p-2.5 rounded-xl bg-warm-cream/50 border border-border-warm/70">
                  {obs}
                </p>
              ))}
            </div>
          </div>
          <span className="text-[10px] font-mono text-muted">Sector rotation & breadth analysis</span>
        </div>

        {/* Risk Observations */}
        <div className="editorial-card p-6 space-y-3 bg-surface flex flex-col justify-between">
          <div className="space-y-2">
            <span className="font-display font-bold text-base text-ink flex items-center gap-2">
              <Activity className="w-4 h-4 text-mustard-hover" /> Risk Engine Insights
            </span>
            <div className="space-y-2 text-xs font-sans text-muted leading-relaxed">
              {riskObservations.length > 0 ? (
                riskObservations.map((obs, idx) => (
                  <p key={idx} className="p-2.5 rounded-xl bg-warm-cream/50 border border-border-warm/70">
                    {obs}
                  </p>
                ))
              ) : (
                <p className="p-2.5 rounded-xl bg-warm-cream/50">Calculated beta and session volatility are aligned with market baseline.</p>
              )}
            </div>
          </div>
          <span className="text-[10px] font-mono text-muted">Derived from real session variance</span>
        </div>
      </div>

      {/* 2. SIGNATURE WHAT-IF PORTFOLIO SIMULATION */}
      {selectedCandidate && simResult && (
        <section className="editorial-card p-6 sm:p-8 space-y-6 bg-surface">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-warm pb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-terracotta" />
                <span>Signature What-If Portfolio Impact Simulation</span>
              </h3>
              <p className="text-xs text-muted">
                Simulate adding <strong>{selectedCandidate.symbol}</strong> to evaluate before vs after portfolio diversification, beta, and concentration.
              </p>
            </div>

            {/* Quantity Input */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted">Simulate Shares:</span>
              <input
                type="number"
                min="1"
                max="500"
                value={simQuantity}
                onChange={(e) => setSimQuantity(Math.max(1, Number(e.target.value)))}
                className="w-20 px-3 py-1.5 rounded-lg bg-warm-cream border border-border-warm text-ink font-bold text-center outline-none focus:border-terracotta"
              />
              <span className="text-muted">(@ ₹{selectedCandidate.currentPrice.toFixed(2)})</span>
            </div>
          </div>

          {/* Before vs After Impact Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            {/* Total Value */}
            <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1">
              <span className="text-[10px] uppercase text-muted block">Portfolio Valuation</span>
              <div className="flex items-baseline justify-between">
                <span className="text-muted">₹{(simResult.currentValueBefore / 1000).toFixed(0)}k</span>
                <span className="font-bold text-sm text-ink">→ ₹{(simResult.currentValueAfter / 1000).toFixed(0)}k</span>
              </div>
              <span className="text-[10px] text-olive font-bold block">+₹{simResult.investedDelta.toLocaleString('en-IN')} added</span>
            </div>

            {/* Top Holding Weight */}
            <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1">
              <span className="text-[10px] uppercase text-muted block">Top Holding Weight</span>
              <div className="flex items-baseline justify-between">
                <span className="text-muted">{simResult.topHoldingWeightBefore}%</span>
                <span className="font-bold text-sm text-ink">→ {simResult.topHoldingWeightAfter}%</span>
              </div>
              <span className="text-[10px] text-olive font-bold block">
                {simResult.topHoldingWeightAfter <= simResult.topHoldingWeightBefore ? 'Diversification improved' : 'Single asset expanded'}
              </span>
            </div>

            {/* Sector Allocation */}
            <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1">
              <span className="text-[10px] uppercase text-muted block truncate">{selectedCandidate.sector}</span>
              <div className="flex items-baseline justify-between">
                <span className="text-muted">{simResult.sectorWeightBefore}%</span>
                <span className="font-bold text-sm text-ink">→ {simResult.sectorWeightAfter}%</span>
              </div>
              <span className="text-[10px] text-muted block">New sector weight</span>
            </div>

            {/* Estimated Beta */}
            <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1">
              <span className="text-[10px] uppercase text-muted block">Portfolio Beta (β)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-muted">β {simResult.estimatedBetaBefore}</span>
                <span className="font-bold text-sm text-ink">→ β {simResult.estimatedBetaAfter}</span>
              </div>
              <span className="text-[10px] text-muted block">vs NIFTY 50 Index</span>
            </div>
          </div>
        </section>
      )}

      {/* 3. CANDIDATE SECURITIES WITH FILTERS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-warm pb-4">
          <div>
            <h3 className="font-display font-bold text-xl text-ink">
              Analytical Securities Candidate Universe
            </h3>
            <p className="text-xs text-muted">
              Quality Indian equities matching quantitative valuation, dividend yield, and diversification parameters.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            {/* Sector */}
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-surface border border-border-warm text-ink outline-none focus:border-terracotta"
            >
              <option value="All">All Sectors</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Financial Services">Financial Services</option>
              <option value="Fast Moving Consumer Goods">FMCG</option>
              <option value="Automobile">Automobile</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Telecommunications">Telecommunications</option>
            </select>

            {/* Market Cap */}
            <select
              value={capFilter}
              onChange={(e) => setCapFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-surface border border-border-warm text-ink outline-none focus:border-terracotta"
            >
              <option value="All">All Market Caps</option>
              <option value="Large Cap">Large Cap</option>
              <option value="Mid Cap">Mid Cap</option>
            </select>

            {/* Risk Tier */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-surface border border-border-warm text-ink outline-none focus:border-terracotta"
            >
              <option value="All">All Volatility Tiers</option>
              <option value="Low">Low Volatility</option>
              <option value="Moderate">Moderate Volatility</option>
            </select>
          </div>
        </div>

        {/* Candidate Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCandidates.map((c) => {
            const isSelected = selectedCandidate?.symbol === c.symbol;
            return (
              <div
                key={c.symbol}
                onClick={() => setSelectedCandidate(c)}
                className={`editorial-card p-5 space-y-4 bg-surface cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected ? 'border-terracotta ring-1 ring-terracotta shadow-sm' : 'hover:border-terracotta/60'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-ink">{c.symbol}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-olive-light text-olive border border-olive/20">
                      Fit: {c.fitScore}/100
                    </span>
                  </div>

                  <span className="text-[11px] font-sans text-muted truncate block">{c.companyName}</span>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="font-bold text-ink">₹{c.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span className={c.dayChangePercent >= 0 ? 'text-olive font-semibold' : 'text-terracotta font-semibold'}>
                      {c.dayChangePercent >= 0 ? '+' : ''}{c.dayChangePercent.toFixed(2)}%
                    </span>
                  </div>

                  <p className="text-xs font-sans text-muted leading-relaxed pt-1 border-t border-border-warm/60">
                    {c.rationale}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-border-warm/60 font-mono text-[11px]">
                  <div className="flex justify-between text-muted">
                    <span>P/E Ratio:</span>
                    <span className="text-ink font-semibold">{c.peRatio}x</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Dividend Yield:</span>
                    <span className="text-olive font-semibold">{c.dividendYield}%</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Beta vs NIFTY:</span>
                    <span className="text-ink font-semibold">β {c.estimatedBeta}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCandidate(c);
                      }}
                      className="text-xs text-terracotta hover:underline font-bold"
                    >
                      {isSelected ? '✓ In Simulation' : 'Run What-If Simulation'}
                    </button>
                    <Link
                      to={`/stocks/${c.symbol}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-muted hover:text-ink flex items-center gap-0.5"
                    >
                      <span>Details</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default RecommendationsPage;
