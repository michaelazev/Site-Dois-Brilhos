import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { api } from '@/services/api';
import { qk, useCategories, useCollections, useInvalidatingMutation } from '@/hooks/queries';
import { useToast } from '@/components/ui/Toast';
import { discountPercent, slugify } from '@/lib/format';
import type { ProductInput } from '@/types';
import { Card, Field, LoadingBlock, PageHeader, Toggle } from '../components/ui';
import { MultiImageUploader, type UploadedImage } from '../components/ImageUploader';
import { toInput } from './ProductsPage';

const MATERIALS = ['Prata 925', 'Aço Inoxidável', 'Folheado a Ouro', 'Folheado a Prata'];

const schema = z
  .object({
    name: z.string().trim().min(2, 'Informe o nome.').max(160),
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífens.'),
    price: z.number({ invalid_type_error: 'Informe o preço.' }).min(0, 'Preço inválido.'),
    promo_price: z.number().min(0).nullable(),
    stock: z.number().int('Use números inteiros.').min(0, 'Estoque não pode ser negativo.'),
  })
  .refine((v) => v.promo_price == null || v.promo_price < v.price, { message: 'O preço promocional deve ser menor que o preço normal.', path: ['promo_price'] });

type VariantRow = { key: string; label: string; value: string; stock: number };

const EMPTY: ProductInput = {
  name: '',
  slug: '',
  short_description: '',
  description: '',
  material: '',
  category_id: null,
  collection_id: null,
  price: 0,
  promo_price: null,
  stock: 0,
  is_active: true,
  is_new: true,
  is_bestseller: false,
  is_featured: false,
  is_demo: false,
  sort_order: 0,
  images: [],
  variants: [],
};

