export type UUID = string;

export interface Category {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
}

export type Collection = Category;

export interface ProductImage {
  id: UUID;
  product_id: UUID;
  url: string;
  path: string | null;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductVariant {
  id: UUID;
  product_id: UUID;
  label: string;
  value: string;
  stock: number;
  sort_order: number;
}

export interface Product {
  id: UUID;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  material: string | null;
  category_id: UUID | null;
  collection_id: UUID | null;
  price: number;
  promo_price: number | null;
  stock: number;
  is_active: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  is_featured: boolean;
  is_demo: boolean;
  view_count: number;
  sort_order: number;
  created_at: string;
  updated_at?: string;
  category?: Pick<Category, 'id' | 'name' | 'slug'> | null;
  collection?: Pick<Collection, 'id' | 'name' | 'slug'> | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'category' | 'collection' | 'images' | 'variants'> & {
  id?: UUID;
  images: Array<Pick<ProductImage, 'url' | 'path' | 'alt'>>;
  variants: Array<Pick<ProductVariant, 'label' | 'value' | 'stock'>>;
};

export const ORDER_STATUSES = [
  { value: 'pendente', label: 'Pendente', tone: 'amber' },
  { value: 'em_atendimento', label: 'Em atendimento', tone: 'sky' },
  { value: 'aguardando_pagamento', label: 'Aguardando pagamento', tone: 'orange' },
  { value: 'pago', label: 'Pago', tone: 'emerald' },
  { value: 'em_preparacao', label: 'Em preparação', tone: 'violet' },
  { value: 'enviado', label: 'Enviado', tone: 'indigo' },
  { value: 'entregue', label: 'Entregue', tone: 'green' },
  { value: 'cancelado', label: 'Cancelado', tone: 'rose' },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]['value'];

export interface OrderItem {
  id?: UUID;
  order_id?: UUID;
  product_id: UUID | null;
  product_name: string;
  variant: string | null;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: UUID;
  number: number;
  reference: string | null;
  source: 'site' | 'manual';
  status: OrderStatus;
  attendant: string | null;
  customer_name: string;
  customer_phone: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  notes: string | null;
  internal_notes: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
}

export type OrderInput = Omit<Order, 'id' | 'number' | 'created_at' | 'updated_at'> & { id?: UUID };

export interface Testimonial {
  id: UUID;
  name: string;
  city: string | null;
  text: string;
  rating: number;
  is_active: boolean;
  sort_order: number;
}

export interface Attendant {
  id: string;
  name: string;
  phone: string; // formato internacional, somente dígitos (ex.: 5581998070744)
  active: boolean;
}

export interface SiteSettings {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta_label: string;
    cta_link: string;
    image_url: string;
    image_alt: string;
  };
  home: {
    marquee: string[];
    featured_category_ids: UUID[];
    featured_title: string;
    bestsellers_title: string;
    new_title: string;
    collections_title: string;
    show_testimonials: boolean;
    show_instagram: boolean;
  };
  about: {
    eyebrow: string;
    title: string;
    text: string;
    image_url: string;
    highlights: Array<{ title: string; text: string }>;
  };
  care: {
    eyebrow: string;
    title: string;
    intro: string;
    image_url: string;
    materials: Array<{ title: string; text: string }>;
    tips_title: string;
    tips: string[];
    note: string;
  };
  contact: { city: string; email: string; hours: string; address: string };
  social: { instagram: string; linktree: string; tiktok: string; facebook: string };
  footer: { tagline: string; note: string };
  attendants: Attendant[];
  instagram: { handle: string; profile_url: string; posts: Array<{ image_url: string; link: string; caption?: string }> };
  seo: { title: string; description: string; og_image: string };
}

export type SettingsKey = keyof SiteSettings;

export interface AdminUser {
  user_id: UUID;
  email: string;
  name: string | null;
  role: 'owner' | 'admin';
  created_at: string;
}

export interface ProductFilter {
  categorySlug?: string;
  collectionSlug?: string;
  flag?: 'is_new' | 'is_bestseller' | 'is_featured';
  search?: string;
  material?: string;
  ids?: UUID[];
  includeInactive?: boolean;
}

export interface SiteOrderPayload {
  reference: string;
  attendant: string;
  customer_name: string;
  city: string;
  neighborhood: string;
  address: string;
  notes: string;
  items: Array<{ product_id: UUID; quantity: number; variant: string | null }>;
}
