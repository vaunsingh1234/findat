import React from 'react';
import { LayoutGrid, Table2 } from 'lucide-react';

export type ViewMode = 'cards' | 'table';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  label?: string;
  className?: string;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  mode,
  onChange,
  label = 'Change view',
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {label && (
        <span className="text-xs uppercase font-mono tracking-wider text-muted hidden sm:inline-block">
          {label}
        </span>
      )}
      <div className="inline-flex p-0.5 rounded-full border border-border-warm bg-surface-warm shadow-xs">
        <button
          type="button"
          onClick={() => onChange('cards')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer ${
            mode === 'cards'
              ? 'bg-ink text-warm-cream shadow-xs'
              : 'text-muted hover:text-ink'
          }`}
          title="Cards View"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Cards</span>
        </button>
        <button
          type="button"
          onClick={() => onChange('table')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer ${
            mode === 'table'
              ? 'bg-ink text-warm-cream shadow-xs'
              : 'text-muted hover:text-ink'
          }`}
          title="Table View"
        >
          <Table2 className="w-3.5 h-3.5" />
          <span>Table</span>
        </button>
      </div>
    </div>
  );
};
