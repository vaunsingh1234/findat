import React from 'react';
import { Link } from 'react-router-dom';

interface ModulePlaceholderProps {
  title: string;
  phaseNumber: number;
  description: string;
  badge?: string;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  phaseNumber,
  description,
  badge = 'Coming Soon',
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
      <div className="flex items-center gap-3">
        <span className="px-2.5 py-1 rounded font-mono text-[11px] font-bold uppercase tracking-wider bg-clay-light text-ink border border-border-warm">
          Phase {phaseNumber} Module
        </span>
        <span className="px-2.5 py-1 rounded font-mono text-[11px] font-semibold text-olive bg-olive-light border border-olive/20">
          {badge}
        </span>
      </div>

      <h1 className="text-4xl sm:text-5xl font-display font-bold text-ink">
        {title}
      </h1>

      <p className="text-base text-muted max-w-2xl leading-relaxed">
        {description}
      </p>

      <div className="flex items-center gap-3 pt-4">
        <Link
          to="/"
          className="button-editorial button-editorial-secondary text-xs py-2 px-5"
        >
          ← Return to Home
        </Link>
        <Link
          to="/dashboard"
          className="button-editorial button-editorial-primary text-xs py-2 px-5"
        >
          Open Dashboard
        </Link>
      </div>
    </div>
  );
};
