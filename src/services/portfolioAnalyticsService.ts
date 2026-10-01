import type { Holding } from '../types/portfolio';
import type { MarketData } from '../types/market';
import type {
  HoldingPerformance,
  PortfolioPerformanceMetrics,
  StockAllocationItem,
  SectorAllocationItem,
  PortfolioValueHistoryPoint,
  RiskMetrics,
  CorrelationMatrix,
  AnalyticsHistoryRange,
  PortfolioAnalyticsResult,
} from '../types/analytics';
import { marketDataService } from './marketDataService';
import { stockService } from './stockService';

// FinDat Curated Editorial Palette
const ALLOCATION_PALETTE = [
  '#D9633B', // Terracotta
  '#4F6B3A', // Olive
  '#E9A820', // Mustard
  '#8FAF7E', // Sage
  '#5FA8A0', // Sky Teal
  '#E8C9A0', // Clay
  '#2B2418', // Ink
  '#7A6B55', // Muted
  '#C2542E', // Deep Terracotta
  '#395029', // Dark Olive
];

// Documented default Indian market risk-free rate (6.0%)
export const RISK_FREE_RATE = 0.06;

export const portfolioAnalyticsService = {
  /**
   * Main orchestrator: generates complete analytical telemetry for a portfolio
   */
  async computePortfolioAnalytics(
    holdings: Holding[],
    selectedRange: AnalyticsHistoryRange = '1Y'
  ): Promise<PortfolioAnalyticsResult> {
    if (!holdings || holdings.length === 0) {
      return this.getEmptyAnalyticsResult();
    }

    // 1. Fetch market data, master stock info & live quotes for all distinct symbols
    const distinctSymbols = Array.from(new Set(holdings.map((h) => h.stock_symbol.toUpperCase())));

    const marketDataMap: Record<string, MarketData[]> = {};
    const stockInfoMap: Record<string, any> = {};
    const quoteMap: Record<string, any> = {};

    await Promise.all(
      distinctSymbols.map(async (symbol) => {
        const [data, info, quote] = await Promise.all([
          marketDataService.getMarketData(symbol, 750),
          stockService.getStock(symbol),
          stockService.getQuote(symbol).catch(() => null),
        ]);
        marketDataMap[symbol] = data;
        stockInfoMap[symbol] = {
          company_name: info?.company_name || quote?.companyName || symbol,
          sector: info?.sector || 'Diversified',
          industry: info?.industry,
        };
        if (quote) {
          quoteMap[symbol] = quote;
        }
      })
    );


    // Fetch benchmark data (NIFTY 50) for Beta calculation
    let benchmarkData: MarketData[] = [];
    try {
      benchmarkData = await marketDataService.getMarketData('NIFTY50', 750);
    } catch {
      benchmarkData = [];
    }

    // 2. Extract latest and previous closing prices
    const latestPrices: Record<string, number> = {};
    const prevPrices: Record<string, number> = {};

    for (const symbol of distinctSymbols) {
      const quote = quoteMap[symbol];
      const data = marketDataMap[symbol] || [];
      const holding = holdings.find((h) => h.stock_symbol.toUpperCase() === symbol);
      const fallbackPrice = holding ? Number(holding.purchase_price) : 1000;

      if (quote && typeof quote.currentPrice === 'number' && quote.currentPrice > 0) {
        latestPrices[symbol] = quote.currentPrice;
        prevPrices[symbol] = quote.previousClose || quote.currentPrice;
      } else if (data.length > 0) {
        latestPrices[symbol] = data[data.length - 1].close;
        prevPrices[symbol] = data.length > 1 ? data[data.length - 2].close : data[data.length - 1].close;
      } else {
        latestPrices[symbol] = fallbackPrice;
        prevPrices[symbol] = fallbackPrice;
      }
    }


    // 3. Compute Holding-wise Performance
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalDailyChange = 0;

    const rawHoldings: Array<Omit<HoldingPerformance, 'allocationPercent'>> = holdings.map((h) => {
      const symbol = h.stock_symbol.toUpperCase();
      const currentPrice = latestPrices[symbol] || Number(h.purchase_price);
      const prevPrice = prevPrices[symbol] || currentPrice;
      const quantity = Number(h.quantity);
      const purchasePrice = Number(h.purchase_price);

      const investedAmount = quantity * purchasePrice;
      const currentValue = quantity * currentPrice;
      const profitLoss = currentValue - investedAmount;
      const returnPercent = investedAmount > 0 ? (profitLoss / investedAmount) * 100 : 0;
      const dayChange = quantity * (currentPrice - prevPrice);

      totalInvested += investedAmount;
      totalCurrentValue += currentValue;
      totalDailyChange += dayChange;

      const info = stockInfoMap[symbol];

      return {
        id: h.id,
        symbol,
        companyName: info?.company_name || symbol,
        quantity,
        purchasePrice,
        currentPrice,
        investedAmount,
        currentValue,
        profitLoss,
        returnPercent,
        sector: info?.sector || undefined,
        purchaseDate: h.purchase_date,
      };
    });

    // Compute allocation percentages
    const holdingPerformances: HoldingPerformance[] = rawHoldings.map((h) => ({
      ...h,
      allocationPercent: totalCurrentValue > 0 ? (h.currentValue / totalCurrentValue) * 100 : 0,
    }));

    // 4. Portfolio Performance Totals
    const absoluteProfitLoss = totalCurrentValue - totalInvested;
    const overallReturnPercent = totalInvested > 0 ? (absoluteProfitLoss / totalInvested) * 100 : 0;
    const prevTotalValue = totalCurrentValue - totalDailyChange;
    const dailyChangePercent = prevTotalValue > 0 ? (totalDailyChange / prevTotalValue) * 100 : 0;

    const performance: PortfolioPerformanceMetrics = {
      totalInvested: Number(totalInvested.toFixed(2)),
      currentValue: Number(totalCurrentValue.toFixed(2)),
      absoluteProfitLoss: Number(absoluteProfitLoss.toFixed(2)),
      overallReturnPercent: Number(overallReturnPercent.toFixed(2)),
      dailyChange: Number(totalDailyChange.toFixed(2)),
      dailyChangePercent: Number(dailyChangePercent.toFixed(2)),
    };

    // 5. Stock Allocation
    const stockAllocation: StockAllocationItem[] = holdingPerformances
      .map((h, index) => ({
        symbol: h.symbol,
        companyName: h.companyName,
        value: Number(h.currentValue.toFixed(2)),
        allocationPercent: Number(h.allocationPercent.toFixed(2)),
        color: ALLOCATION_PALETTE[index % ALLOCATION_PALETTE.length],
      }))
      .sort((a, b) => b.value - a.value);

    // 6. Sector Allocation
    const sectorTotals: Record<string, { value: number; count: number; isKnown: boolean }> = {};

    holdingPerformances.forEach((h) => {
      const hasSector = !!h.sector && h.sector.trim().length > 0;
      const sectorName = hasSector ? h.sector! : 'Data unavailable';

      if (!sectorTotals[sectorName]) {
        sectorTotals[sectorName] = { value: 0, count: 0, isKnown: hasSector };
      }
      sectorTotals[sectorName].value += h.currentValue;
      sectorTotals[sectorName].count += 1;
    });

    const sectorAllocation: SectorAllocationItem[] = Object.entries(sectorTotals)
      .map(([sector, data]) => ({
        sector,
        value: Number(data.value.toFixed(2)),
        allocationPercent:
          totalCurrentValue > 0 ? Number(((data.value / totalCurrentValue) * 100).toFixed(2)) : 0,
        isAvailable: data.isKnown,
      }))
      .sort((a, b) => b.value - a.value);

    // 7. Portfolio Value History & Time Range Filter
    const fullHistory = this.computeHistoricalValuation(holdings, marketDataMap);
    const availableRanges = this.determineAvailableRanges(fullHistory);

    const activeRange = availableRanges.includes(selectedRange)
      ? selectedRange
      : availableRanges[availableRanges.length - 1] || '1M';

    const history = this.filterHistoryByRange(fullHistory, activeRange);

    // 8. Risk Metrics: Volatility, Sharpe Ratio, Beta, Max Drawdown, Diversification
    const risk = this.computeRiskMetrics(fullHistory, benchmarkData, holdingPerformances, sectorAllocation);

    // 9. Stock Correlation Matrix
    const correlation = this.computeCorrelationMatrix(distinctSymbols, marketDataMap);

    return {
      performance,
      holdings: holdingPerformances,
      stockAllocation,
      sectorAllocation,
      history,
      availableRanges,
      risk,
      correlation,
    };
  },

  /**
   * Computes daily historical portfolio value: Sum of (Historical Stock Price on date t * Quantity Held)
   */
  computeHistoricalValuation(
    holdings: Holding[],
    marketDataMap: Record<string, MarketData[]>
  ): PortfolioValueHistoryPoint[] {
    // Find all distinct trading dates available across all holdings
    const dateSet = new Set<string>();

    Object.values(marketDataMap).forEach((dataList) => {
      dataList.forEach((d) => dateSet.add(d.date));
    });

    const sortedDates = Array.from(dateSet).sort();
    if (sortedDates.length === 0) return [];

    // Map each symbol to a fast lookup by date: date -> close price
    const priceLookups: Record<string, Record<string, number>> = {};

    Object.entries(marketDataMap).forEach(([symbol, dataList]) => {
      priceLookups[symbol] = {};
      dataList.forEach((d) => {
        priceLookups[symbol][d.date] = d.close;
      });
    });

    const history: PortfolioValueHistoryPoint[] = [];

    // Compute aggregate invested capital
    const totalInvested = holdings.reduce((sum, h) => sum + Number(h.quantity) * Number(h.purchase_price), 0);

    // Track latest known prices as we scan chronologically to bridge any holiday differences
    const lastKnownPrices: Record<string, number> = {};

    sortedDates.forEach((date) => {
      let dayPortfolioValue = 0;
      let validDataCount = 0;

      holdings.forEach((h) => {
        const symbol = h.stock_symbol.toUpperCase();
        const priceOnDate = priceLookups[symbol]?.[date];

        if (priceOnDate !== undefined) {
          lastKnownPrices[symbol] = priceOnDate;
        }

        const price = lastKnownPrices[symbol] || Number(h.purchase_price);
        dayPortfolioValue += price * Number(h.quantity);
        if (lastKnownPrices[symbol] !== undefined) validDataCount++;
      });

      if (validDataCount > 0) {
        history.push({
          date,
          value: Number(dayPortfolioValue.toFixed(2)),
          invested: Number(totalInvested.toFixed(2)),
        });
      }
    });

    return history;
  },

  /**
   * Determine which time-ranges have sufficient historical data points
   */
  determineAvailableRanges(history: PortfolioValueHistoryPoint[]): AnalyticsHistoryRange[] {
    if (history.length === 0) return ['1M'];

    const firstDate = new Date(history[0].date).getTime();
    const lastDate = new Date(history[history.length - 1].date).getTime();
    const totalDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);

    const ranges: AnalyticsHistoryRange[] = [];

    if (totalDays >= 20 || history.length >= 10) ranges.push('1M');
    if (totalDays >= 60 || history.length >= 35) ranges.push('3M');
    if (totalDays >= 120 || history.length >= 70) ranges.push('6M');
    if (totalDays >= 240 || history.length >= 150) ranges.push('1Y');
    if (totalDays >= 700 || history.length >= 400) ranges.push('3Y');
    if (totalDays >= 1400 || history.length >= 800) ranges.push('5Y');

    return ranges.length > 0 ? ranges : ['1M'];
  },

  /**
   * Filter portfolio history points by time range
   */
  filterHistoryByRange(
    history: PortfolioValueHistoryPoint[],
    range: AnalyticsHistoryRange
  ): PortfolioValueHistoryPoint[] {
    if (history.length === 0) return [];

    const lastDate = new Date(history[history.length - 1].date);
    let cutoff = new Date(lastDate);

    switch (range) {
      case '1M':
        cutoff.setMonth(cutoff.getMonth() - 1);
        break;
      case '3M':
        cutoff.setMonth(cutoff.getMonth() - 3);
        break;
      case '6M':
        cutoff.setMonth(cutoff.getMonth() - 6);
        break;
      case '1Y':
        cutoff.setFullYear(cutoff.getFullYear() - 1);
        break;
      case '3Y':
        cutoff.setFullYear(cutoff.getFullYear() - 3);
        break;
      case '5Y':
        cutoff.setFullYear(cutoff.getFullYear() - 5);
        break;
    }

    const filtered = history.filter((p) => new Date(p.date) >= cutoff);
    return filtered.length > 0 ? filtered : history.slice(-Math.min(history.length, 30));
  },

  /**
   * Compute Risk Metrics: Volatility, Sharpe Ratio, Beta, Max Drawdown, Diversification Score
   */
  computeRiskMetrics(
    history: PortfolioValueHistoryPoint[],
    benchmarkData: MarketData[],
    holdings: HoldingPerformance[],
    sectors: SectorAllocationItem[]
  ): RiskMetrics {
    // Need at least 5 points to compute meaningful returns & variance
    if (history.length < 5) {
      return {
        volatility: null,
        sharpeRatio: null,
        beta: null,
        maxDrawdown: null,
        ...this.computeDiversification(holdings, sectors),
      };
    }

    // 1. Calculate Daily Returns
    const dailyReturns: Array<{ date: string; return: number }> = [];
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1].value;
      const curr = history[i].value;
      if (prev > 0) {
        dailyReturns.push({
          date: history[i].date,
          return: (curr - prev) / prev,
        });
      }
    }

    const n = dailyReturns.length;
    if (n < 5) {
      return {
        volatility: null,
        sharpeRatio: null,
        beta: null,
        maxDrawdown: null,
        ...this.computeDiversification(holdings, sectors),
      };
    }

    // 2. Daily Standard Deviation & Annualized Volatility
    const meanDailyReturn = dailyReturns.reduce((sum, r) => sum + r.return, 0) / n;
    const variance =
      dailyReturns.reduce((sum, r) => sum + Math.pow(r.return - meanDailyReturn, 2), 0) / (n - 1);
    const dailyStdDev = Math.sqrt(variance);

    // Annualized Volatility = Daily Standard Deviation × √252
    const annualizedVolatility = dailyStdDev * Math.sqrt(252);
    const volatilityPercent = Number((annualizedVolatility * 100).toFixed(2));

    // 3. Sharpe Ratio = (Annualized Return - Risk Free Rate) / Annualized Volatility
    let sharpeRatio: number | null = null;
    if (annualizedVolatility > 0.0001 && n >= 15) {
      // Annualized Return from daily compounded return or period return
      const periodReturn = (history[history.length - 1].value - history[0].value) / history[0].value;
      const firstDate = new Date(history[0].date).getTime();
      const lastDate = new Date(history[history.length - 1].date).getTime();
      const years = Math.max(0.1, (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 365.25));

      const annualizedReturn = Math.pow(1 + Math.max(-0.99, periodReturn), 1 / years) - 1;
      const rawSharpe = (annualizedReturn - RISK_FREE_RATE) / annualizedVolatility;
      sharpeRatio = Number(rawSharpe.toFixed(2));
    }

    // 4. Beta = Covariance(Portfolio Returns, Benchmark Returns) / Variance(Benchmark Returns)
    let beta: number | null = null;
    if (benchmarkData && benchmarkData.length > 5) {
      const benchmarkLookup: Record<string, number> = {};
      for (let i = 1; i < benchmarkData.length; i++) {
        const prev = benchmarkData[i - 1].close;
        const curr = benchmarkData[i].close;
        if (prev > 0) {
          benchmarkLookup[benchmarkData[i].date] = (curr - prev) / prev;
        }
      }

      // Align dates
      const alignedPairs: Array<{ port: number; bench: number }> = [];
      dailyReturns.forEach((r) => {
        const benchReturn = benchmarkLookup[r.date];
        if (benchReturn !== undefined) {
          alignedPairs.push({ port: r.return, bench: benchReturn });
        }
      });

      if (alignedPairs.length >= 15) {
        const m = alignedPairs.length;
        const meanPort = alignedPairs.reduce((sum, p) => sum + p.port, 0) / m;
        const meanBench = alignedPairs.reduce((sum, p) => sum + p.bench, 0) / m;

        const cov =
          alignedPairs.reduce((sum, p) => sum + (p.port - meanPort) * (p.bench - meanBench), 0) /
          (m - 1);
        const varBench =
          alignedPairs.reduce((sum, p) => sum + Math.pow(p.bench - meanBench, 2), 0) / (m - 1);

        if (varBench > 0.000001) {
          beta = Number((cov / varBench).toFixed(2));
        }
      }
    }

    // 5. Maximum Drawdown = min((Current Value - Previous Peak) / Previous Peak)
    let peak = history[0].value;
    let maxDrawdownFraction = 0;

    history.forEach((point) => {
      if (point.value > peak) {
        peak = point.value;
      }
      if (peak > 0) {
        const drawdown = (point.value - peak) / peak;
        if (drawdown < maxDrawdownFraction) {
          maxDrawdownFraction = drawdown;
        }
      }
    });

    const maxDrawdown = Number((maxDrawdownFraction * 100).toFixed(2));

    // 6. Diversification Score & Tier
    const diversification = this.computeDiversification(holdings, sectors);

    return {
      volatility: volatilityPercent,
      sharpeRatio,
      beta,
      maxDrawdown,
      ...diversification,
    };
  },

  /**
   * Transparent 0-100 diversification scoring model based on holdings count, largest weight, and sector spread
   */
  computeDiversification(
    holdings: HoldingPerformance[],
    sectors: SectorAllocationItem[]
  ): {
    diversificationScore: number;
    diversificationTier: 'High' | 'Moderate' | 'Concentrated';
    diversificationExplanation: string;
  } {
    const count = holdings.length;
    if (count === 0) {
      return {
        diversificationScore: 0,
        diversificationTier: 'Concentrated',
        diversificationExplanation: 'Portfolio contains no active holdings.',
      };
    }

    if (count === 1) {
      return {
        diversificationScore: 20,
        diversificationTier: 'Concentrated',
        diversificationExplanation: 'Single equity holding (100% allocation). High company-specific idiosyncratic risk.',
      };
    }

    // Factor 1: Holding Count (0 - 30 pts)
    const countScore = Math.min(30, (count / 10) * 30);

    // Factor 2: Largest Holding Weight Penalty (0 - 35 pts)
    const maxWeight = Math.max(...holdings.map((h) => h.allocationPercent));
    let weightScore = 35;
    if (maxWeight > 50) weightScore = 8;
    else if (maxWeight > 35) weightScore = 18;
    else if (maxWeight > 25) weightScore = 26;
    else weightScore = 35;

    // Factor 3: Sector Breadth (0 - 35 pts)
    const validSectors = sectors.filter((s) => s.isAvailable);
    const sectorCount = validSectors.length;
    let sectorScore = 10;
    if (sectorCount >= 5) sectorScore = 35;
    else if (sectorCount >= 3) sectorScore = 25;
    else if (sectorCount === 2) sectorScore = 18;
    else sectorScore = 10;

    const totalScore = Math.min(100, Math.max(10, Math.round(countScore + weightScore + sectorScore)));

    let tier: 'High' | 'Moderate' | 'Concentrated' = 'Moderate';
    if (totalScore >= 75) tier = 'High';
    else if (totalScore < 45) tier = 'Concentrated';

    const explanation = `${count} positions across ${sectorCount || 1} sectors. Largest holding (${
      holdings[0]?.symbol || 'top asset'
    }) represents ${maxWeight.toFixed(1)}% of total portfolio value.`;

    return {
      diversificationScore: totalScore,
      diversificationTier: tier,
      diversificationExplanation: explanation,
    };
  },

  /**
   * Computes Pearson correlation matrix between all portfolio holdings
   */
  computeCorrelationMatrix(
    symbols: string[],
    marketDataMap: Record<string, MarketData[]>
  ): CorrelationMatrix {
    if (symbols.length < 2) {
      return {
        symbols,
        matrix: {},
        isAvailable: false,
        message: 'Minimum of 2 holdings required to compute cross-asset correlation matrix.',
      };
    }

    // Build return series map for each symbol
    const returnsBySymbol: Record<string, Record<string, number>> = {};

    symbols.forEach((symbol) => {
      returnsBySymbol[symbol] = {};
      const data = marketDataMap[symbol] || [];
      for (let i = 1; i < data.length; i++) {
        const prev = data[i - 1].close;
        const curr = data[i].close;
        if (prev > 0) {
          returnsBySymbol[symbol][data[i].date] = (curr - prev) / prev;
        }
      }
    });

    const matrix: Record<string, Record<string, number | null>> = {};
    let validPairCount = 0;

    symbols.forEach((s1) => {
      matrix[s1] = {};
      symbols.forEach((s2) => {
        if (s1 === s2) {
          matrix[s1][s2] = 1.0;
          return;
        }

        // Align overlapping dates
        const r1 = returnsBySymbol[s1] || {};
        const r2 = returnsBySymbol[s2] || {};

        const overlappingDates = Object.keys(r1).filter((date) => r2[date] !== undefined);

        if (overlappingDates.length < 10) {
          matrix[s1][s2] = null;
          return;
        }

        const x = overlappingDates.map((d) => r1[d]);
        const y = overlappingDates.map((d) => r2[d]);

        const meanX = x.reduce((a, b) => a + b, 0) / x.length;
        const meanY = y.reduce((a, b) => a + b, 0) / y.length;

        let num = 0;
        let denX = 0;
        let denY = 0;

        for (let i = 0; i < x.length; i++) {
          const dx = x[i] - meanX;
          const dy = y[i] - meanY;
          num += dx * dy;
          denX += dx * dx;
          denY += dy * dy;
        }

        const denom = Math.sqrt(denX * denY);
        if (denom > 0.000001) {
          const corr = Number((num / denom).toFixed(2));
          matrix[s1][s2] = Math.max(-1, Math.min(1, corr));
          validPairCount++;
        } else {
          matrix[s1][s2] = null;
        }
      });
    });

    if (validPairCount === 0) {
      return {
        symbols,
        matrix,
        isAvailable: false,
        message: 'Insufficient overlapping historical data for correlation analysis.',
      };
    }

    return {
      symbols,
      matrix,
      isAvailable: true,
    };
  },

  /**
   * Fallback for empty portfolio state
   */
  getEmptyAnalyticsResult(): PortfolioAnalyticsResult {
    return {
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
        diversificationExplanation: 'No active holdings in portfolio.',
      },
      correlation: {
        symbols: [],
        matrix: {},
        isAvailable: false,
        message: 'No active holdings to analyze correlation.',
      },
    };
  },
};
