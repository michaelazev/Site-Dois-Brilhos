import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';
import { IntroLoader } from './IntroLoader';
import { DemoBanner } from './DemoBanner';

export default function StoreLayout({ children }: { children: ReactNode }) {
  // A volta ao topo entre páginas fica em App.tsx (onExitComplete),
  // no instante em que a página antiga já sumiu e a nova ainda não apareceu.
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
