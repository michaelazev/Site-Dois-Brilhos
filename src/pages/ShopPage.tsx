import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';
import { Seo } from '@/components/Seo';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';
import { MaskText, Reveal, staggerParent } from '@/components/motion/Reveal';
import { useCategories, useCollections, useProducts } from '@/hooks/queries';
import { cn, effectivePrice } from '@/lib/format';
import type { ProductFilter } from '@/types';
import NotFoundPage from './NotFoundPage';
import { isTouchDevice } from '@/hooks/useLiteMotion';

type Mode = 'all' | 'category' | 'collection' | 'new' | 'bestsellers';

const SORTS = [
  { value: 'destaque', label: 'Destaques' },
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'menor', label: 'Menor preço' },
  { value: 'maior', label: 'Maior preço' },
] as const;

export default function ShopPage({ mode }: { mode: Mode }) {
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const material = params.get('material') ?? '';
  const sort = (params.get('ordem') ?? 'destaque') as (typeof SORTS)[number]['value'];

  const { data: categories = [], isLoading: loadingCats } = useCategories();
  const { data: collections = [], isLoading: loadingCols } = useCollections();

  const filter: ProductFilter = useMemo(() => {
    const f: ProductFilter = {};
    if (mode === 'category') f.categorySlug = slug;
    if (mode === 'collection') f.collectionSlug = slug;
    if (mode === 'new') f.flag = 'is_new';
    if (mode === 'bestsellers') f.flag = 'is_bestseller';
    if (q) f.search = q;
    return f;
  }, [mode, slug, q]);

  const { data: raw = [], isLoading } = useProducts(filter);

  const materials = useMemo(() => Array.from(new Set(raw.map((p) => p.material).filter(Boolean))) as string[], [raw]);

  const products = useMemo(() => {
    let list = material ? raw.filter((p) => p.material === material) : raw;
    list = [...list];
    if (sort === 'menor') list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    if (sort === 'maior') list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    if (sort === 'recentes') list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return list;
  }, [raw, material, sort]);

  const category = mode === 'category' ? categories.find((c) => c.slug === slug) : undefined;
  const collection = mode === 'collection' ? collections.find((c) => c.slug === slug) : undefined;

  if (mode === 'category' && !loadingCats && !category) return <NotFoundPage />;
  if (mode === 'collection' && !loadingCols && !collection) return <NotFoundPage />;

  const heading = {
    all: { eyebrow: 'Loja', title: q ? `Resultados para “${q}”` : 'Todas as joias', description: 'Prata 925, Aço Inoxidável e Folheados Premium.' },
    category: { eyebrow: 'Categoria', title: category?.name ?? '', description: category?.description ?? '' },
    collection: { eyebrow: 'Coleção', title: collection?.name ?? '', description: collection?.description ?? '' },
    new: { eyebrow: 'Lançamentos', title: 'Novidades', description: 'As peças que acabaram de chegar.' },
    bestsellers: { eyebrow: 'Favoritas', title: 'Mais vendidos', description: 'As joias mais escolhidas pelas nossas clientes.' },
  }[mode];

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const chips = [
    { to: '/loja', label: 'Tudo', active: mode === 'all' },
    { to: '/novidades', label: 'Novidades', active: mode === 'new' },
    { to: '/mais-vendidos', label: 'Mais vendidos', active: mode === 'bestsellers' },
    ...categories.map((c) => ({ to: `/categoria/${c.slug}`, label: c.name, active: mode === 'category' && c.slug === slug })),
  ];

  return (
    <PageTransition>
      <Seo title={heading.title || 'Loja'} description={heading.description || undefined} image={category?.image_url ?? collection?.image_url} />

      <section className="relative overflow-hidden bg-pearl pb-12 pt-32 md:pb-16 md:pt-40">
        <div className="container-lux">
          <Reveal eager>
            <nav aria-label="Trilha" className="mb-6 text-[0.65rem] uppercase tracking-[0.24em] text-mute">
              <Link to="/" className="hover:text-emerald">Início</Link> <span className="mx-2">/</span>
              <span className="text-emerald">{heading.eyebrow}</span>
            </nav>
          </Reveal>
          {heading.title && <MaskText key={heading.title} as="h1" text={heading.title} className="text-5xl leading-none text-emerald md:text-7xl" />}
          {heading.description && (
            <Reveal eager delay={0.2}>
              <p className="mt-5 max-w-xl text-mute">{heading.description}</p>
            </Reveal>
          )}
        </div>
      </section>

      <div className={`sticky z-30 border-b border-line bg-ivory/[0.97] md:bg-ivory/90 md:backdrop-blur-xl ${isTouchDevice ? 'top-[4.5rem] lg:top-20' : 'top-0'}`}>
        <div className="container-lux flex items-center gap-4 py-3">
          <div className="no-scrollbar -mx-1 flex flex-1 gap-2 overflow-x-auto px-1">
            {chips.map((c) => (
              <Link
                key={c.to}
                to={c.to}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] transition-colors duration-300',
                  c.active ? 'border-emerald bg-emerald text-ivory' : 'border-line text-ink/70 hover:border-emerald hover:text-emerald',
                )}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <section className="container-lux py-10 md:py-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-mute" aria-live="polite">
            {isLoading ? 'Carregando…' : `${products.length} ${products.length === 1 ? 'peça' : 'peças'}`}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <SlidersHorizontal className="size-4 text-mute" strokeWidth={1.3} aria-hidden="true" />
            {materials.length > 1 && (
              <select
                value={material}
                onChange={(e) => setParam('material', e.target.value)}
                className="border-b border-line bg-transparent py-1.5 pr-6 text-sm focus:border-gold focus:outline-none"
                aria-label="Filtrar por material"
              >
                <option value="">Todos os materiais</option>
                {materials.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
            <select
              value={sort}
              onChange={(e) => setParam('ordem', e.target.value === 'destaque' ? '' : e.target.value)}
              className="border-b border-line bg-transparent py-1.5 pr-6 text-sm focus:border-gold focus:outline-none"
              aria-label="Ordenar"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <AnimatePresence>
          {(q || material) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 flex flex-wrap gap-2">
              {q && <FilterTag label={`Busca: ${q}`} onClear={() => setParam('q', '')} />}
              {material && <FilterTag label={material} onClear={() => setParam('material', '')} />}
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-display text-3xl text-emerald">Nenhuma peça encontrada</p>
            <p className="mt-3 text-mute">Tente outra busca ou explore todas as joias.</p>
            <Link to="/loja" className="btn btn-outline mt-8">Ver toda a loja</Link>
          </div>
        ) : (
          <motion.div
            key={`${mode}-${slug}-${q}-${material}-${sort}`}
            className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4"
            initial="hidden"
            animate="visible"
            variants={staggerParent}
          >
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </motion.div>
        )}
      </section>
    </PageTransition>
  );
}

function FilterTag({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button onClick={onClear} className="flex items-center gap-2 rounded-full bg-pearl px-3 py-1.5 text-xs text-emerald hover:bg-sand" aria-label={`Remover filtro ${label}`}>
      {label} <X className="size-3" />
    </button>
  );
}
