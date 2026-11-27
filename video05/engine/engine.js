// Frame renderer for the video. render(t) draws frame at time t (seconds) on #c.
const W = 1080, H = 1920;
const GREEN = '#3be06a', GREEN_D = '#1f8f40', WHITE = '#f2f2ee';
const cv = document.getElementById('c');
cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const scene = document.createElement('canvas'); scene.width = W; scene.height = H;
const sc = scene.getContext('2d');

const IMG = {};
const TINT = {};
let CAPS = [];

// ------------------------------------------------------------------ utils
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const eo = k => 1 - Math.pow(1 - clamp(k), 3);
const eio = k => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const eback = k => { k = clamp(k); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function loadImg(name, url) {
  return new Promise(res => { const i = new Image(); i.onload = () => { IMG[name] = i; res(); }; i.onerror = () => { console.log('missing', url); res(); }; i.src = url; });
}
function tinted(name) {
  if (TINT[name]) return TINT[name];
  const i = IMG[name]; const c = document.createElement('canvas'); c.width = i.width; c.height = i.height;
  const x = c.getContext('2d'); x.drawImage(i, 0, 0); x.globalCompositeOperation = 'source-atop';
  x.fillStyle = 'rgba(59,224,106,0.55)'; x.fillRect(0, 0, c.width, c.height);
  TINT[name] = c; return c;
}

// ------------------------------------------------------------------ backgrounds
let GRAIN = [], STARS = null, SMOKE = [];
function buildTextures() {
  for (let k = 0; k < 8; k++) {
    const c = document.createElement('canvas'); c.width = 540; c.height = 960;
    const x = c.getContext('2d'); const d = x.createImageData(540, 960); const r = rng(100 + k);
    for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); GRAIN.push(c);
  }
  STARS = document.createElement('canvas'); STARS.width = W; STARS.height = H * 1.3;
  const s = STARS.getContext('2d'); const r = rng(7);
  for (let i = 0; i < 900; i++) { const a = r() * r(); s.fillStyle = `rgba(255,255,255,${0.2 + a * 0.8})`; s.beginPath(); s.arc(r() * W, r() * H * 1.3, r() < 0.97 ? 1 + a * 1.5 : 3, 0, 7); s.fill(); }
  for (let k = 0; k < 2; k++) { // smooth noise for smoke
    const n = 64, c = document.createElement('canvas'); c.width = n; c.height = n * 2;
    const x = c.getContext('2d'); const d = x.createImageData(n, n * 2); const r2 = rng(300 + k);
    for (let i = 0; i < d.data.length; i += 4) { const v = 160 + r2() * 95; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = Math.pow(r2(), 2) * 255; }
    x.putImageData(d, 0, 0);
    const big = document.createElement('canvas'); big.width = W; big.height = H * 2;
    const b = big.getContext('2d'); b.filter = 'blur(38px)'; b.imageSmoothingQuality = 'high'; b.drawImage(c, -60, -60, W + 120, H * 2 + 120);
    SMOKE.push(big);
  }
}

function drawBg(c, type, t) {
  let g;
  if (type === 'green') {
    g = c.createRadialGradient(540, 820, 50, 540, 900, 1250);
    g.addColorStop(0, '#36b85a'); g.addColorStop(0.38, '#1c7a37'); g.addColorStop(0.75, '#082a14'); g.addColorStop(1, '#010703');
  } else if (type === 'paper') {
    g = c.createRadialGradient(540, 820, 50, 540, 900, 1300);
    g.addColorStop(0, '#f1efe8'); g.addColorStop(0.55, '#cfccc4'); g.addColorStop(1, '#5e5d59');
  } else {
    g = c.createRadialGradient(540, 860, 50, 540, 900, 1250);
    g.addColorStop(0, '#262626'); g.addColorStop(0.55, '#0e0e0e'); g.addColorStop(1, '#000');
  }
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (type === 'stars') { c.globalAlpha = 0.9; c.drawImage(STARS, 0, -((t * 12) % (H * 0.3))); c.globalAlpha = 1; }
  if (type === 'paper') { // subtle stains
    c.globalAlpha = 0.08; c.globalCompositeOperation = 'multiply'; c.drawImage(SMOKE[0], 0, -300); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }
}

const FORMULAS = ['F=ma', '½mv²', 'Δt', 'π/2', 'Ω', 'θ', 'V=IR', 'p<0.05', 'n=40', 'σ', 'α', '450 V', 'Σ', 'μ', '∞'];
function drawFormulas(c, t, seed, paper) {
  const r = rng(seed);
  c.font = '400 30px "PF"'; c.textAlign = 'center';
  for (let i = 0; i < 12; i++) {
    const x = 80 + r() * 920, y = 150 + r() * 1300, f = FORMULAS[Math.floor(r() * FORMULAS.length)];
    const dy = Math.sin(t * 0.6 + i) * 10;
    c.fillStyle = paper ? 'rgba(20,90,40,0.45)' : 'rgba(59,224,106,0.42)';
    c.fillText(f, x, y + dy - t * 6);
  }
}

// ------------------------------------------------------------------ text helpers
function bands(c, cx, y, w, alpha = 1) {
  // decorative greek-key-ish band: row of small boxes
  c.save(); c.globalAlpha = alpha; c.strokeStyle = GREEN; c.fillStyle = GREEN; c.lineWidth = 2.5;
  const n = Math.floor(w / 26);
  const x0 = cx - n * 13;
  for (let i = 0; i < n; i++) { c.strokeRect(x0 + i * 26 + 3, y, 18, 18); c.fillRect(x0 + i * 26 + 8, y + 5, 8, 8); }
  c.restore();
}
function glowText(c, s, x, y, color, blur = 40) {
  c.save(); c.shadowColor = color; c.shadowBlur = blur; c.fillStyle = color; c.fillText(s, x, y); c.shadowBlur = 0; c.fillText(s, x, y); c.restore();
}

