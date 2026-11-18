import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

export const EASE = [0.22, 1, 0.36, 1] as const;

const variants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

type Tag = 'div' | 'section' | 'li' | 'article' | 'header' | 'p' | 'h2' | 'span';

/** Revela o conteúdo suavemente quando entra na tela. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
  y = 28,
  amount = 0.25,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: Tag;
  y?: number;
  amount?: number;
}) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{ hidden: { opacity: 0, y }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </Comp>
  );
}

export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const staggerChild: Variants = {
  hidden: variants.hidden,
  visible: { ...variants.visible, transition: { duration: 0.85, ease: EASE } },
};

/** Texto com linhas que sobem por trás de uma máscara (efeito editorial). */
export function MaskText({ text, className, delay = 0, as = 'h1' }: { text: string; className?: string; delay?: number; as?: 'h1' | 'h2' | 'p' }) {
  const Comp = motion[as];
  const words = text.split(' ');
  return (
    <Comp className={className} initial="hidden" animate="visible" transition={{ staggerChildren: 0.06, delayChildren: delay }} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="-mt-[0.18em] inline-block overflow-hidden pb-[0.12em] pt-[0.18em] align-top" aria-hidden="true">
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: '110%' }, visible: { y: '0%', transition: { duration: 1.1, ease: EASE } } }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </Comp>
  );
}
