import { motion } from 'framer-motion';
import { Instagram } from 'lucide-react';
import type { SiteSettings } from '@/types';
import { Reveal, staggerChild, staggerParent } from '../motion/Reveal';
import { Sparkle } from '../brand/Logo';
import { SmartImage } from '../ui/SmartImage';

/**
 * Instagram integrado.
 * As publicações exibidas são cadastradas no painel (imagem + link do post).
 * A API oficial do Instagram exige conta profissional e token — ver README.
 */
export function InstagramSection({ instagram }: { instagram: SiteSettings['instagram'] }) {
  const posts = instagram.posts.filter((p) => p.image_url);
  return (
    <section className="container-lux py-20 md:py-28">
      <Reveal className="mb-12 flex flex-col items-center text-center">
        <p className="eyebrow mb-4">Instagram</p>
        <a href={instagram.profile_url} target="_blank" rel="noreferrer" className="group">
          <h2 className="text-4xl text-emerald sm:text-5xl lg:text-6xl">
            <span className="link-underline">@{instagram.handle}</span>
          </h2>
        </a>
        <p className="mt-4 max-w-md text-mute">Acompanhe lançamentos, bastidores e inspirações.</p>
      </Reveal>

      {posts.length > 0 ? (
        <motion.ul
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-4 lg:grid-cols-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerParent}
        >
          {posts.slice(0, 6).map((p, i) => (
            <motion.li key={i} variants={staggerChild}>
              <a href={p.link || instagram.profile_url} target="_blank" rel="noreferrer" className="group relative block aspect-square overflow-hidden" aria-label={p.caption || `Publicação ${i + 1} no Instagram`}>
                <SmartImage src={p.image_url} alt={p.caption ?? ''} className="absolute inset-0" imgClassName="transition-transform duration-[1.4s] ease-[var(--ease-lux)] group-hover:scale-110" />
                <span className="absolute inset-0 grid place-items-center bg-emerald-deep/0 text-ivory opacity-0 transition-all duration-500 group-hover:bg-emerald-deep/45 group-hover:opacity-100">
                  <Instagram className="size-6" strokeWidth={1.3} />
                </span>
              </a>
            </motion.li>
          ))}
        </motion.ul>
      ) : (
        <Reveal>
          <a
            href={instagram.profile_url}
            target="_blank"
            rel="noreferrer"
            className="group relative mx-auto flex max-w-4xl flex-col items-center overflow-hidden bg-emerald px-8 py-16 text-center text-ivory"
          >
            <Sparkle className="absolute -right-10 -top-10 size-56 text-gold/10 transition-transform duration-[2s] group-hover:rotate-90" strokeWidth={0.2} />
            <Instagram className="size-8 text-gold-light" strokeWidth={1} />
            <p className="mt-5 font-display text-3xl">Siga a Dois Brilhos no Instagram</p>
            <span className="btn btn-light mt-8">Abrir perfil</span>
          </a>
        </Reveal>
      )}
    </section>
  );
}
