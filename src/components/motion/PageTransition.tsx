import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { EASE } from './Reveal';

/**
 * Transição entre páginas: saída curtíssima (só opacidade) e entrada suave.
 * A volta ao topo acontece no intervalo em que a tela está invisível
 * (ver onExitComplete em App.tsx), evitando o "pulo" de rolagem.
 */
export function PageTransition({ children }: { children: ReactNode }) {
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
