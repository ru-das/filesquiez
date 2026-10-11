// Downloads vendor libraries only when a compressor needs them.
const bundles = {
  png: { label: 'PNG engine', kb: 77, srcs: ['vendor/pako.min.js', 'vendor/UPNG.js'] }, // UPNG reads window.pako at load
  zip: { label: 'document engine', kb: 95, srcs: ['vendor/jszip.min.js'] },
  pdflib: { label: 'PDF engine', kb: 513, srcs: ['vendor/pdf-lib.min.js'] },
  pdfjs: { label: 'PDF renderer', kb: 1374, srcs: ['vendor/pdf.min.js'], warm: ['vendor/pdf.worker.min.js'] },
};
const pending = {}, ready = new Set();

const script = src => new Promise((resolve, reject) => {
  const s = document.createElement('script');
  s.src = src;
  s.onload = resolve;
  s.onerror = () => { s.remove(); reject(new Error(`Could not download ${src}. Check your connection and try again.`)); };
  document.head.append(s);
});

const size = kb => (kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB');

export function need(name, onStatus) {
  const b = bundles[name];
  if (!ready.has(name)) onStatus?.(`Downloading ${b.label} (${size(b.kb)})...`);
  return pending[name] ||= (async () => {
    const warm = (b.warm || []).map(u => fetch(u).then(r => r.blob()).catch(() => {}));
    for (const src of b.srcs) await script(src);
    await Promise.all(warm);
    ready.add(name);
  })().catch(err => { delete pending[name]; throw err; });
}
