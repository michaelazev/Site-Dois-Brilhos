import demo from '@/data/demo-data.json';
import type { Product, ProductFilter, SiteSettings } from '@/types';

export const DEFAULT_SETTINGS = demo.settings as unknown as SiteSettings;

/** Mescla configurações salvas com os padrões (campos novos nunca ficam vazios). */
export function mergeSettings(rows: Array<{ key: string; value: unknown }>): SiteSettings {
  const result = structuredClone(DEFAULT_SETTINGS) as unknown as Record<string, unknown>;
  for (const row of rows) {
    const base = result[row.key];
    if (base && typeof base === 'object' && !Array.isArray(base) && row.value && typeof row.value === 'object' && !Array.isArray(row.value)) {
      result[row.key] = { ...(base as object), ...(row.value as object) };
    } else if (row.value !== null && row.value !== undefined) {
      result[row.key] = row.value;
    }
  }
  return result as unknown as SiteSettings;
}

export function sortProduct(p: Product): Product {
  return {
    ...p,
    price: Number(p.price),
    promo_price: p.promo_price == null ? null : Number(p.promo_price),
    images: [...(p.images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order),
    variants: [...(p.variants ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  };
}

export function matchesSearch(p: Product, filter: ProductFilter): boolean {
  if (filter.search) {
    const s = normalize(filter.search);
    const hay = normalize(`${p.name} ${p.material ?? ''} ${p.short_description ?? ''} ${p.category?.name ?? ''}`);
    if (!s.split(/\s+/).every((t) => hay.includes(t))) return false;
  }
  if (filter.material && p.material !== filter.material) return false;
  return true;
}

export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
