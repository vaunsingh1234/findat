import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface TwelveDataResponse {
  status: string;
  meta?: {
    symbol: string;
    name: string;
    exchange: string;
    mic_code: string;
    type: string;
    currency: string;
  };
  values?: Array<{
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }>;
  error?: {
    message: string;
  };
}

Deno.serve(async (req: Request) => {
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { symbol, interval = 'daily' } = await req.json();

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Stock symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch from Twelve Data API
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=1000&apikey=${apiKey}`;

    const response = await fetch(url);
    const data: TwelveDataResponse = await response.json();

    if (data.status !== 'ok' || data.error) {
      return new Response(
        JSON.stringify({ error: data.error?.message || 'Failed to fetch market data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store in Supabase with service role (bypass RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Get or create stock record
    const { data: existingStock } = await supabase
      .from('stocks')
      .select('id')
      .eq('symbol', symbol.toUpperCase())
      .single();

    let stockId = existingStock?.id;
    if (!stockId) {
      const { data: newStock } = await supabase
        .from('stocks')
        .insert([{
          symbol: symbol.toUpperCase(),
          company_name: data.meta?.name || symbol,
          sector: null,
          exchange: data.meta?.exchange || 'NSE',
        }])
        .select('id')
        .single();
      stockId = newStock?.id;
    }

    // Insert market data (upsert on unique constraint)
    if (data.values && data.values.length > 0) {
      const marketDataRecords = data.values.map(val => ({
        stock_id: stockId,
        stock_symbol: symbol.toUpperCase(),
        date: val.datetime.split(' ')[0], // Extract date part
        open: parseFloat(val.open),
        high: parseFloat(val.high),
        low: parseFloat(val.low),
        close: parseFloat(val.close),
        volume: parseInt(val.volume, 10) || 0,
      }));

      await supabase
        .from('market_data')
        .upsert(marketDataRecords, { onConflict: 'stock_symbol,date' })
        .select();
    }

    return new Response(
      JSON.stringify({ success: true, symbol, dataPoints: data.values?.length || 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