export default function ProductEditorPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();

  const { data: product, isLoading } = useQuery({ queryKey: qk.productById(id ?? ''), queryFn: () => api.getProductById(id!), enabled: !isNew });
  const { data: categories = [] } = useCategories(true);
  const { data: collections = [] } = useCollections(true);

  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      const input = toInput(product);
      setForm(input);
      setImages(input.images.map((i) => ({ ...i, key: crypto.randomUUID() })));
      setVariants(input.variants.map((v) => ({ ...v, key: crypto.randomUUID() })));
      setSlugTouched(true);
    }
  }, [product]);

  const save = useInvalidatingMutation((input: ProductInput) => api.saveProduct(input), [['products'], ['product'], ['product-id']]);

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const variantStock = useMemo(() => variants.reduce((a, v) => a + (Number(v.stock) || 0), 0), [variants]);
  const pct = discountPercent({ price: form.price, promo_price: form.promo_price });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stock = variants.length ? variantStock : form.stock;
    const parsed = schema.safeParse({ ...form, stock });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      toast('Revise os campos destacados.', 'error');
      return;
    }
    const badVariant = variants.find((v) => !v.label.trim() || !v.value.trim());
    if (badVariant) {
      toast('Preencha o tipo e o valor de todas as variações (ou remova as vazias).', 'error');
      return;
    }
    try {
      const saved = await save.mutateAsync({
        ...form,
        name: form.name.trim(),
        material: form.material?.trim() || null,
        short_description: form.short_description?.trim() || null,
        description: form.description?.trim() || null,
        stock,
        images: images.map(({ url, path, alt }) => ({ url, path, alt: alt || form.name })),
        variants: variants.map(({ label, value, stock: s }) => ({ label: label.trim(), value: value.trim(), stock: Number(s) || 0 })),
      });
      toast(isNew ? 'Produto cadastrado!' : 'Alterações salvas.');
      if (isNew) navigate(`/admin/produtos/${saved.id}`, { replace: true });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error');
    }
  };

  if (!isNew && isLoading) return <LoadingBlock />;
  if (!isNew && !isLoading && !product) return <p>Produto não encontrado. <Link className="text-emerald underline" to="/admin/produtos">Voltar</Link></p>;

  return (
    <form onSubmit={submit} noValidate>
      <Link to="/admin/produtos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-mute hover:text-emerald">
        <ArrowLeft className="size-4" /> Produtos
      </Link>
      <PageHeader
        title={isNew ? 'Novo produto' : form.name || 'Editar produto'}
        actions={
          <>
            {!isNew && form.is_active && (
              <a href={`/produto/${form.slug}`} target="_blank" rel="noreferrer" className="admin-btn admin-btn-ghost"><ExternalLink className="size-4" /> Ver na loja</a>
            )}
            <button className="admin-btn admin-btn-primary" disabled={save.isPending}>
              {save.isPending && <Loader2 className="size-4 animate-spin" />} Salvar
            </button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Informações">
            <div className="space-y-4">
              <Field label="Nome da peça" error={errors.name}>
                <input
                  className="admin-input"
                  value={form.name}
                  aria-invalid={!!errors.name}
                  onChange={(e) => {
                    set('name', e.target.value);
                    if (!slugTouched) set('slug', slugify(e.target.value));
                  }}
                />
              </Field>
              <Field label="Endereço na loja (URL)" hint={`/produto/${form.slug || '…'}`} error={errors.slug}>
                <input
                  className="admin-input font-mono text-xs"
                  value={form.slug}
                  aria-invalid={!!errors.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set('slug', slugify(e.target.value));
                  }}
                />
              </Field>
              <Field label="Resumo" hint="Aparece abaixo do preço">
                <input className="admin-input" maxLength={200} value={form.short_description ?? ''} onChange={(e) => set('short_description', e.target.value)} />
              </Field>
              <Field label="Descrição detalhada">
                <textarea className="admin-input min-h-40" value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card title="Fotografias">
            <MultiImageUploader value={images} onChange={setImages} folder="produtos" altBase={form.name} />
          </Card>

          <Card title="Preço e estoque">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Preço (R$)" error={errors.price}>
                <MoneyInput value={form.price} onChange={(v) => set('price', v ?? 0)} invalid={!!errors.price} />
              </Field>
              <Field label="Preço promocional" hint={pct ? `−${pct}%` : 'opcional'} error={errors.promo_price}>
                <MoneyInput value={form.promo_price} onChange={(v) => set('promo_price', v)} invalid={!!errors.promo_price} allowEmpty />
              </Field>
              <Field label="Estoque" hint={variants.length ? 'soma das variações' : undefined} error={errors.stock}>
                <input
                  type="number"
                  min={0}
                  className="admin-input"
                  value={variants.length ? variantStock : form.stock}
                  disabled={variants.length > 0}
                  onChange={(e) => set('stock', Math.max(0, parseInt(e.target.value || '0', 10)))}
                />
              </Field>
            </div>
          </Card>

          <Card
            title="Variações"
            actions={
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setVariants((v) => [...v, { key: crypto.randomUUID(), label: v[v.length - 1]?.label ?? 'Tamanho', value: '', stock: 0 }])}>
                <Plus className="size-4" /> Adicionar
              </button>
            }
          >
            {variants.length === 0 ? (
              <p className="text-sm text-mute">Sem variações. Use para tamanhos de aro, comprimento de corrente, cores etc. Cada variação tem seu próprio estoque.</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_6rem_2.5rem] gap-2 text-xs text-mute">
                  <span>Tipo (ex.: Aro)</span><span>Valor (ex.: 16)</span><span>Estoque</span><span />
                </div>
                {variants.map((v) => (
                  <div key={v.key} className="grid grid-cols-[1fr_1fr_6rem_2.5rem] gap-2">
                    <input className="admin-input" value={v.label} list="variant-labels" onChange={(e) => setVariants((all) => all.map((x) => (x.key === v.key ? { ...x, label: e.target.value } : x)))} />
                    <input className="admin-input" value={v.value} onChange={(e) => setVariants((all) => all.map((x) => (x.key === v.key ? { ...x, value: e.target.value } : x)))} />
                    <input type="number" min={0} className="admin-input" value={v.stock} onChange={(e) => setVariants((all) => all.map((x) => (x.key === v.key ? { ...x, stock: Math.max(0, parseInt(e.target.value || '0', 10)) } : x)))} />
                    <button type="button" className="grid place-items-center rounded-md text-mute hover:bg-rose-50 hover:text-rose-700" onClick={() => setVariants((all) => all.filter((x) => x.key !== v.key))} aria-label="Remover variação">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
                <datalist id="variant-labels">
                  <option value="Aro" /><option value="Tamanho" /><option value="Comprimento" /><option value="Cor" /><option value="Banho" />
                </datalist>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Visibilidade">
            <div className="space-y-4">
              <Toggle checked={form.is_active} onChange={(v) => set('is_active', v)} label="Visível na loja" description="Desative para esconder sem excluir." />
              <Toggle checked={form.is_new} onChange={(v) => set('is_new', v)} label="Lançamento" description="Aparece em Novidades." />
              <Toggle checked={form.is_bestseller} onChange={(v) => set('is_bestseller', v)} label="Mais vendido" description="Aparece em Mais vendidos." />
              <Toggle checked={form.is_featured} onChange={(v) => set('is_featured', v)} label="Destaque na página inicial" />
              {form.is_demo && <Toggle checked={form.is_demo} onChange={(v) => set('is_demo', v)} label="Produto de exemplo" description="Desmarque quando os dados forem reais." />}
            </div>
          </Card>

          <Card title="Organização">
            <div className="space-y-4">
              <Field label="Categoria">
                <select className="admin-input" value={form.category_id ?? ''} onChange={(e) => set('category_id', e.target.value || null)}>
                  <option value="">Sem categoria</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Coleção">
                <select className="admin-input" value={form.collection_id ?? ''} onChange={(e) => set('collection_id', e.target.value || null)}>
                  <option value="">Nenhuma</option>
                  {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Material">
                <input className="admin-input" list="materials" value={form.material ?? ''} onChange={(e) => set('material', e.target.value)} />
                <datalist id="materials">{MATERIALS.map((m) => <option key={m} value={m} />)}</datalist>
              </Field>
              <Field label="Ordem de exibição" hint="menor aparece primeiro">
                <input type="number" className="admin-input" value={form.sort_order} onChange={(e) => set('sort_order', parseInt(e.target.value || '0', 10))} />
              </Field>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}

/** Campo de valor em reais que aceita vírgula (ex.: 59,90). */
export function MoneyInput({ value, onChange, invalid, allowEmpty = false }: { value: number | null; onChange: (v: number | null) => void; invalid?: boolean; allowEmpty?: boolean }) {
  const fmt = (v: number | null) => (v == null ? '' : v.toFixed(2).replace('.', ','));
  const [text, setText] = useState(fmt(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(fmt(value));
  }, [value, focused]);
  return (
    <input
      inputMode="decimal"
      className="admin-input"
      aria-invalid={invalid}
      value={text}
      placeholder={allowEmpty ? '—' : '0,00'}
      onFocus={() => setFocused(true)}
      onChange={(e) => {
        const t = e.target.value.replace(/[^\d,.]/g, '');
        setText(t);
        onChange(parseMoney(t, allowEmpty));
      }}
      onBlur={() => setFocused(false)}
    />
  );
}

/** "1.234,56" → 1234.56 · "59,9" → 59.9 · "59.90" → 59.9 */
export function parseMoney(text: string, allowEmpty = false): number | null {
  const t = text.trim();
  if (!t) return allowEmpty ? null : 0;
  let normalized: string;
  if (t.includes(',')) normalized = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d+\.\d{1,2}$/.test(t)) normalized = t;
  else normalized = t.replace(/\./g, '');
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : allowEmpty ? null : 0;
}
