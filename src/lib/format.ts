const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatPrice(value: number): string {
  // Intl usa espaço não separável; normalizamos para espaço comum (melhor no WhatsApp).
  return brl.format(value).replace(/ /g, ' ');
}

export function effectivePrice(p: { price: number; promo_price: number | null }): number {
  return p.promo_price != null && p.promo_price < p.price ? p.promo_price : p.price;
}

export function discountPercent(p: { price: number; promo_price: number | null }): number {
  if (p.promo_price == null || p.promo_price >= p.price) return 0;
  return Math.round((1 - p.promo_price / p.price) * 100);
}

export function formatDate(iso: string, withTime = false): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function normalizeText(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function uid(): string {
  return crypto.randomUUID();
}
