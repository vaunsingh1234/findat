export type RiskCategory = 'Low Risk' | 'Moderate Risk' | 'High Risk';
export type ConcentrationLevel = 'Low' | 'Moderate' | 'High';

export interface StockRiskMetric {
  symbol: string;
  companyName: string;
  allocationPercent: number;
  currentValue: number;
  investedAmount: number;
  profitLoss: number;
  returnPercent: number;
  volatility: number | null; // Annualized %
  beta: number | null; // vs NIFTY 50
  sharpeRatio: number | null; // (Rp - Rf) / Volatility
  maxDrawdown: number | null; // Historical peak-to-trough %
  riskCategory: 'Low' | 'Moderate' | 'High';
}

export interface ValueAtRiskMetrics {
  var95Percent: number | null; // e.g. 2.15% (1-day 95% VaR)
  var95Amount: number | null; // in INR
  confidenceLevel: number; // 95
  horizon: string; // '1-Day'
  isAvailable: boolean;
  disclaimer: string;
}

export interface ConcentrationMetrics {
  largestHoldingPercent: number;
  largestHoldingSymbol: string;
  top3HoldingsPercent: number;
  top5HoldingsPercent: number;
  hhiScore: number; // Herfindahl-Hirschman Index (0 - 10,000)
  sectorConcentrationLevel: ConcentrationLevel;
  largestSectorPercent: number;
  largestSectorName: string;
  isSectorDataAvailable: boolean;
  explanation: string;
}

export interface RiskFactorItem {
  name: string;
  score: number; // 0 - 100
  level: 'Low' | 'Moderate' | 'High';
  valueDisplay: string;
  description: string;
}

export interface DrawdownPoint {
  date: string;
  value: number;
  peak: number;
  drawdownPercent: number;
}

export interface RiskProfileComparison {
  userRiskProfile: 'Conservative' | 'Moderate' | 'Aggressive' | 'Not Set';
  portfolioRiskCategory: RiskCategory;
  isAligned: boolean;
  alignmentSummary: string;
  explanation: string;
}

export interface RiskAlert {
  id: string;
  type: 'info' | 'warning' | 'alert';
  title: string;
  message: string;
}

export interface PortfolioRiskAnalysisResult {
  overallRiskScore: number; // 0 - 100
  riskCategory: RiskCategory;
  riskExplanation: string;
  volatility: number | null;
  volatilityPeriod: string;
  beta: number | null;
  benchmarkName: string;
  maxDrawdown: number | null;
  maxDrawdownPeriod: string;
  sharpeRatio: number | null;
  riskFreeRate: number; // e.g. 6.5%
  valueAtRisk: ValueAtRiskMetrics;
  diversificationScore: number;
  diversificationTier: 'High' | 'Moderate' | 'Concentrated';
  diversificationBasis: string;
  concentration: ConcentrationMetrics;
  riskFactors: {
    volatilityRisk: RiskFactorItem;
    marketRisk: RiskFactorItem;
    concentrationRisk: RiskFactorItem;
    sectorRisk: RiskFactorItem;
    drawdownRisk: RiskFactorItem;
    diversification: RiskFactorItem;
  };
  sectorRisks: Array<{
    sector: string;
    allocationPercent: number;
    value: number;
    isHighConcentration: boolean;
    isAvailable: boolean;
  }>;
  stockRisks: StockRiskMetric[];
  drawdownHistory: DrawdownPoint[];
  profileComparison: RiskProfileComparison;
  alerts: RiskAlert[];
}
