import { supabase } from './authService';
import type { Portfolio, Holding, Stock, PortfolioSummary, HoldingWithCalculations } from '../types/portfolio';

const PORTFOLIOS_STORAGE_KEY = 'findat_user_portfolios';
const HOLDINGS_STORAGE_KEY_PREFIX = 'findat_portfolio_holdings_';

export const DEMO_BENCHMARK_HOLDINGS: Holding[] = [
  {
    id: 'demo-1',
    portfolio_id: 'demo',
    stock_symbol: 'RELIANCE',
    quantity: 45,
    purchase_price: 2450.0,
    purchase_date: '2025-04-10',
    created_at: '2025-04-10T10:00:00Z',
    updated_at: '2025-04-10T10:00:00Z',
  },
  {
    id: 'demo-2',
    portfolio_id: 'demo',
    stock_symbol: 'TCS',
    quantity: 30,
    purchase_price: 3820.0,
    purchase_date: '2025-05-15',
    created_at: '2025-05-15T10:00:00Z',
    updated_at: '2025-05-15T10:00:00Z',
  },
  {
    id: 'demo-3',
    portfolio_id: 'demo',
    stock_symbol: 'HDFCBANK',
    quantity: 80,
    purchase_price: 1540.0,
    purchase_date: '2025-06-01',
    created_at: '2025-06-01T10:00:00Z',
    updated_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 'demo-4',
    portfolio_id: 'demo',
    stock_symbol: 'INFY',
    quantity: 65,
    purchase_price: 1610.0,
    purchase_date: '2025-07-20',
    created_at: '2025-07-20T10:00:00Z',
    updated_at: '2025-07-20T10:00:00Z',
  },
  {
    id: 'demo-5',
    portfolio_id: 'demo',
    stock_symbol: 'TATAMOTORS',
    quantity: 110,
    purchase_price: 780.0,
    purchase_date: '2025-08-12',
    created_at: '2025-08-12T10:00:00Z',
    updated_at: '2025-08-12T10:00:00Z',
  },
];

