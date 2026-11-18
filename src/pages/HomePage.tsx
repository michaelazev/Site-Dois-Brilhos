import { motion } from 'framer-motion';
import { PageTransition } from '@/components/motion/PageTransition';
import { Seo } from '@/components/Seo';
import { Hero } from '@/components/home/Hero';
import { Marquee } from '@/components/home/Marquee';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { CollectionsEditorial } from '@/components/home/CollectionsEditorial';
import { AboutTeaser } from '@/components/home/AboutTeaser';
import { Testimonials } from '@/components/home/Testimonials';
import { InstagramSection } from '@/components/home/InstagramSection';
import { ProductCarousel } from '@/components/product/ProductCarousel';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DeferredSection } from '@/components/ui/DeferredSection';
import { staggerParent, VIEWPORT_MARGIN } from '@/components/motion/Reveal';
import { useCategories, useCollections, useProducts, useSettings, useTestimonials } from '@/hooks/queries';

export default function HomePage() {
  const { data: settings } = useSettings();
  const { data: categories = [] } = useCategories();
  const { data: collections = [] } = useCollections();
  const featured = useProducts({ flag: 'is_featured' });
  const bestsellers = useProducts({ flag: 'is_bestseller' });
  const news = useProducts({ flag: 'is_new' });
  const { data: testimonials = [] } = useTestimonials();

  if (!settings) return null;
  const home = settings.home;

  const shownCategories = home.featured_category_ids.length
    ? home.featured_category_ids.map((id) => categories.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c)
    : categories.filter((c) => c.is_featured);

  return (
    <PageTransition>
      <Seo
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'JewelryStore',
          name: 'Dois Brilhos Joias',
          address: { '@type': 'PostalAddress', addressLocality: 'Recife', addressRegion: 'PE', addressCountry: 'BR' },
          sameAs: [settings.social.instagram, settings.social.linktree].filter(Boolean),
        }}
      />
      <Hero hero={settings.hero} />
      <Marquee items={home.marquee} />
      {/* âncora do link "Descubra" do banner, presente mesmo antes da seção montar */}
      <div id="inicio-categorias" className="scroll-mt-20">
        <DeferredSection minHeight={520}>
          <CategoryShowcase categories={shownCategories} />
        </DeferredSection>
      </div>

      <DeferredSection minHeight={640}>
        {(featured.isLoading || (featured.data?.length ?? 0) > 0) && (
          <section className="container-lux pb-20 md:pb-28">
            <SectionHeading eyebrow="Seleção" title={home.featured_title} link="/loja" />
            <ProductCarousel products={featured.data ?? []} loading={featured.isLoading} label={home.featured_title} />
          </section>
        )}
      </DeferredSection>

      <DeferredSection minHeight={900}>
        {(bestsellers.isLoading || (bestsellers.data?.length ?? 0) > 0) && (
          <section className="container-lux pb-20 md:pb-28">
            <SectionHeading eyebrow="Mais vendidos" title={home.bestsellers_title} link="/mais-vendidos" />
            <motion.div
              className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.05, margin: VIEWPORT_MARGIN }}
              variants={staggerParent}
            >
              {bestsellers.isLoading
                ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : bestsellers.data!.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
            </motion.div>
          </section>
        )}
      </DeferredSection>

      <DeferredSection minHeight={900}>
        <CollectionsEditorial collections={collections.filter((c) => c.is_featured)} title={home.collections_title} />
      </DeferredSection>

      <DeferredSection minHeight={640}>
        {(news.isLoading || (news.data?.length ?? 0) > 0) && (
          <section className="container-lux py-20 md:py-28">
            <SectionHeading eyebrow="Lançamentos" title={home.new_title} link="/novidades" />
            <ProductCarousel products={news.data ?? []} loading={news.isLoading} label={home.new_title} />
          </section>
        )}
      </DeferredSection>

      <DeferredSection minHeight={700}>
        <AboutTeaser about={settings.about} />
      </DeferredSection>
      <DeferredSection minHeight={300}>
        {home.show_testimonials && <Testimonials items={testimonials} />}
        {home.show_instagram && <InstagramSection instagram={settings.instagram} />}
      </DeferredSection>
    </PageTransition>
  );
}
