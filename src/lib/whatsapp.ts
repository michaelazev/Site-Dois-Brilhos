import type { Attendant } from '@/types';
import { formatPrice } from './format';

export interface WhatsAppLine {
  name: string;
  variant?: string | null;
  quantity: number;
  unitPrice: number;
}

export interface WhatsAppCustomer {
  name: string;
  city: string;
  neighborhood: string;
  address?: string;
  notes?: string;
}

/** Mantém somente dígitos. Os números devem estar no formato internacional (55 + DDD + número). */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function isValidWhatsAppNumber(phone: string): boolean {
  const digits = normalizePhone(phone);
  // Brasil: 55 + DDD (2) + 8 ou 9 dígitos
  return /^55\d{10,11}$/.test(digits);
}

export function formatPhoneDisplay(phone: string): string {
  const d = normalizePhone(phone);
  const m = d.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `+55 ${m[1]} ${m[2]}-${m[3]}` : `+${d}`;
}

export function generateOrderReference(date = new Date()): string {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `DB${yy}${mm}${dd}-${code}`;
}

export function buildOrderMessage(lines: WhatsAppLine[], customer: WhatsAppCustomer, reference?: string): string {
  const subtotal = lines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);
  const parts: string[] = [];
  parts.push('Olá! Vim pelo site da Dois Brilhos e gostaria de finalizar meu pedido.');
  parts.push('');
  parts.push('*RESUMO DO PEDIDO*');
  if (reference) parts.push(`Código: ${reference}`);
  for (const l of lines) {
    parts.push('');
    parts.push(`Produto: ${l.name}${l.variant ? ` (${l.variant})` : ''}`);
    parts.push(`Quantidade: ${l.quantity}`);
    parts.push(`Valor unitário: ${formatPrice(l.unitPrice)}`);
  }
  parts.push('');
  parts.push(`*Subtotal: ${formatPrice(subtotal)}*`);
  parts.push('');
  parts.push('*DADOS DO CLIENTE*');
  parts.push(`Nome: ${customer.name.trim()}`);
  parts.push(`Cidade: ${customer.city.trim()}`);
  parts.push(`Bairro: ${customer.neighborhood.trim()}`);
  parts.push(`Endereço: ${customer.address?.trim() || 'Não informado'}`);
  parts.push(`Observações: ${customer.notes?.trim() || 'Nenhuma'}`);
  parts.push('');
  parts.push('Gostaria de confirmar a disponibilidade e combinar a entrega.');
  return parts.join('\n');
}

export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

export function buildProductQuestionLink(attendant: Attendant, productName: string, url: string, variant?: string | null): string {
  const msg = `Olá! Vim pelo site da Dois Brilhos e tenho interesse nesta peça:\n\n${productName}${variant ? ` (${variant})` : ''}\n${url}\n\nPode me passar mais informações?`;
  return buildWhatsAppLink(attendant.phone, msg);
}
