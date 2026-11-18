import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { useCart, cartCount } from '@/store/cart';
import { useCategories, useCollections } from '@/hooks/queries';
import { cn } from '@/lib/format';
import { MobileMenu } from './MobileMenu';
import { EASE } from '../motion/Reveal';
import { isTouchDevice } from '@/hooks/useLiteMotion';

export function Header() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const location = useLocation();

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    // No celular o cabeçalho fica sempre visível (esconder/mostrar ao rolar ficava instável no Safari).
    if (!isTouchDevice) setHidden(y > 320 && y > prev && !menuOpen && !megaOpen);
  });

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setMegaOpen(false);
  }, [location.pathname]);

  return (
    <>
      <motion.header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500',
          scrolled || megaOpen ? 'bg-ivory/[0.97] md:bg-ivory/90 shadow-[0_1px_0_var(--color-line)] md:backdrop-blur-xl' : 'bg-transparent',
        )}
        animate={{ y: hidden ? '-100%' : '0%' }}
        transition={{ duration: 0.5, ease: EASE }}
        onMouseLeave={() => setMegaOpen(false)}
      >
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:bg-ivory focus:px-4 focus:py-2">
          Pular para o conteúdo
        </a>
        <div className="container-lux flex h-[4.5rem] items-center justify-between gap-4 lg:h-20">
          <button
            className="-ml-2 p-2 text-emerald lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
          >
            <Menu className="size-5" strokeWidth={1.3} />
          </button>

          <Link to="/" className="lg:mr-10" aria-label="Dois Brilhos — página inicial">
            <Logo />
          </Link>

          <nav className="hidden flex-1 items-center gap-9 text-[0.72rem] font-medium uppercase tracking-[0.22em] text-ink/80 lg:flex" aria-label="Principal">
            <button
              className={cn('link-underline py-2 uppercase tracking-[0.22em]', megaOpen && 'text-emerald')}
              onMouseEnter={() => setMegaOpen(true)}
              onClick={() => setMegaOpen((v) => !v)}
              aria-expanded={megaOpen}
              aria-haspopup="true"
            >
              Loja
            </button>
            <NavItem to="/novidades">Novidades</NavItem>
            <NavItem to="/mais-vendidos">Mais vendidos</NavItem>
            <NavItem to="/sobre">Sobre</NavItem>
            <NavItem to="/cuidados">Cuidados</NavItem>
          </nav>

          <div className="flex items-center gap-1 text-emerald">
            <button className="p-2.5 transition-colors hover:text-gold" onClick={() => setSearchOpen(true)} aria-label="Buscar joias">
              <Search className="size-[1.15rem]" strokeWidth={1.3} />
            </button>
            <CartButton />
          </div>
        </div>

        <AnimatePresence>{megaOpen && <MegaMenu onClose={() => setMegaOpen(false)} />}</AnimatePresence>
      </motion.header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink to={to} className={({ isActive }) => cn('link-underline py-2', isActive && 'text-emerald')}>
      {children}
    </NavLink>
  );
}

function CartButton() {
  const items = useCart((s) => s.items);
  const lastAddedAt = useCart((s) => s.lastAddedAt);
  const open = useCart((s) => s.open);
  const count = cartCount(items);
  return (
    <button className="relative p-2.5 transition-colors hover:text-gold" onClick={open} aria-label={`Abrir sacola (${count} ${count === 1 ? 'item' : 'itens'})`}>
      <motion.span key={lastAddedAt} className="block" animate={lastAddedAt ? { rotate: [0, -12, 10, -6, 0] } : undefined} transition={{ duration: 0.6 }}>
        <ShoppingBag className="size-[1.15rem]" strokeWidth={1.3} />
      </motion.span>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="absolute right-0.5 top-0.5 grid size-[1.05rem] place-items-center rounded-full bg-gold text-[0.6rem] font-medium text-white"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function MegaMenu({ onClose }: { onClose: () => void }) {
  const { data: categories = [] } = useCategories();
  const { data: collections = [] } = useCollections();
  const featured = collections.filter((c) => c.is_featured).slice(0, 2);
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="absolute inset-x-0 top-full hidden border-t border-line bg-ivory/97 md:backdrop-blur-xl lg:block"
    >
      <div className="container-lux grid grid-cols-12 gap-10 py-10">
        <div className="col-span-3">
          <p className="eyebrow mb-5">Categorias</p>
          <ul className="space-y-3 font-display text-2xl text-emerald">
            <li>
              <Link to="/loja" onClick={onClose} className="link-underline">Ver tudo</Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/categoria/${c.slug}`} onClick={onClose} className="link-underline">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-3">
          <p className="eyebrow mb-5">Destaques</p>
          <ul className="space-y-3 text-sm tracking-wide text-ink/80">
            <li><Link to="/novidades" onClick={onClose} className="link-underline">Lançamentos</Link></li>
            <li><Link to="/mais-vendidos" onClick={onClose} className="link-underline">Mais vendidos</Link></li>
            {collections.map((c) => (
              <li key={c.id}><Link to={`/colecao/${c.slug}`} onClick={onClose} className="link-underline">Coleção {c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div className="col-span-6 grid grid-cols-2 gap-5">
          {featured.map((c) => (
            <Link key={c.id} to={`/colecao/${c.slug}`} onClick={onClose} className="group relative block aspect-[4/3] overflow-hidden bg-pearl">
              {c.image_url && (
                <img src={c.image_url} alt="" className="h-full w-full object-cover transition-transform duration-[1.4s] ease-[var(--ease-lux)] group-hover:scale-105" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/60 to-transparent" />
              <span className="absolute bottom-4 left-5 font-display text-2xl text-ivory">Coleção {c.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] bg-ivory/97 md:backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          role="dialog"
          aria-modal="true"
          aria-label="Buscar"
        >
          <div className="container-lux flex h-full flex-col pt-24">
            <button onClick={onClose} className="absolute right-5 top-5 p-2 text-emerald" aria-label="Fechar busca">
              <X className="size-6" strokeWidth={1.2} />
            </button>
            <motion.form
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
              onSubmit={(e) => {
                e.preventDefault();
                if (!q.trim()) return;
                navigate(`/loja?q=${encodeURIComponent(q.trim())}`);
                onClose();
              }}
              className="mx-auto w-full max-w-3xl"
            >
              <p className="eyebrow mb-4">O que você procura?</p>
              <div className="flex items-end gap-4 border-b border-emerald/30 focus-within:border-gold">
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Colar, brinco, prata 925…"
                  className="w-full bg-transparent pb-3 font-display text-3xl text-emerald placeholder:text-emerald/30 focus:outline-none sm:text-5xl"
                  aria-label="Termo de busca"
                />
                <button type="submit" className="pb-4 text-emerald" aria-label="Buscar">
                  <Search className="size-6" strokeWidth={1.2} />
                </button>
              </div>
            </motion.form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
