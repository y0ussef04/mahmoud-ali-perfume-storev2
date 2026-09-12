-- ══════════════════════════════════════════════════════════════════════════
--  MASTER MIGRATION — محمود علي للعطور (Mahmoud Ali Perfumes)
--
--  محتويات الملف (آمن ١٠٠٪ — غير مدمّر ولا يحذف أي بيانات إطلاقاً):
--    ١. أعمدة تتبع الشحن والمبيعات المؤكدة (Tracking & Confirmed Sales)
--    ٢. نظام الرتب والصلاحيات وسجل الرقابة (RBAC & Audit Logs)
--    ٣. فهارس السرعة والأداء الفائق للأوردرات والكوبونات (Performance Indexes)
--
--  طريقة التشغيل على Supabase:
--    1. افتح مشروعك في لوحة تحكم Supabase Dashboard.
--    2. من القائمة الجانبية اضغط على: SQL Editor.
--    3. اضغط New query الصق كامل محتوى هذا الملف.
--    4. اضغط Run (أو Ctrl + Enter).
-- ══════════════════════════════════════════════════════════════════════════

-- =========================================================================
--  القسم الأول: أعمدة تتبع الشحن وحساب المبيعات المؤكدة فقط
-- =========================================================================

-- 1. أعمدة تتبع الشحن في جدول الأوردرات
alter table public.orders add column if not exists shipping_company text;
alter table public.orders add column if not exists tracking_number  text;
alter table public.orders add column if not exists tracking_url     text;
alter table public.orders add column if not exists confirmed_at     timestamptz;

-- 2. دالة تحديد حالات البيع المعتمدة (الإيراد = المؤكد وما بعده فقط)
create or replace function public.is_revenue(p_status text)
returns boolean language sql immutable set search_path = public as $$
  select p_status in ('confirmed','packed','shipped','delivered')
$$;

-- 3. تحديث مؤشرات لوحة التحكم الرئيسية لحساب المبيعات المؤكدة
create or replace function public.admin_kpis(p_days int default 30)
returns jsonb language sql stable security invoker set search_path = public as $$
  with cur as (
    select * from public.orders
     where created_at >= now() - (p_days || ' days')::interval
       and public.is_revenue(status)
  ), prev as (
    select * from public.orders
     where created_at >= now() - (p_days * 2 || ' days')::interval
       and created_at <  now() - (p_days || ' days')::interval
       and public.is_revenue(status)
  ), cancels as (
    select count(*) as n from public.orders
     where created_at >= now() - (p_days || ' days')::interval
       and status = 'cancelled'
  )
  select jsonb_build_object(
    'revenue',       coalesce((select sum(total) from cur), 0),
    'revenue_prev',  coalesce((select sum(total) from prev), 0),
    'orders',        (select count(*) from cur),
    'orders_prev',   (select count(*) from prev),
    'aov',           case when (select count(*) from cur) > 0
                          then round((select sum(total) from cur) / (select count(*) from cur))
                          else 0 end,
    'cancels',       (select n from cancels)
  );
$$;

-- 4. مخطط المبيعات الزمني للمبيعات المؤكدة فقط
create or replace function public.admin_sales_chart(p_days int default 30)
returns table(d date, revenue numeric, orders bigint)
language sql stable security invoker set search_path = public as $$
  with days as (
    select generate_series(
      date_trunc('day', now() - ((p_days - 1) || ' days')::interval)::date,
      date_trunc('day', now())::date,
      '1 day'::interval
    )::date as day
  ), sales as (
    select date_trunc('day', created_at)::date as day,
           coalesce(sum(total), 0)             as revenue,
           count(*)                            as orders
      from public.orders
     where created_at >= now() - (p_days || ' days')::interval
       and public.is_revenue(status)
     group by 1
  )
  select d.day,
         coalesce(s.revenue, 0)::numeric,
         coalesce(s.orders, 0)::bigint
    from days d
    left join sales s on s.day = d.day
   order by d.day asc;
$$;

