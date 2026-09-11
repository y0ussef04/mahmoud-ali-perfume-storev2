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

  // فحص فوري وسريع للتوكن الموجود في الكوكيز محلياً (0.003ms) لتجنب اتصال شبكي مع كل نقرة
  let user = null;
  const authCookie = request.cookies.getAll().find((c) => c.name.includes('auth-token'));
  if (authCookie) {
    try {
      let raw = authCookie.value;
      if (raw.startsWith('base64-')) {
        raw = Buffer.from(raw.slice(7), 'base64url').toString('utf8');
      }
      const session = JSON.parse(raw);
      if (session?.access_token) {
        const payload = JSON.parse(
          Buffer.from(session.access_token.split('.')[1], 'base64url').toString('utf8')
        );
        // التوكن صالح لأكثر من دقيقة قادمة
        if (payload?.exp && payload.exp > Math.floor(Date.now() / 1000) + 60) {
          user = {
            id: payload.sub,
            email: payload.email || session.user?.email || '',
          };
        }
      }
    } catch {
      // لو فيه خطأ في القراءة يظل user = null
    }
  }

  // لو التوكن غير موجود أو شارف على الانتهاء، نجدده ونتحقق رسمياً من سيرفر التوثيق
  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  }

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
