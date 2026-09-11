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

async function testUpdate() {
  const res1 = await supabaseAdmin
    .from('shipping_rates')
    .update({ fee: 55 })
    .eq('governorate', 'القاهرة')
    .select();
  console.log('Update to 55 result:', res1.data, res1.error);

  const res2 = await supabaseAdmin
    .from('shipping_rates')
    .select('*')
    .eq('governorate', 'القاهرة');
  console.log('Cairo row in DB:', res2.data);
}

testUpdate().catch(console.error);
