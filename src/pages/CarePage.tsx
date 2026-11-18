import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';
import { Seo } from '@/components/Seo';
import { MaskText, Reveal, staggerChild, staggerParent, VIEWPORT_MARGIN } from '@/components/motion/Reveal';
import { SmartImage } from '@/components/ui/SmartImage';
import { Sparkle } from '@/components/brand/Logo';
import { useSettings } from '@/hooks/queries';
import { isTouchDevice } from '@/hooks/useLiteMotion';

/** Página "Cuidados com suas joias" — conteúdo editável em Painel → Conteúdo do site → Cuidados. */
export default function CarePage() {
  const { data: s } = useSettings();
  if (!s) return null;
  const care = s.care;
  const attendants = s.attendants.filter((a) => a.active);

  return (
    <PageTransition>
      <Seo title={care.title} description={care.intro} image={care.image_url} />

      <section className="bg-pearl pb-16 pt-32 md:pb-24 md:pt-40">
        <div className="container-lux grid items-center gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="eyebrow mb-5">{care.eyebrow}</p>
            <MaskText as="h1" text={care.title} className="text-5xl leading-none text-emerald md:text-7xl" />
            {care.intro && (
              <Reveal eager delay={0.2}>
                <p className="mt-8 max-w-lg text-lg leading-relaxed text-mute">{care.intro}</p>
              </Reveal>
            )}
          </div>
          {care.image_url && (
            <motion.div
              className="md:col-span-5 md:col-start-8"
              initial={isTouchDevice ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            >
              <SmartImage src={care.image_url} alt={care.title} className="aspect-[5/6] rounded-t-[999px]" priority />
            </motion.div>
          )}
        </div>
      </section>

      {care.materials.length > 0 && (
        <section className="container-lux py-20 md:py-28">
          <Reveal>
            <p className="eyebrow mb-4">Por material</p>
            <h2 className="text-4xl text-emerald md:text-5xl">Cada joia pede um cuidado</h2>
          </Reveal>
          <motion.ul
            className="mt-12 grid gap-6 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05, margin: VIEWPORT_MARGIN }}
            variants={staggerParent}
          >
            {care.materials.map((m) => (
              <motion.li key={m.title} variants={staggerChild} className="border border-line bg-white/60 p-7">
                <Sparkle className="mb-5 size-5 text-gold" />
                <h3 className="text-3xl text-emerald">{m.title}</h3>
                <p className="mt-3 leading-relaxed text-mute">{m.text}</p>
              </motion.li>
            ))}
          </motion.ul>
        </section>
      )}

      {care.tips.length > 0 && (
        <section className="grain relative overflow-hidden bg-emerald py-20 text-ivory md:py-28">
          <div className="container-lux grid gap-12 md:grid-cols-12">
            <Reveal className="md:col-span-4">
              <p className="eyebrow mb-4 !text-gold-light">Dicas</p>
              <h2 className="text-5xl leading-none">{care.tips_title}</h2>
            </Reveal>
            <motion.ol
              className="space-y-6 md:col-span-7 md:col-start-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.05, margin: VIEWPORT_MARGIN }}
              variants={staggerParent}
            >
              {care.tips.map((t, i) => (
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
          {care.note && <p className="mx-auto max-w-xl font-display text-3xl leading-snug text-emerald md:text-4xl">{care.note}</p>}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {attendants.map((a) => (
              <a key={a.id} href={`https://wa.me/${a.phone}`} target="_blank" rel="noreferrer" className="btn btn-outline">
                <MessageCircle className="size-4" strokeWidth={1.4} /> {a.name}
              </a>
            ))}
          </div>
        </Reveal>
      </section>
    </PageTransition>
  );
}
