const lines = s => s.split('\n').map(l => l.trim()).filter(Boolean).join('\n');

const minifiers = {
  json: s => JSON.stringify(JSON.parse(s)),
  css: s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim(),
  svg: s => s.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim(),
  xml: s => s.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').trim(),
  html: s => {
    s = s.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');
    return /<(pre|textarea)\b/i.test(s) ? s : lines(s);
  },
  js: s => {
    s = s.split('\n').filter(l => !/^\s*\/\/(?!#)/.test(l)).join('\n');
    return s.includes('`') ? s.replace(/[ \t]+$/gm, '').replace(/\n{2,}/g, '\n') : lines(s);
  },
};
minifiers.htm = minifiers.html;
minifiers.mjs = minifiers.js;

export const textTypes = Object.keys(minifiers);

export async function compress(file, targetBytes) {
  const ext = file.name.split('.').pop().toLowerCase();
  let out;
  try { out = minifiers[ext](await file.text()); } catch { return { blob: file, targetMet: false, notes: ['Could not parse this file; it was left unchanged.'] }; }
  const blob = new Blob([out], { type: file.type });
  return { blob, targetMet: blob.size <= targetBytes, notes: ['Whitespace and comments were removed.'] };
}
