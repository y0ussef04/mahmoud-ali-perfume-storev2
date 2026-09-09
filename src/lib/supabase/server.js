import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * كلاينت السيرفر — بيقرأ جلسة الأدمن من الكوكيز.
 * في Next 15 دالة cookies() صارت async، فالدالة دي async.
 * لازم تتنادى جوه Server Component أو Route Handler.
 */
export async function createClient() {
  const store = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) =>
              store.set(name, value, options)
            );
          } catch {
            // الكتابة في الكوكيز ممنوعة جوه Server Component —
            // الميدل‌وير هو اللي بيجدّد الجلسة، فنتجاهل الخطأ هنا.
          }
        },
      },
    }
  );
}
