import { useState, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/format';
import { Sparkle } from '../brand/Logo';

/**
 * Imagem com carregamento preguiçoso, fade-in suave e fallback elegante
 * (caso a URL esteja quebrada ou ainda não exista foto).
 */
export function SmartImage({
  src,
  alt,
  className,
  imgClassName,
  priority = false,
  ...rest
}: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src?: string | null; imgClassName?: string; priority?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn('relative overflow-hidden bg-pearl', className)}>
      {!loaded && !failed && src && <div className="skeleton absolute inset-0" aria-hidden="true" />}
      {(!src || failed) && (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-pearl to-sand text-gold" aria-hidden="true">
          <Sparkle className="size-8 opacity-60" />
        </div>
      )}
      {src && !failed && (
        <img
          src={src}
          alt={alt ?? ''}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          // @ts-expect-error fetchpriority ainda não está nos tipos do React 18
          fetchpriority={priority ? 'high' : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover transition-opacity duration-700', loaded ? 'opacity-100' : 'opacity-0', imgClassName)}
          {...rest}
        />
      )}
    </div>
  );
}
