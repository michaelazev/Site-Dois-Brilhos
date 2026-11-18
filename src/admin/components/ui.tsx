import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/format';
import { ORDER_STATUSES, type OrderStatus } from '@/types';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-4xl text-emerald">{title}</h1>
        {description && <p className="mt-1 text-sm text-mute">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-ink">
        {label}
        {hint && <span className="text-xs font-normal text-mute">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-700" role="alert">{error}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-emerald' : 'bg-line')}
      >
        <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 32 }} className={cn('absolute top-0.5 size-4 rounded-full bg-white shadow', checked ? 'right-0.5' : 'left-0.5')} />
      </button>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-mute">{description}</span>}
      </span>
    </label>
  );
}

export function Card({ children, className, title, actions }: { children: ReactNode; className?: string; title?: string; actions?: ReactNode }) {
  return (
    <section className={cn('admin-card p-5 md:p-6', className)}>
      {(title || actions) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-2xl text-emerald">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={cn('relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl text-emerald">{title}</h2>
              <button onClick={onClose} className="rounded-full p-1.5 text-mute hover:bg-pearl hover:text-ink" aria-label="Fechar">
                <X className="size-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Excluir',
  onConfirm,
  onClose,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-600" />
        <p className="text-sm text-ink/80">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button className="admin-btn admin-btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="admin-btn bg-rose-700 text-white hover:bg-rose-800" onClick={onConfirm} disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />} {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

const TONES: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  sky: 'bg-sky-50 text-sky-800 ring-sky-200',
  orange: 'bg-orange-50 text-orange-800 ring-orange-200',
  emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  violet: 'bg-violet-50 text-violet-800 ring-violet-200',
  indigo: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  green: 'bg-green-50 text-green-800 ring-green-200',
  rose: 'bg-rose-50 text-rose-800 ring-rose-200',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUSES.find((x) => x.value === status) ?? ORDER_STATUSES[0];
  return <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', TONES[s.tone])}>{s.label}</span>;
}

export function StatusSelect({ value, onChange, disabled }: { value: OrderStatus; onChange: (s: OrderStatus) => void; disabled?: boolean }) {
  return (
    <select className="admin-input !w-auto !py-1.5 text-sm" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as OrderStatus)} aria-label="Status do pedido">
      {ORDER_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-16 text-center">
      <p className="font-display text-2xl text-emerald">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm text-mute">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-emerald', className)} />;
}

export function LoadingBlock() {
  return (
    <div className="grid place-items-center py-24">
      <Spinner />
    </div>
  );
}

/** Lista de textos editável (ex.: itens do letreiro, dicas de cuidado). */
export function StringListEditor({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <ul className="space-y-2">
        {value.map((item, i) => (
          <li key={i} className="flex gap-2">
            <input className="admin-input" value={item} onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))} />
            <button type="button" className="admin-btn admin-btn-danger !px-3" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remover item">
              <X className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          ref={inputRef}
          className="admin-input"
          value={draft}
          placeholder={placeholder ?? 'Novo item'}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (draft.trim()) {
                onChange([...value, draft.trim()]);
                setDraft('');
              }
            }
          }}
        />
        <button
          type="button"
          className="admin-btn admin-btn-ghost"
          onClick={() => {
            if (draft.trim()) {
              onChange([...value, draft.trim()]);
              setDraft('');
              inputRef.current?.focus();
            }
          }}
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
