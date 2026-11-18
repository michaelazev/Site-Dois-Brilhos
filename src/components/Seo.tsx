import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useSettings } from '@/hooks/queries';
import { siteUrl } from '@/lib/supabase';

interface SeoProps {
  title?: string;
  description?: string;
  image?: string | null;
  type?: 'website' | 'product';
  jsonLd?: Record<string, unknown>;
  noindex?: boolean;
}

const absolute = (u: string) => (/^https?:|^data:/.test(u) ? u : `${siteUrl}${u.startsWith('/') ? '' : '/'}${u}`);

export function Seo({ title, description, image, type = 'website', jsonLd, noindex }: SeoProps) {
  const { data: settings } = useSettings();
  const { pathname } = useLocation();
  const baseTitle = settings?.seo.title ?? 'Dois Brilhos Joias';
  const fullTitle = title ? `${title} · Dois Brilhos Joias` : baseTitle;
  const desc = description || settings?.seo.description || '';
  const img = absolute(image || settings?.seo.og_image || '/og-image.svg');
  const url = `${siteUrl}${pathname}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type === 'product' ? 'product' : 'website'} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
