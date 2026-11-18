import { z } from 'zod';

export const checkoutSchema = z.object({
  name: z
    .string({ required_error: 'Informe seu nome completo.' })
    .trim()
    .min(3, 'Informe seu nome completo.')
    .max(120, 'Nome muito longo.')
    .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, 'Informe nome e sobrenome.'),
  city: z.string({ required_error: 'Informe sua cidade.' }).trim().min(2, 'Informe sua cidade.').max(120),
  neighborhood: z.string({ required_error: 'Informe seu bairro.' }).trim().min(2, 'Informe seu bairro.').max(120),
  address: z.string().trim().max(300, 'Endereço muito longo.').optional().default(''),
  notes: z.string().trim().max(1000, 'Observação muito longa (máx. 1000 caracteres).').optional().default(''),
  attendant: z.string({ required_error: 'Escolha com quem deseja falar.' }).min(1, 'Escolha com quem deseja falar.'),
});

export type CheckoutData = z.infer<typeof checkoutSchema>;
export type CheckoutErrors = Partial<Record<keyof CheckoutData, string>>;

export function validateCheckout(data: Partial<CheckoutData>): { ok: true; data: CheckoutData } | { ok: false; errors: CheckoutErrors } {
  const res = checkoutSchema.safeParse(data);
  if (res.success) return { ok: true, data: res.data };
  const errors: CheckoutErrors = {};
  for (const issue of res.error.issues) {
    const key = issue.path[0] as keyof CheckoutData;
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

export interface LastOrder {
  reference: string;
  attendantName: string;
  link: string;
  total: number;
  itemCount: number;
  createdAt: string;
}

const LAST_ORDER_KEY = 'db-last-order';
const DRAFT_KEY = 'db-checkout-draft';

export function saveLastOrder(o: LastOrder) {
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(o));
  } catch {
    /* ignore */
  }
}

export function readLastOrder(): LastOrder | null {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    return raw ? (JSON.parse(raw) as LastOrder) : null;
  } catch {
    return null;
  }
}

export function saveDraft(d: Partial<CheckoutData>) {
  try {
    const { name, city, neighborhood, address } = d;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, city, neighborhood, address }));
  } catch {
    /* ignore */
  }
}

export function readDraft(): Partial<CheckoutData> {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}');
  } catch {
    return {};
  }
}
