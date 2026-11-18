import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

/**
 * Pré-carrega as fontes principais (latin) no <head>.
 * Sem isso, o texto aparece primeiro numa fonte do sistema e "pula" para a
 * fonte da marca quando ela chega — uma das piscadas percebidas no celular.
 */
function preloadFonts(patterns: RegExp[]): Plugin {
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml(_html, ctx) {
      if (!ctx.bundle) return [];
      return Object.keys(ctx.bundle)
        .filter((file) => file.endsWith('.woff2') && patterns.some((p) => p.test(file)))
        .map((file) => ({
          tag: 'link',
          attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${file}`, crossorigin: '' },
          injectTo: 'head' as const,
        }));
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    preloadFonts([/jost-latin-wght-normal/, /cormorant-garamond-latin-400-normal/]),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          // arquivo próprio: baixa em paralelo e continua em cache quando só o código da loja muda
          supabase: ['@supabase/supabase-js'],
          data: ['@tanstack/react-query', 'zustand', 'zod'],
        },
      },
    },
  },
});
