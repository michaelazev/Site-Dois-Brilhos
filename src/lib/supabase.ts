import type { SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Capturado antes de o supabase-js limpar o hash da URL do link de redefinição de senha. */
export const isRecoveryLink = typeof window !== 'undefined' && window.location.hash.includes('type=recovery');

/** true quando as variáveis de ambiente do Supabase não foram configuradas. */
export const isDemoMode = !SUPABASE_URL || !SUPABASE_ANON_KEY;

let clientPromise: Promise<SupabaseClient> | null = null;

/**
 * Cliente completo do Supabase (login, Storage, Edge Functions), carregado SOB DEMANDA.
 * A vitrine não precisa dele: lê o catálogo por REST simples (ver services/supabaseApi.ts),
 * o que tira ~60 kB do carregamento inicial no celular. O painel e o checkout o carregam.
 */
export function getSupabase(): Promise<SupabaseClient> {
  if (isDemoMode) return Promise.reject(new Error('Supabase não configurado'));
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'db-auth' },
    }),
  );
  return clientPromise;
}

export const STORAGE_BUCKET = 'product-images';

export const siteUrl = ((import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin).replace(/\/$/, '');
