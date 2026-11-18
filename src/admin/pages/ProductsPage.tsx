import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Copy, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { qk, useCategories, useInvalidatingMutation } from '@/hooks/queries';
import { useToast } from '@/components/ui/Toast';
import { cn, formatPrice, normalizeText } from '@/lib/format';
import type { Product, ProductInput } from '@/types';
import { ConfirmDialog, EmptyState, LoadingBlock, PageHeader } from '../components/ui';
import { productStock } from './DashboardPage';

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const category = params.get('categoria') ?? '';
  const stockFilter = params.get('estoque') ?? '';
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const toast = useToast();

  const { data: products = [], isLoading } = useQuery({ queryKey: qk.products({ includeInactive: true }), queryFn: () => api.listProducts({ includeInactive: true }) });
  const { data: categories = [] } = useCategories(true);

  const del = useInvalidatingMutation((id: string) => api.deleteProduct(id), [['products'], ['product']]);
  const save = useInvalidatingMutation((input: ProductInput) => api.saveProduct(input), [['products'], ['product']]);

  const filtered = useMemo(() => {
    const s = normalizeText(search);
    return products.filter((p) => {
      if (s && !normalizeText(`${p.name} ${p.material ?? ''}`).includes(s)) return false;
      if (category && p.category_id !== category) return false;
      const st = productStock(p);
      if (stockFilter === 'zerado' && st > 0) return false;
      if (stockFilter === 'baixo' && (st <= 0 || st > 3)) return false;
      if (stockFilter === 'inativo' && p.is_active) return false;
      return true;
    });
  }, [products, search, category, stockFilter]);

  const setParam = (k: string, v: string) => {
    const n = new URLSearchParams(params);
    if (v) n.set(k, v);
    else n.delete(k);
    setParams(n, { replace: true });
  };

  const quickUpdate = async (p: Product, patch: Partial<ProductInput>) => {
    try {
      await save.mutateAsync({ ...toInput(p), ...patch });
      toast('Produto atualizado.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error');
    }
  };

  const duplicate = async (p: Product) => {
    const base = toInput(p);
    try {
      await save.mutateAsync({
        ...base,
        id: undefined,
        name: `${p.name} (cópia)`,
        slug: `${p.slug}-copia-${Date.now().toString(36).slice(-4)}`,
        is_active: false,
        // path nulo: excluir a cópia não apaga os arquivos que o original ainda usa
        images: base.images.map((i) => ({ ...i, path: null })),
      });
      toast('Cópia criada (inativa). Edite e ative quando estiver pronta.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao duplicar.', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Produtos"
        description={`${products.length} produtos cadastrados`}
        actions={<Link to="/admin/produtos/novo" className="admin-btn admin-btn-primary"><Plus className="size-4" /> Novo produto</Link>}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mute" />
          <input className="admin-input !pl-9" placeholder="Buscar por nome ou material" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="admin-input sm:!w-48" value={category} onChange={(e) => setParam('categoria', e.target.value)} aria-label="Filtrar por categoria">
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="admin-input sm:!w-44" value={stockFilter} onChange={(e) => setParam('estoque', e.target.value)} aria-label="Filtrar por estoque">
          <option value="">Todos</option>
          <option value="zerado">Sem estoque</option>
          <option value="baixo">Estoque baixo (≤3)</option>
          <option value="inativo">Ocultos da loja</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <EmptyState title="Nenhum produto encontrado" description="Ajuste os filtros ou cadastre um novo produto." action={<Link to="/admin/produtos/novo" className="admin-btn admin-btn-primary"><Plus className="size-4" /> Novo produto</Link>} />
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-pearl/60 text-left text-xs uppercase tracking-wider text-mute">
                <tr>
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Preço</th>
                  <th className="px-4 py-3 font-medium">Estoque</th>
                  <th className="px-4 py-3 font-medium">Destaques</th>
                  <th className="px-4 py-3 font-medium">Visível</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((p) => {
                  const st = productStock(p);
                  return (
                    <tr key={p.id} className={cn('hover:bg-pearl/30', !p.is_active && 'opacity-60')}>
                      <td className="px-4 py-3">
                        <Link to={`/admin/produtos/${p.id}`} className="flex items-center gap-3">
                          <img src={p.images[0]?.url ?? '/favicon.svg'} alt="" className="size-12 shrink-0 rounded-md bg-pearl object-cover" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium hover:text-emerald">{p.name}</span>
                            <span className="text-xs text-mute">
                              {p.category?.name ?? 'Sem categoria'}
                              {p.is_demo && <span className="ml-2 rounded bg-amber-100 px-1.5 text-[0.65rem] text-amber-800">exemplo</span>}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {p.promo_price != null ? (
                          <>
                            <span className="font-medium text-emerald">{formatPrice(p.promo_price)}</span>
                            <span className="block text-xs text-mute line-through">{formatPrice(p.price)}</span>
                          </>
                        ) : (
                          formatPrice(p.price)
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', st <= 0 ? 'bg-rose-50 text-rose-700' : st <= 3 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800')}>
                          {st <= 0 ? 'Esgotado' : `${st} un.`}
                        </span>
                        {p.variants.length > 0 && <span className="ml-1 text-xs text-mute">({p.variants.length} opções)</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <FlagChip active={p.is_new} label="Lançamento" onClick={() => quickUpdate(p, { is_new: !p.is_new })} />
                          <FlagChip active={p.is_bestseller} label="Mais vendido" onClick={() => quickUpdate(p, { is_bestseller: !p.is_bestseller })} />
                          <FlagChip active={p.is_featured} label="Home" onClick={() => quickUpdate(p, { is_featured: !p.is_featured })} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          role="switch"
                          aria-checked={p.is_active}
                          aria-label={p.is_active ? 'Ocultar da loja' : 'Mostrar na loja'}
                          onClick={() => quickUpdate(p, { is_active: !p.is_active })}
                          className={cn('relative h-5 w-9 rounded-full transition-colors', p.is_active ? 'bg-emerald' : 'bg-line')}
                        >
                          <span className={cn('absolute top-0.5 size-4 rounded-full bg-white shadow transition-all', p.is_active ? 'left-[1.15rem]' : 'left-0.5')} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link to={`/admin/produtos/${p.id}`} className="rounded-md p-2 text-mute hover:bg-pearl hover:text-emerald" title="Editar"><Pencil className="size-4" /></Link>
                          <button onClick={() => duplicate(p)} className="rounded-md p-2 text-mute hover:bg-pearl hover:text-emerald" title="Duplicar"><Copy className="size-4" /></button>
                          <button onClick={() => setToDelete(p)} className="rounded-md p-2 text-mute hover:bg-rose-50 hover:text-rose-700" title="Excluir"><Trash2 className="size-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir produto"
        message={`"${toDelete?.name}" será excluído permanentemente, junto com suas fotos. Pedidos antigos continuam com o nome registrado. Se quiser apenas esconder da loja, use a chave "Visível".`}
        loading={del.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          try {
            await del.mutateAsync(toDelete!.id);
            toast('Produto excluído.');
            setToDelete(null);
          } catch (err) {
            toast(err instanceof Error ? err.message : 'Erro ao excluir.', 'error');
          }
        }}
      />
    </div>
  );
}

function FlagChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn('rounded-full border px-2 py-0.5 text-[0.7rem] transition-colors', active ? 'border-gold bg-champagne/40 text-gold-deep' : 'border-line text-mute hover:border-gold')}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

export function toInput(p: Product): ProductInput {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    short_description: p.short_description,
    description: p.description,
    material: p.material,
    category_id: p.category_id,
    collection_id: p.collection_id,
    price: p.price,
    promo_price: p.promo_price,
    stock: p.stock,
    is_active: p.is_active,
    is_new: p.is_new,
    is_bestseller: p.is_bestseller,
    is_featured: p.is_featured,
    is_demo: p.is_demo,
    sort_order: p.sort_order,
    images: p.images.map((i) => ({ url: i.url, path: i.path, alt: i.alt })),
    variants: p.variants.map((v) => ({ label: v.label, value: v.value, stock: v.stock })),
  };
}
