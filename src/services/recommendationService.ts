import type { HoldingPerformance, SectorAllocationItem } from '../types/analytics';
import type { PortfolioRiskAnalysisResult } from '../types/risk';
import { stockService } from './stockService';
import indianStocksMaster from '../data/indianStocksMaster.json';

export interface AnalyticalCandidate {
  symbol: string;
  companyName: string;
  sector: string;
  marketCap: 'Large Cap' | 'Mid Cap';
  currentPrice: number;
  dayChangePercent: number;
  peRatio: number;
  dividendYield: number;
  estimatedBeta: number;
  volatilityTier: 'Low' | 'Moderate' | 'High';
  rationale: string;
  fitScore: number; // 0 - 100
  diversificationImpact: 'High Benefit' | 'Moderate Benefit' | 'Neutral';
}

export interface WhatIfSimulationResult {
  candidateSymbol: string;
  quantity: number;
  price: number;
  investedDelta: number;
  currentValueBefore: number;
  currentValueAfter: number;
  topHoldingWeightBefore: number;
  topHoldingWeightAfter: number;
  sectorWeightBefore: number;
  sectorWeightAfter: number;
  estimatedBetaBefore: number;
  estimatedBetaAfter: number;
}

export const recommendationService = {
  /**
   * Generates deterministic, data-driven analytical signals and portfolio enhancement opportunities
   */
  async generateRecommendations(
    holdings: HoldingPerformance[],
    sectorAllocation: SectorAllocationItem[],
    riskData?: PortfolioRiskAnalysisResult | null
  ): Promise<{
    portfolioObservations: string[];
    diversificationOpportunities: string[];
    riskObservations: string[];
    candidates: AnalyticalCandidate[];
    underweightSectors: string[];
  }> {
    const portfolioObservations: string[] = [];
    const diversificationOpportunities: string[] = [];
    const riskObservations: string[] = [];

    // 1. Analyze existing sector coverage
    const heldSectors = new Set(
      sectorAllocation.filter((s) => s.isAvailable && s.allocationPercent > 0).map((s) => s.sector)
    );

    const ALL_MAJOR_SECTORS = [
      'Information Technology',
      'Financial Services',
      'Energy & Petrochemicals',
      'Automobile',
      'Healthcare',
      'Fast Moving Consumer Goods',
      'Metals & Mining',
      'Telecommunications',
    ];

    const underweightSectors = ALL_MAJOR_SECTORS.filter((sec) => !heldSectors.has(sec));

    // 2. Observations
    if (holdings.length === 0) {
      portfolioObservations.push('Portfolio has no active holdings. Establishing initial core bluechip anchors will build baseline diversification.');
    } else {
      const largestHolding = [...holdings].sort((a, b) => b.allocationPercent - a.allocationPercent)[0];
      if (largestHolding && largestHolding.allocationPercent >= 25) {
        portfolioObservations.push(
          `Elevated single-asset exposure: ${largestHolding.symbol} represents ${largestHolding.allocationPercent.toFixed(
            1
          )}% of total portfolio value. Regulatory prudential limit is typically 20%-25%.`
        );
      }

      const largestSector = [...sectorAllocation].sort((a, b) => b.allocationPercent - a.allocationPercent)[0];
      if (largestSector && largestSector.allocationPercent >= 35) {
        portfolioObservations.push(
          `Sector concentration: ${largestSector.sector} constitutes ${largestSector.allocationPercent.toFixed(
            1
          )}% of allocated capital, increasing sector-specific cyclical sensitivity.`
        );
      }
    }

    // 3. Diversification opportunities
    if (underweightSectors.length > 0) {
      diversificationOpportunities.push(
        `Portfolio holds zero capital in ${underweightSectors.slice(0, 3).join(', ')}. Capital allocation into non-correlated sectors mitigates systematic drawdowns.`
      );
    } else {
      diversificationOpportunities.push(
        'Portfolio exhibits comprehensive sector distribution across all primary Indian industry verticals.'
      );
    }

    // 4. Risk observations
    if (riskData) {
      if (riskData.volatility !== null && riskData.volatility > 22) {
        riskObservations.push(
          `Annualized volatility is elevated at ${riskData.volatility}%. Incorporating defensive FMCG or low-beta utility equities can dampen session-by-session drawdown variance.`
        );
      }
      if (riskData.beta !== null && riskData.beta > 1.15) {
        riskObservations.push(
          `Portfolio beta (${riskData.beta}) indicates aggressive systematic market leverage relative to NIFTY 50.`
        );
      }
    }

    // 5. Select high-grade candidates from master universe
    const candidateUniverse = [
      {
        symbol: 'ITC',
        name: 'ITC Limited',
        sector: 'Fast Moving Consumer Goods',
        marketCap: 'Large Cap' as const,
        pe: 26.2,
        divYield: 2.8,
        beta: 0.72,
        volTier: 'Low' as const,
        rationale: 'Defensive consumer conglomerate with consistent operating cashflows and low beta vs NIFTY.',
      },
      {
        symbol: 'INFY',
        name: 'Infosys Limited',
        sector: 'Information Technology',
        marketCap: 'Large Cap' as const,
        pe: 27.6,
        divYield: 2.1,
        beta: 0.95,
        volTier: 'Moderate' as const,
        rationale: 'Tier-1 IT exporter offering cross-currency dollar revenue hedge against domestic cycle variance.',
      },
      {
        symbol: 'HDFCBANK',
        name: 'HDFC Bank Limited',
        sector: 'Financial Services',
        marketCap: 'Large Cap' as const,
        pe: 19.2,
        divYield: 1.18,
        beta: 0.98,
        volTier: 'Moderate' as const,
        rationale: 'Core retail banking franchise trading at attractive historical price-to-earnings multiples.',
      },
      {
        symbol: 'SUNPHARMA',
        name: 'Sun Pharmaceutical Industries',
        sector: 'Healthcare',
        marketCap: 'Large Cap' as const,
        pe: 34.5,
        divYield: 0.95,
        beta: 0.68,
        volTier: 'Low' as const,
        rationale: 'Leading specialty healthcare provider offering negative cross-asset return correlation.',
      },
      {
        symbol: 'TATAMOTORS',
        name: 'Tata Motors Limited',
        sector: 'Automobile',
        marketCap: 'Large Cap' as const,
        pe: 10.8,
        divYield: 0.65,
        beta: 1.28,
        volTier: 'Moderate' as const,
        rationale: 'Commercial & electric vehicle automotive manufacturer with strong operational balance sheet recovery.',
      },
      {
        symbol: 'TCS',
        name: 'Tata Consultancy Services',
        sector: 'Information Technology',
        marketCap: 'Large Cap' as const,
        pe: 31.8,
        divYield: 1.25,
        beta: 0.88,
        volTier: 'Low' as const,
        rationale: 'Market cap benchmark leader with robust dividend distribution and return on equity above 45%.',
      },
      {
        symbol: 'BHARTIARTL',
        name: 'Bharti Airtel Limited',
        sector: 'Telecommunications',
        marketCap: 'Large Cap' as const,
        pe: 54.1,
        divYield: 0.52,
        beta: 0.82,
        volTier: 'Moderate' as const,
        rationale: 'Dominant mobile broadband infrastructure with structural ARPU expansion tailwinds.',
      },
      {
        symbol: 'LTIM',
        name: 'LTIMindtree Limited',
        sector: 'Information Technology',
        marketCap: 'Mid Cap' as const,
        pe: 32.4,
        divYield: 1.1,
        beta: 1.12,
        volTier: 'Moderate' as const,
        rationale: 'High-growth mid-to-large IT services provider with strong digital transformation deal pipeline.',
      },
    ];

    // Fetch live quotes for candidates
    const candidates: AnalyticalCandidate[] = await Promise.all(
      candidateUniverse.map(async (c) => {
        let price = 1000;
        let change = 0.5;
        try {
          const q = await stockService.getQuote(c.symbol);
          price = q.currentPrice;
          change = q.percentageChange;
        } catch {
          // fallback
        }

        const isUnderweight = underweightSectors.includes(c.sector);
        const fitScore = isUnderweight ? 92 : 78;
        const diversificationImpact = isUnderweight ? 'High Benefit' : 'Moderate Benefit';

        return {
          symbol: c.symbol,
          companyName: c.name,
          sector: c.sector,
          marketCap: c.marketCap,
          currentPrice: price,
          dayChangePercent: change,
          peRatio: c.pe,
          dividendYield: c.divYield,
          estimatedBeta: c.beta,
          volatilityTier: c.volTier,
          rationale: c.rationale,
          fitScore,
          diversificationImpact,
        };
      })
    );

    return {
      portfolioObservations,
      diversificationOpportunities,
      riskObservations,
      candidates,
      underweightSectors,
    };
  },

  /**
   * Run a What-If Portfolio Impact Simulation
   */
  simulateHoldingAddition(
    holdings: HoldingPerformance[],
    sectorAllocation: SectorAllocationItem[],
    candidateSymbol: string,
    quantity: number,
    price: number,
    currentPortfolioBeta: number = 1.0
  ): WhatIfSimulationResult {
    const totalCurrentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const additionValue = quantity * price;
    const newTotalValue = totalCurrentValue + additionValue;

    // Largest holding weight before & after
    const maxBefore = holdings.length > 0 ? Math.max(...holdings.map((h) => h.allocationPercent)) : 0;
    const existingHolding = holdings.find((h) => h.symbol.toUpperCase() === candidateSymbol.toUpperCase());

    let maxAfter = maxBefore;
    if (existingHolding) {
      const newHoldingVal = existingHolding.currentValue + additionValue;
      maxAfter = Number(((newHoldingVal / newTotalValue) * 100).toFixed(1));
    } else {
      const newHoldingWeight = (additionValue / newTotalValue) * 100;
      maxAfter = Number(Math.max(newHoldingWeight, (maxBefore * totalCurrentValue) / newTotalValue).toFixed(1));
    }

    // Candidate sector
    const masterStock = (indianStocksMaster as any[]).find((s) => s.symbol.toUpperCase() === candidateSymbol.toUpperCase());
    const sectorName = masterStock?.sector || 'Diversified';

    const existingSector = sectorAllocation.find((s) => s.sector === sectorName);
    const sectorWeightBefore = existingSector ? existingSector.allocationPercent : 0;
    const sectorValBefore = existingSector ? existingSector.value : 0;
    const sectorWeightAfter = Number((((sectorValBefore + additionValue) / newTotalValue) * 100).toFixed(1));

    // Estimated Beta impact
    const candidateBeta = 0.95; // default conservative estimate
    const betaBefore = currentPortfolioBeta || 1.0;
    const betaAfter = Number(
      ((betaBefore * totalCurrentValue + candidateBeta * additionValue) / newTotalValue).toFixed(2)
    );

    return {
      candidateSymbol,
      quantity,
      price,
      investedDelta: additionValue,
      currentValueBefore: totalCurrentValue,
      currentValueAfter: newTotalValue,
      topHoldingWeightBefore: Number(maxBefore.toFixed(1)),
      topHoldingWeightAfter: maxAfter,
      sectorWeightBefore: Number(sectorWeightBefore.toFixed(1)),
      sectorWeightAfter,
      estimatedBetaBefore: betaBefore,
      estimatedBetaAfter: betaAfter,
    };
  },
};
