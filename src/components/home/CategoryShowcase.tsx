import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Category } from '@/types';
import { SmartImage } from '../ui/SmartImage';
import { staggerChild, staggerParent, VIEWPORT_MARGIN } from '../motion/Reveal';
import { SectionHeading } from '../ui/SectionHeading';

export function CategoryShowcase({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;
  return (
    <section id="categorias" className="container-lux scroll-mt-24 py-20 md:py-28">
      <SectionHeading eyebrow="Categorias" title="Encontre o seu brilho" link="/loja" linkLabel="Toda a loja" />
      <motion.ul
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-5 md:gap-5 md:overflow-visible md:px-0"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05, margin: VIEWPORT_MARGIN }}
        variants={staggerParent}
      >
        {categories.map((c, i) => (
          <motion.li key={c.id} variants={staggerChild} className={`w-[62vw] shrink-0 snap-start sm:w-[38vw] md:w-auto ${i % 2 ? 'md:mt-12' : ''}`}>
            <Link to={`/categoria/${c.slug}`} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden">
                <SmartImage
                  src={c.image_url}
                  alt={c.name}
                  className="absolute inset-0"
                  imgClassName="transition-transform duration-[1.8s] ease-[var(--ease-lux)] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/70 via-emerald-deep/5 to-transparent transition-opacity duration-700 group-hover:opacity-90" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-display text-[1.9rem] leading-none text-ivory">{c.name}</h3>
                  <span className="mt-3 block h-px w-8 bg-gold-light transition-all duration-700 ease-[var(--ease-lux)] group-hover:w-20" />
                </div>
              </div>
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
