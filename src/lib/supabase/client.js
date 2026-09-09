'use client';

import { createBrowserClient } from '@supabase/ssr';

/** كلاينت المتصفح — بيستخدم مفتاح anon وبيتحكم فيه RLS. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
