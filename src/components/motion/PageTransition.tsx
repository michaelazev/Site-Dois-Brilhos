import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { EASE } from './Reveal';

/** Transição elegante entre páginas: leve fade + deslocamento e uma linha dourada. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[90] h-px w-full origin-left bg-gold"
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{ scaleX: { duration: 0.7, ease: EASE }, opacity: { duration: 0.4, delay: 0.6 } }}
      />
      <motion.main
        id="conteudo"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="min-h-[70vh]"
      >
        {children}
      </motion.main>
    </>
  );
}
