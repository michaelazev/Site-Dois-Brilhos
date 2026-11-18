/**
 * MODO DEMONSTRAÇÃO
 * Implementação da API que guarda tudo no localStorage do navegador.
 * É usada automaticamente enquanto o Supabase não estiver configurado,
 * para que a loja e o painel possam ser testados por completo.
 * Nada aqui é enviado para servidores.
 */
import demo from '@/data/demo-data.json';
import { blobToDataUrl, compressImage } from '@/lib/image';
import { uid } from '@/lib/format';
import type {
  AdminUser,
  Category,
  Collection,
  Order,
  Product,
  ProductImage,
  ProductVariant,
  Testimonial,
} from '@/types';
import type { Session, StoreApi } from './api.types';
import { matchesSearch, mergeSettings, sortProduct } from './shared';

const KEY = 'db-demo-v1';
const SESSION_KEY = 'db-demo-session';

type ProductRow = Omit<Product, 'images' | 'variants' | 'category' | 'collection'>;

interface DemoDb {
  categories: Category[];
  collections: Collection[];
  products: ProductRow[];
  images: ProductImage[];
  variants: ProductVariant[];
  orders: Order[];
  testimonials: Testimonial[];
  settings: Array<{ key: string; value: unknown }>;
  admins: AdminUser[];
  orderSeq: number;
}

function seed(): DemoDb {
  const now = Date.now();
  const products: ProductRow[] = demo.products.map((p, i) => ({
    ...p,
    is_active: true,
    is_demo: true,
    view_count: 0,
    sort_order: i,
    created_at: new Date(now - i * 86_400_000).toISOString(),
  }));
  const images: ProductImage[] = demo.products.flatMap((p) => [
    { id: uid(), product_id: p.id, url: `/demo/${p.slug}-1.webp`, path: null, alt: `${p.name} (imagem de exemplo)`, sort_order: 0, is_primary: true },
    { id: uid(), product_id: p.id, url: `/demo/${p.slug}-2.webp`, path: null, alt: `${p.name} — detalhe (imagem de exemplo)`, sort_order: 1, is_primary: false },
  ]);
  const variants: ProductVariant[] = demo.variants.map((v, i) => ({
    id: uid(),
    product_id: demo.products.find((p) => p.slug === v.product_slug)!.id,
    label: v.label,
    value: v.value,
    stock: v.stock,
    sort_order: i,
  }));
  return {
    categories: demo.categories,
    collections: demo.collections,
    products,
    images,
    variants,
    orders: [],
    testimonials: [],
    settings: [],
    admins: [{ user_id: 'demo-admin', email: 'demo@doisbrilhos.local', name: 'Administrador (demo)', role: 'owner', created_at: new Date().toISOString() }],
    orderSeq: 1000,
  };
}

let cache: DemoDb | null = null;

function db(): DemoDb {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as DemoDb) : seed();
  } catch {
    cache = seed();
  }
  return cache;
}

function commit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    throw new Error('Espaço do navegador esgotado no modo demonstração. Use imagens menores ou conecte o Supabase.');
  }
}

const delay = <T,>(v: T, ms = 120) => new Promise<T>((r) => setTimeout(() => r(v), ms));
const clone = <T,>(v: T): T => structuredClone(v);

function hydrate(row: ProductRow): Product {
  const d = db();
  const c = d.categories.find((x) => x.id === row.category_id);
  const col = d.collections.find((x) => x.id === row.collection_id);
  return sortProduct({
    ...row,
    category: c ? { id: c.id, name: c.name, slug: c.slug } : null,
    collection: col ? { id: col.id, name: col.name, slug: col.slug } : null,
    images: d.images.filter((i) => i.product_id === row.id),
    variants: d.variants.filter((v) => v.product_id === row.id),
  });
}

