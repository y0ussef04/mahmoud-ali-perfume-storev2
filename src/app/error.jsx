'use client';

export default function GlobalError({ error, reset }) {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="text-d3">حصلت مشكلة</h1>
      <p className="mt-3 text-xs1 text-ink-60">
        غالباً الاتصال بالداتابيز اتقطع، أو متغيّرات البيئة ناقصة.
      </p>
      {error?.message ? (
        <p className="mt-4 border border-hair-soft bg-glass px-4 py-3 text-start text-xs2 text-garnet">
          {error.message}
        </p>
      ) : null}
      <button type="button" onClick={() => reset()} className="btn-solid mt-6">
        جرّب تاني
      </button>
    </div>
  );
}
