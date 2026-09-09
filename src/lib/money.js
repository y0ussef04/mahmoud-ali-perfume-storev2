// أرقام لاتينية مع نص عربي — الأسهل في القراءة للأسعار المصرية
const NUM = new Intl.NumberFormat('ar-EG-u-nu-latn', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const NUM0 = new Intl.NumberFormat('ar-EG-u-nu-latn', {
  maximumFractionDigits: 0,
});

/** 1250 → "1,250 ج.م" */
export function egp(n) {
  return `${NUM.format(Number(n) || 0)} ج.م`;
}

/** 1250 → "1,250" */
export function num(n) {
  return NUM.format(Number(n) || 0);
}

/** 1250.7 → "1,251" */
export function int(n) {
  return NUM0.format(Number(n) || 0);
}

/** نسبة التغيّر بين فترتين — بترجع null لو مفيش أساس نقارن عليه */
export function delta(current, previous) {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  if (p === 0) return c > 0 ? null : 0;
  return Math.round(((c - p) / p) * 1000) / 10;
}

const DATE = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const DATETIME = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function dateAr(v) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : DATE.format(d);
}

export function dateTimeAr(v) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : DATETIME.format(d);
}

/** "9 سبت" — تسمية مختصرة لمحور الرسم البياني */
const SHORT_DAY = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
  day: 'numeric',
  month: 'short',
});
export function shortDay(v) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : SHORT_DAY.format(d);
}
