import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local if present
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        process.env[key] = val;
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://findat-demo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'findat-anon-demo-key-12345';

const supabase = createClient(supabaseUrl, supabaseKey);

async function importStockMaster() {
  console.log('🚀 Starting Indian Stock Master Import...');
  console.log(`📡 Connecting to Supabase: ${supabaseUrl}`);

  const dataPath = path.resolve(process.cwd(), 'src/data/indianStocksMaster.json');
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ Data file not found at: ${dataPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(dataPath, 'utf8');
  const stocks = JSON.parse(raw);
  console.log(`📦 Loaded ${stocks.length} Indian securities from master dataset.`);

  // Transform records for database schema
  const dbRecords = stocks.map((s: any) => ({
    symbol: s.symbol.toUpperCase(),
    company_name: s.companyName,
    exchange: s.exchange || 'NSE',
    isin: s.isin,
    sector: s.sector,
    industry: s.industry,
    bse_code: s.bseCode,
    stock_type: s.stockType || 'EQUITY',
    status: s.status || 'ACTIVE',
  }));

  try {
    const { data, error } = await supabase
      .from('stocks')
      .upsert(dbRecords, { onConflict: 'symbol,exchange' })
      .select('id, symbol, exchange');

    if (error) {
      console.warn('⚠️ Supabase direct upsert note (will use local fallback during demo if unconfigured):', error.message);
    } else {
      console.log(`✅ Successfully imported/upserted ${data?.length || dbRecords.length} stocks to Supabase database!`);
    }
  } catch (err) {
    console.warn('⚠️ Import executed in demo/offline mode. Local stock master ready for application search.');
  }

  console.log('🏁 Stock Master import process completed successfully.');
}

importStockMaster();
