import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import type { Collection } from '@/types';
import { Reveal } from '../motion/Reveal';
import { SectionHeading } from '../ui/SectionHeading';
import { cn } from '@/lib/format';

export function CollectionsEditorial({ collections, title }: { collections: Collection[]; title: string }) {
  if (!collections.length) return null;
  return (
    <section className="bg-pearl/70 py-20 md:py-28">
      <div className="container-lux">
        <SectionHeading eyebrow="Coleções" title={title} align="center" />
        <div className="space-y-20 md:space-y-28">
          {collections.map((c, i) => (
            <CollectionRow key={c.id} collection={c} reverse={i % 2 === 1} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CollectionRow({ collection, reverse, index }: { collection: Collection; reverse: boolean; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-8%', '8%']);

  return (
    <div ref={ref} className={cn('grid items-center gap-8 md:grid-cols-12 md:gap-12', reverse && 'md:[&>*:first-child]:order-2')}>
      <Link to={`/colecao/${collection.slug}`} className="group relative block overflow-hidden md:col-span-7">
        <motion.div
          className="relative aspect-[3/2] overflow-hidden"
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.4, ease: [0.76, 0, 0.24, 1] }}
        >
          {collection.image_url && (
            <motion.img
              src={collection.image_url}
              alt={`Coleção ${collection.name}`}
              loading="lazy"
              style={{ y }}
              className="absolute inset-0 h-[118%] w-full -translate-y-[8%] object-cover transition-transform duration-[1.8s] ease-[var(--ease-lux)] group-hover:scale-105"
            />
          )}
        </motion.div>
      </Link>
      <Reveal className="md:col-span-5" delay={0.15}>
        <p className="eyebrow mb-4">Coleção {String(index + 1).padStart(2, '0')}</p>
        <h3 className="text-5xl leading-none text-emerald md:text-6xl">{collection.name}</h3>
        {collection.description && <p className="mt-6 max-w-sm leading-relaxed text-mute">{collection.description}</p>}
        <Link to={`/colecao/${collection.slug}`} className="btn btn-outline mt-9">
          Explorar coleção
        </Link>
      </Reveal>
    </div>
  );
}
