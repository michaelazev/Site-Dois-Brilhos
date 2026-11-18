import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Instagram, MessageCircle, X } from 'lucide-react';
import { Logo, Sparkle } from '../brand/Logo';
import { useCategories, useSettings } from '@/hooks/queries';
import { EASE } from '../motion/Reveal';

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: categories = [] } = useCategories();
  const { data: settings } = useSettings();
  const attendant = settings?.attendants.find((a) => a.active);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const links = [
    { to: '/loja', label: 'Toda a loja' },
    { to: '/novidades', label: 'Novidades' },
    { to: '/mais-vendidos', label: 'Mais vendidos' },
    ...categories.map((c) => ({ to: `/categoria/${c.slug}`, label: c.name })),
    { to: '/sobre', label: 'Sobre nós' },
    { to: '/cuidados', label: 'Cuidados' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex flex-col overflow-y-auto overscroll-contain bg-emerald-deep will-change-transform text-ivory lg:hidden"
          // Deslizar pela esquerda via transform: fluido mesmo em celulares simples
          // (o círculo com clip-path redesenhava a tela inteira a cada quadro).
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="container-lux flex h-[4.5rem] items-center justify-between">
            <button onClick={onClose} className="-ml-2 p-2" aria-label="Fechar menu">
              <X className="size-5" strokeWidth={1.3} />
            </button>
            <Link to="/" onClick={onClose}>
              <Logo tone="light" />
            </Link>
            <span className="w-9" />
          </div>

          <motion.nav
            className="container-lux flex flex-1 flex-col justify-center py-8"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.035, delayChildren: 0.15 } } }}
            aria-label="Menu principal"
          >
            {links.map((l) => (
              <motion.div
                key={l.to}
                className="overflow-hidden"
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
              >
                <Link to={l.to} onClick={onClose} className="group flex items-center gap-3 py-2 font-display text-[2.1rem] leading-tight">
                  <Sparkle className="size-3 text-gold-light opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  {l.label}
                </Link>
              </motion.div>
            ))}
          </motion.nav>

          <motion.div
            className="container-lux flex items-center gap-6 border-t border-ivory/10 py-6 text-[0.7rem] uppercase tracking-[0.25em] text-gold-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {settings?.social.instagram && (
              <a href={settings.social.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                <Instagram className="size-4" strokeWidth={1.3} /> Instagram
              </a>
            )}
            {attendant && (
              <a href={`https://wa.me/${attendant.phone}`} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                <MessageCircle className="size-4" strokeWidth={1.3} /> WhatsApp
              </a>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
