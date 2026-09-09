-- ══════════════════════════════════════════════════════════════════════════
--  محمود علي للعطور — سكيما Supabase كاملة
--  شغّل الملف ده مرة واحدة في: Supabase Dashboard → SQL Editor → New query
-- ══════════════════════════════════════════════════════════════════════════

-- ─── تنضيف (للتطوير فقط — شيل الجزء ده على الإنتاج) ────────────────────────
drop function if exists public.place_order(jsonb, jsonb, text, text, text, text);
drop function if exists public.validate_coupon(text, numeric);
drop function if exists public.admin_kpis(int);
drop function if exists public.revenue_by_day(int);
drop function if exists public.top_products(int, int);
drop function if exists public.low_stock(int);
drop function if exists public.stale_products(int);
drop function if exists public.geo_breakdown(int);
drop function if exists public.brand_performance(int);
drop function if exists public.setting_num(text);
drop function if exists public.setting_txt(text);
drop function if exists public.is_admin();

drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.variants cascade;
drop table if exists public.product_images cascade;
drop table if exists public.products cascade;
drop table if exists public.brands cascade;
drop table if exists public.coupons cascade;
drop table if exists public.shipping_rates cascade;
drop table if exists public.settings cascade;
drop table if exists public.admins cascade;

-- ══════════════════════════════════════════════════════════════════════════
--  الجداول
-- ══════════════════════════════════════════════════════════════════════════

-- ─── الماركات (إماراتية وسعودية) ──────────────────────────────────────────
create table public.brands (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name_ar     text not null,
  name_en     text,
  country     text not null check (country in ('AE','SA')),
  about       text,
  sort        int default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- ─── العطور ───────────────────────────────────────────────────────────────
create table public.products (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  brand_id      uuid references public.brands(id) on delete restrict,
  name_ar       text not null,
  name_en       text,
  -- العائلة العطرية
  family        text not null check (family in
                  ('oud','oriental','floral','musk','citrus','oil','incense','set')),
  kind          text,                    -- وصف قصير: مخلط شرقي / دهن عود / بخور معمول
  gender        text check (gender in ('men','women','unisex')) default 'unisex',
  concentration text,                    -- EDP · تركيز 20% / دهن عود مُعتّق
  -- النوتات
  notes_top     text[] default '{}',
  notes_heart   text[] default '{}',
  notes_base    text[] default '{}',
  -- ألوان "عمود الرائحة" — المقدمة والقلب والقاعدة
  spine_top     text default '#C9A45C',
  spine_heart   text default '#8E3E44',
  spine_base    text default '#3A2318',
  longevity     int check (longevity between 1 and 5),
  projection    int check (projection between 1 and 5),
  description   text,
  is_active     boolean default true,
  is_featured   boolean default false,
  created_at    timestamptz default now()
);

create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  url         text not null,
  alt         text,
  sort        int default 0
);

-- ─── الأحجام (كل حجم له سعره ومخزونه) ─────────────────────────────────────
create table public.variants (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  label         text not null,           -- "100 مل" / "12 مل رول" / "3 × 2 مل"
  ml            numeric(8,2),
  price         numeric(10,2) not null check (price >= 0),
  compare_price numeric(10,2),           -- السعر قبل الخصم (للشطب)
  stock         int not null default 0 check (stock >= 0),
  sku           text unique,
  sort          int default 0,
  is_active     boolean default true
);

-- ─── مصاريف الشحن لكل محافظة ──────────────────────────────────────────────
create table public.shipping_rates (
  id           uuid primary key default gen_random_uuid(),
  governorate  text unique not null,
  fee          numeric(10,2) not null check (fee >= 0),
  days_min     int default 2,
  days_max     int default 5,
  is_active    boolean default true
);

-- ─── الإعدادات العامة ─────────────────────────────────────────────────────
create table public.settings (
  key    text primary key,
  value  jsonb not null,
  label  text
);

-- ─── أكواد الخصم ──────────────────────────────────────────────────────────
create table public.coupons (
  id            uuid primary key default gen_random_uuid(),
  code          text unique not null,
  kind          text not null check (kind in ('percent','fixed','free_ship')),
  value         numeric(10,2) not null default 0,
  min_subtotal  numeric(10,2) not null default 0,
  max_uses      int,                     -- null = بلا حدود
  used_count    int not null default 0,
  starts_at     timestamptz,
  ends_at       timestamptz,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  -- عدّاد الاستخدام مايتخطاش الحد أبداً
  constraint coupon_uses_sane check (max_uses is null or used_count <= max_uses)
);

-- الكود بيتقارن بـ upper() في كل مكان، فالتفرّد لازم يكون بـ upper() كمان.
-- من غير الفهرس ده يقدر يبقى فيه EID100 و eid100 مع بعض، وساعتها زيادة
-- العدّاد بتلمس الصفّين والمنطق كله بيبوظ.
create unique index coupons_code_upper_idx on public.coupons (upper(code));