// ------------------------------------------------------------------ elements
const E = {};

E.img = (c, e, lt, d, t) => {
  const im = e.tint && lt >= e.tint ? tinted(e.src) : IMG[e.src]; if (!im) return;
  const h = e.h || 900, w = im.width * h / im.height;
  let x = e.x ?? 540, y = e.y ?? 820, s = 1, a = 1, blur = 0, rot = (e.rot || 0) * Math.PI / 180;
  const at = e.at || 0, k = lt - at;
  if (k < 0) return;
  const en = e.enter || 'pop';
  if (en === 'pop') { s = lerp(0.9, 1, eback(k / 0.22)); a = clamp(k / 0.08); }
  if (en === 'fly') { const q = eo(k / 0.3); x += (1 - q) * (e.from || 700); blur = (1 - q) * 30; a = clamp(k / 0.05); }
  if (en === 'drop') { const q = eback(k / 0.35); y -= (1 - q) * 500; a = clamp(k / 0.05); }
  if (en === 'focus') { const q = eo(k / 0.4); blur = (1 - q) * 28; s = lerp(1.12, 1, q); a = clamp(k / 0.1); }
  if (en === 'fade') { a = clamp(k / 0.35); }
  if (e.out !== undefined && lt > e.out) a *= 1 - clamp((lt - e.out) / 0.2);
  const z = lerp(e.z0 || 1, e.z1 || 1, clamp(lt / d));
  if (e.mx) x += e.mx * clamp(lt / d);
  if (e.my) y += e.my * clamp(lt / d);
  if (e.drot) rot += e.drot * Math.PI / 180 * clamp(lt / d);
  c.save(); c.globalAlpha = a * (e.alpha ?? 1); c.translate(x, y); c.rotate(rot); c.scale(s * z, s * z);
  if (blur > 0.5) c.filter = `blur(${blur.toFixed(1)}px)`;
  if (e.frame) {
    const p = 16; c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 40; c.shadowOffsetY = 14;
    c.fillStyle = '#e9e7e0'; c.fillRect(-w / 2 - p, -h / 2 - p, w + 2 * p, h + 2 * p); c.shadowBlur = 0; c.shadowOffsetY = 0;
  }
  c.drawImage(im, -w / 2, -h / 2, w, h);
  if (e.pulse) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 * (0.5 + 0.5 * Math.sin(t * 7)); c.drawImage(im, -w / 2, -h / 2, w, h); }
  c.restore();
};

E.slot = (c, e, lt, d, t) => {
  // full-frame single-character flashes on alternating backgrounds
  const i = Math.min(e.seq.length - 1, Math.floor(lt / (e.dur || 0.2)));
  const bgs = e.bgs || ['paper', 'black', 'green', 'black'];
  const bg = bgs[i % bgs.length]; drawBg(c, bg, t);
  if (bg !== 'paper') drawFormulas(c, t, 11 + i, false);
  c.font = `900 ${e.size || 760}px "PF"`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const col = bg === 'paper' ? '#111' : (i % 2 ? GREEN : WHITE);
  const k = (lt % (e.dur || 0.2)) / (e.dur || 0.2);
  c.save(); c.translate(540, 820); const s = lerp(1.08, 1, eo(k * 2)); c.scale(s, s);
  if (col === GREEN) glowText(c, e.seq[i], 0, 0, col, 60); else { c.fillStyle = col; c.fillText(e.seq[i], 0, 0); }
  c.restore(); c.textBaseline = 'alphabetic';
};

E.year = (c, e, lt, d, t) => {
  const r = rng(Math.floor(t * 30) * 13 + 5);
  const roll = e.roll ?? 0.45; let s = '';
  for (let i = 0; i < e.val.length; i++) {
    const ch = e.val[i]; const lock = roll * (0.4 + 0.6 * i / e.val.length);
    s += (/[0-9]/.test(ch) && lt < lock) ? Math.floor(r() * 10) : ch;
  }
  const y = e.y || 820, size = e.size || 230;
  c.font = `900 ${size}px "PF"`; c.textAlign = 'center';
  const w = Math.max(c.measureText(e.val).width, 300) + 40;
  const a = clamp(lt / 0.08);
  c.save(); c.globalAlpha = a;
  const sc2 = lerp(1.15, 1, eo(lt / 0.3)); c.translate(540, y); c.scale(sc2, sc2); c.translate(-540, -y);
  bands(c, 540, y - size * 0.82, w);
  glowText(c, s, 540, y, GREEN, 50);
  if (e.sub) { c.font = `900 ${e.subSize || 54}px "PF"`; glowText(c, e.sub, 540, y + 70, GREEN, 20); }
  if (e.roman) { c.font = '900 44px "PF"'; c.fillStyle = GREEN; c.fillText(e.roman, 540, y + (e.sub ? 130 : 70)); }
  bands(c, 540, y + (e.sub ? 150 : (e.roman ? 95 : 40)), w);
  c.restore();
};

E.num = (c, e, lt, d, t) => {
  const k = eo((lt - (e.at || 0)) / (e.dur || 0.8)); if (lt < (e.at || 0)) return;
  const v = lerp(e.from ?? 0, e.to, k);
  const txt = (e.fmt ? e.fmt(v) : Math.round(v).toLocaleString('ru-RU').replace(/ /g, ' ')) + (e.suffix || '');
  const y = e.y || 820, size = e.size || 300;
  c.save(); c.globalAlpha = clamp((lt - (e.at || 0)) / 0.08);
  c.font = `900 ${size}px "PF"`; c.textAlign = 'center';
  const col = e.color || GREEN;
  if (e.bands !== false) { const w = c.measureText(txt).width + 60; bands(c, 540, y - size * 0.85, w); bands(c, 540, y + (e.sub ? Math.max(80, size * 0.4) + 30 : 40), w); }
  if (col === GREEN) glowText(c, txt, 540, y, col, 50); else { c.fillStyle = col; c.fillText(txt, 540, y); }
  if (e.sub) { c.font = '900 54px "PF"'; c.fillStyle = col; c.fillText(e.sub, 540, y + Math.max(80, size * 0.4)); }
  c.restore();
};

