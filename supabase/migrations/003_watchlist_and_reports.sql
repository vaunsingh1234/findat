-- ==============================================================================
-- 003_watchlist_and_reports.sql
-- Watchlists & Saved Portfolio Reports
-- ==============================================================================

-- ============================================
-- WATCHLISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.watchlists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  company_name text,
  exchange text DEFAULT 'NSE',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_symbol ON public.watchlists(symbol);

ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view and manage their own watchlist
CREATE POLICY "Users can manage their own watchlist"
  ON public.watchlists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_id uuid REFERENCES public.portfolios(id) ON DELETE SET NULL,
  title text NOT NULL,
  report_type text NOT NULL DEFAULT 'portfolio_comprehensive',
  data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view and manage their own reports
CREATE POLICY "Users can manage their own reports"
  ON public.reports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