export const portfolioService = {
  // ===== PORTFOLIO CRUD =====

  // Get all portfolios for a user (with persistence fallback)
  async getPortfolios(userId: string): Promise<Portfolio[]> {
    const storageKey = `${PORTFOLIOS_STORAGE_KEY}_${userId || 'guest'}`;

    try {
      if (userId && userId !== 'demo') {
        const { data, error } = await supabase
          .from('portfolios')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      console.warn('[portfolioService] Supabase getPortfolios error, using local persistence:', err);
    }

    // Check localStorage cache
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }

    // Default portfolio if none exists
    const defaultPortfolio: Portfolio = {
      id: `port-${userId || 'main'}`,
      user_id: userId || 'guest',
      name: 'My Indian Equity Portfolio',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem(storageKey, JSON.stringify([defaultPortfolio]));
    return [defaultPortfolio];
  },

  // Get a single portfolio by ID
  async getPortfolio(portfolioId: string): Promise<Portfolio | null> {
    if (portfolioId === 'demo') {
      return {
        id: 'demo',
        user_id: 'demo',
        name: 'Sample Nifty Bluechip Portfolio',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('id', portfolioId)
        .single();

      if (!error && data) return data;
    } catch {}

    // Check localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PORTFOLIOS_STORAGE_KEY)) {
        try {
          const list: Portfolio[] = JSON.parse(localStorage.getItem(key) || '[]');
          const found = list.find((p) => p.id === portfolioId);
          if (found) return found;
        } catch {}
      }
    }

    return null;
  },

  // Create a new portfolio
  async createPortfolio(userId: string, name: string = 'My Portfolio'): Promise<Portfolio> {
    const newPort: Portfolio = {
      id: `port-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId || 'guest',
      name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (userId && userId !== 'guest' && userId !== 'demo') {
        const { data, error } = await supabase
          .from('portfolios')
          .insert([{ user_id: userId, name }])
          .select()
          .single();

        if (!error && data) {
          newPort.id = data.id;
        }
      }
    } catch (err) {
      console.warn('[portfolioService] Supabase createPortfolio error, saving locally:', err);
    }

    // Save to local storage
    const storageKey = `${PORTFOLIOS_STORAGE_KEY}_${userId || 'guest'}`;
    const existing = await this.getPortfolios(userId);
    const updated = [newPort, ...existing.filter((p) => p.id !== newPort.id)];
    localStorage.setItem(storageKey, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('findat_portfolio_changed', { detail: { portfolioId: newPort.id } }));
    }

    return newPort;
  },

  // Update portfolio name
  async updatePortfolio(portfolioId: string, updates: Partial<Portfolio>): Promise<Portfolio> {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .update(updates)
        .eq('id', portfolioId)
        .select()
        .single();

      if (!error && data) return data;
    } catch {}

    // Update in local storage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PORTFOLIOS_STORAGE_KEY)) {
        try {
          const list: Portfolio[] = JSON.parse(localStorage.getItem(key) || '[]');
          const idx = list.findIndex((p) => p.id === portfolioId);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
            localStorage.setItem(key, JSON.stringify(list));
            return list[idx];
          }
        } catch {}
      }
    }

    return {
      id: portfolioId,
      user_id: 'guest',
      name: updates.name || 'My Portfolio',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  // Delete a portfolio (cascade deletes holdings)
  async deletePortfolio(portfolioId: string): Promise<void> {
    try {
      await supabase.from('portfolios').delete().eq('id', portfolioId);
    } catch {}

    // Remove from local storage
    localStorage.removeItem(`${HOLDINGS_STORAGE_KEY_PREFIX}${portfolioId}`);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PORTFOLIOS_STORAGE_KEY)) {
        try {
          const list: Portfolio[] = JSON.parse(localStorage.getItem(key) || '[]');
          const filtered = list.filter((p) => p.id !== portfolioId);
          localStorage.setItem(key, JSON.stringify(filtered));
        } catch {}
      }
    }
  },

  // ===== HOLDINGS CRUD =====

  // Get all holdings in a portfolio
  async getHoldings(portfolioId: string): Promise<Holding[]> {
    const storageKey = `${HOLDINGS_STORAGE_KEY_PREFIX}${portfolioId}`;

    // Handle demo portfolio
    if (portfolioId === 'demo') {
      const cachedDemo = localStorage.getItem(storageKey);
      if (cachedDemo) {
        try {
          return JSON.parse(cachedDemo);
        } catch {}
      }
      localStorage.setItem(storageKey, JSON.stringify(DEMO_BENCHMARK_HOLDINGS));
      return DEMO_BENCHMARK_HOLDINGS;
    }

    try {
      const { data, error } = await supabase
        .from('holdings')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('[portfolioService] Supabase getHoldings error, reading local cache:', err);
    }

    // Local storage lookup
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }

    return [];
  },

  // Get a single holding
  async getHolding(holdingId: string): Promise<Holding | null> {
    try {
      const { data, error } = await supabase
        .from('holdings')
        .select('*')
        .eq('id', holdingId)
        .single();

      if (!error && data) return data;
    } catch {}

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(HOLDINGS_STORAGE_KEY_PREFIX)) {
        try {
          const list: Holding[] = JSON.parse(localStorage.getItem(key) || '[]');
          const found = list.find((h) => h.id === holdingId);
          if (found) return found;
        } catch {}
      }
    }

    return null;
  },

  // Add a holding to a portfolio
  async addHolding(
    portfolioId: string,
    stockSymbol: string,
    quantity: number,
    purchasePrice: number,
    purchaseDate: string
  ): Promise<Holding> {
    const cleanSymbol = stockSymbol.trim().toUpperCase();
    const newHolding: Holding = {
      id: `holding-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      portfolio_id: portfolioId,
      stock_symbol: cleanSymbol,
      quantity: Number(quantity),
      purchase_price: Number(purchasePrice),
      purchase_date: purchaseDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (portfolioId !== 'demo') {
        const { data, error } = await supabase
          .from('holdings')
          .insert([{
            portfolio_id: portfolioId,
            stock_symbol: cleanSymbol,
            quantity: newHolding.quantity,
            purchase_price: newHolding.purchase_price,
            purchase_date: newHolding.purchase_date,
          }])
          .select()
          .single();

        if (!error && data) {
          newHolding.id = data.id;
        }
      }
    } catch (err) {
      console.warn('[portfolioService] Supabase addHolding error, persisting locally:', err);
    }

    // Persist in localStorage
    const storageKey = `${HOLDINGS_STORAGE_KEY_PREFIX}${portfolioId}`;
    const existing = await this.getHoldings(portfolioId);
    const updated = [newHolding, ...existing.filter((h) => h.id !== newHolding.id)];
    localStorage.setItem(storageKey, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('findat_portfolio_changed', { detail: { portfolioId } }));
    }

    return newHolding;
  },

  // Update a holding
  async updateHolding(holdingId: string, updates: Partial<Holding>, portfolioId?: string): Promise<Holding> {
    try {
      const { data, error } = await supabase
        .from('holdings')
        .update(updates)
        .eq('id', holdingId)
        .select()
        .single();

      if (!error && data) {
        // Also sync local storage
        if (data.portfolio_id) {
          const storageKey = `${HOLDINGS_STORAGE_KEY_PREFIX}${data.portfolio_id}`;
          const current = await this.getHoldings(data.portfolio_id);
          const idx = current.findIndex((h) => h.id === holdingId);
          if (idx !== -1) {
            current[idx] = data;
            localStorage.setItem(storageKey, JSON.stringify(current));
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('findat_portfolio_changed', { detail: { portfolioId: data.portfolio_id } }));
          }
        }
        return data;
      }
    } catch {}

    // Update in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(HOLDINGS_STORAGE_KEY_PREFIX)) {
        try {
          const list: Holding[] = JSON.parse(localStorage.getItem(key) || '[]');
          const idx = list.findIndex((h) => h.id === holdingId);
          if (idx !== -1) {
            list[idx] = {
              ...list[idx],
              ...updates,
              updated_at: new Date().toISOString(),
            };
            localStorage.setItem(key, JSON.stringify(list));
            const pId = portfolioId || key.replace(HOLDINGS_STORAGE_KEY_PREFIX, '');
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('findat_portfolio_changed', { detail: { portfolioId: pId } }));
            }
            return list[idx];
          }
        } catch {}
      }
    }

    return {
      id: holdingId,
      portfolio_id: portfolioId || 'demo',
      stock_symbol: updates.stock_symbol || 'RELIANCE',
      quantity: updates.quantity || 1,
      purchase_price: updates.purchase_price || 1000,
      purchase_date: updates.purchase_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  // Delete a holding
  async deleteHolding(holdingId: string, portfolioId?: string): Promise<void> {
    try {
      await supabase.from('holdings').delete().eq('id', holdingId);
    } catch {}

    // Delete from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(HOLDINGS_STORAGE_KEY_PREFIX)) {
        try {
          const list: Holding[] = JSON.parse(localStorage.getItem(key) || '[]');
          const filtered = list.filter((h) => h.id !== holdingId);
          localStorage.setItem(key, JSON.stringify(filtered));
          const pId = portfolioId || key.replace(HOLDINGS_STORAGE_KEY_PREFIX, '');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('findat_portfolio_changed', { detail: { portfolioId: pId } }));
          }
        } catch {}
      }
    }
  },

  // ===== STOCKS =====

  async getOrCreateStock(symbol: string, companyName: string, sector?: string): Promise<Stock> {
    const upperSymbol = symbol.toUpperCase();
    try {
      const { data: existing } = await supabase
        .from('stocks')
        .select('*')
        .eq('symbol', upperSymbol)
        .single();

      if (existing) return existing;

      const { data: created, error } = await supabase
        .from('stocks')
        .insert([{
          symbol: upperSymbol,
          company_name: companyName,
          sector,
          exchange: 'NSE',
        }])
        .select()
        .single();

      if (!error && created) return created;
    } catch {}

    return {
      id: `stock-${upperSymbol}`,
      symbol: upperSymbol,
      company_name: companyName,
      sector,
      exchange: 'NSE',
    };
  },

  async searchStocks(query: string): Promise<Stock[]> {
    try {
      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .ilike('symbol', `%${query.toUpperCase()}%`)
        .limit(10);
      if (!error && data) return data;
    } catch {}

    return [];
  },

  // ===== PORTFOLIO SUMMARY WITH CALCULATIONS =====
  async getPortfolioSummary(portfolioId: string, currentPrices?: Record<string, number>): Promise<PortfolioSummary> {
    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) throw new Error('Portfolio not found');

    const holdings = await this.getHoldings(portfolioId);

    const holdingsWithCalcs: HoldingWithCalculations[] = holdings.map((holding) => {
      const investedValue = holding.quantity * holding.purchase_price;
      const currentPrice = currentPrices?.[holding.stock_symbol] || holding.purchase_price;
      const currentValue = holding.quantity * currentPrice;
      const absoluteReturn = currentValue - investedValue;
      const percentageReturn = investedValue > 0 ? (absoluteReturn / investedValue) * 100 : 0;

      return {
        ...holding,
        currentPrice,
        investedValue,
        currentValue,
        absoluteReturn,
        percentageReturn,
      };
    });

    const totalInvested = holdingsWithCalcs.reduce((sum, h) => sum + h.investedValue, 0);
    const totalCurrentValue = holdingsWithCalcs.reduce((sum, h) => sum + (h.currentValue ?? 0), 0);
    const totalAbsoluteReturn = totalCurrentValue - totalInvested;
    const totalPercentageReturn = totalInvested > 0 ? (totalAbsoluteReturn / totalInvested) * 100 : 0;

    return {
      portfolio,
      holdings: holdingsWithCalcs,
      totalInvested,
      totalCurrentValue,
      totalAbsoluteReturn,
      totalPercentageReturn,
    };
  },
};
