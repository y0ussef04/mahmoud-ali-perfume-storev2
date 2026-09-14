'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { checkImageFile } from '@/lib/validate';
import { Plus, Trash2, AlertTriangle, CheckCircle2, Save } from 'lucide-react';

const DEFAULT_REVIEWS = [
  {
    id: 'rev-1',
    customer_name: 'م. أحمد الشريف',
    city: 'القاهرة (التجمع)',
    rating: 5,
    perfume: 'خمرة — لطافة',
    comment: 'طلبته ووصلني تاني يوم بالتغليف المظبوط. العطر أصلي ١٠٠٪ والفوحان بتاعه بيثبت أكتر من ١٢ ساعة.',
    date: 'منذ ٣ أيام',
    image_url: '',
  },
  {
    id: 'rev-2',
    customer_name: 'د. سارة عبد الفتاح',
    city: 'الإسكندرية',
    rating: 5,
    perfume: 'طقم عيّنات الخليج',
    comment: 'طقم العيّنات فكرة ممتازة جداً قبل ما تشتري الحجم الكبير! عرفت اختار العطر اللي يناسب ذوقي بدون مغامرة.',
    date: 'منذ أسبوع',
    image_url: '',
  },
  {
    id: 'rev-3',
    customer_name: 'عمر الهاشمي',
    city: 'الجيزة (الشيخ زايد)',
    rating: 5,
    perfume: 'أسد — لطافة',
    comment: 'أول مرة أتعامل مع متجر بيحط كل الأسعار والأحجام واضحة كده من غير ما تضطر تبعت في الرسائل.',
    date: 'منذ أسبوعين',
    image_url: '',
  },
];

