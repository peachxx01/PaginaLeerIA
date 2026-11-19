'use strict';

const $ = id => document.getElementById(id);

/* =========================================================
   Demo de alineación (mismo criterio que src/reading.js)
   ========================================================= */
function tokens(text) { return text.normalize('NFC').match(/[\p{L}\p{M}]+/gu) || []; }
const key = w => w.toLocaleLowerCase('es').normalize('NFC');

// Distancia de edición con recorrido inverso; prioriza la diagonal, luego la
// inserción y por último la omisión, como en la aplicación.
function align(expected, spoken) {
  const a = tokens(expected), b = tokens(spoken);
  const d = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = 0; i <= a.length; i++) d[i][0] = i;
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (key(a[i - 1]) === key(b[j - 1]) ? 0 : 1));
  }
  const ops = []; let i = a.length, j = b.length;
  while (i || j) {
    const same = i && j && key(a[i - 1]) === key(b[j - 1]);
    if (i && j && d[i][j] === d[i - 1][j - 1] + (same ? 0 : 1)) {
      ops.push(same ? { kind: 'ok', word: b[j - 1] } : { kind: 'sub', word: b[j - 1], target: a[i - 1] }); i--; j--;
    } else if (j && d[i][j] === d[i][j - 1] + 1) { ops.push({ kind: 'ins', word: b[j - 1] }); j--; }
    else { ops.push({ kind: 'omi', word: a[i - 1] }); i--; }
  }
  return { ops: ops.reverse(), target: a.length, spoken: b.length };
}

const LABELS = { ok: 'correcta', sub: 'en lugar de', omi: 'omitida', ins: 'agregada' };
const fmt = n => Number.isFinite(n) ? Math.round(n).toLocaleString('es-AR') : '–';

function updateDemo() {
  const expected = $('d-expected').value, spoken = $('d-spoken').value;
  const seconds = Number($('d-seconds').value);
  $('d-seconds-out').textContent = `${seconds} s`;
  const err = $('d-error'), box = $('d-tokens');
  let msg = '';
  if (/\p{N}/u.test(expected + spoken)) msg = 'Escribí los números con palabras, como pide el protocolo de LeerIA.';
  else if (!tokens(expected).length) msg = 'Escribí el texto del docente.';
  else if (tokens(expected).length > 600 || tokens(spoken).length > 1200) msg = 'La revisión admite hasta 600 palabras objetivo.';
  err.hidden = !msg; err.textContent = msg;
  if (msg) { box.replaceChildren(); ['m-ppm', 'm-ppcm', 'm-acc'].forEach(id => $(id).textContent = '–'); return; }

  const { ops, target, spoken: count } = align(expected, spoken);
  const correct = ops.filter(o => o.kind === 'ok').length;
  $('m-ppm').textContent = fmt(60 * count / seconds);
  $('m-ppcm').textContent = fmt(60 * correct / seconds);
  $('m-acc').textContent = `${fmt(100 * correct / target)}%`;

  box.replaceChildren(...ops.map(o => {
    const el = document.createElement('span');
    el.className = `tok ${o.kind}`;
    const w = document.createElement('span'); w.className = 'w'; w.textContent = o.word;
    const s = document.createElement('small');
    s.textContent = o.kind === 'sub' ? `en lugar de «${o.target}»` : LABELS[o.kind];
    el.append(w, s);
    return el;
  }));
}

let debounce;
['d-expected', 'd-spoken'].forEach(id => $(id).addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(updateDemo, 120); }));
$('d-seconds').addEventListener('input', updateDemo);
updateDemo();
