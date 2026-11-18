import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { qk, useInvalidatingMutation, useProducts, useSettings } from '@/hooks/queries';
import { useToast } from '@/components/ui/Toast';
import { effectivePrice, formatDate, formatPrice } from '@/lib/format';
import { buildWhatsAppLink, normalizePhone } from '@/lib/whatsapp';
import type { OrderInput, OrderItem } from '@/types';
import { Card, ConfirmDialog, Field, LoadingBlock, PageHeader, StatusBadge, StatusSelect } from '../components/ui';
import { MoneyInput } from './ProductEditorPage';

type Row = OrderItem & { key: string };

const EMPTY: OrderInput = {
  reference: null,
  source: 'manual',
  status: 'em_atendimento',
  attendant: null,
  customer_name: '',
  customer_phone: '',
  city: '',
  neighborhood: '',
  address: '',
  notes: '',
  internal_notes: '',
  subtotal: 0,
  shipping: 0,
  discount: 0,
  total: 0,
  items: [],
};

export default function OrderEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const { data: settings } = useSettings();
  const { data: products = [] } = useProducts({ includeInactive: true });
  const { data: order, isLoading } = useQuery({ queryKey: qk.order(id ?? ''), queryFn: () => api.getOrder(id!), enabled: !isNew });

  const [form, setForm] = useState<OrderInput>(EMPTY);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (order) {
      const { id: _id, number: _n, created_at: _c, updated_at: _u, ...rest } = order;
      setForm(rest);
      setRows(order.items.map((i) => ({ ...i, key: crypto.randomUUID() })));
    } else if (isNew && settings) {
      setForm((f) => ({ ...f, attendant: f.attendant ?? settings.attendants[0]?.id ?? null }));
    }
  }, [order, isNew, settings]);

  const subtotal = useMemo(() => rows.reduce((a, r) => a + r.unit_price * r.quantity, 0), [rows]);
  const total = Math.max(0, subtotal + (form.shipping || 0) - (form.discount || 0));

  const save = useInvalidatingMutation((input: OrderInput) => api.saveOrder(input), [qk.orders, ['order']]);
  const del = useInvalidatingMutation((oid: string) => api.deleteOrder(oid), [qk.orders]);

  const set = <K extends keyof OrderInput>(k: K, v: OrderInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const addProduct = (productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setRows((r) => [...r, { key: crypto.randomUUID(), product_id: p.id, product_name: p.name, variant: null, quantity: 1, unit_price: effectivePrice(p) }]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.customer_name.trim().length < 2) return setError('Informe o nome do cliente.');
    if (!rows.length) return setError('Adicione pelo menos um item.');
    if (rows.some((r) => !r.product_name.trim() || r.quantity < 1)) return setError('Revise os itens: nome e quantidade são obrigatórios.');
    try {
      const saved = await save.mutateAsync({
        ...(id ? { id } : {}),
        ...form,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone ? normalizePhone(form.customer_phone) : null,
        items: rows.map(({ key: _k, id: _i, order_id: _o, ...r }) => r),
        subtotal,
        total,
      });
      toast(isNew ? `Pedido #${saved.number} registrado.` : 'Pedido atualizado.');
      if (isNew) navigate(`/admin/pedidos/${saved.id}`, { replace: true });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error');
    }
  };

  if (!isNew && isLoading) return <LoadingBlock />;
  if (!isNew && !order) return <p>Pedido não encontrado. <Link to="/admin/pedidos" className="text-emerald underline">Voltar</Link></p>;

  const phone = form.customer_phone ? normalizePhone(form.customer_phone) : '';
  const customerWa = phone.length >= 10 ? buildWhatsAppLink(phone.startsWith('55') ? phone : `55${phone}`, `Olá, ${form.customer_name.split(' ')[0]}! Aqui é da Dois Brilhos, sobre o seu pedido${order ? ` #${order.number}` : ''}.`) : null;

  return (
    <form onSubmit={submit} noValidate>
      <Link to="/admin/pedidos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-mute hover:text-emerald">
        <ArrowLeft className="size-4" /> Pedidos
      </Link>
      <PageHeader
        title={isNew ? 'Registrar pedido' : `Pedido #${order!.number}`}
        description={order ? `${formatDate(order.created_at, true)} · ${order.source === 'site' ? 'Enviado pelo site' : 'Registrado manualmente'}${order.reference ? ` · Código ${order.reference}` : ''}` : 'Cadastre um pedido recebido pelo WhatsApp ou pessoalmente.'}
        actions={
          <>
            {!isNew && <button type="button" className="admin-btn admin-btn-danger" onClick={() => setConfirmDelete(true)}><Trash2 className="size-4" /> Excluir</button>}
            <button className="admin-btn admin-btn-primary" disabled={save.isPending}>{save.isPending && <Loader2 className="size-4 animate-spin" />} Salvar</button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Itens">
            <div className="space-y-3">
              {rows.length === 0 && <p className="text-sm text-mute">Nenhum item adicionado.</p>}
              {rows.map((r) => (
                <div key={r.key} className="grid grid-cols-2 gap-2 rounded-lg border border-line p-3 sm:grid-cols-[1fr_8rem_5rem_7rem_2.5rem] sm:items-end sm:border-0 sm:p-0">
                  <Field label="Produto" className="col-span-2 sm:col-span-1">
                    <input className="admin-input" value={r.product_name} onChange={(e) => setRows((all) => all.map((x) => (x.key === r.key ? { ...x, product_name: e.target.value } : x)))} />
                  </Field>
                  <Field label="Variação">
                    <input className="admin-input" value={r.variant ?? ''} placeholder="—" onChange={(e) => setRows((all) => all.map((x) => (x.key === r.key ? { ...x, variant: e.target.value || null } : x)))} />
                  </Field>
                  <Field label="Qtd.">
                    <input type="number" min={1} className="admin-input" value={r.quantity} onChange={(e) => setRows((all) => all.map((x) => (x.key === r.key ? { ...x, quantity: Math.max(1, parseInt(e.target.value || '1', 10)) } : x)))} />
                  </Field>
                  <Field label="Valor unit.">
                    <MoneyInput value={r.unit_price} onChange={(v) => setRows((all) => all.map((x) => (x.key === r.key ? { ...x, unit_price: v ?? 0 } : x)))} />
                  </Field>
                  <button type="button" onClick={() => setRows((all) => all.filter((x) => x.key !== r.key))} className="grid h-10 place-items-center rounded-md text-mute hover:bg-rose-50 hover:text-rose-700" aria-label="Remover item">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <select className="admin-input" value="" onChange={(e) => addProduct(e.target.value)} aria-label="Adicionar produto do catálogo">
                <option value="">+ Adicionar produto do catálogo…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatPrice(effectivePrice(p))}</option>)}
              </select>
              <button type="button" className="admin-btn admin-btn-ghost shrink-0" onClick={() => setRows((r) => [...r, { key: crypto.randomUUID(), product_id: null, product_name: '', variant: null, quantity: 1, unit_price: 0 }])}>
                <Plus className="size-4" /> Item avulso
              </button>
            </div>

            <dl className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-mute">Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-mute">Frete / entrega</dt><dd className="w-32"><MoneyInput value={form.shipping} onChange={(v) => set('shipping', v ?? 0)} /></dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-mute">Desconto</dt><dd className="w-32"><MoneyInput value={form.discount} onChange={(v) => set('discount', v ?? 0)} /></dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-base"><dt className="font-medium">Total</dt><dd className="font-display text-2xl text-emerald">{formatPrice(total)}</dd></div>
            </dl>
          </Card>

          <Card title="Cliente">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome" className="sm:col-span-2"><input className="admin-input" value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} /></Field>
              <Field label="WhatsApp do cliente" hint="opcional">
                <input className="admin-input" inputMode="tel" value={form.customer_phone ?? ''} placeholder="81 99999-9999" onChange={(e) => set('customer_phone', e.target.value)} />
              </Field>
              <Field label="Cidade"><input className="admin-input" value={form.city ?? ''} onChange={(e) => set('city', e.target.value)} /></Field>
              <Field label="Bairro"><input className="admin-input" value={form.neighborhood ?? ''} onChange={(e) => set('neighborhood', e.target.value)} /></Field>
              <Field label="Endereço"><input className="admin-input" value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} /></Field>
              <Field label="Observações do cliente" className="sm:col-span-2"><textarea className="admin-input min-h-20" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></Field>
            </div>
            {customerWa && (
              <a href={customerWa} target="_blank" rel="noreferrer" className="admin-btn admin-btn-ghost mt-4"><MessageCircle className="size-4" /> Conversar com o cliente</a>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Status">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <StatusSelect value={form.status} onChange={(s) => set('status', s)} />
                <StatusBadge status={form.status} />
              </div>
              <Field label="Atendente">
                <select className="admin-input" value={form.attendant ?? ''} onChange={(e) => set('attendant', e.target.value || null)}>
                  <option value="">—</option>
                  {settings?.attendants.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </Field>
              <Field label="Anotações internas" hint="não aparecem para o cliente">
                <textarea className="admin-input min-h-28" value={form.internal_notes ?? ''} onChange={(e) => set('internal_notes', e.target.value)} placeholder="Forma de pagamento, rastreio, combinados…" />
              </Field>
            </div>
          </Card>
          {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</p>}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir pedido"
        message="Este pedido será excluído permanentemente. Para manter o histórico, prefira mudar o status para “Cancelado”."
        loading={del.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await del.mutateAsync(id!);
          toast('Pedido excluído.');
          navigate('/admin/pedidos', { replace: true });
        }}
      />
    </form>
  );
}
