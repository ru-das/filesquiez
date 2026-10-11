import { suggest, unsupportedNote } from './warnings.js';
import { sizePicker } from './sizepicker.js';
import { need } from './lib.js';

const $ = id => document.getElementById(id);
const drop = $('drop'), input = $('file'), go = $('go'), out = $('out'), sizeInput = $('size');
let file = null, urls = [];
const size = sizePicker({
  input: sizeInput, toggle: $('unit'),
  onEnter: () => { if (!go.disabled) go.click(); },
});

const ext = f => f.name.split('.').pop().toLowerCase();
const fmt = b => (b >= 1048576 ? (b / 1048576).toFixed(2) + ' MB' : (b / 1024).toFixed(1) + ' KB');

const loaders = {}, libs = {}, icons = {};
const group = (exts, loader, lib, ic) => exts.forEach(e => { loaders[e] = loader; if (lib) libs[e] = lib; icons[e] = ic; });
group(['jpg', 'jpeg', 'webp'], () => import('./compressors/image.js'), null, 'image');
group(['png'], () => import('./compressors/image.js'), 'png', 'image');
group(['pdf'], () => import('./compressors/pdf.js'), 'pdflib', 'doc');
group(['docx', 'xlsx', 'pptx', 'odt', 'epub'], () => import('./compressors/office.js'), 'zip', 'doc');
group(['json', 'css', 'svg', 'xml', 'html', 'htm', 'js', 'mjs'], () => import('./compressors/text.js'), null, 'code');
for (const e of ['gif', 'bmp', 'avif']) icons[e] = 'image';
for (const e of ['txt', 'md', 'csv']) icons[e] = 'doc';

/* Theme */
const root = document.documentElement, pill = $('theme');
const savedTheme = () => { try { return localStorage.theme; } catch { return null; } };
function applyTheme(t) {
  root.dataset.theme = t;
  pill.setAttribute('aria-pressed', String(t === 'dark'));
  document.querySelector('meta[name=theme-color]').content = getComputedStyle(document.body).backgroundColor;
}
applyTheme(root.dataset.theme);
pill.onclick = () => {
  const t = root.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(t);
  try { localStorage.theme = t; } catch { /* storage blocked */ }
};
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => { if (!savedTheme()) applyTheme(e.matches ? 'dark' : 'light'); });

/* DOM helpers */
function el(tag, props = {}, ...kids) {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids);
  return n;
}
function icon(name) {
  const ns = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(ns, 'svg'), u = document.createElementNS(ns, 'use');
  s.setAttribute('class', 'i');
  s.setAttribute('aria-hidden', 'true');
  u.setAttribute('href', '#i-' + name);
  s.append(u);
  return s;
}
const fileIcon = f => icon(icons[ext(f)] || 'file');

/* File selection */
function setFile(f) {
  file = f;
  $('chip').hidden = !f;
  go.disabled = !f;
  if (!f) { input.value = ''; return; }
  $('chipName').textContent = f.name;
  $('chipSize').textContent = fmt(f.size);
  $('chipIcon').setAttribute('href', '#i-' + (icons[ext(f)] || 'file'));
  // Start downloading what this type needs while the user picks a size.
  loaders[ext(f)]?.().catch(() => {});
  if (libs[ext(f)]) need(libs[ext(f)]).catch(() => {});
}

input.onchange = () => setFile(input.files[0] || null);
$('clear').onclick = () => setFile(null);
['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
drop.addEventListener('dragleave', e => { if (!drop.contains(e.relatedTarget)) drop.classList.remove('over'); });
drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); setFile(e.dataTransfer.files[0] || null); });
drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
function progress(p, msg) {
  const pct = Math.round(p * 100);
  $('bar').style.width = pct + '%';
  $('bar').parentElement.setAttribute('aria-valuenow', pct);
  if (msg) $('status').textContent = msg;
}

