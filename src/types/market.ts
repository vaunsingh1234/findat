export interface MarketData {
  id: string;
  stock_id: string;
  stock_symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adj_close?: number;
  volume: number;
}

export interface StockInfoCache {
  id: string;
  stock_id: string;
  stock_symbol: string;
  company_name: string;
  exchange?: string;
  sector?: string;
  industry?: string;
  website?: string;
  description?: string;
  employees_count?: number;
  market_cap?: string;
  pe_ratio?: number;
  dividend_yield?: number;
  fifty_two_week_high?: number;
  fifty_two_week_low?: number;
  last_updated: string;
}

export interface StockDetail {
  symbol: string;
  companyName: string;
  exchange: string;
  sector?: string;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  volume: number;
  marketData: MarketData[];
  info?: StockInfoCache;
}

export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockQuote {
  symbol: string;
  companyName: string;
  exchange: string;
  currentPrice: number;
  previousClose: number;
  priceChange: number;
  percentageChange: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  timestamp: string;
  isLive: boolean;
  marketState?: 'REGULAR' | 'CLOSED' | 'PRE' | 'POST';
  currency?: string;
  source?: string;
}

export interface TrendingStockItem {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  volume?: number;
  isLive?: boolean;
}
