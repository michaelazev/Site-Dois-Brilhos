import { Link } from 'react-router-dom';
import { PageTransition } from '@/components/motion/PageTransition';
import { Seo } from '@/components/Seo';
import { Sparkle } from '@/components/brand/Logo';

export default function NotFoundPage() {
  return (
    <PageTransition>
      <Seo title="Página não encontrada" noindex />
      <div className="container-lux flex min-h-[75vh] flex-col items-center justify-center pt-24 text-center">
        <Sparkle className="size-10 text-gold" />
        <p className="mt-6 font-display text-8xl text-emerald/20">404</p>
        <h1 className="mt-2 text-4xl text-emerald">Esta página perdeu o brilho</h1>
        <p className="mt-3 text-mute">O endereço pode ter mudado ou a peça não está mais disponível.</p>
        <Link to="/loja" className="btn btn-primary mt-10">Ver a loja</Link>
      </div>
    </PageTransition>
  );
}