/* Output */
const splitName = n => { const i = n.lastIndexOf('.'); return i > 0 ? [n.slice(0, i), n.slice(i)] : [n, '']; };
const cleanName = s => s.replace(/[\\/:*?"<>|\x00-\x1f]/g, '').trim();

// Outline = original size, orange fill = result, tick = target.
function gauge(orig, result, target) {
  const pct = n => Math.min(100, (n / orig) * 100).toFixed(1) + '%';
  const g = el('div', { className: 'gauge', role: 'img', ariaLabel: `Result ${fmt(result)} of original ${fmt(orig)}, target ${fmt(target)}` },
    el('span', { className: 'fill', style: `width:${pct(result)}` }));
  if (target < orig) g.append(el('span', { className: 'tick', style: `left:${pct(target)}` }));
  return el('div', {}, g);
}

function render(f, res, targetBytes, targetKB) {
  urls.forEach(u => URL.revokeObjectURL(u)); urls = [];
  const blob = res.blob.size < f.size ? res.blob : f; // never return something bigger
  const url = URL.createObjectURL(blob); urls.push(url);
  const met = blob.size <= targetBytes;
  const saved = Math.max(0, Math.round((1 - blob.size / f.size) * 100));
  const [base, dot] = splitName(f.name);
  const defBase = base + '_fileSquiez';

  out.replaceChildren(
    el('div', { className: 'res-head' },
      fileIcon(f),
      el('div', { className: 'meta' },
        el('div', { className: 'fname', textContent: f.name, title: f.name }),
        el('div', { className: 'sizes num' }, `${fmt(f.size)} \u2192 `, el('b', { textContent: fmt(blob.size) }), ' ',
          el('span', { className: saved ? 'saved' : '', textContent: `-${saved}%` }))),
      el('span', { className: 'badge ' + (met ? 'ok' : 'bad') }, icon(met ? 'ok' : 'alert'), met ? 'Target met' : 'Target not met')),
    gauge(f.size, blob.size, targetBytes),
  );
  if (!met) out.append(el('div', { className: 'warn' }, icon('alert'), el('span', { textContent: suggest(f, targetKB) })));
  if (/^image\/(jpeg|png|webp)$/.test(blob.type)) {
    const before = URL.createObjectURL(f); urls.push(before);
    out.append(el('div', { className: 'cmp' },
      el('figure', {}, el('img', { src: before, alt: 'Original image', decoding: 'async' }), el('figcaption', { textContent: 'Original' })),
      el('figure', {}, el('img', { src: url, alt: 'Compressed image', decoding: 'async' }), el('figcaption', { textContent: 'Squiezed' }))));
  }
  const notes = (res.notes || []).filter(Boolean);
  if (notes.length) out.append(el('ul', { className: 'notes' }, ...notes.map(n => el('li', {}, icon('info'), el('span', { textContent: n })))));

  const link = el('a', { className: 'go', href: url, download: defBase + dot }, icon('download'), 'Download');
  const nameInput = el('input', { type: 'text', value: defBase, maxLength: 200, spellcheck: false, ariaLabel: 'Output file name' });
  nameInput.addEventListener('input', () => { link.download = (cleanName(nameInput.value) || defBase) + dot; });
  nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') link.click(); });
  out.append(el('div', { className: 'save' },
    el('label', { className: 'namefield', title: 'Rename the output file' }, icon('pencil'), nameInput, dot ? el('span', { className: 'ext', textContent: dot }) : ''),
    link));
}

function showError(msg) {
  out.replaceChildren(el('div', { className: 'warn' }, icon('alert'), el('span', { textContent: msg })));
}

function setBusy(busy) {
  go.disabled = input.disabled = $('clear').disabled = busy;
  size.disabled = busy;
  go.querySelector('span').textContent = busy ? 'Squiezing...' : 'Squiez';
  $('progress').hidden = !busy;
}

go.onclick = async () => {
  if (!file) return;
  const targetBytes = size.bytes;
  const targetKB = Math.round(targetBytes / 102.4) / 10;
  if (!(targetBytes > 0)) { showError('Enter a target size greater than 0, like 20 or 1.5 mb.'); sizeInput.focus(); return; }
  if (targetBytes >= file.size) {
    render(file, { blob: file, notes: ['The file is already at or below that size, so it was left unchanged.'] }, targetBytes, targetKB);
    return;
  }
  setBusy(true);
  progress(0, 'Starting...');
  try {
    const load = loaders[ext(file)];
    const res = load ? await (await load()).compress(file, targetBytes, progress) : { blob: file, notes: [unsupportedNote] };
    render(file, res, targetBytes, targetKB);
  } catch (err) {
    console.error(err);
    showError('Something went wrong while compressing this file: ' + (err.message || err));
  } finally {
    setBusy(false);
    go.disabled = !file;
  }
};

if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
