import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Product } from '@/types';
import { ProductCard, ProductCardSkeleton } from './ProductCard';
import { staggerParent, VIEWPORT_MARGIN } from '../motion/Reveal';
import { cn } from '@/lib/format';

/**
 * Carrossel baseado em scroll-snap nativo: suave no toque, leve no desempenho
 * e acessível por teclado. As setas rolam uma "página" por vez.
 */
export function ProductCarousel({ products, loading, label }: { products: Product[]; loading?: boolean; label: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  // Progresso como MotionValue: atualiza a barra direto na GPU, sem re-renderizar os cards.
  const progress = useMotionValue(0);
  const indicatorX = useTransform(progress, (p) => `${p * (78 / 22) * 100}%`);
  const frame = useRef(0);

  const measure = useCallback(() => {
    frame.current = 0;
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // setState com o mesmo valor não re-renderiza: só muda quando chega/sai das pontas
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
    progress.set(max > 0 ? el.scrollLeft / max : 1);
  }, [progress]);

  // no máximo uma medição por quadro durante a rolagem
  const update = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(measure);
  }, [measure]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, update, products.length]);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <div className="relative" role="region" aria-roledescription="carrossel" aria-label={label}>
      <motion.ul
        ref={ref}
        onScroll={update}
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 md:-mx-10 md:gap-6 md:scroll-px-10 md:px-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05, margin: VIEWPORT_MARGIN }}
        variants={staggerParent}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="w-[68vw] shrink-0 snap-start sm:w-[40vw] lg:w-[calc((100%-4.5rem)/4)]">
                <ProductCardSkeleton />
              </li>
            ))
          : products.map((p) => (
              <li key={p.id} className="w-[68vw] shrink-0 snap-start sm:w-[40vw] lg:w-[calc((100%-4.5rem)/4)]">
                <ProductCard product={p} />
              </li>
            ))}
      </motion.ul>

      <div className="mt-8 flex items-center gap-6">
        <div className="relative h-px flex-1 bg-line" aria-hidden="true">
          <motion.div className="absolute inset-y-0 left-0 w-[22%] bg-emerald" style={{ x: indicatorX }} />
        </div>
        <div className="flex gap-2">
          <ArrowButton onClick={() => scroll(-1)} disabled={!canPrev} label="Anterior">
            <ArrowLeft className="size-4" strokeWidth={1.2} />
          </ArrowButton>
          <ArrowButton onClick={() => scroll(1)} disabled={!canNext} label="Próximo">
            <ArrowRight className="size-4" strokeWidth={1.2} />
          </ArrowButton>
        </div>
      </div>
    </div>
  );
}

function ArrowButton({ children, onClick, disabled, label }: { children: React.ReactNode; onClick: () => void; disabled: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'grid size-11 place-items-center rounded-full border border-emerald/25 text-emerald transition-all duration-500',
        'hover:border-emerald hover:bg-emerald hover:text-ivory disabled:pointer-events-none disabled:opacity-30',
      )}
    >
      {children}
    </button>
  );
}