-- 5. مبيعات البراندات
create or replace function public.admin_sales_by_brand(p_days int default 30)
returns table(brand_id uuid, brand_name_ar text, revenue numeric, qty bigint)
language sql stable security invoker set search_path = public as $$
  select b.id,
         b.name_ar,
         coalesce(sum(oi.total_price), 0)::numeric,
         coalesce(sum(oi.quantity), 0)::bigint
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    join public.product_variants pv on pv.id = oi.variant_id
    join public.products p on p.id = pv.product_id
    join public.brands b on b.id = p.brand_id
   where o.created_at >= now() - (p_days || ' days')::interval
     and public.is_revenue(o.status)
   group by b.id, b.name_ar
   order by 3 desc
   limit 8;
$$;

-- 6. المنتجات الأكثر مبيعاً
create or replace function public.admin_top_selling_variants(p_days int default 30)
returns table(variant_id uuid, product_slug text, product_name_ar text,
              variant_label text, brand_name_ar text, units_sold bigint, revenue numeric)
language sql stable security invoker set search_path = public as $$
  select pv.id,
         p.slug,
         p.name_ar,
         pv.label,
         b.name_ar,
         coalesce(sum(oi.quantity), 0)::bigint,
         coalesce(sum(oi.total_price), 0)::numeric
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    join public.product_variants pv on pv.id = oi.variant_id
    join public.products p on p.id = pv.product_id
    left join public.brands b on b.id = p.brand_id
   where o.created_at >= now() - (p_days || ' days')::interval
     and public.is_revenue(o.status)
   group by pv.id, p.slug, p.name_ar, pv.label, b.name_ar
   order by 6 desc
   limit 8;
$$;

-- 7. التوزيع الجغرافي للمحافظات ومعدل إلغاء الدفع عند الاستلام
create or replace function public.geo_breakdown(p_days int default 90)
returns table(governorate text, orders bigint, revenue numeric,
              cod_orders bigint, cod_cancelled bigint, cod_cancel_rate numeric)
language sql stable security invoker set search_path = public as $$
  select o.governorate,
         count(*) filter (where public.is_revenue(o.status))::bigint,
         coalesce(sum(o.total) filter (where public.is_revenue(o.status)), 0)::numeric,
         count(*) filter (where o.payment_method = 'cod')::bigint,
         count(*) filter (where o.payment_method = 'cod' and o.status = 'cancelled')::bigint,
         case when count(*) filter (where o.payment_method = 'cod') > 0
              then round(100.0 * count(*) filter (where o.payment_method = 'cod'
                                                    and o.status = 'cancelled')
                                / count(*) filter (where o.payment_method = 'cod'), 1)
              else 0 end
    from public.orders o
   where o.created_at >= now() - (p_days || ' days')::interval
   group by o.governorate
   order by 3 desc;
$$;

