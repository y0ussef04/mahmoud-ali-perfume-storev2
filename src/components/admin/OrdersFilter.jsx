'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Panel } from '@/components/admin/ui';
import { ORDER_STATUS, PAYMENT_STATUS } from '@/lib/labels';
import { Search, Filter, RotateCcw } from 'lucide-react';

const STATUSES = ['new', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'];
const PAY_STATUSES = ['unpaid', 'pending_review', 'paid', 'refunded'];

export default function OrdersFilter({
  currentStatus = '',
  currentPayment = '',
  currentSearch = '',
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(currentSearch);
  const [status, setStatus] = useState(currentStatus);
  const [payment, setPayment] = useState(currentPayment);

  function applyFilter(override = {}) {
    const nextStatus = override.status !== undefined ? override.status : status;
    const nextPayment = override.payment !== undefined ? override.payment : payment;
    const nextSearch = override.search !== undefined ? override.search : search;

    const p = new URLSearchParams();
    if (nextStatus) p.set('status', nextStatus);
    if (nextPayment) p.set('payment', nextPayment);
    if (nextSearch.trim()) p.set('q', nextSearch.trim());

    const queryString = p.toString();
    const targetUrl = '/admin/orders' + (queryString ? '?' + queryString : '');

    startTransition(() => {
      router.push(targetUrl, { scroll: false });
    });
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    applyFilter();
  }

  function handleStatusChange(e) {
    const val = e.target.value;
    setStatus(val);
    applyFilter({ status: val });
  }

  function handlePaymentChange(e) {
    const val = e.target.value;
    setPayment(val);
    applyFilter({ payment: val });
  }

  const hasFilter = !!(status || payment || search);

  return (
    <Panel className="mb-5">
      <form onSubmit={handleFormSubmit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[13rem] flex-1">
          <label htmlFor="o-q" className="label">
            بحث <span className="text-xs2 text-ink-42">(رقم الأوردر، الموبايل، أو الاسم)</span>
          </label>
          <div className="relative">
            <input
              id="o-q"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field ps-9"
              placeholder="اكتب واضغط Enter أو زر فلتر..."
            />
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#736B5E] dark:text-[#A8A296] pointer-events-none" />
          </div>
        </div>

        <div className="min-w-[10rem]">
          <label htmlFor="o-status" className="label">
            الحالة
          </label>
          <select
            id="o-status"
            value={status}
            onChange={handleStatusChange}
            className="field cursor-pointer"
          >
            <option value="">كل الحالات</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[10rem]">
          <label htmlFor="o-payment" className="label">
            الدفع
          </label>
          <select
            id="o-payment"
            value={payment}
            onChange={handlePaymentChange}
            className="field cursor-pointer"
          >
            <option value="">كل حالات الدفع</option>
            {PAY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PAYMENT_STATUS[s]}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="group/btn relative overflow-hidden bg-gradient-to-r from-[#1A1814] to-[#2D2921] dark:from-[#C9A84C] dark:to-[#8B6914] text-white text-xs font-semibold px-5 py-3 rounded-full transition-all duration-300 active:scale-[0.97] min-h-[42px] flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:shadow-[#C9A84C]/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
          {isPending ? (
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <>
              <Filter className="w-3.5 h-3.5 relative" />
              <span className="relative">تطبيق</span>
            </>
          )}
        </button>

        {hasFilter ? (
          <Link
            href="/admin/orders"
            onClick={() => {
              setSearch('');
              setStatus('');
              setPayment('');
            }}
            className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>إعادة ضبط</span>
          </Link>
        ) : null}
      </form>

      {/* اختصارات سريعة */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hair-soft pt-4">
        <span className="text-xs2 text-ink-42 me-1">اختصارات:</span>
        <Link href="/admin/orders" className="chip" data-on={!status && !payment ? '1' : '0'}>
          الكل
        </Link>
        <Link
          href="/admin/orders?status=new"
          className="chip"
          data-on={status === 'new' ? '1' : '0'}
        >
          جديد
        </Link>
        <Link
          href="/admin/orders?payment=pending_review"
          className="chip"
          data-on={payment === 'pending_review' ? '1' : '0'}
        >
          تحويل مستنّي مراجعة
        </Link>
        <Link
          href="/admin/orders?status=shipped"
          className="chip"
          data-on={status === 'shipped' ? '1' : '0'}
        >
          في الشحن
        </Link>

        {isPending && (
          <span className="ms-auto text-xs2 text-brass flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-brass animate-ping" />
            جاري تحديث النتائج...
          </span>
        )}
      </div>
    </Panel>
  );
}
