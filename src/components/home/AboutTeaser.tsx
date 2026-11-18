import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { SiteSettings } from '@/types';
import { Reveal } from '../motion/Reveal';
import { Sparkle } from '../brand/Logo';
import { SmartImage } from '../ui/SmartImage';

export function AboutTeaser({ about }: { about: SiteSettings['about'] }) {
  const firstParagraph = about.text.split(/\n\s*\n/)[0];
  return (
    <section className="grain relative overflow-hidden bg-emerald text-ivory">
      <Sparkle className="pointer-events-none absolute -left-32 bottom-0 size-[30rem] text-gold/[0.07]" strokeWidth={0.12} />
      <div className="container-lux relative grid items-center gap-12 py-20 md:grid-cols-12 md:py-28">
        <motion.div
          className="md:col-span-5"
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative">
            <SmartImage src={about.image_url} alt="Dois Brilhos" className="aspect-[5/6] rounded-b-[999px]" />
            <div className="pointer-events-none absolute -bottom-4 -right-4 h-full w-full rounded-b-[999px] border border-gold-light/40" aria-hidden="true" />
          </div>
        </motion.div>
        <div className="md:col-span-6 md:col-start-7">
          <Reveal>
            <p className="eyebrow mb-5 !text-gold-light">{about.eyebrow}</p>
            <h2 className="text-5xl leading-[1.02] md:text-6xl">{about.title}</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-ivory/75">{firstParagraph}</p>
          </Reveal>
          <Reveal delay={0.2}>
            <ul className="mt-10 grid gap-6 sm:grid-cols-3">
              {about.highlights.map((h) => (
                <li key={h.title} className="border-t border-gold-light/30 pt-4">
                  <p className="font-display text-xl text-gold-light">{h.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ivory/60">{h.text}</p>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.3}>
            <Link to="/sobre" className="btn btn-light mt-12">Conheça a Dois Brilhos</Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
