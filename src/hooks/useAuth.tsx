import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '@/services/api';
import type { Session } from '@/services/api.types';

interface AuthState {
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (s: Session | null) => {
    setSession(s);
    setIsAdmin(s ? await api.auth.isAdmin() : false);
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;
    api.auth.getSession().then((s) => {
      if (alive) refresh(s);
    });
    const off = api.auth.onChange((s) => {
      if (alive) refresh(s);
    });
    return () => {
      alive = false;
      off();
    };
  }, [refresh]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const s = await api.auth.signIn(email, password);
        const admin = await api.auth.isAdmin();
        if (!admin) {
          await api.auth.signOut();
          throw new Error('Esta conta não tem permissão de administrador.');
        }
        setSession(s);
        setIsAdmin(true);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    await api.auth.signOut();
    setSession(null);
    setIsAdmin(false);
  }, []);

  return <AuthContext.Provider value={{ session, isAdmin, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
