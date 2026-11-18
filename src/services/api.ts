import { isDemoMode, supabase } from '@/lib/supabase';
import type { StoreApi } from './api.types';
import { demoApi } from './demoApi';
import { createSupabaseApi } from './supabaseApi';

/**
 * Ponto único de acesso aos dados.
 * - Sem variáveis do Supabase → modo demonstração (localStorage).
 * - Com variáveis → Supabase (PostgreSQL + Auth + Storage).
 */
export const api: StoreApi = isDemoMode ? demoApi : createSupabaseApi(supabase!);
export { isDemoMode };
