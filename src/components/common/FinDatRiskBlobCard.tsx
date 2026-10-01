import React, { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { RiskCategory } from '../../types/risk';

export interface FinDatRiskBlobCardProps {
  overallRiskScore: number;
  riskCategory: RiskCategory;
  volatility: number | null;
  volatilityPeriod?: string;
  beta: number | null;
  benchmarkName?: string;
  sharpeRatio: number | null;
  riskFreeRate?: number;
  maxDrawdown: number | null;
  riskExplanation?: string;
  className?: string;
}

export const FinDatRiskBlobCard: React.FC<FinDatRiskBlobCardProps> = ({
  overallRiskScore,
  riskCategory,
  volatility,
  volatilityPeriod = 'Annualized',
  beta,
  benchmarkName = 'NIFTY 50',
  sharpeRatio,
  riskFreeRate = 6.5,
  maxDrawdown,
  riskExplanation,
  className = '',
}) => {
  const filterId = useId().replace(/:/g, '-');
  const shouldReduceMotion = useReducedMotion();

  const isLowRisk = riskCategory === 'Low Risk';
  const isHighRisk = riskCategory === 'High Risk';

  // FinDat brand color palettes
  const riskBadgeClass = isLowRisk
    ? 'bg-olive-light text-olive border-olive/30'
    : isHighRisk
    ? 'bg-terracotta-light text-terracotta border-terracotta/30'
    : 'bg-mustard-light text-mustard-hover border-mustard/30';

  // Rotating border glow palette (FinDat terracotta, cream, olive, amber)
  const glowColors = isLowRisk
    ? ['#8FAF7E', '#FAF2E2', '#D9633B', '#FAF2E2', '#8FAF7E']
    : isHighRisk
    ? ['#D9633B', '#B84D28', '#FAF2E2', '#D9633B']
    : ['#D9633B', '#C9A96E', '#FAF2E2', '#8FAF7E', '#D9633B'];

  return (
    <div className={`relative w-full h-full flex flex-col ${className}`}>
      {/* 1. Rotating Glow Border (1.5px Inset Behind Card) */}
      <div className="absolute -inset-[1.5px] rounded-[26px] overflow-hidden z-0 pointer-events-none">
        <motion.div
          className="absolute -inset-[100%] origin-center"
          style={{
            background: `conic-gradient(from 0deg, ${glowColors.join(', ')})`,
            filter: 'blur(8px)',
            opacity: 0.45,
          }}
          animate={shouldReduceMotion ? {} : { rotate: 360 }}
          transition={{
            duration: 12, // Slow, restrained rotation
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* SVG Gooey Filter Definition */}
      <svg className="absolute w-0 h-0 pointer-events-none opacity-0" aria-hidden="true">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* 2. Main Card Container */}
      <div className="relative z-10 w-full h-full rounded-[24px] overflow-hidden bg-surface border border-border-warm/70 shadow-xs flex flex-col justify-between">
        {/* Upper Fluid Animated Blob Header Area */}
        <div className="relative overflow-hidden rounded-t-[24px] min-h-[190px] sm:min-h-[210px] flex flex-col justify-between">
          {/* Animated Fluid Blobs */}
          {!shouldReduceMotion ? (
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ filter: `url(#${filterId})` }}
            >
              {/* Blob 1: Terracotta primary blob */}
              <motion.div
                className="absolute w-44 h-44 rounded-full bg-terracotta/40"
                style={{ left: '12%', top: '-30%' }}
                animate={{
                  x: [-15, 22, -12, -15],
                  y: [-10, 16, -18, -10],
                  scale: [1, 1.12, 0.96, 1],
                }}
                transition={{
                  duration: 14,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Blob 2: Complementary olive / amber blob */}
              <motion.div
                className={`absolute w-36 h-36 rounded-full ${
                  isLowRisk ? 'bg-olive/45' : isHighRisk ? 'bg-[#B84D28]/35' : 'bg-mustard-hover/35'
                }`}
                style={{ right: '14%', top: '-20%' }}
                animate={{
                  x: [16, -20, 14, 16],
                  y: [12, -15, 18, 12],
                  scale: [1.08, 0.94, 1.06, 1.08],
                }}
                transition={{
                  duration: 16,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Blob 3: Warm cream highlight blob */}
              <motion.div
                className="absolute w-32 h-32 rounded-full bg-[#EAD8BD]/70"
                style={{ left: '42%', top: '5%' }}
                animate={{
                  x: [-12, 18, -14, -12],
                  y: [14, -12, 16, 14],
                  scale: [0.95, 1.1, 0.98, 0.95],
                }}
                transition={{
                  duration: 18,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>
          ) : (
            // Static Reduced-Motion Fallback
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                background:
                  'radial-gradient(circle at 30% 20%, rgba(217, 99, 59, 0.35), transparent 60%), radial-gradient(circle at 75% 20%, rgba(143, 175, 126, 0.3), transparent 60%)',
              }}
            />
          )}

          {/* Smooth Vertical Fade into Card Body */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/40 to-surface pointer-events-none" />

          {/* Header Content on Top of Fluid Blobs */}
          <div className="relative z-10 p-6 sm:p-7 pb-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
                  Portfolio Risk Overview
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
              </div>
              <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase border ${riskBadgeClass}`}>
                {riskCategory}
              </span>
            </div>

            {/* Large Score Counter */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl font-display font-black text-ink tracking-tight tabular-nums">
                  {overallRiskScore}
                </span>
                <span className="text-lg font-mono text-muted">/ 100</span>
              </div>
              <p className="text-xs font-mono text-muted">
                Composite risk rating calibrated from real price variance & sensitivity.
              </p>
            </div>

            {/* Compact Segmented Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full h-2.5 rounded-full bg-border-warm overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isLowRisk ? 'bg-olive' : isHighRisk ? 'bg-terracotta' : 'bg-mustard-hover'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, overallRiskScore))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-muted">
                <span>0 (Low Risk)</span>
                <span>38 (Moderate)</span>
                <span>66 (High Risk)</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Body: 4 Key Required Risk Metrics + Assessment Quote */}
        <div className="p-6 sm:p-7 pt-3 space-y-4">
          {/* Compact 2x2 Risk Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Volatility */}
            <div className="p-3 rounded-xl bg-warm-cream/60 border border-border-warm/70 space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-muted block font-semibold">
                Volatility
              </span>
              <p className="text-base sm:text-lg font-display font-black text-ink tabular-nums">
                {volatility !== null ? `${volatility}%` : '—'}
              </p>
              <span className="text-[9px] font-mono text-muted block truncate">
                {volatilityPeriod}
              </span>
            </div>

            {/* Beta */}
            <div className="p-3 rounded-xl bg-warm-cream/60 border border-border-warm/70 space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-muted block font-semibold">
                Beta (β)
              </span>
              <p className="text-base sm:text-lg font-display font-black text-ink tabular-nums">
                {beta !== null ? beta : '—'}
              </p>
              <span className="text-[9px] font-mono text-muted block truncate" title={benchmarkName}>
                vs {benchmarkName}
              </span>
            </div>

            {/* Sharpe Ratio */}
            <div className="p-3 rounded-xl bg-warm-cream/60 border border-border-warm/70 space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-muted block font-semibold">
                Sharpe Ratio
              </span>
              <p className="text-base sm:text-lg font-display font-black text-ink tabular-nums">
                {sharpeRatio !== null ? sharpeRatio : '—'}
              </p>
              <span className="text-[9px] font-mono text-muted block truncate">
                Rf = {riskFreeRate}%
              </span>
            </div>

            {/* Maximum Drawdown */}
            <div className="p-3 rounded-xl bg-warm-cream/60 border border-border-warm/70 space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-muted block font-semibold">
                Max Drawdown
              </span>
              <p className="text-base sm:text-lg font-display font-black text-terracotta tabular-nums">
                {maxDrawdown !== null ? `${maxDrawdown}%` : '—'}
              </p>
              <span className="text-[9px] font-mono text-muted block truncate">
                Peak-to-Trough
              </span>
            </div>
          </div>

          {/* Natural Explanation Quote */}
          {riskExplanation && (
            <div className="p-3.5 rounded-xl bg-warm-cream/50 border border-border-warm/60 space-y-1 text-xs">
              <span className="font-mono text-[9px] uppercase text-muted font-bold block">
                Deterministic Assessment
              </span>
              <p className="text-ink leading-relaxed font-sans text-[11px]">{riskExplanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinDatRiskBlobCard;
