import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { IntroLoader } from './IntroLoader';
import { DemoBanner } from './DemoBanner';

export default function StoreLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  useEffect(() => {
    // Aguarda a transição de saída para voltar ao topo sem "pulo" visual.
    const t = setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }), 380);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <IntroLoader />
      <Header />
      <div className="flex-1">{children}</div>
      <DemoBanner />
      <Footer />
      <CartDrawer />
    </div>
  );
}
