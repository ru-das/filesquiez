import { search } from '../search.js';
import { makeEncoder } from './image.js';
import { need } from '../lib.js';

const MIMES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export async function compress(file, targetBytes, onProgress) {
  await need('zip', m => onProgress(0, m));
  const zip = await JSZip.loadAsync(file);
  const mimeEntry = zip.file('mimetype'); // ODT/EPUB: must stay first and uncompressed
  const mimeText = mimeEntry ? await mimeEntry.async('string') : null;

  const images = [];
  for (const entry of Object.values(zip.files)) {
    const ext = entry.name.split('.').pop().toLowerCase();
    if (entry.dir || !MIMES[ext] || !/(^|\/)(media|Pictures|images?)\//i.test(entry.name)) continue;
    if (ext === 'png') await need('png', m => onProgress(0.02, m));
    const orig = new Blob([await entry.async('arraybuffer')], { type: MIMES[ext] });
    try { images.push({ name: entry.name, orig, encode: await makeEncoder(orig, MIMES[ext]) }); } catch { /* undecodable: keep as is */ }
  }

  const build = async (replacements) => {
    for (const [name, blob] of replacements) zip.file(name, blob);
    if (mimeText !== null) zip.file('mimetype', mimeText, { compression: 'STORE' });
    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 }, mimeType: file.type || undefined });
  };

  onProgress(0.05, 'Repacking...');
  const plain = await build([]);
  if (plain.size <= targetBytes || !images.length) {
    return { blob: plain, targetMet: plain.size <= targetBytes, notes: images.length ? [] : ['No embedded images found to compress.'] };
  }

  const encode = async (q, scale) => {
    const reps = [];
    for (const im of images) {
      const b = await im.encode(q, scale);
      reps.push([im.name, b.size < im.orig.size ? b : im.orig]);
    }
    return build(reps);
  };
  const res = await search(encode, targetBytes, (p, m) => onProgress(0.1 + p * 0.9, m), 0.1);
  return { blob: res.blob, targetMet: res.targetMet, notes: ['Embedded images were recompressed at lower quality.'] };
}
