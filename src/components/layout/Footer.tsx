import { Link } from 'react-router-dom';
import { Instagram, Link2, MapPin, Mail, Clock, MessageCircle } from 'lucide-react';
import { useCategories, useSettings } from '@/hooks/queries';
import { formatPhoneDisplay } from '@/lib/whatsapp';
import { Logo, Sparkle } from '../brand/Logo';
import { Reveal } from '../motion/Reveal';

export function Footer() {
  const { data: s } = useSettings();
  const { data: categories = [] } = useCategories();
  if (!s) return null;
  const year = new Date().getFullYear();

  return (
    <footer className="grain relative mt-24 overflow-hidden bg-emerald-deep text-ivory/80">
      <Sparkle className="pointer-events-none absolute -right-24 -top-24 size-[26rem] text-gold/[0.06]" strokeWidth={0.15} />
      <div className="container-lux relative grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <Reveal className="md:col-span-4">
          <Logo tone="light" />
          <p className="mt-5 max-w-xs font-display text-xl italic text-ivory/90">{s.footer.tagline}</p>
          <p className="mt-6 text-[0.68rem] uppercase tracking-[0.28em] text-gold-light">Prata 925 · Aço · Folheados Premium</p>
        </Reveal>

        <Reveal className="md:col-span-2" delay={0.05}>
          <h2 className="eyebrow mb-5 !text-gold-light">Loja</h2>
          <ul className="space-y-2.5 text-sm">
            <li><Link className="link-underline" to="/loja">Toda a loja</Link></li>
            <li><Link className="link-underline" to="/novidades">Novidades</Link></li>
            <li><Link className="link-underline" to="/mais-vendidos">Mais vendidos</Link></li>
            {categories.map((c) => (
              <li key={c.id}><Link className="link-underline" to={`/categoria/${c.slug}`}>{c.name}</Link></li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="md:col-span-3" delay={0.1}>
          <h2 className="eyebrow mb-5 !text-gold-light">Atendimento</h2>
          <ul className="space-y-3 text-sm">
            {s.attendants.filter((a) => a.active).map((a) => (
              <li key={a.id}>
                <a href={`https://wa.me/${a.phone}`} target="_blank" rel="noreferrer" className="group flex items-center gap-3">
                  <MessageCircle className="size-4 text-gold-light" strokeWidth={1.3} />
                  <span>
                    <span className="link-underline">{a.name}</span>
                    <span className="block text-xs text-ivory/50">{formatPhoneDisplay(a.phone)}</span>
                  </span>
                </a>
              </li>
            ))}
            {s.contact.email && (
              <li className="flex items-center gap-3"><Mail className="size-4 text-gold-light" strokeWidth={1.3} /><a className="link-underline" href={`mailto:${s.contact.email}`}>{s.contact.email}</a></li>
            )}
            {s.contact.hours && <li className="flex items-center gap-3"><Clock className="size-4 text-gold-light" strokeWidth={1.3} />{s.contact.hours}</li>}
            {(s.contact.address || s.contact.city) && (
              <li className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-gold-light" strokeWidth={1.3} />{[s.contact.address, s.contact.city].filter(Boolean).join(' — ')}</li>
            )}
          </ul>
        </Reveal>

        <Reveal className="md:col-span-3" delay={0.15}>
          <h2 className="eyebrow mb-5 !text-gold-light">Siga</h2>
          <ul className="space-y-2.5 text-sm">
            {s.social.instagram && (
              <li><a href={s.social.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-3"><Instagram className="size-4 text-gold-light" strokeWidth={1.3} /><span className="link-underline">@{s.instagram.handle}</span></a></li>
            )}
            {s.social.linktree && (
              <li><a href={s.social.linktree} target="_blank" rel="noreferrer" className="flex items-center gap-3"><Link2 className="size-4 text-gold-light" strokeWidth={1.3} /><span className="link-underline">Linktree</span></a></li>
            )}
            {s.social.tiktok && <li><a href={s.social.tiktok} target="_blank" rel="noreferrer" className="link-underline">TikTok</a></li>}
            {s.social.facebook && <li><a href={s.social.facebook} target="_blank" rel="noreferrer" className="link-underline">Facebook</a></li>}
          </ul>
          <p className="mt-8 text-xs leading-relaxed text-ivory/50">{s.footer.note}</p>
        </Reveal>
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-lux flex flex-col items-center justify-between gap-3 py-6 text-[0.68rem] tracking-wide text-ivory/45 sm:flex-row">
          <p>© {year} Dois Brilhos Joias. Todos os direitos reservados.</p>
          <Link to="/cuidados" className="link-underline">Cuidados com suas joias</Link>
        </div>
      </div>
    </footer>
  );
}
