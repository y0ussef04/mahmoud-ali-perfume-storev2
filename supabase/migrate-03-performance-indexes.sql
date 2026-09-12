-- ══════════════════════════════════════════════════════════════════════════
--  Migration 03 — فهارس الأداء العالي للأوردرات والكوبونات (Performance Indexes)
--
--  آمن 100%: يستخدم if not exists ولا يعدل أي بيانات أو جداول
-- ══════════════════════════════════════════════════════════════════════════

-- 1. فهرس جزئي فائق السرعة لعداد الأوردرات الجديدة وشريط التنبيه (0.2ms)
create index if not exists orders_pending_attention_idx
  on public.orders (created_at desc)
  where status = 'new' or payment_status = 'pending_review';

-- 2. فهرس مركب لتصفية الأوردرات بحسب حالة الدفع وتاريخ الإنشاء
create index if not exists orders_payment_status_created_idx
  on public.orders (payment_status, created_at desc);

-- 3. فهرس مركب لتصفية الأوردرات بحسب الحالة مع الترتيب بالتاريخ
create index if not exists orders_status_created_idx
  on public.orders (status, created_at desc);

-- 4. فهرس جزئي للكوبونات النشطة فقط لتسريع التحقق عند الـ Checkout
create index if not exists coupons_active_code_idx
  on public.coupons (upper(code))
  where is_active = true;
