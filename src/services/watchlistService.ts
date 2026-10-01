import { supabase } from './authService';
import { stockService } from './stockService';
import type { StockQuote } from '../types/market';

export interface WatchlistItem {
  id: string;
  symbol: string;
  companyName: string;
  exchange: string;
  addedAt: string;
  quote?: StockQuote;
}

const DEFAULT_GUEST_WATCHLIST: Array<{ symbol: string; companyName: string; exchange: string }> = [
  { symbol: 'RELIANCE', companyName: 'Reliance Industries Limited', exchange: 'NSE' },
  { symbol: 'TCS', companyName: 'Tata Consultancy Services', exchange: 'NSE' },
  { symbol: 'HDFCBANK', companyName: 'HDFC Bank Limited', exchange: 'NSE' },
  { symbol: 'INFY', companyName: 'Infosys Limited', exchange: 'NSE' },
  { symbol: 'TATAMOTORS', companyName: 'Tata Motors Limited', exchange: 'NSE' },
];

function getStorageKey(userId?: string): string {
  return `findat_watchlist_${userId || 'guest'}`;
}

export const watchlistService = {
  /**
   * Get user watchlist with real-time quotes
   */
  async getWatchlist(userId?: string): Promise<WatchlistItem[]> {
    const key = getStorageKey(userId);
    let items: Array<{ id: string; symbol: string; companyName: string; exchange: string; addedAt: string }> = [];

    // 1. Try Supabase if authenticated
    if (userId && userId !== 'demo') {
      try {
        const { data, error } = await supabase
          .from('watchlists')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          items = data.map((d: any) => ({
            id: d.id,
            symbol: d.symbol.toUpperCase(),
            companyName: d.company_name || d.symbol,
            exchange: d.exchange || 'NSE',
            addedAt: d.created_at,
          }));
          localStorage.setItem(key, JSON.stringify(items));
        }
      } catch {
        // Fall back to localStorage
      }
    }

    // 2. Read from localStorage if Supabase had no rows or offline
    if (items.length === 0) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          items = JSON.parse(cached);
        } else if (!userId || userId === 'demo') {
          // Initialize guest with defaults
          items = DEFAULT_GUEST_WATCHLIST.map((d, idx) => ({
            id: `guest-${d.symbol}-${idx}`,
            symbol: d.symbol,
            companyName: d.companyName,
            exchange: d.exchange,
            addedAt: new Date().toISOString(),
          }));
          localStorage.setItem(key, JSON.stringify(items));
        }
      } catch {
        items = [];
      }
    }

    // 3. Attach real-time quotes from stockService
    const itemsWithQuotes = await Promise.all(
      items.map(async (item) => {
        try {
          const quote = await stockService.getQuote(item.symbol);
          return {
            ...item,
            quote,
          };
        } catch {
          return item;
        }
      })
    );

    return itemsWithQuotes;
  },

  /**
   * Check if a symbol is in the user's watchlist
   */
  async isInWatchlist(userId: string | undefined, symbol: string): Promise<boolean> {
    const upper = symbol.trim().toUpperCase();
    const key = getStorageKey(userId);

    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const items: any[] = JSON.parse(cached);
        return items.some((i) => i.symbol.toUpperCase() === upper);
      }
    } catch {
      // ignore
    }

    if (userId && userId !== 'demo') {
      try {
        const { data } = await supabase
          .from('watchlists')
          .select('id')
          .eq('user_id', userId)
          .eq('symbol', upper)
          .maybeSingle();

        return !!data;
      } catch {
        return false;
      }
    }

    return false;
  },

  /**
   * Add a stock to watchlist
   */
  async addToWatchlist(
    userId: string | undefined,
    symbol: string,
    companyName?: string,
    exchange: string = 'NSE'
  ): Promise<WatchlistItem> {
    const upper = symbol.trim().toUpperCase();
    const key = getStorageKey(userId);

    // Get company name if missing
    let name = companyName;
    if (!name) {
      const stock = await stockService.getStock(upper);
      name = stock?.company_name || upper;
    }

    const newItem: WatchlistItem = {
      id: `wl-${upper}-${Date.now()}`,
      symbol: upper,
      companyName: name,
      exchange,
      addedAt: new Date().toISOString(),
    };

    // Update localStorage
    try {
      let existing: any[] = [];
      const cached = localStorage.getItem(key);
      if (cached) {
        existing = JSON.parse(cached);
      }
      if (!existing.some((i) => i.symbol.toUpperCase() === upper)) {
        existing.unshift(newItem);
        localStorage.setItem(key, JSON.stringify(existing));
      }
    } catch (e) {
      console.warn('Failed saving watchlist to localStorage:', e);
    }

    // Update Supabase
    if (userId && userId !== 'demo') {
      try {
        const { data, error } = await supabase
          .from('watchlists')
          .upsert(
            {
              user_id: userId,
              symbol: upper,
              company_name: name,
              exchange,
            },
            { onConflict: 'user_id,symbol' }
          )
          .select()
          .single();

        if (!error && data) {
          newItem.id = data.id;
        }
      } catch (err) {
        console.warn('Supabase watchlist add error:', err);
      }
    }

    // Attach live quote
    try {
      newItem.quote = await stockService.getQuote(upper);
    } catch {
      // ignore
    }

    window.dispatchEvent(new CustomEvent('findat_watchlist_changed', { detail: { symbol: upper, action: 'add' } }));
    return newItem;
  },

  /**
   * Remove a stock from watchlist
   */
  async removeFromWatchlist(userId: string | undefined, symbol: string): Promise<boolean> {
    const upper = symbol.trim().toUpperCase();
    const key = getStorageKey(userId);

    // Update localStorage
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        let existing: any[] = JSON.parse(cached);
        existing = existing.filter((i) => i.symbol.toUpperCase() !== upper);
        localStorage.setItem(key, JSON.stringify(existing));
      }
    } catch (e) {
      console.warn('Failed removing from localStorage:', e);
    }

    // Update Supabase
    if (userId && userId !== 'demo') {
      try {
        await supabase
          .from('watchlists')
          .delete()
          .eq('user_id', userId)
          .eq('symbol', upper);
      } catch (err) {
        console.warn('Supabase watchlist remove error:', err);
      }
    }

    window.dispatchEvent(new CustomEvent('findat_watchlist_changed', { detail: { symbol: upper, action: 'remove' } }));
    return true;
  },
};
