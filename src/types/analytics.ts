export interface HoldingPerformance {
  id: string;
  symbol: string;
  companyName: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  investedAmount: number;
  currentValue: number;
  profitLoss: number;
  returnPercent: number;
  allocationPercent: number;
  sector?: string;
  purchaseDate: string;
}

export interface PortfolioPerformanceMetrics {
  totalInvested: number;
  currentValue: number;
  absoluteProfitLoss: number;
  overallReturnPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
}

export interface StockAllocationItem {
  symbol: string;
  companyName: string;
  value: number;
  allocationPercent: number;
  color: string;
}

export interface SectorAllocationItem {
  sector: string;
  value: number;
  allocationPercent: number;
  isAvailable: boolean;
}

export interface PortfolioValueHistoryPoint {
  date: string;
  value: number;
  invested: number;
}

export interface RiskMetrics {
  volatility: number | null; // Annualized Volatility %
  sharpeRatio: number | null; // null if insufficient data or zero volatility
  beta: number | null; // null if benchmark data unavailable
  maxDrawdown: number | null; // Maximum drawdown %
  diversificationScore: number; // 0 - 100
  diversificationTier: 'High' | 'Moderate' | 'Concentrated';
  diversificationExplanation: string;
}

export interface CorrelationMatrix {
  symbols: string[];
  matrix: Record<string, Record<string, number | null>>;
  isAvailable: boolean;
  message?: string;
}

export type AnalyticsHistoryRange = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y';

export interface PortfolioAnalyticsResult {
  performance: PortfolioPerformanceMetrics;
  holdings: HoldingPerformance[];
  stockAllocation: StockAllocationItem[];
  sectorAllocation: SectorAllocationItem[];
  history: PortfolioValueHistoryPoint[];
  availableRanges: AnalyticsHistoryRange[];
  risk: RiskMetrics;
  correlation: CorrelationMatrix;
}
