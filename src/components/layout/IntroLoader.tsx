import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { SPARKLE_PATH } from '../brand/Logo';
import { EASE } from '../motion/Reveal';

const KEY = 'db-intro-seen';

// Tipado explicitamente: os tipos do framer-motion 11 rejeitam pathLength numérico inline.
const drawVariants = {
  hidden: { pathLength: 0, rotate: -45, opacity: 0 },
  visible: { pathLength: 1, rotate: 0, opacity: 1 },
} as unknown as Variants;

/** Loading inicial com a identidade Dois Brilhos. Exibido uma vez por sessão. */
export function IntroLoader() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem(KEY);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!visible) return;
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    document.documentElement.style.overflow = 'hidden';
    const t = setTimeout(() => setVisible(false), reduce ? 500 : 2100);
    return () => {
      clearTimeout(t);
      document.documentElement.style.overflow = '';
    };
  }, [visible, reduce]);

  useEffect(() => {
    if (!visible) document.documentElement.style.overflow = '';
  }, [visible]);

  const letters = 'DOIS BRILHOS'.split('');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="grain fixed inset-0 z-[300] flex flex-col items-center justify-center bg-emerald-deep text-ivory"
          initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden="true"
        >
          <svg viewBox="-1 -1 26 26" className="size-14 text-gold-light">
            <motion.path
              d={SPARKLE_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth={0.6}
              strokeLinejoin="round"
              initial="hidden"
              animate="visible"
              variants={drawVariants}
              transition={{ duration: 1.3, ease: EASE }}
              style={{ originX: '50%', originY: '50%' }}
            />
            <motion.path
              d={SPARKLE_PATH}
              fill="currentColor"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 0.18, scale: 1 }}
              transition={{ duration: 1, delay: 0.7, ease: EASE }}
              style={{ originX: '50%', originY: '50%' }}
            />
          </svg>
          <div className="mt-7 flex overflow-hidden font-display text-3xl tracking-[0.35em] sm:text-4xl">
            {letters.map((l, i) => (
              <motion.span
                key={i}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.35 + i * 0.045, ease: EASE }}
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
            transition={{ duration: 1.2, delay: 0.8, ease: EASE }}
          />
          <motion.p
            className="mt-4 text-[0.62rem] uppercase tracking-[0.5em] text-gold-light/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            Joias
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
