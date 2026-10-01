import React, { useEffect, useState } from 'react';

interface BrandLoaderProps {
  onComplete?: () => void;
  minDurationMs?: number;
}

export const BrandLoader: React.FC<BrandLoaderProps> = ({
  onComplete,
  minDurationMs = 1200,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const rawProgress = Math.min(100, Math.floor((elapsed / minDurationMs) * 100));

      setProgress(rawProgress);

      if (rawProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            setIsFinished(true);
            onComplete?.();
          }, 450);
        }, 150);
      }
    }, 24);

    return () => clearInterval(interval);
  }, [minDurationMs, onComplete]);

  if (isFinished) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-warm-cream p-8 md:p-14 transition-opacity duration-500 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top Header Label */}
      <div className="flex items-center justify-between text-xs tracking-widest uppercase font-mono text-muted">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-terracotta animate-pulse" />
          <span>FinDat Platform Core</span>
        </div>
        <span>NSE : BSE Edition • 2026</span>
      </div>

      {/* Center Brand Typographic Mark */}
      <div className="max-w-4xl">
        <p className="text-xs uppercase font-mono tracking-widest text-olive font-semibold mb-3">
          [01 / DECISION-SUPPORT SYSTEM]
        </p>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight text-ink leading-[0.92]">
          Fin<span className="text-terracotta">Dat</span>
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted max-w-xl font-normal leading-relaxed">
          Financial data analysis & deterministic portfolio intelligence for Indian markets.
        </p>
      </div>

      {/* Bottom Percentage Counter & Progress Line */}
      <div className="w-full">
        <div className="flex items-baseline justify-between mb-3 font-mono">
          <span className="text-xs tracking-wider uppercase text-muted">
            Calibrating Risk Engine & Market Matrices
          </span>
          <span className="text-4xl md:text-6xl font-extrabold text-ink tabular-nums">
            {progress.toString().padStart(2, '0')}%
          </span>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full h-1 bg-border-warm rounded-full overflow-hidden">
          <div
            className="h-full bg-terracotta transition-all duration-75 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
