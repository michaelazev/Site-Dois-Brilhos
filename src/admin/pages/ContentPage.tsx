import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { qk, useCategories, useSettings } from '@/hooks/queries';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/format';
import { formatPhoneDisplay, isValidWhatsAppNumber, normalizePhone } from '@/lib/whatsapp';
import type { SettingsKey, SiteSettings } from '@/types';
import { Card, Field, LoadingBlock, PageHeader, StringListEditor, Toggle } from '../components/ui';
import { SingleImageUploader } from '../components/ImageUploader';

const TABS: Array<{ key: SettingsKey; label: string }> = [
  { key: 'hero', label: 'Banner principal' },
  { key: 'home', label: 'Página inicial' },
  { key: 'about', label: 'Institucional' },
  { key: 'care', label: 'Cuidados' },
  { key: 'attendants', label: 'Atendentes (WhatsApp)' },
  { key: 'contact', label: 'Contato' },
  { key: 'social', label: 'Redes sociais' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'footer', label: 'Rodapé' },
  { key: 'seo', label: 'SEO' },
];

export default function ContentPage() {
  const { data: settings, isLoading } = useSettings();
  const [tab, setTab] = useState<SettingsKey>('hero');
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (settings && !draft) setDraft(structuredClone(settings));
  }, [settings, draft]);

  if (isLoading || !draft) return <LoadingBlock />;

  const update = <K extends SettingsKey>(key: K, patch: Partial<SiteSettings[K]> | SiteSettings[K]) =>
    setDraft((d) => (d ? { ...d, [key]: Array.isArray(patch) ? patch : { ...(d[key] as object), ...(patch as object) } } : d));

  const save = async () => {
    const value = draft[tab];
    if (tab === 'attendants') {
      const bad = draft.attendants.find((a) => !a.name.trim() || !isValidWhatsAppNumber(a.phone));
      if (bad) return toast(`Verifique o número de "${bad.name || 'atendente'}": use 55 + DDD + número.`, 'error');
      if (!draft.attendants.some((a) => a.active)) return toast('Mantenha pelo menos um atendente ativo.', 'error');
    }
    setSaving(true);
    try {
      await api.saveSetting(tab, value as never);
      await qc.invalidateQueries({ queryKey: qk.settings });
      toast('Conteúdo atualizado na loja.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Conteúdo do site"
        description="Edite textos, imagens, contatos e redes sociais sem mexer no código."
        actions={
          <>
            <a href="/" target="_blank" rel="noreferrer" className="admin-btn admin-btn-ghost"><ExternalLink className="size-4" /> Ver loja</a>
            <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>{saving && <Loader2 className="size-4 animate-spin" />} Salvar “{TABS.find((t) => t.key === tab)?.label}”</button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[13rem_1fr]">
        <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0" aria-label="Seções">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn('shrink-0 rounded-lg px-3 py-2 text-left text-sm transition-colors', tab === t.key ? 'bg-emerald text-white' : 'hover:bg-white')}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div>
          {tab === 'hero' && <HeroEditor value={draft.hero} onChange={(p) => update('hero', p)} />}
          {tab === 'home' && <HomeEditor value={draft.home} onChange={(p) => update('home', p)} />}
          {tab === 'about' && <AboutEditor value={draft.about} onChange={(p) => update('about', p)} />}
          {tab === 'care' && <CareEditor value={draft.care} onChange={(p) => update('care', p)} />}
          {tab === 'attendants' && <AttendantsEditor value={draft.attendants} onChange={(v) => update('attendants', v)} />}
          {tab === 'contact' && (
            <Card title="Contato">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cidade / UF"><input className="admin-input" value={draft.contact.city} onChange={(e) => update('contact', { city: e.target.value })} /></Field>
                <Field label="E-mail" hint="opcional"><input className="admin-input" type="email" value={draft.contact.email} onChange={(e) => update('contact', { email: e.target.value })} /></Field>
                <Field label="Horário de atendimento" hint="opcional"><input className="admin-input" value={draft.contact.hours} placeholder="Seg. a sáb., 9h às 18h" onChange={(e) => update('contact', { hours: e.target.value })} /></Field>
                <Field label="Endereço" hint="opcional"><input className="admin-input" value={draft.contact.address} onChange={(e) => update('contact', { address: e.target.value })} /></Field>
              </div>
            </Card>
          )}
          {tab === 'social' && (
            <Card title="Redes sociais" >
              <div className="space-y-4">
                {(['instagram', 'linktree', 'tiktok', 'facebook'] as const).map((k) => (
                  <Field key={k} label={k[0].toUpperCase() + k.slice(1)} hint="link completo">
                    <input className="admin-input" type="url" value={draft.social[k]} placeholder="https://" onChange={(e) => update('social', { [k]: e.target.value })} />
                  </Field>
                ))}
              </div>
            </Card>
          )}
          {tab === 'instagram' && <InstagramEditor value={draft.instagram} onChange={(p) => update('instagram', p)} />}
          {tab === 'footer' && (
            <Card title="Rodapé">
              <div className="space-y-4">
                <Field label="Frase de assinatura"><input className="admin-input" value={draft.footer.tagline} onChange={(e) => update('footer', { tagline: e.target.value })} /></Field>
                <Field label="Aviso"><textarea className="admin-input min-h-20" value={draft.footer.note} onChange={(e) => update('footer', { note: e.target.value })} /></Field>
              </div>
            </Card>
          )}
          {tab === 'seo' && (
            <Card title="SEO e compartilhamento">
              <div className="space-y-4">
                <Field label="Título do site" hint={`${draft.seo.title.length}/60`}><input className="admin-input" value={draft.seo.title} onChange={(e) => update('seo', { title: e.target.value })} /></Field>
                <Field label="Descrição" hint={`${draft.seo.description.length}/160`}><textarea className="admin-input min-h-20" value={draft.seo.description} onChange={(e) => update('seo', { description: e.target.value })} /></Field>
                <Field label="Imagem de compartilhamento" hint="1200×630, JPG ou PNG">
                  <SingleImageUploader value={draft.seo.og_image} onChange={(url) => update('seo', { og_image: url })} folder="site" aspect="aspect-[1200/630]" />
                </Field>
                <p className="text-xs text-mute">Essa imagem aparece quando o link da loja é enviado no WhatsApp, Instagram e Facebook. Use JPG ou PNG (SVG não é aceito por essas redes).</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function HeroEditor({ value, onChange }: { value: SiteSettings['hero']; onChange: (p: Partial<SiteSettings['hero']>) => void }) {
  return (
    <Card title="Banner principal">
      <div className="grid gap-6 md:grid-cols-[1fr_16rem]">
        <div className="space-y-4">
          <Field label="Linha superior"><input className="admin-input" value={value.eyebrow} onChange={(e) => onChange({ eyebrow: e.target.value })} /></Field>
          <Field label="Frase de impacto"><input className="admin-input" value={value.title} onChange={(e) => onChange({ title: e.target.value })} /></Field>
          <Field label="Texto de apoio"><textarea className="admin-input min-h-20" value={value.subtitle} onChange={(e) => onChange({ subtitle: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Texto do botão"><input className="admin-input" value={value.cta_label} onChange={(e) => onChange({ cta_label: e.target.value })} /></Field>
            <Field label="Link do botão" hint="ex.: /loja"><input className="admin-input" value={value.cta_link} onChange={(e) => onChange({ cta_link: e.target.value })} /></Field>
          </div>
          <Field label="Descrição da imagem" hint="acessibilidade"><input className="admin-input" value={value.image_alt} onChange={(e) => onChange({ image_alt: e.target.value })} /></Field>
        </div>
        <Field label="Fotografia" hint="vertical 4:5">
          <SingleImageUploader value={value.image_url} onChange={(url) => onChange({ image_url: url })} folder="site" aspect="aspect-[4/5]" />
        </Field>
      </div>
    </Card>
  );
}

function HomeEditor({ value, onChange }: { value: SiteSettings['home']; onChange: (p: Partial<SiteSettings['home']>) => void }) {
  const { data: categories = [] } = useCategories(true);
  const selected = value.featured_category_ids;
  return (
    <div className="space-y-6">
      <Card title="Títulos das seções">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Destaques"><input className="admin-input" value={value.featured_title} onChange={(e) => onChange({ featured_title: e.target.value })} /></Field>
          <Field label="Mais vendidos"><input className="admin-input" value={value.bestsellers_title} onChange={(e) => onChange({ bestsellers_title: e.target.value })} /></Field>
          <Field label="Novidades"><input className="admin-input" value={value.new_title} onChange={(e) => onChange({ new_title: e.target.value })} /></Field>
          <Field label="Coleções"><input className="admin-input" value={value.collections_title} onChange={(e) => onChange({ collections_title: e.target.value })} /></Field>
        </div>
        <p className="mt-4 text-xs text-mute">Os produtos de cada seção são escolhidos nas marcações de cada produto (Destaque, Mais vendido, Lançamento).</p>
      </Card>
      <Card title="Categorias em destaque">
        <p className="mb-3 text-sm text-mute">Escolha e ordene as categorias exibidas na página inicial. Sem seleção, aparecem as marcadas como “destaque”.</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const idx = selected.indexOf(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange({ featured_category_ids: idx >= 0 ? selected.filter((x) => x !== c.id) : [...selected, c.id] })}
                className={cn('flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm', idx >= 0 ? 'border-emerald bg-emerald text-white' : 'border-line bg-white hover:border-gold')}
              >
                {idx >= 0 && <span className="grid size-4 place-items-center rounded-full bg-white/25 text-[0.65rem]">{idx + 1}</span>}
                {c.name}
              </button>
            );
          })}
        </div>
      </Card>
      <Card title="Faixa animada">
        <StringListEditor value={value.marquee} onChange={(marquee) => onChange({ marquee })} placeholder="Ex.: Prata 925" />
      </Card>
      <Card title="Seções opcionais">
        <div className="space-y-3">
          <Toggle checked={value.show_testimonials} onChange={(v) => onChange({ show_testimonials: v })} label="Mostrar depoimentos" description="Só aparece se houver depoimentos ativos." />
          <Toggle checked={value.show_instagram} onChange={(v) => onChange({ show_instagram: v })} label="Mostrar Instagram" />
        </div>
      </Card>
    </div>
  );
}

function AboutEditor({ value, onChange }: { value: SiteSettings['about']; onChange: (p: Partial<SiteSettings['about']>) => void }) {
  return (
    <div className="space-y-6">
      <Card title="Sobre a Dois Brilhos">
        <div className="grid gap-6 md:grid-cols-[1fr_14rem]">
          <div className="space-y-4">
            <Field label="Linha superior"><input className="admin-input" value={value.eyebrow} onChange={(e) => onChange({ eyebrow: e.target.value })} /></Field>
            <Field label="Título"><input className="admin-input" value={value.title} onChange={(e) => onChange({ title: e.target.value })} /></Field>
            <Field label="Texto" hint="deixe uma linha em branco entre parágrafos"><textarea className="admin-input min-h-48" value={value.text} onChange={(e) => onChange({ text: e.target.value })} /></Field>
          </div>
          <Field label="Imagem">
            <SingleImageUploader value={value.image_url} onChange={(url) => onChange({ image_url: url })} folder="site" aspect="aspect-[5/6]" />
          </Field>
        </div>
      </Card>
      <Card
        title="Diferenciais"
        actions={<button type="button" className="admin-btn admin-btn-ghost" onClick={() => onChange({ highlights: [...value.highlights, { title: '', text: '' }] })}><Plus className="size-4" /> Adicionar</button>}
      >
        <div className="space-y-3">
          {value.highlights.map((h, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[12rem_1fr_2.5rem]">
              <input className="admin-input" placeholder="Título" value={h.title} onChange={(e) => onChange({ highlights: value.highlights.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
              <input className="admin-input" placeholder="Texto" value={h.text} onChange={(e) => onChange({ highlights: value.highlights.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
              <button type="button" className="grid place-items-center rounded-md text-mute hover:bg-rose-50 hover:text-rose-700" onClick={() => onChange({ highlights: value.highlights.filter((_, j) => j !== i) })} aria-label="Remover">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function CareEditor({ value, onChange }: { value: SiteSettings['care']; onChange: (p: Partial<SiteSettings['care']>) => void }) {
  return (
    <div className="space-y-6">
      <Card title="Página Cuidados">
        <div className="grid gap-6 md:grid-cols-[1fr_14rem]">
          <div className="space-y-4">
            <Field label="Linha superior"><input className="admin-input" value={value.eyebrow} onChange={(e) => onChange({ eyebrow: e.target.value })} /></Field>
            <Field label="Título"><input className="admin-input" value={value.title} onChange={(e) => onChange({ title: e.target.value })} /></Field>
            <Field label="Introdução"><textarea className="admin-input min-h-24" value={value.intro} onChange={(e) => onChange({ intro: e.target.value })} /></Field>
          </div>
          <Field label="Imagem">
            <SingleImageUploader value={value.image_url} onChange={(url) => onChange({ image_url: url })} folder="site" aspect="aspect-[5/6]" />
          </Field>
        </div>
      </Card>
      <Card
        title="Cuidados por material"
        actions={<button type="button" className="admin-btn admin-btn-ghost" onClick={() => onChange({ materials: [...value.materials, { title: '', text: '' }] })}><Plus className="size-4" /> Adicionar</button>}
      >
        <div className="space-y-3">
          {value.materials.map((m, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[12rem_1fr_2.5rem]">
              <input className="admin-input" placeholder="Material" value={m.title} onChange={(e) => onChange({ materials: value.materials.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
              <textarea className="admin-input min-h-20" placeholder="Como cuidar" value={m.text} onChange={(e) => onChange({ materials: value.materials.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
              <button type="button" className="grid place-items-center rounded-md text-mute hover:bg-rose-50 hover:text-rose-700" onClick={() => onChange({ materials: value.materials.filter((_, j) => j !== i) })} aria-label="Remover">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-mute">Na página de cada produto, aparece primeiro o cuidado do material correspondente (ex.: “Prata 925”).</p>
      </Card>
      <Card title="Dicas do dia a dia">
        <Field label="Título da seção" className="mb-4"><input className="admin-input" value={value.tips_title} onChange={(e) => onChange({ tips_title: e.target.value })} /></Field>
        <StringListEditor value={value.tips} onChange={(tips) => onChange({ tips })} placeholder="Nova dica" />
      </Card>
      <Card title="Mensagem final">
        <Field label="Texto acima dos botões de WhatsApp"><input className="admin-input" value={value.note} onChange={(e) => onChange({ note: e.target.value })} /></Field>
      </Card>
    </div>
  );
}

function AttendantsEditor({ value, onChange }: { value: SiteSettings['attendants']; onChange: (v: SiteSettings['attendants']) => void }) {
  return (
    <Card
      title="Atendentes do WhatsApp"
      actions={<button type="button" className="admin-btn admin-btn-ghost" onClick={() => onChange([...value, { id: `atendente-${Date.now().toString(36)}`, name: '', phone: '55', active: true }])}><Plus className="size-4" /> Adicionar</button>}
    >
      <p className="mb-4 text-sm text-mute">O cliente escolhe para quem enviar o pedido. Use o formato internacional: 55 + DDD + número (somente dígitos).</p>
      <div className="space-y-4">
        {value.map((a, i) => {
          const valid = isValidWhatsAppNumber(a.phone);
          return (
            <div key={a.id} className="rounded-lg border border-line p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <Field label="Nome"><input className="admin-input" value={a.name} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></Field>
                <Field label="WhatsApp" error={!valid ? 'Formato: 55 + DDD + número' : undefined} hint={valid ? formatPhoneDisplay(a.phone) : undefined}>
                  <input className="admin-input font-mono" inputMode="numeric" aria-invalid={!valid} value={a.phone} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, phone: normalizePhone(e.target.value) } : x)))} />
                </Field>
                <div className="flex items-end gap-2 pb-1">
                  <Toggle checked={a.active} onChange={(v) => onChange(value.map((x, j) => (j === i ? { ...x, active: v } : x)))} label="Ativo" />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                {valid && <a className="text-emerald underline" href={`https://wa.me/${a.phone}?text=${encodeURIComponent('Teste do site Dois Brilhos')}`} target="_blank" rel="noreferrer">Testar link</a>}
                {value.length > 1 && <button type="button" className="text-rose-700 underline" onClick={() => onChange(value.filter((_, j) => j !== i))}>Remover</button>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function InstagramEditor({ value, onChange }: { value: SiteSettings['instagram']; onChange: (p: Partial<SiteSettings['instagram']>) => void }) {
  return (
    <div className="space-y-6">
      <Card title="Perfil">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Usuário" hint="sem @"><input className="admin-input" value={value.handle} onChange={(e) => onChange({ handle: e.target.value.replace('@', '') })} /></Field>
          <Field label="Link do perfil"><input className="admin-input" type="url" value={value.profile_url} onChange={(e) => onChange({ profile_url: e.target.value })} /></Field>
        </div>
      </Card>
      <Card
        title="Publicações em destaque"
        actions={value.posts.length < 6 && <button type="button" className="admin-btn admin-btn-ghost" onClick={() => onChange({ posts: [...value.posts, { image_url: '', link: '', caption: '' }] })}><Plus className="size-4" /> Adicionar</button>}
      >
        <p className="mb-4 text-sm text-mute">Até 6 publicações. Envie a imagem do post e cole o link dele no Instagram. Sem publicações, a loja exibe um convite para seguir o perfil.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {value.posts.map((p, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-line p-3">
              <SingleImageUploader value={p.image_url} onChange={(url) => onChange({ posts: value.posts.map((x, j) => (j === i ? { ...x, image_url: url } : x)) })} folder="instagram" aspect="aspect-square" />
              <input className="admin-input" placeholder="Link do post" value={p.link} onChange={(e) => onChange({ posts: value.posts.map((x, j) => (j === i ? { ...x, link: e.target.value } : x)) })} />
              <input className="admin-input" placeholder="Descrição (opcional)" value={p.caption ?? ''} onChange={(e) => onChange({ posts: value.posts.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)) })} />
              <button type="button" className="text-xs text-rose-700 underline" onClick={() => onChange({ posts: value.posts.filter((_, j) => j !== i) })}>Remover</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
