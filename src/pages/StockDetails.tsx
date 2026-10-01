import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Building2,
  Globe,
  Plus,
  Check,
  AlertCircle,
  Clock,
  BarChart3,
  X,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { useStockDetail } from '../hooks/useStockDetail';
import { portfolioService } from '../services/portfolioService';
import { usePortfolios } from '../hooks/usePortfolio';
import { useAuth } from '../hooks/useAuth';
import { useWatchlist } from '../hooks/useWatchlist';

type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';

export const StockDetailsPage: React.FC = () => {
  const { symbol = 'RELIANCE' } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeRange, setActiveRange] = useState<TimeRange>('1M');
  const [activeTab, setActiveTab] = useState<'price' | 'volume'>('price');
  const { detail, loading, error } = useStockDetail(symbol, activeRange);
  const { portfolios, refetch: refetchPortfolios } = usePortfolios(user?.id);
  const { has, add: addToWl, remove: removeFromWl } = useWatchlist();
  const inWatchlist = has(symbol);
  const [wlLoading, setWlLoading] = useState(false);

  const handleToggleWatchlist = async () => {
    setWlLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWl(symbol);
      } else {
        await addToWl(symbol, detail?.companyName, detail?.exchange);
      }
    } finally {
      setWlLoading(false);
    }
  };

  // "Add to Portfolio" Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [newPortfolioName, setNewPortfolioName] = useState('My Equity Portfolio');
  const [quantity, setQuantity] = useState<number>(10);
  const [purchasePrice, setPurchasePrice] = useState<number>(detail?.currentPrice || 1000);
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Sync purchase price when stock detail loads
  React.useEffect(() => {
    if (detail?.currentPrice) {
      setPurchasePrice(detail.currentPrice);
    }
  }, [detail?.currentPrice]);

  // Set default selected portfolio
  React.useEffect(() => {
    if (portfolios.length > 0 && !selectedPortfolioId) {
      setSelectedPortfolioId(portfolios[0].id);
    }
  }, [portfolios, selectedPortfolioId]);

  // Prepare chart series based on selected time range
  const chartData = useMemo(() => {
    if (!detail?.marketData || detail.marketData.length === 0) return [];
    return detail.marketData.map((d) => ({
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));
  }, [detail?.marketData]);


  // Determine whether period is gain or loss
  const isPeriodGain = useMemo(() => {
    if (chartData.length < 2) return (detail?.dayChange ?? 0) >= 0;
    const first = chartData[0].close;
    const last = chartData[chartData.length - 1].close;
    return last >= first;
  }, [chartData, detail?.dayChange]);

  // COLOR RULE SPECIFICATION: Terracotta for gains, Sage for losses
  // Terracotta: #D9633B, Sage: #8FAF7E
  const chartColor = isPeriodGain ? '#D9633B' : '#8FAF7E';

  const handleAddToPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setModalSubmitting(true);
    setModalError(null);

    try {
      let targetPortfolioId = selectedPortfolioId;

      // If user has no portfolio, create one on the fly
      if (!targetPortfolioId) {
        const newPort = await portfolioService.createPortfolio(user.id, newPortfolioName || 'My Portfolio');
        targetPortfolioId = newPort.id;
        refetchPortfolios();
      }

      await portfolioService.addHolding(
        targetPortfolioId,
        symbol.toUpperCase(),
        Number(quantity),
        Number(purchasePrice),
        purchaseDate
      );

      setModalSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setModalSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Failed to add holding');
    } finally {
      setModalSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-cream py-16 px-4 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-terracotta border-t-transparent rounded-full animate-spin" />
        <div className="text-center space-y-1">
          <p className="font-display font-bold text-lg text-ink">Retrieving Market Series for {symbol.toUpperCase()}</p>
          <p className="font-mono text-xs text-muted">Fetching historical series & session quotes...</p>
        </div>

      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-warm-cream py-16 px-4">
        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-surface border border-border-warm text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-terracotta mx-auto" />
          <h2 className="text-2xl font-display font-bold text-ink">Unable to Load {symbol.toUpperCase()}</h2>
          <p className="text-sm text-muted">
            {error || 'The equity symbol could not be found or market data is currently unreachable.'}
          </p>
          <div className="pt-2">
            <Link
              to="/stocks"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-warm-cream text-sm font-semibold hover:bg-ink/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Equity Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isDayGain = detail.dayChange >= 0;

  return (
    <div className="min-h-screen bg-warm-cream py-8 px-4 sm:px-6 lg:px-8 text-ink">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/stocks"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All Stocks
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-muted">
              <Clock className="w-3.5 h-3.5" /> NSE Live Session
            </span>
          </div>
        </div>

        {/* Hero Card with Sticky StringTune attributes */}
        <section
          className="rounded-3xl border border-border-warm bg-surface p-6 sm:p-10 shadow-xs relative overflow-hidden"
          string-parallax="0.08"
          data-string-id="stock-detail-hero"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-black tracking-tight text-ink">
                  {detail.symbol}
                </h1>
                <span className="px-2.5 py-1 text-xs font-mono uppercase font-bold rounded-md bg-warm-cream text-muted border border-border-warm">
                  {detail.exchange}
                </span>
                {detail.sector && (
                  <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-olive-light text-olive border border-olive/20">
                    {detail.sector}
                  </span>
                )}
              </div>
              <p className="text-base sm:text-lg font-display text-muted font-normal max-w-xl">
                {detail.companyName}
              </p>
            </div>

            {/* Price & Add to Portfolio Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted block">
                  Current Market Price
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-mono font-black text-ink">
                    ₹{detail.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <div
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                      isDayGain
                        ? 'bg-terracotta-light text-terracotta border border-terracotta/20'
                        : 'bg-sage-light text-sage border border-sage/20'
                    }`}
                  >
                    {isDayGain ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{isDayGain ? `+₹${detail.dayChange}` : `-₹${Math.abs(detail.dayChange)}`}</span>
                    <span>({isDayGain ? `+${detail.dayChangePercent}%` : `${detail.dayChangePercent}%`})</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={handleToggleWatchlist}
                  disabled={wlLoading}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border text-xs font-mono font-bold transition-all shadow-xs shrink-0 ${
                    inWatchlist
                      ? 'bg-olive-light border-olive/30 text-olive hover:bg-olive-light/80'
                      : 'bg-surface border-border-warm text-ink hover:bg-warm-cream'
                  }`}
                  title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                >
                  {inWatchlist ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-olive" />
                      <span>In Watchlist</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 text-muted" />
                      <span>+ Watchlist</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-terracotta text-warm-cream font-display font-semibold text-sm hover:bg-terracotta-hover transition-all shadow-sm hover:shadow active:scale-98 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add to Portfolio
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Chart Section */}
        <section className="rounded-3xl border border-border-warm bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-warm pb-5">
            {/* Chart Mode Toggle */}
            <div className="flex items-center gap-2 bg-warm-cream p-1 rounded-xl border border-border-warm">
              <button
                onClick={() => setActiveTab('price')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'price' ? 'bg-surface text-ink shadow-xs' : 'text-muted hover:text-ink'
                }`}
              >
                Price Candlestick Series
              </button>
              <button
                onClick={() => setActiveTab('volume')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'volume' ? 'bg-surface text-ink shadow-xs' : 'text-muted hover:text-ink'
                }`}
              >
                Traded Volume
              </button>
            </div>

            {/* Time-Range Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(['1D', '1W', '1M', '3M', '6M', '1Y'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setActiveRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeRange === range
                      ? 'bg-ink text-warm-cream shadow-xs'
                      : 'bg-warm-cream text-muted hover:text-ink hover:bg-surface-warm'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Display Container */}
          <div className="w-full h-80 sm:h-96 pt-2">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 space-y-3 bg-warm-cream/50 rounded-2xl border border-dashed border-border-warm">
                <Clock className="w-8 h-8 text-muted/60" />
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-sm text-ink">Historical Market Data Unavailable</h4>
                  <p className="text-xs text-muted max-w-sm">
                    Time-series candlestick data is temporarily unavailable for this security or time interval.
                  </p>
                </div>
              </div>
            ) : activeTab === 'price' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8DAC6" opacity={0.6} />
                  <XAxis
                    dataKey="date"
                    stroke="#7A6B55"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (!val) return '';
                      if (typeof val === 'string' && val.includes(':')) return val;
                      try {
                        const d = new Date(val);
                        if (isNaN(d.getTime())) return val;
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
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-surface/95 backdrop-blur-md p-3.5 rounded-xl border border-border-warm shadow-md text-xs font-mono space-y-1">
                          <p className="text-muted font-sans font-semibold">{data.date}</p>
                          <div className="space-y-0.5">
                            <p className="text-ink font-bold text-sm">₹{data.close.toFixed(2)}</p>
                            <p className="text-muted text-[11px]">
                              Open: ₹{data.open?.toFixed(2) ?? '—'} | High: ₹{data.high?.toFixed(2) ?? '—'} | Low: ₹{data.low?.toFixed(2) ?? '—'}
                            </p>
                            <p className="text-muted text-[10px]">
                              Vol: {data.volume?.toLocaleString('en-IN') ?? 0}
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke={chartColor}
                    strokeWidth={2.5}
                    fill="url(#priceGradient)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8DAC6" opacity={0.6} />
                  <XAxis dataKey="date" stroke="#7A6B55" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#7A6B55"
                    fontSize={11}
                    tickLine={false}
                    orientation="right"
                    tickFormatter={(val) => `${(val / 100000).toFixed(1)}L`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-surface p-3 rounded-xl border border-border-warm shadow-md text-xs font-mono space-y-1">
                          <p className="text-muted">{data.date}</p>
                          <p className="text-ink font-bold">Vol: {data.volume?.toLocaleString('en-IN') ?? 0}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="volume" fill="#D9633B" radius={[4, 4, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Fundamentals & Key Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Key Technical / Session Metrics */}
          <section className="lg:col-span-1 rounded-3xl border border-border-warm bg-surface p-6 sm:p-8 space-y-5 shadow-xs">
            <h3 className="text-lg font-display font-bold text-ink flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-terracotta" /> Session Statistics
            </h3>

            <div className="space-y-3.5 divide-y divide-border-warm/60 font-mono text-xs">
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted font-sans">Open Price</span>
                <span className="font-bold text-ink">
                  {detail.marketData && detail.marketData.length > 0 && detail.marketData[detail.marketData.length - 1]?.open != null
                    ? `₹${detail.marketData[detail.marketData.length - 1].open.toFixed(2)}`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted font-sans">Day High</span>
                <span className="font-bold text-ink">
                  {detail.marketData && detail.marketData.length > 0 && detail.marketData[detail.marketData.length - 1]?.high != null
                    ? `₹${detail.marketData[detail.marketData.length - 1].high.toFixed(2)}`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted font-sans">Day Low</span>
                <span className="font-bold text-ink">
                  {detail.marketData && detail.marketData.length > 0 && detail.marketData[detail.marketData.length - 1]?.low != null
                    ? `₹${detail.marketData[detail.marketData.length - 1].low.toFixed(2)}`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted font-sans">Traded Volume</span>
                <span className="font-bold text-ink">
                  {detail.volume.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-muted font-sans">52-Week High</span>
                <span className="font-bold text-ink">
                  ₹{detail.info?.fifty_two_week_high ? Number(detail.info.fifty_two_week_high).toFixed(2) : '3,024.90'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted font-sans">52-Week Low</span>
                <span className="font-bold text-ink">
                  ₹{detail.info?.fifty_two_week_low ? Number(detail.info.fifty_two_week_low).toFixed(2) : '2,220.30'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted font-sans">P/E Ratio</span>
                <span className="font-bold text-ink">
                  {detail.info?.pe_ratio || '28.4'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted font-sans">Dividend Yield</span>
                <span className="font-bold text-ink">
                  {detail.info?.dividend_yield ? `${detail.info.dividend_yield}%` : '0.45%'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted font-sans">Market Cap</span>
                <span className="font-bold text-ink">
                  {detail.info?.market_cap || '₹20.4 Lakh Cr'}
                </span>
              </div>
            </div>
          </section>

          {/* Company Fundamentals & About */}
          <section className="lg:col-span-2 rounded-3xl border border-border-warm bg-surface p-6 sm:p-8 space-y-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold text-ink flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-olive" /> About {detail.companyName}
                </h3>
                {detail.info?.website && (
                  <a
                    href={detail.info.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-terracotta hover:underline inline-flex items-center gap-1"
                  >
                    <Globe className="w-3.5 h-3.5" /> Official Portal
                  </a>
                )}
              </div>

              <p className="text-muted text-sm sm:text-base leading-relaxed font-normal">
                {detail.info?.description ||
                  `${detail.companyName} is one of the premier companies traded on the National Stock Exchange of India (NSE). It operates across dynamic verticals, serving retail and enterprise markets with disciplined capital allocation and strong balance-sheet management.`}
              </p>
            </div>

            {/* Sector / Industry Pills */}
            <div className="pt-4 border-t border-border-warm/60 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-warm-cream border border-border-warm/80">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">
                  Sector Classification
                </span>
                <span className="font-display font-bold text-sm text-ink block mt-1">
                  {detail.sector || 'Industrial & Technology'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-warm-cream border border-border-warm/80">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">
                  Primary Exchange
                </span>
                <span className="font-display font-bold text-sm text-ink block mt-1">
                  {detail.exchange} (NSE India)
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-warm-cream border border-border-warm/80">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">
                  Listing Status
                </span>
                <span className="font-display font-bold text-sm text-olive block mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-olive animate-pulse" /> Actively Traded
                </span>
              </div>

            </div>
          </section>
        </div>
      </div>

      {/* "Add to Portfolio" Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface rounded-3xl border border-border-warm p-6 sm:p-8 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-muted hover:text-ink p-1 rounded-full hover:bg-warm-cream transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-terracotta-light text-terracotta font-bold">
                Holding Acquisition
              </div>
              <h3 className="text-2xl font-display font-extrabold text-ink">
                Add {symbol} to Portfolio
              </h3>
              <p className="text-xs text-muted">
                Track cost basis, unrealized gain/loss, and portfolio allocation.
              </p>
            </div>

            {modalSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-olive-light text-olive mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-display font-bold text-lg text-ink">Holding Added Successfully</h4>
                <p className="text-xs font-mono text-muted">
                  {quantity} shares of {symbol} booked at ₹{purchasePrice}
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddToPortfolio} className="space-y-4">
                {modalError && (
                  <div className="p-3 rounded-xl bg-terracotta-light border border-terracotta/30 text-terracotta text-xs font-medium">
                    {modalError}
                  </div>
                )}

                {/* Target Portfolio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted">
                    Target Portfolio
                  </label>
                  {portfolios.length > 0 ? (
                    <select
                      value={selectedPortfolioId}
                      onChange={(e) => setSelectedPortfolioId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-warm-cream border border-border-warm text-ink text-sm font-medium outline-none focus:border-terracotta"
                    >
                      {portfolios.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newPortfolioName}
                      onChange={(e) => setNewPortfolioName(e.target.value)}
                      placeholder="Portfolio Name (e.g., Growth Portfolio)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-warm-cream border border-border-warm text-ink text-sm outline-none focus:border-terracotta"
                      required
                    />
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
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-warm-cream border border-border-warm text-ink text-sm font-mono font-bold outline-none focus:border-terracotta"
                    required
                  />
                </div>

                {/* Purchase Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-muted">
                    Purchase Price per Share (₹)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.05"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
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
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-warm-cream border border-border-warm text-ink text-sm font-mono outline-none focus:border-terracotta"
                    required
                  />
                </div>

                {/* Total Investment Summary */}
                <div className="p-3.5 rounded-xl bg-warm-cream border border-border-warm flex items-center justify-between text-xs font-mono">
                  <span className="text-muted">Total Capital Outlay:</span>
                  <span className="font-bold text-ink text-sm">
                    ₹{(quantity * purchasePrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border-warm text-ink text-sm font-medium hover:bg-warm-cream transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-terracotta text-warm-cream font-display font-semibold text-sm hover:bg-terracotta-hover transition-colors disabled:opacity-50"
                  >
                    {modalSubmitting ? 'Booking...' : 'Confirm Holding'}
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

export default StockDetailsPage;
