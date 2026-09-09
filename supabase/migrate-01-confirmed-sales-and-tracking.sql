-- ══════════════════════════════════════════════════════════════════════════
--  Migration 01 — المبيعات المؤكَّدة فقط + بيانات تتبُّع الشحن
--
--  ليه الملف ده موجود؟
--  الـschema.sql الكامل بيبدأ بـ drop للجداول (تنضيف للتطوير)، فتشغيله تاني
--  على قاعدة فيها بيانات حقيقية بيمسح كل حاجة. الملف ده البديل الآمن: بيطبّق
--  تعديلات المرحلة دي بس، من غير ما يلمس أي جدول أو أي بيانات.
--
--  آمن ١٠٠٪ للتشغيل على الإنتاج، وتقدر تشغّله أكتر من مرة من غير ضرر
--  (add column if not exists + create or replace).
--
--  التشغيل: Supabase Dashboard → SQL Editor → New query → الصق الكل → Run
-- ══════════════════════════════════════════════════════════════════════════

-- ─── ① أعمدة تتبُّع الشحن على جدول الأوردرات ────────────────────────────────
-- الأدمن بيملاها أول ما يسلّم الأوردر لشركة الشحن (الاسم + رقم البوليصة +
-- الرابط لو موجود)، والعميل يكمّل التتبُّع من موقع الشركة. مافيش تكامل مع
-- أي شركة شحن — دي بيانات بتتكتب بإيد الأدمن.
alter table public.orders add column if not exists shipping_company text;
alter table public.orders add column if not exists tracking_number  text;
alter table public.orders add column if not exists tracking_url     text;

-- ─── ② تعريف "الأوردر اللي بيتحسب مبيعات" ──────────────────────────────────
-- ⚠️ القاعدة الأساسية: الأوردر ما يتحسبش إيراد/مبيعات إلا بعد ما الأدمن
-- يأكّده. الأوردر الجديد ('new') لسه تحت المراجعة — يمكن رقم موبايل غلط أو
-- عميل مش جادّ أو مكرّر، فحرام يزوّد الإيراد. أول ما يتأكّد ('confirmed')
-- يدخل الحساب، ويفضل داخل طول ما ماشي في مساره (مجهّز → مشحون → متسلّم).
-- لو اتلغى أو رجع يخرج فوراً. يعني: الإيراد = الحالات المؤكّدة بس.
create or replace function public.is_revenue(p_status text)
returns boolean language sql immutable set search_path = public as $$
  select p_status in ('confirmed','packed','shipped','delivered')
$$;

-- ─── ③ دوال التحليلات — كلها بتفلتر بـ is_revenue ──────────────────────────
-- لازم تتعمل بعد is_revenue عشان بتناديها. كلها create or replace فبتحدّث
-- النسخة القديمة في مكانها من غير drop.

-- ①ك المؤشرات الرئيسية + مقارنة بالفترة السابقة
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
                          then round((select sum(total) from cur) / (select count(*) from cur), 2)
                          else 0 end,
    'units',         coalesce((select sum(oi.qty) from public.order_items oi
                                join cur on cur.id = oi.order_id), 0),
    'cancelled',     (select n from cancels),
    'pending_review',(select count(*) from public.orders
                       where payment_status = 'pending_review'),
    'new_orders',    (select count(*) from public.orders where status = 'new')
  )
$$;

-- ②ك الإيراد يوم بيوم (للرسم البياني)
create or replace function public.revenue_by_day(p_days int default 30)
returns table(day date, revenue numeric, orders bigint)
language sql stable security invoker set search_path = public as $$
  select d::date,
         coalesce(sum(o.total), 0)::numeric,
         count(o.id)::bigint
    from generate_series(
           (current_date - (p_days - 1))::timestamp,
           current_date::timestamp,
           interval '1 day') d
    left join public.orders o
      on o.created_at::date = d::date
     and public.is_revenue(o.status)
   group by d
   order by d
$$;

-- ③ك أكتر العطور مبيعاً
create or replace function public.top_products(p_days int default 30, p_limit int default 10)
returns table(product_id uuid, product_name text, brand_name text,
              units bigint, revenue numeric)
language sql stable security invoker set search_path = public as $$
  select oi.product_id, oi.product_name, oi.brand_name,
         sum(oi.qty)::bigint, sum(oi.line_total)::numeric
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
   where o.created_at >= now() - (p_days || ' days')::interval
     and public.is_revenue(o.status)
   group by oi.product_id, oi.product_name, oi.brand_name
   order by 4 desc
   limit p_limit
$$;

-- ④ك أداء الماركات
create or replace function public.brand_performance(p_days int default 30)
returns table(brand_name text, units bigint, revenue numeric, share numeric)
language sql stable security invoker set search_path = public as $$
  with t as (
    select coalesce(oi.brand_name, 'غير محدد') as bn,
           sum(oi.qty)::bigint as u,
           sum(oi.line_total)::numeric as r
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
     where o.created_at >= now() - (p_days || ' days')::interval
       and public.is_revenue(o.status)
     group by 1
  )
  select bn, u, r,
         case when (select sum(r) from t) > 0
              then round(100 * r / (select sum(r) from t), 1) else 0 end
    from t order by r desc
$$;

-- ⑥ك راكد — عنده مخزون ومحصلش عليه بيع (مؤكَّد) في الفترة
create or replace function public.stale_products(p_days int default 60)
returns table(product_id uuid, product_name text, brand_name text,
              total_stock bigint, last_sold timestamptz)
language sql stable security invoker set search_path = public as $$
  select p.id, p.name_ar, b.name_ar,
         coalesce(sum(v.stock), 0)::bigint,
         (select max(o.created_at)
            from public.order_items oi
            join public.orders o on o.id = oi.order_id
           where oi.product_id = p.id and public.is_revenue(o.status))
    from public.products p
    left join public.brands b on b.id = p.brand_id
    left join public.variants v on v.product_id = p.id and v.is_active
   where p.is_active
   group by p.id, p.name_ar, b.name_ar
  having coalesce(sum(v.stock), 0) > 0
     and coalesce((select max(o.created_at)
                     from public.order_items oi
                     join public.orders o on o.id = oi.order_id
                    where oi.product_id = p.id and public.is_revenue(o.status)),
                  'epoch'::timestamptz) < now() - (p_days || ' days')::interval
   order by 4 desc
$$;

-- ⑦ك التوزيع الجغرافي + نسبة إلغاء الدفع عند الاستلام لكل محافظة
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
   order by 3 desc
$$;

-- ─── ④ تسجيل بيانات شركة الشحن (RPC للأدمن) ────────────────────────────────
-- مالهاش أي علاقة بحساب الإيراد — دي بيانات تتبُّع بس. أي خانة فاضية
-- بترجع null (مش نص فاضي).
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
    raise exception 'الأوردر مالقيناهوش.';
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

-- ══════════════════════════════════════════════════════════════════════════
--  تمّ. من دلوقتي الأرقام في الداش بورد وفي تصدير Excel هتعكس المبيعات
--  المؤكَّدة بس، والأوردر الجديد (تحت المراجعة) مش هيزوّد الإيراد.
-- ══════════════════════════════════════════════════════════════════════════
