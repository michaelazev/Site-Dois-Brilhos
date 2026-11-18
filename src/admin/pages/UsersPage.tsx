import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, Loader2, Plus, Shield, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { qk, useInvalidatingMutation } from '@/hooks/queries';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/format';
import { isDemoMode } from '@/lib/supabase';
import type { AdminUser } from '@/types';
import { ConfirmDialog, Field, LoadingBlock, Modal, PageHeader } from '../components/ui';

export default function UsersPage() {
  const { session } = useAuth();
  const toast = useToast();
  const { data: users = [], isLoading, error } = useQuery({ queryKey: qk.admins, queryFn: api.listAdmins });
  const [creating, setCreating] = useState(false);
  const [toRemove, setToRemove] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [formError, setFormError] = useState('');

  const create = useInvalidatingMutation((f: typeof form) => api.createAdmin(f), [qk.admins]);
  const remove = useInvalidatingMutation((id: string) => api.removeAdmin(id), [qk.admins]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setFormError('E-mail inválido.');
    if (!isDemoMode && form.password.length < 10) return setFormError('A senha deve ter pelo menos 10 caracteres.');
    try {
      await create.mutateAsync({ ...form, email: form.email.trim().toLowerCase() });
      toast('Administrador cadastrado. Envie a senha a essa pessoa por um canal seguro.');
      setCreating(false);
      setForm({ name: '', email: '', password: '' });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao cadastrar.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Administradores"
        description="Pessoas com acesso a este painel. Visitantes da loja nunca têm acesso."
        actions={<button className="admin-btn admin-btn-primary" onClick={() => setCreating(true)}><Plus className="size-4" /> Novo administrador</button>}
      />

      {isLoading ? (
        <LoadingBlock />
      ) : error ? (
        <div className="admin-card p-5 text-sm text-rose-800">
          Não foi possível carregar os administradores: {(error as Error).message}. Verifique se a Edge Function <code>admin-users</code> foi publicada (veja o README).
        </div>
      ) : (
        <ul className="admin-card divide-y divide-line">
          {users.map((u) => (
            <li key={u.user_id} className="flex items-center gap-4 p-4">
              <span className="grid size-10 place-items-center rounded-full bg-pearl text-emerald">
                {u.role === 'owner' ? <Crown className="size-4" /> : <Shield className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{u.name || u.email}{u.email === session?.email && <span className="ml-2 text-xs text-mute">(você)</span>}</p>
                <p className="truncate text-xs text-mute">{u.email} · {u.role === 'owner' ? 'Proprietário' : 'Administrador'} · desde {formatDate(u.created_at)}</p>
              </div>
              {u.role !== 'owner' && u.email !== session?.email && (
                <button className="rounded p-2 text-mute hover:bg-rose-50 hover:text-rose-700" onClick={() => setToRemove(u)} aria-label={`Remover ${u.email}`}>
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Novo administrador">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Nome"><input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="E-mail"><input className="admin-input" type="email" autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Senha inicial" hint="mín. 10 caracteres">
            <input className="admin-input" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <p className="text-xs text-mute">A pessoa poderá trocar a senha depois em “Esqueci minha senha” na tela de login.</p>
          {formError && <p className="text-sm text-rose-700" role="alert">{formError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setCreating(false)}>Cancelar</button>
            <button className="admin-btn admin-btn-primary" disabled={create.isPending}>{create.isPending && <Loader2 className="size-4 animate-spin" />} Cadastrar</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toRemove}
        title="Remover administrador"
        message={`${toRemove?.email} perderá o acesso ao painel e a conta será excluída.`}
        confirmLabel="Remover"
        loading={remove.isPending}
        onClose={() => setToRemove(null)}
        onConfirm={async () => {
          try {
            await remove.mutateAsync(toRemove!.user_id);
            toast('Acesso removido.');
            setToRemove(null);
          } catch (err) {
            toast(err instanceof Error ? err.message : 'Erro ao remover.', 'error');
          }
        }}
      />
    </div>
  );
}
