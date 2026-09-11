import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';

// كل الاستعلامات هنا قراية عامّة للكاتالوج — من غير كوكيز عشان صفحات
// المتجر تفضل ثابتة/ISR (شوف التعليق في supabase/public.js).

/** الأعمدة اللي بنجيبها للعطر مع ماركته وأحجامه وصوره */
const PRODUCT_SELECT = `
  id, slug, name_ar, name_en, family, kind, gender, concentration,
  notes_top, notes_heart, notes_base,
  spine_top, spine_heart, spine_base,
  longevity, projection, description, is_featured, created_at,
  brand:brands ( id, slug, name_ar, name_en, country ),
  variants ( id, label, ml, price, compare_price, stock, sku, sort, is_active ),
  images:product_images ( url, alt, sort )
`;

/**
 * بيرتّب الأحجام والصور ويحسب أرخص سعر وحالة التوفّر.
 * الترتيب في الجاڤاسكريبت مش في الاستعلام — أبسط وأضمن.
 */
export function shapeProduct(p) {
  if (!p) return null;

  const variants = (p.variants || [])
    .filter((v) => v.is_active !== false)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || (a.ml ?? 0) - (b.ml ?? 0));

  const images = (p.images || []).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

  const inStock = variants.filter((v) => v.stock > 0);
  const prices = variants.map((v) => Number(v.price));

  return {
    ...p,
    variants,
    images,
    cover: images[0]?.url || null,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    totalStock: variants.reduce((a, v) => a + (v.stock || 0), 0),
    available: inStock.length > 0,
    /** أول حجم متاح — اللي بنختاره تلقائياً في صفحة العطر */
    defaultVariantId: (inStock[0] || variants[0])?.id || null,
    hasDiscount: variants.some(
      (v) => v.compare_price && Number(v.compare_price) > Number(v.price)
    ),
  };
}

/** كل العطور المفعّلة — كاش فوري للكاتالوج والصفحة الرئيسية */
export const getProducts = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw new Error(`تحميل العطور فشل: ${error.message}`);
    return (data || []).map(shapeProduct);
  },
  ['products-list'],
  { revalidate: 60, tags: ['products'] }
);

/** عطر واحد بالـ slug — مغلّف بـ React cache لمنع تكرار الاستعلام بين generateMetadata و ProductPage */
export const getProduct = cache(async (slug) => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw new Error(`تحميل العطر فشل: ${error.message}`);
  return data ? shapeProduct(data) : null;
});

/** قائمة الـ slugs فقط — خفيفة جداً لتوليد generateStaticParams في أجزاء من الثانية دون جلب الصور والأحجام */
export const getProductSlugs = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('products')
      .select('slug')
      .eq('is_active', true);

    if (error) return [];
    return data || [];
  },
  ['product-slugs'],
  { revalidate: 300, tags: ['products'] }
);

/** الأعمدة المخصصة للعطور المشابهة — كروت فقط بدون نوتات أو وصف لتقليل نقل البيانات */
const RELATED_SELECT = `
  id, slug, name_ar, name_en,
  brand:brands ( name_ar ),
  variants ( id, label, price, compare_price, stock, sort, is_active ),
  images:product_images ( url, alt, sort )
`;

/** عطور شبيهة — نفس العائلة، وبعدين نفس الماركة */
export async function getRelated(product, limit = 4) {
  if (!product) return [];
  const supabase = createPublicClient();

  // بننضّف شروط الـ or من أي قيمة فاضية. عطر من غير ماركة بيدّي
  // brand_id.eq.undefined وده بيرفضه Postgres كـ uuid ويوقّع القراية كلها.
  const ors = [`family.eq.${product.family}`];
  if (product.brand?.id) ors.push(`brand_id.eq.${product.brand.id}`);

  const { data, error } = await supabase
    .from('products')
    .select(RELATED_SELECT)
    .eq('is_active', true)
    .neq('id', product.id)
    .or(ors.join(','))
    .limit(limit);

  if (error) return [];
  return (data || []).map(shapeProduct);
}

export const getBrands = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('brands')
      .select('id, slug, name_ar, name_en, country, about')
      .eq('is_active', true)
      .order('sort', { ascending: true });

    if (error) throw new Error(`تحميل الماركات فشل: ${error.message}`);
    return data || [];
  },
  ['brands-list'],
  { revalidate: 300, tags: ['brands'] }
);

export const getShippingRates = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('shipping_rates')
      .select('governorate, fee, days_min, days_max')
      .eq('is_active', true)
      .order('fee', { ascending: true })
      .order('governorate', { ascending: true });

    if (error) throw new Error(`تحميل مصاريف الشحن فشل: ${error.message}`);
    return data || [];
  },
  ['shipping-rates'],
  { revalidate: 3600, tags: ['shipping'] }
);

/** الإعدادات كـ كائن جاهز: { free_ship_threshold: 1500, wa_number: '201...' } */
export const getSettings = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from('settings').select('key, value');

    if (error) throw new Error(`تحميل الإعدادات فشل: ${error.message}`);

    const out = {};
    for (const row of data || []) out[row.key] = row.value;

    // قيم افتراضية لو الصف ناقص — الموقع مايقعش أبداً بسبب إعداد ناقص
    return {
      store_name: "Mahmoud-Ali's store",
      free_ship_threshold: 1500,
      cod_fee: 15,
      wallet_number: '01000000000',
      wa_number: '201000000000',
      announcement: '',
      ...out,
    };
  },
  ['store-settings'],
  { revalidate: 60, tags: ['settings'] }
);



