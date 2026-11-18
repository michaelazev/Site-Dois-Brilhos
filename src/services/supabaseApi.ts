import { getSupabase, STORAGE_BUCKET, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase';
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

/**
 * Leitura PÚBLICA via REST (PostgREST) com a chave anon: as mesmas tabelas e as
 * mesmas regras RLS do cliente oficial, mas sem baixar a biblioteca inteira.
 * É o que deixa a vitrine leve no celular.
 */
async function rest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let body: { message?: string; code?: string } = {};
    try {
      body = await res.json();
    } catch {
      /* resposta sem corpo */
    }
    fail({ message: body.message ?? `Erro ${res.status}`, code: body.code });
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

const enc = encodeURIComponent;

export function createSupabaseApi(): StoreApi {
  const client = getSupabase;

  const toSession = (s: { user: { id: string; email?: string } } | null): Session | null =>
    s ? { userId: s.user.id, email: s.user.email ?? '' } : null;

  async function invokeAdmin<T>(body: Record<string, unknown>): Promise<T> {
    const sb = await client();
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
        const sb = await client();
        const { data } = await sb.auth.getSession();
        return toSession(data.session);
      },
      async signIn(email, password) {
        const sb = await client();
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
        return toSession(data.session)!;
      },
      async signOut() {
        const sb = await client();
        await sb.auth.signOut();
      },
      async isAdmin() {
        const sb = await client();
        const { data, error } = await sb.rpc('is_admin');
        if (error) return false;
        return data === true;
      },
      onChange(cb) {
        let active = true;
        let unsubscribe = () => {};
        client().then((sb) => {
          if (!active) return;
          const { data } = sb.auth.onAuthStateChange((_e, s) => cb(toSession(s)));
          unsubscribe = () => data.subscription.unsubscribe();
        });
        return () => {
          active = false;
          unsubscribe();
        };
      },
      async sendPasswordReset(email) {
        const sb = await client();
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/admin/login` });
        fail(error);
      },
      async updatePassword(password) {
        const sb = await client();
        const { error } = await sb.auth.updateUser({ password });
        fail(error);
      },
    },

    // ---------------- Leitura pública (REST leve) ----------------
    // Itens ocultos (includeInactive) só são vistos por administradores logados,
    // então nesses casos usamos o cliente completo com a sessão.
    async listCategories(opts) {
      if (opts?.includeInactive) {
        const sb = await client();
        const { data, error } = await sb.from('categories').select('*').order('sort_order');
        fail(error);
        return (data ?? []) as Category[];
      }
      return rest<Category[]>('categories?select=*&is_active=eq.true&order=sort_order.asc');
    },
    async listCollections(opts) {
      if (opts?.includeInactive) {
        const sb = await client();
        const { data, error } = await sb.from('collections').select('*').order('sort_order');
        fail(error);
        return (data ?? []) as Collection[];
      }
      return rest<Collection[]>('collections?select=*&is_active=eq.true&order=sort_order.asc');
    },
    async listProducts(filter = {}) {
      if (filter.includeInactive) {
        const sb = await client();
        let q = sb.from('products').select(PRODUCT_SELECT).order('sort_order').order('created_at', { ascending: false });
        if (filter.flag) q = q.eq(filter.flag, true);
        if (filter.ids) q = q.in('id', filter.ids.length ? filter.ids : ['00000000-0000-0000-0000-000000000000']);
        const { data, error } = await q;
        fail(error);
        return ((data ?? []) as Product[]).map(sortProduct).filter((p) => matchesSearch(p, filter));
      }
      const params = [`select=${enc(PRODUCT_SELECT)}`, 'is_active=eq.true', 'order=sort_order.asc,created_at.desc'];
      if (filter.flag) params.push(`${filter.flag}=eq.true`);
      if (filter.ids) {
        if (!filter.ids.length) return [];
        params.push(`id=in.(${filter.ids.map(enc).join(',')})`);
      }
      if (filter.material) params.push(`material=eq.${enc(filter.material)}`);
      if (filter.categorySlug) {
        const [c] = await rest<Array<{ id: string }>>(`categories?select=id&slug=eq.${enc(filter.categorySlug)}`);
        if (!c) return [];
        params.push(`category_id=eq.${c.id}`);
      }
      if (filter.collectionSlug) {
        const [c] = await rest<Array<{ id: string }>>(`collections?select=id&slug=eq.${enc(filter.collectionSlug)}`);
        if (!c) return [];
        params.push(`collection_id=eq.${c.id}`);
      }
      const data = await rest<Product[]>(`products?${params.join('&')}`);
      return data.map(sortProduct).filter((p) => matchesSearch(p, filter));
    },
    async getProduct(slug) {
      const [data] = await rest<Product[]>(`products?select=${enc(PRODUCT_SELECT)}&slug=eq.${enc(slug)}&is_active=eq.true&limit=1`);
      return data ? sortProduct(data) : null;
    },
    async getProductById(id) {
      const sb = await client();
      const { data, error } = await sb.from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle();
      fail(error);
      return data ? sortProduct(data as Product) : null;
    },
    async getSettings() {
      const data = await rest<Array<{ key: string; value: unknown }>>('site_settings?select=key,value');
      return mergeSettings(data ?? []);
    },
    async listTestimonials(opts) {
      if (opts?.includeInactive) {
        const sb = await client();
        const { data, error } = await sb.from('testimonials').select('*').order('sort_order');
        fail(error);
        return (data ?? []) as Testimonial[];
      }
      return rest<Testimonial[]>('testimonials?select=*&is_active=eq.true&order=sort_order.asc');
    },
    async registerView(productId) {
      await rest('rpc/increment_product_view', { method: 'POST', body: JSON.stringify({ p_product_id: productId }) });
    },
    async createSiteOrder(payload) {
      return rest<string>('rpc/create_site_order', { method: 'POST', body: JSON.stringify({ payload }) });
    },

    // ---------------- Administração ----------------
    async saveProduct(input) {
      const sb = await client();
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
      const sb = await client();
      const { data: imgs } = await sb.from('product_images').select('path').eq('product_id', id);
      const { error } = await sb.from('products').delete().eq('id', id);
      fail(error);
      const paths = (imgs ?? []).map((i) => i.path).filter(Boolean) as string[];
      // remove também as versões pequenas (-sm) geradas no upload
      const all = paths.flatMap((p) => (p.endsWith('.webp') ? [p, p.replace(/\.webp$/, '-sm.webp')] : [p]));
      if (all.length) await sb.storage.from(STORAGE_BUCKET).remove(all);
    },
    async uploadImage(file, folder) {
      const sb = await client();
      const blob = await compressImage(file);
      const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
      const base = `${folder}/${uid()}`;
      const path = `${base}.${ext}`;
      const opts = { contentType: blob.type, cacheControl: '31536000', upsert: false };
      const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, blob, opts);
      fail(error);
      // Fotos de produto ganham uma versão leve (~480px) para os cards no celular.
      if (folder === 'produtos' && ext === 'webp') {
        try {
          const small = await compressImage(file, 480, 0.8);
          if (small.type === 'image/webp') await sb.storage.from(STORAGE_BUCKET).upload(`${base}-sm.webp`, small, opts);
        } catch {
          /* sem versão pequena: o card usa a foto original */
        }
      }
      const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      return { url: data.publicUrl, path };
    },
    async deleteImage(path) {
      const sb = await client();
      if (!path || path.startsWith('demo/')) return;
      await sb.storage.from(STORAGE_BUCKET).remove(path.endsWith('.webp') ? [path, path.replace(/\.webp$/, '-sm.webp')] : [path]);
    },
    async saveCategory(c) {
      const sb = await client();
      const { data, error } = await sb.from('categories').upsert(c).select('*').single();
      fail(error);
      return data as Category;
    },
    async deleteCategory(id) {
      const sb = await client();
      const { error } = await sb.from('categories').delete().eq('id', id);
      fail(error);
    },
    async saveCollection(c) {
      const sb = await client();
      const { data, error } = await sb.from('collections').upsert(c).select('*').single();
      fail(error);
      return data as Collection;
    },
    async deleteCollection(id) {
      const sb = await client();
      const { error } = await sb.from('collections').delete().eq('id', id);
      fail(error);
    },
    async listOrders() {
      const sb = await client();
      const { data, error } = await sb.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false });
      fail(error);
      return (data ?? []).map(normalizeOrder);
    },
    async getOrder(id) {
      const sb = await client();
      const { data, error } = await sb.from('orders').select('*, items:order_items(*)').eq('id', id).maybeSingle();
      fail(error);
      return data ? normalizeOrder(data) : null;
    },
    async saveOrder(input) {
      const sb = await client();
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
      const sb = await client();
      const { error } = await sb.from('orders').update({ status }).eq('id', id);
      fail(error);
    },
    async deleteOrder(id) {
      const sb = await client();
      const { error } = await sb.from('orders').delete().eq('id', id);
      fail(error);
    },
    async saveTestimonial(t) {
      const sb = await client();
      const { data, error } = await sb.from('testimonials').upsert(t).select('*').single();
      fail(error);
      return data as Testimonial;
    },
    async deleteTestimonial(id) {
      const sb = await client();
      const { error } = await sb.from('testimonials').delete().eq('id', id);
      fail(error);
    },
    async saveSetting(key, value) {
      const sb = await client();
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
