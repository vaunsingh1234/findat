import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border-warm bg-surface-warm/80 mt-auto">
      {/* Main Footer Links & Editorial Colophon */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
          {/* Brand Colophon */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-terracotta flex items-center justify-center text-warm-cream font-display font-extrabold text-sm">
                F
              </span>
              <span className="font-display font-extrabold text-lg tracking-tight text-ink">
                Fin<span className="text-terracotta">Dat</span>
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Financial data analysis, quantitative risk engines, and portfolio impact modeling engineered for modern Indian equities.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-olive font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Quantitative Analysis Engine</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-ink font-bold">
              Analysis Engines
            </h4>
            <ul className="space-y-1.5 text-xs text-muted">
              <li>
                <Link to="/portfolio" className="hover:text-terracotta transition-colors">
                  Portfolio Diversification
                </Link>
              </li>
              <li>
                <Link to="/risk" className="hover:text-terracotta transition-colors">
                  Risk & Beta Calibration
                </Link>
              </li>
              <li>
                <Link to="/recommendations" className="hover:text-terracotta transition-colors">
                  Portfolio Impact Scenario
                </Link>
              </li>
              <li>
                <Link to="/stocks" className="hover:text-terracotta transition-colors">
                  NSE/BSE Equity Search
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Tools */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-ink font-bold">
              Intelligence Tools
            </h4>
            <ul className="space-y-1.5 text-xs text-muted">
              <li>
                <Link to="/stocks" className="hover:text-terracotta transition-colors">
                  NSE / BSE Market Quotes
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="hover:text-terracotta transition-colors">
                  Holding Performance Tracking
                </Link>
              </li>
              <li>
                <Link to="/risk" className="hover:text-terracotta transition-colors">
                  Volatility & Drawdown Diagnostics
                </Link>
              </li>
              <li>
                <Link to="/reports" className="hover:text-terracotta transition-colors">
                  PDF Intelligence Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Market Status */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-ink font-bold">
              Market Sessions
            </h4>
            <div className="p-3 rounded-lg border border-border-warm bg-white text-xs space-y-1 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-muted">NSE / BSE</span>
                <span className="text-olive font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-olive animate-pulse" />
                  Active System
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>Trading Hours</span>
                <span>09:15 – 15:30 IST</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Compact, Unobtrusive Regulatory Disclosure */}
        <div className="pt-5 border-t border-border-warm/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-muted">
          <div className="space-y-0.5 text-center sm:text-left">
            <div>© {new Date().getFullYear()} FinDat Technologies. Built for Indian Equities.</div>
            <div className="text-[10px] text-muted/80">
              Educational & analytical decision-support only; not a SEBI registered investment advisor. Market telemetry may be delayed.
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/stocks" className="hover:text-terracotta transition-colors">Equities</Link>
            <span>•</span>
            <Link to="/portfolio" className="hover:text-terracotta transition-colors">Portfolio</Link>
            <span>•</span>
            <Link to="/risk" className="hover:text-terracotta transition-colors">Risk</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
