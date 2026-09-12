import { redirect } from 'next/navigation';

export default async function ResetPasswordRedirect({ searchParams }) {
  const sp = await searchParams;
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp || {})) {
    if (v) p.set(k, String(v));
  }
  const query = p.toString();
  redirect(`/admin/reset-password${query ? `?${query}` : ''}`);
}
