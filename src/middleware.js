import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * ══════════════════════════════════════════════════════════
 *  حماية /admin + تحديث جلسة Supabase
 * ══════════════════════════════════════════════════════════
 *
 * الميدل‌وير بيعمل حاجتين:
 *   ① بيحدّث توكن الجلسة (refresh) عشان ماتفصلش وسط الشغل
 *   ② بيمنع أي حد مش مسجّل دخول من يشوف /admin
 *
 * ⚠️ مهم تفهم إن ده طبقة راحة مش طبقة أمان.
 * الأمان الحقيقي في RLS جوه الداتابيز + دالة is_admin().
 * حتى لو حد لفّ حول الميدل‌وير، مش هيقدر يقرا ولا يكتب حرف.
 * التحقق إن اليوزر ده أدمن فعلاً بيحصل في layout الداشبورد.
 */
export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // لازم getUser() مش getSession() — ده اللي بيتحقق من التوكن فعلاً
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === '/admin/login';

  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // مسجّل دخول وبيفتح صفحة الدخول → وديه للداشبورد
  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
