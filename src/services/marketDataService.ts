import { supabase } from './authService';
import { stockService } from './stockService';
import type { MarketData, StockInfoCache, StockDetail, ChartDataPoint } from '../types/market';

// Curated metadata for major NSE equities for instant fallback / local preview
const FALLBACK_INDIAN_STOCKS: Record<string, Partial<StockInfoCache> & { basePrice: number }> = {
  RELIANCE: {
    company_name: 'Reliance Industries Limited',
    sector: 'Energy & Petrochemicals',
    industry: 'Oil & Gas Refining & Marketing',
    exchange: 'NSE',
    market_cap: '₹20.45 Lakh Cr',
    pe_ratio: 28.4,
    dividend_yield: 0.38,
    fifty_two_week_high: 3024.90,
    fifty_two_week_low: 2220.30,
    description: 'Reliance Industries Limited is an Indian multinational conglomerate headquartered in Mumbai. Its businesses include energy, petrochemicals, natural gas, retail, telecommunications, mass media, and textiles.',
    basePrice: 2942.50,
  },
  TCS: {
    company_name: 'Tata Consultancy Services',
    sector: 'Information Technology',
    industry: 'IT Services & Consulting',
    exchange: 'NSE',
    market_cap: '₹14.82 Lakh Cr',
    pe_ratio: 31.8,
    dividend_yield: 1.25,
    fifty_two_week_high: 4585.90,
    fifty_two_week_low: 3313.00,
    description: 'Tata Consultancy Services is an Indian multinational information technology services and consulting company headquartered in Mumbai. It is a part of the Tata Group.',
    basePrice: 4210.80,
  },
  HDFCBANK: {
    company_name: 'HDFC Bank Limited',
    sector: 'Financial Services',
    industry: 'Private Sector Banking',
    exchange: 'NSE',
    market_cap: '₹12.65 Lakh Cr',
    pe_ratio: 19.2,
    dividend_yield: 1.18,
    fifty_two_week_high: 1794.00,
    fifty_two_week_low: 1363.55,
    description: 'HDFC Bank Limited is an Indian banking and financial services company headquartered in Mumbai. It is India\'s largest private sector bank by assets and world\'s tenth largest bank by market capitalization.',
    basePrice: 1678.20,
  },
  INFY: {
    company_name: 'Infosys Limited',
    sector: 'Information Technology',
    industry: 'Enterprise IT Services',
    exchange: 'NSE',
    market_cap: '₹7.85 Lakh Cr',
    pe_ratio: 27.6,
    dividend_yield: 2.10,
    fifty_two_week_high: 1975.00,
    fifty_two_week_low: 1358.35,
    description: 'Infosys Limited provides business consulting, information technology, and outsourcing services. It was founded in Pune and is headquartered in Bangalore.',
    basePrice: 1895.40,
  },
  TATAMOTORS: {
    company_name: 'Tata Motors Limited',
    sector: 'Automobile',
    industry: 'Commercial & Passenger Vehicles',
    exchange: 'NSE',
    market_cap: '₹3.62 Lakh Cr',
    pe_ratio: 10.8,
    dividend_yield: 0.65,
    fifty_two_week_high: 1179.05,
    fifty_two_week_low: 608.20,
    description: 'Tata Motors Limited is a leading global automobile manufacturer of cars, utility vehicles, pick-ups, trucks, and buses, part of the legendary Tata Group.',
    basePrice: 968.75,
  },
  ICICIBANK: {
    company_name: 'ICICI Bank Limited',
    sector: 'Financial Services',
    industry: 'Private Banking',
    exchange: 'NSE',
    market_cap: '₹8.95 Lakh Cr',
    pe_ratio: 18.5,
    dividend_yield: 0.85,
    fifty_two_week_high: 1332.95,
    fifty_two_week_low: 915.20,
    description: 'ICICI Bank Limited is an Indian multinational bank and financial services company headquartered in Mumbai with widespread retail and corporate operations.',
    basePrice: 1245.60,
  },
  ITC: {
    company_name: 'ITC Limited',
    sector: 'Fast Moving Consumer Goods',
    industry: 'Diversified Conglomerate / FMCG',
    exchange: 'NSE',
    market_cap: '₹6.25 Lakh Cr',
    pe_ratio: 26.2,
    dividend_yield: 2.80,
    fifty_two_week_high: 520.40,
    fifty_two_week_low: 399.30,
    description: 'ITC Limited is an Indian conglomerate company headquartered in Kolkata. ITC has a diversified presence in FMCG, Hotels, Packaging, Paperboards & Specialty Papers, and Agri-Business.',
    basePrice: 489.15,
  },
  BHARTIARTL: {
    company_name: 'Bharti Airtel Limited',
    sector: 'Telecommunications',
    industry: 'Telecom Services',
    exchange: 'NSE',
    market_cap: '₹9.40 Lakh Cr',
    pe_ratio: 54.1,
    dividend_yield: 0.52,
    fifty_two_week_high: 1712.00,
    fifty_two_week_low: 890.00,
    description: 'Bharti Airtel Limited is an Indian multinational telecommunications services company based in New Delhi, operating in 18 countries across South Asia and Africa.',
    basePrice: 1642.30,
  },
  NIFTY50: {
    company_name: 'NIFTY 50 Benchmark Index',
    sector: 'Broad Market Index',
    industry: 'Benchmark Index',
    exchange: 'NSE',
    market_cap: 'Benchmark Index',
    pe_ratio: 22.8,
    dividend_yield: 1.28,
    fifty_two_week_high: 26277.35,
    fifty_two_week_low: 18837.85,
    description: 'The NIFTY 50 is the flagship index on the National Stock Exchange of India (NSE), tracking the behavior of 50 premier blue-chip companies across 13 sectors.',
    basePrice: 25250.00,
  },
};