-- ─── الأوردرات ────────────────────────────────────────────────────────────
create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_no        text unique not null,
  -- العميل
  customer_name   text not null,
  phone           text not null,
  phone2          text,
  governorate     text not null,
  area            text not null,
  street          text not null,
  landmark        text,
  note            text,
  -- الفلوس (كلها محسوبة على السيرفر)
  subtotal        numeric(10,2) not null default 0,
  shipping_fee    numeric(10,2) not null default 0,
  cod_fee         numeric(10,2) not null default 0,
  discount        numeric(10,2) not null default 0,
  total           numeric(10,2) not null default 0,
  coupon_code     text,
  items_count     int not null default 0,
  -- الدفع
  payment_method  text not null check (payment_method in ('cod','card','wallet')),
  payment_status  text not null default 'unpaid'
                  check (payment_status in ('unpaid','pending_review','paid','refunded')),
  transfer_ref    text,
  receipt_url     text,
  -- التنفيذ
  status          text not null default 'new'
                  check (status in ('new','confirmed','packed','shipped','delivered','cancelled','returned')),
  cancel_reason   text,
  admin_note      text,
  -- الشحن الخارجي: أول ما الأوردر يتسلّم لشركة الشحن بنسجّل اسم الشركة
  -- ورقم البوليصة (والرابط لو الشركة بتوفّره)، والعميل يكمّل التتبع من
  -- موقع الشركة نفسها. بيفضلوا null لحد ما الأوردر يوصل مرحلة الشحن.
  -- إحنا مابنعملش تكامل مع أي شركة شحن — دي بيانات الأدمن بيكتبها بإيده.
  shipping_company text,
  tracking_number  text,
  tracking_url     text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete restrict,
  -- restrict مقصود: لو الحجم اتحذف والربط بقى null، إلغاء أي أوردر قديم
  -- بيرجّع المخزون مكانه بالصمت من غير ما يبان إن حاجة ضاعت.
  -- فالحذف بيتمنع، والأدمن بيشيل علامة "معروض" بدل الحذف.
  variant_id    uuid references public.variants(id) on delete restrict,
  -- صور ثابتة من وقت الأوردر — الأسعار والأسماء بتتغير، الأوردر لأ
  product_name  text not null,
  variant_label text not null,
  brand_name    text,
  unit_price    numeric(10,2) not null,
  qty           int not null check (qty > 0),
  line_total    numeric(10,2) not null
);

-- ─── الأدمن ───────────────────────────────────────────────────────────────
create table public.admins (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  created_at  timestamptz default now()
);

-- ─── الفهارس ──────────────────────────────────────────────────────────────
create index products_brand_idx     on public.products(brand_id);
create index products_family_idx    on public.products(family);
create index products_active_idx    on public.products(is_active) where is_active;
create index variants_product_idx   on public.variants(product_id);
create index variants_stock_idx     on public.variants(stock);
create index images_product_idx     on public.product_images(product_id);
create index orders_created_idx     on public.orders(created_at desc);
create index orders_status_idx      on public.orders(status);
create index orders_gov_idx         on public.orders(governorate);
create index orders_phone_idx       on public.orders(phone);
create index order_items_order_idx  on public.order_items(order_id);
create index order_items_prod_idx   on public.order_items(product_id);

-- ─── تحديث updated_at تلقائياً ────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger orders_touch before update on public.orders
for each row execute function public.touch_updated_at();

-- ─── مسلسل أرقام الأوردرات ────────────────────────────────────────────────
create sequence if not exists public.order_seq start 1;

-- ══════════════════════════════════════════════════════════════════════════
--  دوال مساعدة
-- ══════════════════════════════════════════════════════════════════════════

