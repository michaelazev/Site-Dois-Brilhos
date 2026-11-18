import { motion } from 'framer-motion';
import { PageTransition } from '@/components/motion/PageTransition';
import { Seo } from '@/components/Seo';
import { MaskText, Reveal, staggerChild, staggerParent } from '@/components/motion/Reveal';
import { SmartImage } from '@/components/ui/SmartImage';
import { Sparkle } from '@/components/brand/Logo';
import { useSettings } from '@/hooks/queries';
import { formatPhoneDisplay } from '@/lib/whatsapp';

export default function AboutPage() {
  const { data: s } = useSettings();
  if (!s) return null;
  const paragraphs = s.about.text.split(/\n\s*\n/).filter(Boolean);

  return (
    <PageTransition>
      <Seo title="Sobre nós" description={paragraphs[0]} image={s.about.image_url} />
      <section className="bg-pearl pb-16 pt-32 md:pb-24 md:pt-40">
        <div className="container-lux grid items-center gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="eyebrow mb-5">{s.about.eyebrow}</p>
            <MaskText as="h1" text={s.about.title} className="text-5xl leading-none text-emerald md:text-7xl" />
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-mute">
              {paragraphs.map((p, i) => (
                <Reveal key={i} delay={0.2 + i * 0.1}>
                  <p>{p}</p>
                </Reveal>
              ))}
            </div>
          </div>
          <motion.div
            className="md:col-span-5 md:col-start-8"
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            animate={{ clipPath: 'inset(0% 0 0 0)' }}
            transition={{ duration: 1.4, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
          >
            <SmartImage src={s.about.image_url} alt="Dois Brilhos" className="aspect-[5/6] rounded-t-[999px]" priority />
          </motion.div>
        </div>
      </section>

      <section className="container-lux py-20 md:py-28">
        <motion.ul className="grid gap-10 md:grid-cols-3" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={staggerParent}>
          {s.about.highlights.map((h) => (
            <motion.li key={h.title} variants={staggerChild} className="border-t border-gold/40 pt-6">
              <Sparkle className="mb-4 size-5 text-gold" />
              <h2 className="text-3xl text-emerald">{h.title}</h2>
              <p className="mt-3 leading-relaxed text-mute">{h.text}</p>
            </motion.li>
          ))}
        </motion.ul>
      </section>

      {s.about.care_tips.length > 0 && (
        <section id="cuidados" className="grain relative overflow-hidden bg-emerald py-20 text-ivory md:py-28">
          <div className="container-lux grid gap-12 md:grid-cols-12">
            <Reveal className="md:col-span-4">
              <p className="eyebrow mb-4 !text-gold-light">Cuidados</p>
              <h2 className="text-5xl leading-none">{s.about.care_title}</h2>
            </Reveal>
            <motion.ol className="space-y-6 md:col-span-7 md:col-start-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={staggerParent}>
              {s.about.care_tips.map((t, i) => (
                <motion.li key={t} variants={staggerChild} className="flex gap-6 border-b border-ivory/10 pb-6">
                  <span className="font-display text-3xl text-gold-light">{String(i + 1).padStart(2, '0')}</span>
                  <p className="pt-2 text-lg leading-relaxed text-ivory/80">{t}</p>
                </motion.li>
              ))}
            </motion.ol>
          </div>
        </section>
      )}

      <section className="container-lux py-20 text-center md:py-28">
        <Reveal>
          <p className="eyebrow mb-4">Atendimento</p>
          <h2 className="text-5xl text-emerald">Fale com a gente</h2>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {s.attendants.filter((a) => a.active).map((a) => (
              <a key={a.id} href={`https://wa.me/${a.phone}`} target="_blank" rel="noreferrer" className="btn btn-outline">
                {a.name} · {formatPhoneDisplay(a.phone)}
              </a>
            ))}
          </div>
        </Reveal>
      </section>
    </PageTransition>
  );
}
