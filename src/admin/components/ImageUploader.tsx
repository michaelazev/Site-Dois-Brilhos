import { useRef, useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { GripVertical, ImagePlus, Loader2, Star, Trash2, Upload } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/format';

export interface UploadedImage {
  key: string;
  url: string;
  path: string | null;
  alt: string | null;
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';
const MAX_MB = 15;

/** Upload múltiplo com arrastar para reordenar. A primeira imagem é a principal. */
export function MultiImageUploader({ value, onChange, folder, altBase }: { value: UploadedImage[]; onChange: (v: UploadedImage[]) => void; folder: string; altBase: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const toast = useToast();

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => {
      if (!f.type.startsWith('image/')) {
        toast(`"${f.name}" não é uma imagem.`, 'error');
        return false;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        toast(`"${f.name}" passa de ${MAX_MB} MB.`, 'error');
        return false;
      }
      return true;
    });
    if (!list.length) return;
    setUploading((n) => n + list.length);
    const results: UploadedImage[] = [];
    for (const file of list) {
      try {
        const { url, path } = await api.uploadImage(file, folder);
        results.push({ key: crypto.randomUUID(), url, path, alt: altBase });
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Falha no envio da imagem.', 'error');
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (results.length) onChange([...value, ...results]);
  };

  return (
    <div>
      <Reorder.Group axis="x" values={value} onReorder={onChange} className="flex flex-wrap gap-3">
        {value.map((img, i) => (
          <Reorder.Item key={img.key} value={img} className="group relative w-28 cursor-grab active:cursor-grabbing" whileDrag={{ scale: 1.05, zIndex: 10 }}>
            <div className={cn('relative aspect-[4/5] overflow-hidden rounded-lg border bg-pearl', i === 0 ? 'border-gold ring-2 ring-gold/30' : 'border-line')}>
              <img src={img.url} alt="" className="h-full w-full object-cover" draggable={false} />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[0.6rem] font-medium text-white">
                  <Star className="size-2.5 fill-current" /> Principal
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100">
                <GripVertical className="size-4 text-white" />
                <div className="flex gap-1">
                  {i !== 0 && (
                    <button type="button" title="Tornar principal" className="rounded bg-white/90 p-1 text-gold-deep" onClick={() => onChange([img, ...value.filter((x) => x.key !== img.key)])}>
                      <Star className="size-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Remover"
                    className="rounded bg-white/90 p-1 text-rose-700"
                    // O arquivo só é apagado do Storage quando o produto é excluído,
                    // assim cancelar a edição nunca deixa o produto com imagem quebrada.
                    onClick={() => onChange(value.filter((x) => x.key !== img.key))}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </Reorder.Item>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <div key={`up-${i}`} className="grid aspect-[4/5] w-28 place-items-center rounded-lg border border-dashed border-gold bg-pearl">
            <Loader2 className="size-5 animate-spin text-gold" />
          </div>
        ))}
        <motion.button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            'grid aspect-[4/5] w-28 place-items-center rounded-lg border-2 border-dashed text-center text-xs text-mute transition-colors',
            dragOver ? 'border-gold bg-champagne/30' : 'border-line hover:border-gold hover:text-gold-deep',
          )}
        >
          <span className="flex flex-col items-center gap-1.5 px-2">
            <ImagePlus className="size-5" />
            Adicionar fotos
          </span>
        </motion.button>
      </Reorder.Group>
      <input ref={inputRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files).finally(() => (e.target.value = ''))} />
      <p className="mt-2 text-xs text-mute">Arraste para reordenar. A primeira foto é a principal. As imagens são otimizadas automaticamente antes do envio.</p>
    </div>
  );
}

/** Upload de uma única imagem (banners, capas de categoria etc.). */
export function SingleImageUploader({ value, onChange, folder, aspect = 'aspect-[4/3]' }: { value: string; onChange: (url: string) => void; folder: string; aspect?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const onFile = async (file?: File) => {
    if (!file) return;
    setLoading(true);
    try {
      const { url } = await api.uploadImage(file, folder);
      onChange(url);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Falha no envio da imagem.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn('group relative block w-full overflow-hidden rounded-lg border border-line bg-pearl', aspect)}
      >
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : null}
        <span className={cn('absolute inset-0 grid place-items-center text-sm transition-colors', value ? 'bg-black/0 text-transparent group-hover:bg-black/40 group-hover:text-white' : 'text-mute')}>
          {loading ? <Loader2 className="size-5 animate-spin text-gold" /> : (
            <span className="flex flex-col items-center gap-1.5"><Upload className="size-5" />{value ? 'Trocar imagem' : 'Enviar imagem'}</span>
          )}
        </span>
      </button>
      <input className="admin-input text-xs" value={value} onChange={(e) => onChange(e.target.value)} placeholder="…ou cole a URL da imagem" />
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => onFile(e.target.files?.[0]).finally(() => (e.target.value = ''))} />
    </div>
  );
}
