// Target size control: free text ("20", "1.5 mb"), and a KB | MB toggle.
const UNITS = { k: 1024, kb: 1024, m: 1048576, mb: 1048576 };

export function sizePicker({ input, toggle, onEnter }) {
  const btns = [...toggle.querySelectorAll('[role=radio]')];
  let unit = 1024;

  const setUnit = bytes => {
    unit = bytes;
    btns.forEach(b => {
      const on = +b.dataset.value === bytes;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
  };
  btns.forEach((b, i) => {
    b.onclick = () => setUnit(+b.dataset.value);
    b.onkeydown = e => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const n = btns[(i + d + btns.length) % btns.length];
      n.focus();
      n.click();
    };
  });

  // Typing "1.5mb" switches the toggle for you.
  input.addEventListener('input', () => {
    const m = input.value.match(/[a-z]+/i);
    if (m && UNITS[m[0].toLowerCase()]) setUnit(UNITS[m[0].toLowerCase()]);
  });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') onEnter?.(); });

  return {
    // Bytes the user asked for, or NaN if the text isn't a number.
    get bytes() {
      const m = input.value.trim().match(/^([\d.,]+)\s*([a-z]*)$/i);
      if (!m) return NaN;
      return Math.floor(parseFloat(m[1].replace(',', '.')) * (UNITS[m[2].toLowerCase()] || unit));
    },
    set disabled(v) { input.disabled = v; btns.forEach(b => (b.disabled = v)); },
  };
}
