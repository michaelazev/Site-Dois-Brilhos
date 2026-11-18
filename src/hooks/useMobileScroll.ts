import { useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { isTouchDevice } from './useLiteMotion';

const positions = new Map<string, number>();

/**
 * Celular: controla a rolagem entre páginas, sem animação.
 * - Página nova → começa no topo, antes de ser desenhada (sem "pulo").
 * - Voltar (gesto do Safari ou botão) → volta exatamente ao ponto em que a pessoa estava.
 */
export function useMobileScroll() {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (!isTouchDevice) return;
    const key = location.key;
    const save = () => positions.set(key, window.scrollY);
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, [location.key]);

  useLayoutEffect(() => {
    if (!isTouchDevice) return;
    const y = navType === 'POP' ? positions.get(location.key) ?? 0 : 0;
    window.scrollTo(0, y);
    if (y > 0) {
      // listas podem crescer um instante depois (imagens/dados em cache): reaplica
      const raf = requestAnimationFrame(() => window.scrollTo(0, y));
      const t = setTimeout(() => window.scrollTo(0, y), 150);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(t);
      };
    }
  }, [location.key, navType]);
}
