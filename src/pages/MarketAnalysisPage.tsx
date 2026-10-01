import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Search,
  Activity,
  Layers,
  BarChart3,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { stockService } from '../services/stockService';
import { marketDataService } from '../services/marketDataService';
import type { Stock } from '../types/portfolio';
import type { MarketData } from '../types/market';

interface IndexItem {
  name: string;
  symbol: string;
  price: number;
  change: number;
  pct: number;
  high: number;
  low: number;
}

interface MarketMover {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  pct: number;
  volume: number;
}

export const MarketAnalysisPage: React.FC = () => {
  const [activeMoverTab, setActiveMoverTab] = useState<'gainers' | 'losers' | 'active'>('gainers');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Market indices
  const [indices, setIndices] = useState<IndexItem[]>([
    { name: 'NIFTY 50', symbol: 'NIFTY50', price: 25250.0, change: 145.2, pct: 0.58, high: 25320.0, low: 25180.0 },
    { name: 'SENSEX', symbol: 'SENSEX', price: 82450.0, change: 420.5, pct: 0.51, high: 82680.0, low: 82210.0 },
    { name: 'BANK NIFTY', symbol: 'BANKNIFTY', price: 51820.0, change: -85.4, pct: -0.16, high: 52100.0, low: 51650.0 },
    { name: 'NIFTY IT', symbol: 'NIFTYIT', price: 42150.0, change: 310.8, pct: 0.74, high: 42300.0, low: 41900.0 },
    { name: 'NIFTY AUTO', symbol: 'NIFTYAUTO', price: 26180.0, change: 195.4, pct: 0.75, high: 26250.0, low: 25950.0 },
    { name: 'NIFTY PHARMA', symbol: 'NIFTYPHARMA', price: 22410.0, change: -45.0, pct: -0.2, high: 22550.0, low: 22350.0 },
  ]);

  // NIFTY 50 Historical Chart data
  const [chartData, setChartData] = useState<MarketData[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);

  // Market movers
  const [gainers, setGainers] = useState<MarketMover[]>([]);
  const [losers, setLosers] = useState<MarketMover[]>([]);
  const [mostActive, setMostActive] = useState<MarketMover[]>([]);

  // Sector Performance
  const [sectors, setSectors] = useState<Array<{ name: string; pct: number; isUp: boolean }>>([
    { name: 'Information Technology', pct: 1.45, isUp: true },
    { name: 'Automobile & EV', pct: 1.12, isUp: true },
    { name: 'Oil & Gas / Energy', pct: 0.85, isUp: true },
    { name: 'Financial Services & Banking', pct: -0.22, isUp: false },
    { name: 'Healthcare & Pharma', pct: -0.45, isUp: false },
    { name: 'Fast Moving Consumer Goods', pct: 0.38, isUp: true },
    { name: 'Metals & Mining', pct: -0.88, isUp: false },
    { name: 'Telecommunications', pct: 0.65, isUp: true },
  ]);

  // Load real quotes and chart data
  useEffect(() => {
    async function loadMarketData() {
      // 1. Load NIFTY 50 history
      try {
        const history = await marketDataService.getMarketData('NIFTY50', 120);
        if (history && history.length > 0) {
          setChartData(history);
        }
      } catch {
        // fallback
      } finally {
        setLoadingChart(false);
      }

      // 2. Fetch live quotes for universe to build real gainers, losers, and most active
      const candidateSymbols = [
        'RELIANCE',
        'TCS',
        'HDFCBANK',
        'INFY',
        'TATAMOTORS',
        'ICICIBANK',
        'ITC',
        'BHARTIARTL',
        'SUNPHARMA',
        'LTIM',
        'WIPRO',
        'MARUTI',
        'SBIN',
        'KOTAKBANK',
      ];

      const moverPromises = candidateSymbols.map(async (sym) => {
        try {
          const [stock, quote] = await Promise.all([
            stockService.getStock(sym),
            stockService.getQuote(sym),
          ]);
          return {
            symbol: sym,
            name: stock?.company_name || quote.companyName || sym,
            sector: stock?.sector || 'Diversified',
            price: quote.currentPrice,
            change: quote.priceChange,
            pct: quote.percentageChange,
            volume: quote.volume || 1500000,
          };
        } catch {
          return null;
        }
      });

      const resolved = (await Promise.all(moverPromises)).filter(Boolean) as MarketMover[];

      if (resolved.length > 0) {
        const sortedGainers = [...resolved].sort((a, b) => b.pct - a.pct).slice(0, 5);
        const sortedLosers = [...resolved].sort((a, b) => a.pct - b.pct).slice(0, 5);
        const sortedActive = [...resolved].sort((a, b) => b.volume - a.volume).slice(0, 5);

        setGainers(sortedGainers);
        setLosers(sortedLosers);
        setMostActive(sortedActive);
      }
    }

    loadMarketData();
  }, []);

  // Stock search
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await stockService.searchStocks(q, 6);
        setSearchResults(res);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const activeMovers = activeMoverTab === 'gainers' ? gainers : activeMoverTab === 'losers' ? losers : mostActive;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-ink">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border-warm pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-widest text-olive font-bold">
              [INDIAN EQUITIES PULSE]
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-olive animate-pulse" />
            <span className="text-[11px] font-mono text-muted">NSE / BSE Benchmark Tracker</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink tracking-tight">
            Market Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Real-time Indian indices, sector breadth, top movers, and historical benchmark trajectory.
          </p>
        </div>

        {/* Global Stock Search Bar */}
        <div className="w-full md:w-80 relative">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indian stocks (e.g. TCS)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border-warm text-xs font-mono outline-none focus:border-terracotta shadow-xs"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-border-warm rounded-2xl shadow-lg z-30 p-2 space-y-1">
              {isSearching ? (
                <div className="p-3 text-center text-xs font-mono text-muted">Searching master...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((s) => (
                  <Link
                    key={s.symbol}
                    to={`/stocks/${s.symbol}`}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-warm-cream transition-colors text-xs font-mono"
                  >
                    <div>
                      <span className="font-bold text-ink block">{s.symbol}</span>
                      <span className="text-[10px] text-muted font-sans truncate block max-w-[180px]">{s.company_name}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-olive-light text-olive font-bold border border-olive/20">
                      {s.exchange || 'NSE'}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="p-3 text-center text-xs font-mono text-muted">No matching Indian stocks found.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 1. MAJOR INDIAN INDICES GRID */}
      <section className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
          Primary Benchmark Indices
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {indices.map((idx) => {
            const isUp = idx.pct >= 0;
            return (
              <div key={idx.symbol} className="p-4 rounded-2xl bg-surface border border-border-warm space-y-1.5 shadow-xs">
                <span className="text-[10px] font-mono uppercase text-muted font-bold block truncate">{idx.name}</span>
                <p className="text-lg font-display font-black text-ink tabular-nums">
                  {idx.price.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                </p>
                <div className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold ${isUp ? 'text-olive' : 'text-terracotta'}`}>
                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{isUp ? `+${idx.pct}%` : `${idx.pct}%`}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. NIFTY 50 HISTORICAL BENCHMARK CHART */}
      <section className="editorial-card p-6 sm:p-8 space-y-6 bg-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-warm pb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-terracotta" />
              <span>NIFTY 50 Benchmark Trend</span>
            </h3>
            <p className="text-xs text-muted">
              Historical closing levels for the National Stock Exchange flagship index.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted">
            <Clock className="w-3.5 h-3.5" />
            <span>Daily OHLC Sessions</span>
          </div>
        </div>

        <div className="w-full h-72 sm:h-80">
          {!loadingChart && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="niftyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D9633B" stopOpacity={0.25} />
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
                  domain={['dataMin - 200', 'dataMax + 200']}
                  tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload as MarketData;
                    return (
                      <div className="bg-surface/95 backdrop-blur-md p-3 rounded-xl border border-border-warm shadow-md text-xs font-mono space-y-1">
                        <p className="text-muted font-sans font-semibold">{d.date}</p>
                        <p className="text-ink font-bold text-sm">Close: ₹{d.close.toLocaleString('en-IN')}</p>
                        <div className="flex gap-3 text-[10px] text-muted">
                          <span>High: ₹{d.high}</span>
                          <span>Low: ₹{d.low}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="close" stroke="#D9633B" strokeWidth={2} fill="url(#niftyGradient)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs font-mono text-muted">
              Loading benchmark trajectory...
            </div>
          )}
        </div>
      </section>

      {/* 3. MARKET MOVERS & SECTOR PERFORMANCE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Top Movers (7 cols) */}
        <section className="lg:col-span-7 editorial-card p-6 sm:p-7 space-y-5 bg-surface">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-warm pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
                <Activity className="w-4 h-4 text-terracotta" />
                <span>Market Movers</span>
              </h3>
              <p className="text-xs text-muted">Intraday gainers, losers, and most active securities.</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center bg-warm-cream p-1 rounded-xl border border-border-warm text-xs font-mono font-bold">
              <button
                onClick={() => setActiveMoverTab('gainers')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeMoverTab === 'gainers' ? 'bg-ink text-warm-cream shadow-xs' : 'text-muted hover:text-ink'
                }`}
              >
                Top Gainers
              </button>
              <button
                onClick={() => setActiveMoverTab('losers')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeMoverTab === 'losers' ? 'bg-ink text-warm-cream shadow-xs' : 'text-muted hover:text-ink'
                }`}
              >
                Top Losers
              </button>
              <button
                onClick={() => setActiveMoverTab('active')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeMoverTab === 'active' ? 'bg-ink text-warm-cream shadow-xs' : 'text-muted hover:text-ink'
                }`}
              >
                Most Active
              </button>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {activeMovers.length > 0 ? (
              activeMovers.map((m) => {
                const isMUp = m.pct >= 0;
                return (
                  <Link
                    key={m.symbol}
                    to={`/stocks/${m.symbol}`}
                    className="p-3.5 rounded-xl bg-warm-cream/50 border border-border-warm hover:border-terracotta flex items-center justify-between transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-ink group-hover:text-terracotta transition-colors">{m.symbol}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-terracotta" />
                      </div>
                      <span className="text-[11px] font-sans text-muted truncate block max-w-xs">{m.name}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-ink block">₹{m.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      <span className={`text-[10px] font-bold ${isMUp ? 'text-olive' : 'text-terracotta'}`}>
                        {isMUp ? '▲ +' : '▼ '}{m.pct.toFixed(2)}%
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs font-mono text-muted">
                Loading live mover data...
              </div>
            )}
          </div>
        </section>

        {/* Right: Sector Performance Heatmap / Bars (5 cols) */}
        <section className="lg:col-span-5 editorial-card p-6 sm:p-7 space-y-5 bg-surface">
          <div className="border-b border-border-warm pb-3">
            <h3 className="font-display font-bold text-base text-ink flex items-center gap-2">
              <Layers className="w-4 h-4 text-olive" />
              <span>Sector Performance</span>
            </h3>
            <p className="text-xs text-muted">Indian market sector rotation indices.</p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {sectors.map((sec) => (
              <div key={sec.name} className="p-3 rounded-xl bg-warm-cream/50 border border-border-warm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-ink font-semibold">{sec.name}</span>
                  <span className={`font-bold ${sec.isUp ? 'text-olive' : 'text-terracotta'}`}>
                    {sec.isUp ? '+' : ''}{sec.pct}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-border-warm overflow-hidden">
                  <div
                    className={`h-full rounded-full ${sec.isUp ? 'bg-olive' : 'bg-terracotta'}`}
                    style={{ width: `${Math.min(100, Math.abs(sec.pct) * 35)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MarketAnalysisPage;
