'use server';

import { updateTag } from 'next/cache';

/**
 * دالة مركزية آمنة لإلغاء صلاحية الكاش فورياً عند أي تعديل من لوحة الإدارة.
 * تستخدم دلالات updateTag الرسمية في Next.js 16 داخل Server Actions
 * لمنع تقديم أي محتوى قديم (Stale Content) للمستخدم بعد التعديل مباشرة.
 * @param {'products' | 'shipping' | 'settings' | 'brands'} tag
 */
export async function invalidateCacheTag(tag) {
  try {
    updateTag(tag);
    return { ok: true };
  } catch (err) {
    console.error(`Failed to update tag ${tag}:`, err);
    return { ok: false, error: err?.message };
  }
}
