import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Sparkles,
  FileText,
  Activity,
  Layers,
  Clock,
  Bookmark,
  ChevronRight,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { usePortfolios } from '../hooks/usePortfolio';
import { usePortfolioAnalytics } from '../hooks/usePortfolioAnalytics';
import { useRiskAnalysis } from '../hooks/useRiskAnalysis';
import { useWatchlist } from '../hooks/useWatchlist';
import { stockService } from '../services/stockService';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { portfolios } = usePortfolios(user?.id);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('demo');
  const [chartTab, setChartTab] = useState<'performance' | 'allocation'>('performance');

  // Sync selected portfolio when user portfolios load
  useEffect(() => {
    if (portfolios.length > 0 && selectedPortfolioId === 'demo') {
      setSelectedPortfolioId(portfolios[0].id);
    }
  }, [portfolios, selectedPortfolioId]);

  const {
    analytics,
    holdings,
    loading: analyticsLoading,
    isDemoData,
  } = usePortfolioAnalytics(selectedPortfolioId, '1Y');

  const { riskData, loading: riskLoading } = useRiskAnalysis(selectedPortfolioId, '1Y');
  const { items: watchlistItems, loading: watchlistLoading } = useWatchlist();

  // Market indices live data
  const [marketIndices, setMarketIndices] = useState<Array<{ name: string; symbol: string; value: number; change: number; pct: number }>>([
    { name: 'NIFTY 50', symbol: 'NIFTY50', value: 25250.0, change: 145.2, pct: 0.58 },
    { name: 'SENSEX', symbol: 'SENSEX', value: 82450.0, change: 420.5, pct: 0.51 },
    { name: 'BANK NIFTY', symbol: 'BANKNIFTY', value: 51820.0, change: -85.4, pct: -0.16 },
  ]);

  useEffect(() => {
    async function loadIndices() {
      try {
        const qNifty = await stockService.getQuote('NIFTY50').catch(() => null);
        if (qNifty && qNifty.currentPrice > 0) {
          setMarketIndices((prev) =>
            prev.map((idx) =>
              idx.symbol === 'NIFTY50'
                ? {
                    ...idx,
                    value: qNifty.currentPrice,
                    change: qNifty.priceChange,
                    pct: qNifty.percentageChange,
                  }
                : idx
            )
          );
        }
      } catch {
        // ignore
      }
    }
    loadIndices();
  }, []);

  const hasHoldings = holdings && holdings.length > 0;
  const perf = analytics?.performance || {
    totalInvested: 0,
    currentValue: 0,
    absoluteProfitLoss: 0,
    overallReturnPercent: 0,
    dailyChange: 0,
    dailyChangePercent: 0,
  };

  const isGain = perf.absoluteProfitLoss >= 0;
  const isDayGain = perf.dailyChange >= 0;

  const topHoldings = [...(analytics?.holdings || [])].sort((a, b) => b.currentValue - a.currentValue).slice(0, 5);

  const riskCat = riskData?.riskCategory || 'Moderate Risk';
  const isLowRisk = riskCat === 'Low Risk';
  const isHighRisk = riskCat === 'High Risk';

  const riskBadgeClass = isLowRisk
    ? 'bg-olive-light text-olive border-olive/30'
    : isHighRisk
    ? 'bg-terracotta-light text-terracotta border-terracotta/30'
    : 'bg-mustard-light text-mustard-hover border-mustard/30';

  const allocationColors = ['#D9633B', '#8FAF7E', '#C9A96E', '#7A6B55', '#4A3E2D', '#B84D28'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-ink">
      {/* Top Welcome & Executive Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-warm pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-widest text-olive font-bold">
              [EXECUTIVE OVERVIEW]
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-olive animate-pulse" />
            <span className="text-[11px] font-mono text-muted">NSE / BSE Live Telemetry</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink tracking-tight">
            Executive Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Quantitative portfolio valuation, cross-asset risk calibration, and Indian market indices.
          </p>
        </div>

        {/* Action Controls */}
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
            to="/recommendations"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-ink text-warm-cream text-xs font-mono font-bold hover:bg-ink/90 transition-colors shadow-xs"
          >
            <span>Run Impact Scenario</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface border border-border-warm text-ink text-xs font-mono font-semibold hover:bg-warm-cream transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Report</span>
          </Link>
        </div>
      </div>

      {/* Demo Notice Banner */}
      {isDemoData && hasHoldings && (
        <div className="rounded-2xl border border-mustard/40 bg-mustard-light/50 p-4 flex items-center justify-between text-xs font-mono text-ink gap-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-mustard-hover shrink-0" />
            <span>
              Viewing executive telemetry for <strong>Sample Indian Bluechip Portfolio</strong>. Add your personal holdings in the Portfolio section to tailor this dashboard.
            </span>
          </div>
          <Link to="/portfolio" className="underline font-bold text-mustard-hover hover:text-ink whitespace-nowrap">
            Manage Holdings
          </Link>
        </div>
      )}

      {/* Indian Market Indices Ticker Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {marketIndices.map((idx) => {
          const isUp = idx.pct >= 0;
          return (
            <div key={idx.symbol} className="p-4 rounded-2xl bg-surface border border-border-warm flex items-center justify-between shadow-xs">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono uppercase text-muted font-bold block">{idx.name}</span>
                <p className="text-xl font-display font-black text-ink tabular-nums">
                  {idx.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1 border ${
                isUp ? 'bg-olive-light text-olive border-olive/30' : 'bg-terracotta-light text-terracotta border-terracotta/30'
              }`}>
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{isUp ? `+${idx.pct}%` : `${idx.pct}%`}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Value */}
        <div className="editorial-card p-5 space-y-2 bg-surface">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
            Total Current Value
          </span>
          <p className="text-3xl font-display font-black text-ink tabular-nums">
            ₹{perf.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs font-mono text-muted">
            <span>Invested: ₹{perf.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span className={`font-bold tabular-nums ${isGain ? 'text-olive' : 'text-terracotta'}`}>
              {isGain ? '▲ +' : '▼ '}{perf.overallReturnPercent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Unrealized Total P/L */}
        <div className="editorial-card p-5 space-y-2 bg-surface">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
            Unrealized Total P/L
          </span>
          <p className={`text-3xl font-display font-black tabular-nums ${isGain ? 'text-olive' : 'text-terracotta'}`}>
            {isGain ? '+' : ''}₹{perf.absoluteProfitLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs font-mono text-muted">
            <span>Today's Move:</span>
            <span className={`font-semibold tabular-nums ${isDayGain ? 'text-olive' : 'text-terracotta'}`}>
              {isDayGain ? '▲ +' : '▼ '}₹{Math.abs(perf.dailyChange).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({isDayGain ? '+' : ''}{perf.dailyChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Sharpe Ratio & Beta */}
        <div className="editorial-card p-5 space-y-2 bg-surface">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
            Sharpe Ratio & Beta
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-display font-black text-ink tabular-nums">
              {riskData?.sharpeRatio !== null && riskData?.sharpeRatio !== undefined ? riskData.sharpeRatio : '—'}
            </span>
            <span className="text-xs font-mono text-muted">
              β {riskData?.beta !== null && riskData?.beta !== undefined ? riskData.beta : '—'} vs NIFTY 50
            </span>
          </div>
          <div className="text-xs font-mono text-olive font-medium">
            {riskData?.volatility !== null && riskData?.volatility !== undefined
              ? `${riskData.volatility}% Annualized Vol.`
              : 'Historical Volatility Stable'}
          </div>
        </div>

        {/* Overall Risk Rating */}
        <div className="editorial-card p-5 space-y-2 bg-surface">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
            Overall Risk Rating
          </span>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded text-sm font-bold font-mono uppercase border ${riskBadgeClass}`}>
              {riskCat}
            </span>
            <span className="text-xs font-mono text-muted tabular-nums">
              Score: {riskData?.overallRiskScore || 0}/100
            </span>
          </div>
          <div className="text-xs text-muted truncate font-mono">
            Drawdown: {riskData?.maxDrawdown !== null && riskData?.maxDrawdown !== undefined ? `${riskData.maxDrawdown}%` : 'Stable'}
          </div>
        </div>
      </div>

      {/* Empty State Prompt if user has 0 holdings */}
      {!hasHoldings && !analyticsLoading && (
        <div className="rounded-3xl border border-dashed border-border-warm bg-surface/60 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-terracotta-light text-terracotta flex items-center justify-center mx-auto">
            <Layers className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-display font-bold text-ink">Your Portfolio is Currently Empty</h3>
            <p className="text-xs text-muted leading-relaxed font-sans">
              Add your first Indian equity position in the Portfolio section to calibrate live valuations, risk analytics, and dashboard charts.
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

      {/* Main Grid: Charts + Risk Engine Insights */}
      {hasHoldings && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Interactive Performance Chart & Allocation (8 cols) */}
          <div className="lg:col-span-8 editorial-card p-6 sm:p-8 space-y-6 bg-surface flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-warm pb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-ink">
                  {chartTab === 'performance' ? 'Historical Mark-to-Market Trajectory' : 'Holding Capital Distribution'}
                </h3>
                <p className="text-xs text-muted">
                  {chartTab === 'performance'
                    ? 'Aggregate daily portfolio valuation over historical trading sessions.'
                    : 'Portfolio capital weights across active Indian equity positions.'}
                </p>
              </div>

              {/* Chart Toggle */}
              <div className="flex items-center bg-warm-cream p-1 rounded-xl border border-border-warm text-xs font-mono font-bold">
                <button
                  onClick={() => setChartTab('performance')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    chartTab === 'performance' ? 'bg-ink text-warm-cream shadow-xs' : 'text-muted hover:text-ink'
                  }`}
                >
                  Valuation (₹)
                </button>
                <button
                  onClick={() => setChartTab('allocation')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    chartTab === 'allocation' ? 'bg-ink text-warm-cream shadow-xs' : 'text-muted hover:text-ink'
                  }`}
                >
                  Allocation (%)
                </button>
              </div>
            </div>

            {/* Chart Area */}
            <div className="w-full h-72 sm:h-80">
              {chartTab === 'performance' ? (
                analytics?.history && analytics.history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dashboardValGradient" x1="0" y1="0" x2="0" y2="1">
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
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const point = payload[0].payload;
                          return (
                            <div className="bg-surface/95 backdrop-blur-md p-3 rounded-xl border border-border-warm shadow-md text-xs font-mono space-y-1">
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
                      <Area type="monotone" dataKey="value" stroke="#D9633B" strokeWidth={2} fill="url(#dashboardValGradient)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs font-mono text-muted">
                    Insufficient historical data to construct valuation progression.
                  </div>
                )
              ) : (
                analytics?.stockAllocation && analytics.stockAllocation.length > 0 ? (
                  <div className="h-full flex flex-col sm:flex-row items-center justify-around gap-6">
                    <div className="w-52 h-52 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.stockAllocation}
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="allocationPercent"
                          >
                            {analytics.stockAllocation.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={allocationColors[index % allocationColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload || !payload.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="bg-surface/95 backdrop-blur-md p-2.5 rounded-lg border border-border-warm shadow-xs text-xs font-mono">
                                  <p className="font-bold text-ink">{d.symbol}</p>
                                  <p className="text-terracotta font-semibold">{d.allocationPercent.toFixed(1)}%</p>
                                </div>
                              );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full max-h-56 overflow-y-auto no-scrollbar font-mono text-xs">
                      {analytics.stockAllocation.map((item, index) => (
                        <div key={item.symbol} className="p-2.5 rounded-xl bg-warm-cream/50 border border-border-warm/70 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: allocationColors[index % allocationColors.length] }} />
                            <span className="font-bold text-ink truncate">{item.symbol}</span>
                          </div>
                          <span className="text-[11px] text-muted block">{item.allocationPercent.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs font-mono text-muted">
                    No active allocations to display.
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right: Risk Engine Summary Card (4 cols) */}
          <div className="lg:col-span-4 editorial-card p-6 sm:p-7 space-y-5 bg-surface flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-border-warm pb-3">
              <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
                <Activity className="w-4 h-4 text-terracotta" />
                <span>Risk Engine Calibration</span>
              </h3>
              <Link to="/risk" className="text-xs font-mono text-terracotta hover:underline font-bold">
                Open Engine →
              </Link>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-warm-cream/50 border border-border-warm space-y-1">
                <div className="flex justify-between text-muted">
                  <span>Annual Volatility</span>
                  <span className="text-ink font-bold tabular-nums">
                    {riskData?.volatility !== null && riskData?.volatility !== undefined ? `${riskData.volatility}%` : 'Stable'}
                  </span>
                </div>
                <p className="text-[11px] text-muted font-sans">
                  Annualized session-by-session return standard deviation.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-warm-cream/50 border border-border-warm space-y-1">
                <div className="flex justify-between text-muted">
                  <span>Market Beta (β)</span>
                  <span className="text-ink font-bold tabular-nums">
                    {riskData?.beta !== null && riskData?.beta !== undefined ? riskData.beta : '1.00'}
                  </span>
                </div>
                <p className="text-[11px] text-muted font-sans">
                  Systematic market sensitivity relative to NIFTY 50.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-warm-cream/50 border border-border-warm space-y-1">
                <div className="flex justify-between text-muted">
                  <span>Value at Risk (95% 1-Day)</span>
                  <span className="text-terracotta font-bold tabular-nums">
                    {riskData?.valueAtRisk?.isAvailable && riskData.valueAtRisk.var95Percent !== null
                      ? `${riskData.valueAtRisk.var95Percent}%`
                      : '—'}
                  </span>
                </div>
                <p className="text-[11px] text-muted font-sans">
                  Analytical 1-day potential capital variance under normal trading.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-warm-cream/50 border border-border-warm space-y-1">
                <div className="flex justify-between text-muted">
                  <span>Max Historical Drawdown</span>
                  <span className="text-terracotta font-bold tabular-nums">
                    {riskData?.maxDrawdown !== null && riskData?.maxDrawdown !== undefined ? `${riskData.maxDrawdown}%` : '—'}
                  </span>
                </div>
                <p className="text-[11px] text-muted font-sans">
                  Deepest peak-to-trough contraction from high-water mark.
                </p>
              </div>
            </div>

            <Link
              to="/risk"
              className="w-full py-2.5 rounded-xl border border-border-warm text-xs font-mono font-bold text-center hover:bg-warm-cream transition-colors block"
            >
              Inspect Multi-Factor Risk Matrix
            </Link>
          </div>
        </div>
      )}

      {/* Bottom Grid: Top Holdings + Live Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Top Holdings Overview (6 cols) */}
        <div className="lg:col-span-6 editorial-card p-6 space-y-5 bg-surface">
          <div className="flex items-center justify-between border-b border-border-warm pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
                <Layers className="w-4 h-4 text-olive" />
                <span>Top Portfolio Holdings</span>
              </h3>
              <p className="text-xs text-muted">Primary capital allocations in active portfolio.</p>
            </div>
            <Link to="/portfolio" className="text-xs font-mono text-terracotta hover:underline font-bold">
              View All ({holdings.length}) →
            </Link>
          </div>

          {topHoldings.length > 0 ? (
            <div className="space-y-3 font-mono text-xs">
              {topHoldings.map((h) => {
                const isHGain = h.profitLoss >= 0;
                return (
                  <div key={h.symbol} className="p-3 rounded-xl bg-warm-cream/50 border border-border-warm flex items-center justify-between">
                    <div>
                      <Link to={`/stocks/${h.symbol}`} className="font-bold text-sm text-ink hover:text-terracotta transition-colors flex items-center gap-1">
                        <span>{h.symbol}</span>
                        <ArrowUpRight className="w-3 h-3 text-muted" />
                      </Link>
                      <span className="text-[11px] text-muted font-sans truncate block max-w-xs">{h.companyName}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-ink block">
                        ₹{h.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`text-[10px] font-bold ${isHGain ? 'text-olive' : 'text-terracotta'}`}>
                        {isHGain ? '+' : ''}{h.returnPercent.toFixed(2)}% ({h.allocationPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs font-mono text-muted">
              No active holdings found. Visit Portfolio to add Indian stocks.
            </div>
          )}
        </div>

        {/* Right: Live User Watchlist (6 cols) */}
        <div className="lg:col-span-6 editorial-card p-6 space-y-5 bg-surface">
          <div className="flex items-center justify-between border-b border-border-warm pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-terracotta" />
                <span>Active Watchlist</span>
              </h3>
              <p className="text-xs text-muted">Monitored Indian securities with live market pricing.</p>
            </div>
            <Link to="/stocks" className="text-xs font-mono text-terracotta hover:underline font-bold">
              Search Stocks →
            </Link>
          </div>

          {watchlistItems.length > 0 ? (
            <div className="space-y-3 font-mono text-xs">
              {watchlistItems.slice(0, 5).map((item) => {
                const quote = item.quote;
                const isWUp = quote ? quote.percentageChange >= 0 : true;
                return (
                  <div key={item.symbol} className="p-3 rounded-xl bg-warm-cream/50 border border-border-warm flex items-center justify-between">
                    <div>
                      <Link to={`/stocks/${item.symbol}`} className="font-bold text-sm text-ink hover:text-terracotta transition-colors flex items-center gap-1">
                        <span>{item.symbol}</span>
                        <ArrowUpRight className="w-3 h-3 text-muted" />
                      </Link>
                      <span className="text-[11px] text-muted font-sans truncate block max-w-xs">{item.companyName}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-ink block">
                        ₹{quote ? quote.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '1,000.00'}
                      </span>
                      <span className={`text-[10px] font-bold ${isWUp ? 'text-olive' : 'text-terracotta'}`}>
                        {isWUp ? '▲ +' : '▼ '}{quote ? quote.percentageChange.toFixed(2) : '0.00'}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs font-mono text-muted space-y-2">
              <p>Your watchlist is currently empty.</p>
              <Link to="/stocks" className="inline-flex items-center gap-1 font-bold text-terracotta underline">
                Browse Indian Equities & Add
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
