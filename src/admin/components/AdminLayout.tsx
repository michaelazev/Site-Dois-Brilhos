import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ExternalLink,
  FolderTree,
  Gem,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  MessageSquareQuote,
  Palette,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/brand/Logo';
import { isDemoMode } from '@/lib/supabase';
import { cn } from '@/lib/format';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { to: '/admin/produtos', label: 'Produtos', icon: Gem },
  { to: '/admin/categorias', label: 'Categorias', icon: FolderTree },
  { to: '/admin/colecoes', label: 'Coleções', icon: Layers },
  { to: '/admin/conteudo', label: 'Conteúdo do site', icon: Palette },
  { to: '/admin/depoimentos', label: 'Depoimentos', icon: MessageSquareQuote },
  { to: '/admin/usuarios', label: 'Administradores', icon: Users },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen bg-[#f7f3ed] text-ink [font-variant-numeric:lining-nums]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-white lg:flex">
        <Sidebar />
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <button className="absolute right-3 top-4 p-2 text-mute" onClick={() => setOpen(false)} aria-label="Fechar menu">
                <X className="size-5" />
              </button>
              <Sidebar />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="-ml-1 p-2" aria-label="Abrir menu">
            <Menu className="size-5" />
          </button>
          <Logo className="scale-75" />
          <span className="w-9" />
        </header>
        {isDemoMode && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900 md:px-8">
            <strong>Modo demonstração:</strong> as alterações ficam salvas apenas neste navegador. Conecte o Supabase para usar com dados reais.
          </div>
        )}
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-6xl px-4 py-8 md:px-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

function Sidebar() {
  const { session, signOut } = useAuth();
  return (
    <>
      <div className="flex h-20 items-center px-6">
        <Link to="/admin" aria-label="Início do painel">
          <Logo className="scale-90 origin-left" />
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Painel">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive ? 'bg-emerald text-white' : 'text-ink/75 hover:bg-pearl hover:text-ink',
              )
            }
          >
            <Icon className="size-4" strokeWidth={1.6} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line p-4">
        <a href="/" target="_blank" rel="noreferrer" className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink/75 hover:bg-pearl">
          <ExternalLink className="size-4" strokeWidth={1.6} /> Ver loja
        </a>
        <p className="truncate px-3 text-xs text-mute" title={session?.email}>{session?.email}</p>
        <button onClick={signOut} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-700 hover:bg-rose-50">
          <LogOut className="size-4" strokeWidth={1.6} /> Sair
        </button>
      </div>
    </>
  );
}
