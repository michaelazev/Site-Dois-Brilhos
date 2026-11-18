import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { EASE } from './Reveal';
import { isTouchDevice } from '@/hooks/useLiteMotion';

/**
 * Transição entre páginas.
 * - Computador: saída curtíssima (opacidade), entrada suave e linha dourada no topo.
 * - Celular: troca INSTANTÂNEA. Apagar e acender a página inteira parecia que o site
 *   estava recarregando (principalmente no Safari do iPhone, que já anima o gesto de voltar).
 * A volta ao topo acontece em App.tsx (onExitComplete).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  if (isTouchDevice) {
    return (
      <main id="conteudo" className="min-h-[70vh]">
        {children}
      </main>
    );
  }

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[90] h-px w-full origin-left bg-gold"
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{ scaleX: { duration: 0.5, ease: EASE }, opacity: { duration: 0.3, delay: 0.45 } }}
      />
      <motion.main
        id="conteudo"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } }}
        exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
        className="min-h-[70vh]"
      >
        {children}
      </motion.main>
    </>
  );
}
