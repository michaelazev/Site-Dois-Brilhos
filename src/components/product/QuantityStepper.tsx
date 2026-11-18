import { Minus, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/format';

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  size = 'md',
  label = 'Quantidade',
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (v: number) => void;
  size?: 'sm' | 'md';
  label?: string;
}) {
  const btn = cn('grid place-items-center text-emerald transition-colors hover:text-gold disabled:opacity-30', size === 'sm' ? 'size-8' : 'size-11');
  return (
    <div className="inline-flex items-center border border-line" role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Diminuir quantidade">
        <Minus className="size-3.5" strokeWidth={1.4} />
      </button>
      <span className={cn('relative grid place-items-center overflow-hidden text-sm tabular-nums', size === 'sm' ? 'h-8 w-7' : 'h-11 w-10')} aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={value} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.25 }}>
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Aumentar quantidade">
        <Plus className="size-3.5" strokeWidth={1.4} />
      </button>
    </div>
  );
}