E.text = (c, e, lt, d, t) => {
  const k = lt - (e.at || 0); if (k < 0) return;
  c.save();
  const y = e.y || 820; const size = e.size || 120;
  c.font = e.serif ? `900 ${size}px "PF"` : `900 ${size}px "MS"`; c.textAlign = 'center';
  let s = 1, a = clamp(k / 0.1), blur = 0;
  if (e.enter === 'slam') { s = lerp(1.8, 1, eo(k / 0.18)); a = clamp(k / 0.05); }
  if (e.enter === 'blur') { blur = (1 - eo(k / 0.35)) * 24; }
  c.globalAlpha = a; c.translate(540, y); c.scale(s, s);
  if (blur > 0.5) c.filter = `blur(${blur.toFixed(1)}px)`;
  const lines = e.str.split('\n');
  lines.forEach((ln, i) => {
    const yy = (i - (lines.length - 1) / 2) * size * 1.08;
    const col = (e.hlLine === i) ? GREEN : (e.color || WHITE);
    if (col === GREEN) glowText(c, ln, 0, yy + size * 0.35, col, 40); else { c.fillStyle = col; c.fillText(ln, 0, yy + size * 0.35); }
  });
  c.filter = 'none';
  if (e.bands) { const w = Math.max(...lines.map(l => c.measureText(l).width)) + 40; const hh = lines.length * size * 1.08; bands(c, 0, -hh / 2 - 30, w); bands(c, 0, hh / 2 + 20, w); }
  if (e.sub) { c.font = `800 ${e.subSize || 36}px "MS"`; c.fillStyle = GREEN; c.fillText(e.sub, 0, lines.length * size * 0.6 + 80); }
  c.restore();
};

E.stamp = (c, e, lt) => {
  const k = lt - (e.at || 0); if (k < 0) return;
  c.save(); c.translate(e.x || 540, e.y || 820); c.rotate((e.rot ?? -12) * Math.PI / 180);
  const s = e.static ? 1 : lerp(2.2, 1, eo(k / 0.15)); c.scale(s, s); c.globalAlpha = (e.static ? 1 : clamp(k / 0.05)) * 0.92;
  c.font = `900 ${e.size || 88}px "MS"`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = c.measureText(e.str).width + 50, h = (e.size || 88) * 1.35;
  c.strokeStyle = '#d4312b'; c.lineWidth = 9; c.strokeRect(-w / 2, -h / 2, w, h); c.lineWidth = 3; c.strokeRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24);
  c.fillStyle = '#d4312b'; c.fillText(e.str, 0, 4);
  c.restore();
};

E.vf = (c, e, lt) => { // viewfinder brackets
  const k = lt - (e.at || 0); if (k < 0) return;
  const q = eo(k / 0.25); const g = lerp(80, 0, q);
  const x = e.x - e.w / 2 - g, y = e.y - e.h / 2 - g, w = e.w + 2 * g, h = e.h + 2 * g, L = 60;
  c.save(); c.globalAlpha = clamp(k / 0.1); c.strokeStyle = e.color || WHITE; c.lineWidth = 7; c.shadowColor = GREEN; c.shadowBlur = e.glow ? 20 : 0;
  c.beginPath();
  c.moveTo(x, y + L); c.lineTo(x, y); c.lineTo(x + L, y);
  c.moveTo(x + w - L, y); c.lineTo(x + w, y); c.lineTo(x + w, y + L);
  c.moveTo(x + w, y + h - L); c.lineTo(x + w, y + h); c.lineTo(x + w - L, y + h);
  c.moveTo(x + L, y + h); c.lineTo(x, y + h); c.lineTo(x, y + h - L);
  c.stroke(); c.restore();
};

E.rays = (c, e, lt, d, t) => {
  c.save(); c.translate(540, e.y || 800); c.rotate(t * 0.05);
  c.strokeStyle = e.color || 'rgba(255,255,255,0.55)'; c.lineWidth = 3;
  for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * 260, Math.sin(a) * 260); c.lineTo(Math.cos(a) * 1500, Math.sin(a) * 1500); c.stroke(); }
  c.restore();
};

E.people = (c, e, lt, d, t) => {
  const n = e.n, cols = e.cols || n, sz = e.size || 150;
  const rows = Math.ceil(n / cols); const gap = sz * 1.15;
  const x0 = 540 - (cols - 1) * gap / 2, y0 = (e.y || 820) - (rows - 1) * gap * 1.3 / 2;
  for (let i = 0; i < n; i++) {
    const cx = x0 + (i % cols) * gap, cy = y0 + Math.floor(i / cols) * gap * 1.3;
    const appear = (e.at || 0) + i * (e.stag ?? 0.03); if (lt < appear) continue;
    const hlT = e.hlAt !== undefined ? e.hlAt + (e.hlStag ?? 0.15) * (e.hl.indexOf(i)) : 0;
    const on = e.hl.includes(i) && lt >= hlT;
    const a = clamp((lt - appear) / 0.1);
    c.save(); c.globalAlpha = a; c.translate(cx, cy);
    const s = on ? lerp(1.25, 1, eo((lt - hlT) / 0.2)) : 1; c.scale(s, s);
    c.fillStyle = on ? GREEN : 'rgba(0,0,0,0)'; c.strokeStyle = on ? GREEN : 'rgba(240,240,235,0.7)'; c.lineWidth = sz * 0.05;
    if (on) { c.shadowColor = GREEN; c.shadowBlur = 25; }
    c.beginPath(); c.arc(0, -sz * 0.28, sz * 0.18, 0, 7); on ? c.fill() : c.stroke();
    c.beginPath(); c.moveTo(-sz * 0.32, sz * 0.42); c.quadraticCurveTo(-sz * 0.32, -sz * 0.06, 0, -sz * 0.06); c.quadraticCurveTo(sz * 0.32, -sz * 0.06, sz * 0.32, sz * 0.42); c.closePath(); on ? c.fill() : c.stroke();
    c.restore();
  }
};

