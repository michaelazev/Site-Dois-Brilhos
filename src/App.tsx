import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation, type Location } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import StoreLayout from './components/layout/StoreLayout';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSentPage from './pages/OrderSentPage';
import AboutPage from './pages/AboutPage';
import CarePage from './pages/CarePage';
import NotFoundPage from './pages/NotFoundPage';
import { AdminFallback } from './admin/components/AdminFallback';
import { isTouchDevice } from './hooks/useLiteMotion';
import { useMobileScroll } from './hooks/useMobileScroll';

// O painel é carregado sob demanda: visitantes da loja não baixam esse código.
const AdminApp = lazy(() => import('./admin/AdminApp'));

function StoreRoutes({ location }: { location: Location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<HomePage />} />
      <Route path="/loja" element={<ShopPage mode="all" />} />
      <Route path="/categoria/:slug" element={<ShopPage mode="category" />} />
      <Route path="/colecao/:slug" element={<ShopPage mode="collection" />} />
      <Route path="/novidades" element={<ShopPage mode="new" />} />
      <Route path="/mais-vendidos" element={<ShopPage mode="bestsellers" />} />
      <Route path="/produto/:slug" element={<ProductPage />} />
      <Route path="/carrinho" element={<CartPage />} />
      <Route path="/finalizar" element={<CheckoutPage />} />
      <Route path="/pedido-enviado" element={<OrderSentPage />} />
      <Route path="/sobre" element={<AboutPage />} />
      <Route path="/cuidados" element={<CarePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  useMobileScroll();

  if (isAdmin) {
    return (
      <Suspense fallback={<AdminFallback />}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <StoreLayout>
      {isTouchDevice ? (
        // Celular: troca de página instantânea, sem apagar/acender a tela.
        // A chave por endereço garante que cada página comece com estado limpo.
        <StoreRoutes key={location.pathname} location={location} />
      ) : (
        <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
          <StoreRoutes key={location.pathname} location={location} />
        </AnimatePresence>
      )}
    </StoreLayout>
  );
}
