import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { ProductFilter } from '@/types';
import { DEFAULT_SETTINGS } from '@/services/shared';

export const qk = {
  settings: ['settings'] as const,
  categories: (all = false) => ['categories', all] as const,
  collections: (all = false) => ['collections', all] as const,
  products: (f: ProductFilter = {}) => ['products', f] as const,
  product: (slug: string) => ['product', slug] as const,
  productById: (id: string) => ['product-id', id] as const,
  testimonials: (all = false) => ['testimonials', all] as const,
  orders: ['orders'] as const,
  order: (id: string) => ['order', id] as const,
  admins: ['admins'] as const,
};

/**
 * Cache local "mostra já, atualiza em seguida" para os dados PÚBLICOS da loja.
 * Na segunda visita (muito comum vindo do Instagram/WhatsApp) a página aparece
 * na hora com a última cópia salva no aparelho e é atualizada em segundo plano,
 * sem conteúdo "pipocando" na tela. Nunca usado para dados do painel.
 */
// Trocar a versão sempre que o formato dos dados mudar (descarta cópias antigas nos aparelhos).
const CACHE_PREFIX = 'db-cache-v2:';
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function readCache<T>(key: readonly unknown[]): T | undefined {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + JSON.stringify(key));
    if (!raw) return undefined;
    const { t, d } = JSON.parse(raw) as { t: number; d: T };
    return Date.now() - t < CACHE_MAX_AGE ? d : undefined;
  } catch {
    return undefined;
  }
}

function writeCache(key: readonly unknown[], data: unknown) {
  try {
    localStorage.setItem(CACHE_PREFIX + JSON.stringify(key), JSON.stringify({ t: Date.now(), d: data }));
  } catch {
    /* armazenamento cheio ou bloqueado: segue sem cache */
  }
}

function cachedPublic<T>(key: readonly unknown[], fn: () => Promise<T>) {
  const cached = readCache<T>(key);
  return {
    queryKey: key,
    queryFn: async () => {
      const data = await fn();
      writeCache(key, data);
      return data;
    },
    ...(cached !== undefined ? { initialData: cached, initialDataUpdatedAt: 0 } : {}),
  };
}

export function useSettings() {
  const cached = readCache<typeof DEFAULT_SETTINGS>(qk.settings);
  return useQuery({
    ...cachedPublic(qk.settings, api.getSettings),
    ...(cached ? {} : { placeholderData: DEFAULT_SETTINGS }),
    // Segurança extra: qualquer bloco que falte (ex.: cópia antiga no aparelho) vem do padrão.
    select: (s) => ({ ...DEFAULT_SETTINGS, ...s }),
    staleTime: 5 * 60_000,
  });
}

export function useCategories(includeInactive = false) {
  return useQuery(
    includeInactive
      ? { queryKey: qk.categories(true), queryFn: () => api.listCategories({ includeInactive: true }) }
      : cachedPublic(qk.categories(false), () => api.listCategories()),
  );
}

export function useCollections(includeInactive = false) {
  return useQuery(
    includeInactive
      ? { queryKey: qk.collections(true), queryFn: () => api.listCollections({ includeInactive: true }) }
      : cachedPublic(qk.collections(false), () => api.listCollections()),
  );
}

export function useProducts(filter: ProductFilter = {}, enabled = true) {
  // listas da loja (sem busca e sem itens ocultos) usam o cache local
  const publicList = !filter.includeInactive && !filter.search && !filter.ids;
  return useQuery({
    ...(publicList ? cachedPublic(qk.products(filter), () => api.listProducts(filter)) : { queryKey: qk.products(filter), queryFn: () => api.listProducts(filter) }),
    enabled,
  });
}

export function useProduct(slug: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.product(slug),
    queryFn: () => api.getProduct(slug),
    enabled: !!slug,
    // Abre a página do produto na hora usando os dados que já vieram na listagem
    // (o card clicado), e completa em segundo plano.
    placeholderData: () => {
      for (const [, list] of qc.getQueriesData<import('@/types').Product[]>({ queryKey: ['products'] })) {
        const hit = list?.find((p) => p.slug === slug);
        if (hit) return hit;
      }
      return undefined;
    },
  });
}

export function useTestimonials(includeInactive = false) {
  return useQuery(
    includeInactive
      ? { queryKey: qk.testimonials(true), queryFn: () => api.listTestimonials({ includeInactive: true }) }
      : cachedPublic(qk.testimonials(false), () => api.listTestimonials()),
  );
}

/** Mutação genérica que invalida as consultas informadas ao concluir. */
export function useInvalidatingMutation<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>, keys: ReadonlyArray<readonly unknown[]>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    },
  });
}
