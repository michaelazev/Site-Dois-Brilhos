import { useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { useCategories, useCollections, useInvalidatingMutation, useProducts } from '@/hooks/queries';
import { useToast } from '@/components/ui/Toast';
import { cn, slugify } from '@/lib/format';
import type { Category } from '@/types';
import { ConfirmDialog, EmptyState, Field, LoadingBlock, Modal, PageHeader, Toggle } from '../components/ui';
import { SingleImageUploader } from '../components/ImageUploader';

type Kind = 'category' | 'collection';

const LABELS = {
  category: { title: 'Categorias', single: 'categoria', path: 'categoria', desc: 'Organize a loja (Colares, Brincos…). "Lançamentos" e "Mais vendidos" são automáticos, pelas marcações de cada produto.' },
  collection: { title: 'Coleções', single: 'coleção', path: 'colecao', desc: 'Agrupamentos especiais de peças (ex.: Dia dos Namorados). As coleções em destaque aparecem na página inicial.' },
};

export default function TaxonomyPage({ kind }: { kind: Kind }) {
  const L = LABELS[kind];
  const cats = useCategories(true);
  const cols = useCollections(true);
  const { data: items = [], isLoading } = kind === 'category' ? cats : cols;
  const { data: products = [] } = useProducts({ includeInactive: true });
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const toast = useToast();

  const keys = [[kind === 'category' ? 'categories' : 'collections'], ['products']];
  const save = useInvalidatingMutation((c: Partial<Category> & { name: string; slug: string }) => (kind === 'category' ? api.saveCategory(c) : api.saveCollection(c)), keys);
  const del = useInvalidatingMutation((id: string) => (kind === 'category' ? api.deleteCategory(id) : api.deleteCollection(id)), keys);

  const count = (id: string) => products.filter((p) => (kind === 'category' ? p.category_id : p.collection_id) === id).length;

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    try {
      // Renumera 1..n e salva apenas o que mudou
      for (const [i, c] of reordered.entries()) {
        if (c.sort_order !== i + 1) await save.mutateAsync({ ...c, sort_order: i + 1 });
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao reordenar.', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title={L.title}
        description={L.desc}
        actions={
          <button className="admin-btn admin-btn-primary" onClick={() => setEditing({ name: '', slug: '', description: '', image_url: '', is_active: true, is_featured: true, sort_order: (items[items.length - 1]?.sort_order ?? 0) + 1 })}>
            <Plus className="size-4" /> Nova {L.single}
          </button>
        }
      />

      {isLoading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState title={`Nenhuma ${L.single} cadastrada`} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c, i) => (
            <li key={c.id} className={cn('admin-card flex gap-4 p-3', !c.is_active && 'opacity-60')}>
              <img src={c.image_url || '/favicon.svg'} alt="" className="h-24 w-20 shrink-0 rounded-md bg-pearl object-cover" />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-display text-xl text-emerald">{c.name}</p>
                  {c.is_featured && <Star className="mt-1 size-3.5 shrink-0 fill-gold text-gold" aria-label="Em destaque" />}
                </div>
                <p className="text-xs text-mute">/{L.path}/{c.slug}</p>
                <p className="mt-1 text-xs text-mute">{count(c.id)} produtos{!c.is_active && ' · oculta'}</p>
                <div className="mt-auto flex gap-1 pt-2">
                  <button className="rounded p-1.5 text-mute hover:bg-pearl disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Mover para cima"><ArrowUp className="size-3.5" /></button>
                  <button className="rounded p-1.5 text-mute hover:bg-pearl disabled:opacity-30" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Mover para baixo"><ArrowDown className="size-3.5" /></button>
                  <span className="flex-1" />
                  <button className="rounded p-1.5 text-mute hover:bg-pearl hover:text-emerald" onClick={() => setEditing(c)} aria-label="Editar"><Pencil className="size-3.5" /></button>
                  <button className="rounded p-1.5 text-mute hover:bg-rose-50 hover:text-rose-700" onClick={() => setToDelete(c)} aria-label="Excluir"><Trash2 className="size-3.5" /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <EditModal
        kind={kind}
        value={editing}
        onClose={() => setEditing(null)}
        saving={save.isPending}
        onSave={async (c) => {
          try {
            await save.mutateAsync(c);
            toast('Salvo com sucesso.');
            setEditing(null);
          } catch (err) {
            toast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error');
          }
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        title={`Excluir ${L.single}`}
        message={`"${toDelete?.name}" será excluída. ${toDelete ? count(toDelete.id) : 0} produto(s) ficarão sem ${L.single}, mas não serão apagados.`}
        loading={del.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          try {
            await del.mutateAsync(toDelete!.id);
            toast('Excluída.');
            setToDelete(null);
          } catch (err) {
            toast(err instanceof Error ? err.message : 'Erro ao excluir.', 'error');
          }
        }}
      />
    </div>
  );
}

function EditModal({
  kind,
  value,
  onClose,
  onSave,
  saving,
}: {
  kind: Kind;
  value: Partial<Category> | null;
  onClose: () => void;
  onSave: (c: Partial<Category> & { name: string; slug: string }) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<Category>>({});
  const [lastId, setLastId] = useState<string | undefined | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState('');

  // Reinicia o formulário quando outro item é aberto
  const currentId = value ? value.id ?? 'new' : null;
  if (currentId !== lastId) {
    setLastId(currentId);
    setForm(value ?? {});
    setSlugTouched(!!value?.id);
    setError('');
  }

  const L = LABELS[kind];
  return (
    <Modal open={!!value} onClose={onClose} title={value?.id ? `Editar ${L.single}` : `Nova ${L.single}`}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.name?.trim()) return setError('Informe o nome.');
          if (!form.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) return setError('Endereço inválido.');
          const { id, name, slug, description, image_url, sort_order, is_active, is_featured } = form;
          onSave({ ...(id ? { id } : {}), name: name.trim(), slug, description: description || null, image_url: image_url || null, sort_order: sort_order ?? 0, is_active: is_active ?? true, is_featured: is_featured ?? false });
        }}
      >
        <Field label="Nome">
          <input
            className="admin-input"
            value={form.name ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }))}
            autoFocus
          />
        </Field>
        <Field label="Endereço" hint={`/${L.path}/${form.slug || '…'}`}>
          <input className="admin-input font-mono text-xs" value={form.slug ?? ''} onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: slugify(e.target.value) })); }} />
        </Field>
        <Field label="Descrição">
          <textarea className="admin-input min-h-20" value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </Field>
        <Field label="Imagem de capa">
          <SingleImageUploader value={form.image_url ?? ''} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} folder={kind === 'category' ? 'categorias' : 'colecoes'} aspect={kind === 'category' ? 'aspect-[3/4] max-w-[12rem]' : 'aspect-[3/2]'} />
        </Field>
        <div className="space-y-3">
          <Toggle checked={form.is_active ?? true} onChange={(v) => setForm((f) => ({ ...f, is_active: v }))} label="Visível na loja" />
          <Toggle checked={form.is_featured ?? false} onChange={(v) => setForm((f) => ({ ...f, is_featured: v }))} label="Destacar na página inicial" />
        </div>
        {error && <p className="text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="admin-btn admin-btn-primary" disabled={saving}>{saving && <Loader2 className="size-4 animate-spin" />} Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