const listeners = new Set<(s: Session | null) => void>();
function currentSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export const demoApi: StoreApi = {
  mode: 'demo',

  auth: {
    async getSession() {
      return currentSession();
    },
    async signIn(email) {
      const s: Session = { userId: 'demo-admin', email: email || 'demo@doisbrilhos.local' };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
      listeners.forEach((l) => l(s));
      return delay(s, 400);
    },
    async signOut() {
      sessionStorage.removeItem(SESSION_KEY);
      listeners.forEach((l) => l(null));
    },
    async isAdmin() {
      return currentSession() !== null;
    },
    onChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    async sendPasswordReset() {
      await delay(null, 300);
    },
    async updatePassword() {
      await delay(null, 300);
    },
  },

  async listCategories(opts) {
    const rows = db().categories.filter((c) => opts?.includeInactive || c.is_active);
    return delay(clone(rows).sort((a, b) => a.sort_order - b.sort_order));
  },
  async listCollections(opts) {
    const rows = db().collections.filter((c) => opts?.includeInactive || c.is_active);
    return delay(clone(rows).sort((a, b) => a.sort_order - b.sort_order));
  },
  async listProducts(filter = {}) {
    const d = db();
    let rows = d.products.filter((p) => filter.includeInactive || p.is_active);
    if (filter.categorySlug) {
      const c = d.categories.find((x) => x.slug === filter.categorySlug);
      rows = rows.filter((p) => c && p.category_id === c.id);
    }
    if (filter.collectionSlug) {
      const c = d.collections.find((x) => x.slug === filter.collectionSlug);
      rows = rows.filter((p) => c && p.collection_id === c.id);
    }
    if (filter.flag) rows = rows.filter((p) => p[filter.flag!]);
    if (filter.ids) rows = rows.filter((p) => filter.ids!.includes(p.id));
    const products = rows.map(hydrate).filter((p) => matchesSearch(p, filter));
    products.sort((a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at));
    return delay(clone(products));
  },
  async getProduct(slug) {
    const row = db().products.find((p) => p.slug === slug && p.is_active);
    return delay(row ? clone(hydrate(row)) : null);
  },
  async getProductById(id) {
    const row = db().products.find((p) => p.id === id);
    return delay(row ? clone(hydrate(row)) : null);
  },
  async getSettings() {
    return delay(mergeSettings(db().settings), 60);
  },
  async listTestimonials(opts) {
    const rows = db().testimonials.filter((t) => opts?.includeInactive || t.is_active);
    return delay(clone(rows).sort((a, b) => a.sort_order - b.sort_order));
  },
  async registerView(productId) {
    const p = db().products.find((x) => x.id === productId);
    if (p) {
      p.view_count += 1;
      commit();
    }
  },
  async createSiteOrder(payload) {
    const d = db();
    const items = payload.items.map((i) => {
      const p = d.products.find((x) => x.id === i.product_id && x.is_active);
      if (!p) throw new Error('Produto indisponível');
      const unit = p.promo_price != null && p.promo_price < p.price ? p.promo_price : p.price;
      return { id: uid(), product_id: p.id, product_name: p.name, variant: i.variant, quantity: i.quantity, unit_price: unit };
    });
    const subtotal = items.reduce((a, i) => a + i.unit_price * i.quantity, 0);
    d.orderSeq += 1;
    d.orders.unshift({
      id: uid(),
      number: d.orderSeq,
      reference: payload.reference,
      source: 'site',
      status: 'pendente',
      attendant: payload.attendant,
      customer_name: payload.customer_name,
      customer_phone: null,
      city: payload.city,
      neighborhood: payload.neighborhood,
      address: payload.address,
      notes: payload.notes,
      internal_notes: null,
      subtotal,
      shipping: 0,
      discount: 0,
      total: subtotal,
      created_at: new Date().toISOString(),
      items,
    });
    commit();
    return delay(payload.reference);
  },

  // ---------------- Administração ----------------
  async saveProduct(input) {
    const d = db();
    const id = input.id ?? uid();
    const existing = d.products.find((p) => p.id === id);
    if (d.products.some((p) => p.slug === input.slug && p.id !== id)) throw new Error('Já existe um produto com este endereço (slug).');
    const { images, variants, ...fields } = input;
    const row: ProductRow = {
      ...(existing ?? { view_count: 0, created_at: new Date().toISOString() }),
      ...fields,
      id,
      updated_at: new Date().toISOString(),
    } as ProductRow;
    if (existing) Object.assign(existing, row);
    else d.products.unshift(row);
    d.images = d.images.filter((i) => i.product_id !== id).concat(
      images.map((img, i) => ({ id: uid(), product_id: id, url: img.url, path: img.path, alt: img.alt, sort_order: i, is_primary: i === 0 })),
    );
    d.variants = d.variants.filter((v) => v.product_id !== id).concat(
      variants.map((v, i) => ({ id: uid(), product_id: id, label: v.label, value: v.value, stock: v.stock, sort_order: i })),
    );
    commit();
    return delay(clone(hydrate(row)));
  },
  async deleteProduct(id) {
    const d = db();
    d.products = d.products.filter((p) => p.id !== id);
    d.images = d.images.filter((i) => i.product_id !== id);
    d.variants = d.variants.filter((v) => v.product_id !== id);
    commit();
  },
  async uploadImage(file) {
    const blob = await compressImage(file, 1200, 0.8);
    const url = await blobToDataUrl(blob);
    return { url, path: `demo/${uid()}` };
  },
  async deleteImage() {},
  async saveCategory(c) {
    return saveIn('categories', c) as Promise<Category>;
  },
  async deleteCategory(id) {
    const d = db();
    d.categories = d.categories.filter((c) => c.id !== id);
    d.products.forEach((p) => p.category_id === id && (p.category_id = null));
    commit();
  },
  async saveCollection(c) {
    return saveIn('collections', c) as Promise<Collection>;
  },
  async deleteCollection(id) {
    const d = db();
    d.collections = d.collections.filter((c) => c.id !== id);
    d.products.forEach((p) => p.collection_id === id && (p.collection_id = null));
    commit();
  },
  async listOrders() {
    return delay(clone(db().orders).sort((a, b) => b.created_at.localeCompare(a.created_at)));
  },
  async getOrder(id) {
    return delay(clone(db().orders.find((o) => o.id === id) ?? null));
  },
  async saveOrder(input) {
    const d = db();
    const existing = input.id ? d.orders.find((o) => o.id === input.id) : undefined;
    if (existing) {
      Object.assign(existing, input, { updated_at: new Date().toISOString() });
      commit();
      return delay(clone(existing));
    }
    d.orderSeq += 1;
    const order: Order = { ...input, id: uid(), number: d.orderSeq, created_at: new Date().toISOString() };
    d.orders.unshift(order);
    commit();
    return delay(clone(order));
  },
  async updateOrderStatus(id, status) {
    const o = db().orders.find((x) => x.id === id);
    if (o) {
      o.status = status;
      commit();
    }
  },
  async deleteOrder(id) {
    const d = db();
    d.orders = d.orders.filter((o) => o.id !== id);
    commit();
  },
  async saveTestimonial(t) {
    return saveIn('testimonials', { rating: 5, is_active: true, city: null, ...t }) as Promise<Testimonial>;
  },
  async deleteTestimonial(id) {
    const d = db();
    d.testimonials = d.testimonials.filter((t) => t.id !== id);
    commit();
  },
  async saveSetting(key, value) {
    const d = db();
    const row = d.settings.find((s) => s.key === key);
    if (row) row.value = value;
    else d.settings.push({ key, value });
    commit();
    await delay(null);
  },
  async listAdmins() {
    return delay(clone(db().admins));
  },
  async createAdmin({ email, name }) {
    const d = db();
    if (d.admins.some((a) => a.email === email)) throw new Error('Este e-mail já é administrador.');
    d.admins.push({ user_id: uid(), email, name, role: 'admin', created_at: new Date().toISOString() });
    commit();
  },
  async removeAdmin(userId) {
    const d = db();
    if (userId === 'demo-admin') throw new Error('Não é possível remover o proprietário.');
    d.admins = d.admins.filter((a) => a.user_id !== userId);
    commit();
  },
};

function saveIn<T extends { id: string }>(table: 'categories' | 'collections' | 'testimonials', item: Partial<T>): Promise<T> {
  const d = db();
  const list = d[table] as unknown as T[];
  if ('slug' in item && list.some((x) => (x as unknown as { slug: string }).slug === (item as { slug?: string }).slug && x.id !== item.id)) {
    throw new Error('Já existe um item com este endereço (slug).');
  }
  const existing = item.id ? list.find((x) => x.id === item.id) : undefined;
  if (existing) Object.assign(existing, item);
  else list.push({ sort_order: list.length + 1, is_active: true, is_featured: false, description: null, image_url: null, ...item, id: uid() } as unknown as T);
  commit();
  return delay(clone(existing ?? list[list.length - 1]));
}

export function resetDemoData() {
  localStorage.removeItem(KEY);
  cache = null;
}
