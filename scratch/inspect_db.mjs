import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

try {
  const envText = fs.readFileSync('.env.local', 'utf8');
  for (const line of envText.split('\n')) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch (e) {}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectRates() {
  const { data: rates } = await supabaseAdmin
    .from('shipping_rates')
    .select('*')
    .order('governorate');
  console.log('Current shipping rates count:', rates?.length);
  const cairo = rates?.find(r => r.governorate === 'القاهرة' || r.governorate.includes('قاهرة'));
  console.log('Cairo rate:', cairo);

  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('*');
  console.log('Settings:', settings);
}

inspectRates().catch(console.error);
