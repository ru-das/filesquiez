import { search } from '../search.js';
import { need } from '../lib.js';

export async function compress(file, targetBytes, onProgress) {
  await need('pdflib', m => onProgress(0, m));
  const data = new Uint8Array(await file.arrayBuffer());
  const notes = [];

  onProgress(0.05, 'Optimizing PDF structure...');
  let lossless = null;
  try {
    const doc = await PDFLib.PDFDocument.load(data, { ignoreEncryption: true, updateMetadata: false });
    const bytes = await doc.save({ useObjectStreams: true });
    lossless = new Blob([bytes], { type: 'application/pdf' });
    if (lossless.size <= targetBytes) return { blob: lossless, targetMet: true, notes };
  } catch { /* fall through to rasterizing */ }

  await need('pdfjs', m => onProgress(0.08, m));
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
  const pdf = await pdfjsLib.getDocument({ data: data.slice() }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) pages.push(await pdf.getPage(i));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const encode = async (q, scale) => {
    const out = await PDFLib.PDFDocument.create();
    for (const page of pages) {
      const base = page.getViewport({ scale: 1 });
      const vp = page.getViewport({ scale: 2 * scale });
      canvas.width = Math.max(1, Math.round(vp.width));
      canvas.height = Math.max(1, Math.round(vp.height));
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      const jpg = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.02 + q * 0.98));
      const img = await out.embedJpg(new Uint8Array(await jpg.arrayBuffer()));
      out.addPage([base.width, base.height]).drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
    }
    return new Blob([await out.save({ useObjectStreams: true })], { type: 'application/pdf' });
  };

  const res = await search(encode, targetBytes, (p, m) => onProgress(0.1 + p * 0.9, m), 0.1);
  notes.push('Pages were converted to images, so text is no longer selectable or searchable.');
  if (!res.targetMet && lossless && lossless.size < res.blob.size) {
    return { blob: lossless, targetMet: false, notes: [] };
  }
  return { blob: res.blob, targetMet: res.targetMet, notes };
}