// Generate deterministic historical data for preview / demo
function generateHistoricalData(symbol: string, basePrice: number, days: number = 365): MarketData[] {
  const result: MarketData[] = [];
  const now = new Date();
  let current = basePrice * 0.78; // start from earlier level

  // Deterministic seed based on symbol letters
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  for (let i = days; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const pseudoRandom = Math.sin(seed * 999 + i * 37) * 0.025 + 0.0008;
    current = Math.max(10, current * (1 + pseudoRandom));
    const open = current * (1 - (Math.cos(i) * 0.005));
    const high = Math.max(open, current) * (1 + Math.abs(Math.sin(i * 3)) * 0.012);
    const low = Math.min(open, current) * (1 - Math.abs(Math.cos(i * 3)) * 0.012);
    const close = current;
    const volume = Math.floor(1500000 + Math.abs(Math.sin(i)) * 4500000);

    result.push({
      id: `mock-${symbol}-${i}`,
      stock_id: `stock-${symbol}`,
      stock_symbol: symbol.toUpperCase(),
      date: d.toISOString().split('T')[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      adj_close: Number(close.toFixed(2)),
      volume,
    });
  }

  return result;
}

export const marketDataService = {
  // Fetch fresh market data from API via Edge Function
  async fetchStockData(symbol: string, interval: string = 'daily'): Promise<{ success: boolean; message: string }> {
    try {
      const response = await supabase.functions.invoke('fetch-market-data', {
        body: { symbol, interval },
      });

      if (response.error) throw response.error;
      return response.data;
    } catch (error: unknown) {
      console.warn('Edge Function fetch failed or not deployed, using local cache:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to fetch' };
    }
  },

  // Get market data from cache (database)
  async getMarketData(symbol: string, limit: number = 365): Promise<MarketData[]> {
    try {
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .eq('stock_symbol', symbol.toUpperCase())
        .order('date', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return (data || []).reverse(); // Reverse to chronological order
      }
    } catch (err) {
      console.warn('Database market_data lookup error, falling back to mock:', err);
    }

    // Fallback if not populated yet
    const upper = symbol.toUpperCase();
    const fallback = FALLBACK_INDIAN_STOCKS[upper];
    const basePrice = fallback?.basePrice || 1250;
    return generateHistoricalData(upper, basePrice, limit);
  },

  // Get stock info from cache
  async getStockInfo(symbol: string): Promise<StockInfoCache | null> {
    const upper = symbol.toUpperCase();
    try {
      const { data, error } = await supabase
        .from('stock_info_cache')
        .select('*')
        .eq('stock_symbol', upper)
        .single();

      if (!error && data) return data;
    } catch (err) {
      console.warn('Database stock_info_cache lookup error:', err);
    }

    // Fallback info for known equities
    const fallback = FALLBACK_INDIAN_STOCKS[upper];
    if (fallback) {
      return {
        id: `mock-info-${upper}`,
        stock_id: `stock-${upper}`,
        stock_symbol: upper,
        company_name: fallback.company_name || upper,
        exchange: fallback.exchange || 'NSE',
        sector: fallback.sector,
        industry: fallback.industry,
        website: `https://${upper.toLowerCase()}.com`,
        description: fallback.description,
        employees_count: 75000,
        market_cap: fallback.market_cap,
        pe_ratio: fallback.pe_ratio,
        dividend_yield: fallback.dividend_yield,
        fifty_two_week_high: fallback.fifty_two_week_high,
        fifty_two_week_low: fallback.fifty_two_week_low,
        last_updated: new Date().toISOString(),
      };
    }

    return {
      id: `mock-info-${upper}`,
      stock_id: `stock-${upper}`,
      stock_symbol: upper,
      company_name: `${upper} Limited`,
      exchange: 'NSE',
      sector: 'Diversified',
      industry: 'Conglomerate',
      last_updated: new Date().toISOString(),
    };
  },

  // Get latest price for a symbol
  async getLatestPrice(symbol: string): Promise<number | null> {
    const upper = symbol.toUpperCase();
    try {
      const quote = await stockService.getQuote(upper);
      if (quote && quote.currentPrice) {
        return quote.currentPrice;
      }
    } catch (err) {
      console.warn('[marketDataService] Failed to get live quote from stockService:', err);
    }

    try {
      const { data, error } = await supabase
        .from('market_data')
        .select('close')
        .eq('stock_symbol', upper)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (!error && data?.close) {
        return data.close;
      }
    } catch (err) {
      console.warn('Could not get latest price from DB:', err);
    }

    const fallback = FALLBACK_INDIAN_STOCKS[upper];
    return fallback?.basePrice || 1000;
  },


  // Get multiple latest prices (for portfolio summary)
  async getLatestPrices(symbols: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};

    for (const symbol of symbols) {
      const price = await this.getLatestPrice(symbol);
      if (price) prices[symbol] = price;
    }

    return prices;
  },

  // Get stock detail (combines info + latest data)
  async getStockDetail(symbol: string): Promise<StockDetail | null> {
    const upper = symbol.toUpperCase();
    try {
      // Try to fetch fresh data
      try {
        await this.fetchStockData(upper);
      } catch (e) {
        console.warn('Could not fetch fresh data, using cached:', e);
      }

      // Get cached market data
      const marketData = await this.getMarketData(upper, 365);
      if (marketData.length === 0) return null;

      const latest = marketData[marketData.length - 1];
      const previous = marketData.length > 1 ? marketData[marketData.length - 2] : latest;

      const dayChange = Number((latest.close - previous.close).toFixed(2));
      const dayChangePercent = Number(((dayChange / previous.close) * 100).toFixed(2));

      // Get stock info
      const info = await this.getStockInfo(upper);

      return {
        symbol: upper,
        companyName: info?.company_name || upper,
        exchange: info?.exchange || 'NSE',
        sector: info?.sector,
        currentPrice: latest.close,
        dayChange,
        dayChangePercent,
        volume: latest.volume,
        marketData,
        info: info || undefined,
      };
    } catch (error) {
      console.error('Error getting stock detail:', error);
      return null;
    }
  },

  // Prepare data for chart (filter by time range)
  getChartData(marketData: MarketData[], range: '1D' | '1W' | '1M' | '6M' | '1Y' | '5Y'): ChartDataPoint[] {
    const today = new Date();
    let cutoffDate = new Date();

    switch (range) {
      case '1D':
        cutoffDate = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days to cover weekend
        break;
      case '1W':
        cutoffDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1M':
        cutoffDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '6M':
        cutoffDate = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1Y':
        cutoffDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '5Y':
        cutoffDate = new Date(today.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
        break;
    }

    let filtered = marketData.filter(d => new Date(d.date) >= cutoffDate);
    if (filtered.length === 0 && marketData.length > 0) {
      filtered = marketData.slice(-Math.min(marketData.length, range === '1D' ? 5 : 10));
    }

    return filtered.map(d => ({
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));
  },

  // List of popular Indian stocks for explore / search
  getTrendingStocks(): Array<{ symbol: string; name: string; sector: string; price: number; change: number }> {
    return [
      { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy', price: 2942.50, change: 1.45 },
      { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT Services', price: 4210.80, change: -0.65 },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', price: 1678.20, change: 0.85 },
      { symbol: 'INFY', name: 'Infosys Limited', sector: 'IT Services', price: 1895.40, change: 2.15 },
      { symbol: 'TATAMOTORS', name: 'Tata Motors', sector: 'Automobile', price: 968.75, change: 3.20 },
      { symbol: 'ICICIBANK', name: 'ICICI Bank', sector: 'Banking', price: 1245.60, change: 0.40 },
      { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG', price: 489.15, change: -0.30 },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom', price: 1642.30, change: 1.10 },
    ];
  },
};
