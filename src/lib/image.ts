/**
 * Redimensiona e comprime uma imagem no navegador antes do upload.
 * Mantém as fotos leves (melhor desempenho no celular) sem perder qualidade visível.
 */
export async function compressImage(file: File, maxSize = 1600, quality = 0.86): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Arquivo não é uma imagem');
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (blob) return blob;
  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  return jpeg ?? file;
}

/**
 * URL da versão pequena (~480px) de uma foto de produto, usada nos cards e miniaturas.
 * Convenção: "<arquivo>-sm.webp" ao lado do original (gerado no upload e nas imagens de exemplo).
 * Para URLs sem versão pequena conhecida, devolve a própria URL.
 */
export function smallImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/\/demo\/.+-\d\.webp$/.test(url)) return url.replace(/\.webp$/, '-sm.webp');
  if (/\/storage\/v1\/object\/public\/product-images\/produtos\/[^?]+\.webp$/.test(url)) return url.replace(/\.webp$/, '-sm.webp');
  return url;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
