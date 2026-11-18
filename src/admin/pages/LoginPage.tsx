import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { isDemoMode, isRecoveryLink } from '@/lib/supabase';
import { Logo, Sparkle } from '@/components/brand/Logo';

export default function LoginPage() {
  const { session, isAdmin, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  if (isRecoveryLink && !loading && session) return <NewPasswordForm onDone={() => navigate('/admin', { replace: true })} />;
  if (!loading && session && isAdmin) return <Navigate to={from} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!isDemoMode && (!email.includes('@') || password.length < 6)) {
      setError('Informe e-mail e senha válidos.');
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setError('');
    if (!email.includes('@')) {
      setError('Digite seu e-mail para receber o link de redefinição.');
      return;
    }
    try {
      await api.auth.sendPasswordReset(email.trim());
      setInfo('Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar o e-mail.');
    }
  };

  return (
    <div className="grain relative grid min-h-screen place-items-center overflow-hidden bg-emerald-deep px-4">
      <Sparkle className="pointer-events-none absolute -right-32 -top-32 size-[34rem] text-gold/[0.07]" strokeWidth={0.15} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm rounded-2xl bg-ivory p-8 shadow-2xl"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo />
          <p className="mt-3 flex items-center gap-1.5 text-xs uppercase tracking-[0.22em] text-mute">
            <Lock className="size-3" /> Painel administrativo
          </p>
        </div>

        {isDemoMode && (
          <p className="mb-6 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <strong>Modo demonstração:</strong> o Supabase ainda não foi configurado, então qualquer e-mail/senha entra. Após a configuração, somente administradores cadastrados terão acesso.
          </p>
        )}

        <form onSubmit={submit} className="space-y-4" noValidate>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">E-mail</span>
            <input className="admin-input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Senha</span>
            <input className="admin-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="text-sm text-rose-700" role="alert">{error}</p>}
          {info && <p className="text-sm text-emerald" role="status">{info}</p>}
          <button className="admin-btn admin-btn-primary w-full !py-2.5" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />} Entrar
          </button>
          {!isDemoMode && (
            <button type="button" onClick={reset} className="w-full text-center text-xs text-mute hover:text-emerald">
              Esqueci minha senha
            </button>
          )}
        </form>
      </motion.div>
    </div>
  );
}

function NewPasswordForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 10) return setError('A senha deve ter pelo menos 10 caracteres.');
    if (password !== confirm) return setError('As senhas não conferem.');
    setBusy(true);
    try {
      await api.auth.updatePassword(password);
      window.history.replaceState(null, '', '/admin/login');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível alterar a senha.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-emerald-deep px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-ivory p-8 shadow-2xl" noValidate>
        <div className="mb-4 text-center">
          <Logo />
          <p className="mt-3 text-sm text-mute">Defina sua nova senha</p>
        </div>
        <input className="admin-input" type="password" autoComplete="new-password" placeholder="Nova senha" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className="admin-input" type="password" autoComplete="new-password" placeholder="Repita a nova senha" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && <p className="text-sm text-rose-700" role="alert">{error}</p>}
        <button className="admin-btn admin-btn-primary w-full !py-2.5" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />} Salvar nova senha
        </button>
      </form>
    </div>
  );
}
