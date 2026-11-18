import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, MessageCircle, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';
import { Seo } from '@/components/Seo';
import { ProductGallery } from '@/components/product/ProductGallery';
import { Price } from '@/components/product/Price';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { ProductCarousel } from '@/components/product/ProductCarousel';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useToast } from '@/components/ui/Toast';
import { EASE } from '@/components/motion/Reveal';
import { useProduct, useProducts, useSettings } from '@/hooks/queries';
import { useCart, MAX_PER_ITEM } from '@/store/cart';
import { api } from '@/services/api';
import { cn, effectivePrice, formatPrice } from '@/lib/format';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { siteUrl } from '@/lib/supabase';
import type { ProductVariant } from '@/types';
import NotFoundPage from './NotFoundPage';

export default function ProductPage() {
  const { slug = '' } = useParams();
  const { data: product, isLoading } = useProduct(slug);
  const { data: settings } = useSettings();
  const related = useProducts(product?.category ? { categorySlug: product.category.slug } : {}, !!product);
  const add = useCart((s) => s.add);
  const toast = useToast();

  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(1);
  const [variantError, setVariantError] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
  const viewed = useRef<string | null>(null);

  useEffect(() => {
    setVariant(null);
    setQty(1);
    setVariantError(false);
    if (product && viewed.current !== product.id) {
      viewed.current = product.id;
      api.registerView(product.id).catch(() => {});
    }
  }, [product]);

  const groups = useMemo(() => {
    const map = new Map<string, ProductVariant[]>();
    product?.variants.forEach((v) => map.set(v.label, [...(map.get(v.label) ?? []), v]));
    return Array.from(map.entries());
  }, [product]);

  if (isLoading) return <ProductSkeleton />;
  if (!product) return <NotFoundPage />;

  const hasVariants = product.variants.length > 0;
  const stock = hasVariants ? (variant ? variant.stock : product.variants.reduce((a, v) => a + v.stock, 0)) : product.stock;
  const soldOut = stock <= 0;
  const maxQty = Math.max(1, Math.min(variant ? variant.stock : hasVariants ? MAX_PER_ITEM : product.stock, MAX_PER_ITEM));
  const relatedList = (related.data ?? []).filter((p) => p.id !== product.id).slice(0, 8);
  const url = `${siteUrl}/produto/${product.slug}`;

  const handleAdd = () => {
    if (hasVariants && !variant) {
      setVariantError(true);
      toast('Escolha uma opção antes de adicionar.', 'error');
      return;
    }
    const res = add(product, qty, variant);
    if (!res.ok) toast(res.message!, 'error');
  };

  const whatsappMessage = () => {
    const lines = [
      'Olá! Vim pelo site da Dois Brilhos e quero comprar esta peça:',
      '',
      `Produto: ${product.name}${variant ? ` (${variant.label}: ${variant.value})` : ''}`,
      `Quantidade: ${qty}`,
      `Valor unitário: ${formatPrice(effectivePrice(product))}`,
      url,
      '',
      'Gostaria de confirmar a disponibilidade e combinar a entrega.',
    ];
    return lines.join('\n');
  };

  const attendants = settings?.attendants.filter((a) => a.active) ?? [];

  return (
    <PageTransition>
      <Seo
        title={product.name}
        description={product.short_description ?? product.description?.slice(0, 160) ?? undefined}
        image={product.images[0]?.url}
        type="product"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          image: product.images.map((i) => i.url),
          description: product.description,
          material: product.material,
          brand: { '@type': 'Brand', name: 'Dois Brilhos' },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'BRL',
            price: effectivePrice(product).toFixed(2),
            availability: soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
            url,
          },
        }}
      />

      <div className="container-lux pb-16 pt-24 md:pt-28">
        <nav aria-label="Trilha" className="mb-6 text-[0.65rem] uppercase tracking-[0.22em] text-mute">
          <Link to="/" className="hover:text-emerald">Início</Link>
          <span className="mx-2">/</span>
          {product.category ? (
            <Link to={`/categoria/${product.category.slug}`} className="hover:text-emerald">{product.category.name}</Link>
          ) : (
            <Link to="/loja" className="hover:text-emerald">Loja</Link>
          )}
          <span className="mx-2">/</span>
          <span className="text-emerald">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <motion.div className="lg:col-span-7" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
            <ProductGallery images={product.images} name={product.name} />
          </motion.div>

          <motion.div
            className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}
          >
            <Item>
              <p className="eyebrow">{[product.material, product.category?.name].filter(Boolean).join(' · ')}</p>
            </Item>
            <Item>
              <h1 className="mt-3 text-4xl leading-[1.05] text-emerald md:text-5xl">{product.name}</h1>
            </Item>
            {product.is_demo && (
              <Item>
                <p className="mt-3 inline-block rounded-full bg-pearl px-3 py-1 text-[0.62rem] uppercase tracking-[0.2em] text-mute">Produto de exemplo</p>
              </Item>
            )}
            <Item>
              <Price price={product.price} promo={product.promo_price} size="lg" className="mt-6" />
            </Item>
            {product.short_description && (
              <Item>
                <p className="mt-5 leading-relaxed text-mute">{product.short_description}</p>
              </Item>
            )}

            {groups.map(([label, options]) => (
              <Item key={label}>
                <fieldset className="mt-8">
                  <legend className={cn('mb-3 text-[0.68rem] uppercase tracking-[0.22em]', variantError && !variant ? 'text-rose-700' : 'text-ink')}>
                    {label}
                    {variant && variant.label === label && <span className="ml-2 normal-case tracking-normal text-mute">— {variant.value}</span>}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {options.map((o) => {
                      const selected = variant?.id === o.id;
                      const out = o.stock <= 0;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          disabled={out}
                          aria-pressed={selected}
                          onClick={() => {
                            setVariant(o);
                            setVariantError(false);
                            setQty(1);
                          }}
                          className={cn(
                            'relative min-w-12 border px-4 py-2.5 text-sm transition-all duration-300',
                            selected ? 'border-emerald bg-emerald text-ivory' : 'border-line hover:border-emerald',
                            out && 'cursor-not-allowed text-mute/50 line-through hover:border-line',
                          )}
                        >
                          {o.value}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </Item>
            ))}

            <Item>
              <StockInfo stock={stock} soldOut={soldOut} pendingVariant={hasVariants && !variant} />
            </Item>

            <Item>
              <div className="mt-6 flex flex-wrap items-stretch gap-3">
                {!soldOut && <QuantityStepper value={qty} max={maxQty} onChange={setQty} />}
                <button onClick={handleAdd} disabled={soldOut} className="btn btn-primary flex-1">
                  <ShoppingBag className="size-4" strokeWidth={1.3} />
                  {soldOut ? 'Indisponível' : 'Adicionar à sacola'}
                </button>
              </div>
            </Item>

            <Item>
              <div className="relative mt-3">
                <button
                  onClick={() => {
                    if (hasVariants && !variant && !soldOut) {
                      setVariantError(true);
                      toast('Escolha uma opção primeiro.', 'error');
                      return;
                    }
                    if (attendants.length === 1) {
                      window.open(buildWhatsAppLink(attendants[0].phone, whatsappMessage()), '_blank', 'noopener');
                    } else setWaOpen((v) => !v);
                  }}
                  className="btn btn-whatsapp w-full"
                  aria-expanded={waOpen}
                >
                  <MessageCircle className="size-4" strokeWidth={1.4} />
                  {soldOut ? 'Consultar pelo WhatsApp' : 'Comprar pelo WhatsApp'}
                </button>
                <AnimatePresence>
                  {waOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="mb-2 mt-4 text-[0.68rem] uppercase tracking-[0.2em] text-mute">Falar com</p>
                      <div className="grid grid-cols-2 gap-2">
                        {attendants.map((a) => (
                          <a
                            key={a.id}
                            href={buildWhatsAppLink(a.phone, whatsappMessage())}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-line px-4 py-3 text-center font-display text-lg text-emerald transition-colors hover:border-emerald hover:bg-pearl"
                          >
                            {a.name}
                          </a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Item>

            <Item>
              <ul className="mt-8 grid gap-3 border-y border-line py-5 text-sm text-mute">
                <li className="flex items-center gap-3"><Truck className="size-4 text-gold" strokeWidth={1.3} /> Entrega combinada pelo WhatsApp</li>
                <li className="flex items-center gap-3"><ShieldCheck className="size-4 text-gold" strokeWidth={1.3} /> Pedido confirmado somente após o atendimento</li>
              </ul>
            </Item>

            <Item>
              <div className="divide-y divide-line">
                {product.description && <Accordion title="Descrição" defaultOpen>{product.description}</Accordion>}
                {product.material && <Accordion title="Material">{product.material}</Accordion>}
                {settings && settings.about.care_tips.length > 0 && (
                  <Accordion title={settings.about.care_title}>
                    <ul className="list-inside list-disc space-y-1.5">
                      {settings.about.care_tips.map((t) => <li key={t}>{t}</li>)}
                    </ul>
                  </Accordion>
                )}
              </div>
            </Item>
          </motion.div>
        </div>
      </div>

      {relatedList.length > 0 && (
        <section className="container-lux py-16 md:py-24">
          <SectionHeading eyebrow="Você também pode gostar" title="Peças relacionadas" link={product.category ? `/categoria/${product.category.slug}` : '/loja'} />
          <ProductCarousel products={relatedList} label="Produtos relacionados" />
        </section>
      )}

      {/* barra fixa no celular */}
      {!soldOut && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-ivory px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:backdrop-blur-xl lg:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg leading-tight text-emerald">{product.name}</p>
            <p className="text-sm">{formatPrice(effectivePrice(product))}</p>
          </div>
          <button onClick={handleAdd} className="btn btn-primary !min-h-11 !px-5">
            Adicionar
          </button>
        </div>
      )}
    </PageTransition>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return <motion.div variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } } }}>{children}</motion.div>;
}

function StockInfo({ stock, soldOut, pendingVariant }: { stock: number; soldOut: boolean; pendingVariant: boolean }) {
  if (soldOut) return <p className="mt-6 text-sm text-rose-800">Esgotado no momento. Consulte a reposição pelo WhatsApp.</p>;
  if (pendingVariant) return <p className="mt-6 text-sm text-mute">Selecione uma opção para ver a disponibilidade.</p>;
  return (
    <p className="mt-6 flex items-center gap-2 text-sm text-emerald">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald/40 motion-reduce:animate-none" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald" />
      </span>
      {stock <= 3 ? `Últimas ${stock} ${stock === 1 ? 'unidade' : 'unidades'}` : 'Em estoque'}
    </p>
  );
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button className="flex w-full items-center justify-between py-4 text-left text-[0.7rem] uppercase tracking-[0.22em]" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {title}
        <ChevronDown className={cn('size-4 transition-transform duration-500', open && 'rotate-180')} strokeWidth={1.2} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: EASE }} className="overflow-hidden">
            <div className="whitespace-pre-line pb-5 text-sm leading-relaxed text-mute">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-lux grid gap-10 pb-16 pt-28 lg:grid-cols-12 lg:gap-16">
      <div className="skeleton aspect-[4/5] lg:col-span-7" />
      <div className="space-y-4 lg:col-span-5">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-12 w-3/4" />
        <div className="skeleton h-8 w-1/3" />
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-12 w-full" />
      </div>
    </div>
  );
}