E.dots = (c, e, lt, d, t) => {
  const cols = e.cols || 40, n = e.n || 1000, rows = Math.ceil(n / cols), s = e.cell || 22;
  const x0 = 540 - cols * s / 2, y0 = (e.y || 820) - rows * s / 2;
  const shown = Math.floor(n * eo(lt / 0.6));
  c.save(); c.fillStyle = '#ece9df'; c.fillRect(x0 - 12, y0 - 12, cols * s + 24, rows * s + 24);
  for (let i = 0; i < shown; i++) { c.fillStyle = 'rgba(30,30,30,0.18)'; c.fillRect(x0 + (i % cols) * s + 2, y0 + Math.floor(i / cols) * s + 2, s - 4, s - 4); }
  if (lt > (e.hlAt || 0.7)) {
    const i = e.hlIndex || 517; const x = x0 + (i % cols) * s, y = y0 + Math.floor(i / cols) * s;
    const p = 1 + 0.3 * Math.sin(t * 9);
    c.shadowColor = GREEN; c.shadowBlur = 30 * p; c.fillStyle = GREEN; c.fillRect(x, y, s, s);
    c.shadowBlur = 0; c.strokeStyle = GREEN; c.lineWidth = 4; const R = lerp(160, 34, eo((lt - (e.hlAt || 0.7)) / 0.4)); c.beginPath(); c.arc(x + s / 2, y + s / 2, R, 0, 7); c.stroke();
  }
  c.restore();
};

E.bars = (c, e, lt, d, t) => {
  const x0 = e.x || 150, wMax = e.w || 780, y0 = e.y || 700;
  e.rows.forEach((r, i) => {
    const at = (r.at ?? i * 0.25); const k = eo((lt - at) / (r.dur || 0.6)); if (lt < at) return;
    const v = lerp(r.v0 ?? 0, r.v1, k);
    const y = y0 + i * 170;
    c.save(); c.globalAlpha = clamp((lt - at) / 0.1);
    c.font = '900 40px "PF"'; c.fillStyle = r.dim ? 'rgba(240,240,235,0.85)' : GREEN; c.textAlign = 'left'; c.fillText(r.label, x0, y - 22);
    c.strokeStyle = GREEN; c.lineWidth = 3; c.strokeRect(x0, y, wMax, 54);
    c.shadowColor = GREEN; c.shadowBlur = 25; c.fillStyle = r.dim ? '#d9d9d2' : GREEN; c.fillRect(x0 + 6, y + 6, (wMax - 12) * v / (r.max || 100), 42);
    c.shadowBlur = 0; c.font = '900 46px "PF"'; c.textAlign = 'right'; c.fillStyle = WHITE;
    if (!r.nonum) c.fillText(Math.round(v) + (r.suffix ?? '%'), x0 + wMax, y + 118);
    c.restore();
  });
};

E.asch = (c, e, lt, d, t) => {
  const cx = 540, cy = e.y || 800, w = 900, h = 640;
  c.save(); c.translate(cx, cy); c.rotate(-1.5 * Math.PI / 180);
  const k = eo(lt / 0.25); c.globalAlpha = clamp(lt / 0.08); c.scale(lerp(0.92, 1, k), lerp(0.92, 1, k));
  c.shadowColor = GREEN; c.shadowBlur = 40; c.fillStyle = '#ecebe5'; c.fillRect(-w / 2, -h / 2, w, h); c.shadowBlur = 0;
  c.strokeStyle = '#111'; c.lineWidth = 4; c.strokeRect(-w / 2 + 18, -h / 2 + 18, w - 36, h - 36);
  c.beginPath(); c.moveTo(-w / 2 + 300, -h / 2 + 50); c.lineTo(-w / 2 + 300, h / 2 - 50); c.stroke();
  const draw = e.draw ? eo(lt / 0.6) : 1;
  const L = [['X', -300, 300], ['A', -60, 220], ['B', 110, 400], ['C', 280, 300]];
  L.forEach(([n, x, len], i) => {
    const yb = h / 2 - 110; const hh = len * draw;
    let col = '#111';
    if (e.right && n === 'C' && lt > e.right) col = GREEN_D;
    if (e.wrong && n === 'A' && lt > e.wrong) col = GREEN_D;
    c.lineWidth = 16; c.strokeStyle = col; c.lineCap = 'butt';
    if (col !== '#111') { c.shadowColor = GREEN; c.shadowBlur = 30; }
    c.beginPath(); c.moveTo(x, yb); c.lineTo(x, yb - hh); c.stroke(); c.shadowBlur = 0;
    c.font = '900 52px "PF"'; c.textAlign = 'center'; c.fillStyle = '#111'; c.fillText(n, x, yb + 70);
  });
  if (e.scan !== undefined && lt > e.scan) { // bracket scanning A->B->C
    const q = (lt - e.scan) / 1.3; const idx = Math.min(2, Math.floor(q * 3));
    const xs = [-60, 110, 280]; c.strokeStyle = GREEN_D; c.lineWidth = 6; c.strokeRect(xs[idx] - 60, -h / 2 + 50, 120, h - 100);
  }
  if (e.right && lt > e.right) { // check mark
    const q = eo((lt - e.right) / 0.3); c.strokeStyle = GREEN_D; c.lineWidth = 14; c.lineCap = 'round';
    c.beginPath(); c.moveTo(250, -230); c.lineTo(250 + 30 * q, -230 + 30 * q); if (q > 0.4) c.lineTo(250 + 30 + 60 * (q - 0.4) / 0.6, -200 - 80 * (q - 0.4) / 0.6); c.stroke();
  }
  if (e.wrong && lt > e.wrong) {
    c.font = '900 36px "MS"'; c.fillStyle = GREEN_D; c.textAlign = 'center'; c.fillText('ОТВЕТ ГРУППЫ', -60, -h / 2 + 90);
  }
  c.restore();
};

