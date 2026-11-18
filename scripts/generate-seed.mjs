// Gera supabase/seed.sql a partir de src/data/demo-data.json
// Uso: npm run gen:seed
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(root, 'src/data/demo-data.json'), 'utf8'));

const q = (v) => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
};

const lines = [
  '-- DADOS DE DEMONSTRAÇÃO (gerado por scripts/generate-seed.mjs)',
  '-- Os produtos abaixo têm is_demo = true e podem ser excluídos depois pelo painel',
  '-- ou com: delete from public.products where is_demo;',
  '',
];

for (const c of data.categories) {
  lines.push(`insert into public.categories (id, name, slug, description, image_url, sort_order, is_featured, is_active) values (${[c.id, c.name, c.slug, c.description, c.image_url, c.sort_order, c.is_featured, c.is_active].map(q).join(', ')}) on conflict (id) do nothing;`);
}
lines.push('');
for (const c of data.collections) {
  lines.push(`insert into public.collections (id, name, slug, description, image_url, sort_order, is_featured, is_active) values (${[c.id, c.name, c.slug, c.description, c.image_url, c.sort_order, c.is_featured, c.is_active].map(q).join(', ')}) on conflict (id) do nothing;`);
}
lines.push('');
data.products.forEach((p, i) => {
  lines.push(`insert into public.products (id, name, slug, short_description, description, material, category_id, collection_id, price, promo_price, stock, is_active, is_new, is_bestseller, is_featured, is_demo, sort_order) values (${[p.id, p.name, p.slug, p.short_description, p.description, p.material, p.category_id, p.collection_id, p.price, p.promo_price, p.stock, true, p.is_new, p.is_bestseller, p.is_featured, true, i].map(q).join(', ')}) on conflict (id) do nothing;`);
  lines.push(`insert into public.product_images (product_id, url, alt, sort_order, is_primary) values (${q(p.id)}, ${q(`/demo/${p.slug}-1.webp`)}, ${q(`${p.name} (imagem de exemplo)`)}, 0, true), (${q(p.id)}, ${q(`/demo/${p.slug}-2.webp`)}, ${q(`${p.name} — detalhe (imagem de exemplo)`)}, 1, false);`);
});
lines.push('');
data.variants.forEach((v, i) => {
  const p = data.products.find((x) => x.slug === v.product_slug);
  lines.push(`insert into public.product_variants (product_id, label, value, stock, sort_order) values (${[p.id, v.label, v.value, v.stock, i].map(q).join(', ')});`);
});
lines.push('');
for (const [key, value] of Object.entries(data.settings)) {
  lines.push(`insert into public.site_settings (key, value) values (${q(key)}, ${q(JSON.stringify(value))}::jsonb) on conflict (key) do nothing;`);
}

writeFileSync(join(root, 'supabase/seed.sql'), lines.join('\n') + '\n');
console.log('supabase/seed.sql gerado');
