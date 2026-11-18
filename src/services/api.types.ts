import type {
  AdminUser,
  Category,
  Collection,
  Order,
  OrderInput,
  OrderStatus,
  Product,
  ProductFilter,
  ProductInput,
  SettingsKey,
  SiteOrderPayload,
  SiteSettings,
  Testimonial,
} from '@/types';

export interface Session {
  userId: string;
  email: string;
}

export interface AuthApi {
  getSession(): Promise<Session | null>;
  signIn(email: string, password: string): Promise<Session>;
  signOut(): Promise<void>;
  isAdmin(): Promise<boolean>;
  onChange(cb: (session: Session | null) => void): () => void;
  sendPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
}

export interface StoreApi {
  mode: 'demo' | 'supabase';
  auth: AuthApi;

  // Catálogo (público)
  listCategories(opts?: { includeInactive?: boolean }): Promise<Category[]>;
  listCollections(opts?: { includeInactive?: boolean }): Promise<Collection[]>;
  listProducts(filter?: ProductFilter): Promise<Product[]>;
  getProduct(slug: string): Promise<Product | null>;
  getProductById(id: string): Promise<Product | null>;
  getSettings(): Promise<SiteSettings>;
  listTestimonials(opts?: { includeInactive?: boolean }): Promise<Testimonial[]>;
  registerView(productId: string): Promise<void>;
  createSiteOrder(payload: SiteOrderPayload): Promise<string>;

  // Administração
  saveProduct(input: ProductInput): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  uploadImage(file: File, folder: string): Promise<{ url: string; path: string }>;
  deleteImage(path: string): Promise<void>;
  saveCategory(c: Partial<Category> & { name: string; slug: string }): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  saveCollection(c: Partial<Collection> & { name: string; slug: string }): Promise<Collection>;
  deleteCollection(id: string): Promise<void>;
  listOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  saveOrder(input: OrderInput): Promise<Order>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<void>;
  deleteOrder(id: string): Promise<void>;
  saveTestimonial(t: Partial<Testimonial> & { name: string; text: string }): Promise<Testimonial>;
  deleteTestimonial(id: string): Promise<void>;
  saveSetting<K extends SettingsKey>(key: K, value: SiteSettings[K]): Promise<void>;
  listAdmins(): Promise<AdminUser[]>;
  createAdmin(input: { email: string; password: string; name: string }): Promise<void>;
  removeAdmin(userId: string): Promise<void>;
}
