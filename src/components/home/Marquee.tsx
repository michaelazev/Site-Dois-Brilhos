import { Sparkle } from '../brand/Logo';

export function Marquee({ items }: { items: string[] }) {
  if (!items.length) return null;
  const row = [...items, ...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-emerald-soft bg-emerald py-4 text-ivory" aria-label={items.join(', ')}>
      <div className="flex w-max animate-marquee items-center motion-reduce:animate-none" aria-hidden="true">
        {[0, 1].map((k) => (
          <div key={k} className="flex items-center">
            {row.map((t, i) => (
              <span key={`${k}-${i}`} className="flex items-center gap-8 px-8 font-display text-xl italic tracking-wide sm:text-2xl">
                {t}
                <Sparkle className="size-3 text-gold-light" filled />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