E.gen = (c, e, lt, d, t) => {
  const cx = 540, cy = e.y || 820, w = 1000, h = 470;
  c.save(); c.translate(cx, cy); c.globalAlpha = clamp(lt / 0.08);
  const g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#5a5a58'); g.addColorStop(0.5, '#2a2a29'); g.addColorStop(1, '#121212');
  c.shadowColor = GREEN; c.shadowBlur = 45; c.fillStyle = g; c.fillRect(-w / 2, -h / 2, w, h); c.shadowBlur = 0;
  c.strokeStyle = '#888'; c.lineWidth = 3; c.strokeRect(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28);
  c.fillStyle = '#ddd'; c.font = '900 34px "MS"'; c.textAlign = 'center'; c.fillText('SHOCK GENERATOR, TYPE ZLB', 0, -h / 2 + 70);
  c.font = '700 18px "MS"'; c.fillStyle = '#aaa'; c.fillText('OUTPUT 15 VOLTS — 450 VOLTS', 0, -h / 2 + 100);
  const n = 30, sw = 29, x0 = -n * sw / 2 + sw / 2;
  const on = Math.floor(lerp(e.on0 || 0, e.on1 ?? e.on0 ?? 0, eo((lt - (e.onAt || 0)) / (e.onDur || 0.6))));
  for (let i = 0; i < n; i++) {
    const x = x0 + i * sw, lit = i < on;
    c.fillStyle = lit ? GREEN : '#333'; if (lit) { c.shadowColor = GREEN; c.shadowBlur = 18; }
    c.beginPath(); c.arc(x, -50, 8, 0, 7); c.fill(); c.shadowBlur = 0;
    c.fillStyle = '#0c0c0c'; c.fillRect(x - 10, -20, 20, 70);
    c.fillStyle = lit ? '#eee' : '#9a9a9a'; c.fillRect(x - 6, lit ? 15 : -15, 12, 30);
    if (i % 4 === 0 || i === 29) { c.font = '700 15px "MS"'; c.fillStyle = '#ccc'; c.fillText(String((i + 1) * 15), x, 80); }
  }
  const labs = ['SLIGHT', 'MODERATE', 'STRONG', 'VERY STRONG', 'INTENSE', 'EXTREME', 'DANGER', 'XXX'];
  c.font = '700 14px "MS"'; c.fillStyle = '#bbb';
  labs.forEach((s, i) => c.fillText(s, x0 + (i * 4 + 1.5) * sw, 125));
  c.restore();
  if (e.spark !== undefined && lt > e.spark && lt < e.spark + 0.5) { // electric arc
    const r = rng(Math.floor(t * 30));
    c.save(); c.strokeStyle = GREEN; c.lineWidth = 5; c.shadowColor = GREEN; c.shadowBlur = 30;
    for (let k = 0; k < 3; k++) { c.beginPath(); let x = 100 + r() * 200, y = cy - 260; c.moveTo(x, y); for (let j = 0; j < 12; j++) { x += 70 + r() * 20; y += (r() - 0.5) * 120; c.lineTo(x, y); } c.stroke(); }
    c.restore();
  }
};

E.dial = (c, e, lt, d, t) => {
  const cx = 540, cy = e.y || 900, R = 380;
  c.save(); c.translate(cx, cy); c.globalAlpha = clamp(lt / 0.1);
  c.shadowColor = GREEN; c.shadowBlur = 40; c.fillStyle = '#e9e7e0'; c.beginPath(); c.arc(0, 0, R + 30, Math.PI, 0); c.lineTo(R + 30, 80); c.lineTo(-R - 30, 80); c.closePath(); c.fill(); c.shadowBlur = 0;
  c.strokeStyle = '#111'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, R, Math.PI, 0); c.stroke();
  for (let i = 0; i <= 30; i++) {
    const a = Math.PI + i / 30 * Math.PI, l = i % 5 === 0 ? 45 : 22;
    c.lineWidth = i % 5 === 0 ? 6 : 3; c.strokeStyle = i >= 25 ? GREEN_D : '#111';
    c.beginPath(); c.moveTo(Math.cos(a) * R, Math.sin(a) * R); c.lineTo(Math.cos(a) * (R - l), Math.sin(a) * (R - l)); c.stroke();
    if (i % 5 === 0) { c.font = '900 34px "PF"'; c.fillStyle = '#111'; c.textAlign = 'center'; c.fillText(String(i * 15), Math.cos(a) * (R - 85), Math.sin(a) * (R - 85) + 12); }
  }
  const v = lerp(e.v0 || 0, e.v1, eio((lt - (e.at || 0)) / (e.dur || 1.2)));
  const jitter = v > 400 ? Math.sin(t * 50) * 0.01 : 0;
  const a = Math.PI + v / 450 * Math.PI + jitter;
  c.strokeStyle = '#111'; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * (R - 30), Math.sin(a) * (R - 30)); c.stroke();
  c.fillStyle = '#111'; c.beginPath(); c.arc(0, 0, 26, 0, 7); c.fill();
  c.font = '900 40px "MS"'; c.textAlign = 'center'; c.fillText('VOLTS', 0, 60);
  c.restore();
};

E.wave = (c, e, lt, d, t) => {
  const y0 = e.y || 820; const amp = lerp(e.a0 || 20, e.a1 || 200, eo(lt / (e.dur || d)));
  c.save(); c.strokeStyle = GREEN; c.lineWidth = 6; c.shadowColor = GREEN; c.shadowBlur = 30; c.globalAlpha = clamp(lt / 0.1);
  for (let r = 0; r < 3; r++) { c.globalAlpha = 0.35; c.lineWidth = 3; c.beginPath(); c.arc(540, y0, 220 + r * 80 + (t * 60 % 80), 0, 7); c.stroke(); }
  c.globalAlpha = 1; c.lineWidth = 6; c.beginPath();
  const r = rng(Math.floor(t * 30) + 3);
  for (let x = 60; x <= 1020; x += 12) {
    const env = Math.sin((x - 60) / 960 * Math.PI);
    const y = y0 + (r() - 0.5) * 2 * amp * env * (0.5 + 0.5 * Math.sin(x * 0.05 + t * 20));
    x === 60 ? c.moveTo(x, y) : c.lineTo(x, y);
  }
  c.stroke(); c.restore();
};

