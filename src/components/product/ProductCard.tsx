import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { Product } from '@/types';
import { useCart } from '@/store/cart';
import { useToast } from '../ui/Toast';
import { Price } from './Price';
import { SmartImage } from '../ui/SmartImage';
import { cn } from '@/lib/format';
import { staggerChild } from '../motion/Reveal';

export function ProductCard({ product, className, priority = false }: { product: Product; className?: string; priority?: boolean }) {
  const add = useCart((s) => s.add);
  const toast = useToast();
  const [first, second] = product.images;
  const hasVariants = product.variants.length > 0;
  const soldOut = hasVariants ? product.variants.every((v) => v.stock <= 0) : product.stock <= 0;
  const onSale = product.promo_price != null && product.promo_price < product.price;

  return (
    <motion.article variants={staggerChild} className={cn('group relative', className)}>
      <Link to={`/produto/${product.slug}`} className="block" aria-label={product.name}>
        <div className="relative aspect-[4/5] overflow-hidden bg-pearl">
          <SmartImage
            src={first?.url}
            alt={first?.alt ?? product.name}
            priority={priority}
            className="absolute inset-0"
            imgClassName="transition-transform duration-[1.6s] ease-[var(--ease-lux)] group-hover:scale-[1.06]"
          />
          {second && (
            <SmartImage
              src={second.url}
              alt=""
              className="absolute inset-0 opacity-0 transition-opacity duration-700 ease-[var(--ease-lux)] group-hover:opacity-100 max-md:hidden"
              imgClassName="scale-[1.04] transition-transform duration-[1.6s] ease-[var(--ease-lux)] group-hover:scale-100"
            />
          )}

          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {soldOut && <Badge tone="dark">Esgotado</Badge>}
            {!soldOut && product.is_new && <Badge>Novo</Badge>}
            {!soldOut && onSale && <Badge tone="gold">Oferta</Badge>}
          </div>
          {product.is_demo && (
            <span className="absolute right-3 top-3 rounded-full bg-white/80 px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.2em] text-mute backdrop-blur">
              Exemplo
            </span>
          )}
        </div>
      </Link>

      <div className="relative">
        {!soldOut && (
          <QuickAdd product={product} hasVariants={hasVariants} onAdd={() => {
            const res = add(product);
            if (!res.ok) toast(res.message!, 'error');
          }} />
        )}
        <div className="pt-4">
          {product.category && <p className="mb-1 text-[0.62rem] uppercase tracking-[0.24em] text-mute">{product.material ?? product.category.name}</p>}
          <h3 className="font-display text-[1.2rem] leading-snug text-ink">
            <Link to={`/produto/${product.slug}`} className="link-underline">
              {product.name}
            </Link>
          </h3>
          <Price price={product.price} promo={product.promo_price} className="mt-1.5" />
        </div>
      </div>
    </motion.article>
  );
}

/** Botão rápido "adicionar" que aparece sobre a foto no hover (desktop) e fixo no mobile. */
function QuickAdd({ product, hasVariants, onAdd }: { product: Product; hasVariants: boolean; onAdd: () => void }) {
  if (hasVariants) {
    return (
      <Link
        to={`/produto/${product.slug}`}
        className="absolute -top-14 left-3 right-3 hidden translate-y-2 items-center justify-center bg-ivory/95 py-3 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-emerald opacity-0 backdrop-blur transition-all duration-500 ease-[var(--ease-lux)] hover:bg-emerald hover:text-ivory group-hover:translate-y-0 group-hover:opacity-100 md:flex"
      >
        Escolher opção
      </Link>
    );
  }
  return (
    <>
      <button
        onClick={onAdd}
        className="absolute -top-14 left-3 right-3 hidden translate-y-2 items-center justify-center gap-2 bg-ivory/95 py-3 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-emerald opacity-0 backdrop-blur transition-all duration-500 ease-[var(--ease-lux)] hover:bg-emerald hover:text-ivory focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 md:flex"
        aria-label={`Adicionar ${product.name} à sacola`}
      >
        <Plus className="size-3.5" /> Adicionar à sacola
      </button>
      <button
        onClick={onAdd}
        className="absolute -top-12 right-2.5 grid size-9 place-items-center rounded-full bg-ivory/95 text-emerald shadow-sm backdrop-blur active:scale-90 md:hidden"
        aria-label={`Adicionar ${product.name} à sacola`}
      >
        <Plus className="size-4" strokeWidth={1.5} />
      </button>
    </>
  );
}

function Badge({ children, tone = 'light' }: { children: React.ReactNode; tone?: 'light' | 'gold' | 'dark' }) {
  return (
    <span
      className={cn(
        'px-2.5 py-1 text-[0.58rem] font-medium uppercase tracking-[0.22em]',
        tone === 'light' && 'bg-ivory/90 text-emerald',
        tone === 'gold' && 'bg-gold text-white',
        tone === 'dark' && 'bg-ink/80 text-ivory',
      )}
    >
      {children}
    </span>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[4/5]" />
      <div className="skeleton mt-4 h-3 w-1/3" />
      <div className="skeleton mt-2 h-4 w-2/3" />
      <div className="skeleton mt-2 h-3 w-1/4" />
    </div>
  );
}
