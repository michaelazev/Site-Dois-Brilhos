import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Eye, Gem, PackageX, Plus, ShoppingCart, Wallet } from 'lucide-react';
import { api } from '@/services/api';
import { qk, useSettings } from '@/hooks/queries';
import { formatDate, formatPrice } from '@/lib/format';
import type { OrderStatus, Product } from '@/types';
import { Card, LoadingBlock, PageHeader, StatusBadge } from '../components/ui';

const PAID: OrderStatus[] = ['pago', 'em_preparacao', 'enviado', 'entregue'];

export const productStock = (p: Product) => (p.variants.length ? p.variants.reduce((a, v) => a + v.stock, 0) : p.stock);

export default function DashboardPage() {
  const products = useQuery({ queryKey: qk.products({ includeInactive: true }), queryFn: () => api.listProducts({ includeInactive: true }) });
  const orders = useQuery({ queryKey: qk.orders, queryFn: api.listOrders });
  const { data: settings } = useSettings();

  const stats = useMemo(() => {
    const p = products.data ?? [];
    const o = orders.data ?? [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const paid = o.filter((x) => PAID.includes(x.status));
    const paidMonth = paid.filter((x) => x.created_at >= monthStart);
    return {
      total: p.length,
      available: p.filter((x) => x.is_active && productStock(x) > 0).length,
      outOfStock: p.filter((x) => productStock(x) <= 0).length,
      lowStock: p.filter((x) => { const s = productStock(x); return s > 0 && s <= 3; }),
      orders: o.length,
      pending: o.filter((x) => x.status === 'pendente').length,
      inProgress: o.filter((x) => ['em_atendimento', 'aguardando_pagamento', 'em_preparacao', 'enviado'].includes(x.status)).length,
      revenue: paid.reduce((a, x) => a + x.total, 0),
      revenueMonth: paidMonth.reduce((a, x) => a + x.total, 0),
      paidCount: paid.length,
      ticket: paid.length ? paid.reduce((a, x) => a + x.total, 0) / paid.length : 0,
      mostViewed: [...p].filter((x) => x.view_count > 0).sort((a, b) => b.view_count - a.view_count).slice(0, 5),
      recent: o.slice(0, 6),
    };
  }, [products.data, orders.data]);

  if (products.isLoading || orders.isLoading) return <LoadingBlock />;

  const cards = [
    { label: 'Produtos cadastrados', value: stats.total, icon: Gem, to: '/admin/produtos' },
    { label: 'Disponíveis', value: stats.available, icon: CheckCircle2, to: '/admin/produtos' },
    { label: 'Sem estoque', value: stats.outOfStock, icon: PackageX, to: '/admin/produtos?estoque=zerado', alert: stats.outOfStock > 0 },
    { label: 'Pedidos registrados', value: stats.orders, icon: ShoppingCart, to: '/admin/pedidos' },
    { label: 'Pedidos pendentes', value: stats.pending, icon: Clock, to: '/admin/pedidos?status=pendente', alert: stats.pending > 0 },
    { label: 'Vendas no mês', value: formatPrice(stats.revenueMonth), icon: Wallet, to: '/admin/pedidos' },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral da loja"
        actions={
          <>
            <Link to="/admin/pedidos/novo" className="admin-btn admin-btn-ghost"><Plus className="size-4" /> Registrar pedido</Link>
            <Link to="/admin/produtos/novo" className="admin-btn admin-btn-primary"><Plus className="size-4" /> Novo produto</Link>
          </>
        }
      />

      <motion.div
        className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        {cards.map((c) => (
          <motion.div key={c.label} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
            <Link to={c.to} className="admin-card group flex h-full flex-col justify-between p-4 transition-shadow hover:shadow-md md:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-mute md:text-sm">{c.label}</span>
                <c.icon className={`size-4 ${c.alert ? 'text-rose-600' : 'text-gold'}`} strokeWidth={1.6} />
              </div>
              <p className="mt-3 font-display text-3xl text-emerald md:text-4xl">{c.value}</p>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card
          title="Pedidos recentes"
          className="lg:col-span-2"
          actions={<Link to="/admin/pedidos" className="flex items-center gap-1 text-sm text-emerald hover:underline">Ver todos <ArrowRight className="size-3.5" /></Link>}
        >
          {stats.recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-mute">Nenhum pedido registrado ainda. Pedidos enviados pelo site aparecem aqui como “Pendente”.</p>
          ) : (
            <ul className="divide-y divide-line">
              {stats.recent.map((o) => (
                <li key={o.id}>
                  <Link to={`/admin/pedidos/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-pearl/40">
                    <div className="min-w-0">
                      <p className="truncate font-medium">#{o.number} · {o.customer_name}</p>
                      <p className="text-xs text-mute">{formatDate(o.created_at, true)} · {o.source === 'site' ? 'Site' : 'Manual'}{o.attendant ? ` · ${settings?.attendants.find((a) => a.id === o.attendant)?.name ?? o.attendant}` : ''}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-medium">{formatPrice(o.total)}</span>
                      <StatusBadge status={o.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Resumo de vendas">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-mute">Total vendido</dt><dd className="font-medium">{formatPrice(stats.revenue)}</dd></div>
              <div className="flex justify-between"><dt className="text-mute">Pedidos pagos</dt><dd className="font-medium">{stats.paidCount}</dd></div>
              <div className="flex justify-between"><dt className="text-mute">Ticket médio</dt><dd className="font-medium">{formatPrice(stats.ticket)}</dd></div>
              <div className="flex justify-between"><dt className="text-mute">Em andamento</dt><dd className="font-medium">{stats.inProgress}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-mute">Considera pedidos com status Pago, Em preparação, Enviado ou Entregue.</p>
          </Card>

          <Card title="Mais visualizados">
            {stats.mostViewed.length === 0 ? (
              <p className="text-sm text-mute">As visualizações aparecem conforme os clientes acessam os produtos.</p>
            ) : (
              <ol className="space-y-2.5">
                {stats.mostViewed.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 text-sm">
                    <span className="w-4 text-mute">{i + 1}</span>
                    <Link to={`/admin/produtos/${p.id}`} className="flex-1 truncate hover:text-emerald">{p.name}</Link>
                    <span className="flex items-center gap-1 text-xs text-mute"><Eye className="size-3" />{p.view_count}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {stats.lowStock.length > 0 && (
            <Card title="Estoque baixo">
              <ul className="space-y-2 text-sm">
                {stats.lowStock.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <AlertCircle className="size-3.5 text-amber-600" />
                    <Link to={`/admin/produtos/${p.id}`} className="flex-1 truncate hover:text-emerald">{p.name}</Link>
                    <span className="text-xs text-mute">{productStock(p)} un.</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
