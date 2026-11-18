import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart, cartCount, cartSubtotal } from '@/store/cart';
import { formatPrice } from '@/lib/format';
import { QuantityStepper } from '../product/QuantityStepper';
import { SmartImage } from '../ui/SmartImage';
import { EASE } from '../motion/Reveal';
import { Sparkle } from '../brand/Logo';

export function CartDrawer() {
  const { items, isOpen, close, remove, setQuantity } = useCart();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const subtotal = cartSubtotal(items);
  const count = cartCount(items);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    setTimeout(() => panelRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Sacola de compras">
          <motion.div
            className="absolute inset-0 bg-emerald-deep/40 md:backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={close}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-full max-w-[28rem] flex-col bg-ivory shadow-2xl outline-none"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.65, ease: EASE }}
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <p className="font-display text-2xl text-emerald">Sua sacola</p>
                <p className="text-xs tracking-wide text-mute">
                  {count} {count === 1 ? 'peça' : 'peças'}
                </p>
              </div>
              <button onClick={close} className="-mr-2 p-2 text-emerald transition-transform duration-500 hover:rotate-90" aria-label="Fechar sacola">
                <X className="size-5" strokeWidth={1.3} />
              </button>
            </div>

            {items.length === 0 ? (
              <motion.div
                className="flex flex-1 flex-col items-center justify-center px-8 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.6 }}
              >
                <div className="relative mb-6 grid size-20 place-items-center rounded-full bg-pearl text-gold">
                  <ShoppingBag className="size-7" strokeWidth={1} />
                  <Sparkle className="absolute -right-1 top-1 size-4 text-gold" filled />
                </div>
                <p className="font-display text-2xl text-emerald">Sua sacola está vazia</p>
                <p className="mt-2 text-sm text-mute">Descubra peças pensadas para brilhar com você.</p>
                <button
                  className="btn btn-outline mt-8"
                  onClick={() => {
                    close();
                    navigate('/loja');
                  }}
                >
                  Explorar a loja
                </button>
              </motion.div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
                  <AnimatePresence initial={false}>
                    {items.map((item, i) => (
                      <motion.li
                        key={item.key}
                        layout
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: 0.15 + i * 0.05, duration: 0.5, ease: EASE } }}
                        exit={{ opacity: 0, x: -30, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.35 } }}
                        className="flex gap-4 overflow-hidden py-5"
                      >
                        <Link to={`/produto/${item.slug}`} onClick={close} className="shrink-0">
                          <SmartImage small src={item.image} alt={item.name} className="h-28 w-[5.6rem]" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Link to={`/produto/${item.slug}`} onClick={close} className="font-display text-lg leading-snug text-ink hover:text-emerald">
                              {item.name}
                            </Link>
                            <button onClick={() => remove(item.key)} className="p-1 text-mute transition-colors hover:text-rose-700" aria-label={`Remover ${item.name}`}>
                              <Trash2 className="size-4" strokeWidth={1.3} />
                            </button>
                          </div>
                          {item.variant_label && <p className="text-xs text-mute">{item.variant_label}</p>}
                          <p className="mt-1 text-sm">{formatPrice(item.unit_price)}</p>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <QuantityStepper size="sm" value={item.quantity} max={Math.min(item.max_stock, 20)} onChange={(v) => setQuantity(item.key, v)} />
                            <span className="text-sm font-medium tabular-nums">{formatPrice(item.unit_price * item.quantity)}</span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <motion.div
                  className="border-t border-line bg-pearl/60 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-[0.22em] text-mute">Subtotal</span>
                    <motion.span key={subtotal} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="font-display text-2xl text-emerald">
                      {formatPrice(subtotal)}
                    </motion.span>
                  </div>
                  <p className="mt-1 text-xs text-mute">Entrega e pagamento são combinados pelo WhatsApp.</p>
                  <button
                    className="btn btn-primary mt-5 w-full"
                    onClick={() => {
                      close();
                      navigate('/finalizar');
                    }}
                  >
                    Finalizar pedido
                  </button>
                  <div className="mt-3 flex justify-between text-[0.68rem] uppercase tracking-[0.2em] text-emerald">
                    <button onClick={close} className="link-underline py-1">Continuar comprando</button>
                    <Link to="/carrinho" onClick={close} className="link-underline py-1">Ver sacola</Link>
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
