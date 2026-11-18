import type { SupabaseClient } from '@supabase/supabase-js';
import { STORAGE_BUCKET } from '@/lib/supabase';
import { compressImage } from '@/lib/image';
import { uid } from '@/lib/format';
import type { AdminUser, Category, Collection, Order, Product, Testimonial } from '@/types';
import type { Session, StoreApi } from './api.types';
import { matchesSearch, mergeSettings, sortProduct } from './shared';

const PRODUCT_SELECT = '*, category:categories(id,name,slug), collection:collections(id,name,slug), images:product_images(*), variants:product_variants(*)';

/** Converte erros do Supabase/Postgres em mensagens legíveis. */
function fail(error: { message: string; code?: string } | null): never | void {
  if (!error) return;
  if (error.code === '23505') throw new Error('Já existe um registro com este endereço (slug) ou valor único.');
  if (error.code === '42501' || /row-level security/i.test(error.message)) throw new Error('Sem permissão para esta operação.');
  throw new Error(error.message);
}

export function createSupabaseApi(sb: SupabaseClient): StoreApi {
  const toSession = (s: { user: { id: string; email?: string } } | null): Session | null =>
    s ? { userId: s.user.id, email: s.user.email ?? '' } : null;

  async function invokeAdmin<T>(body: Record<string, unknown>): Promise<T> {
    const { data, error } = await sb.functions.invoke('admin-users', { body });
    if (error) {
      let msg = error.message;
      try {
        const ctx = (error as unknown as { context?: Response }).context;
        if (ctx) msg = (await ctx.json()).error ?? msg;
      } catch {
        /* mantém mensagem original */
      }
      throw new Error(msg);
    }
    return data as T;
  }

  const self: StoreApi = {
    mode: 'supabase',

    auth: {
      async getSession() {
        const { data } = await sb.auth.getSession();
        return toSession(data.session);
      },
      async signIn(email, password) {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
        return toSession(data.session)!;
      },
      async signOut() {
        await sb.auth.signOut();
      },
      async isAdmin() {
        const { data, error } = await sb.rpc('is_admin');
        if (error) return false;
        return data === true;
      },
      onChange(cb) {
        const { data } = sb.auth.onAuthStateChange((_e, s) => cb(toSession(s)));
        return () => data.subscription.unsubscribe();
      },
      async sendPasswordReset(email) {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/admin/login` });
        fail(error);
      },
      async updatePassword(password) {
        const { error } = await sb.auth.updateUser({ password });
        fail(error);
      },
    },

    async listCategories(opts) {
      let q = sb.from('categories').select('*').order('sort_order');
      if (!opts?.includeInactive) q = q.eq('is_active', true);
      const { data, error } = await q;
      fail(error);
      return (data ?? []) as Category[];
    },
    async listCollections(opts) {
      let q = sb.from('collections').select('*').order('sort_order');
      if (!opts?.includeInactive) q = q.eq('is_active', true);
      const { data, error } = await q;
      fail(error);
      return (data ?? []) as Collection[];
    },
    async listProducts(filter = {}) {
      let q = sb.from('products').select(PRODUCT_SELECT).order('sort_order').order('created_at', { ascending: false });
      if (!filter.includeInactive) q = q.eq('is_active', true);
      if (filter.flag) q = q.eq(filter.flag, true);
      if (filter.ids) q = q.in('id', filter.ids.length ? filter.ids : ['00000000-0000-0000-0000-000000000000']);
      if (filter.material) q = q.eq('material', filter.material);
      if (filter.categorySlug) {
        const { data: c } = await sb.from('categories').select('id').eq('slug', filter.categorySlug).maybeSingle();
        if (!c) return [];
        q = q.eq('category_id', c.id);
      }
      if (filter.collectionSlug) {
        const { data: c } = await sb.from('collections').select('id').eq('slug', filter.collectionSlug).maybeSingle();
        if (!c) return [];
        q = q.eq('collection_id', c.id);
      }
      const { data, error } = await q;
      fail(error);
      return ((data ?? []) as Product[]).map(sortProduct).filter((p) => matchesSearch(p, filter));
    },
    async getProduct(slug) {
      const { data, error } = await sb.from('products').select(PRODUCT_SELECT).eq('slug', slug).eq('is_active', true).maybeSingle();
      fail(error);
      return data ? sortProduct(data as Product) : null;
    },
    async getProductById(id) {
      const { data, error } = await sb.from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle();
      fail(error);
      return data ? sortProduct(data as Product) : null;
    },
    async getSettings() {
      const { data, error } = await sb.from('site_settings').select('key,value');
      fail(error);
      return mergeSettings(data ?? []);
    },
    async listTestimonials(opts) {
      let q = sb.from('testimonials').select('*').order('sort_order');
      if (!opts?.includeInactive) q = q.eq('is_active', true);
      const { data, error } = await q;
      fail(error);
      return (data ?? []) as Testimonial[];
    },
    async registerView(productId) {
      await sb.rpc('increment_product_view', { p_product_id: productId });
    },
    async createSiteOrder(payload) {
      const { data, error } = await sb.rpc('create_site_order', { payload });
      fail(error);
      return data as string;
    },

    // ---------------- Administração ----------------
    async saveProduct(input) {
      const { images, variants, id, ...fields } = input;
      const row = { ...fields, ...(id ? { id } : {}) };
      const { data, error } = await sb.from('products').upsert(row).select('id').single();
      fail(error);
      const productId = (data as { id: string }).id;

      const { error: delImgErr } = await sb.from('product_images').delete().eq('product_id', productId);
      fail(delImgErr);
      if (images.length) {
        const { error: imgErr } = await sb.from('product_images').insert(
          images.map((img, i) => ({ product_id: productId, url: img.url, path: img.path, alt: img.alt, sort_order: i, is_primary: i === 0 })),
        );
        fail(imgErr);
      }
      const { error: delVarErr } = await sb.from('product_variants').delete().eq('product_id', productId);
      fail(delVarErr);
      if (variants.length) {
        const { error: varErr } = await sb.from('product_variants').insert(
          variants.map((v, i) => ({ product_id: productId, label: v.label, value: v.value, stock: v.stock, sort_order: i })),
        );
        fail(varErr);
      }
      const saved = await self.getProductById(productId);
      return saved!;
    },
    async deleteProduct(id) {
      const { data: imgs } = await sb.from('product_images').select('path').eq('product_id', id);
      const { error } = await sb.from('products').delete().eq('id', id);
      fail(error);
      const paths = (imgs ?? []).map((i) => i.path).filter(Boolean) as string[];
      if (paths.length) await sb.storage.from(STORAGE_BUCKET).remove(paths);
    },
    async uploadImage(file, folder) {
      const blob = await compressImage(file);
      const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
      const path = `${folder}/${uid()}.${ext}`;
      const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, blob, {
        contentType: blob.type,
        cacheControl: '31536000',
        upsert: false,
      });
      fail(error);
      const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      return { url: data.publicUrl, path };
    },
    async deleteImage(path) {
      if (!path || path.startsWith('demo/')) return;
      await sb.storage.from(STORAGE_BUCKET).remove([path]);
    },
    async saveCategory(c) {
      const { data, error } = await sb.from('categories').upsert(c).select('*').single();
      fail(error);
      return data as Category;
    },
    async deleteCategory(id) {
      const { error } = await sb.from('categories').delete().eq('id', id);
      fail(error);
    },
    async saveCollection(c) {
      const { data, error } = await sb.from('collections').upsert(c).select('*').single();
      fail(error);
      return data as Collection;
    },
    async deleteCollection(id) {
      const { error } = await sb.from('collections').delete().eq('id', id);
      fail(error);
    },
    async listOrders() {
      const { data, error } = await sb.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false });
      fail(error);
      return (data ?? []).map(normalizeOrder);
    },
    async getOrder(id) {
      const { data, error } = await sb.from('orders').select('*, items:order_items(*)').eq('id', id).maybeSingle();
      fail(error);
      return data ? normalizeOrder(data) : null;
    },
    async saveOrder(input) {
      const { items, id, ...fields } = input;
      const { data, error } = await sb.from('orders').upsert({ ...fields, ...(id ? { id } : {}) }).select('id').single();
      fail(error);
      const orderId = (data as { id: string }).id;
      const { error: delErr } = await sb.from('order_items').delete().eq('order_id', orderId);
      fail(delErr);
      if (items.length) {
        const { error: insErr } = await sb.from('order_items').insert(
          items.map((i) => ({ order_id: orderId, product_id: i.product_id, product_name: i.product_name, variant: i.variant, quantity: i.quantity, unit_price: i.unit_price })),
        );
        fail(insErr);
      }
      return (await self.getOrder(orderId))!;
    },
    async updateOrderStatus(id, status) {
      const { error } = await sb.from('orders').update({ status }).eq('id', id);
      fail(error);
    },
    async deleteOrder(id) {
      const { error } = await sb.from('orders').delete().eq('id', id);
      fail(error);
    },
    async saveTestimonial(t) {
      const { data, error } = await sb.from('testimonials').upsert(t).select('*').single();
      fail(error);
      return data as Testimonial;
    },
    async deleteTestimonial(id) {
      const { error } = await sb.from('testimonials').delete().eq('id', id);
      fail(error);
    },
    async saveSetting(key, value) {
      const { error } = await sb.from('site_settings').upsert({ key, value });
      fail(error);
    },
    async listAdmins() {
      const res = await invokeAdmin<{ users: AdminUser[] }>({ action: 'list' });
      return res.users;
    },
    async createAdmin(input) {
      await invokeAdmin({ action: 'create', ...input });
    },
    async removeAdmin(userId) {
      await invokeAdmin({ action: 'remove', user_id: userId });
    },
  };
  return self;
}

function normalizeOrder(o: Record<string, unknown>): Order {
  const order = o as unknown as Order;
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    discount: Number(order.discount),
    total: Number(order.total),
    items: (order.items ?? []).map((i) => ({ ...i, unit_price: Number(i.unit_price) })),
  };
}
