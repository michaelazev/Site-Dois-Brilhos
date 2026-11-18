import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MotionConfig } from 'framer-motion';
import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource-variable/jost';
import './styles/index.css';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './components/ui/Toast';

// A rolagem é controlada pelo app (volta ao topo após a transição de página).
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              {/* reducedMotion="user": respeita "reduzir movimento" do sistema */}
              <MotionConfig reducedMotion="user">
                <App />
              </MotionConfig>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
);
