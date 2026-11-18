import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import type { SiteSettings } from '@/types';
import { MaskText, EASE } from '../motion/Reveal';
import { Sparkle } from '../brand/Logo';
import { useLiteMotion } from '@/hooks/useLiteMotion';
import { introDelaySeconds } from '../layout/IntroLoader';

export function Hero({ hero }: { hero: SiteSettings['hero'] }) {
  const ref = useRef<HTMLElement>(null);
  const lite = useLiteMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  // Parallax apenas no desktop: no celular, efeitos presos à rolagem causam travadas.
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', lite ? '0%' : '14%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', lite ? '0%' : '30%']);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, lite ? 1 : 0]);

  const introDelay = introDelaySeconds();

  return (
    <section ref={ref} className="relative overflow-hidden bg-gradient-to-b from-pearl via-ivory to-ivory pt-24 lg:pt-20">
      {/* brilho decorativo: gradiente radial (sem filtro de desfoque, que é caro no celular) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-60 -top-20 size-[48rem] rounded-full bg-[radial-gradient(circle,rgba(232,214,181,0.55)_0%,rgba(232,214,181,0)_65%)]"
      />

      <div className="container-lux relative grid min-h-[calc(100svh-6rem)] items-center gap-10 pb-16 lg:grid-cols-12 lg:gap-6 lg:pb-10">
        <motion.div style={lite ? undefined : { y: textY, opacity: fade }} className="relative z-10 lg:col-span-6 lg:pr-8">
          <motion.p
            className="eyebrow mb-6 flex items-center gap-3"
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: introDelay, ease: EASE }}
          >
            <span className="h-px w-10 bg-gold" /> {hero.eyebrow}
          </motion.p>

          <MaskText
            text={hero.title}
            delay={introDelay + 0.05}
            className="text-[3.2rem] leading-[0.98] text-emerald sm:text-7xl lg:text-[5.6rem] xl:text-[6.4rem]"
          />

          <motion.p
            className="mt-7 max-w-md text-base leading-relaxed text-mute sm:text-lg"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: introDelay + 0.35, ease: EASE }}
          >
            {hero.subtitle}
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap items-center gap-5"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: introDelay + 0.45, ease: EASE }}
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
            // No celular: subida + opacidade (GPU). No desktop: revelação por máscara.
            initial={lite ? { opacity: 0, y: 30 } : { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 0 0)' }}
            animate={lite ? { opacity: 1, y: 0 } : { clipPath: 'inset(0% 0% 0% 0% round 999px 999px 0 0)' }}
            transition={{ duration: lite ? 0.9 : 1.6, delay: introDelay, ease: lite ? EASE : [0.76, 0, 0.24, 1] }}
          >
            <motion.img
              src={hero.image_url}
              alt={hero.image_alt}
              width={1200}
              height={1500}
              decoding="async"
              style={lite ? undefined : { y: imgY }}
              className="absolute inset-0 h-[112%] w-full object-cover"
              // @ts-expect-error atributo válido de HTML
              fetchpriority="high"
              initial={{ scale: lite ? 1.08 : 1.25 }}
              animate={{ scale: 1 }}
              transition={{ duration: lite ? 1.4 : 2.2, delay: introDelay, ease: EASE }}
            />
          </motion.div>

          {/* moldura dourada deslocada */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-5 aspect-[4/5] w-full max-w-[34rem] -translate-x-[calc(50%-1.25rem)] rounded-t-[999px] border border-gold/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: introDelay + 0.6 }}
          />

          <motion.div
            aria-hidden="true"
            className="absolute -left-2 bottom-16 text-gold sm:left-4 lg:-left-6"
            initial={{ opacity: 0, scale: 0.4, rotate: -60 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, delay: introDelay + 0.7, ease: EASE }}
          >
            {/* rotação contínua só no desktop: animações infinitas gastam bateria no celular */}
            <motion.div animate={lite ? undefined : { rotate: [0, 90, 90, 180] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}>
              <Sparkle className="size-12 sm:size-16" strokeWidth={0.7} />
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute -right-1 top-1/3 hidden rotate-90 origin-right text-[0.6rem] uppercase tracking-[0.5em] text-mute xl:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: introDelay + 1 }}
          >
            Recife — PE
          </motion.div>
        </div>

        <motion.a
          href="#inicio-categorias"
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.6rem] uppercase tracking-[0.4em] text-mute lg:flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: introDelay + 1.1 }}
          aria-label="Rolar para as categorias"
        >
          Descubra
          <motion.span animate={lite ? undefined : { y: [0, 6, 0] }} transition={{ duration: 2.2, repeat: Infinity }}>
            <ArrowDown className="size-3.5" strokeWidth={1.2} />
          </motion.span>
        </motion.a>
      </div>
    </section>
  );
}
