import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '../motion/Reveal';
import { cn } from '@/lib/format';

export function SectionHeading({
  eyebrow,
  title,
  link,
  linkLabel = 'Ver todos',
  align = 'left',
  className,
  light = false,
}: {
  eyebrow?: string;
  title: string;
  link?: string;
  linkLabel?: string;
  align?: 'left' | 'center';
  className?: string;
  light?: boolean;
}) {
  return (
    <div className={cn('mb-10 flex flex-col gap-5 md:mb-14', align === 'center' ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between', className)}>
      <Reveal>
        {eyebrow && <p className={cn('eyebrow mb-3', light && '!text-gold-light')}>{eyebrow}</p>}
        <h2 className={cn('text-[2.4rem] leading-[1.05] sm:text-5xl lg:text-[3.6rem]', light ? 'text-ivory' : 'text-emerald')}>{title}</h2>
      </Reveal>
      {link && (
        <Reveal delay={0.1}>
          <Link
            to={link}
            className={cn('group inline-flex items-center gap-3 text-[0.7rem] font-medium uppercase tracking-[0.24em]', light ? 'text-gold-light' : 'text-emerald')}
          >
            <span className="link-underline">{linkLabel}</span>
            <ArrowRight className="size-4 transition-transform duration-500 group-hover:translate-x-1.5" strokeWidth={1.2} />
          </Link>
        </Reveal>
      )}
    </div>
  );
}
