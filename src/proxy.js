import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * ══════════════════════════════════════════════════════════
 *  حماية /admin + تحديث جلسة Supabase (Next.js 16 Proxy)
 * ══════════════════════════════════════════════════════════
 *
 * البروكسي ينفذ طبقة حماية الراحة وإدارة الكوكيز قبل وصول الطلب:
 *   ① تحديث توكن الجلسة (refresh) حتى لا تنتهي الجلسة أثناء العمل
 *   ② منع غير المسجلين من دخول صفحات الإدارة وتحويلهم لصفحة الدخول
 *   ③ السماح بصفحات الدخول واستعادة كلمة المرور (/admin/login, /admin/reset-password)
 *
 * ⚠️ الأمان الحقيقي محمي في السيرفر عبر requireAdmin() وقواعد RLS في Supabase.
 */
export async function proxy(request) {
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

  // تحقق حقيقي من التوكن عبر getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === '/admin/login';
  const isResetPassword = pathname === '/admin/reset-password';
  const isAuthRoute = isLogin || isResetPassword;

  // غير مسجّل دخول ويحاول دخول صفحات الإدارة المحمية → تحويل لصفحة الدخول
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // مسجّل دخول وبالفعل في صفحة تسجيل الدخول → تحويل للداشبورد
  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (user) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email || '');
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