E.smoke = (c, e, lt, d, t) => {
  const k = lerp(e.k0 ?? 0, e.k1 ?? 0.6, eo(lt / (e.dur || d)));
  c.save(); c.globalAlpha = k;
  c.drawImage(SMOKE[0], 0, -((t * 40) % H));
  c.globalAlpha = k * 0.7; c.drawImage(SMOKE[1], -40, -((t * 25 + 400) % H));
  c.restore();
};

E.crowd = (c, e, lt, d, t) => {
  const rows = e.rows || 3, cols = e.cols || 7, src = e.src || '05_suit_man';
  const im = IMG[src]; if (!im) return;
  const base = e.h || 420;
  const items = [];
  for (let r = rows - 1; r >= 0; r--) {
    const sc2 = 1 - r * 0.16, n = cols + r;
    const gap = (e.gap || 150) * sc2;
    for (let i = 0; i < n; i++) {
      const idx = r * 100 + i;
      const x = 540 + (i - (n - 1) / 2) * gap + (r % 2 ? gap * 0.25 : 0);
      const y = (e.y || 900) - r * base * 0.22;
      items.push({ idx, x, y, s: sc2, r });
    }
  }
  for (const it of items) {
    let im2 = im, x = it.x, y = it.y, a = 1;
    if (e.odd && e.odd.idx === it.idx) { im2 = IMG[e.odd.src] || im; }
    let green = false;
    if (e.hl) for (const h of e.hl) if (h.idx === it.idx && lt >= h.at) green = true;
    if (e.wave && lt >= e.wave.at) { const dist = Math.abs(it.x - 540) / 540 + it.r * 0.3; if (lt - e.wave.at > dist * e.wave.speed) green = true; }
    if (e.move && e.move.idx === it.idx) { const q = eio((lt - e.move.t0) / (e.move.t1 - e.move.t0)); x += lerp(e.move.dx, 0, q); }
    const hh = base * it.s, ww = im2.width * hh / im2.height;
    c.save(); c.globalAlpha = a * (it.r ? 0.75 - it.r * 0.12 : 1);
    if (it.r && !green) c.filter = `brightness(${1 - it.r * 0.25})`;
    c.drawImage(green ? tinted(e.odd && e.odd.idx === it.idx ? e.odd.src : src) : im2, x - ww / 2, y - hh, ww, hh);
    c.restore();
  }
};

E.cameo = (c, e, lt, d, t) => {
  const q = eo(lt / 0.35); const x = (e.x || 540) + (1 - q) * 700, y = e.y || 800;
  c.save(); c.translate(x, y); c.rotate(((e.rot ?? -3) + (1 - q) * 12) * Math.PI / 180);
  if (q < 0.9) c.filter = `blur(${((1 - q) * 25).toFixed(1)}px)`;
  const w = 640, h = 860;
  c.shadowColor = GREEN; c.shadowBlur = 45; c.fillStyle = '#e8e5dc'; c.fillRect(-w / 2, -h / 2, w, h); c.shadowBlur = 0;
  c.strokeStyle = '#222'; c.lineWidth = 3; c.strokeRect(-w / 2 + 22, -h / 2 + 22, w - 44, h - 44);
  c.save(); c.beginPath(); c.ellipse(0, -90, 220, 290, 0, 0, 7); c.fillStyle = '#1b1b1b'; c.fill(); c.clip();
  const im = IMG[e.src]; if (im) { const hh = 640, ww = im.width * hh / im.height; c.drawImage(im, -ww / 2 - 30, -90 - hh / 2 + 40, ww, hh); }
  c.restore();
  c.lineWidth = 8; c.strokeStyle = '#2a2a2a'; c.beginPath(); c.ellipse(0, -90, 222, 292, 0, 0, 7); c.stroke();
  c.fillStyle = '#151515'; c.textAlign = 'center'; c.font = '900 54px "PF"'; c.fillText(e.name, 0, 285);
  c.font = '800 30px "MS"'; c.fillStyle = '#444'; c.fillText(e.dates, 0, 335);
  c.restore();
};

E.strike = (c, e, lt) => {
  const k = eo((lt - (e.at || 0)) / 0.25); if (lt < (e.at || 0)) return;
  c.save(); c.strokeStyle = GREEN; c.lineWidth = e.w || 22; c.lineCap = 'round'; c.shadowColor = GREEN; c.shadowBlur = 30;
  c.beginPath(); c.moveTo(e.x0, e.y0); c.lineTo(lerp(e.x0, e.x1, k), lerp(e.y0, e.y1, k)); c.stroke(); c.restore();
};

E.circle = (c, e, lt) => {
  const k = eo((lt - (e.at || 0)) / 0.4); if (lt < (e.at || 0)) return;
  c.save(); c.strokeStyle = GREEN; c.lineWidth = 8; c.shadowColor = GREEN; c.shadowBlur = 25;
  c.beginPath(); c.ellipse(e.x, e.y, e.rx, e.ry, -0.2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2.1 * k); c.stroke(); c.restore();
};

