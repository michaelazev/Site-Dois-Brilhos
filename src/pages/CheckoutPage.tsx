import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, ChevronDown, Info, Loader2, MessageCircle } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';
import { Seo } from '@/components/Seo';
import { SmartImage } from '@/components/ui/SmartImage';
import { EASE, Reveal } from '@/components/motion/Reveal';
import { useCart, cartSubtotal } from '@/store/cart';
import { useSettings } from '@/hooks/queries';
import { api } from '@/services/api';
import { cn, formatPrice } from '@/lib/format';
import { buildOrderMessage, buildWhatsAppLink, formatPhoneDisplay, generateOrderReference, isValidWhatsAppNumber } from '@/lib/whatsapp';
import { readDraft, saveDraft, saveLastOrder, validateCheckout, type CheckoutData, type CheckoutErrors } from '@/lib/checkout';

export default function CheckoutPage() {
  const items = useCart((s) => s.items);
  const reconcile = useCart((s) => s.reconcile);
  const clear = useCart((s) => s.clear);
  const { data: settings } = useSettings();
  const navigate = useNavigate();

  const [form, setForm] = useState<Partial<CheckoutData>>(() => ({ notes: '', address: '', ...readDraft() }));
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const attendants = (settings?.attendants ?? []).filter((a) => a.active && isValidWhatsAppNumber(a.phone));
  const subtotal = cartSubtotal(items);

  // Confere preços e estoque atuais antes de finalizar.
  useEffect(() => {
    let alive = true;
    const ids = useCart.getState().items.map((i) => i.product_id);
    if (!ids.length) {
      setChecking(false);
      return;
    }
    api
      .listProducts({ ids })
      .then((products) => alive && setWarnings(reconcile(products)))
      .catch(() => alive && setWarnings(['Não foi possível verificar o estoque agora. A disponibilidade será confirmada no atendimento.']))
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [reconcile]);

  useEffect(() => {
    saveDraft(form);
  }, [form]);

  const update = (key: keyof CheckoutData, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const previewMessage = useMemo(
    () =>
      buildOrderMessage(
        items.map((i) => ({ name: i.name, variant: i.variant_label, quantity: i.quantity, unitPrice: i.unit_price })),
        {
          name: form.name || '[Nome]',
          city: form.city || '[Cidade]',
          neighborhood: form.neighborhood || '[Bairro]',
          address: form.address,
          notes: form.notes,
        },
      ),
    [items, form],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || checking) return;
    if (!items.length) return;

    const result = validateCheckout(form);
    if (!result.ok) {
      setErrors(result.errors);
      const first = Object.keys(result.errors)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    const data = result.data;
    const attendant = attendants.find((a) => a.id === data.attendant);
    if (!attendant) {
      setErrors({ attendant: 'Escolha com quem deseja falar.' });
      return;
    }

    setSubmitting(true);
    const reference = generateOrderReference();
    const message = buildOrderMessage(
      items.map((i) => ({ name: i.name, variant: i.variant_label, quantity: i.quantity, unitPrice: i.unit_price })),
      data,
      reference,
    );
    const link = buildWhatsAppLink(attendant.phone, message);

    // Abre o WhatsApp imediatamente (dentro do clique, para não ser bloqueado).
    // (sem "noopener" nas features: com ele, window.open sempre retorna null e não dá para detectar bloqueio)
    const win = window.open(link, '_blank');
    if (win) win.opener = null;

    // Registra o pedido como "pendente" no painel. Não bloqueia o cliente se falhar.
    api
      .createSiteOrder({
        reference,
        attendant: attendant.id,
        customer_name: data.name,
        city: data.city,
        neighborhood: data.neighborhood,
        address: data.address ?? '',
        notes: data.notes ?? '',
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, variant: i.variant_label })),
      })
      .catch((err) => console.warn('Pedido não registrado no painel:', err));

    saveLastOrder({
      reference,
      attendantName: attendant.name,
      link,
      total: subtotal,
      itemCount: items.reduce((a, i) => a + i.quantity, 0),
      createdAt: new Date().toISOString(),
    });
    clear();
    navigate('/pedido-enviado', { state: { popupBlocked: !win } });
  };

  if (!items.length && !submitting) {
    return (
      <PageTransition>
        <Seo title="Finalizar pedido" noindex />
        <div className="container-lux flex min-h-[70vh] flex-col items-center justify-center pt-24 text-center">
          <h1 className="font-display text-4xl text-emerald">Sua sacola está vazia</h1>
          <p className="mt-3 text-mute">Adicione peças para finalizar o pedido.</p>
          <Link to="/loja" className="btn btn-primary mt-8">Explorar a loja</Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Seo title="Finalizar pedido" noindex />
      <div className="container-lux pb-24 pt-28 md:pt-32">
        <Reveal eager>
          <Link to="/carrinho" className="mb-6 inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.22em] text-mute hover:text-emerald">
            <ArrowLeft className="size-3.5" /> Voltar para a sacola
          </Link>
          <h1 className="text-5xl text-emerald md:text-6xl">Finalizar pedido</h1>
          <p className="mt-3 max-w-xl text-mute">
            Preencha seus dados e escolha com quem deseja falar. Vamos montar a mensagem do seu pedido e abrir o WhatsApp para você enviar.
          </p>
        </Reveal>

        <AnimatePresence>
          {warnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 flex gap-3 border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <ul className="space-y-1">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
            </motion.div>
          )}
        </AnimatePresence>

        <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal eager>
              <Step n={1} title="Seus dados" />
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <Field label="Nome completo" error={errors.name} className="sm:col-span-2">
                  <input name="name" autoComplete="name" className="field" value={form.name ?? ''} onChange={(e) => update('name', e.target.value)} aria-invalid={!!errors.name} placeholder="Como devemos te chamar?" />
                </Field>
                <Field label="Cidade" error={errors.city}>
                  <input name="city" autoComplete="address-level2" className="field" value={form.city ?? ''} onChange={(e) => update('city', e.target.value)} aria-invalid={!!errors.city} placeholder="Ex.: Recife" />
                </Field>
                <Field label="Bairro" error={errors.neighborhood}>
                  <input name="neighborhood" autoComplete="address-level3" className="field" value={form.neighborhood ?? ''} onChange={(e) => update('neighborhood', e.target.value)} aria-invalid={!!errors.neighborhood} placeholder="Ex.: Boa Viagem" />
                </Field>
                <Field label="Endereço" hint="Opcional — informe se desejar entrega" error={errors.address} className="sm:col-span-2">
                  <input name="address" autoComplete="street-address" className="field" value={form.address ?? ''} onChange={(e) => update('address', e.target.value)} aria-invalid={!!errors.address} placeholder="Rua, número, complemento" />
                </Field>
                <Field label="Observações" hint="Opcional" error={errors.notes} className="sm:col-span-2">
                  <textarea name="notes" rows={3} className="field resize-none" value={form.notes ?? ''} onChange={(e) => update('notes', e.target.value)} aria-invalid={!!errors.notes} placeholder="Presente? Prefere retirar? Conte pra gente." />
                </Field>
              </div>
            </Reveal>

            <Reveal eager className="mt-14">
              <Step n={2} title="Enviar pedido para" />
              <div className="grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Escolha o atendente" aria-invalid={!!errors.attendant}>
                {attendants.map((a) => {
                  const selected = form.attendant === a.id;
                  return (
                    <label
                      key={a.id}
                      className={cn(
                        'group relative flex cursor-pointer items-center gap-4 border p-5 transition-all duration-500',
                        selected ? 'border-emerald bg-emerald text-ivory shadow-[0_20px_40px_-24px_rgba(14,59,46,0.6)]' : 'border-line bg-white/50 hover:border-emerald/50',
                      )}
                    >
                      <input type="radio" name="attendant" value={a.id} checked={selected} onChange={() => update('attendant', a.id)} className="sr-only" />
                      <span className={cn('grid size-12 shrink-0 place-items-center rounded-full font-display text-2xl transition-colors duration-500', selected ? 'bg-gold-light text-emerald-deep' : 'bg-pearl text-emerald')}>
                        {a.name.charAt(0)}
                      </span>
                      <span className="flex-1">
                        <span className="block font-display text-2xl leading-tight">{a.name}</span>
                        <span className={cn('text-xs', selected ? 'text-ivory/70' : 'text-mute')}>{formatPhoneDisplay(a.phone)}</span>
                      </span>
                      <span className={cn('grid size-5 place-items-center rounded-full border transition-colors', selected ? 'border-gold-light' : 'border-line')}>
                        <AnimatePresence>
                          {selected && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="size-2.5 rounded-full bg-gold-light" />}
                        </AnimatePresence>
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.attendant && <p className="mt-3 text-sm text-rose-700" role="alert">{errors.attendant}</p>}
              {attendants.length === 0 && <p className="mt-3 text-sm text-rose-700">Nenhum atendente disponível no momento.</p>}
            </Reveal>

            <Reveal eager className="mt-10">
              <button type="button" onClick={() => setShowPreview((v) => !v)} className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.22em] text-emerald" aria-expanded={showPreview}>
                <ChevronDown className={cn('size-4 transition-transform duration-500', showPreview && 'rotate-180')} />
                Ver mensagem que será enviada
              </button>
              <AnimatePresence>
                {showPreview && (
                  <motion.pre
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="mt-4 overflow-hidden whitespace-pre-wrap rounded-lg bg-[#e7f3ea] p-5 font-sans text-[0.82rem] leading-relaxed text-[#173a2a]"
                  >
                    {previewMessage}
                  </motion.pre>
                )}
              </AnimatePresence>
            </Reveal>
          </div>

          <aside className="lg:col-span-5">
            <div className="bg-pearl/70 p-6 md:p-8 lg:sticky lg:top-28">
              <h2 className="font-display text-3xl text-emerald">Resumo</h2>
              <ul className="mt-6 max-h-[22rem] divide-y divide-line overflow-y-auto pr-1">
                {items.map((i) => (
                  <li key={i.key} className="flex gap-4 py-4">
                    <div className="relative">
                      <SmartImage small src={i.image} alt={i.name} className="h-20 w-16" />
                      <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-emerald text-[0.6rem] text-ivory">{i.quantity}</span>
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-display text-lg leading-tight">{i.name}</p>
                      {i.variant_label && <p className="text-xs text-mute">{i.variant_label}</p>}
                      <p className="mt-1 text-xs text-mute">{i.quantity} × {formatPrice(i.unit_price)}</p>
                    </div>
                    <p className="text-sm tabular-nums">{formatPrice(i.unit_price * i.quantity)}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-baseline justify-between border-t border-line pt-5">
                <span className="text-xs uppercase tracking-[0.22em] text-mute">Subtotal</span>
                <span className="font-display text-3xl text-emerald">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-2 text-xs text-mute">Entrega e forma de pagamento são combinadas no atendimento.</p>

              <button type="submit" disabled={submitting || checking || attendants.length === 0} className="btn btn-whatsapp mt-7 w-full">
                {submitting || checking ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" strokeWidth={1.4} />}
                {checking ? 'Conferindo estoque…' : 'Enviar pedido pelo WhatsApp'}
              </button>

              <div className="mt-5 flex gap-3 text-xs leading-relaxed text-mute">
                <Info className="mt-0.5 size-3.5 shrink-0 text-gold" />
                <p>
                  Nenhum pagamento é feito pelo site. Seu pedido <strong className="font-medium text-ink">só é confirmado após o retorno do atendimento</strong>, que verifica a disponibilidade com você.
                </p>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </PageTransition>
  );
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <span className="grid size-8 place-items-center rounded-full border border-gold font-display text-lg text-gold-deep">{n}</span>
      <h2 className="text-3xl text-emerald">{title}</h2>
    </div>
  );
}

function Field({ label, hint, error, className, children }: { label: string; hint?: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn('block', className)}>
      <span className="flex items-baseline justify-between text-[0.66rem] uppercase tracking-[0.22em] text-ink/80">
        {label}
        {hint && <span className="normal-case tracking-normal text-mute">{hint}</span>}
      </span>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 block text-xs text-rose-700" role="alert">
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}