export default function ReviewsManager({ initialReviews = [] }) {
  const router = useRouter();
  const [reviews, setReviews] = useState(() =>
    initialReviews && initialReviews.length > 0 ? initialReviews : DEFAULT_REVIEWS
  );
  const [busy, setBusy] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  // إضافة رأي جديد
  const addReview = () => {
    const newRev = {
      id: `rev-${Date.now()}`,
      customer_name: '',
      city: '',
      rating: 5,
      perfume: '',
      comment: '',
      date: 'الآن',
      image_url: '',
    };
    setReviews([newRev, ...reviews]);
    setOk('');
  };

  // تعديل حقل في رأي معين
  const updateField = (id, field, value) => {
    setReviews((list) =>
      list.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
    setOk('');
  };

  // حذف رأي
  const removeReview = (id) => {
    if (confirm('هل أنت تأكد من حذف هذا الرأي؟')) {
      setReviews((list) => list.filter((r) => r.id !== id));
      setOk('');
    }
  };

  // رفع صورة اسكرين لبطاقة الرأي
  const handleFileUpload = async (id, file) => {
    if (!file) return;

    const fileErr = checkImageFile(file);
    if (fileErr) {
      setError(fileErr);
      return;
    }

    const rawExt = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
    const ext = ALLOWED_EXTS.includes(rawExt) ? rawExt : 'jpg';

    setUploadingId(id);
    setError('');

    try {
      const supabase = createClient();
      const path = `reviews/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

      const { error: upErr } = await supabase.storage.from('products').upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from('products').getPublicUrl(path);
      updateField(id, 'image_url', pub.publicUrl);
    } catch (err) {
      setError(`فشل رفع الصورة: ${err.message}`);
    } finally {
      setUploadingId(null);
    }
  };

  // حفظ التعديلات في جدول الإعدادات
  const saveAll = async () => {
    setError('');
    setOk('');

    for (let i = 0; i < reviews.length; i++) {
      const r = reviews[i];
      if (!r.customer_name?.trim()) {
        return setError(`اسم العميل في الرأي رقم ${i + 1} مطلوب.`);
      }
      if (!r.perfume?.trim()) {
        return setError(`اسم العطر في الرأي رقم ${i + 1} مطلوب.`);
      }
      const ratingNum = parseInt(r.rating, 10);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return setError(`التقييم في الرأي رقم ${i + 1} يجب أن يكون بين ١ و ٥ نجوم.`);
      }
      if (!r.comment?.trim() && !r.image_url?.trim()) {
        return setError(`يرجى كتابة نص التعليق أو رفع صورة اسكرين للرأي رقم ${i + 1}.`);
      }
    }

    setBusy(true);

    try {
      const supabase = createClient();
      const { error: dbErr } = await supabase.from('settings').upsert(
        {
          key: 'customer_reviews',
          value: reviews.map((r) => ({
            ...r,
            customer_name: r.customer_name.trim(),
            city: (r.city || '').trim(),
            perfume: r.perfume.trim(),
            comment: (r.comment || '').trim(),
            rating: Math.min(5, Math.max(1, parseInt(r.rating, 10) || 5)),
          })),
          label: 'آراء واسكرينات العملاء',
        },
        { onConflict: 'key' }
      );

      if (dbErr) throw dbErr;

      setOk('تم حفظ آراء العملاء بنجاح');
      router.refresh();
    } catch (err) {
      setError(`تعذر الحفظ: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة والأزرار */}
      <div className="flex flex-wrap items-center justify-between gap-4 surface p-4 rounded-sm">
        <div>
          <h3 className="font-display text-d2 text-brass-gilt">إدارة اسكرينات وآراء العملاء</h3>
          <p className="text-xs1 text-ink-60 mt-1">
            ارفع اسكرينات شات الواتساب أو إنستاجرام أو اكتب آراء وتقييمات العملاء لتظهر في الصفحة الرئيسية.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={addReview}
            className="rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#C9A84C] hover:bg-[#C9A84C]/20 px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة رأي/اسكرين جديد</span>
          </button>
          <button
            type="button"
            onClick={saveAll}
            disabled={busy}
            className="group/btn relative overflow-hidden bg-gradient-to-r from-[#1A1814] to-[#2D2921] dark:from-[#C9A84C] dark:to-[#8B6914] text-white text-xs font-semibold px-5 py-2 rounded-full transition-all duration-300 active:scale-[0.97] flex items-center gap-2 shadow-sm hover:shadow-md hover:shadow-[#C9A84C]/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
            <Save className="w-3.5 h-3.5 relative" />
            <span className="relative">{busy ? 'جاري الحفظ…' : 'حفظ التعديلات'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-400 rounded-xl">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {ok && (
        <div className="flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400 rounded-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{ok}</span>
        </div>
      )}

      {/* قائمة الآراء */}
      <div className="grid gap-6 md:grid-cols-2">
        {reviews.map((r, index) => (
          <div
            key={r.id}
            className="surface p-5 border border-[#E8E6E1] dark:border-[#2E2B22] rounded-2xl space-y-4 relative group shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-[#E8E6E1] dark:border-[#2E2B22] pb-3">
              <span className="num font-bold text-[#C9A84C] text-xs">رأي #{index + 1}</span>
              <button
                type="button"
                onClick={() => removeReview(r.id)}
                className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف</span>
              </button>
            </div>

            {/* رفع صورة الاسكرين */}
            <div>
              <label className="label">صورة اسكرين الرأي (واتساب / إنستاجرام)</label>
              <div className="mt-1 flex items-center gap-3">
                {r.image_url ? (
                  <div className="relative h-24 w-24 border border-brass/40 rounded-xs overflow-hidden shrink-0 bg-lacquer">
                    <Image src={r.image_url} alt="اسكرين الرأي" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="h-24 w-24 border border-dashed border-hair text-ink-42 flex items-center justify-center text-xs2 text-center p-2 rounded-xs shrink-0">
                    لا يوجد اسكرين
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(r.id, e.target.files?.[0])}
                    disabled={uploadingId === r.id}
                    className="block w-full text-xs2 text-ink-60 file:me-3 file:py-1 file:px-3 file:border-0 file:bg-brass-gilt/20 file:text-brass-gilt file:rounded-xs hover:file:bg-brass-gilt/30 cursor-pointer"
                  />
                  {uploadingId === r.id && (
                    <p className="text-xs2 text-brass animate-pulse">جاري رفع الصورة…</p>
                  )}
                  <input
                    type="url"
                    placeholder="أو أدخل رابط الصورة المباشر https://..."
                    value={r.image_url || ''}
                    onChange={(e) => updateField(r.id, 'image_url', e.target.value)}
                    className="field text-xs2 py-1.5"
                  />
                </div>
              </div>
            </div>

            {/* البيانات النصية */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">اسم العميل</label>
                <input
                  type="text"
                  placeholder="مثال: م. أحمد الشريف"
                  value={r.customer_name || ''}
                  onChange={(e) => updateField(r.id, 'customer_name', e.target.value)}
                  className="field text-xs1"
                />
              </div>

              <div>
                <label className="label">المدينة / المحافظة</label>
                <input
                  type="text"
                  placeholder="مثال: القاهرة (التجمع)"
                  value={r.city || ''}
                  onChange={(e) => updateField(r.id, 'city', e.target.value)}
                  className="field text-xs1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">العطر المطلوب</label>
                <input
                  type="text"
                  placeholder="مثال: خمرة — لطافة"
                  value={r.perfume || ''}
                  onChange={(e) => updateField(r.id, 'perfume', e.target.value)}
                  className="field text-xs1"
                />
              </div>

              <div>
                <label className="label">التقييم بالنجوم (1-5)</label>
                <select
                  value={r.rating || 5}
                  onChange={(e) => updateField(r.id, 'rating', Number(e.target.value))}
                  className="field text-xs1"
                >
                  <option value={5}>★★★★★ (5 من 5)</option>
                  <option value={4}>★★★★☆ (4 من 5)</option>
                  <option value={3}>★★★☆☆ (3 من 5)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">تعليق العميل / اقتباس الشات</label>
              <textarea
                rows={2}
                placeholder="اكتب تعليق العميل أو ملخص المحادثة..."
                value={r.comment || ''}
                onChange={(e) => updateField(r.id, 'comment', e.target.value)}
                className="field text-xs1"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