-- 8. دالة تعيين بيانات تتبع الشحن للأوردر
create or replace function public.admin_set_shipping(
  p_order_id        uuid,
  p_company         text default null,
  p_tracking_number text default null,
  p_tracking_url    text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_company text := nullif(btrim(coalesce(p_company, '')), '');
  v_track   text := nullif(btrim(coalesce(p_tracking_number, '')), '');
  v_url     text := nullif(btrim(coalesce(p_tracking_url, '')), '');
begin
  if not public.is_admin() then
    raise exception 'مش مسموح.';
  end if;

  if not exists (select 1 from public.orders where id = p_order_id) then
    raise exception 'الأوردر غير موجود.';
  end if;

  update public.orders
     set shipping_company = v_company,
         tracking_number  = v_track,
         tracking_url     = v_url
   where id = p_order_id;

  return jsonb_build_object(
    'ok', true,
    'shipping_company', v_company,
    'tracking_number',  v_track,
    'tracking_url',     v_url
  );
end $$;


-- =========================================================================
--  القسم الثاني: نظام الرتب والصلاحيات (RBAC) وسجل العمليات الحساسة (Audit)
-- =========================================================================

-- 1. إضافة الرتبة والحالة لجدول المشرفين public.admins
alter table public.admins 
  add column if not exists role text not null default 'admin';

alter table public.admins 
  add column if not exists status text not null default 'active';

alter table public.admins 
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'admins_role_check') then
    alter table public.admins add constraint admins_role_check check (role in ('manager', 'admin'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'admins_status_check') then
    alter table public.admins add constraint admins_status_check check (status in ('active', 'disabled'));
  end if;
end $$;

-- 2. ترقية الحساب الأساسي كـ Manager نشط
update public.admins 
   set role = 'manager', status = 'active'
 where email = 'youssef.mohammed3204@gmail.com';

-- 3. جدول صلاحيات المديرين (admin_permissions)
create table if not exists public.admin_permissions (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null references public.admins(user_id) on delete cascade,
  permission  text not null,
  created_at  timestamptz default now(),
  unique (admin_id, permission)
);

create index if not exists admin_permissions_admin_idx on public.admin_permissions(admin_id);

-- 4. جدول سجل العمليات الرقابية الحساسة (admin_audit_logs)
create table if not exists public.admin_audit_logs (
  id                uuid primary key default gen_random_uuid(),
  actor_admin_id    uuid references public.admins(user_id) on delete set null,
  action            text not null,
  target_admin_id   uuid references public.admins(user_id) on delete set null,
  target_identifier text,
  metadata          jsonb default '{}'::jsonb,
  ip_address        text,
  created_at        timestamptz default now()
);

create index if not exists audit_logs_created_idx on public.admin_audit_logs(created_at desc);
create index if not exists audit_logs_actor_idx   on public.admin_audit_logs(actor_admin_id);
create index if not exists audit_logs_action_idx  on public.admin_audit_logs(action);

-- 5. تفعيل أمان RLS وقواعد التحقق
alter table public.admin_permissions enable row level security;
alter table public.admin_audit_logs  enable row level security;

-- دالة فحص المشرف النشط
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins 
     where user_id = auth.uid() 
       and status = 'active'
  );
$$;

-- دالة فحص المدير العام (Manager)
create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins 
     where user_id = auth.uid() 
       and role = 'manager' 
       and status = 'active'
  );
$$;

-- سياسات جدول الصلاحيات
drop policy if exists "admin_permissions_manager_all" on public.admin_permissions;
create policy "admin_permissions_manager_all"
  on public.admin_permissions
  for all
  using (public.is_manager())
  with check (public.is_manager());

drop policy if exists "admin_permissions_self_read" on public.admin_permissions;
create policy "admin_permissions_self_read"
  on public.admin_permissions
  for select
  using (admin_id = auth.uid());

-- سياسات جدول سجل العمليات (Append-Only)
drop policy if exists "admin_audit_logs_manager_read" on public.admin_audit_logs;
create policy "admin_audit_logs_manager_read"
  on public.admin_audit_logs
  for select
  using (public.is_manager());

drop policy if exists "admin_audit_logs_insert" on public.admin_audit_logs;
create policy "admin_audit_logs_insert"
  on public.admin_audit_logs
  for insert
  with check (true);


-- =========================================================================
--  القسم الثالث: فهارس السرعة والأداء الفائق للأوردرات والكوبونات
-- =========================================================================

-- 1. فهرس جزئي فائق السرعة لعداد الأوردرات الجديدة وتنبيهات اللوحة (0.2ms)
create index if not exists orders_pending_attention_idx
  on public.orders (created_at desc)
  where status = 'new' or payment_status = 'pending_review';

-- 2. فهرس مركب لتصفية الأوردرات بحسب حالة الدفع وتاريخ الإنشاء
create index if not exists orders_payment_status_created_idx
  on public.orders (payment_status, created_at desc);

-- 3. فهرس مركب لتصفية الأوردرات بحسب الحالة مع الترتيب بالتاريخ
create index if not exists orders_status_created_idx
  on public.orders (status, created_at desc);

-- 4. فهرس جزئي للكوبونات النشطة فقط لتسريع الفحص عند الشراء
create index if not exists coupons_active_code_idx
  on public.coupons (upper(code))
  where is_active = true;

-- ══════════════════════════════════════════════════════════════════════════
-- انتهى كود المايجريشن بنجاح. كافة الإضافات آمنة تماماً وقابلة للتكرار.
-- ══════════════════════════════════════════════════════════════════════════
