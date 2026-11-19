'use strict';

/* =========================================================
   1. Lectura del pitch (síntesis de voz del navegador)
   ========================================================= */
const PITCH = [
  { label: 'Apertura', section: 'inicio', text:
    '¡Buenas tardes a todos! Somos el equipo de LeerIA: Joel, Jazmín, Cecilia, Fernando, Anabel y Matías, de la escuela Maipú. Hoy queremos contarles cómo usamos la inteligencia artificial para ayudar a los docentes a evaluar algo fundamental: la lectura.' },
  { label: 'El problema', section: 'problema', text:
    'Pensemos en un aula de Mendoza. La docente tiene que evaluar la fluidez lectora de cada alumno, y hoy eso se hace a mano. Tiene que escuchar a cada chico, detectar errores de pronunciación, palabras omitidas o sustituidas, medir la velocidad de lectura y fijarse si hace bien las pausas. Todo eso, alumno por alumno. Es un proceso lento y dificultoso, y más todavía en estos tiempos, donde la tecnología puede ayudarnos a hacerlo mejor.' },
  { label: 'La solución', section: 'solucion', text:
    'Por eso creamos LeerIA: una aplicación que usa inteligencia artificial y un simple micrófono para evaluar automáticamente la fluidez lectora cuando el alumno termina de leer. Funciona en tres pasos. El estudiante lee en voz alta un texto asignado, y se graba directo desde el navegador. La IA analiza la lectura: calcula velocidad, precisión y pausas. El docente hace seguimiento del progreso de todo el curso y de cada estudiante, sin planillas ni cronómetro.' },
  { label: 'El camino', section: 'camino', text:
    'Esto no apareció de un día para el otro. Nuestras primeras etapas fueron una versión simple, funcional pero muy básica: ya medía palabras por minuto, precisión, expresividad y pausas, pero su aspecto era muy rudimentario. Después de mucho trabajo, y con el acompañamiento de Lab Superior, logramos una mejora visual enorme. Hoy LeerIA tiene un panel institucional donde el docente crea textos, gestiona estudiantes y ve su progreso de forma clara. Su apoyo fue clave para llevar nuestra idea a otro nivel.' },
  { label: 'Cierre', section: 'cierre', text:
    'Para nosotros, esto es un final, pero no del camino. Crear algo es solo el comienzo; lo verdaderamente importante es compartirlo, aprender de los demás y descubrir hasta dónde podemos llegar. LeerIA le devuelve tiempo al docente para lo que más importa: acompañar a cada alumno a leer mejor. ¡Muchas gracias!' }
];

// Cada parte se lee oración por oración: así el subtítulo acompaña la voz
// y se evita el corte de Chrome con textos largos.
const PARTS = PITCH.map(p => ({ ...p, sentences: p.text.match(/[^.!?:]+[.!?:]+["»]?\s*|[^.!?:]+$/g).map(s => s.trim()).filter(Boolean) }));
const TOTAL = PARTS.reduce((n, p) => n + p.sentences.length, 0);

const tts = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window ? window.speechSynthesis : null;
const $ = id => document.getElementById(id);
const player = $('player'), caption = $('player-caption'), label = $('player-label'), bar = $('player-bar');
const toggleBtn = $('p-toggle'), icon = $('p-icon');
const ICON_PAUSE = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';
const ICON_PLAY = '<path d="M8 5v14l11-7z"/>';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let part = 0, sentence = 0, playing = false, run = 0, timer = null, voice = null;

function pickVoice() {
  if (!tts) return;
  const voices = tts.getVoices();
  const es = voices.filter(v => /^es\b|^es-/i.test(v.lang));
  voice = es.find(v => /es-AR/i.test(v.lang)) || es.find(v => /es-(419|MX|US|CL|CO|UY)/i.test(v.lang)) ||
    es.find(v => /google|natural|online/i.test(v.name)) || es[0] || null;
}
if (tts) { pickVoice(); tts.addEventListener?.('voiceschanged', pickVoice); }

function markSection() {
  document.querySelectorAll('[data-pitch]').forEach(el => el.classList.remove('reading'));
  const el = $(PARTS[part].section);
  if (el) {
    el.classList.add('reading');
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
}

function render() {
  const p = PARTS[part];
  label.textContent = `${part + 1}/${PARTS.length} · ${p.label}`;
  caption.textContent = p.sentences[sentence];
  const done = PARTS.slice(0, part).reduce((n, x) => n + x.sentences.length, 0) + sentence;
  bar.style.width = `${(done / TOTAL) * 100}%`;
  icon.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
  toggleBtn.setAttribute('aria-label', playing ? 'Pausar' : 'Reanudar');
}

function stopAudio() {
  run++;
  clearTimeout(timer);
  if (tts) tts.cancel();
}

function speakCurrent() {
  stopAudio();
  const id = run;
  render();
  if (!playing) return;
  const text = PARTS[part].sentences[sentence];
  const advance = () => { if (id === run && playing) next(true); };
  if (tts) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang || 'es-AR';
    if (voice) u.voice = voice;
    u.rate = 1;
    u.onend = advance;
    u.onerror = e => { if (e.error !== 'interrupted' && e.error !== 'canceled') timer = setTimeout(advance, readingTime(text)); };
    tts.speak(u);
  } else {
    // Sin voz disponible: modo teleprompter al ritmo de una lectura en voz alta.
    timer = setTimeout(advance, readingTime(text));
  }
}
const readingTime = text => Math.max(1800, text.split(/\s+/).length / 2.5 * 1000);

function next(auto = false) {
  if (sentence < PARTS[part].sentences.length - 1) sentence++;
  else if (part < PARTS.length - 1) { part++; sentence = 0; markSection(); }
  else if (auto) { finish(); return; }
  speakCurrent();
}

function prevPart() {
  if (sentence > 0) sentence = 0;
  else if (part > 0) part--;
  markSection();
  speakCurrent();
}

function nextPart() {
  if (part < PARTS.length - 1) { part++; sentence = 0; markSection(); speakCurrent(); }
}

function finish() {
  playing = false;
  stopAudio();
  bar.style.width = '100%';
  render();
  caption.textContent = '¡Muchas gracias! Tocá reproducir para escucharlo de nuevo.';
  part = 0; sentence = 0;
}

function start() {
  player.hidden = false;
  part = 0; sentence = 0; playing = true;
  markSection();
  speakCurrent();
  if (!tts) caption.textContent += '  (Tu navegador no tiene voz: se muestra el texto.)';
}

function close() {
  playing = false;
  stopAudio();
  player.hidden = true;
  document.querySelectorAll('[data-pitch]').forEach(el => el.classList.remove('reading'));
  $('pitch-start').focus();
}

$('pitch-start').addEventListener('click', start);
toggleBtn.addEventListener('click', () => {
  playing = !playing;
  if (playing) { if (part === 0 && sentence === 0) markSection(); speakCurrent(); }
  else { stopAudio(); render(); }
});
$('p-next').addEventListener('click', nextPart);
$('p-prev').addEventListener('click', prevPart);
$('p-close').addEventListener('click', close);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !player.hidden) close(); });
window.addEventListener('beforeunload', stopAudio);

/* =========================================================
   2. Demo de alineación (mismo criterio que src/reading.js)
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
