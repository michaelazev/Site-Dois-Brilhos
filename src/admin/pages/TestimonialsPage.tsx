import { useState } from 'react';
import { Loader2, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { useInvalidatingMutation, useTestimonials } from '@/hooks/queries';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/format';
import type { Testimonial } from '@/types';
import { ConfirmDialog, EmptyState, Field, LoadingBlock, Modal, PageHeader, Toggle } from '../components/ui';

export default function TestimonialsPage() {
  const { data: items = [], isLoading } = useTestimonials(true);
  const [editing, setEditing] = useState<Partial<Testimonial> | null>(null);
  const [toDelete, setToDelete] = useState<Testimonial | null>(null);
  const toast = useToast();
  const save = useInvalidatingMutation((t: Partial<Testimonial> & { name: string; text: string }) => api.saveTestimonial(t), [['testimonials']]);
  const del = useInvalidatingMutation((id: string) => api.deleteTestimonial(id), [['testimonials']]);

  return (
    <div>
      <PageHeader
        title="Depoimentos"
        description="Cadastre apenas depoimentos reais, com autorização das clientes. A seção só aparece na loja quando houver pelo menos um ativo."
        actions={<button className="admin-btn admin-btn-primary" onClick={() => setEditing({ name: '', text: '', city: '', rating: 5, is_active: true, sort_order: items.length + 1 })}><Plus className="size-4" /> Novo depoimento</button>}
      />
      {isLoading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState title="Nenhum depoimento ainda" description="Quando receber elogios pelo WhatsApp ou Instagram, peça autorização e cadastre aqui." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((t) => (
            <li key={t.id} className={cn('admin-card p-5', !t.is_active && 'opacity-60')}>
              <div className="flex gap-0.5 text-gold">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="size-3.5 fill-current" />)}</div>
              <p className="mt-3 font-display text-lg italic">“{t.text}”</p>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-mute">{t.name}{t.city ? ` · ${t.city}` : ''}</p>
                <div className="flex gap-1">
                  <button className="rounded p-1.5 text-mute hover:bg-pearl" onClick={() => setEditing(t)} aria-label="Editar"><Pencil className="size-4" /></button>
                  <button className="rounded p-1.5 text-mute hover:bg-rose-50 hover:text-rose-700" onClick={() => setToDelete(t)} aria-label="Excluir"><Trash2 className="size-4" /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Editar depoimento' : 'Novo depoimento'}>
        {editing && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!editing.name?.trim() || !editing.text?.trim()) return toast('Preencha nome e depoimento.', 'error');
              try {
                await save.mutateAsync({ ...editing, name: editing.name.trim(), text: editing.text.trim(), city: editing.city?.trim() || null } as Testimonial);
                toast('Depoimento salvo.');
                setEditing(null);
              } catch (err) {
                toast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error');
              }
            }}
          >
            <Field label="Nome da cliente"><input className="admin-input" value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Cidade" hint="opcional"><input className="admin-input" value={editing.city ?? ''} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></Field>
            <Field label="Depoimento"><textarea className="admin-input min-h-28" maxLength={400} value={editing.text ?? ''} onChange={(e) => setEditing({ ...editing, text: e.target.value })} /></Field>
            <Field label="Avaliação">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} onClick={() => setEditing({ ...editing, rating: n })} aria-label={`${n} estrelas`}>
                    <Star className={cn('size-6', n <= (editing.rating ?? 5) ? 'fill-gold text-gold' : 'text-line')} />
                  </button>
                ))}
              </div>
            </Field>
            <Toggle checked={editing.is_active ?? true} onChange={(v) => setEditing({ ...editing, is_active: v })} label="Exibir na loja" />
            <div className="flex justify-end gap-2">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
              <button className="admin-btn admin-btn-primary" disabled={save.isPending}>{save.isPending && <Loader2 className="size-4 animate-spin" />} Salvar</button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir depoimento"
        message="Este depoimento será excluído permanentemente."
        loading={del.isPending}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          await del.mutateAsync(toDelete!.id);
          toast('Excluído.');
          setToDelete(null);
        }}
      />
    </div>
  );
}
