import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Capturado antes de o supabase-js limpar o hash da URL do link de redefinição de senha. */
export const isRecoveryLink = typeof window !== 'undefined' && window.location.hash.includes('type=recovery');

/** true quando as variáveis de ambiente do Supabase não foram configuradas. */
export const isDemoMode = !url || !anonKey;

export const supabase: SupabaseClient | null = isDemoMode
  ? null
  : createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'db-auth' },
    });

export const STORAGE_BUCKET = 'product-images';

export const siteUrl = ((import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin).replace(/\/$/, '');
