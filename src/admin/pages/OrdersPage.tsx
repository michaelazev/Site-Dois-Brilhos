import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Globe, MessageCircle, PenLine, Plus, Search } from 'lucide-react';
import { api } from '@/services/api';
import { qk, useInvalidatingMutation, useSettings } from '@/hooks/queries';
import { useToast } from '@/components/ui/Toast';
import { cn, formatDate, formatPrice, normalizeText } from '@/lib/format';
import { ORDER_STATUSES, type OrderStatus } from '@/types';
import { EmptyState, LoadingBlock, PageHeader, StatusSelect } from '../components/ui';

export default function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') ?? '') as OrderStatus | '';
  const [search, setSearch] = useState('');
  const toast = useToast();
  const { data: settings } = useSettings();
  const { data: orders = [], isLoading } = useQuery({ queryKey: qk.orders, queryFn: api.listOrders });
  const updateStatus = useInvalidatingMutation(({ id, s }: { id: string; s: OrderStatus }) => api.updateOrderStatus(id, s), [qk.orders, ['order']]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    orders.forEach((o) => m.set(o.status, (m.get(o.status) ?? 0) + 1));
    return m;
  }, [orders]);

  const filtered = useMemo(() => {
    const s = normalizeText(search);
    return orders.filter((o) => {
      if (status && o.status !== status) return false;
      if (s && !normalizeText(`${o.number} ${o.reference ?? ''} ${o.customer_name} ${o.city ?? ''} ${o.neighborhood ?? ''}`).includes(s)) return false;
      return true;
    });
  }, [orders, status, search]);

  const attendantName = (id: string | null) => settings?.attendants.find((a) => a.id === id)?.name ?? id ?? '—';

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Pedidos enviados pelo site entram como “Pendente”. Registre aqui também os pedidos recebidos direto pelo WhatsApp."
        actions={<Link to="/admin/pedidos/novo" className="admin-btn admin-btn-primary"><Plus className="size-4" /> Registrar pedido</Link>}
      />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        <StatusTab active={!status} onClick={() => setParams({}, { replace: true })} label="Todos" count={orders.length} />
        {ORDER_STATUSES.map((s) => (
          <StatusTab key={s.value} active={status === s.value} onClick={() => setParams({ status: s.value }, { replace: true })} label={s.label} count={counts.get(s.value) ?? 0} />
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mute" />
        <input className="admin-input !pl-9" placeholder="Buscar por cliente, número, código ou bairro" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhum pedido aqui"
          description={orders.length ? 'Nenhum pedido corresponde ao filtro.' : 'Quando um cliente finalizar pelo site, o pedido aparece aqui automaticamente.'}
        />
      ) : (
        <div className="admin-card divide-y divide-line">
          {filtered.map((o) => (
            <div key={o.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <Link to={`/admin/pedidos/${o.id}`} className="min-w-0 flex-1 hover:text-emerald">
                <div className="flex items-center gap-2">
                  <span className="font-medium">#{o.number}</span>
                  <span className="truncate">{o.customer_name}</span>
                  <span title={o.source === 'site' ? 'Enviado pelo site' : 'Registrado manualmente'} className="text-mute">
                    {o.source === 'site' ? <Globe className="size-3.5" /> : <PenLine className="size-3.5" />}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-mute">
                  {formatDate(o.created_at, true)}
                  {o.reference && ` · ${o.reference}`}
                  {' · '}
                  {[o.neighborhood, o.city].filter(Boolean).join(', ') || 'Sem endereço'}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-mute">
                  <MessageCircle className="size-3" /> {attendantName(o.attendant)} · {o.items.reduce((a, i) => a + i.quantity, 0)} peça(s)
                </p>
              </Link>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="font-display text-xl text-emerald">{formatPrice(o.total)}</span>
                <StatusSelect
                  value={o.status}
                  disabled={updateStatus.isPending}
                  onChange={async (s) => {
                    try {
                      await updateStatus.mutateAsync({ id: o.id, s });
                      toast(`Pedido #${o.number} atualizado.`);
                    } catch (err) {
                      toast(err instanceof Error ? err.message : 'Erro ao atualizar.', 'error');
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusTab({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn('flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors', active ? 'border-emerald bg-emerald text-white' : 'border-line bg-white hover:border-gold')}
    >
      {label}
      <span className={cn('rounded-full px-1.5 text-[0.65rem]', active ? 'bg-white/20' : 'bg-pearl text-mute')}>{count}</span>
    </button>
  );
}
