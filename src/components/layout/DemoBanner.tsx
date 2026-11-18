import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { isDemoMode } from '@/lib/supabase';
import { useProducts } from '@/hooks/queries';

/** Aviso discreto: deixa claro que produtos/imagens de exemplo não são reais. */
export function DemoBanner() {
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem('db-demo-banner') === '1';
    } catch {
      return false;
    }
  });
  const { data: products = [] } = useProducts();
  const hasDemoProducts = products.some((p) => p.is_demo);
  if (hidden || (!isDemoMode && !hasDemoProducts)) return null;

  return (
    <div className="fixed bottom-3 left-3 z-40 flex max-w-[calc(100vw-1.5rem)] items-start gap-2.5 rounded-lg border border-line bg-ivory/95 py-2.5 pl-3 pr-2 text-xs text-mute shadow-lg backdrop-blur sm:max-w-sm" role="note">
      <Info className="mt-0.5 size-3.5 shrink-0 text-gold" />
      <p className="leading-relaxed">
        {isDemoMode ? <strong className="font-medium text-ink">Modo demonstração. </strong> : null}
        Produtos, preços e imagens marcados como “Exemplo” são ilustrativos e serão substituídos pelo catálogo real.
      </p>
      <button
        onClick={() => {
          setHidden(true);
          try {
            sessionStorage.setItem('db-demo-banner', '1');
          } catch {
            /* ignore */
          }
        }}
        className="p-0.5 hover:text-ink"
        aria-label="Fechar aviso"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
