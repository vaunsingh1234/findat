-- ==============================================================================
-- 002_stock_master.sql
-- Indian Stock Master: NSE & BSE Securities, ISINs, Trigram Fuzzy Search
-- ==============================================================================

-- Enable trigram extension for lightning fast partial/fuzzy substring matching
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enhance stocks table with Indian securities master fields
ALTER TABLE public.stocks
  ADD COLUMN IF NOT EXISTS isin text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS bse_code text,
  ADD COLUMN IF NOT EXISTS series text DEFAULT 'EQ',
  ADD COLUMN IF NOT EXISTS stock_type text DEFAULT 'EQUITY',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'ACTIVE';

-- Drop single symbol constraint if present and create compound (symbol, exchange) unique
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stocks_symbol_key'
  ) THEN
    ALTER TABLE public.stocks DROP CONSTRAINT stocks_symbol_key;
  END IF;
END $$;

ALTER TABLE public.stocks
  DROP CONSTRAINT IF EXISTS stocks_symbol_exchange_key;

ALTER TABLE public.stocks
  ADD CONSTRAINT stocks_symbol_exchange_key UNIQUE (symbol, exchange);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_stocks_isin ON public.stocks(isin);
CREATE INDEX IF NOT EXISTS idx_stocks_bse_code ON public.stocks(bse_code);
CREATE INDEX IF NOT EXISTS idx_stocks_exchange ON public.stocks(exchange);

-- Trigram GIN indexes for fast partial company name & symbol search
CREATE INDEX IF NOT EXISTS idx_stocks_symbol_trgm ON public.stocks USING gin (symbol gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_stocks_company_name_trgm ON public.stocks USING gin (company_name gin_trgm_ops);
