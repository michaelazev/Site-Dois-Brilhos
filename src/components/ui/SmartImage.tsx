import { useCallback, useEffect, useState, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/format';
import { smallImageUrl } from '@/lib/image';
import { Sparkle } from '../brand/Logo';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  imgClassName?: string;
  priority?: boolean;
  /** Usa a versão pequena (~480px) da foto, ideal para cards e miniaturas. */
  small?: boolean;
};

/**
 * Imagem com carregamento preguiçoso, fade-in suave e fallback elegante.
 * - Se a foto já está no cache do aparelho, aparece na hora (sem "piscar").
 * - Com `small`, tenta a versão leve e volta para a original se ela não existir.
 */
export function SmartImage({ src, alt, className, imgClassName, priority = false, small = false, ...rest }: Props) {
  const preferred = small ? smallImageUrl(src) : src ?? null;
  const [current, setCurrent] = useState<string | null>(preferred);
  const [loaded, setLoaded] = useState(false);
  const [instant, setInstant] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrent(preferred);
    setFailed(false);
    setLoaded(false);
    setInstant(false);
  }, [preferred]);

  // Imagem já em cache: o navegador a tem "complete" antes do onLoad — mostra sem transição.
  const imgRef = useCallback((el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth > 0) {
      setInstant(true);
      setLoaded(true);
    }
  }, []);

  const handleError = () => {
    if (src && current !== src) setCurrent(src); // versão pequena não existe: usa a original
    else setFailed(true);
  };

  return (
    <div className={cn('relative overflow-hidden bg-pearl', className)}>
      {!loaded && !failed && current && <div className="skeleton absolute inset-0" aria-hidden="true" />}
      {(!current || failed) && (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-pearl to-sand text-gold" aria-hidden="true">
          <Sparkle className="size-8 opacity-60" />
        </div>
      )}
      {current && !failed && (
        <img
          ref={imgRef}
          key={current}
          src={current}
          alt={alt ?? ''}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          // @ts-expect-error fetchpriority ainda não está nos tipos do React 18
          fetchpriority={priority ? 'high' : undefined}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={cn(
            'h-full w-full object-cover',
            !instant && 'transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
          {...rest}
        />
      )}
    </div>
  );
}
