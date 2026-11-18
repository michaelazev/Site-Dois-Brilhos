import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import type { ProductImage } from '@/types';
import { cn } from '@/lib/format';
import { SmartImage } from '../ui/SmartImage';
import { EASE } from '../motion/Reveal';

/** Galeria com zoom ao passar o mouse, swipe no celular e visualização ampliada (lightbox). */
export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const list = images.length ? images : [{ id: 'none', url: '', alt: name } as ProductImage];
  const current = list[index] ?? list[0];

  const go = (next: number) => {
    setDirection(next > index ? 1 : -1);
    setIndex((next + list.length) % list.length);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60) go(index + 1);
    else if (info.offset.x > 60) go(index - 1);
  };

  const onMove = (e: React.MouseEvent) => {
    const r = frameRef.current?.getBoundingClientRect();
    if (!r) return;
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row">
      {list.length > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto md:w-20 md:flex-col md:overflow-visible" role="tablist" aria-label="Miniaturas">
          {list.map((img, i) => (
            <button
              key={img.id}
              role="tab"
              aria-selected={i === index}
              aria-label={`Imagem ${i + 1}`}
              onClick={() => go(i)}
              className={cn('relative w-16 shrink-0 transition-opacity duration-300 md:w-full', i === index ? 'opacity-100' : 'opacity-50 hover:opacity-90')}
            >
              <SmartImage small src={img.url} alt="" className="aspect-[4/5]" />
              {i === index && <motion.span layoutId="thumb-active" className="absolute inset-x-0 -bottom-1.5 h-px bg-emerald" />}
            </button>
          ))}
        </div>
      )}

      <div
        ref={frameRef}
        className="relative aspect-[4/5] flex-1 cursor-zoom-in overflow-hidden bg-pearl"
        onMouseMove={onMove}
        onMouseLeave={() => setZoom(null)}
        onClick={() => current.url && setLightbox(true)}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current.id + index}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.6, ease: EASE }}
            drag={list.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={onDragEnd}
            className="absolute inset-0"
          >
            <SmartImage
              src={current.url}
              alt={current.alt ?? name}
              priority={index === 0}
              className="h-full w-full"
              imgClassName="transition-transform duration-500 ease-out will-change-transform"
              style={zoom ? { transform: 'scale(1.9)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          </motion.div>
        </AnimatePresence>

        <span className="pointer-events-none absolute bottom-4 right-4 grid size-10 place-items-center rounded-full bg-ivory/85 text-emerald md:backdrop-blur" aria-hidden="true">
          <Expand className="size-4" strokeWidth={1.3} />
        </span>
        {list.length > 1 && (
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden" aria-hidden="true">
            {list.map((_, i) => (
              <span key={i} className={cn('h-1 rounded-full transition-all duration-500', i === index ? 'w-6 bg-emerald' : 'w-1.5 bg-emerald/30')} />
            ))}
          </div>
        )}
      </div>

      <Lightbox open={lightbox} images={list} index={index} onIndex={go} onClose={() => setLightbox(false)} name={name} />
    </div>
  );
}

function Lightbox({
  open,
  images,
  index,
  onIndex,
  onClose,
  name,
}: {
  open: boolean;
  images: ProductImage[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  name: string;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex(index + 1);
      if (e.key === 'ArrowLeft') onIndex(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, index, onIndex, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-emerald-deep/95 md:backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={`Imagens ampliadas de ${name}`}
          onClick={onClose}
        >
          <button className="absolute right-4 top-4 z-10 p-3 text-ivory" onClick={onClose} aria-label="Fechar">
            <X className="size-6" strokeWidth={1.2} />
          </button>
          <AnimatePresence mode="wait">
            <motion.img
              key={index}
              src={images[index]?.url}
              alt={images[index]?.alt ?? name}
              className="max-h-[88vh] max-w-[92vw] object-contain"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.5, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
            />
          </AnimatePresence>
          {images.length > 1 && (
            <>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-ivory/80 hover:text-ivory sm:left-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onIndex(index - 1);
                }}
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="size-8" strokeWidth={1} />
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-ivory/80 hover:text-ivory sm:right-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onIndex(index + 1);
                }}
                aria-label="Próxima imagem"
              >
                <ChevronRight className="size-8" strokeWidth={1} />
              </button>
              <p className="absolute bottom-6 text-xs tracking-[0.3em] text-ivory/60">
                {index + 1} / {images.length}
              </p>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
