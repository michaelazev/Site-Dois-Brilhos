import { cn, discountPercent, formatPrice } from '@/lib/format';

export function Price({
  price,
  promo,
  size = 'sm',
  className,
}: {
  price: number;
  promo: number | null;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const hasPromo = promo != null && promo < price;
  const pct = discountPercent({ price, promo_price: promo });
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2.5 gap-y-1', className)}>
      <span className={cn('tracking-wide text-ink', size === 'lg' ? 'font-display text-3xl' : 'text-[0.92rem]')}>
        {formatPrice(hasPromo ? promo! : price)}
      </span>
      {hasPromo && (
        <>
          <span className={cn('text-mute line-through decoration-gold/70', size === 'lg' ? 'text-base' : 'text-xs')}>
            <span className="sr-only">Preço anterior: </span>
            {formatPrice(price)}
          </span>
          <span className="text-[0.62rem] font-medium uppercase tracking-[0.18em] text-gold-deep">−{pct}%</span>
        </>
      )}
    </div>
  );
}
