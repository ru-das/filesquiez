import { search } from '../search.js';
import { need } from '../lib.js';

function toBlob(canvas, type, q) {
  return new Promise((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('Encoding failed'))), type, q));
}

// Returns encode(quality 0..1, scale) -> Promise<Blob> for the given image data and output mime.
export async function makeEncoder(source, mime) {
  const bmp = await createImageBitmap(source, { imageOrientation: 'from-image' });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return async (q, scale) => {
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    canvas.width = w; canvas.height = h;
    if (mime === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
    ctx.drawImage(bmp, 0, 0, w, h);
    if (mime === 'image/png') {
      const colors = 2 + Math.round(q * 254);
      const png = UPNG.encode([ctx.getImageData(0, 0, w, h).data.buffer], w, h, colors);
      return new Blob([png], { type: mime });
    }
    return toBlob(canvas, mime, 0.02 + q * 0.98);
  };
}

export async function compress(file, targetBytes, onProgress) {
  const mime = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ? file.type : 'image/jpeg';
  if (mime === 'image/png') await need('png', m => onProgress(0, m));
  const encode = await makeEncoder(file, mime);
  const { blob, targetMet } = await search(encode, targetBytes, onProgress);
  return { blob, targetMet, notes: ['Metadata was removed.'] };
}
