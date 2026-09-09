import StoreShell from '@/components/StoreShell';
import Footer from '@/components/Footer';
import { getSettings } from '@/lib/queries';

export const revalidate = 60;

export default async function StoreLayout({ children }) {
  const settings = await getSettings();

  return (
    <>
      <StoreShell settings={settings}>{children}</StoreShell>
      <Footer settings={settings} />
    </>
  );
}
