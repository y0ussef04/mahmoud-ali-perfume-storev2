import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/server';
import {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_METHOD_SHORT,
  PAYMENT_STATUS,
} from '@/lib/labels';

// exceljs محتاج Node مش Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES = ['new', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'];
const PAY_STATUSES = ['unpaid', 'pending_review', 'paid', 'refunded'];
const MAX_ROWS = 5000;

// نفس تعريف is_revenue في الداتابيز بالحرف — الإيراد = الأوردرات المؤكّدة بس.
// الأوردر الجديد (new) لسه تحت المراجعة فمحسوبش مبيعات، والملغي/المرتجع خرجوا.
const REVENUE_STATUSES = ['confirmed', 'packed', 'shipped', 'delivered'];
const isRevenue = (o) => REVENUE_STATUSES.includes(o.status);

/**
 * الفلوس المطلوب تحصيلها من المندوب على الأوردر ده.
 * دفع عند الاستلام + لسه مادُفعش (unpaid تحديداً، مش refunded)
 * + مش ملغي ولا مرتجع. تعريف واحد بيتستخدم في كل خانة في الملف
 * عشان مجموع العمود يطابق سطر الملخص.
 */
const collectable = (o) =>
  o.payment_method === 'cod' &&
  o.payment_status === 'unpaid' &&
  !['cancelled', 'returned'].includes(o.status)
    ? Number(o.total) || 0
    : 0;

import { safePostgrestSearch } from '@/lib/validate';

/** وقت القاهرة بصيغة YYYY-MM-DD HH:mm — بتترتب صح في Excel كنص */
function stamp(iso) {
  if (!iso) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  const g = (t) => parts.find((x) => x.type === t)?.value || '';
  return `${g('year')}-${g('month')}-${g('day')} ${g('hour')}:${g('minute')}`;
}

const BRASS = 'FFA9834E';
const PAPER = 'FFF6F1E8';

function dressHeader(sheet) {
  const row = sheet.getRow(1);
  row.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRASS } };
  row.alignment = { vertical: 'middle', horizontal: 'right' };
  row.height = 24;
}

