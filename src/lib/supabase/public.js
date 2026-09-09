import { createClient } from '@supabase/supabase-js';

/**
 * كلاينت قراءة عام — من غير كوكيز ومن غير جلسة.
 *
 * ليه منفصل عن server.js؟
 * الكلاينت اللي بيقرا الكوكيز (createServerClient) بيلمس cookies()، وده
 * في Next 15 بيخلّي الصفحة "ديناميكية" — تتبني مع كل طلب، والـ
 * revalidate=60 و generateStaticParams بيروحوا هباءً.
 *
 * صفحات الكاتالوج والعطر عامّة تماماً: RLS بيسمح لـ anon يقرا المنتجات
 * والماركات والأحجام والصور ومصاريف الشحن والإعدادات (سياسات ..._read).
 * فبنقراها بكلاينت بلا كوكيز عشان Next يبنيها ثابتة/ISR ويخدمها من الكاش —
 * أسرع وأرخص وأحسن للسيو، وأمانها زيّ ما هو محفوظ بالـ RLS على مستوى الصف.
 *
 * مهم: مايتستخدمش أبداً لقراية داتا خاصة (أوردرات، كوبونات، أدمن) —
 * دي بتتقري بكلاينت الجلسة في server.js أو بكلاينت السيرفس-رول في admin.js.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
