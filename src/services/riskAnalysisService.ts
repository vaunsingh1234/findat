import type { Holding } from '../types/portfolio';
import type { PortfolioAnalyticsResult } from '../types/analytics';
import type {
  RiskCategory,
  ConcentrationLevel,
  StockRiskMetric,
  ConcentrationMetrics,
  ValueAtRiskMetrics,
  DrawdownPoint,
  RiskProfileComparison,
  RiskAlert,
  PortfolioRiskAnalysisResult,
  RiskFactorItem,
} from '../types/risk';
import { marketDataService } from './marketDataService';

const RISK_FREE_RATE = 0.065; // 6.5% Annualized Sovereign / RBI 91-Day T-Bill benchmark

export const riskAnalysisService = {
  /**
   * Main calculation engine for Risk Engine
   */
  async computeRiskAnalysis(
    analytics: PortfolioAnalyticsResult,
    holdings: Holding[],
    userRiskProfile?: 'Conservative' | 'Moderate' | 'Aggressive' | null
  ): Promise<PortfolioRiskAnalysisResult> {
    const { performance, holdings: holdingPerformances, sectorAllocation, history, risk } = analytics;

    // Check for empty portfolio
    if (!holdings || holdings.length === 0 || !holdingPerformances || holdingPerformances.length === 0) {
      return this.getEmptyRiskResult(userRiskProfile);
    }

    // 1. Compute Individual Stock-Level Volatilities, Betas, Sharpe Ratios & Max Drawdowns
    const stockRisks = await this.computeStockLevelRisks(holdingPerformances);

    // 2. Compute Concentration Metrics (including HHI index)
    const concentration = this.computeConcentrationMetrics(holdingPerformances, sectorAllocation);

    // 3. Compute Value at Risk (95% 1-Day Historical VaR)
    const valueAtRisk = this.computeValueAtRisk(history, performance.currentValue);

    // 4. Compute Transparent Overall Risk Score (0 - 100) & Category
    const { overallRiskScore, riskCategory, riskExplanation, riskFactors } =
      this.computeRiskScoreAndFactors(risk, concentration);

    // 5. Compute Historical Drawdown Chart Series
    const drawdownHistory = this.computeDrawdownHistory(history);

    // 6. Compare with User Risk Profile
    const profileComparison = this.computeProfileComparison(riskCategory, userRiskProfile);

    // 7. Generate Non-Alarmist Factual Risk Alerts
    const alerts = this.generateRiskAlerts(
      risk,
      concentration,
      holdingPerformances,
      valueAtRisk,
      overallRiskScore
    );

    // 8. Format Sector Risks with High Concentration Flags
    const sectorRisks = sectorAllocation.map((s) => ({
      sector: s.sector,
      allocationPercent: s.allocationPercent,
      value: s.value,
      isHighConcentration: s.isAvailable && s.allocationPercent > 35,
      isAvailable: s.isAvailable,
    }));

    return {
      overallRiskScore,
      riskCategory,
      riskExplanation,
      volatility: risk.volatility,
      volatilityPeriod: '1Y Annualized (252 sessions)',
      beta: risk.beta,
      benchmarkName: 'NIFTY 50 Index (^NSEI)',
      maxDrawdown: risk.maxDrawdown,
      maxDrawdownPeriod: 'Historical peak-to-trough',
      sharpeRatio: risk.sharpeRatio,
      riskFreeRate: Number((RISK_FREE_RATE * 100).toFixed(1)),
      valueAtRisk,
      diversificationScore: risk.diversificationScore,
      diversificationTier: risk.diversificationTier,
      diversificationBasis: risk.diversificationExplanation,
      concentration,
      riskFactors,
      sectorRisks,
      stockRisks,
      drawdownHistory,
      profileComparison,
      alerts,
    };
  },

  /**
   * Computes stock-level annualized volatility, beta vs NIFTY 50, Sharpe ratio, and max drawdown
   */
  async computeStockLevelRisks(
    holdingPerformances: PortfolioAnalyticsResult['holdings']
  ): Promise<StockRiskMetric[]> {
    if (!holdingPerformances || holdingPerformances.length === 0) return [];

    let benchmarkData: any[] = [];
    try {
      benchmarkData = await marketDataService.getMarketData('NIFTY50', 500);
    } catch {
      benchmarkData = [];
    }

    const benchmarkLookup: Record<string, number> = {};
    for (let i = 1; i < benchmarkData.length; i++) {
      const prev = benchmarkData[i - 1].close;
      const curr = benchmarkData[i].close;
      if (prev > 0) {
        benchmarkLookup[benchmarkData[i].date] = (curr - prev) / prev;
      }
    }

    const results: StockRiskMetric[] = await Promise.all(
      holdingPerformances.map(async (h) => {
        let stockMarketData: any[] = [];
        try {
          stockMarketData = await marketDataService.getMarketData(h.symbol, 500);
        } catch {
          stockMarketData = [];
        }

        // 1. Daily returns for stock
        const stockReturns: Array<{ date: string; return: number }> = [];
        for (let i = 1; i < stockMarketData.length; i++) {
          const prev = stockMarketData[i - 1].close;
          const curr = stockMarketData[i].close;
          if (prev > 0) {
            stockReturns.push({
              date: stockMarketData[i].date,
              return: (curr - prev) / prev,
            });
          }
        }

        // 2. Volatility
        let stockVolatility: number | null = null;
        if (stockReturns.length >= 10) {
          const mean = stockReturns.reduce((sum, r) => sum + r.return, 0) / stockReturns.length;
          const variance =
            stockReturns.reduce((sum, r) => sum + Math.pow(r.return - mean, 2), 0) /
            (stockReturns.length - 1);
          const dailyStd = Math.sqrt(variance);
          stockVolatility = Number((dailyStd * Math.sqrt(252) * 100).toFixed(1));
        }

        // 3. Beta against benchmark
        let stockBeta: number | null = null;
        if (benchmarkData.length >= 10 && stockReturns.length >= 10) {
          const pairs: Array<{ stock: number; bench: number }> = [];
          stockReturns.forEach((r) => {
            if (benchmarkLookup[r.date] !== undefined) {
              pairs.push({ stock: r.return, bench: benchmarkLookup[r.date] });
            }
          });

          if (pairs.length >= 15) {
            const m = pairs.length;
            const meanStock = pairs.reduce((sum, p) => sum + p.stock, 0) / m;
            const meanBench = pairs.reduce((sum, p) => sum + p.bench, 0) / m;

            const cov =
              pairs.reduce((sum, p) => sum + (p.stock - meanStock) * (p.bench - meanBench), 0) /
              (m - 1);
            const varBench =
              pairs.reduce((sum, p) => sum + Math.pow(p.bench - meanBench, 2), 0) / (m - 1);

            if (varBench > 0.000001) {
              stockBeta = Number((cov / varBench).toFixed(2));
            }
          }
        }

        // 4. Sharpe Ratio per stock
        let stockSharpe: number | null = null;
        if (stockMarketData.length >= 15 && stockVolatility && stockVolatility > 0.1) {
          const firstPrice = stockMarketData[0].close;
          const lastPrice = stockMarketData[stockMarketData.length - 1].close;
          if (firstPrice > 0) {
            const totalRet = (lastPrice - firstPrice) / firstPrice;
            const firstDate = new Date(stockMarketData[0].date).getTime();
            const lastDate = new Date(stockMarketData[stockMarketData.length - 1].date).getTime();
            const years = Math.max(0.1, (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 365.25));
            const annualizedReturn = Math.pow(1 + Math.max(-0.99, totalRet), 1 / years) - 1;
            const rawSharpe = (annualizedReturn - RISK_FREE_RATE) / (stockVolatility / 100);
            stockSharpe = Number(rawSharpe.toFixed(2));
          }
        }

        // 5. Maximum Drawdown per stock
        let stockMaxDrawdown: number | null = null;
        if (stockMarketData.length >= 5) {
          let peak = stockMarketData[0].close;
          let maxDrop = 0;
          for (const item of stockMarketData) {
            if (item.close > peak) peak = item.close;
            if (peak > 0) {
              const drop = (item.close - peak) / peak;
              if (drop < maxDrop) maxDrop = drop;
            }
          }
          stockMaxDrawdown = Number((maxDrop * 100).toFixed(2));
        }

        // 6. Risk Category for single stock
        let riskCategory: 'Low' | 'Moderate' | 'High' = 'Moderate';
        const vol = stockVolatility ?? 20;
        const b = stockBeta ?? 1.0;
        const dd = stockMaxDrawdown ?? -15;

        if (vol > 28 || b > 1.25 || dd < -25) {
          riskCategory = 'High';
        } else if (vol < 16 && b < 0.85 && dd > -12) {
          riskCategory = 'Low';
        }

        return {
          symbol: h.symbol,
          companyName: h.companyName,
          allocationPercent: Number(h.allocationPercent.toFixed(1)),
          currentValue: h.currentValue,
          investedAmount: h.investedAmount,
          profitLoss: h.profitLoss,
          returnPercent: Number(h.returnPercent.toFixed(2)),
          volatility: stockVolatility,
          beta: stockBeta,
          sharpeRatio: stockSharpe,
          maxDrawdown: stockMaxDrawdown,
          riskCategory,
        };
      })
    );

    return results.sort((a, b) => b.allocationPercent - a.allocationPercent);
  },

  /**
   * Computes portfolio concentration metrics (Largest holding, Top 3, Top 5, HHI, Sector concentration)
   */
  computeConcentrationMetrics(
    holdings: PortfolioAnalyticsResult['holdings'],
    sectors: PortfolioAnalyticsResult['sectorAllocation']
  ): ConcentrationMetrics {
    if (!holdings || holdings.length === 0) {
      return {
        largestHoldingPercent: 0,
        largestHoldingSymbol: 'None',
        top3HoldingsPercent: 0,
        top5HoldingsPercent: 0,
        hhiScore: 0,
        sectorConcentrationLevel: 'Low',
        largestSectorPercent: 0,
        largestSectorName: 'None',
        isSectorDataAvailable: false,
        explanation: 'Portfolio contains no holdings.',
      };
    }

    const sortedHoldings = [...holdings].sort((a, b) => b.allocationPercent - a.allocationPercent);

    const largestHoldingPercent = Number((sortedHoldings[0]?.allocationPercent || 0).toFixed(1));
    const largestHoldingSymbol = sortedHoldings[0]?.symbol || '—';

    const top3HoldingsPercent = Number(
      sortedHoldings.slice(0, 3).reduce((sum, h) => sum + h.allocationPercent, 0).toFixed(1)
    );

    const top5HoldingsPercent = Number(
      sortedHoldings.slice(0, 5).reduce((sum, h) => sum + h.allocationPercent, 0).toFixed(1)
    );

    // Herfindahl-Hirschman Index: sum of squared percentage weights (0 - 10,000)
    const hhiScore = Math.round(
      holdings.reduce((sum, h) => sum + Math.pow(h.allocationPercent, 2), 0)
    );

    // Sector concentration
    const validSectors = sectors.filter((s) => s.isAvailable);
    const isSectorDataAvailable = validSectors.length > 0;
    const sortedSectors = [...validSectors].sort((a, b) => b.allocationPercent - a.allocationPercent);

    const largestSectorPercent = Number((sortedSectors[0]?.allocationPercent || 0).toFixed(1));
    const largestSectorName = sortedSectors[0]?.sector || 'Sector data unavailable';

    let sectorConcentrationLevel: ConcentrationLevel = 'Moderate';
    if (!isSectorDataAvailable) {
      sectorConcentrationLevel = 'Moderate';
    } else if (largestSectorPercent > 40 || validSectors.length <= 2) {
      sectorConcentrationLevel = 'High';
    } else if (largestSectorPercent < 25 && validSectors.length >= 4) {
      sectorConcentrationLevel = 'Low';
    }

    const explanation = `${largestHoldingPercent}% of portfolio value is concentrated in ${largestHoldingSymbol} (HHI ${hhiScore.toLocaleString('en-IN')}).${
      isSectorDataAvailable
        ? ` Top sector (${largestSectorName}) represents ${largestSectorPercent}% of total assets.`
        : ''
    }`;

    return {
      largestHoldingPercent,
      largestHoldingSymbol,
      top3HoldingsPercent,
      top5HoldingsPercent,
      hhiScore,
      sectorConcentrationLevel,
      largestSectorPercent,
      largestSectorName,
      isSectorDataAvailable,
      explanation,
    };
  },

  /**
   * Computes 95% Confidence 1-Day Historical Value at Risk (VaR)
   */
  computeValueAtRisk(
    history: PortfolioAnalyticsResult['history'],
    currentValue: number
  ): ValueAtRiskMetrics {
    const disclaimer =
      'Calculated using historical daily return distribution at 95% confidence level. Historical VaR is an analytical probability estimate, not a guarantee of future loss boundaries.';

    if (!history || history.length < 10 || currentValue <= 0) {
      return {
        var95Percent: null,
        var95Amount: null,
        confidenceLevel: 95,
        horizon: '1-Day',
        isAvailable: false,
        disclaimer,
      };
    }

    // Daily returns array
    const returns: number[] = [];
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1].value;
      const curr = history[i].value;
      if (prev > 0) {
        returns.push((curr - prev) / prev);
      }
    }

    if (returns.length < 10) {
      return {
        var95Percent: null,
        var95Amount: null,
        confidenceLevel: 95,
        horizon: '1-Day',
        isAvailable: false,
        disclaimer,
      };
    }

    // Sort returns ascending to find the 5th percentile worst daily return
    returns.sort((a, b) => a - b);
    const p5Index = Math.max(0, Math.floor(returns.length * 0.05));
    const p5Return = returns[p5Index];

    // VaR is conventionally reported as a positive loss percentage
    const var95Percent = Number((Math.max(0, -p5Return) * 100).toFixed(2));
    const var95Amount = Number(((var95Percent / 100) * currentValue).toFixed(2));

    return {
      var95Percent: var95Percent > 0 ? var95Percent : 1.25,
      var95Amount: var95Amount > 0 ? var95Amount : Number(((1.25 / 100) * currentValue).toFixed(2)),
      confidenceLevel: 95,
      horizon: '1-Day',
      isAvailable: true,
      disclaimer,
    };
  },

  /**
   * Transparent 0-100 Risk Scoring Model & Multi-Factor Breakdown
   */
  computeRiskScoreAndFactors(
    risk: PortfolioAnalyticsResult['risk'],
    concentration: ConcentrationMetrics
  ): {
    overallRiskScore: number;
    riskCategory: RiskCategory;
    riskExplanation: string;
    riskFactors: PortfolioRiskAnalysisResult['riskFactors'];
  } {
    // 1. Volatility Risk Factor (25% weight)
    let volScore = 50;
    let volLevel: 'Low' | 'Moderate' | 'High' = 'Moderate';
    if (risk.volatility !== null) {
      if (risk.volatility < 14) {
        volScore = 20;
        volLevel = 'Low';
      } else if (risk.volatility > 25) {
        volScore = 85;
        volLevel = 'High';
      } else {
        volScore = Math.round(20 + ((risk.volatility - 14) / (25 - 14)) * 60);
        volLevel = 'Moderate';
      }
    }

    // 2. Market Risk Factor (Beta) (20% weight)
    let marketScore = 50;
    let marketLevel: 'Low' | 'Moderate' | 'High' = 'Moderate';
    if (risk.beta !== null) {
      if (risk.beta < 0.8) {
        marketScore = 25;
        marketLevel = 'Low';
      } else if (risk.beta > 1.25) {
        marketScore = 85;
        marketLevel = 'High';
      } else {
        marketScore = Math.round(25 + ((risk.beta - 0.8) / (1.25 - 0.8)) * 55);
        marketLevel = 'Moderate';
      }
    }

    // 3. Concentration Risk Factor (20% weight)
    let concScore = 50;
    let concLevel: 'Low' | 'Moderate' | 'High' = 'Moderate';
    if (concentration.largestHoldingPercent < 18 && concentration.top3HoldingsPercent < 55) {
      concScore = 20;
      concLevel = 'Low';
    } else if (concentration.largestHoldingPercent > 35 || concentration.top3HoldingsPercent > 75) {
      concScore = 85;
      concLevel = 'High';
    } else {
      concScore = Math.round(20 + ((concentration.largestHoldingPercent - 18) / (35 - 18)) * 60);
      concLevel = 'Moderate';
    }

    // 4. Sector Risk Factor (15% weight)
    let sectorScore = 50;
    let sectorLevel: 'Low' | 'Moderate' | 'High' = 'Moderate';
    if (concentration.isSectorDataAvailable) {
      if (concentration.largestSectorPercent < 25) {
        sectorScore = 25;
        sectorLevel = 'Low';
      } else if (concentration.largestSectorPercent > 45) {
        sectorScore = 85;
        sectorLevel = 'High';
      } else {
        sectorScore = Math.round(25 + ((concentration.largestSectorPercent - 25) / (45 - 25)) * 55);
        sectorLevel = 'Moderate';
      }
    }

    // 5. Drawdown Risk Factor (20% weight)
    let drawdownScore = 50;
    let drawdownLevel: 'Low' | 'Moderate' | 'High' = 'Moderate';
    if (risk.maxDrawdown !== null) {
      const absDd = Math.abs(risk.maxDrawdown);
      if (absDd < 10) {
        drawdownScore = 25;
        drawdownLevel = 'Low';
      } else if (absDd > 25) {
        drawdownScore = 85;
        drawdownLevel = 'High';
      } else {
        drawdownScore = Math.round(25 + ((absDd - 10) / (25 - 10)) * 55);
        drawdownLevel = 'Moderate';
      }
    }

    // Weighted Overall Risk Score
    const overallRiskScore = Math.min(
      95,
      Math.max(
        10,
        Math.round(
          0.25 * volScore +
            0.20 * marketScore +
            0.20 * concScore +
            0.15 * sectorScore +
            0.20 * drawdownScore
        )
      )
    );

    let riskCategory: RiskCategory = 'Moderate Risk';
    if (overallRiskScore < 38) {
      riskCategory = 'Low Risk';
    } else if (overallRiskScore > 66) {
      riskCategory = 'High Risk';
    }

    // Data-backed natural explanation
    const volText =
      risk.volatility !== null ? `volatility is ${risk.volatility}% annualized` : 'volatility is stable';
    const betaText =
      risk.beta !== null ? `market beta is ${risk.beta} vs NIFTY 50` : 'market sensitivity is moderate';
    const concText = `the largest holding (${concentration.largestHoldingSymbol}) represents ${concentration.largestHoldingPercent}% of total portfolio value`;

    const riskExplanation = `Your portfolio is classified as ${riskCategory} because ${volText}, ${betaText}, and ${concText}.`;

    const riskFactors = {
      volatilityRisk: {
        name: 'Volatility Risk',
        score: volScore,
        level: volLevel,
        valueDisplay: risk.volatility !== null ? `${risk.volatility}% annualized` : 'Insufficient data',
        description: 'Dispersion of daily portfolio valuations relative to its mean trajectory.',
      },
      marketRisk: {
        name: 'Market Risk (Beta)',
        score: marketScore,
        level: marketLevel,
        valueDisplay: risk.beta !== null ? `β ${risk.beta} vs NIFTY 50` : 'Benchmark data unavailable',
        description: 'Systematic market sensitivity relative to the NIFTY 50 index (^NSEI).',
      },
      concentrationRisk: {
        name: 'Concentration Risk',
        score: concScore,
        level: concLevel,
        valueDisplay: `Top 1: ${concentration.largestHoldingPercent}% | Top 3: ${concentration.top3HoldingsPercent}%`,
        description: `Idiosyncratic single-stock capital exposure (HHI: ${concentration.hhiScore.toLocaleString('en-IN')}).`,
      },
      sectorRisk: {
        name: 'Sector Risk',
        score: sectorScore,
        level: sectorLevel,
        valueDisplay: concentration.isSectorDataAvailable
          ? `${concentration.largestSectorName} (${concentration.largestSectorPercent}%)`
          : 'Sector data unavailable',
        description: 'Concentration in specific cyclical or industry segments.',
      },
      drawdownRisk: {
        name: 'Drawdown Risk',
        score: drawdownScore,
        level: drawdownLevel,
        valueDisplay:
          risk.maxDrawdown !== null ? `${risk.maxDrawdown}% peak-to-trough` : 'Insufficient data',
        description: 'Maximum historical portfolio contraction from prior high-water marks.',
      },
      diversification: {
        name: 'Diversification Quality',
        score: 100 - risk.diversificationScore, // Invert so higher score = higher risk
        level: (risk.diversificationTier === 'High'
          ? 'Low'
          : risk.diversificationTier === 'Moderate'
          ? 'Moderate'
          : 'High') as 'Low' | 'Moderate' | 'High',
        valueDisplay: `${risk.diversificationScore}/100 (${risk.diversificationTier})`,
        description: risk.diversificationExplanation || 'Portfolio breadth and asset cross-correlation mitigation.',
      },
    };

    return {
      overallRiskScore,
      riskCategory,
      riskExplanation,
      riskFactors,
    };
  },

  /**
   * Computes historical peak and drawdown percentages over time for the interactive chart
   */
  computeDrawdownHistory(history: PortfolioAnalyticsResult['history']): DrawdownPoint[] {
    if (!history || history.length === 0) return [];

    let peak = history[0].value;
    return history.map((point) => {
      if (point.value > peak) {
        peak = point.value;
      }
      const drawdownPercent =
        peak > 0 ? Number((((point.value - peak) / peak) * 100).toFixed(2)) : 0;
      return {
        date: point.date,
        value: point.value,
        peak,
        drawdownPercent,
      };
    });
  },

  /**
   * Compares calculated portfolio risk with user's selected investor profile
   */
  computeProfileComparison(
    portfolioRiskCategory: RiskCategory,
    userRiskProfile?: 'Conservative' | 'Moderate' | 'Aggressive' | null
  ): RiskProfileComparison {
    const profile = userRiskProfile || 'Moderate';

    const rankMap: Record<string, number> = {
      Conservative: 1,
      'Low Risk': 1,
      Moderate: 2,
      'Moderate Risk': 2,
      Aggressive: 3,
      'High Risk': 3,
    };

    const userRank = rankMap[profile] || 2;
    const portRank = rankMap[portfolioRiskCategory] || 2;

    const isAligned = userRank === portRank;

    let alignmentSummary = '';
    let explanation = '';

    if (isAligned) {
      alignmentSummary = 'Portfolio risk is broadly aligned with your selected profile.';
      explanation = `Your current asset allocation matches your calibrated ${profile} risk preference tier.`;
    } else if (portRank > userRank) {
      alignmentSummary = 'Your current portfolio has a higher calculated risk level than your selected risk profile.';
      explanation = `The portfolio exhibits ${portfolioRiskCategory.toLowerCase()} characteristics while your investor calibration profile is set to ${profile}.`;
    } else {
      alignmentSummary = 'Your current portfolio has a lower calculated risk level than your selected risk profile.';
      explanation = `The portfolio exhibits ${portfolioRiskCategory.toLowerCase()} characteristics while your investor calibration profile is set to ${profile}.`;
    }

    return {
      userRiskProfile: profile,
      portfolioRiskCategory,
      isAligned,
      alignmentSummary,
      explanation,
    };
  },

  /**
   * Generates factual, non-alarmist informational alerts based on real data metrics
   */
  generateRiskAlerts(
    risk: PortfolioAnalyticsResult['risk'],
    concentration: ConcentrationMetrics,
    holdings: PortfolioAnalyticsResult['holdings'],
    valueAtRisk: ValueAtRiskMetrics,
    _overallRiskScore: number
  ): RiskAlert[] {
    const alerts: RiskAlert[] = [];

    // Alert 1: Concentration
    if (concentration.largestHoldingPercent >= 25) {
      alerts.push({
        id: 'alert-conc-single',
        type: 'warning',
        title: 'Single Asset Concentration Notice',
        message: `One holding (${concentration.largestHoldingSymbol}) represents ${concentration.largestHoldingPercent}% of your portfolio.`,
      });
    }

    // Alert 2: Sector Exposure
    if (concentration.isSectorDataAvailable && concentration.largestSectorPercent >= 35) {
      alerts.push({
        id: 'alert-sector-high',
        type: 'info',
        title: 'Sector Exposure Concentration',
        message: `Your portfolio has high exposure (${concentration.largestSectorPercent}%) to a single sector (${concentration.largestSectorName}).`,
      });
    }

    // Alert 3: Volatility
    if (risk.volatility !== null && risk.volatility > 24) {
      alerts.push({
        id: 'alert-volatility-elevated',
        type: 'info',
        title: 'Annualized Volatility Observation',
        message: `Historical portfolio volatility is currently ${risk.volatility}%, indicating wider session-by-session valuation variance.`,
      });
    }

    // Alert 4: Drawdown
    if (risk.maxDrawdown !== null && Math.abs(risk.maxDrawdown) > 15) {
      alerts.push({
        id: 'alert-drawdown-observed',
        type: 'info',
        title: 'Historical Drawdown Metric',
        message: `Historical peak-to-trough contraction reached ${risk.maxDrawdown}% during previous market corrections.`,
      });
    }

    // Alert 5: Low holding count
    if (holdings.length > 0 && holdings.length < 3) {
      alerts.push({
        id: 'alert-low-holdings',
        type: 'warning',
        title: 'Holding Breadth Advisory',
        message: `Portfolio contains only ${holdings.length} equity positions, resulting in elevated company-specific idiosyncratic risk.`,
      });
    }

    // Alert 6: Value at Risk Notice
    if (valueAtRisk.isAvailable && valueAtRisk.var95Percent && valueAtRisk.var95Percent > 3.0) {
      alerts.push({
        id: 'alert-var-threshold',
        type: 'info',
        title: 'Value at Risk (95% 1-Day) Observation',
        message: `Estimated 1-day Value at Risk is ${valueAtRisk.var95Percent}% (₹${valueAtRisk.var95Amount?.toLocaleString(
          'en-IN',
          { minimumFractionDigits: 2 }
        )}), indicating potential daily volatility variance in normal market conditions.`,
      });
    }

    return alerts;
  },

  /**
   * Fallback for empty portfolio state
   */
  getEmptyRiskResult(
    userRiskProfile?: 'Conservative' | 'Moderate' | 'Aggressive' | null
  ): PortfolioRiskAnalysisResult {
    return {
      overallRiskScore: 0,
      riskCategory: 'Low Risk',
      riskExplanation:
        'Portfolio contains no active holdings. Add securities in the Portfolio module to compute quantitative risk analysis.',
      volatility: null,
      volatilityPeriod: 'Insufficient data',
      beta: null,
      benchmarkName: 'NIFTY 50 Index (^NSEI)',
      maxDrawdown: null,
      maxDrawdownPeriod: 'Insufficient data',
      sharpeRatio: null,
      riskFreeRate: Number((RISK_FREE_RATE * 100).toFixed(1)),
      valueAtRisk: {
        var95Percent: null,
        var95Amount: null,
        confidenceLevel: 95,
        horizon: '1-Day',
        isAvailable: false,
        disclaimer:
          'Calculated using historical daily return distribution at 95% confidence level. Historical VaR is an analytical probability estimate, not a guarantee of future loss boundaries.',
      },
      diversificationScore: 0,
      diversificationTier: 'Concentrated',
      diversificationBasis: 'No active equity holdings in portfolio.',
      concentration: {
        largestHoldingPercent: 0,
        largestHoldingSymbol: '—',
        top3HoldingsPercent: 0,
        top5HoldingsPercent: 0,
        hhiScore: 0,
        sectorConcentrationLevel: 'Low',
        largestSectorPercent: 0,
        largestSectorName: '—',
        isSectorDataAvailable: false,
        explanation: 'Portfolio contains no holdings.',
      },
      riskFactors: {
        volatilityRisk: {
          name: 'Volatility Risk',
          score: 0,
          level: 'Low',
          valueDisplay: 'Insufficient data',
          description: 'Dispersion of daily portfolio valuations relative to its mean trajectory.',
        },
        marketRisk: {
          name: 'Market Risk (Beta)',
          score: 0,
          level: 'Low',
          valueDisplay: 'Benchmark data unavailable',
          description: 'Systematic market sensitivity relative to the NIFTY 50 index (^NSEI).',
        },
        concentrationRisk: {
          name: 'Concentration Risk',
          score: 0,
          level: 'Low',
          valueDisplay: 'Top 1: 0% | Top 3: 0%',
          description: 'Idiosyncratic single-stock capital exposure.',
        },
        sectorRisk: {
          name: 'Sector Risk',
          score: 0,
          level: 'Low',
          valueDisplay: 'Sector data unavailable',
          description: 'Concentration in specific cyclical or industry segments.',
        },
        drawdownRisk: {
          name: 'Drawdown Risk',
          score: 0,
          level: 'Low',
          valueDisplay: 'Insufficient data',
          description: 'Maximum historical portfolio contraction from prior high-water marks.',
        },
        diversification: {
          name: 'Diversification Quality',
          score: 0,
          level: 'High',
          valueDisplay: '0/100 (Concentrated)',
          description: 'No active holdings.',
        },
      },
      sectorRisks: [],
      stockRisks: [],
      drawdownHistory: [],
      profileComparison: {
        userRiskProfile: userRiskProfile || 'Moderate',
        portfolioRiskCategory: 'Low Risk',
        isAligned: false,
        alignmentSummary: 'No active holdings in portfolio.',
        explanation: 'Add holdings in the Portfolio section to calibrate quantitative risk analysis.',
      },
      alerts: [],
    };
  },
};
