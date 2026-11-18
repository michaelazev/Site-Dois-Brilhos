import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Trash2 } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';
import { Seo } from '@/components/Seo';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { SmartImage } from '@/components/ui/SmartImage';
import { EASE, MaskText } from '@/components/motion/Reveal';
import { useCart, cartCount, cartSubtotal, MAX_PER_ITEM } from '@/store/cart';
import { formatPrice } from '@/lib/format';

export default function CartPage() {
  const { items, remove, setQuantity, clear } = useCart();
  const navigate = useNavigate();
  const count = cartCount(items);

  return (
    <PageTransition>
      <Seo title="Sacola" noindex />
      <div className="container-lux pb-24 pt-28 md:pt-36">
        <MaskText as="h1" text="Sua sacola" className="text-5xl text-emerald md:text-7xl" />
        <p className="mt-3 text-mute">{count} {count === 1 ? 'peça' : 'peças'}</p>

        {items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-3xl text-emerald">Ainda não há peças por aqui</p>
            <Link to="/loja" className="btn btn-primary mt-8">Explorar a loja</Link>
          </div>
        ) : (
          <div className="mt-12 grid gap-12 lg:grid-cols-12">
            <ul className="divide-y divide-line border-y border-line lg:col-span-8">
              <AnimatePresence initial={false}>
                {items.map((i) => (
                  <motion.li
                    key={i.key}
                    layout
                    exit={{ opacity: 0, height: 0, transition: { duration: 0.35 } }}
                    className="flex gap-5 overflow-hidden py-6"
                  >
                    <Link to={`/produto/${i.slug}`} className="shrink-0">
                      <SmartImage src={i.image} alt={i.name} className="h-36 w-28 md:h-44 md:w-36" />
                    </Link>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-4">
                        <div>
                          <Link to={`/produto/${i.slug}`} className="font-display text-2xl leading-tight hover:text-emerald">{i.name}</Link>
                          {i.variant_label && <p className="mt-1 text-sm text-mute">{i.variant_label}</p>}
                          <p className="mt-2 text-sm">{formatPrice(i.unit_price)}</p>
                        </div>
                        <p className="font-display text-xl tabular-nums">{formatPrice(i.unit_price * i.quantity)}</p>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-4">
                        <QuantityStepper value={i.quantity} max={Math.min(i.max_stock, MAX_PER_ITEM)} onChange={(v) => setQuantity(i.key, v)} />
                        <button onClick={() => remove(i.key)} className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-mute hover:text-rose-700">
                          <Trash2 className="size-3.5" strokeWidth={1.3} /> Remover
                        </button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            <motion.aside
              className="h-fit bg-pearl/70 p-8 lg:sticky lg:top-28 lg:col-span-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-[0.22em] text-mute">Subtotal</span>
                <span className="font-display text-3xl text-emerald">{formatPrice(cartSubtotal(items))}</span>
              </div>
              <p className="mt-2 text-xs text-mute">Entrega e pagamento combinados pelo WhatsApp.</p>
              <button onClick={() => navigate('/finalizar')} className="btn btn-primary mt-7 w-full">
                Finalizar pedido <ArrowRight className="size-4" strokeWidth={1.3} />
              </button>
              <Link to="/loja" className="btn btn-outline mt-3 w-full">Continuar comprando</Link>
              <button onClick={clear} className="mt-5 w-full text-center text-xs text-mute underline-offset-4 hover:underline">
                Esvaziar sacola
              </button>
            </motion.aside>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
