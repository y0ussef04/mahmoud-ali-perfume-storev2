-- ══════════════════════════════════════════════════════════════════════════
--  Migration 02 — نظام الرتب والصلاحيات (RBAC) وسجل العمليات الحساسة (Audit)
--
--  الأهداف:
--    ① إضافة الرتبة (role: 'manager' | 'admin') والحالة (status: 'active' | 'disabled') لجدول public.admins
--    ② إنشاء جدول صلاحيات المديرين public.admin_permissions
--    ③ إنشاء جدول سجل العمليات الإدارية public.admin_audit_logs
--    ④ ضبط قواعد الأمان وسياسات RLS
--    ⑤ تعيين الحساب الرئيسي كـ Manager دائم
--
--  التشغيل: Supabase Dashboard → SQL Editor → New query → الصق الكل → Run
-- ══════════════════════════════════════════════════════════════════════════

-- ─── ① تحديث جدول public.admins بالأعمدة الجديدة والقيود ──────────────────
alter table public.admins 
  add column if not exists role text not null default 'admin';

alter table public.admins 
  add column if not exists status text not null default 'active';

alter table public.admins 
  add column if not exists updated_at timestamptz default now();

-- إضافة القيود (Check Constraints) إذا لم تكن موجودة
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'admins_role_check'
  ) then
    alter table public.admins add constraint admins_role_check check (role in ('manager', 'admin'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'admins_status_check'
  ) then
    alter table public.admins add constraint admins_status_check check (status in ('active', 'disabled'));
  end if;
end $$;

-- ترقية الحساب الأساسي إلى Manager نشط
update public.admins 
   set role = 'manager', status = 'active'
 where email = 'youssef.mohammed3204@gmail.com';

-- ─── ② جدول صلاحيات المديرين (admin_permissions) ──────────────────────────
create table if not exists public.admin_permissions (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null references public.admins(user_id) on delete cascade,
  permission  text not null,
  created_at  timestamptz default now(),
  unique (admin_id, permission)
);

create index if not exists admin_permissions_admin_idx on public.admin_permissions(admin_id);

-- ─── ③ جدول سجل العمليات الحساسة (admin_audit_logs) ──────────────────────
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

-- ─── ④ سياسات RLS والأمان ────────────────────────────────────────────────
alter table public.admin_permissions enable row level security;
alter table public.admin_audit_logs  enable row level security;

-- تحديث دالة is_admin() للتأكد من أن المشرف نشط (غير معطّل)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins 
     where user_id = auth.uid() 
       and status = 'active'
  );
$$;

-- دالة فحص ما إذا كان المستخدم الحالي Manager نشط
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

-- سياسات جدول سجل العمليات
drop policy if exists "admin_audit_logs_manager_read" on public.admin_audit_logs;
create policy "admin_audit_logs_manager_read"
  on public.admin_audit_logs
  for select
  using (public.is_manager());

-- لا يُسمح لأحد بتعديل أو حذف سجلات التدقيق (Append-Only)
drop policy if exists "admin_audit_logs_insert" on public.admin_audit_logs;
create policy "admin_audit_logs_insert"
  on public.admin_audit_logs
  for insert
  with check (true);
