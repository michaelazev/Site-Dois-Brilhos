import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { SPARKLE_PATH } from '../brand/Logo';
import { EASE } from '../motion/Reveal';

const KEY = 'db-intro-seen';
const DURATION_MS = 1300;

// Tipado explicitamente: os tipos do framer-motion 11 rejeitam pathLength numérico inline.
const drawVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1 },
} as unknown as Variants;

/**
 * Decide uma única vez, ao abrir o site, se o loading aparece:
 * somente quando a pessoa chega pela página inicial e ainda não o viu nesta sessão.
 * Quem abre um link de produto (ex.: vindo do Instagram/WhatsApp) vai direto ao conteúdo.
 */
let introPending = (() => {
  try {
    return window.location.pathname === '/' && !sessionStorage.getItem(KEY);
  } catch {
    return false;
  }
})();

/** Atraso (s) para as animações de entrada da Home começarem junto com a saída do loading. */
export function introDelaySeconds(): number {
  return introPending ? DURATION_MS / 1000 - 0.15 : 0.1;
}

/** Loading inicial com a identidade Dois Brilhos. */
export function IntroLoader() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(introPending);

  useEffect(() => {
    if (!visible) return;
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => {
      introPending = false;
      setVisible(false);
    }, reduce ? 300 : DURATION_MS);
    return () => clearTimeout(t);
  }, [visible, reduce]);

  const letters = 'DOIS BRILHOS'.split('');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-emerald-deep text-ivory will-change-transform"
          // saída por transform (GPU) em vez de clip-path (redesenho a cada quadro)
          exit={{ y: '-100%' }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden="true"
        >
          <svg viewBox="-1 -1 26 26" className="size-12 text-gold-light">
            <motion.path
              d={SPARKLE_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth={0.6}
              strokeLinejoin="round"
              initial="hidden"
              animate="visible"
              variants={drawVariants}
              transition={{ duration: 0.9, ease: EASE }}
            />
          </svg>
          <div className="mt-6 flex overflow-hidden font-display text-3xl tracking-[0.35em] sm:text-4xl">
            {letters.map((l, i) => (
              <motion.span
                key={i}
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.03, ease: EASE }}
                className="inline-block"
              >
                {l === ' ' ? ' ' : l}
              </motion.span>
            ))}
          </div>
          <motion.div
            className="mt-5 h-px w-40 origin-center bg-gold/60"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
