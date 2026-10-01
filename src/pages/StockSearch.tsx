import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Building2,
  Sparkles,
  SlidersHorizontal,
  Clock,
  Plus,
  X,
  CheckCircle2,
  FolderPlus,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

import { useStockSearch } from '../hooks/useStockSearch';
import { stockService } from '../services/stockService';
import { portfolioService } from '../services/portfolioService';
import { useAuth } from '../hooks/useAuth';
import { usePortfolios } from '../hooks/usePortfolio';
import type { Stock } from '../types/portfolio';
import type { TrendingStockItem } from '../types/market';

const POPULAR_SECTORS = [
  'All Sectors',
  'Information Technology',
  'Banking & Finance',
  'Energy & Oil',
  'Automobile',
  'FMCG',
  'Telecommunications',
];

export const StockSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { portfolios, refetch: refetchPortfolios } = usePortfolios(user?.id);

  const [query, setQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const { results, loading, search } = useStockSearch();
  const [trendingStocks, setTrendingStocks] = useState<TrendingStockItem[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  // Add to Portfolio Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetStock, setTargetStock] = useState<{
    symbol: string;
    companyName: string;
    price: number;
    exchange?: string;
  } | null>(null);

  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [newPortfolioName, setNewPortfolioName] = useState('My Indian Equity Portfolio');
  const [quantity, setQuantity] = useState<number>(10);
  const [purchasePrice, setPurchasePrice] = useState<number>(1000);
  const [purchaseDate, setPurchaseDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch real trending stocks from stock service
  useEffect(() => {
    let isMounted = true;
    stockService.getTrendingStocks().then((data) => {
      if (isMounted) {
        setTrendingStocks(data);
        setTrendingLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Trigger search on query change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Sync selected portfolio when user portfolios load
  useEffect(() => {
    if (portfolios.length > 0 && !selectedPortfolioId) {
      setSelectedPortfolioId(portfolios[0].id);
    }
  }, [portfolios, selectedPortfolioId]);

  // Filter results by sector if not 'All Sectors'
  const filteredResults = results.filter((stock: Stock) => {
    if (selectedSector === 'All Sectors') return true;
    if (!stock.sector) return true;
    return stock.sector.toLowerCase().includes(selectedSector.toLowerCase().split(' ')[0]);
  });

  // Open "Add to Portfolio" Modal
  const openAddModal = async (
    e: React.MouseEvent,
    symbol: string,
    companyName: string,
    knownPrice?: number,
    exchange?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    let price = knownPrice && knownPrice > 0 ? knownPrice : 1000;
    if (!knownPrice) {
      try {
        const q = await stockService.getQuote(symbol);
        if (q && q.currentPrice > 0) price = q.currentPrice;
      } catch {}
    }

    setTargetStock({
      symbol: symbol.toUpperCase(),
      companyName,
      price,
      exchange: exchange || 'NSE',
    });
    setPurchasePrice(price);
    setQuantity(10);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setModalError(null);
    setModalSuccess(false);
    setIsAddModalOpen(true);
  };

  // Submit "Add to Portfolio"
  const handleConfirmAddToPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStock) return;

    setModalSubmitting(true);
    setModalError(null);

    try {
      let targetPortId = selectedPortfolioId;

      // If user selected create new portfolio or has none
      if (!targetPortId || targetPortId === 'create_new') {
        const newPort = await portfolioService.createPortfolio(
          user?.id || 'guest',
          newPortfolioName || 'My Indian Equity Portfolio'
        );
        targetPortId = newPort.id;
        refetchPortfolios();
        setSelectedPortfolioId(newPort.id);
      }

      await portfolioService.addHolding(
        targetPortId,
        targetStock.symbol,
        Number(quantity),
        Number(purchasePrice),
        purchaseDate
      );

      setModalSuccess(true);
      setTimeout(() => {
        setIsAddModalOpen(false);
        setModalSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Failed to add stock to portfolio');
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-cream py-10 px-4 sm:px-6 lg:px-8 text-ink">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Hero Section with StringTune Parallax */}
        <section
          className="relative rounded-3xl border border-border-warm bg-surface-warm p-8 md:p-14 overflow-hidden shadow-xs"
          string-parallax="0.12"
          data-string-id="stock-search-hero"
        >
          {/* Subtle Ambient Background Mesh */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-clay/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-terracotta/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider font-semibold bg-olive-light text-olive border border-olive/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NSE / BSE Real-Time Equity Engine</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-ink leading-[1.05]">
              Search & Explore <br className="hidden sm:inline" />
              <span className="text-terracotta">Indian Equities.</span>
            </h1>

            <p className="text-muted text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
              Access institutional-grade technical series, OHLC historical candlestick charts, valuation multiples, and fundamental ratios across National Stock Exchange listings.
            </p>

            {/* Big Search Input with Autocomplete */}
            <div className="pt-4">
              <div className="relative max-w-2xl group">
                <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none text-muted group-focus-within:text-terracotta transition-colors">
                  <Search className="w-6 h-6" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by symbol or company (e.g., RELIANCE, TCS, INFY, HDFC)..."
                  className="w-full pl-13 sm:pl-14 pr-24 sm:pr-32 py-4 sm:py-5 bg-surface text-ink text-base sm:text-lg rounded-2xl border-2 border-border-warm focus:border-terracotta focus:ring-4 focus:ring-terracotta/10 outline-none shadow-sm transition-all placeholder:text-muted/60"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute inset-y-0 right-20 sm:right-28 my-auto h-7 px-2 text-xs font-mono text-muted hover:text-ink transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <span className="hidden sm:inline-flex items-center px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-muted bg-warm-cream rounded-md border border-border-warm">
                    ENTER
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Sector Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 no-scrollbar">
              <SlidersHorizontal className="w-4 h-4 text-muted shrink-0 mr-1" />
              {POPULAR_SECTORS.map((sector) => (
                <button
                  key={sector}
                  onClick={() => setSelectedSector(sector)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedSector === sector
                      ? 'bg-ink text-warm-cream shadow-xs font-semibold'
                      : 'bg-surface text-muted hover:text-ink hover:bg-surface-warm border border-border-warm'
                  }`}
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Live Search Results Section (Shown when user has entered search) */}
        {query.trim().length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-ink flex items-center gap-2">
                <span>Search Results for</span>
                <span className="font-mono text-terracotta">"{query.toUpperCase()}"</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-clay-light text-muted border border-border-warm font-normal">
                  {filteredResults.length} matches
                </span>
              </h2>
            </div>

            {loading ? (
              <div className="p-12 text-center bg-surface rounded-2xl border border-border-warm space-y-3">
                <div className="w-8 h-8 mx-auto border-3 border-terracotta border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-mono text-muted">Searching NSE/BSE master equity database...</p>
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredResults.map((stock: Stock) => (
                  <div
                    key={stock.symbol}
                    className="group bg-surface hover:bg-surface-warm p-5 rounded-2xl border border-border-warm hover:border-terracotta/50 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                  >
                    <Link to={`/stocks/${stock.symbol}`} className="space-y-2 block">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-lg text-ink group-hover:text-terracotta transition-colors">
                          {stock.symbol}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-warm-cream text-muted border border-border-warm">
                          {stock.exchange || 'NSE'}
                        </span>
                      </div>
                      <h3 className="font-display font-medium text-sm text-ink line-clamp-1">
                        {stock.company_name}
                      </h3>
                      <p className="text-xs text-muted flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted/70" />
                        <span>{stock.sector || 'Equities'}</span>
                      </p>
                    </Link>

                    <div className="pt-4 mt-4 border-t border-border-warm/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) =>
                          openAddModal(e, stock.symbol, stock.company_name, undefined, stock.exchange)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-warm hover:bg-terracotta hover:text-warm-cream border border-border-warm text-ink text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-98"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Portfolio</span>
                      </button>

                      <Link
                        to={`/stocks/${stock.symbol}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Explore</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-surface rounded-2xl border border-dashed border-border-warm space-y-4">
                <Building2 className="w-12 h-12 text-muted/40 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-ink">No equities found</h3>
                  <p className="text-sm text-muted max-w-md mx-auto">
                    We couldn't find matches for "{query}". You can directly open any valid NSE stock ticker using its symbol.
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/stocks/${query.toUpperCase()}`)}
                  className="px-4 py-2 rounded-xl bg-terracotta text-warm-cream font-medium text-sm hover:bg-terracotta-hover transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Lookup Symbol {query.toUpperCase()} <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </section>
        )}

        {/* Trending & Benchmark Equities Section */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-olive" />
                <h2 className="text-2xl font-display font-bold text-ink">Trending Indian Equities</h2>
              </div>
              <p className="text-xs font-mono text-muted">
                Key Nifty 50 heavyweight components with real-time analytics
              </p>
            </div>
            <span className="text-xs font-mono text-muted hidden sm:inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Updated every trading session
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingLoading
              ? Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="bg-surface p-5 rounded-2xl border border-border-warm animate-pulse flex flex-col justify-between h-44"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="w-20 h-5 bg-warm-cream rounded" />
                        <div className="w-14 h-5 bg-warm-cream rounded" />
                      </div>
                      <div className="w-32 h-4 bg-warm-cream rounded" />
                      <div className="w-24 h-3 bg-warm-cream rounded" />
                    </div>
                    <div className="pt-4 border-t border-border-warm/60 flex justify-between items-center">
                      <div className="w-20 h-6 bg-warm-cream rounded" />
                      <div className="w-8 h-8 rounded-full bg-warm-cream" />
                    </div>
                  </div>
                ))
              : trendingStocks.map((item) => {
                  const isGain = item.change >= 0;
                  return (
                    <div
                      key={item.symbol}
                      className="group bg-surface hover:bg-surface-warm p-5 rounded-2xl border border-border-warm hover:border-terracotta/40 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                    >
                      <Link to={`/stocks/${item.symbol}`} className="space-y-2 block">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-base text-ink group-hover:text-terracotta transition-colors">
                            {item.symbol}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              isGain
                                ? 'bg-olive-light text-olive border border-olive/20'
                                : 'bg-terracotta-light text-terracotta border border-terracotta/20'
                            }`}
                          >
                            {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {isGain ? `+${item.change}%` : `${item.change}%`}
                          </span>
                        </div>

                        <h3 className="font-display font-medium text-sm text-ink truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs text-muted">{item.sector}</p>
                      </Link>

                      <div className="pt-4 mt-4 border-t border-border-warm/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-muted block">
                            {item.isLive ? 'LTP (NSE Live)' : 'LTP (NSE)'}
                          </span>
                          <span className="font-mono font-bold text-lg text-ink">
                            ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => openAddModal(e, item.symbol, item.name, item.price, 'NSE')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-terracotta hover:bg-terracotta-hover text-warm-cream text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            title="Add to Portfolio"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                          <Link
                            to={`/stocks/${item.symbol}`}
                            className="w-7 h-7 rounded-full bg-warm-cream group-hover:bg-ink group-hover:text-warm-cream flex items-center justify-center text-ink transition-colors"
                            title="View Charts"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
        </section>
      </div>

      {/* Global Add to Portfolio Modal */}
      {isAddModalOpen && targetStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface rounded-3xl border border-border-warm p-6 sm:p-7 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border-warm pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-terracotta" />
                <div>
                  <h3 className="text-lg font-display font-bold text-ink">Add Stock to Portfolio</h3>
                  <p className="text-xs text-muted font-mono">{targetStock.symbol} • {targetStock.companyName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-warm-cream transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Banner */}
            {modalError && (
              <div className="p-3.5 rounded-xl bg-terracotta-light border border-terracotta/30 text-ink text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-terracotta shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Success State */}
            {modalSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-olive-light text-olive flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-base text-ink">Position Added Successfully</h4>
                  <p className="text-xs text-muted">
                    Added {quantity} shares of {targetStock.symbol} at ₹{purchasePrice.toLocaleString('en-IN')}.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      navigate('/portfolio');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ink text-warm-cream text-xs font-semibold shadow-xs hover:bg-ink/80 transition-colors cursor-pointer"
                  >
                    <span>View in Portfolio Tab</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmAddToPortfolio} className="space-y-4">
                {/* Portfolio Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink">
                    Target Portfolio
                  </label>
                  <select
                    value={selectedPortfolioId}
                    onChange={(e) => setSelectedPortfolioId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-warm-cream rounded-xl border border-border-warm text-ink text-xs font-mono font-bold outline-none focus:border-terracotta"
                  >
                    {portfolios.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                    <option value="create_new">+ Create New Portfolio...</option>
                  </select>
                </div>

                {/* If create new portfolio is selected */}
                {(selectedPortfolioId === 'create_new' || portfolios.length === 0) && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink flex items-center gap-1">
                      <FolderPlus className="w-3.5 h-3.5 text-terracotta" />
                      <span>New Portfolio Name</span>
                    </label>
                    <input
                      type="text"
                      value={newPortfolioName}
                      onChange={(e) => setNewPortfolioName(e.target.value)}
                      placeholder="e.g., Indian Bluechips"
                      required
                      className="w-full px-3.5 py-2.5 bg-warm-cream rounded-xl border border-border-warm text-ink text-xs outline-none focus:border-terracotta"
                    />
                  </div>
                )}

                {/* Quantity & Buy Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink">
                      Quantity (Shares)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      required
                      className="w-full px-3.5 py-2.5 bg-warm-cream rounded-xl border border-border-warm text-ink text-xs font-mono outline-none focus:border-terracotta"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink">
                      Buy Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min={0.05}
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(Number(e.target.value))}
                      required
                      className="w-full px-3.5 py-2.5 bg-warm-cream rounded-xl border border-border-warm text-ink text-xs font-mono outline-none focus:border-terracotta"
                    />
                  </div>
                </div>

                {/* Purchase Date */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-warm-cream rounded-xl border border-border-warm text-ink text-xs font-mono outline-none focus:border-terracotta"
                  />
                </div>

                {/* Total Invested Calculation */}
                <div className="p-3 bg-surface-warm rounded-xl border border-border-warm flex items-center justify-between text-xs font-mono">
                  <span className="text-muted">Total Capital Outlay:</span>
                  <span className="font-bold text-ink text-sm">
                    ₹{(quantity * purchasePrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Modal Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border-warm text-ink text-xs font-semibold hover:bg-warm-cream transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-terracotta text-warm-cream font-display font-semibold text-xs hover:bg-terracotta-hover transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {modalSubmitting ? 'Recording Holding...' : 'Confirm & Add'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockSearchPage;
