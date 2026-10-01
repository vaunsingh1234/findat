import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Plus,
  Building2,
  PieChart as PieIcon,
  Layers,
  Sparkles,
  AlertCircle,
  Compass,
  Trash2,
  Pencil,
  X,
  Check,
  Search,
  BarChart3,
  FolderPlus,
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
import { portfolioService } from '../services/portfolioService';
import { stockService } from '../services/stockService';
import type { AnalyticsHistoryRange, HoldingPerformance } from '../types/analytics';

export const PortfolioPage: React.FC = () => {
  const { user } = useAuth();
  const { portfolios, refetch: refetchPortfolios } = usePortfolios(user?.id);

  // Selected portfolio state
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('demo');
  const [activeRange, setActiveRange] = useState<AnalyticsHistoryRange>('1Y');

  // Add Holding Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSymbol, setAddSymbol] = useState('');
  const [addQuantity, setAddQuantity] = useState<number>(10);
  const [addPrice, setAddPrice] = useState<number>(1000);
  const [addDate, setAddDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Autocomplete suggestions for Add Holding
  const [symbolSuggestions, setSymbolSuggestions] = useState<
    Array<{ symbol: string; companyName: string; exchange: string }>
  >([]);
  const [selectedStockName, setSelectedStockName] = useState<string>('');

  // Edit Holding Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<HoldingPerformance | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editPrice, setEditPrice] = useState<number>(1000);
  const [editDate, setEditDate] = useState<string>('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingHolding, setDeletingHolding] = useState<HoldingPerformance | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  // Feedback Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Portfolio Modal State
  const [isNewPortfolioModalOpen, setIsNewPortfolioModalOpen] = useState(false);
  const [newPortfolioNameInput, setNewPortfolioNameInput] = useState('');
  const [newPortfolioSubmitting, setNewPortfolioSubmitting] = useState(false);

  // Sync selected portfolio when user portfolios load
  useEffect(() => {
    if (portfolios.length > 0 && selectedPortfolioId === 'demo') {
      setSelectedPortfolioId(portfolios[0].id);
    }
  }, [portfolios, selectedPortfolioId]);

  // Execute analytical calculations via hook
  const { analytics, loading, error, isDemoData, refetch } = usePortfolioAnalytics(
    selectedPortfolioId,
    activeRange
  );

  // Cross-component listener for portfolio and holdings mutations
  useEffect(() => {
    const handlePortfolioChange = () => {
      refetchPortfolios();
      refetch();
    };
    window.addEventListener('findat_portfolio_changed', handlePortfolioChange);
    return () => window.removeEventListener('findat_portfolio_changed', handlePortfolioChange);
  }, [refetchPortfolios, refetch]);

  const handleCreateNewPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPortfolioNameInput.trim();
    if (!name) return;

    setNewPortfolioSubmitting(true);
    try {
      const newPort = await portfolioService.createPortfolio(user?.id || 'guest', name);
      refetchPortfolios();
      setSelectedPortfolioId(newPort.id);
      setIsNewPortfolioModalOpen(false);
      setNewPortfolioNameInput('');
      setToastMessage(`Created new portfolio "${name}".`);
    } catch (err: unknown) {
      console.error('Failed creating portfolio:', err);
    } finally {
      setNewPortfolioSubmitting(false);
    }
  };

  // Debounced Stock Symbol Autocomplete
  useEffect(() => {
    const q = addSymbol.trim();
    if (q.length < 2) {
      setSymbolSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const matches = await stockService.searchStocks(q, 5);
        setSymbolSuggestions(
          matches.map((m) => ({
            symbol: m.symbol,
            companyName: m.company_name,
            exchange: m.exchange || 'NSE',
          }))
        );
      } catch {
        setSymbolSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [addSymbol]);

  // Handle selecting a stock from the autocomplete list
  const handleSelectSuggestion = async (item: { symbol: string; companyName: string }) => {
    setAddSymbol(item.symbol);
    setSelectedStockName(item.companyName);
    setSymbolSuggestions([]);

    try {
      const quote = await stockService.getQuote(item.symbol);
      if (quote && quote.currentPrice > 0) {
        setAddPrice(quote.currentPrice);
      }
    } catch {}
  };

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSym = addSymbol.trim().toUpperCase();
    if (!cleanSym || addQuantity <= 0 || addPrice <= 0) {
      setAddError('Please enter a valid stock symbol, positive quantity, and buy price.');
      return;
    }

    setIsSubmitting(true);
    setAddError(null);

    try {
      let targetPortId = selectedPortfolioId;
      if (targetPortId === 'demo') {
        if (!user) {
          // If guest, create a local guest portfolio
          const newPort = await portfolioService.createPortfolio('guest', 'My Indian Equity Portfolio');
          targetPortId = newPort.id;
          setSelectedPortfolioId(newPort.id);
          refetchPortfolios();
        } else {
          const newPort = await portfolioService.createPortfolio(user.id, 'My Indian Equity Portfolio');
          targetPortId = newPort.id;
          setSelectedPortfolioId(newPort.id);
          refetchPortfolios();
        }
      }

      await portfolioService.addHolding(
        targetPortId,
        cleanSym,
        Number(addQuantity),
        Number(addPrice),
        addDate
      );

      setAddSuccess(true);
      setToastMessage(`Added ${addQuantity} shares of ${cleanSym} to your portfolio.`);
      refetch();

      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddSuccess(false);
        setAddSymbol('');
        setSelectedStockName('');
        setAddQuantity(10);
      }, 1000);
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add holding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (h: HoldingPerformance) => {
    setEditingHolding(h);
    setEditQuantity(h.quantity);
    setEditPrice(h.purchasePrice);
    setEditDate(h.purchaseDate || new Date().toISOString().split('T')[0]);
    setEditError(null);
    setEditSuccess(false);
    setIsEditModalOpen(true);
  };

  const handleUpdateHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHolding) return;

    if (editQuantity <= 0 || editPrice <= 0) {
      setEditError('Quantity and buy price must be greater than zero.');
      return;
    }

    setIsEditSubmitting(true);
    setEditError(null);

    try {
      await portfolioService.updateHolding(
        editingHolding.id,
        {
          quantity: Number(editQuantity),
          purchase_price: Number(editPrice),
          purchase_date: editDate,
        },
        selectedPortfolioId
      );

      setEditSuccess(true);
      setToastMessage(`Updated ${editingHolding.symbol} holding successfully.`);
      refetch();

      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditSuccess(false);
        setEditingHolding(null);
      }, 1000);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update holding');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const openDeleteModal = (h: HoldingPerformance) => {
    setDeletingHolding(h);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteHolding = async () => {
    if (!deletingHolding) return;
    setIsDeleteSubmitting(true);

    try {
      await portfolioService.deleteHolding(deletingHolding.id, selectedPortfolioId);
      setToastMessage(`Removed ${deletingHolding.symbol} from your portfolio.`);
      refetch();
      setIsDeleteModalOpen(false);
      setDeletingHolding(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  // Guard: Loading State
  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-warm-cream py-16 px-4 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-terracotta border-t-transparent rounded-full animate-spin" />
        <div className="text-center space-y-1">
          <p className="font-display font-bold text-lg text-ink">Calculating Portfolio Valuations</p>
          <p className="font-mono text-xs text-muted">Retrieving live Indian market quotes and cost-basis returns...</p>
        </div>
      </div>
    );
  }

  // Guard: Error State
  if (error && !analytics) {
    return (
      <div className="min-h-screen bg-warm-cream py-16 px-4">
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-surface border border-border-warm text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-terracotta mx-auto" />
          <h2 className="text-2xl font-display font-bold text-ink">Unable to Load Portfolio</h2>
          <p className="text-sm text-muted">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 rounded-xl bg-ink text-warm-cream text-xs font-semibold hover:bg-ink/90 transition-colors"
          >
            Retry Computation
          </button>
        </div>
      </div>
    );
  }

  const { performance, holdings, stockAllocation, sectorAllocation, history, availableRanges, risk: _risk, correlation: _correlation } =
    analytics || {
      performance: {
        totalInvested: 0,
        currentValue: 0,
        absoluteProfitLoss: 0,
        overallReturnPercent: 0,
        dailyChange: 0,
        dailyChangePercent: 0,
      },
      holdings: [],
      stockAllocation: [],
      sectorAllocation: [],
      history: [],
      availableRanges: ['1M'],
      risk: {
        volatility: null,
        sharpeRatio: null,
        beta: null,
        maxDrawdown: null,
        diversificationScore: 0,
        diversificationTier: 'Concentrated',
        diversificationExplanation: 'No data',
      },
      correlation: { symbols: [], matrix: {}, isAvailable: false },
    };

  const isProfit = performance.absoluteProfitLoss >= 0;
  const isDailyGain = performance.dailyChange >= 0;

  return (
    <div className="min-h-screen bg-warm-cream py-10 px-4 sm:px-6 lg:px-8 text-ink">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Top Header & Portfolio Switcher */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-warm pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-olive font-bold">
                [PORTFOLIO OVERVIEW]
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-olive animate-pulse" />
              <span className="text-[11px] font-mono text-muted">NSE / BSE Multi-Asset Suite</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink tracking-tight">
              Portfolio Management
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Live mark-to-market valuation, holding-wise performance, and asset diversification.
            </p>
          </div>

          {/* Action Row: Portfolio Selector + New Portfolio + Add Holding Button */}
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
                <option value="demo">Sample Nifty Bluechip Portfolio</option>
              </select>
            )}

            <button
              type="button"
              onClick={() => setIsNewPortfolioModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface hover:bg-surface-warm border border-border-warm text-ink font-display font-semibold text-xs transition-colors shadow-xs cursor-pointer"
              title="Create a new portfolio"
            >
              <FolderPlus className="w-4 h-4 text-terracotta" />
              <span className="hidden sm:inline">New Portfolio</span>
            </button>

            <button
              onClick={() => {
                setAddError(null);
                setAddSuccess(false);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-terracotta text-warm-cream font-display font-semibold text-xs hover:bg-terracotta-hover transition-colors shadow-xs active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Holding
            </button>
          </div>
        </div>

        {/* Demo Data Notice Banner if displaying sample benchmark portfolio */}
        {isDemoData && (
          <div className="rounded-2xl border border-mustard/40 bg-mustard-light/50 p-4 flex items-center justify-between text-xs font-mono text-ink gap-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-mustard-hover shrink-0" />
              <span>
                Displaying <strong>Sample Nifty Bluechip Portfolio</strong> (Reliance, TCS, HDFC Bank, Infosys, Tata Motors). Add custom holdings or edit positions to track personal investments.
              </span>
            </div>
            <button
              onClick={() => {
                setAddError(null);
                setAddSuccess(false);
                setIsAddModalOpen(true);
              }}
              className="underline font-bold text-mustard-hover hover:text-ink whitespace-nowrap"
            >
              Add First Stock
            </button>
          </div>
        )}

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-ink text-warm-cream text-xs font-mono shadow-2xl flex items-center gap-3 border border-border-warm animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-olive" />
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-muted hover:text-warm-cream p-1 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 1. Dashboard Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Invested */}
          <div className="editorial-card p-5 space-y-2 bg-surface">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
              Total Invested
            </span>
            <p className="text-2xl sm:text-3xl font-display font-black text-ink tabular-nums">
              ₹{performance.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <div className="text-[11px] font-mono text-muted flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>{holdings.length} Active Positions</span>
            </div>
          </div>

          {/* Current Portfolio Value */}
          <div className="editorial-card p-5 space-y-2 bg-surface">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
              Current Portfolio Value
            </span>
            <p className="text-2xl sm:text-3xl font-display font-black text-ink tabular-nums">
              ₹{performance.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <div className="text-[11px] font-mono text-olive font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-olive animate-pulse" />
              <span>Live Mark-to-Market</span>
            </div>
          </div>

          {/* Absolute Profit/Loss */}
          <div className="editorial-card p-5 space-y-2 bg-surface">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
              Total Profit / Loss
            </span>
            <p
              className={`text-2xl sm:text-3xl font-display font-black tabular-nums ${
                isProfit ? 'text-olive' : 'text-terracotta'
              }`}
            >
              {isProfit ? '+₹' : '-₹'}
              {Math.abs(performance.absoluteProfitLoss).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              })}
            </p>
            <div className="text-[11px] font-mono text-muted">
              Cumulative Unrealized Gain
            </div>
          </div>

          {/* Overall Return % */}
          <div className="editorial-card p-5 space-y-2 bg-surface">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
              Overall Return %
            </span>
            <div className="flex items-center gap-2">
              <p
                className={`text-2xl sm:text-3xl font-display font-black tabular-nums ${
                  isProfit ? 'text-olive' : 'text-terracotta'
                }`}
              >
                {isProfit ? '+' : ''}
                {performance.overallReturnPercent.toFixed(2)}%
              </p>
            </div>
            <div className="text-[11px] font-mono text-muted flex items-center gap-1">
              {isProfit ? <TrendingUp className="w-3.5 h-3.5 text-olive" /> : <TrendingDown className="w-3.5 h-3.5 text-terracotta" />}
              <span>Time-weighted ROI</span>
            </div>
          </div>

          {/* Daily Change */}
          <div className="editorial-card p-5 space-y-2 bg-surface">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
              Today's Change
            </span>
            <p
              className={`text-2xl sm:text-3xl font-display font-black tabular-nums ${
                isDailyGain ? 'text-olive' : 'text-terracotta'
              }`}
            >
              {isDailyGain ? '+₹' : '-₹'}
              {Math.abs(performance.dailyChange).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              })}
            </p>
            <div className="text-[11px] font-mono font-semibold flex items-center gap-1">
              <span className={isDailyGain ? 'text-olive' : 'text-terracotta'}>
                {isDailyGain ? '▲ +' : '▼ '}
                {performance.dailyChangePercent.toFixed(2)}%
              </span>
              <span className="text-muted font-normal">Session Move</span>
            </div>
          </div>
        </section>

        {/* Empty Portfolio State (When user has 0 holdings) */}
        {holdings.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border-warm bg-surface p-12 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-warm-cream border border-border-warm flex items-center justify-center mx-auto text-muted">
              <Layers className="w-8 h-8 text-terracotta" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-xl font-display font-bold text-ink">Your Portfolio is Empty</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Add your first Indian equity holding to track real-time valuations, cost basis, profit/loss, and portfolio allocation.
              </p>
            </div>
            <div>
              <button
                onClick={() => {
                  setAddError(null);
                  setAddSuccess(false);
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-terracotta text-warm-cream font-display font-semibold text-sm hover:bg-terracotta-hover transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add Your First Holding
              </button>
            </div>
          </div>
        )}

        {/* 2. Portfolio Timeline Chart & Allocation Donut */}
        {holdings.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Historical Mark-to-Market Valuation Area Chart (8 cols) */}
            <section className="lg:col-span-8 rounded-3xl border border-border-warm bg-surface p-6 sm:p-8 space-y-6 shadow-xs flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-warm pb-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-terracotta" /> Historical Portfolio Valuation
                  </h3>
                  <p className="text-xs text-muted font-normal">
                    Aggregate mark-to-market progression over historical trading sessions.
                  </p>
                </div>

                {/* Range Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {(['1W', '1M', '6M', '1Y', '5Y'] as AnalyticsHistoryRange[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setActiveRange(r)}
                      disabled={!availableRanges.includes(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        activeRange === r
                          ? 'bg-ink text-warm-cream shadow-xs'
                          : availableRanges.includes(r)
                          ? 'bg-warm-cream text-muted hover:text-ink hover:bg-surface-warm'
                          : 'opacity-30 cursor-not-allowed text-muted bg-warm-cream'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area Chart Container */}
              <div className="w-full h-72 sm:h-80 pt-2">
                {history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="portValuationGradient" x1="0" y1="0" x2="0" y2="1">
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
                        domain={['auto', 'auto']}
                        stroke="#7A6B55"
                        fontSize={11}
                        tickLine={false}
                        orientation="right"
                        tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="bg-surface/95 backdrop-blur-md p-3.5 rounded-xl border border-border-warm shadow-md text-xs font-mono space-y-1">
                              <p className="text-muted font-sans font-semibold">{data.date}</p>
                              <p className="text-ink font-bold text-sm">
                                Valuation: ₹{data.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-muted text-[11px]">
                                Invested Base: ₹{data.invested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#D9633B"
                        strokeWidth={2.5}
                        fill="url(#portValuationGradient)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs font-mono text-muted">
                    No historical chart points available for this range.
                  </div>
                )}
              </div>
            </section>

            {/* Asset Allocation Donut Chart (4 cols) */}
            <section className="lg:col-span-4 rounded-3xl border border-border-warm bg-surface p-6 sm:p-8 space-y-5 shadow-xs flex flex-col justify-between">
              <div className="border-b border-border-warm pb-3">
                <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-olive" />
                  <span>Portfolio Asset Allocation</span>
                </h3>
                <p className="text-xs text-muted">Capital distribution by holding</p>
              </div>

              {/* Pie Container */}
              <div className="w-full h-52 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockAllocation}
                      dataKey="value"
                      nameKey="symbol"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {stockAllocation.map((entry) => (
                        <Cell key={entry.symbol} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const item = payload[0].payload;
                        return (
                          <div className="bg-surface p-2.5 rounded-lg border border-border-warm shadow-md text-xs font-mono">
                            <p className="font-bold text-ink">{item.symbol}</p>
                            <p className="text-muted">₹{item.value.toLocaleString('en-IN')}</p>
                            <p className="text-terracotta font-semibold">{item.allocationPercent}% weight</p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-display font-black text-2xl text-ink">
                    {stockAllocation.length}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-muted">Assets</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar text-xs font-mono">
                {stockAllocation.map((item) => (
                  <div key={item.symbol} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <Link
                        to={`/stocks/${item.symbol}`}
                        className="font-bold text-ink hover:text-terracotta truncate transition-colors"
                      >
                        {item.symbol}
                      </Link>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-ink font-bold">{item.allocationPercent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* 3. Holdings Table (Requirement 3) */}
        {holdings.length > 0 && (
          <section className="rounded-3xl border border-border-warm bg-surface p-6 sm:p-8 space-y-6 shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-warm pb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-olive" /> Holding-wise Performance
                </h3>
                <p className="text-xs text-muted font-normal">
                  Real-time stock values, purchase cost basis, profit/loss, and portfolio allocation weight.
                </p>
              </div>
              <span className="text-xs font-mono text-muted">
                {holdings.length} total equity lots
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-border-warm text-muted uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Symbol</th>
                    <th className="py-3 px-4 text-center">Quantity</th>
                    <th className="py-3 px-4 text-right">Avg. Buy Price</th>
                    <th className="py-3 px-4 text-right">Current Price</th>
                    <th className="py-3 px-4 text-right">Invested Value</th>
                    <th className="py-3 px-4 text-right">Current Value</th>
                    <th className="py-3 px-4 text-right">P/L</th>
                    <th className="py-3 px-4 text-center">P/L %</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm/60">
                  {holdings.map((h: HoldingPerformance) => {
                    const isHoldingGain = h.profitLoss >= 0;
                    return (
                      <tr key={h.id} className="hover:bg-warm-cream/40 transition-colors">
                        {/* 1. Stock / Company Name */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-display font-semibold text-sm text-ink truncate">
                            {h.companyName}
                          </div>
                          {h.sector && (
                            <span className="text-[10px] text-muted font-mono block">
                              {h.sector}
                            </span>
                          )}
                        </td>

                        {/* 2. Symbol */}
                        <td className="py-3.5 px-4">
                          <Link
                            to={`/stocks/${h.symbol}`}
                            className="font-bold text-sm text-ink hover:text-terracotta transition-colors inline-flex items-center gap-1 group"
                          >
                            <span>{h.symbol}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </td>

                        {/* 3. Quantity */}
                        <td className="py-3.5 px-4 text-center font-bold text-ink">
                          {h.quantity}
                        </td>

                        {/* 4. Avg. Buy Price */}
                        <td className="py-3.5 px-4 text-right font-medium text-ink">
                          ₹{h.purchasePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* 5. Current Price */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-bold text-ink">
                            ₹{h.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <span className="text-[10px] text-muted block">Live Session</span>
                        </td>

                        {/* 6. Invested Value */}
                        <td className="py-3.5 px-4 text-right font-semibold text-ink">
                          ₹{h.investedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* 7. Current Value */}
                        <td className="py-3.5 px-4 text-right font-bold text-ink">
                          ₹{h.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* 8. P/L */}
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`font-bold ${
                              isHoldingGain ? 'text-olive' : 'text-terracotta'
                            }`}
                          >
                            {isHoldingGain ? '+₹' : '-₹'}
                            {Math.abs(h.profitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* 9. P/L % */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-bold ${
                              isHoldingGain
                                ? 'bg-olive-light text-olive'
                                : 'bg-terracotta-light text-terracotta'
                            }`}
                          >
                            {isHoldingGain ? '▲ +' : '▼ '}
                            {h.returnPercent.toFixed(2)}%
                          </span>
                        </td>

                        {/* 10. Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(h)}
                              title="Edit holding"
                              className="p-1.5 text-muted hover:text-ink transition-colors rounded-lg hover:bg-warm-cream"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(h)}
                              title="Delete holding"
                              className="p-1.5 text-muted hover:text-terracotta transition-colors rounded-lg hover:bg-warm-cream"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 4. Sector Allocation Breakdown */}
        {holdings.length > 0 && sectorAllocation.length > 0 && (
          <section className="rounded-3xl border border-border-warm bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="border-b border-border-warm pb-4">
              <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
                <Compass className="w-5 h-5 text-terracotta" /> Sector Allocation Breakdown
              </h3>
              <p className="text-xs text-muted font-normal">
                Distribution of invested capital across primary Indian industry sectors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectorAllocation.map((item) => (
                <div
                  key={item.sector}
                  className="p-4 rounded-2xl bg-warm-cream/60 border border-border-warm/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-sm text-ink truncate">
                      {item.sector}
                    </span>
                    <span className="font-mono font-bold text-xs text-terracotta">
                      {item.allocationPercent}%
                    </span>
                  </div>
                  {/* Progress Line */}
                  <div className="w-full h-2 rounded-full bg-border-warm overflow-hidden">
                    <div
                      className="h-full bg-terracotta rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, item.allocationPercent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-mono text-muted">
                    <span>Valuation</span>
                    <span className="font-semibold text-ink">
                      ₹{item.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Add Holding Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface rounded-3xl border border-border-warm p-6 sm:p-8 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-muted hover:text-ink p-1 rounded-full hover:bg-warm-cream transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-terracotta-light text-terracotta font-bold">
                Portfolio Management
              </div>
              <h3 className="text-2xl font-display font-extrabold text-ink">
                Add Stock Holding
              </h3>
              <p className="text-xs text-muted">
                Track buy price, mark-to-market valuation, and profit/loss.
              </p>
            </div>

            {addSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-olive-light text-olive mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-display font-bold text-lg text-ink">Holding Successfully Added</h4>
                <p className="text-xs font-mono text-muted">
                  Recomputing portfolio valuations and returns...
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddHolding} className="space-y-4">
                {addError && (
                  <div className="p-3 rounded-xl bg-terracotta-light border border-terracotta/30 text-terracotta text-xs font-medium">
                    {addError}
                  </div>
                )}

                {/* Stock Symbol with Autocomplete Dropdown */}
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted flex items-center justify-between">
                    <span>Stock Symbol (NSE / BSE)</span>
                    {selectedStockName && (
                      <span className="text-[11px] font-sans font-medium text-terracotta truncate max-w-[200px]">
                        {selectedStockName}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={addSymbol}
                      onChange={(e) => {
                        setAddSymbol(e.target.value.toUpperCase());
                        setSelectedStockName('');
                      }}
                      placeholder="e.g. RELIANCE, TCS, INFY, HDFCBANK"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-warm-cream border border-border-warm text-ink text-sm font-mono font-bold uppercase outline-none focus:border-terracotta"
                      required
                      autoFocus
                    />
                    <div className="absolute right-3 top-2.5 text-muted pointer-events-none">
                      <Search className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Autocomplete Dropdown */}
                  {symbolSuggestions.length > 0 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-surface rounded-xl border border-border-warm shadow-lg overflow-hidden divide-y divide-border-warm/60">
                      {symbolSuggestions.map((item) => (
                        <button
                          type="button"
                          key={item.symbol}
                          onClick={() => handleSelectSuggestion(item)}
                          className="w-full px-3.5 py-2 text-left hover:bg-warm-cream/60 flex items-center justify-between transition-colors"
                        >
                          <div>
                            <span className="font-mono font-bold text-xs text-ink block">
                              {item.symbol}
                            </span>
                            <span className="text-[11px] text-muted block truncate max-w-[240px]">
                              {item.companyName}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-warm-cream text-muted border border-border-warm">
                            {item.exchange}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted">
                    Quantity (Shares)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-warm-cream border border-border-warm text-ink text-sm font-mono font-bold outline-none focus:border-terracotta"
                    required
                  />
                </div>

                {/* Average Buy Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted">
                    Average Buy Price per Share (₹)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.05"
                    value={addPrice}
                    onChange={(e) => setAddPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-warm-cream border border-border-warm text-ink text-sm font-mono font-bold outline-none focus:border-terracotta"
                    required
                  />
                </div>

                {/* Purchase Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-warm-cream border border-border-warm text-ink text-sm font-mono outline-none focus:border-terracotta"
                    required
                  />
                </div>

                {/* Live Outlay Calculation Preview */}
                <div className="p-3.5 rounded-xl bg-warm-cream border border-border-warm flex items-center justify-between text-xs font-mono">
                  <span className="text-muted">Total Invested Outlay:</span>
                  <span className="font-bold text-ink text-sm">
                    ₹{(addQuantity * addPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border-warm text-ink text-sm font-medium hover:bg-warm-cream transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-terracotta text-warm-cream font-display font-semibold text-sm hover:bg-terracotta-hover transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Adding...' : 'Confirm Holding'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Holding Modal */}
      {isEditModalOpen && editingHolding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface rounded-3xl border border-border-warm p-6 sm:p-8 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 text-muted hover:text-ink p-1 rounded-full hover:bg-warm-cream transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-olive-light text-olive font-bold">
                Position Adjustment
              </div>
              <h3 className="text-2xl font-display font-extrabold text-ink">
                Edit {editingHolding.symbol}
              </h3>
              <p className="text-xs text-muted truncate">{editingHolding.companyName}</p>
            </div>

            {editSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-olive-light text-olive mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-display font-bold text-lg text-ink">Holding Updated</h4>
                <p className="text-xs font-mono text-muted">Recalculating portfolio analytics...</p>
              </div>
            ) : (
              <form onSubmit={handleUpdateHolding} className="space-y-4">
                {editError && (
                  <div className="p-3 rounded-xl bg-terracotta-light border border-terracotta/30 text-terracotta text-xs font-medium">
                    {editError}
                  </div>
                )}

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted">
                    Quantity (Shares)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-warm-cream border border-border-warm text-ink text-sm font-mono font-bold outline-none focus:border-terracotta"
                    required
                  />
                </div>

                {/* Avg Buy Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted">
                    Avg. Buy Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.05"
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-warm-cream border border-border-warm text-ink text-sm font-mono font-bold outline-none focus:border-terracotta"
                    required
                  />
                </div>

                {/* Purchase Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-warm-cream border border-border-warm text-ink text-sm font-mono outline-none focus:border-terracotta"
                    required
                  />
                </div>

                {/* Recalculated Summary Card */}
                <div className="p-3.5 rounded-xl bg-warm-cream border border-border-warm space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center text-muted">
                    <span>Invested Capital:</span>
                    <span className="font-bold text-ink">
                      ₹{(editQuantity * editPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted">
                    <span>Current Value (LTP ₹{editingHolding.currentPrice}):</span>
                    <span className="font-bold text-ink">
                      ₹{(editQuantity * editingHolding.currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-border-warm/60">
                    <span className="text-muted">Est. Profit / Loss:</span>
                    <span
                      className={`font-bold ${
                        editQuantity * editingHolding.currentPrice >= editQuantity * editPrice
                          ? 'text-olive'
                          : 'text-terracotta'
                      }`}
                    >
                      {editQuantity * editingHolding.currentPrice >= editQuantity * editPrice ? '+' : ''}
                      ₹{(editQuantity * editingHolding.currentPrice - editQuantity * editPrice).toLocaleString(
                        'en-IN',
                        { minimumFractionDigits: 2 }
                      )}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border-warm text-ink text-sm font-medium hover:bg-warm-cream transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEditSubmitting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-terracotta text-warm-cream font-display font-semibold text-sm hover:bg-terracotta-hover transition-colors disabled:opacity-50"
                  >
                    {isEditSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingHolding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-surface rounded-3xl border border-border-warm p-6 sm:p-7 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-terracotta-light text-terracotta mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-display font-bold text-ink">Remove Holding</h3>
              <p className="text-xs text-muted leading-relaxed">
                Are you sure you want to remove <strong>{deletingHolding.symbol}</strong> ({deletingHolding.quantity} shares) from this portfolio?
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border-warm text-ink text-xs font-semibold hover:bg-warm-cream transition-colors"
              >
                Keep Position
              </button>
              <button
                type="button"
                onClick={confirmDeleteHolding}
                disabled={isDeleteSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-terracotta text-warm-cream font-display font-semibold text-xs hover:bg-terracotta-hover transition-colors disabled:opacity-50"
              >
                {isDeleteSubmitting ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Portfolio Modal */}
      {isNewPortfolioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface rounded-3xl border border-border-warm p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border-warm pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-terracotta" />
                <h3 className="text-lg font-display font-bold text-ink">Create New Portfolio</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPortfolioModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-warm-cream transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewPortfolio} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink">
                  Portfolio Name
                </label>
                <input
                  type="text"
                  value={newPortfolioNameInput}
                  onChange={(e) => setNewPortfolioNameInput(e.target.value)}
                  placeholder="e.g., Growth Tech & EV Portfolio"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-warm-cream rounded-xl border border-border-warm text-ink text-sm outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10"
                />
                <p className="text-[11px] text-muted font-mono">
                  Create dedicated portfolios for specific strategies, goals, or sectors.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewPortfolioModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border-warm text-ink text-xs font-semibold hover:bg-warm-cream transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newPortfolioSubmitting || !newPortfolioNameInput.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-terracotta text-warm-cream font-display font-semibold text-xs hover:bg-terracotta-hover transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {newPortfolioSubmitting ? 'Creating...' : 'Create Portfolio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
