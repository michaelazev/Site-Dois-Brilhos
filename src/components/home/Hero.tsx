import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import type { SiteSettings } from '@/types';
import { MaskText, EASE } from '../motion/Reveal';
import { Sparkle } from '../brand/Logo';

export function Hero({ hero }: { hero: SiteSettings['hero'] }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '14%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08]);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '30%']);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const introDelay = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('db-intro-seen') ? 0.2 : 2.1;

  return (
    <section ref={ref} className="relative overflow-hidden bg-gradient-to-b from-pearl via-ivory to-ivory pt-24 lg:pt-20">
      {/* brilho decorativo */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-10 size-[38rem] rounded-full bg-champagne/40 blur-[120px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: introDelay }}
      />

      <div className="container-lux relative grid min-h-[calc(100svh-6rem)] items-center gap-10 pb-16 lg:grid-cols-12 lg:gap-6 lg:pb-10">
        <motion.div style={{ y: textY, opacity: fade }} className="relative z-10 lg:col-span-6 lg:pr-8">
          <motion.p
            className="eyebrow mb-6 flex items-center gap-3"
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: introDelay, ease: EASE }}
          >
            <span className="h-px w-10 bg-gold" /> {hero.eyebrow}
          </motion.p>

          <MaskText
            text={hero.title}
            delay={introDelay + 0.1}
            className="text-[3.2rem] leading-[0.98] text-emerald sm:text-7xl lg:text-[5.6rem] xl:text-[6.4rem]"
          />

          <motion.p
            className="mt-7 max-w-md text-base leading-relaxed text-mute sm:text-lg"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: introDelay + 0.55, ease: EASE }}
          >
            {hero.subtitle}
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap items-center gap-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: introDelay + 0.7, ease: EASE }}
          >
            <Link to={hero.cta_link || '/loja'} className="btn btn-primary">
              {hero.cta_label}
            </Link>
            <Link to="/novidades" className="link-underline py-2 text-[0.7rem] font-medium uppercase tracking-[0.24em] text-emerald">
              Ver novidades
            </Link>
          </motion.div>
        </motion.div>

        <div className="relative lg:col-span-6">
          <motion.div
            className="relative mx-auto aspect-[4/5] w-full max-w-[34rem] overflow-hidden rounded-t-[999px] bg-pearl shadow-[0_40px_80px_-40px_rgba(14,59,46,0.45)]"
            initial={{ clipPath: 'inset(100% 0% 0% 0% round 999px 999px 0 0)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0% round 999px 999px 0 0)' }}
            transition={{ duration: 1.6, delay: introDelay - 0.1, ease: [0.76, 0, 0.24, 1] }}
          >
            <motion.img
              src={hero.image_url}
              alt={hero.image_alt}
              style={{ y: imgY, scale: imgScale }}
              className="absolute inset-0 h-[112%] w-full object-cover"
              // @ts-expect-error atributo válido de HTML
              fetchpriority="high"
              initial={{ scale: 1.25 }}
              animate={{ scale: 1 }}
              transition={{ duration: 2.2, delay: introDelay - 0.1, ease: EASE }}
            />
          </motion.div>

          {/* moldura dourada deslocada */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-5 aspect-[4/5] w-full max-w-[34rem] -translate-x-[calc(50%-1.25rem)] rounded-t-[999px] border border-gold/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: introDelay + 1 }}
          />

          <motion.div
            aria-hidden="true"
            className="absolute -left-2 bottom-16 text-gold sm:left-4 lg:-left-6"
            initial={{ opacity: 0, scale: 0.4, rotate: -60 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.4, delay: introDelay + 1.1, ease: EASE }}
          >
            <motion.div animate={reduce ? undefined : { rotate: [0, 90, 90, 180] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}>
              <Sparkle className="size-12 sm:size-16" strokeWidth={0.7} />
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute -right-1 top-1/3 hidden rotate-90 origin-right text-[0.6rem] uppercase tracking-[0.5em] text-mute xl:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: introDelay + 1.3 }}
          >
            Recife — PE
          </motion.div>
        </div>

        <motion.a
          href="#categorias"
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.6rem] uppercase tracking-[0.4em] text-mute lg:flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: introDelay + 1.4 }}
          aria-label="Rolar para as categorias"
        >
          Descubra
          <motion.span animate={reduce ? undefined : { y: [0, 6, 0] }} transition={{ duration: 2.2, repeat: Infinity }}>
            <ArrowDown className="size-3.5" strokeWidth={1.2} />
          </motion.span>
        </motion.a>
      </div>
    </section>
  );
}
