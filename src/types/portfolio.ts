export interface Stock {
  id?: string;
  symbol: string;
  company_name: string;
  exchange?: string;
  isin?: string;
  sector?: string;
  industry?: string;
  bse_code?: string;
  bseCode?: string;
  series?: string;
  stock_type?: string;
  stockType?: string;
  status?: string;
  companyName?: string;
  created_at?: string;
}

export interface Holding {
  id: string;
  portfolio_id: string;
  stock_id?: string;
  stock_symbol: string;
  quantity: number;
  purchase_price: number;
  purchase_date: string; // ISO date
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface HoldingWithCalculations extends Holding {
  currentPrice?: number;
  investedValue: number;
  currentValue?: number;
  absoluteReturn?: number;
  percentageReturn?: number;
}

export interface PortfolioSummary {
  portfolio: Portfolio;
  holdings: HoldingWithCalculations[];
  totalInvested: number;
  totalCurrentValue: number;
  totalAbsoluteReturn: number;
  totalPercentageReturn: number;
  dayChange?: number;
}
