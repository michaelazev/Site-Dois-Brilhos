import { Link, Navigate, useLocation } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';
import { Seo } from '@/components/Seo';
import { SPARKLE_PATH } from '@/components/brand/Logo';
import { EASE } from '@/components/motion/Reveal';
import { readLastOrder } from '@/lib/checkout';
import { formatPrice } from '@/lib/format';

export default function OrderSentPage() {
  const order = readLastOrder();
  const location = useLocation();
  const popupBlocked = (location.state as { popupBlocked?: boolean } | null)?.popupBlocked;
  if (!order) return <Navigate to="/" replace />;

  return (
    <PageTransition>
      <Seo title="Pedido preparado" noindex />
      <div className="container-lux flex min-h-[80vh] flex-col items-center justify-center pb-16 pt-28 text-center">
        <svg viewBox="-1 -1 26 26" className="size-16 text-gold" aria-hidden="true">
          <motion.path
            d={SPARKLE_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.7}
            initial="hidden"
            animate="visible"
            variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } } as unknown as Variants}
            transition={{ duration: 1.4, ease: EASE }}
          />
        </svg>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.9, ease: EASE }}>
          <p className="eyebrow mt-8">Código {order.reference}</p>
          <h1 className="mt-4 text-5xl text-emerald md:text-6xl">
            {popupBlocked ? 'Seu pedido está pronto' : 'Pedido enviado ao WhatsApp'}
          </h1>
          <p className="mx-auto mt-5 max-w-lg leading-relaxed text-mute">
            {popupBlocked
              ? `Toque no botão abaixo para abrir a conversa com ${order.attendantName} e enviar a mensagem do seu pedido.`
              : `Abrimos a conversa com ${order.attendantName} com o resumo do seu pedido. Se ainda não enviou, é só tocar em “enviar” no WhatsApp.`}
          </p>
          <p className="mx-auto mt-4 max-w-lg text-sm text-ink">
            Lembre-se: o pedido <strong className="font-medium">só é confirmado após o retorno do atendimento</strong>, que vai verificar a disponibilidade e combinar pagamento e entrega com você.
          </p>

          <div className="mx-auto mt-8 inline-flex gap-8 border-y border-line py-4 text-sm">
            <span>{order.itemCount} {order.itemCount === 1 ? 'peça' : 'peças'}</span>
            <span>Subtotal {formatPrice(order.total)}</span>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href={order.link} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
              <MessageCircle className="size-4" strokeWidth={1.4} />
              {popupBlocked ? 'Abrir WhatsApp' : 'Abrir WhatsApp novamente'}
            </a>
            <Link to="/loja" className="btn btn-outline">Continuar comprando</Link>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
