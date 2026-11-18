import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AdminFallback } from './components/AdminFallback';
import { AdminLayout } from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductEditorPage from './pages/ProductEditorPage';
import TaxonomyPage from './pages/TaxonomyPage';
import OrdersPage from './pages/OrdersPage';
import OrderEditorPage from './pages/OrderEditorPage';
import TestimonialsPage from './pages/TestimonialsPage';
import ContentPage from './pages/ContentPage';
import UsersPage from './pages/UsersPage';

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { session, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <AdminFallback />;
  if (!session || !isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <Helmet>
        <title>Painel · Dois Brilhos</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route
          path="*"
          element={
            <RequireAdmin>
              <AdminLayout>
                <Routes>
                  <Route index element={<DashboardPage />} />
                  <Route path="produtos" element={<ProductsPage />} />
                  <Route path="produtos/novo" element={<ProductEditorPage />} />
                  <Route path="produtos/:id" element={<ProductEditorPage />} />
                  <Route path="categorias" element={<TaxonomyPage kind="category" />} />
                  <Route path="colecoes" element={<TaxonomyPage kind="collection" />} />
                  <Route path="pedidos" element={<OrdersPage />} />
                  <Route path="pedidos/novo" element={<OrderEditorPage />} />
                  <Route path="pedidos/:id" element={<OrderEditorPage />} />
                  <Route path="depoimentos" element={<TestimonialsPage />} />
                  <Route path="conteudo" element={<ContentPage />} />
                  <Route path="usuarios" element={<UsersPage />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </AdminLayout>
            </RequireAdmin>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
