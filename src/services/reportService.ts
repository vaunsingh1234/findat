import { supabase } from './authService';
import type { PortfolioAnalyticsResult } from '../types/analytics';
import type { PortfolioRiskAnalysisResult } from '../types/risk';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface GeneratedReport {
  id: string;
  userId: string;
  portfolioId: string;
  portfolioName: string;
  generatedAt: string;
  analytics: PortfolioAnalyticsResult;
  riskData: PortfolioRiskAnalysisResult;
  observations: string[];
}

export const reportService = {
  /**
   * Compiles live portfolio analytics and risk data into a structured report
   */
  generateReport(
    userId: string,
    portfolioId: string,
    portfolioName: string,
    analytics: PortfolioAnalyticsResult,
    riskData: PortfolioRiskAnalysisResult
  ): GeneratedReport {
    const observations: string[] = [];

    // Formulate observations
    const perf = analytics.performance;
    if (perf.overallReturnPercent >= 0) {
      observations.push(`Portfolio has generated a positive total return of +${perf.overallReturnPercent.toFixed(2)}% on ₹${perf.totalInvested.toLocaleString('en-IN')}.`);
    } else {
      observations.push(`Portfolio reflects an unrealized contraction of ${perf.overallReturnPercent.toFixed(2)}% against cost basis.`);
    }

    if (riskData.concentration.largestHoldingPercent >= 25) {
      observations.push(`Single-asset concentration alert: ${riskData.concentration.largestHoldingSymbol} represents ${riskData.concentration.largestHoldingPercent}% of portfolio value.`);
    }

    if (riskData.volatility !== null) {
      observations.push(`Annualized session volatility is calculated at ${riskData.volatility}% vs historical NIFTY 50 baseline.`);
    }

    if (riskData.sharpeRatio !== null) {
      observations.push(`Sharpe ratio stands at ${riskData.sharpeRatio} under a Sovereign 6.5% risk-free rate assumption.`);
    }

    const report: GeneratedReport = {
      id: `report-${Date.now()}`,
      userId,
      portfolioId,
      portfolioName,
      generatedAt: new Date().toISOString(),
      analytics,
      riskData,
      observations,
    };

    // Save to localStorage
    try {
      const key = `findat_reports_${userId || 'guest'}`;
      let existing: GeneratedReport[] = [];
      const cached = localStorage.getItem(key);
      if (cached) {
        existing = JSON.parse(cached);
      }
      existing.unshift(report);
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 15)));
    } catch (e) {
      console.warn('Failed saving report locally:', e);
    }

    // Save to Supabase if authenticated
    if (userId && userId !== 'demo') {
      Promise.resolve(
        supabase.from('reports').insert({
          user_id: userId,
          portfolio_id: portfolioId === 'demo' ? null : portfolioId,
          title: `${portfolioName} Intelligence Report`,
          data: report,
        })
      ).catch(() => {});
    }

    return report;
  },

  /**
   * Export printable / PDF from an HTML container element
   */
  async exportReportToPDF(elementId: string, filename: string = 'FinDat-Portfolio-Report.pdf'): Promise<boolean> {
    const el = document.getElementById(elementId);
    if (!el) return false;

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FAF2E2',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(filename);
      return true;
    } catch (err) {
      console.error('PDF export failed, falling back to browser print:', err);
      window.print();
      return false;
    }
  },

  /**
   * Get past reports
   */
  getSavedReports(userId: string): GeneratedReport[] {
    try {
      const key = `findat_reports_${userId || 'guest'}`;
      const cached = localStorage.getItem(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return [];
  },
};
