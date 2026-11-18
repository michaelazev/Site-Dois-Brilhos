import { useReducedMotion } from 'framer-motion';

const query = '(pointer: coarse), (max-width: 767px)';

/** true em celulares/tablets (toque ou tela estreita). Avaliado uma vez; não muda durante o uso. */
export const isTouchDevice = typeof window !== 'undefined' && window.matchMedia(query).matches;

/**
 * Modo "leve" de animação: em celulares ou com "reduzir movimento" ativado,
 * evitamos efeitos que forçam o navegador a redesenhar a tela a cada quadro
 * (parallax ligado à rolagem, clip-path animado, desfoque), mantendo apenas
 * opacidade e deslocamento, que rodam na GPU.
 */
export function useLiteMotion(): boolean {
  const reduce = useReducedMotion();
  return isTouchDevice || !!reduce;
}
