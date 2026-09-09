'use client';

import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { egp, int, num, shortDay } from '@/lib/money';

/** بيتابع كلاس dark على <html> عشان الرسوم تتماشى مع الثيم.
    recharts بياخد ألوان كـ props (مش كلاسات)، فمحتاجين نحسبها بالـJS. */
function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setDark(el.classList.contains('dark'));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

/** لوحة ألوان الرسم حسب الثيم:
    المحاور والشبكة بتتقلب (غامق في اللايت / فاتح في الدارك)،
    وألوان الهوية بتترفع شوية في الدارك زي توكنز الـCSS بالظبط. */
function usePalette() {
  const dark = useIsDark();
  const ink = dark ? '236,234,230' : '46,33,27';
  return {
    dark,
    grid: `rgba(${ink},.10)`,
    axisStroke: `rgba(${ink},.20)`,
    tick: `rgba(${ink},.62)`,
    faint: `rgba(${ink},.42)`,
    brass: '#A9834E',
    gilt: '#E4C48C',
    sage: dark ? '#8FB3A2' : '#4A6155',
    garnet: dark ? '#D68285' : '#8A3B3F',
  };
}

/** إطار التلميح — نفس لغة التصميم بدل شكل recharts الافتراضي.
    بيستخدم كلاسات دلالية فبيتماشى مع الثيم لوحده. */
function Frame({ title, rows }) {
  return (
    <div className="border border-hair bg-elevated px-3 py-2 shadow-sm">
      <p className="text-xs2 text-ink-60">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="num mt-1 text-xs1 text-oud">
          {r.label}: {r.value}
        </p>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ① الإيراد يوم بيوم
   ══════════════════════════════════════════════════════════ */
export function RevenueChart({ data = [] }) {
  const c = usePalette();

  const rows = data.map((d) => ({
    label: shortDay(d.day),
    revenue: Number(d.revenue) || 0,
    orders: Number(d.orders) || 0,
  }));

  const empty = rows.every((r) => r.revenue === 0);

  if (empty) {
    return (
      <div className="flex h-64 items-center justify-center border border-dashed border-hair-soft">
        <p className="text-xs1 text-ink-42">مافيش مبيعات في الفترة دي.</p>
      </div>
    );
  }

  return (
    // الرسم البياني يمشي من اليسار لليمين زي المعتاد — الوقت أوضح كده
    <div dir="ltr" className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.brass} stopOpacity={0.34} />
              <stop offset="100%" stopColor={c.brass} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis
            dataKey="label"
            stroke={c.axisStroke}
            tick={{ fill: c.tick, fontSize: 11 }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            stroke={c.axisStroke}
            tick={{ fill: c.tick, fontSize: 11 }}
            tickLine={false}
            width={56}
            tickFormatter={(v) => int(v)}
          />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <Frame
                  title={label}
                  rows={[
                    { label: 'الإيراد', value: egp(payload[0].payload.revenue) },
                    { label: 'الأوردرات', value: num(payload[0].payload.orders) },
                  ]}
                />
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={c.brass}
            strokeWidth={1.6}
            fill="url(#revFill)"
            dot={false}
            activeDot={{ r: 3.5, fill: c.gilt, stroke: c.brass }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ② أداء البراندات
   ══════════════════════════════════════════════════════════ */
export function BrandBars({ data = [] }) {
  const c = usePalette();

  const rows = data.slice(0, 8).map((d) => ({
    label: d.brand_name,
    revenue: Number(d.revenue) || 0,
    units: Number(d.units) || 0,
    share: Number(d.share) || 0,
  }));

  if (rows.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center border border-dashed border-hair-soft">
        <p className="text-xs1 text-ink-42">مافيش بيانات كفاية.</p>
      </div>
    );
  }

  return (
    <div dir="ltr" className="w-full" style={{ height: Math.max(200, rows.length * 34) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 12, bottom: 4, left: 8 }}
        >
          <CartesianGrid stroke={c.grid} horizontal={false} />
          <XAxis
            type="number"
            stroke={c.axisStroke}
            tick={{ fill: c.tick, fontSize: 11 }}
            tickLine={false}
            tickFormatter={(v) => int(v)}
          />
          <YAxis
            type="category"
            dataKey="label"
            stroke={c.axisStroke}
            tick={{ fill: c.tick, fontSize: 12 }}
            tickLine={false}
            width={104}
          />
          <Tooltip
            cursor={{ fill: 'rgba(169,131,78,.08)' }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <Frame
                  title={label}
                  rows={[
                    { label: 'الإيراد', value: egp(payload[0].payload.revenue) },
                    { label: 'القطع', value: num(payload[0].payload.units) },
                    { label: 'النصيب', value: `${num(payload[0].payload.share)}%` },
                  ]}
                />
              ) : null
            }
          />
          <Bar dataKey="revenue" barSize={16}>
            {rows.map((r, i) => (
              <Cell key={r.label} fill={i === 0 ? c.brass : `rgba(169,131,78,${0.82 - i * 0.08})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ③ توزيع طرق الدفع — دوائر صغيرة بدل pie chart
   ══════════════════════════════════════════════════════════ */
export function MethodSplit({ data = [] }) {
  const c = usePalette();

  const total = data.reduce((s, d) => s + (Number(d.orders) || 0), 0);
  if (total === 0) {
    return <p className="text-xs1 text-ink-42">مافيش أوردرات في الفترة دي.</p>;
  }

  const color = { cod: c.brass, card: c.sage, wallet: c.garnet };

  return (
    <div className="space-y-3.5">
      {/* شريط مجمّع */}
      <div className="flex h-2.5 overflow-hidden">
        {data.map((d) => {
          const pct = ((Number(d.orders) || 0) / total) * 100;
          if (pct === 0) return null;
          return (
            <span
              key={d.key}
              style={{ width: `${pct}%`, background: color[d.key] || c.faint }}
              title={`${d.label} ${Math.round(pct)}%`}
            />
          );
        })}
      </div>

      <ul className="space-y-2">
        {data.map((d) => {
          const orders = Number(d.orders) || 0;
          const pct = Math.round((orders / total) * 1000) / 10;
          return (
            <li key={d.key} className="flex items-baseline gap-2.5 text-xs1">
              <span
                aria-hidden="true"
                className="mt-1 h-2 w-2 shrink-0 rotate-45"
                style={{ background: color[d.key] || c.faint }}
              />
              <span className="flex-1 text-ink-60">{d.label}</span>
              <span className="num text-oud">{num(orders)}</span>
              <span className="num w-12 text-end text-ink-42">{num(pct)}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
