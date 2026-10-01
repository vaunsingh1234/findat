import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePortfolios } from '../hooks/usePortfolio';
import { usePortfolioAnalytics } from '../hooks/usePortfolioAnalytics';
import { useRiskAnalysis } from '../hooks/useRiskAnalysis';
import { reportService, type GeneratedReport } from '../services/reportService';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { portfolios } = usePortfolios(user?.id);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('demo');
  const [isExporting, setIsExporting] = useState(false);
  const [activeReport, setActiveReport] = useState<GeneratedReport | null>(null);

  useEffect(() => {
    if (portfolios.length > 0 && selectedPortfolioId === 'demo') {
      setSelectedPortfolioId(portfolios[0].id);
    }
  }, [portfolios, selectedPortfolioId]);

  const { analytics, holdings } = usePortfolioAnalytics(selectedPortfolioId, '1Y');
  const { riskData } = useRiskAnalysis(selectedPortfolioId, '1Y');

  const selectedPortfolioName =
    portfolios.find((p) => p.id === selectedPortfolioId)?.name || 'Sample Indian Equity Portfolio';

  // Compile active report whenever analytics or riskData updates
  useEffect(() => {
    if (analytics && riskData) {
      const rep = reportService.generateReport(
        user?.id || 'guest',
        selectedPortfolioId,
        selectedPortfolioName,
        analytics,
        riskData
      );
      setActiveReport(rep);
    }
  }, [analytics, riskData, selectedPortfolioId, selectedPortfolioName, user?.id]);

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const filename = `FinDat-Report-${selectedPortfolioName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      await reportService.exportReportToPDF('findat-printable-report', filename);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const perf = analytics?.performance || {
    totalInvested: 0,
    currentValue: 0,
    absoluteProfitLoss: 0,
    overallReturnPercent: 0,
  };

  const isGain = perf.absoluteProfitLoss >= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-ink">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-warm pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-widest text-olive font-bold">
              [EXECUTIVE INTELLIGENCE]
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-olive animate-pulse" />
            <span className="text-[11px] font-mono text-muted">Publication Grade Reports</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink tracking-tight">
            Portfolio Intelligence Reports
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Generate and export structured executive analysis, risk profile calibration, and holding distributions.
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

          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-warm-cream text-xs font-mono font-bold hover:bg-ink/90 transition-colors shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border-warm text-ink text-xs font-mono font-semibold hover:bg-warm-cream transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div
        id="findat-printable-report"
        className="rounded-3xl border border-border-warm bg-surface p-8 sm:p-12 space-y-10 shadow-sm print:border-none print:shadow-none print:p-0"
      >
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-border-warm pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-terracotta flex items-center justify-center text-warm-cream font-display font-extrabold text-sm">
                F
              </span>
              <span className="font-display font-black text-2xl tracking-tight text-ink">
                Fin<span className="text-terracotta">Dat</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-olive-light text-olive font-bold border border-olive/20">
                NSE / BSE Verified
              </span>
            </div>
            <h2 className="text-2xl font-display font-bold text-ink pt-2">{selectedPortfolioName}</h2>
            <p className="text-xs font-mono text-muted">
              Report Generated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="text-right text-xs font-mono text-muted space-y-1">
            <p>Investor ID: <span className="text-ink font-semibold">{user?.email || 'Demo Investor'}</span></p>
            <p>Risk Profile: <span className="text-ink font-semibold">{riskData?.profileComparison?.userRiskProfile || 'Moderate'}</span></p>
            <p>Exchange Standard: <span className="text-ink font-semibold">NSE India Equities</span></p>
          </div>
        </div>

        {/* 1. Executive Summary Cards */}
        <section className="space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
            1. Executive Portfolio Valuation
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1">
              <span className="text-[10px] uppercase text-muted block">Current Value</span>
              <p className="text-xl sm:text-2xl font-bold text-ink">
                ₹{perf.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-muted">Mark-to-market</span>
            </div>

            <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1">
              <span className="text-[10px] uppercase text-muted block">Invested Capital</span>
              <p className="text-xl sm:text-2xl font-bold text-ink">
                ₹{perf.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-muted">Cost basis</span>
            </div>

            <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1">
              <span className="text-[10px] uppercase text-muted block">Unrealized P/L</span>
              <p className={`text-xl sm:text-2xl font-bold ${isGain ? 'text-olive' : 'text-terracotta'}`}>
                {isGain ? '+' : ''}₹{perf.absoluteProfitLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-muted">Absolute monetary</span>
            </div>

            <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1">
              <span className="text-[10px] uppercase text-muted block">Total Return %</span>
              <p className={`text-xl sm:text-2xl font-bold ${isGain ? 'text-olive' : 'text-terracotta'}`}>
                {isGain ? '+' : ''}{perf.overallReturnPercent.toFixed(2)}%
              </p>
              <span className="text-[10px] text-muted">Holding return</span>
            </div>
          </div>
        </section>

        {/* 2. Quantitative Risk Calibration Summary */}
        <section className="space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
            2. Quantitative Risk Profile
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1">
              <span className="text-[10px] uppercase text-muted block">Risk Score</span>
              <p className="text-xl font-bold text-ink">{riskData?.overallRiskScore || 0} / 100</p>
              <span className="text-[10px] font-bold text-terracotta">{riskData?.riskCategory}</span>
            </div>

            <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1">
              <span className="text-[10px] uppercase text-muted block">Annual Volatility</span>
              <p className="text-xl font-bold text-ink">
                {riskData?.volatility !== null && riskData?.volatility !== undefined ? `${riskData.volatility}%` : '—'}
              </p>
              <span className="text-[10px] text-muted">√252 annualized</span>
            </div>

            <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1">
              <span className="text-[10px] uppercase text-muted block">Market Beta (β)</span>
              <p className="text-xl font-bold text-ink">
                {riskData?.beta !== null && riskData?.beta !== undefined ? riskData.beta : '—'}
              </p>
              <span className="text-[10px] text-muted">vs NIFTY 50 Index</span>
            </div>

            <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-1">
              <span className="text-[10px] uppercase text-muted block">Max Drawdown</span>
              <p className="text-xl font-bold text-terracotta">
                {riskData?.maxDrawdown !== null && riskData?.maxDrawdown !== undefined ? `${riskData.maxDrawdown}%` : '—'}
              </p>
              <span className="text-[10px] text-muted">Peak-to-trough</span>
            </div>
          </div>
        </section>

        {/* 3. Detailed Holdings Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
              3. Current Equity Holdings ({analytics?.holdings.length || 0})
            </h3>
            <span className="text-xs font-mono text-muted">Valued at Live LTP</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border border-border-warm rounded-2xl overflow-hidden">
              <thead className="bg-warm-cream/70 text-muted uppercase text-[10px]">
                <tr className="border-b border-border-warm">
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Buy Price</th>
                  <th className="py-3 px-4 text-right">Current LTP</th>
                  <th className="py-3 px-4 text-right">Current Value</th>
                  <th className="py-3 px-4 text-right">P/L (Gain/Loss)</th>
                  <th className="py-3 px-4 text-right">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm/60">
                {analytics?.holdings && analytics.holdings.length > 0 ? (
                  analytics.holdings.map((h) => {
                    const isHGain = h.profitLoss >= 0;
                    return (
                      <tr key={h.symbol} className="hover:bg-warm-cream/30">
                        <td className="py-3 px-4">
                          <span className="font-bold text-ink block">{h.symbol}</span>
                          <span className="text-[10px] font-sans text-muted truncate block max-w-xs">{h.companyName}</span>
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums">{h.quantity}</td>
                        <td className="py-3 px-4 text-right tabular-nums">₹{h.purchasePrice.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-bold">₹{h.currentPrice.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-bold">₹{h.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 px-4 text-right tabular-nums font-bold ${isHGain ? 'text-olive' : 'text-terracotta'}`}>
                          {isHGain ? '+' : ''}₹{h.profitLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({h.returnPercent.toFixed(2)}%)
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-bold text-ink">{h.allocationPercent.toFixed(1)}%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted font-mono">
                      No active equity positions in this portfolio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Sector Allocation Breakdown */}
        <section className="space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
            4. Sector Allocation Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            {analytics?.sectorAllocation && analytics.sectorAllocation.length > 0 ? (
              analytics.sectorAllocation.map((s) => (
                <div key={s.sector} className="p-3 rounded-xl bg-warm-cream/50 border border-border-warm space-y-1">
                  <span className="text-ink font-semibold truncate block">{s.sector}</span>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted">₹{(s.value / 1000).toFixed(0)}k</span>
                    <span className="font-bold text-ink">{s.allocationPercent.toFixed(1)}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-4 p-4 text-center text-muted font-mono">No sector exposure data available.</div>
            )}
          </div>
        </section>

        {/* 5. Key Portfolio Observations */}
        {activeReport?.observations && activeReport.observations.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
              5. Quantitative Portfolio Observations
            </h3>
            <div className="p-4 rounded-2xl bg-warm-cream/50 border border-border-warm space-y-2 text-xs font-sans text-muted leading-relaxed">
              {activeReport.observations.map((obs, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-olive shrink-0 mt-0.5" />
                  <p>{obs}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Compliance Footer */}
        <div className="pt-6 border-t border-border-warm text-center text-[10px] font-mono text-muted space-y-1">
          <p>
            FinDat Portfolio Intelligence Platform &copy; {new Date().getFullYear()}. All financial figures derived from actual Indian securities quotes and historical closing sessions.
          </p>
          <p>
            This document is generated for informational decision-support purposes and does not constitute SEBI registered investment advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
