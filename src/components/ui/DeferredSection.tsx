import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Monta o conteúdo apenas quando a pessoa se aproxima dele ao rolar
 * (~1 tela e meia antes). Assim o celular desenha primeiro só o topo da página
 * e o restante é preparado aos poucos — sem travar a primeira impressão.
 * O espaço reservado (minHeight) evita que a página "pule" quando o conteúdo entra.
 */
export function DeferredSection({ children, minHeight = 480 }: { children: ReactNode; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: '150% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show]);

  if (show) return <>{children}</>;
  return <div ref={ref} style={{ minHeight }} aria-hidden="true" />;
}