create or replace function public.setting_num(k text)
returns numeric language sql stable security definer set search_path = public as $$
  select (value #>> '{}')::numeric from public.settings where key = k
$$;

create or replace function public.setting_txt(k text)
returns text language sql stable security definer set search_path = public as $$
  select (value #>> '{}') from public.settings where key = k
$$;

-- هل المستخدم الحالي أدمن؟ (security definer عشان مايحصلش RLS متداخل)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

-- هل الأوردر ده بيتحسب في الإيراد والمبيعات؟
-- تعريف واحد بيتستخدم في كل دوال التحليلات وفي تصدير Excel،
-- عشان مايحصلش إن الداش بورد يقول رقم والتصدير يقول رقم تاني.
--
-- ⚠️ القاعدة الأساسية: الأوردر ما يتحسبش مبيعات إلا بعد ما الأدمن يأكّده.
-- الأوردر الجديد ('new') لسه تحت المراجعة — يمكن يكون رقم موبايل غلط أو
-- عميل مش جادّ أو مكرّر، فحرام يزوّد الإيراد وهو لسه مؤكّدش. أول ما
-- الأدمن يأكّده ('confirmed') يدخل الحساب، ويفضل داخل طول ما ماشي في
-- مساره الطبيعي (مجهّز → مشحون → متسلّم). لو اتلغى أو رجع يخرج فوراً.
-- يعني: الإيراد = الحالات المؤكّدة بس، مش أي أوردر مجرد ما اتعمل.
create or replace function public.is_revenue(p_status text)
returns boolean language sql immutable set search_path = public as $$
  select p_status in ('confirmed','packed','shipped','delivered')
$$;

-- ══════════════════════════════════════════════════════════════════════════
--  التحقق من كود الخصم (بيتنادى من صفحة الدفع قبل التأكيد)
-- ══════════════════════════════════════════════════════════════════════════
create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare c record; disc numeric := 0; free_ship boolean := false;
begin
  -- limit 1 مقصود: المقارنة بـ upper() فلو فيه كودين بنفس الحروف
  -- بأحرف مختلفة، نمسك واحد ثابت بدل ما plpgsql يختار عشوائي
  select * into c from public.coupons
   where upper(code) = upper(trim(p_code)) and is_active
   order by created_at
   limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'الكود مش موجود أو موقوف.');
  end if;
  if c.starts_at is not null and now() < c.starts_at then
    return jsonb_build_object('ok', false, 'error', 'الكود لسه مابدأش.');
  end if;
  if c.ends_at is not null and now() > c.ends_at then
    return jsonb_build_object('ok', false, 'error', 'الكود خلصت مدته.');
  end if;
  if c.max_uses is not null and c.used_count >= c.max_uses then
    return jsonb_build_object('ok', false, 'error', 'الكود وصل لأقصى عدد استخدام.');
  end if;
  if p_subtotal < c.min_subtotal then
    return jsonb_build_object('ok', false,
      'error', 'الكود ده للأوردرات من ' || c.min_subtotal::int || ' ج.م وفوق.');
  end if;

  if c.kind = 'percent' then
    disc := round(p_subtotal * c.value / 100.0, 2);
  elsif c.kind = 'fixed' then
    disc := least(c.value, p_subtotal);
  else
    free_ship := true;
  end if;

  return jsonb_build_object(
    'ok', true, 'code', upper(c.code), 'kind', c.kind,
    'discount', disc, 'free_ship', free_ship
  );
end $$;

-- ══════════════════════════════════════════════════════════════════════════
--  إنشاء الأوردر — كل الحسابات هنا، والمخزون بيتخصم في نفس الترانزاكشن
--  مهم: الأسعار بتتقرأ من الداتابيز، مش من اللي جاي من المتصفح
-- ══════════════════════════════════════════════════════════════════════════
create or replace function public.place_order(
  p_customer       jsonb,   -- {name, phone, phone2, governorate, area, street, landmark, note}
  p_items          jsonb,   -- [{variant_id, qty}]
  p_payment_method text,
  p_coupon_code    text default null,
  p_transfer_ref   text default null,
  p_receipt_url    text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order_id   uuid;
  v_order_no   text;
  v_subtotal   numeric := 0;
  v_ship       numeric := 0;
  v_cod        numeric := 0;
  v_discount   numeric := 0;
  v_count      int := 0;
  v_free_ship  boolean := false;
  v_gov        text;
  v_rate       record;
  v_item       jsonb;
  v_var        record;
  v_qty        int;
  v_coupon     jsonb;
  v_threshold  numeric;
  v_items      jsonb;
begin
  -- ① تحقق أساسي
  if p_payment_method not in ('cod','card','wallet') then
    raise exception 'طريقة دفع غير معروفة.';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'العربة فاضية.';
  end if;
  if coalesce(trim(p_customer->>'name'), '') = '' then
    raise exception 'الاسم مطلوب.';
  end if;
  if (p_customer->>'phone') !~ '^01[0125][0-9]{8}$' then
    raise exception 'رقم الموبايل مش صحيح.';
  end if;

  v_gov := trim(p_customer->>'governorate');
  select * into v_rate from public.shipping_rates
   where governorate = v_gov and is_active;
  if not found then
    raise exception 'مابنشحنش للمحافظة دي حالياً.';
  end if;

  -- ①.٥ الكميات لازم تكون أرقام صحيحة موجبة قبل أي جمع
  if exists (
    select 1 from jsonb_array_elements(p_items) e
     where (e->>'variant_id') is null
        or (e->>'qty') is null
        or (e->>'qty') !~ '^[0-9]{1,4}$'
        or (e->>'qty')::int <= 0
  ) then
    raise exception 'كمية غير صحيحة.';
  end if;

  -- دمج البنود المتكرّرة: نفس الحجم مرتين في نفس الطلب = سطر واحد.
  -- من غير الدمج ده، فحص المخزون في ② بيتعمل لكل سطر على حدة بالمخزون
  -- الأصلي، فسطرين ٥ و ٥ على مخزون ٨ بيعدّوا الفحص وبعدين الخصم في ⑥
  -- بينزل المخزون تحت الصفر ويضرب في قيد check.
  select jsonb_agg(jsonb_build_object('variant_id', vid, 'qty', q))
    into v_items
    from (
      select e->>'variant_id' as vid, sum((e->>'qty')::int) as q
        from jsonb_array_elements(p_items) e
       group by 1
    ) g;

  -- ② اقفل الأحجام واحسب المجموع من أسعار الداتابيز
  for v_item in select * from jsonb_array_elements(v_items) loop
    v_qty := (v_item->>'qty')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'كمية غير صحيحة.';
    end if;

    select v.*, p.name_ar as p_name, p.id as p_id, b.name_ar as b_name
      into v_var
      from public.variants v
      join public.products p on p.id = v.product_id
      left join public.brands b on b.id = p.brand_id
     where v.id = (v_item->>'variant_id')::uuid
       and v.is_active and p.is_active
     for update of v;

    if not found then
      raise exception 'فيه حجم في العربة مش متاح.';
    end if;
    if v_var.stock < v_qty then
      raise exception 'المخزون مش كافي لـ % (%). المتاح: %',
        v_var.p_name, v_var.label, v_var.stock;
    end if;

    v_subtotal := v_subtotal + (v_var.price * v_qty);
    v_count    := v_count + v_qty;
  end loop;

  -- ③ الخصم
  if coalesce(trim(p_coupon_code), '') <> '' then
    -- اقفل صفّ الكوبون الأول. من غير القفلة دي، أوردرين في نفس اللحظة
    -- يقروا used_count = 199 على max_uses = 200، الاتنين يعدّوا، والعدّاد
    -- يبقى 201. القفلة بتخلّي التاني يستنى ويقرا الرقم بعد التحديث.
    perform 1 from public.coupons
     where upper(code) = upper(trim(p_coupon_code))
     for update;

    v_coupon := public.validate_coupon(p_coupon_code, v_subtotal);
    if (v_coupon->>'ok')::boolean then
      v_discount  := coalesce((v_coupon->>'discount')::numeric, 0);
      v_free_ship := coalesce((v_coupon->>'free_ship')::boolean, false);
    else
      raise exception '%', v_coupon->>'error';
    end if;
  end if;

  -- ④ الشحن ورسم التحصيل
  -- صفر (أو أقل) في free_ship_threshold معناه "مافيش عرض شحن مجاني" —
  -- نفس المعنى بالحرف في src/lib/totals.js. لو خلّيناها مقارنة عادية،
  -- المجموع دايماً >= صفر وكل الأوردرات كانت هتطلع شحن مجاني.
  v_threshold := coalesce(public.setting_num('free_ship_threshold'), 1500);
  if v_free_ship or (v_threshold > 0 and v_subtotal >= v_threshold) then
    v_ship := 0;
  else
    v_ship := v_rate.fee;
  end if;
  -- هنا coalesce مظبوطة: صفر في cod_fee معناه فعلاً مافيش رسم تحصيل
  if p_payment_method = 'cod' then
    v_cod := coalesce(public.setting_num('cod_fee'), 15);
  end if;

  -- ⑤ اكتب الأوردر
  v_order_no := 'MA-' || to_char(now(), 'YYMMDD') || '-' ||
                lpad(nextval('public.order_seq')::text, 4, '0');

  insert into public.orders (
    order_no, customer_name, phone, phone2, governorate, area, street, landmark, note,
    subtotal, shipping_fee, cod_fee, discount, total, coupon_code, items_count,
    payment_method, payment_status, transfer_ref, receipt_url
  ) values (
    v_order_no,
    trim(p_customer->>'name'),
    p_customer->>'phone',
    nullif(trim(coalesce(p_customer->>'phone2','')), ''),
    v_gov,
    trim(p_customer->>'area'),
    trim(p_customer->>'street'),
    nullif(trim(coalesce(p_customer->>'landmark','')), ''),
    nullif(trim(coalesce(p_customer->>'note','')), ''),
    v_subtotal, v_ship, v_cod, v_discount,
    greatest(v_subtotal + v_ship + v_cod - v_discount, 0),
    nullif(upper(trim(coalesce(p_coupon_code,''))), ''),
    v_count,
    p_payment_method,
    case when p_payment_method = 'wallet' then 'pending_review' else 'unpaid' end,
    nullif(trim(coalesce(p_transfer_ref,'')), ''),
    nullif(trim(coalesce(p_receipt_url,'')), '')
  ) returning id into v_order_id;

  -- ⑥ البنود + خصم المخزون
  for v_item in select * from jsonb_array_elements(v_items) loop
    v_qty := (v_item->>'qty')::int;

    select v.*, p.name_ar as p_name, p.id as p_id, b.name_ar as b_name
      into v_var
      from public.variants v
      join public.products p on p.id = v.product_id
      left join public.brands b on b.id = p.brand_id
     where v.id = (v_item->>'variant_id')::uuid;

    insert into public.order_items (
      order_id, product_id, variant_id,
      product_name, variant_label, brand_name,
      unit_price, qty, line_total
    ) values (
      v_order_id, v_var.p_id, v_var.id,
      v_var.p_name, v_var.label, v_var.b_name,
      v_var.price, v_qty, v_var.price * v_qty
    );

    update public.variants set stock = stock - v_qty where id = v_var.id;
  end loop;

  -- ⑦ عدّاد الكوبون
  if coalesce(trim(p_coupon_code), '') <> '' then
    update public.coupons set used_count = used_count + 1
     where upper(code) = upper(trim(p_coupon_code));
  end if;

  return jsonb_build_object(
    'ok', true,
    'order_no', v_order_no,
    'subtotal', v_subtotal,
    'shipping_fee', v_ship,
    'cod_fee', v_cod,
    'discount', v_discount,
    'total', greatest(v_subtotal + v_ship + v_cod - v_discount, 0)
  );
end $$;

-- ══════════════════════════════════════════════════════════════════════════
--  دوال التحليلات (بترجع بيانات للأدمن فقط — RLS بتتطبق على المنادي)
-- ══════════════════════════════════════════════════════════════════════════

-- ① المؤشرات الرئيسية + مقارنة بالفترة السابقة
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

-- ② الإيراد يوم بيوم (للرسم البياني)
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

-- ③ أكتر العطور مبيعاً
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

-- ④ أداء الماركات
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

-- ⑤ مخزون قرب يخلص
create or replace function public.low_stock(p_threshold int default 5)
returns table(variant_id uuid, product_id uuid, product_name text,
              brand_name text, label text, stock int, price numeric)
language sql stable security invoker set search_path = public as $$
  select v.id, p.id, p.name_ar, b.name_ar, v.label, v.stock, v.price
    from public.variants v
    join public.products p on p.id = v.product_id
    left join public.brands b on b.id = p.brand_id
   where v.is_active and p.is_active and v.stock <= p_threshold
   order by v.stock asc, p.name_ar
$$;

-- ⑥ راكد — عنده مخزون ومحصلش عليه بيع في الفترة
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

-- ⑦ التوزيع الجغرافي + نسبة إلغاء الدفع عند الاستلام لكل محافظة
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

-- ══════════════════════════════════════════════════════════════════════════
--  دوال الأدمن — تغيير الحالة وإرجاع المخزون
-- ══════════════════════════════════════════════════════════════════════════

-- الانتقالات المسموحة — نفس STATUS_NEXT في src/lib/labels.js بالحرف.
-- لو غيّرت واحدة، غيّر التانية معاها.
create or replace function public.status_can_go(p_from text, p_to text)
returns boolean language sql immutable as $$
  select case p_from
    when 'new'       then p_to in ('confirmed','cancelled')
    when 'confirmed' then p_to in ('packed','cancelled')
    when 'packed'    then p_to in ('shipped','cancelled')
    when 'shipped'   then p_to in ('delivered','returned','cancelled')
    when 'delivered' then p_to in ('returned')
    else false
  end
$$;

-- تغيير حالة أوردر، ومعاها إرجاع المخزون لو اتلغى أو رجع.
--
-- الحالة والمخزون لازم يتحرّكوا مع بعض. لو عملناها في الجافاسكريبت
-- وفصل الإنترنت بين النداءين، يبقى عندنا أوردر ملغي ومخزون ضايع.
-- جواها دالة واحدة = معاملة واحدة = يا كله يا ولا حاجة.
create or replace function public.admin_set_status(
  p_order_id uuid,
  p_status   text,
  p_reason   text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order   public.orders;
  v_item    record;
  v_restore boolean := false;
begin
  if not public.is_admin() then
    raise exception 'مش مسموح.';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'الأوردر مالقيناهوش.';
  end if;

  if v_order.status = p_status then
    return jsonb_build_object('ok', true, 'status', p_status, 'unchanged', true);
  end if;

  if not public.status_can_go(v_order.status, p_status) then
    raise exception 'مش ينفع تنقل من % لـ %.', v_order.status, p_status;
  end if;

  -- المخزون بيترجع مرة واحدة بس: أول مرة الأوردر يخرج من دورة البيع
  if p_status in ('cancelled','returned')
     and v_order.status not in ('cancelled','returned') then
    v_restore := true;
  end if;

  if v_restore then
    for v_item in
      select variant_id, qty from public.order_items
       where order_id = p_order_id and variant_id is not null
    loop
      update public.variants
         set stock = stock + v_item.qty
       where id = v_item.variant_id;
    end loop;

    -- والكوبون كمان يرجع رصيده
    if v_order.coupon_code is not null then
      update public.coupons
         set used_count = greatest(used_count - 1, 0)
       where upper(code) = upper(v_order.coupon_code);
    end if;
  end if;

  update public.orders
     set status = p_status,
         cancel_reason = case
           when p_status = 'cancelled' then nullif(btrim(coalesce(p_reason, '')), '')
           else cancel_reason
         end
   where id = p_order_id;

  return jsonb_build_object('ok', true, 'status', p_status, 'stock_restored', v_restore);
end $$;

-- تأكيد التحويل أو تسجيل استرجاع
create or replace function public.admin_set_payment(
  p_order_id       uuid,
  p_payment_status text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_status text;
begin
  if not public.is_admin() then
    raise exception 'مش مسموح.';
  end if;

  if p_payment_status not in ('unpaid','pending_review','paid','refunded') then
    raise exception 'حالة دفع غير معروفة.';
  end if;

  select status into v_status from public.orders where id = p_order_id;

  if v_status is null then
    raise exception 'الأوردر مالقيناهوش.';
  end if;

  -- أوردر ملغي أو مرتجع مينفعش يتعلّم "مدفوع" أو "قيد المراجعة" —
  -- ده بيبوّظ الحسابات (يبقى عندك أوردر متلغي ومدفوع في نفس الوقت).
  -- المسموح بس: unpaid أو refunded (لو رجّعت الفلوس للعميل).
  if v_status in ('cancelled','returned')
     and p_payment_status in ('paid','pending_review') then
    raise exception 'الأوردر % — مينفعش تعلّمه مدفوع. المسموح: مسترجع أو غير مدفوع.',
      (case v_status when 'cancelled' then 'ملغي' else 'مرتجع' end);
  end if;

  update public.orders
     set payment_status = p_payment_status
   where id = p_order_id;

  return jsonb_build_object('ok', true, 'payment_status', p_payment_status);
end $$;

-- تسجيل بيانات شركة الشحن (الاسم + رقم البوليصة + رابط التتبع لو موجود).
-- الأدمن بيملاها أول ما يسلّم الأوردر لشركة الشحن. مالهاش أي علاقة
-- بحساب الإيراد — دي بيانات تتبع بيشوفها العميل في صفحة "تتبع الأوردر"
-- عشان يكمّل من موقع الشركة. أي خانة فاضية بتترجّع null (مش نص فاضي).
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
--  RLS — أمان الصفوف
-- ══════════════════════════════════════════════════════════════════════════
alter table public.brands          enable row level security;
alter table public.products        enable row level security;
alter table public.product_images  enable row level security;
alter table public.variants        enable row level security;
alter table public.shipping_rates  enable row level security;
alter table public.settings        enable row level security;
alter table public.coupons         enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;
alter table public.admins          enable row level security;

-- ─── قراءة عامة للكاتالوج ─────────────────────────────────────────────────
create policy brands_read on public.brands
  for select using (is_active);

create policy products_read on public.products
  for select using (is_active);

create policy images_read on public.product_images
  for select using (exists (
    select 1 from public.products p where p.id = product_id and p.is_active));

create policy variants_read on public.variants
  for select using (is_active and exists (
    select 1 from public.products p where p.id = product_id and p.is_active));

create policy rates_read on public.shipping_rates
  for select using (is_active);

create policy settings_read on public.settings
  for select using (true);

-- ─── الأدمن: صلاحية كاملة على كل حاجة ─────────────────────────────────────
create policy brands_admin   on public.brands         for all using (public.is_admin()) with check (public.is_admin());
create policy products_admin on public.products       for all using (public.is_admin()) with check (public.is_admin());
create policy images_admin   on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy variants_admin on public.variants       for all using (public.is_admin()) with check (public.is_admin());
create policy rates_admin    on public.shipping_rates for all using (public.is_admin()) with check (public.is_admin());
create policy settings_admin on public.settings       for all using (public.is_admin()) with check (public.is_admin());
create policy coupons_admin  on public.coupons        for all using (public.is_admin()) with check (public.is_admin());
create policy orders_admin   on public.orders         for all using (public.is_admin()) with check (public.is_admin());
create policy oitems_admin   on public.order_items    for all using (public.is_admin()) with check (public.is_admin());

-- الأدمن يشوف صفّه بس (عشان نتأكد إنه أدمن من الواجهة)
create policy admins_self on public.admins
  for select using (user_id = auth.uid());

-- ملاحظة: الأوردرات مفيش عليها قراءة عامة بالمرة.
-- إنشاء الأوردر بيمرّ من place_order، والتتبع من API route بمفتاح الخدمة.

-- ══════════════════════════════════════════════════════════════════════════
--  Storage — صور المنتجات (عامة) وصور التحويلات (خاصة)
-- ══════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('products', 'products', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false) on conflict (id) do nothing;

create policy "products images are public"
  on storage.objects for select using (bucket_id = 'products');
create policy "admins manage product images"
  on storage.objects for all
  using (bucket_id = 'products' and public.is_admin())
  with check (bucket_id = 'products' and public.is_admin());

create policy "anyone can upload a receipt"
  on storage.objects for insert with check (bucket_id = 'receipts');
create policy "admins read receipts"
  on storage.objects for select using (bucket_id = 'receipts' and public.is_admin());

-- ══════════════════════════════════════════════════════════════════════════
--  البيانات الأولية
-- ══════════════════════════════════════════════════════════════════════════

-- ─── الإعدادات ────────────────────────────────────────────────────────────
insert into public.settings (key, value, label) values
  ('store_name',           '"محمود علي للعطور"',  'اسم المتجر'),
  ('free_ship_threshold',  '1500',                'الشحن مجاني من (ج.م)'),
  ('cod_fee',              '15',                  'رسم التحصيل عند الاستلام (ج.م)'),
  ('wallet_number',        '"01000000000"',       'رقم InstaPay / فودافون كاش'),
  ('wa_number',            '"201000000000"',      'واتساب البراند (صيغة دولية)'),
  ('announcement',         '"كل العطور أصلية ١٠٠٪ وبضمان الاستبدال في ٧ أيام"', 'شريط الإعلان')
on conflict (key) do nothing;

-- ─── مصاريف الشحن (محافظات مصر) ───────────────────────────────────────────
insert into public.shipping_rates (governorate, fee, days_min, days_max) values
  ('القاهرة', 50, 2, 4), ('الجيزة', 50, 2, 4), ('القليوبية', 50, 2, 4),
  ('الإسكندرية', 60, 2, 5),
  ('الشرقية', 65, 3, 6), ('الغربية', 65, 3, 6), ('المنوفية', 65, 3, 6),
  ('الدقهلية', 65, 3, 6), ('كفر الشيخ', 65, 3, 6), ('دمياط', 65, 3, 6),
  ('البحيرة', 65, 3, 6), ('الإسماعيلية', 65, 3, 6), ('بورسعيد', 65, 3, 6),
  ('السويس', 65, 3, 6),
  ('الفيوم', 75, 3, 7), ('بني سويف', 75, 3, 7), ('المنيا', 75, 3, 7),
  ('أسيوط', 75, 4, 7), ('سوهاج', 75, 4, 7), ('قنا', 75, 4, 8),
  ('الأقصر', 75, 4, 8), ('أسوان', 75, 4, 8), ('الوادي الجديد', 85, 5, 9),
  ('مطروح', 90, 4, 8), ('البحر الأحمر', 90, 4, 8),
  ('شمال سيناء', 95, 5, 9), ('جنوب سيناء', 95, 5, 9)
on conflict (governorate) do nothing;

-- ─── الماركات ─────────────────────────────────────────────────────────────
insert into public.brands (slug, name_ar, name_en, country, about, sort) values
  ('lattafa',       'لطافة',           'Lattafa',        'AE', 'بيت عطور إماراتي بأسعار في المتناول وثبات عالي.', 1),
  ('ajmal',         'أجمل',            'Ajmal',          'AE', 'أقدم بيوت العطور الإماراتية، متخصص في العود والمخلطات.', 2),
  ('rasasi',        'رصاصي',           'Rasasi',         'AE', 'ماركة إماراتية معروفة بالعطور الشرقية والغربية.', 3),
  ('al-haramain',   'الحرمين',         'Al Haramain',    'AE', 'عود ومخلطات فاخرة وقارورات مميزة.', 4),
  ('swiss-arabian', 'سويس أرابيان',    'Swiss Arabian',  'AE', 'دمج بين الجودة السويسرية والتركيبات العربية.', 5),
  ('afnan',         'أفنان',           'Afnan',          'AE', 'عطور عصرية بفوحان قوي.', 6),
  ('arabian-oud',   'العربية للعود',   'Arabian Oud',    'SA', 'أكبر بيت عطور سعودي، والأشهر في العود والمخلطات الملكية.', 7),
  ('asaq',          'عبد الصمد القرشي','Abdul Samad Al Qurashi','SA','بيت سعودي عريق متخصص في دهن العود والعنبر.', 8),
  ('ard-al-zaafaran','أرض الزعفران',   'Ard Al Zaafaran','AE', 'مخلطات وبخور بأسعار اقتصادية.', 9),
  ('surrati',       'السراتي',         'Surrati',        'SA', 'زيوت عطرية مركزة ومخلطات سعودية.', 10)
on conflict (slug) do nothing;

-- ─── العطور ───────────────────────────────────────────────────────────────
-- (لكل عطر: نوتات حقيقية + ألوان عمود الرائحة)
insert into public.products
  (slug, brand_id, name_ar, name_en, family, kind, gender, concentration,
   notes_top, notes_heart, notes_base, spine_top, spine_heart, spine_base,
   longevity, projection, description, is_featured)
select v.slug, b.id, v.name_ar, v.name_en, v.family, v.kind, v.gender, v.conc,
       v.nt, v.nh, v.nb, v.st, v.sh, v.sb, v.lon, v.prj, v.descr, v.feat
from (values
  ('raghba','lattafa','رغبة','Raghba','oriental','مخلط شرقي حلو','unisex','EDP · تركيز 20%',
   array['عود','قرفة'], array['فانيليا','بخور'], array['مسك','خشب الصندل'],
   '#8B5E3C','#D9BE86','#3A2318',5,4,
   'من أشهر عطور لطافة. فانيليا ودخان عود، دافي جداً وثباته طويل. الأفضل في المسا والشتا.', true),

  ('asad','lattafa','أسد','Asad','oriental','مخلط شرقي','men','EDP · تركيز 22%',
   array['أناناس','برغموت'], array['تبغ','قرفة'], array['فانيليا','عنبر','مسك'],
   '#E0B44A','#8B5E3C','#4A3B2A',5,5,
   'فوحان عالي جداً — نفختين يكفوا. حلو ودخاني، شبابي ومناسب للمناسبات.', true),

  ('khamrah','lattafa','خمرة','Khamrah','oriental','مخلط شرقي حلو','unisex','EDP · تركيز 22%',
   array['قرفة','فاكهة مسكرة','تمر'], array['تونكا','عود','بخور'], array['فانيليا','بنزوين','مسك'],
   '#C0763C','#8B4A32','#D9BE86',5,5,
   'تمر وقرفة وفانيليا. من أنجح عطور لطافة وأكترها طلباً.', true),

  ('amber-wood','ajmal','آمبر وود','Amber Wood','oud','خشبي عنبري','unisex','EDP · تركيز 20%',
   array['زعفران','عنبر'], array['عود','خشب الصندل'], array['مسك','فانيليا'],
   '#C9A45C','#6E4B32','#2A1A12',5,4,
   'عنبر وعود متوازن. راقي ومناسب للشغل والمسا.', false),

  ('dahn-al-oudh-ajmal','ajmal','دهن العود المُعتّق','Dahn Al Oudh','oil','دهن عود','unisex','دهن عود خالص',
   array['عود كمبودي'], array['عود هندي'], array['مسك','عنبر'],
   '#6E4B32','#2A1A12','#4A3B2A',5,3,
   'دهن عود خالص بدون كحول. نقطة واحدة تكفي اليوم كله. للمناسبات والجُمع.', false),

  ('hawas','rasasi','هوس','Hawas','citrus','حمضي أروماتي','men','EDP · تركيز 18%',
   array['تفاح','برغموت','قرفة'], array['نعناع','لافندر','ياسمين'], array['عنبر','مسك','خشب'],
   '#CBD98F','#9BB48C','#B9A88A',4,4,
   'منعش ونضيف، شبابي وبيشتغل في الحر. الأقرب لعطور الغرب الرجالية.', true),

  ('la-yuqawam','rasasi','لا يقاوم','La Yuqawam','oud','خشبي جلدي','men','EDP · تركيز 20%',
   array['برغموت','فلفل'], array['جلد','عود'], array['عنبر','فانيليا','باتشولي'],
   '#B9905A','#5A3A28','#33251E',5,4,
   'جلد وعود، فخم وثقيل. عطر مناسبات مش يومي.', false),

  ('amber-oud-gold','al-haramain','آمبر عود جولد','Amber Oud Gold','oud','عود عنبري','unisex','EDP · تركيز 24%',
   array['ليمون','عنبر'], array['عود','ورد'], array['مسك','خشب الأرز'],
   '#E0B44A','#8E3E44','#3A2318',5,5,
   'من أقوى عطور الحرمين فوحاناً. عود وعنبر بلمسة وردية.', true),

  ('shaghaf-oud','swiss-arabian','شغف عود','Shaghaf Oud','oud','عود حلو','unisex','EDP · تركيز 22%',
   array['ورد','زعفران'], array['عود','فانيليا'], array['كراميل','مسك'],
   '#D98A9A','#8B5E3C','#D9BE86',5,4,
   'عود حلو بالورد والكراميل. من أكتر العطور الخليجية المحبوبة.', false),

  ('9pm','afnan','ناين بي إم','9PM','oriental','شرقي حلو','men','EDP · تركيز 20%',
   array['تفاح','لافندر'], array['قرفة','زهر البرتقال'], array['فانيليا','تونكا','عنبر'],
   '#C64F3A','#8B5E3C','#D9BE86',4,4,
   'حلو ودافي وسعره في المتناول. من أكتر عطور أفنان مبيعاً.', false),

  ('kalemat','arabian-oud','كلمات','Kalemat','oriental','مخلط شرقي','unisex','EDP · تركيز 22%',
   array['عسل','برغموت'], array['عود','ياسمين'], array['عنبر','مسك','فانيليا'],
   '#E0B44A','#8B5E3C','#4A3B2A',5,4,
   'أيقونة العربية للعود. عسل وعود، فخم ومحبوب من الرجالة والستات.', true),

  ('ghala-zayed','arabian-oud','غالي زايد','Ghala Zayed Luxury','oud','عود فاخر','men','EDP · تركيز 25%',
   array['زعفران','توابل'], array['عود كمبودي','ورد طائفي'], array['عنبر','مسك','فيتيفر'],
   '#C9A45C','#8E3E44','#2A1A12',5,5,
   'من أفخم ما تنتجه العربية للعود. عود وورد طائفي بتركيز عالي.', false),

  ('mukhallat-malaki','asaq','مخلط ملكي','Mukhallat Malaki','oriental','مخلط ملكي','unisex','مخلط زيتي',
   array['ورد طائفي'], array['عود','عنبر'], array['مسك','صندل'],
   '#D98A9A','#6E4B32','#8A6A4A',5,3,
   'مخلط سعودي كلاسيك بزيوت مركزة. ثقيل وفخم وثباته أسطوري.', false),

  ('shams-al-emarat','ard-al-zaafaran','شمس الإمارات','Shams Al Emarat','floral','زهري فاكهي','women','EDP · تركيز 18%',
   array['فاكهة حمضية','زعفران'], array['ورد','ياسمين'], array['عود','فانيليا','مسك'],
   '#E3B04A','#B8455A','#8A6A4A',4,4,
   'زهري فاكهي نسائي بسعر اقتصادي وثبات محترم.', false),

  ('musk-tahara','surrati','مسك الطهارة','Musk Tahara','musk','مسك أبيض','women','زيت مركز',
   array['زهر البرتقال'], array['مسك أبيض'], array['بودرة','خشب الأرز'],
   '#E8DCC4','#F2F1EC','#C9C2B4',3,2,
   'مسك أبيض ناعم ونضيف، قريب من الجسم. الأكثر طلباً بين الزيوت.', false),

  ('maamoul-oud','ard-al-zaafaran','معمول عود','Maamoul Oud','incense','بخور معمول','unisex','بخور',
   array['عود'], array['عنبر','مسك'], array['صندل','ورد'],
   '#8B5E3C','#4A3B2A','#2A1A12',null,null,
   'معمول عود للبخور — للبيت والمجالس والملابس.', false),

  ('try-set-gulf','lattafa','طقم تجربة خليجي','Gulf Try Set','set','طقم عينات','unisex','5 × 2 مل',
   array[]::text[], array[]::text[], array[]::text[],
   '#C9A45C','#B79A6A','#8A6A4A',null,null,
   'خمس عينات من أشهر العطور الخليجية تختارها بنفسك بعد التأكيد. قيمة الطقم بتتخصم من أول أوردر كامل.', true)
) as v(slug, brand_slug, name_ar, name_en, family, kind, gender, conc,
       nt, nh, nb, st, sh, sb, lon, prj, descr, feat)
join public.brands b on b.slug = v.brand_slug
on conflict (slug) do nothing;

-- ─── الأحجام والأسعار والمخزون ────────────────────────────────────────────
insert into public.variants (product_id, label, ml, price, compare_price, stock, sku, sort)
select p.id, v.label, v.ml, v.price, v.cmp, v.stock,
       upper(replace(p.slug, '-', '')) || '-' || v.sku_sfx, v.sort
from (values
  ('raghba','100 مل',100,1150,1350,12,'100',1),
  ('raghba','60 مل',60,780,null,9,'060',2),
  ('asad','100 مل',100,1250,1450,8,'100',1),
  ('asad','60 مل',60,850,null,11,'060',2),
  ('khamrah','100 مل',100,1490,1750,6,'100',1),
  ('khamrah','30 مل',30,620,null,14,'030',2),
  ('amber-wood','100 مل',100,2650,null,4,'100',1),
  ('amber-wood','60 مل',60,1780,null,5,'060',2),
  ('dahn-al-oudh-ajmal','3 مل',3,1950,null,3,'003',1),
  ('dahn-al-oudh-ajmal','6 مل',6,3600,null,2,'006',2),
  ('hawas','100 مل',100,2350,2650,7,'100',1),
  ('hawas','50 مل',50,1490,null,9,'050',2),
  ('la-yuqawam','75 مل',75,2890,null,3,'075',1),
  ('amber-oud-gold','60 مل',60,1690,1950,10,'060',1),
  ('shaghaf-oud','75 مل',75,1390,null,8,'075',1),
  ('9pm','100 مل',100,1090,1290,15,'100',1),
  ('kalemat','100 مل',100,3200,null,5,'100',1),
  ('kalemat','50 مل',50,1950,null,7,'050',2),
  ('ghala-zayed','100 مل',100,5400,null,2,'100',1),
  ('mukhallat-malaki','12 مل',12,2400,null,4,'012',1),
  ('mukhallat-malaki','6 مل',6,1350,null,6,'006',2),
  ('shams-al-emarat','100 مل',100,890,1050,13,'100',1),
  ('musk-tahara','25 مل',25,340,null,22,'025',1),
  ('musk-tahara','12 مل رول',12,190,null,30,'012',2),
  ('maamoul-oud','50 جرام',50,650,null,9,'050',1),
  ('maamoul-oud','25 جرام',25,360,null,16,'025',2),
  ('try-set-gulf','5 × 2 مل',10,290,null,25,'SET',1)
) as v(pslug, label, ml, price, cmp, stock, sku_sfx, sort)
join public.products p on p.slug = v.pslug
on conflict (sku) do nothing;

-- ─── أكواد خصم للتجربة ────────────────────────────────────────────────────
insert into public.coupons (code, kind, value, min_subtotal, max_uses, is_active) values
  ('WELCOME10',  'percent',   10, 800,  200,  true),
  ('SHIPFREE',   'free_ship',  0, 500,  null, true),
  ('EID100',     'fixed',    100, 1200, 100,  true)
on conflict (code) do nothing;

-- ══════════════════════════════════════════════════════════════════════════
--  بعد التشغيل: اعمل حساب من /admin/login أو من Authentication → Users،
--  وبعدين نفّذ السطر ده بإيميلك:
--
--  insert into public.admins (user_id, email)
--  select id, email from auth.users where email = 'you@example.com';
-- ══════════════════════════════════════════════════════════════════════════
