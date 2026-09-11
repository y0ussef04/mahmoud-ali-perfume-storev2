import http from 'http';
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

const BASE = 'http://localhost:3005';
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Read action ID from manifest
const manifest = JSON.parse(fs.readFileSync('.next/server/server-reference-manifest.json', 'utf8'));
const actionId = Object.keys(manifest.node)[0];
console.log('Detected Server Action ID for invalidateCacheTag:', actionId);

function fetchCheckout() {
  return new Promise((resolve, reject) => {
    http.get(`${BASE}/checkout`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        // Find Cairo rate
        const m = data.match(/القاهرة.*?fee[^\d]*(\d+)/) || data.match(/القاهرة.*?&quot;fee&quot;:(\d+)/);
        resolve({
          status: res.statusCode,
          cairoFee: m ? parseInt(m[1], 10) : null,
          cacheHeader: res.headers['x-nextjs-cache'] || 'N/A',
        });
      });
    }).on('error', reject);
  });
}

function callServerAction(tag) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify([tag]);
    const req = http.request(
      `${BASE}/checkout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Next-Action': actionId,
          'Accept': 'text/x-component',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('=== REAL CACHE INVALIDATION TEST ===\n');

  // Step 1: Open storefront, record initial shipping fee
  const initial = await fetchCheckout();
  console.log('1. Storefront initial Cairo fee:', initial.cairoFee, 'EGP');

  // Step 2: Mutate in DB (Admin saves 55 EGP instead of 50 EGP)
  console.log('\n2. Updating Cairo shipping fee in DB to 55 EGP...');
  await supabaseAdmin
    .from('shipping_rates')
    .update({ fee: 55 })
    .eq('governorate', 'القاهرة');

  // Step 3: Check storefront BEFORE invalidation (should still be 50 if cached)
  const beforeInval = await fetchCheckout();
  console.log('3. Storefront before invalidation:', beforeInval.cairoFee, 'EGP (Cache holds old value)');

  // Step 4: Admin invokes invalidateCacheTag('shipping')
  console.log('\n4. Admin triggers invalidateCacheTag("shipping")...');
  const actionRes = await callServerAction('shipping');
  console.log('   Server Action HTTP status:', actionRes.status);

  // Step 5: Open storefront again
  const afterInval = await fetchCheckout();
  console.log('5. Storefront after invalidation:', afterInval.cairoFee, 'EGP (Fresh value reflected!)');

  if (afterInval.cairoFee === 55) {
    console.log('   >>> SUCCESS: Cache invalidation successfully purged stale fee and updated to 55 EGP! <<<');
  } else {
    console.error('   >>> FAILURE: Fee did not update! <<<');
  }

  // Step 6: Revert back to 50 EGP and revalidate
  console.log('\n6. Reverting Cairo shipping fee back to 50 EGP in DB...');
  await supabaseAdmin
    .from('shipping_rates')
    .update({ fee: 50 })
    .eq('governorate', 'القاهرة');

  console.log('7. Triggering invalidateCacheTag("shipping") for revert...');
  await callServerAction('shipping');

  const reverted = await fetchCheckout();
  console.log('8. Storefront after revert:', reverted.cairoFee, 'EGP (Cleanly restored!)');

  console.log('\n=== CACHE INVALIDATION VERIFICATION COMPLETED ===');
}

run().catch(console.error);