export async function GET(request) {
  // ── الصلاحية: RLS هي الحد الحقيقي، والفحص هنا عشان نرجّع رسالة مفهومة
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'محتاج تسجّل دخول.' }, { status: 401 });
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!admin) {
    return Response.json({ error: 'مش مسموح.' }, { status: 403 });
  }

  // ── الفلاتر: نفس اللي في صفحة الأوردرات عشان اللي تشوفه هو اللي بينزل
  const sp = request.nextUrl.searchParams;
  const status = STATUSES.includes(sp.get('status')) ? sp.get('status') : '';
  const payment = PAY_STATUSES.includes(sp.get('payment')) ? sp.get('payment') : '';
  const search = safePostgrestSearch(sp.get('q'));

  let query = supabase
    .from('orders')
    .select('*, order_items ( * )')
    .order('created_at', { ascending: false })
    .limit(MAX_ROWS);

  if (status) query = query.eq('status', status);
  if (payment) query = query.eq('payment_status', payment);
  if (search) {
    query = query.or(
      `order_no.ilike.%${search}%,phone.ilike.%${search}%,customer_name.ilike.%${search}%`
    );
  }

  const { data: orders, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = orders || [];

  // ══════════════════════════════════════════════════════════
  //  بناء الملف
  // ══════════════════════════════════════════════════════════
  const wb = new ExcelJS.Workbook();
  wb.creator = "Mahmoud-Ali's store";
  wb.created = new Date();

  // ─── ورقة ١: الأوردرات ───
  const s1 = wb.addWorksheet('الأوردرات', {
    views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }],
  });

  s1.columns = [
    { header: 'رقم الأوردر', key: 'no', width: 16 },
    { header: 'التاريخ', key: 'at', width: 17 },
    { header: 'الحالة', key: 'st', width: 13 },
    { header: 'حالة الدفع', key: 'pst', width: 16 },
    { header: 'طريقة الدفع', key: 'pm', width: 20 },
    { header: 'العميل', key: 'name', width: 24 },
    { header: 'الموبايل', key: 'ph', width: 14 },
    { header: 'موبايل احتياطي', key: 'ph2', width: 14 },
    { header: 'المحافظة', key: 'gov', width: 14 },
    { header: 'المنطقة', key: 'area', width: 18 },
    { header: 'العنوان', key: 'street', width: 34 },
    { header: 'علامة مميزة', key: 'mark', width: 22 },
    { header: 'عدد القطع', key: 'cnt', width: 11 },
    { header: 'المجموع', key: 'sub', width: 12 },
    { header: 'الشحن', key: 'ship', width: 11 },
    { header: 'رسم التحصيل', key: 'cod', width: 13 },
    { header: 'الخصم', key: 'disc', width: 11 },
    { header: 'كود الخصم', key: 'coupon', width: 13 },
    { header: 'الإجمالي', key: 'total', width: 13 },
    { header: 'المطلوب تحصيله', key: 'due', width: 15 },
    { header: 'رقم عملية التحويل', key: 'ref', width: 20 },
    { header: 'ملاحظة العميل', key: 'note', width: 30 },
    { header: 'ملاحظة داخلية', key: 'anote', width: 30 },
    { header: 'سبب الإلغاء', key: 'why', width: 24 },
  ];

  for (const o of rows) {
    const due = collectable(o);

    s1.addRow({
      no: o.order_no,
      at: stamp(o.created_at),
      st: ORDER_STATUS[o.status] || o.status,
      pst: PAYMENT_STATUS[o.payment_status] || o.payment_status,
      pm: PAYMENT_METHOD[o.payment_method] || o.payment_method,
      name: o.customer_name,
      ph: o.phone,
      ph2: o.phone2 || '',
      gov: o.governorate,
      area: o.area,
      street: o.street,
      mark: o.landmark || '',
      cnt: Number(o.items_count) || 0,
      sub: Number(o.subtotal) || 0,
      ship: Number(o.shipping_fee) || 0,
      cod: Number(o.cod_fee) || 0,
      disc: Number(o.discount) || 0,
      coupon: o.coupon_code || '',
      total: Number(o.total) || 0,
      due,
      ref: o.transfer_ref || '',
      note: o.note || '',
      anote: o.admin_note || '',
      why: o.cancel_reason || '',
    });
  }

  dressHeader(s1);

  // الموبايل نص عشان الصفر اللي في الأول مايضيعش
  for (const key of ['no', 'ph', 'ph2', 'ref']) {
    s1.getColumn(key).numFmt = '@';
    s1.getColumn(key).alignment = { horizontal: 'left' };
  }
  for (const key of ['sub', 'ship', 'cod', 'disc', 'total', 'due']) {
    s1.getColumn(key).numFmt = '#,##0 "ج.م"';
  }
  s1.getColumn('cnt').numFmt = '#,##0';
  s1.getColumn('street').alignment = { wrapText: true, vertical: 'top' };
  s1.getColumn('note').alignment = { wrapText: true, vertical: 'top' };
  s1.getColumn('anote').alignment = { wrapText: true, vertical: 'top' };

  if (rows.length > 0) {
    s1.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: s1.columns.length } };
  }

  // ─── ورقة ٢: البنود ───
  const s2 = wb.addWorksheet('البنود', {
    views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }],
  });

  s2.columns = [
    { header: 'رقم الأوردر', key: 'no', width: 16 },
    { header: 'التاريخ', key: 'at', width: 17 },
    { header: 'الحالة', key: 'st', width: 13 },
    { header: 'البراند', key: 'brand', width: 18 },
    { header: 'العطر', key: 'p', width: 30 },
    { header: 'الحجم', key: 'v', width: 14 },
    { header: 'سعر الوحدة', key: 'unit', width: 13 },
    { header: 'الكمية', key: 'qty', width: 9 },
    { header: 'إجمالي السطر', key: 'line', width: 14 },
    { header: 'المحافظة', key: 'gov', width: 14 },
    { header: 'طريقة الدفع', key: 'pm', width: 15 },
  ];

  for (const o of rows) {
    for (const l of o.order_items || []) {
      s2.addRow({
        no: o.order_no,
        at: stamp(o.created_at),
        st: ORDER_STATUS[o.status] || o.status,
        brand: l.brand_name || '',
        p: l.product_name,
        v: l.variant_label,
        unit: Number(l.unit_price) || 0,
        qty: Number(l.qty) || 0,
        line: Number(l.line_total) || 0,
        gov: o.governorate,
        pm: PAYMENT_METHOD_SHORT[o.payment_method] || o.payment_method,
      });
    }
  }

  dressHeader(s2);
  s2.getColumn('no').numFmt = '@';
  s2.getColumn('no').alignment = { horizontal: 'left' };
  for (const key of ['unit', 'line']) s2.getColumn(key).numFmt = '#,##0 "ج.م"';
  s2.getColumn('qty').numFmt = '#,##0';

  if (s2.rowCount > 1) {
    s2.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: s2.columns.length } };
  }

  // ─── ورقة ٣: ملخص ───
  const s3 = wb.addWorksheet('ملخص', { views: [{ rightToLeft: true }] });

  // الإيراد الحقيقي = الأوردرات المؤكّدة بس (نفس is_revenue في الداتابيز)
  const live = rows.filter(isRevenue);
  const sum = (a, f) => a.reduce((n, x) => n + (Number(f(x)) || 0), 0);
  const revenue = sum(live, (o) => o.total);
  const pendingCount = rows.filter((o) => o.status === 'new').length;
  const deadCount = rows.filter(
    (o) => o.status === 'cancelled' || o.status === 'returned'
  ).length;

  s3.addRow(['ملخص التصدير']);
  s3.getRow(1).font = { bold: true, size: 14 };
  s3.addRow([]);
  s3.addRow(['وقت التصدير', stamp(new Date().toISOString())]);
  s3.addRow([
    'الفلتر',
    [
      status ? `الحالة: ${ORDER_STATUS[status]}` : null,
      payment ? `الدفع: ${PAYMENT_STATUS[payment]}` : null,
      search ? `بحث: ${search}` : null,
    ]
      .filter(Boolean)
      .join(' · ') || 'كل الأوردرات',
  ]);
  s3.addRow(['عدد الأوردرات', rows.length]);
  s3.addRow(['منها تحت المراجعة (غير مؤكّد)', pendingCount]);
  s3.addRow(['منها ملغي أو مرتجع', deadCount]);
  s3.addRow(['الأوردرات المؤكّدة (محسوبة إيراد)', live.length]);
  s3.addRow(['الإيراد (المؤكّد فقط)', revenue]);
  s3.addRow([
    'متوسط قيمة الأوردر المؤكّد',
    live.length ? Math.round(revenue / live.length) : 0,
  ]);
  s3.addRow([
    'المطلوب تحصيله من المناديب',
    sum(rows, collectable),
  ]);

  s3.addRow([]);
  const statusHeadRow = s3.rowCount + 1;
  s3.addRow(['الحالة', 'عدد', 'الإجمالي']);
  s3.getRow(statusHeadRow).font = { bold: true };
  s3.getRow(statusHeadRow).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: PAPER },
  };

  for (const st of STATUSES) {
    const g = rows.filter((o) => o.status === st);
    if (g.length === 0) continue;
    s3.addRow([ORDER_STATUS[st], g.length, sum(g, (o) => o.total)]);
  }

  s3.addRow([]);
  const govHeadRow = s3.rowCount + 1;
  s3.addRow(['المحافظة', 'عدد', 'الإجمالي']);
  s3.getRow(govHeadRow).font = { bold: true };
  s3.getRow(govHeadRow).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: PAPER },
  };

  const byGov = new Map();
  for (const o of live) {
    const k = o.governorate || '—';
    const cur = byGov.get(k) || { n: 0, t: 0 };
    byGov.set(k, { n: cur.n + 1, t: cur.t + (Number(o.total) || 0) });
  }
  for (const [gov, v] of [...byGov.entries()].sort((a, b) => b[1].t - a[1].t)) {
    s3.addRow([gov, v.n, v.t]);
  }

  s3.getColumn(1).width = 38;
  s3.getColumn(2).width = 12;
  s3.getColumn(3).width = 16;
  s3.getColumn(3).numFmt = '#,##0 "ج.م"';

  if (rows.length >= MAX_ROWS) {
    s3.addRow([]);
    s3.addRow([`تنبيه: التصدير واقف عند ${MAX_ROWS} أوردر. استخدم الفلاتر لتصدير فترة أصغر.`]);
  }

  // ── التسليم ──
  const buf = await wb.xlsx.writeBuffer();
  const day = new Date().toISOString().slice(0, 10);

  return new Response(buf, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="orders-${day}.xlsx"; filename*=UTF-8''${encodeURIComponent(
        `اوردرات-${day}.xlsx`
      )}`,
      'Cache-Control': 'no-store',
    },
  });
}
