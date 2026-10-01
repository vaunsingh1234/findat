import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowUpRight, 
  TrendingUp, 
  ShieldAlert, 
  PieChart, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  SlidersHorizontal,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { ViewToggle, ViewMode } from '../components/common/ViewToggle';
import { BrandLoader } from '../components/common/BrandLoader';

export const LandingPage: React.FC = () => {
  const [showLoader, setShowLoader] = useState(() => {
    // Show loader once per session
    const hasLoaded = sessionStorage.getItem('findat_loader_seen');
    if (hasLoaded) return false;
    sessionStorage.setItem('findat_loader_seen', 'true');
    return true;
  });

  const [holdingsViewMode, setHoldingsViewMode] = useState<ViewMode>('cards');

  // Sample portfolio holdings data for the interactive view-toggle demonstration
  const sampleHoldings = [
    {
      symbol: 'RELIANCE',
      name: 'Reliance Industries Ltd.',
      sector: 'Energy & Petrochemicals',
      qty: 45,
      avgBuy: 2780.0,
      currentPrice: 2984.5,
      gainPercent: +7.35,
      gainValue: +9202.5,
      allocation: 28.4,
    },
    {
      symbol: 'TCS',
      name: 'Tata Consultancy Services',
      sector: 'Technology & IT Services',
      qty: 30,
      avgBuy: 3820.0,
      currentPrice: 4120.0,
      gainPercent: +7.85,
      gainValue: +9000.0,
      allocation: 26.2,
    },
    {
      symbol: 'HDFCBANK',
      name: 'HDFC Bank Ltd.',
      sector: 'Banking & Financials',
      qty: 60,
      avgBuy: 1680.0,
      currentPrice: 1624.0,
      gainPercent: -3.33,
      gainValue: -3360.0,
      allocation: 20.6,
    },
    {
      symbol: 'LT',
      name: 'Larsen & Toubro Ltd.',
      sector: 'Infrastructure & Capital Goods',
      qty: 25,
      avgBuy: 3410.0,
      currentPrice: 3680.0,
      gainPercent: +7.91,
      gainValue: +6750.0,
      allocation: 19.5,
    },
    {
      symbol: 'TATAMOTORS',
      name: 'Tata Motors Ltd.',
      sector: 'Automobile',
      qty: 35,
      avgBuy: 940.0,
      currentPrice: 915.0,
      gainPercent: -2.66,
      gainValue: -875.0,
      allocation: 5.3,
    },
  ];

  // Market indices ticker
  const marketTickers = [
    { name: 'NIFTY 50', value: '24,834.80', change: '+142.30', pct: '+0.58%', isGain: true },
    { name: 'BSE SENSEX', value: '81,328.45', change: '+415.60', pct: '+0.51%', isGain: true },
    { name: 'NIFTY BANK', value: '51,460.10', change: '-84.20', pct: '-0.16%', isGain: false },
    { name: 'NIFTY IT', value: '41,890.35', change: '+520.10', pct: '+1.26%', isGain: true },
    { name: 'INDIA VIX', value: '12.45', change: '-0.38', pct: '-2.96%', isGain: false },
    { name: 'USD / INR', value: '83.82', change: '+0.04', pct: '+0.05%', isGain: false },
  ];

  return (
    <>
      {showLoader && <BrandLoader onComplete={() => setShowLoader(false)} minDurationMs={1100} />}

      <div className="w-full relative overflow-hidden" string-id="landing-hero" string="progress">
        {/* Top Live Indices Ticker Strip */}
        <section className="border-b border-border-warm bg-surface-warm/90 overflow-x-auto py-2.5 px-4 text-xs font-mono">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 whitespace-nowrap min-w-max">
            <div className="flex items-center gap-2 text-muted uppercase tracking-wider font-semibold text-[10px]">
              <span className="w-2 h-2 rounded-full bg-olive animate-pulse" />
              <span>NSE / BSE Real-Time Signals</span>
            </div>
            <div className="flex items-center gap-8">
              {marketTickers.map((ticker, idx) => (
                <div key={idx} className="flex items-center gap-2 tabular-nums">
                  <span className="font-semibold text-ink">{ticker.name}</span>
                  <span className="text-muted">{ticker.value}</span>
                  <span
                    className={`font-semibold flex items-center ${
                      ticker.isGain ? 'text-olive' : 'text-terracotta'
                    }`}
                  >
                    {ticker.isGain ? '▲ +' : '▼ '}
                    {ticker.pct}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HERO SECTION with Large Confident Typography matching Skill Hub */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Top Identifier Tag */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono uppercase tracking-widest font-bold bg-clay-light text-ink border border-border-warm">
              v_ 2.4.0 • Financial Intelligence
            </span>
            <span className="text-xs font-mono text-muted tracking-wider">
              INDIAN MARKET FOCUS (NSE & BSE)
            </span>
          </div>

          {/* Editorial Display Heading */}
          <div className="max-w-5xl">
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-extrabold tracking-tight text-ink leading-[0.92] uppercase">
              PORTFOLIO <br />
              <span className="text-terracotta">INTELLIGENCE</span> <br />
              WITHOUT NOISE.
            </h1>

            <p className="mt-8 text-lg sm:text-xl md:text-2xl text-muted max-w-3xl leading-relaxed font-sans font-normal">
              A deterministic decision-support tool engineered for individual Indian investors.
              Analyze concentration risk, benchmark against <strong className="text-ink font-semibold">NIFTY 50</strong>, and preview exact portfolio impact before allocating capital.
            </p>
          </div>

          {/* Action CTAs & Highlights */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/register"
              className="button-editorial button-editorial-primary text-sm py-3 px-7 flex items-center gap-2"
            >
              <span>Launch Decision Support</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <Link
              to="/dashboard"
              className="button-editorial button-editorial-secondary text-sm py-3 px-6 flex items-center gap-2"
            >
              <span>Explore Demo Dashboard</span>
            </Link>

            <div className="w-full sm:w-auto mt-2 sm:mt-0 flex items-center gap-2 text-xs font-mono text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-olive" />
              <span>No broker login or credentials required</span>
            </div>
          </div>

          {/* Editorial Statistics Grid */}
          <div className="mt-16 sm:mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 border-t border-border-warm pt-10">
            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
                [01] ENGINE TYPE
              </p>
              <p className="text-xl sm:text-2xl font-display font-bold text-ink">
                Deterministic Quant
              </p>
              <p className="text-xs text-muted">Zero black-box hallucinations</p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
                [02] BENCHMARK COUPLING
              </p>
              <p className="text-xl sm:text-2xl font-display font-bold text-ink tabular-nums">
                NIFTY 50
              </p>
              <p className="text-xs text-muted">Real beta & covariance metrics</p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
                [03] RISK CALIBRATION
              </p>
              <p className="text-xl sm:text-2xl font-display font-bold text-olive">
                Sharpe & Drawdown
              </p>
              <p className="text-xs text-muted">Calculated on authentic historicals</p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
                [04] SIGNATURE FEATURE
              </p>
              <p className="text-xl sm:text-2xl font-display font-bold text-terracotta">
                Impact Simulator
              </p>
              <p className="text-xs text-muted">What-if scenario modeling</p>
            </div>
          </div>
        </section>

        {/* INTERACTIVE HOLDINGS DEMO SECTION WITH "CHANGE VIEW" TOGGLE */}
        <section
          className="py-16 sm:py-24 border-y border-border-warm bg-surface-warm/40 relative"
          string="parallax"
          string-parallax="-0.08"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header with the signature ViewToggle */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-olive font-bold">
                  [PORTFOLIO ORCHESTRATION]
                </span>
                <h2 className="text-3xl sm:text-5xl font-display font-bold text-ink mt-2">
                  Holdings & Exposure
                </h2>
                <p className="text-sm sm:text-base text-muted max-w-xl mt-2">
                  Inspect stock weights, sector concentrations, and current valuations with our responsive dual-view interface.
                </p>
              </div>

              {/* Signature Change View Toggle */}
              <ViewToggle
                mode={holdingsViewMode}
                onChange={setHoldingsViewMode}
                label="Display mode"
                className="self-start md:self-end"
              />
            </div>

            {/* Dynamic View: Cards vs Table */}
            {holdingsViewMode === 'cards' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {sampleHoldings.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="editorial-card p-6 flex flex-col justify-between space-y-5"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-extrabold text-lg text-ink">
                              {stock.symbol}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-clay-light text-ink border border-border-warm">
                              NSE
                            </span>
                          </div>
                          <p className="text-xs text-muted mt-0.5">{stock.name}</p>
                        </div>
                        <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-surface-warm text-ink border border-border-warm">
                          {stock.allocation}%
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border-warm flex items-center justify-between text-xs">
                        <span className="text-muted">Sector</span>
                        <span className="font-medium text-ink truncate max-w-[170px]">
                          {stock.sector}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border-warm space-y-2 font-mono">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-muted">Current / Buy</span>
                        <span className="text-ink font-semibold tabular-nums">
                          ₹{stock.currentPrice.toLocaleString('en-IN')} / ₹{stock.avgBuy.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-muted">Return</span>
                        <span
                          className={`font-bold flex items-center tabular-nums ${
                            stock.gainPercent >= 0 ? 'text-olive' : 'text-terracotta'
                          }`}
                        >
                          {stock.gainPercent >= 0 ? '▲ +' : '▼ '}
                          {stock.gainPercent.toFixed(2)}% (₹{Math.abs(stock.gainValue).toLocaleString('en-IN')})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Table View */
              <div className="editorial-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="border-b border-border-warm bg-surface-warm/80 font-mono text-[11px] uppercase tracking-wider text-muted">
                        <th className="py-3.5 px-4 font-bold">Stock</th>
                        <th className="py-3.5 px-4 font-bold">Sector</th>
                        <th className="py-3.5 px-4 font-bold text-right">Holding Qty</th>
                        <th className="py-3.5 px-4 font-bold text-right">Avg Buy Price</th>
                        <th className="py-3.5 px-4 font-bold text-right">Current Price</th>
                        <th className="py-3.5 px-4 font-bold text-right">Return (P/L)</th>
                        <th className="py-3.5 px-4 font-bold text-right">Allocation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-warm font-mono">
                      {sampleHoldings.map((stock) => (
                        <tr
                          key={stock.symbol}
                          className="hover:bg-surface-warm/50 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-ink">{stock.symbol}</span>
                            <span className="block text-[10px] text-muted font-sans font-normal">
                              {stock.name}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-sans text-ink">{stock.sector}</td>
                          <td className="py-3.5 px-4 text-right text-ink tabular-nums">{stock.qty}</td>
                          <td className="py-3.5 px-4 text-right text-muted tabular-nums">
                            ₹{stock.avgBuy.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-ink tabular-nums">
                            ₹{stock.currentPrice.toLocaleString('en-IN')}
                          </td>
                          <td
                            className={`py-3.5 px-4 text-right font-bold tabular-nums ${
                              stock.gainPercent >= 0 ? 'text-olive' : 'text-terracotta'
                            }`}
                          >
                            {stock.gainPercent >= 0 ? '▲ +' : '▼ '}
                            {stock.gainPercent.toFixed(2)}%
                            <span className="block text-[10px] font-normal">
                              ({stock.gainValue >= 0 ? '+' : '-'}₹
                              {Math.abs(stock.gainValue).toLocaleString('en-IN')})
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-ink tabular-nums">
                            {stock.allocation}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SIGNATURE FEATURE: PORTFOLIO IMPACT ANALYSIS SCENARIO */}
        <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-5 space-y-6">
              <span className="px-2.5 py-1 rounded-full text-xs font-mono uppercase tracking-widest font-bold bg-terracotta-light text-terracotta border border-terracotta/20">
                Signature Feature
              </span>

              <h2 className="text-3xl sm:text-5xl font-display font-bold text-ink leading-tight">
                Portfolio Impact Analysis.
              </h2>

              <p className="text-sm sm:text-base text-muted leading-relaxed">
                Before purchasing a stock, see exactly how adding it reshapes your portfolio risk, sector concentration, Sharpe ratio, and volatility.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-olive shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-ink font-medium">
                    Calculates before-and-after sector skew (prevents overweighting financials or IT).
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-olive shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-ink font-medium">
                    Simulates volatility and beta shifts relative to NIFTY 50.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-olive shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-ink font-medium">
                    Clearly labelled as a mathematical scenario, never a return promise.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to="/recommendations"
                  className="button-editorial button-editorial-olive text-xs py-2.5 px-6 flex items-center gap-1.5"
                >
                  <span>Test Impact Engine</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Interactive Scenario Simulation Card */}
            <div className="lg:col-span-7">
              <div className="editorial-card p-6 sm:p-8 bg-white border border-border-warm space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-border-warm pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted tracking-wider">
                      Hypothetical Scenario
                    </span>
                    <h3 className="text-lg font-display font-bold text-ink">
                      Adding 40 Shares of LTIMindtree (LTIM.NS)
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-mustard-light text-mustard-hover border border-mustard/30 text-xs font-mono font-bold">
                    +₹2,10,000 Allocation
                  </span>
                </div>

                {/* Before vs After Quantitative Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                  <div className="p-3.5 rounded-lg bg-surface-warm border border-border-warm space-y-1">
                    <span className="text-[10px] text-muted uppercase">Portfolio Beta</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-muted line-through">0.94</span>
                      <span className="text-base font-bold text-terracotta">1.08</span>
                    </div>
                    <span className="text-[10px] text-terracotta font-semibold">▲ +0.14 vs Nifty</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-surface-warm border border-border-warm space-y-1">
                    <span className="text-[10px] text-muted uppercase">Annual Volatility</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-muted line-through">14.2%</span>
                      <span className="text-base font-bold text-terracotta">16.1%</span>
                    </div>
                    <span className="text-[10px] text-terracotta font-semibold">▲ Higher Fluctuation</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-surface-warm border border-border-warm space-y-1">
                    <span className="text-[10px] text-muted uppercase">Sharpe Ratio</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-muted line-through">1.42</span>
                      <span className="text-base font-bold text-olive">1.48</span>
                    </div>
                    <span className="text-[10px] text-olive font-semibold">▲ Improved Return/Unit</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-surface-warm border border-border-warm space-y-1">
                    <span className="text-[10px] text-muted uppercase">Risk Rating</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-muted line-through">Moderate</span>
                      <span className="text-base font-bold text-ink">Moderate+</span>
                    </div>
                    <span className="text-[10px] text-muted">Sector Tilt Alert</span>
                  </div>
                </div>

                {/* Sector Allocation Comparison Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted">Technology Sector Weight Shift</span>
                    <span className="text-ink font-semibold">26.2% ➔ 34.8%</span>
                  </div>
                  <div className="w-full h-3 bg-surface-warm rounded-full overflow-hidden flex border border-border-warm">
                    <div className="h-full bg-olive" style={{ width: '26.2%' }} title="Current Tech" />
                    <div className="h-full bg-terracotta animate-pulse" style={{ width: '8.6%' }} title="Additional Exposure" />
                    <div className="h-full bg-clay" style={{ width: '65.2%' }} title="Other Sectors" />
                  </div>
                  <p className="text-[11px] text-muted font-mono">
                    Warning: Concentration in IT Services will surpass the 30% recommended ceiling.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FULL CAPABILITY PILLARS */}
        <section className="py-16 sm:py-24 border-t border-border-warm bg-surface-warm/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-12">
              <span className="text-xs font-mono uppercase tracking-widest text-terracotta font-bold">
                [SYSTEM CAPABILITIES]
              </span>
              <h2 className="text-3xl sm:text-5xl font-display font-bold text-ink mt-2">
                Built for the Discerning Indian Investor
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="editorial-card p-6 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-terracotta-light text-terracotta flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-display font-bold text-ink">
                  Deterministic Quantitative Engine
                </h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  Real formulas for Sharpe Ratio, Beta vs NIFTY 50, Maximum Drawdown, and Volatility. Metrics only show if data supports them properly—no fabricated statistics.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="editorial-card p-6 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-olive-light text-olive flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-display font-bold text-ink">
                  Explainable Risk Profiling
                </h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  Evaluates concentration, sector skew, volatility, and your investor risk category (Conservative, Moderate, Aggressive) with plain-English rationales.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="editorial-card p-6 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-mustard-light text-mustard-hover flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-display font-bold text-ink">
                  Institutional PDF Reports
                </h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  Generate comprehensive web and downloadable PDF executive reports summarizing holdings, sector breakdowns, risk flags, and scenario tests with Supabase Storage tracking.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section className="py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs font-mono uppercase tracking-widest text-olive font-bold">
            [READY FOR CLARITY?]
          </span>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold text-ink uppercase leading-tight">
            Stop Guessing. <br />
            Quantify Your Portfolio Today.
          </h2>
          <p className="text-base sm:text-lg text-muted max-w-xl mx-auto">
            Create your account in 30 seconds. No broker account permissions, no sensitive credentials, no hidden subscriptions.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="button-editorial button-editorial-primary text-sm py-3 px-8 flex items-center gap-2"
            >
              <span>Create Free Account</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="button-editorial button-editorial-secondary text-sm py-3 px-7"
            >
              <span>Investor Sign In</span>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};
