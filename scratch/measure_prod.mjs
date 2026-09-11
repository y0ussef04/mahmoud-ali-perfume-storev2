import http from 'http';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local manually if needed
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
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function fetchUrl(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const t0 = performance.now();
    const req = http.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const dur = performance.now() - t0;
        resolve({ status: res.statusCode, dur, headers: res.headers, size: data.length });
      });
    });
    req.on('error', reject);
  });
}

async function getAdminCookie() {
  // Find an admin user
  const { data: admins } = await supabaseAdmin.from('admins').select('user_id, email').limit(1);
  if (!admins || admins.length === 0) return null;
  const admin = admins[0];
  console.log(`Found admin user: ${admin.email}`);
  // Generate a magiclink or sign in via admin API
  const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: admin.email,
  });
  if (linkErr) {
    console.log('Error generating link:', linkErr.message);
    return null;
  }
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data: loginData } = await anonClient.auth.signInWithPassword({
    email: admin.email,
    password: 'AdminPassword2026!',
  });

  const { createServerClient } = await import('@supabase/ssr');
  const jar = {};
  const ssr = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return Object.entries(jar).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          jar[name] = value;
        });
      },
    },
  });

  await ssr.auth.setSession({
    access_token: loginData.session.access_token,
    refresh_token: loginData.session.refresh_token,
  });

  const cookieHeader = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
  return {
    headers: {
      Cookie: cookieHeader,
    },
    user: admin.email,
  };
}

async function run() {
  console.log('=== BENCHMARKING PRODUCTION SERVER (http://localhost:3005) ===\n');

  let adminAuth = null;
  try {
    adminAuth = await getAdminCookie();
  } catch (e) {
    console.log('Could not get admin session:', e.message);
  }

  const routes = [
    { path: '/', name: '/' },
    { path: '/products', name: '/products' },
    { path: '/products/khamrah', name: '/products/khamrah' },
    { path: '/cart', name: '/cart' },
    { path: '/checkout', name: '/checkout' },
    { path: '/track', name: '/track' },
    { path: '/admin', name: '/admin', admin: true },
    { path: '/admin/orders', name: '/admin/orders', admin: true },
    { path: '/admin/products', name: '/admin/products', admin: true },
    { path: '/admin/shipping', name: '/admin/shipping', admin: true },
    { path: '/admin/admins', name: '/admin/admins', admin: true },
  ];

  const results = [];

  for (const r of routes) {
    const url = `${BASE}${r.path}`;
    const headers = r.admin && adminAuth ? adminAuth.headers : {};

    // 1. Cold
    const coldRes = await fetchUrl(url, headers);
    await new Promise((resolve) => setTimeout(resolve, 50));

    // 2. Warm
    const warmRes = await fetchUrl(url, headers);
    await new Promise((resolve) => setTimeout(resolve, 50));

    // 3. After Cache
    const cacheRes = await fetchUrl(url, headers);

    const cacheHeader = cacheRes.headers['x-nextjs-cache'] || cacheRes.headers['cache-control'] || 'N/A';

    results.push({
      route: r.name,
      cold: coldRes.dur.toFixed(1) + 'ms',
      warm: warmRes.dur.toFixed(1) + 'ms',
      afterCache: cacheRes.dur.toFixed(1) + 'ms',
      status: cacheRes.status,
      notes: `Status ${cacheRes.status}, Size ${(cacheRes.size / 1024).toFixed(1)}KB, ${cacheHeader.slice(0, 25)}`,
    });
  }

  console.log('\n--- MEASUREMENT MATRIX ---');
  console.table(results);
}

run().catch(console.error);
