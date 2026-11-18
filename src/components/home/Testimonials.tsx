import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star } from 'lucide-react';
import type { Testimonial } from '@/types';
import { Reveal } from '../motion/Reveal';
import { Sparkle } from '../brand/Logo';

/** Exibido somente quando houver depoimentos reais cadastrados no painel. */
export function Testimonials({ items }: { items: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [items.length, paused]);

  if (!items.length) return null;
  const current = items[index % items.length];

  return (
    <section className="container-lux py-20 md:py-28" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <Reveal className="mx-auto max-w-3xl text-center">
        <Sparkle className="mx-auto mb-6 size-6 text-gold" />
        <p className="eyebrow mb-10">Quem usa, conta</p>
        <div className="relative min-h-[14rem]" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.figure
              key={current.id}
              initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-6 flex justify-center gap-1 text-gold" aria-label={`${current.rating} de 5 estrelas`}>
                {Array.from({ length: current.rating }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-current" />
                ))}
              </div>
              <blockquote className="font-display text-2xl italic leading-snug text-emerald sm:text-[2.2rem]">“{current.text}”</blockquote>
              <figcaption className="mt-8 text-xs uppercase tracking-[0.28em] text-mute">
                {current.name}
                {current.city ? ` · ${current.city}` : ''}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        {items.length > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {items.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setIndex(i)}
                className="h-6 px-1"
                aria-label={`Depoimento ${i + 1}`}
                aria-current={i === index}
              >
                <span className={`block h-px transition-all duration-500 ${i === index ? 'w-10 bg-emerald' : 'w-5 bg-line'}`} />
              </button>
            ))}
          </div>
        )}
      </Reveal>
    </section>
  );
}
