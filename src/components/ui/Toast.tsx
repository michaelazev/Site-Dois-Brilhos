import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, AlertCircle, X } from 'lucide-react';

type Tone = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: Tone = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full bg-emerald-deep/95 py-3 pl-4 pr-3 text-sm text-ivory shadow-2xl shadow-emerald-deep/30 backdrop-blur"
              role={t.tone === 'error' ? 'alert' : 'status'}
            >
              {t.tone === 'error' ? <AlertCircle className="size-4 shrink-0 text-rose-300" /> : <Check className="size-4 shrink-0 text-gold-light" />}
              <span className="leading-snug">{t.message}</span>
              <button
                onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
                className="ml-1 rounded-full p-1 text-ivory/60 hover:text-ivory"
                aria-label="Fechar aviso"
              >
                <X className="size-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
