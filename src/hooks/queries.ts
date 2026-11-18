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

export function useSettings() {
  return useQuery({ queryKey: qk.settings, queryFn: api.getSettings, placeholderData: DEFAULT_SETTINGS, staleTime: 5 * 60_000 });
}

export function useCategories(includeInactive = false) {
  return useQuery({ queryKey: qk.categories(includeInactive), queryFn: () => api.listCategories({ includeInactive }) });
}

export function useCollections(includeInactive = false) {
  return useQuery({ queryKey: qk.collections(includeInactive), queryFn: () => api.listCollections({ includeInactive }) });
}

export function useProducts(filter: ProductFilter = {}, enabled = true) {
  return useQuery({ queryKey: qk.products(filter), queryFn: () => api.listProducts(filter), enabled });
}

export function useProduct(slug: string) {
  return useQuery({ queryKey: qk.product(slug), queryFn: () => api.getProduct(slug), enabled: !!slug });
}

export function useTestimonials(includeInactive = false) {
  return useQuery({ queryKey: qk.testimonials(includeInactive), queryFn: () => api.listTestimonials({ includeInactive }) });
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
