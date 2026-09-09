'use client';

import { useState } from 'react';

/**
 * صندوق نص جاهز للنسخ — بيانات المندوب في سطور مرتبة.
 * الفكرة: بدل ما تنسخ كل حقل لوحده، تاخد البلوك كله بضغطة.
 */
export default function CopyBox({ text, label = 'انسخ' }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // بعض المتصفحات بتمنع النسخ من غير تفاعل مباشر — التحديد اليدوي شغّال دايماً
      setCopied(false);
    }
  }

  return (
    <div className="border border-hair-soft bg-elevated">
      <pre className="whitespace-pre-wrap px-4 py-3 text-xs1 leading-relaxed text-oud">
        {text}
      </pre>
      <div className="flex items-center justify-between gap-3 border-t border-hair-soft px-4 py-2">
        <span className="text-xs2 text-ink-42">
          {copied ? 'اتنسخ ✓' : 'الصقه في نظام شركة الشحن'}
        </span>
        <button type="button" onClick={copy} className="btn-quiet">
          {label}
        </button>
      </div>
    </div>
  );
}