E.peak = (c, e, lt, d, t) => {
  const x0 = 130, x1 = 950, y0 = 1080, y1 = 520;
  c.save(); c.globalAlpha = clamp(lt / 0.1);
  c.strokeStyle = 'rgba(240,240,235,0.8)'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(x0, y1 - 40); c.lineTo(x0, y0); c.lineTo(x1 + 20, y0); c.stroke();
  c.font = '800 30px "MS"'; c.fillStyle = 'rgba(240,240,235,0.85)'; c.textAlign = 'center';
  [['−200 000', 0.0], ['−40 000', 0.62], ['СЕЙЧАС', 1.0]].forEach(([s, f]) => c.fillText(s, x0 + (x1 - x0) * f, y0 + 50));
  c.save(); c.translate(x0 - 40, (y0 + y1) / 2); c.rotate(-Math.PI / 2); c.fillText('ИНТЕЛЛЕКТ', 0, 0); c.restore();
  const f = u => { const p = 0.62; return u < p ? Math.pow(u / p, 1.6) : 1 - 0.28 * Math.pow((u - p) / (1 - p), 1.2); };
  const prog = e.full ? 1 : eo(lt / 0.9);
  c.strokeStyle = GREEN; c.lineWidth = 9; c.shadowColor = GREEN; c.shadowBlur = 25; c.lineJoin = 'round';
  c.beginPath(); for (let i = 0; i <= 120 * prog; i++) { const u = i / 120; const x = x0 + (x1 - x0) * u, y = y0 - (y0 - y1) * f(u); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  c.shadowBlur = 0;
  if (prog > 0.62) { const x = x0 + (x1 - x0) * 0.62, y = y1; const p = 1 + 0.25 * Math.sin(t * 9);
    c.fillStyle = GREEN; c.beginPath(); c.arc(x, y, 16 * p, 0, 7); c.fill();
    c.font = '900 58px "PF"'; c.fillText('ПИК', x, y - 40); }
  if (e.you !== undefined && lt > e.you) { const x = x1, y = y0 - (y0 - y1) * f(1);
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y, 14, 0, 7); c.fill();
    c.font = '900 46px "MS"'; c.textAlign = 'right'; c.fillText('ВЫ', x - 25, y + 70); }
  c.restore();
};

E.fill = (c, e, lt) => { c.save(); c.globalAlpha = e.a ?? 1; c.fillStyle = e.color; c.fillRect(0, 0, W, H); c.restore(); };

// ------------------------------------------------------------------ post effects
function glitch(c, amount, seed) {
  const r = rng(seed);
  const img = c.getImageData(0, 0, W, H); const src = new Uint8ClampedArray(img.data); const d = img.data;
  const shift = Math.floor(14 * amount) * 4;
  for (let i = 0; i < d.length; i += 4) { d[i] = src[i + shift] ?? 0; d[i + 2] = src[i - shift] ?? 0; }
  c.putImageData(img, 0, 0);
  for (let k = 0; k < 9 * amount; k++) {
    const y = Math.floor(r() * H), h = Math.floor(10 + r() * 90), dx = Math.floor((r() - 0.5) * 160 * amount);
    c.drawImage(c.canvas, 0, y, W, h, dx, y, W, h);
  }
}

function speedLines(c, k, seed) {
  const r = rng(seed); c.save(); c.strokeStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 18; i++) { c.lineWidth = 1 + r() * 3; const y = r() * H, x = r() * W, l = 100 + r() * 400; c.beginPath(); c.moveTo(x, y); c.lineTo(x + l * k, y); c.stroke(); }
  c.restore();
}

// ------------------------------------------------------------------ captions
function drawCaptions(c, t) {
  const ch = CAPS.find(k => t >= k.s - 0.02 && t < k.e); if (!ch) return;
  const size = 64; c.font = `800 ${size}px "MS"`; c.textAlign = 'left';
  const maxW = 920, sp = c.measureText(' ').width;
  // greedy line break, then centre each line
  const lines = [[]]; let lw = 0;
  for (const w of ch.w) { const ww = c.measureText(w.t).width; if (lw && lw + sp + ww > maxW) { lines.push([]); lw = 0; } lines[lines.length - 1].push([w, ww]); lw += (lw ? sp : 0) + ww; }
  const y0 = 1440 - (lines.length - 1) * size * 0.6;
  lines.forEach((ln, li) => {
    const tw = ln.reduce((a, [, ww]) => a + ww, 0) + sp * (ln.length - 1);
    let x = 540 - tw / 2; const y = y0 + li * size * 1.2;
    for (const [w, ww] of ln) {
      const k = (t - w.s + 0.04) / 0.12;
      if (k > 0) {
        c.save(); c.globalAlpha = clamp(k);
        if (k < 1) c.filter = `blur(${((1 - k) * 8).toFixed(1)}px)`;
        let sc2 = 1;
        if (w.acc) { const q = t - w.s; sc2 = q < 0.25 ? lerp(1.35, 1, eo(q / 0.25)) : 1; }
        c.translate(x + ww / 2, y); c.scale(sc2, sc2); c.translate(-(x + ww / 2), -y);
        c.shadowColor = 'rgba(0,0,0,0.85)'; c.shadowBlur = 18; c.shadowOffsetY = 4;
        c.lineWidth = 9; c.lineJoin = 'round'; c.strokeStyle = 'rgba(0,0,0,0.75)'; c.strokeText(w.t, x, y); c.shadowOffsetY = 0;
        if (w.acc) { c.shadowColor = GREEN; c.shadowBlur = 45; c.fillStyle = GREEN; c.fillText(w.t, x, y); c.shadowBlur = 20; }
        else c.shadowBlur = 0;
        c.fillStyle = w.hl ? GREEN : '#ffffff'; c.fillText(w.t, x, y);
        if (w.hl) { c.shadowBlur = 0; c.fillRect(x, y + 13, ww * clamp(k), 7); }
        c.restore();
      }
      x += ww + sp;
    }
  });
}

