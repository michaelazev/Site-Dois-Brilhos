import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product, ProductVariant } from '@/types';
import { effectivePrice } from '@/lib/format';

export interface CartItem {
  key: string;
  product_id: string;
  slug: string;
  name: string;
  image: string | null;
  unit_price: number;
  variant_id: string | null;
  variant_label: string | null;
  quantity: number;
  max_stock: number;
  is_demo: boolean;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  lastAddedAt: number;
  add: (product: Product, quantity?: number, variant?: ProductVariant | null) => { ok: boolean; message?: string };
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  reconcile: (products: Product[]) => string[];
}

export const MAX_PER_ITEM = 20;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      lastAddedAt: 0,

      add(product, quantity = 1, variant = null) {
        const stock = variant ? variant.stock : product.stock;
        if (stock <= 0) return { ok: false, message: 'Esta peça está sem estoque no momento.' };
        const key = `${product.id}:${variant?.id ?? 'base'}`;
        const items = [...get().items];
        const existing = items.find((i) => i.key === key);
        const limit = Math.min(stock, MAX_PER_ITEM);
        if (existing) {
          if (existing.quantity >= limit) return { ok: false, message: `Quantidade máxima disponível: ${limit}.` };
          existing.quantity = Math.min(existing.quantity + quantity, limit);
          existing.unit_price = effectivePrice(product);
          existing.max_stock = stock;
        } else {
          items.push({
            key,
            product_id: product.id,
            slug: product.slug,
            name: product.name,
            image: product.images[0]?.url ?? null,
            unit_price: effectivePrice(product),
            variant_id: variant?.id ?? null,
            variant_label: variant ? `${variant.label}: ${variant.value}` : null,
            quantity: Math.min(quantity, limit),
            max_stock: stock,
            is_demo: product.is_demo,
          });
        }
        set({ items, isOpen: true, lastAddedAt: Date.now() });
        return { ok: true };
      },
      remove(key) {
        set({ items: get().items.filter((i) => i.key !== key) });
      },
      setQuantity(key, quantity) {
        set({
          items: get().items.map((i) =>
            i.key === key ? { ...i, quantity: Math.max(1, Math.min(quantity, Math.min(i.max_stock, MAX_PER_ITEM))) } : i,
          ),
        });
      },
      clear() {
        set({ items: [] });
      },
      open() {
        set({ isOpen: true });
      },
      close() {
        set({ isOpen: false });
      },
      /** Atualiza preços/estoques com os dados atuais do banco. Retorna avisos. */
      reconcile(products) {
        const warnings: string[] = [];
        const next: CartItem[] = [];
        for (const item of get().items) {
          const p = products.find((x) => x.id === item.product_id);
          if (!p) {
            warnings.push(`"${item.name}" não está mais disponível e foi removido do carrinho.`);
            continue;
          }
          const variant = item.variant_id ? p.variants.find((v) => v.id === item.variant_id) : null;
          if (item.variant_id && !variant) {
            warnings.push(`A opção escolhida de "${item.name}" não está mais disponível.`);
            continue;
          }
          const stock = variant ? variant.stock : p.stock;
          if (stock <= 0) {
            warnings.push(`"${item.name}" ficou sem estoque e foi removido do carrinho.`);
            continue;
          }
          const price = effectivePrice(p);
          if (price !== item.unit_price) warnings.push(`O preço de "${item.name}" foi atualizado.`);
          const quantity = Math.min(item.quantity, stock, MAX_PER_ITEM);
          if (quantity < item.quantity) warnings.push(`A quantidade de "${item.name}" foi ajustada ao estoque disponível (${stock}).`);
          next.push({ ...item, name: p.name, unit_price: price, max_stock: stock, quantity, image: p.images[0]?.url ?? item.image });
        }
        set({ items: next });
        return warnings;
      },
    }),
    {
      name: 'db-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((a, i) => a + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((a, i) => a + i.quantity * i.unit_price, 0);
