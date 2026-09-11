import { createClient } from '@supabase/supabase-js';
// Read from process.env directly with --env-file

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function time(label, fn) {
  const start = performance.now();
  try {
    const res = await fn();
    const ms = (performance.now() - start).toFixed(1);
    console.log(`[${ms}ms] ${label}`);
    return res;
  } catch (err) {
    const ms = (performance.now() - start).toFixed(1);
    console.log(`[${ms}ms] ERROR in ${label}: ${err.message}`);
  }
}

async function run() {
  console.log('=== PROFILING ADMIN OPERATIONS ===\n');

  // 1. Auth check simulation
  await time('1. auth.admin.getUserById (or select admin from DB)', async () => {
    return await supabase.from('admins').select('user_id, email, full_name').limit(1).single();
  });

  // 2. Pending orders count in layout
  await time('2. layout: pending orders count query', async () => {
    return await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .or('status.eq.new,payment_status.eq.pending_review');
  });

  // 3. Dashboard queries individually
  console.log('\n--- Dashboard Queries ---');
  const days = 30;
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  await time('admin_kpis RPC', () => supabase.rpc('admin_kpis', { p_days: days }));
  await time('revenue_by_day RPC', () => supabase.rpc('revenue_by_day', { p_days: days }));
  await time('top_products RPC', () => supabase.rpc('top_products', { p_days: days, p_limit: 8 }));
  await time('brand_performance RPC', () => supabase.rpc('brand_performance', { p_days: days }));
  await time('low_stock RPC', () => supabase.rpc('low_stock', { p_threshold: 5 }));
  await time('stale_products RPC', () => supabase.rpc('stale_products', { p_days: 60 }));
  await time('geo_breakdown RPC', () => supabase.rpc('geo_breakdown', { p_days: days }));
  await time('method cod query', () => supabase.from('orders').select('id', { count: 'exact', head: true }).eq('payment_method', 'cod').gte('created_at', since));
  await time('method card query', () => supabase.from('orders').select('id', { count: 'exact', head: true }).eq('payment_method', 'card').gte('created_at', since));
  await time('method wallet query', () => supabase.from('orders').select('id', { count: 'exact', head: true }).eq('payment_method', 'wallet').gte('created_at', since));

  // Dashboard Promise.all
  await time('\n>> ALL DASHBOARD QUERIES IN PARALLEL (Promise.all)', () =>
    Promise.all([
      supabase.rpc('admin_kpis', { p_days: days }),
      supabase.rpc('revenue_by_day', { p_days: days }),
      supabase.rpc('top_products', { p_days: days, p_limit: 8 }),
      supabase.rpc('brand_performance', { p_days: days }),
      supabase.rpc('low_stock', { p_threshold: 5 }),
      supabase.rpc('stale_products', { p_days: 60 }),
      supabase.rpc('geo_breakdown', { p_days: days }),
      ...['cod', 'card', 'wallet'].map((m) =>
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('payment_method', m)
          .gte('created_at', since)
      ),
    ])
  );

  // 4. Orders list page
  console.log('\n--- Orders List Page ---');
  await time('orders page query (25 items + count)', () =>
    supabase
      .from('orders')
      .select(
        `id, order_no, customer_name, phone, governorate, area, total, items_count,
         payment_method, payment_status, status, created_at`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(0, 24)
  );

  // 5. Products list page
  console.log('\n--- Products List Page ---');
  await time('products page query (products + variants + brands)', () =>
    Promise.all([
      supabase
        .from('products')
        .select(
          `id, slug, name_ar, name_en, family, gender, is_active, is_featured, created_at,
           brand:brands ( id, name_ar ),
           variants ( id, label, price, stock, is_active )`
        )
        .order('created_at', { ascending: false }),
      supabase.from('brands').select('id, name_ar').order('sort'),
    ])
  );
}

run();
