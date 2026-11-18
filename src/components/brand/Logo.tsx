import { motion } from 'framer-motion';
import { cn } from '@/lib/format';

export const SPARKLE_PATH =
  'M12 0C12.55 6.9 17.1 11.45 24 12C17.1 12.55 12.55 17.1 12 24C11.45 17.1 6.9 12.55 0 12C6.9 11.45 11.45 6.9 12 0Z';

export function Sparkle({ className, filled = false, strokeWidth = 1.1 }: { className?: string; filled?: boolean; strokeWidth?: number }) {
  return (
    <svg viewBox="-1 -1 26 26" className={className} aria-hidden="true">
      <path
        d={SPARKLE_PATH}
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Logotipo tipográfico inspirado na identidade do Instagram (Dois ✦ Brilhos). */
export function Logo({ className, tone = 'dark', compact = false }: { className?: string; tone?: 'dark' | 'light'; compact?: boolean }) {
  const color = tone === 'dark' ? 'text-emerald' : 'text-ivory';
  return (
    <span className={cn('inline-flex select-none items-center gap-2', color, className)} aria-label="Dois Brilhos Joias">
      <span className="font-display text-[1.65rem] leading-none tracking-[0.08em] sm:text-[1.9rem]" aria-hidden="true">
        {compact ? 'DB' : 'Dois Brilhos'}
      </span>
      <motion.span
        aria-hidden="true"
        className="text-gold"
        whileHover={{ rotate: 90, scale: 1.15 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <Sparkle className="size-4 sm:size-[1.1rem]" />
      </motion.span>
    </span>
  );
}
