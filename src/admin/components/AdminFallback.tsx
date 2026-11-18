import { Loader2 } from 'lucide-react';

export function AdminFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-pearl text-emerald">
      <Loader2 className="size-6 animate-spin" aria-label="Carregando painel" />
    </div>
  );
}
