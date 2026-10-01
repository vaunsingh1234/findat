-- ==============================================================================
-- 001_init_schema.sql
-- FinDat Database Schema: Profiles (Phase 2) + Stocks, Portfolios, Holdings (Phase 3)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- HELPER FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PROFILES TABLE (Phase 2: Authentication & Profile Calibration)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role text NOT NULL DEFAULT 'investor' CHECK (role IN ('investor', 'admin')),
  risk_tolerance text DEFAULT 'Moderate' CHECK (risk_tolerance IN ('Conservative', 'Moderate', 'Aggressive')),
  experience_level text DEFAULT 'Intermediate',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile RLS Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'investor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS trigger_update_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- STOCKS TABLE (Phase 3: Portfolio & Holdings)
-- ============================================
CREATE TABLE public.stocks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol text NOT NULL UNIQUE,
  company_name text NOT NULL,
  sector text,
  exchange text DEFAULT 'NSE',
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_stocks_symbol ON public.stocks(symbol);

-- Allow authenticated and anon users to read stock directory
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read stocks"
  ON public.stocks FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create stock records"
  ON public.stocks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- PORTFOLIOS TABLE
-- ============================================
CREATE TABLE public.portfolios (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Portfolio',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_portfolios_user_id ON public.portfolios(user_id);

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and manage their own portfolios
CREATE POLICY "Users can manage their own portfolios"
  ON public.portfolios FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- HOLDINGS TABLE
-- ============================================
CREATE TABLE public.holdings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  stock_id uuid REFERENCES public.stocks(id),
  stock_symbol text NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  purchase_price numeric NOT NULL CHECK (purchase_price > 0),
  purchase_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_holdings_portfolio_id ON public.holdings(portfolio_id);
CREATE INDEX idx_holdings_stock_id ON public.holdings(stock_id);
CREATE INDEX idx_holdings_stock_symbol ON public.holdings(stock_symbol);

ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and manage holdings in their own portfolios
-- (enforced via portfolio RLS)
CREATE POLICY "Users can manage holdings in their portfolios"
  ON public.holdings FOR ALL
  USING (
    portfolio_id IN (
      SELECT id FROM public.portfolios WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    portfolio_id IN (
      SELECT id FROM public.portfolios WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGER: Update portfolios.updated_at & holdings.updated_at
-- ============================================
CREATE TRIGGER trigger_update_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_holdings_updated_at
  BEFORE UPDATE ON public.holdings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- MARKET DATA TABLE (Phase 4)
-- ============================================
CREATE TABLE public.market_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  stock_id uuid REFERENCES public.stocks(id) ON DELETE CASCADE,
  stock_symbol text NOT NULL,
  date date NOT NULL,
  open numeric,
  high numeric,
  low numeric,
  close numeric NOT NULL,
  adj_close numeric,
  volume bigint,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(stock_symbol, date)
);

CREATE INDEX idx_market_data_symbol_date ON public.market_data(stock_symbol, date DESC);
CREATE INDEX idx_market_data_stock_id ON public.market_data(stock_id);

ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all market data (public data, writable only by service role)
CREATE POLICY "Authenticated users can read market data"
  ON public.market_data FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- STOCK INFO CACHE TABLE (company details)
-- ============================================
CREATE TABLE public.stock_info_cache (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  stock_id uuid UNIQUE REFERENCES public.stocks(id) ON DELETE CASCADE,
  stock_symbol text NOT NULL UNIQUE,
  company_name text NOT NULL,
  exchange text,
  sector text,
  industry text,
  website text,
  description text,
  employees_count integer,
  market_cap text,
  pe_ratio numeric,
  dividend_yield numeric,
  fifty_two_week_high numeric,
  fifty_two_week_low numeric,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_stock_info_symbol ON public.stock_info_cache(stock_symbol);

ALTER TABLE public.stock_info_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read stock info"
  ON public.stock_info_cache FOR SELECT
  USING (auth.role() = 'authenticated');