// ------------------------------------------------------------------ main
let SHOTS = [];
function render(t, frame) {
  let si = 0; for (let i = 0; i < SHOTS.length; i++) if (SHOTS[i].s <= t) si = i;
  const sh = SHOTS[si]; const nx = SHOTS[si + 1]; const d = (nx ? nx.s : DURATION) - sh.s; const lt = t - sh.s;
  // scene
  sc.setTransform(1, 0, 0, 1, 0, 0); sc.filter = 'none'; sc.globalAlpha = 1;
  drawBg(sc, sh.bg || 'black', t);
  if (sh.formulas !== false && (sh.bg || 'black') !== 'paper') drawFormulas(sc, t, si * 7 + 1, false);
  const z = lerp(sh.z0 ?? 1, sh.z1 ?? 1.06, clamp(lt / d));
  sc.save();
  let shx = 0, shy = 0;
  if (sh.shake) for (const s0 of sh.shake) { const k = lt - s0; if (k >= 0 && k < 0.35) { const r = rng(frame); const a = (1 - k / 0.35) * 22; shx += (r() - 0.5) * a; shy += (r() - 0.5) * a; } }
  let zp = 1; for (const [a, b] of PULSE) if (t >= a && t < b) { const ph = (t % BEAT) / BEAT; zp = 1 + 0.022 * Math.exp(-ph * 7); }
  sc.translate(540 + shx, 860 + shy); sc.scale(z * zp, z * zp); sc.translate(-540, -860);
  for (const e of sh.els || []) { if (e.until !== undefined && lt > e.until) continue; E[e.type](sc, e, lt, d, t); }
  sc.restore();
  // transition in
  const fx = sh.fx || 'cut';
  if (fx === 'glitch' && lt < 0.2) glitch(sc, 1 - lt / 0.2, frame);
  if (sh.glitchAt) for (const g of sh.glitchAt) if (lt >= g && lt < g + 0.15) glitch(sc, 1 - (lt - g) / 0.15, frame + 9);
  if (fx === 'whip' && lt < 0.18) speedLines(sc, 1 - lt / 0.18, frame);
  // compose
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none'; ctx.globalAlpha = 1;
  if (fx === 'blur' && lt < 0.3) { ctx.filter = `blur(${((1 - lt / 0.3) * 30).toFixed(1)}px)`; }
  if (fx === 'zoom' && lt < 0.25) { const s = lerp(1.25, 1, eo(lt / 0.25)); ctx.translate(540, 960); ctx.scale(s, s); ctx.translate(-540, -960); }
  ctx.drawImage(scene, 0, 0); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none';
  if (fx === 'flash' && lt < 0.2) { ctx.fillStyle = `rgba(255,255,255,${0.85 * (1 - lt / 0.2)})`; ctx.fillRect(0, 0, W, H); }
  if (fx === 'gflash' && lt < 0.25) { ctx.fillStyle = `rgba(59,224,106,${0.6 * (1 - lt / 0.25)})`; ctx.fillRect(0, 0, W, H); }
  if (sh.flashAt) for (const g of sh.flashAt) { const k = lt - g; if (k >= 0 && k < 0.25) { ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - k / 0.25)})`; ctx.fillRect(0, 0, W, H); } }
  for (const a of ACC) { const k = t - a; if (k >= 0 && k < 0.4) {
    if (k < 0.08) { ctx.fillStyle = `rgba(255,255,255,${0.75 * (1 - k / 0.08)})`; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = `rgba(59,224,106,${0.35 * (1 - k / 0.4)})`; ctx.fillRect(0, 0, W, H); } }
  // grain + vignette
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.16; ctx.drawImage(GRAIN[frame % 8], 0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  const vg = ctx.createRadialGradient(540, 900, 500, 540, 960, 1300); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  // dust specks
  const r = rng(frame * 31); if (r() < 0.25) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(r() * W, r() * H, 1 + r() * 2.5, 0, 7); ctx.fill(); } }
  drawTitle(ctx, t);
  drawCaptions(ctx, t);
}

function drawTitle(c, t) {
  if (!TITLE || t >= TITLE.until) return;
  const out = clamp((TITLE.until - t) / 0.2);
  c.save(); c.globalAlpha = out;
  const g = c.createLinearGradient(0, 0, 0, 560); g.addColorStop(0, 'rgba(0,0,0,0.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, 560);
  c.textAlign = 'center'; c.lineJoin = 'round';
  let y = TITLE.y || 210;
  TITLE.lines.forEach(([str, green, size], i) => {
    if (i > 0) y += (TITLE.lines[i - 1][2] * 0.5 + size * 0.75);
    const k = clamp((t - i * 0.12) / 0.18); if (k <= 0) return;
    c.save(); c.globalAlpha = out * k; c.font = `900 ${size}px "MS"`;
    const fit = Math.min(1, 1000 / c.measureText(str).width);
    const sc = lerp(1.25, 1, eo(k)) * fit; c.translate(540, y); c.scale(sc, sc);
    c.lineWidth = 14; c.strokeStyle = 'rgba(0,0,0,0.9)'; c.strokeText(str, 0, 0);
    if (green) { c.shadowColor = GREEN; c.shadowBlur = 50; }
    c.fillStyle = green ? GREEN : '#ffffff'; c.fillText(str, 0, 0);
    c.restore();
  });
  c.restore();
}

let DURATION = 0; let TITLE = null; let ACC = []; let PULSE = []; const BEAT = 0.48;
async function init(cfg) {
  DURATION = cfg.duration; CAPS = cfg.captions; SHOTS = cfg.shots; PULSE = cfg.pulse || []; TITLE = cfg.title || null;
  ACC = []; for (const ch of CAPS) for (const w of ch.w) if (w.acc) ACC.push(w.s);
  buildTextures();
  await Promise.all(cfg.images.map(n => loadImg(n, '../build/art/' + n + '.png')));
  await document.fonts.load('800 60px "MS"'); await document.fonts.load('900 60px "MS"'); await document.fonts.load('900 60px "PF"');
  await document.fonts.load('900 60px "MS"', 'АБВ'); await document.fonts.load('900 60px "PF"', 'АБВ');
  return true;
}
function grab(q) { return cv.toDataURL('image/jpeg', q || 0.92); }
