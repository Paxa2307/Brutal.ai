// «Эволюция» — hand-drawn stick-figure evolution. Deterministic timeline: renderAt(t).
'use strict';
const CW = 1920, CH = 1080, FPS = 60, DUR = 20;
const cv = document.getElementById('c');
const mainCtx = cv.getContext('2d');
const mk = () => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return c; };
const fgCv = mk(), bgCv = mk(), tmpCv = mk();
let C = mainCtx;

// ---------- utils ----------
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eout = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const eback = t => { t = clamp(t, 0, 1); const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function rnd(a, b = 0) { const x = Math.sin(a * 127.1 + b * 311.7 + 13.13) * 43758.5453; return x - Math.floor(x); }
const rs = (a, b = 0) => rnd(a, b) * 2 - 1;
const gauss = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));
let BOIL = 0, TIME = 0;

const GR = '#2c2e3b';
const STCOL = ['#5fa548', '#d9a336', '#8d8f99', '#e0742f', '#9a5f36', '#3f7fc4'];

// ---------- pencil grain patterns ----------
const patCache = {};
function pat(col) {
  if (patCache[col]) return patCache[col];
  const n = 128, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), id = g.createImageData(n, n);
  const r = parseInt(col.slice(1, 3), 16), gg = parseInt(col.slice(3, 5), 16), b = parseInt(col.slice(5, 7), 16);
  for (let i = 0; i < n * n; i++) {
    const v = rnd(i * 0.37, 9.1);
    let a = 0.62 + 0.38 * v;
    if (rnd(i * 1.91, 3.3) < 0.13) a *= 0.35;
    id.data[i * 4] = r; id.data[i * 4 + 1] = gg; id.data[i * 4 + 2] = b; id.data[i * 4 + 3] = a * 255;
  }
  g.putImageData(id, 0, 0);
  return (patCache[col] = mainCtx.createPattern(c, 'repeat'));
}

// ---------- hand-drawn primitives ----------
function smoothPath(P) {
  C.beginPath(); C.moveTo(P[0][0], P[0][1]);
  for (let i = 1; i < P.length - 1; i++) {
    const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2;
    C.quadraticCurveTo(P[i][0], P[i][1], mx, my);
  }
  const L = P[P.length - 1]; C.lineTo(L[0], L[1]);
}
function pstroke(pts, o = {}) {
  if (pts.length < 2) return;
  const col = o.c || GR, w = o.w || 3, seed = o.s || 0, jit = o.j ?? 1.5, a = o.a ?? 1, step = o.step || 16;
  const P = [], Q = [];
  const n = pts.length, segs = o.close ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy) || 1;
    const k = Math.max(1, Math.ceil(len / step)), nx = -dy / len, ny = dx / len;
    for (let j = 0; j < k; j++) {
      const u = j / k, idx = i * 37 + j;
      const off = rs(seed + idx * 1.73, BOIL) * jit;
      const off2 = off + rs(seed + idx * 2.9 + 50, BOIL) * jit * 0.9 + 0.9;
      P.push([p[0] + dx * u + nx * off, p[1] + dy * u + ny * off]);
      Q.push([p[0] + dx * u + nx * off2, p[1] + dy * u + ny * off2]);
    }
  }
  const L = o.close ? pts[0] : pts[n - 1];
  P.push([L[0] + rs(seed, BOIL + 5) * jit, L[1] + rs(seed + 3, BOIL) * jit]);
  Q.push([L[0] + rs(seed + 7, BOIL) * jit + 0.8, L[1] + rs(seed + 9, BOIL) * jit]);
  if (o.close && o.overshoot !== false) { P.push([P[1][0] + rs(seed + 11, BOIL) * 2, P[1][1]]); }
  C.save();
  C.lineCap = 'round'; C.lineJoin = 'round';
  C.strokeStyle = pat(col);
  C.globalAlpha *= 0.92 * a; C.lineWidth = w; smoothPath(P); C.stroke();
  C.globalAlpha *= 0.5; C.lineWidth = Math.max(1, w * 0.45); smoothPath(Q); C.stroke();
  C.restore();
}
const pline = (x1, y1, x2, y2, o) => pstroke([[x1, y1], [x2, y2]], o);
function pcirc(x, y, r, o = {}) {
  const s = o.s || 0, pts = [], a0 = rnd(s, 7) * 6.28, N = Math.max(12, Math.ceil(r * 0.6));
  const ext = o.ext ?? 0.35, sy = o.sy || 1;
  for (let i = 0; i <= N; i++) {
    const a = a0 + (Math.PI * 2 + ext) * i / N;
    const rr = r * (1 + rs(s + i * .31, BOIL) * 0.035 + (i / N) * 0.06);
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * sy]);
  }
  pstroke(pts, { ...o, j: o.j ?? 0.5, step: 10 });
}
// zig-zag colouring inside a polygon (kid's scribble fill)
function pfill(poly, o = {}) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of poly) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  C.save();
  C.beginPath(); C.moveTo(poly[0][0], poly[0][1]); for (const p of poly) C.lineTo(p[0], p[1]); C.closePath();
  if (o.paper) { C.fillStyle = '#f6f1e3'; C.fill(); }
  C.clip();
  const ang = o.ang ?? 0.5, sp = o.sp || 12, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2 + 10;
  C.translate(cx, cy); C.rotate(ang);
  const zig = []; let k = 0;
  for (let x = -R; x <= R; x += sp / 2, k++) {
    const jx = rs(k * 1.3 + (o.s || 0), BOIL) * sp * 0.25;
    zig.push([x + jx, (k % 2 ? -R : R) + rs(k, 4) * 6]);
  }
  pstroke(zig, { c: o.c, w: o.w || 5, a: o.a ?? 0.5, j: 1, s: o.s, step: o.step || 40 });
  C.restore();
}
function poly(pts, o) { pstroke(pts, { ...o, close: true }); }

// ---------- hand lettering ----------
function textW(str, size, wt = 700) { C.save(); C.font = `${wt} ${size}px Hand`; const w = C.measureText(str).width; C.restore(); return w; }
function htext(str, x, y, size, o = {}) {
  C.save(); C.font = `${o.wt || 700} ${size}px Hand`; C.textBaseline = 'alphabetic';
  let cx = x; const N = str.length; let tip = null;
  for (let i = 0; i < N; i++) {
    const ch = str[i], w = C.measureText(ch).width;
    const ap = o.appear ? o.appear(i, N) : 1;
    const rv = o.rev !== undefined ? clamp(o.rev * N - i, 0, 1) : 1;
    if (ap > 0 && rv > 0 && ch !== ' ') {
      C.save();
      const dy = o.dy ? o.dy(i, N, cx) : 0;
      C.translate(cx + w / 2 + rs(i * 5.1 + (o.s || 0), BOIL) * 1.2, y + dy + rs(i * 3.7, BOIL) * 1.2);
      C.rotate(rs(i * 3.1 + (o.s || 0), 2) * 0.05 + (o.rot ? o.rot(i, N) : 0));
      const sc = o.scale ? o.scale(i, N) : 1; C.scale(sc, sc);
      if (rv < 1) { C.beginPath(); C.rect(-w / 2 - 6, -size * 1.1, (w + 12) * rv, size * 1.5); C.clip(); tip = [cx + w * rv, y - size * 0.25 + Math.sin(rv * 20) * size * 0.12]; }
      C.globalAlpha *= (o.a ?? 1) * clamp(ap * 1.6, 0, 1);
      C.fillStyle = pat(o.cols ? o.cols[i % o.cols.length] : (o.c || GR));
      C.fillText(ch, -w / 2, 0);
      C.restore();
    }
    cx += w * (o.track || 1);
  }
  C.restore();
  return { w: cx - x, tip };
}

// ---------- world layout ----------
const V = 256, STW = 640, STH = 170, X0 = -128;
const TT = [4.5, 7.0, 9.5, 12.0, 14.5];              // transformation downbeats
const BEAT = 0.625;
const stepTop = i => -STH * i;
const stepX0 = i => i === 0 ? -1700 : i * STW;
const stepX1 = i => i === 5 ? 5400 : (i + 1) * STW;
const TITLE = { x: 3655, y: -1335, size: 235, str: 'ЭВОЛЮЦИЯ' };
const NAMES = [
  ['Примат', '~7 млн лет назад'],
  ['Австралопитек', '~3,5 млн лет назад'],
  ['Человек умелый', '~2 млн лет назад'],
  ['Человек прямоходящий', '~1,5 млн лет назад'],
  ['Человек разумный', '~300 тыс. лет назад'],
  ['Современный человек', 'сегодня'],
];
const LAND = [2.0, ...TT.map(t => t + 0.2)];

// stage parameters
const ST = [
  { post: 0.00, arm: 1.00, leg: 0.62, head: 0.92, brow: 1.0, fur: 1.0, jaw: 1.0, h: 0.76, hold: 0, cloth: 0, shirt: 0, hair: 0, glasses: 0 },
  { post: 0.48, arm: 0.86, leg: 0.76, head: 0.92, brow: 0.85, fur: 0.65, jaw: 0.8, h: 0.83, hold: 0, cloth: 0, shirt: 0, hair: 0, glasses: 0 },
  { post: 0.72, arm: 0.76, leg: 0.86, head: 1.00, brow: 0.6, fur: 0.35, jaw: 0.55, h: 0.89, hold: 1, cloth: 0, shirt: 0, hair: 0, glasses: 0 },
  { post: 0.90, arm: 0.70, leg: 0.95, head: 1.05, brow: 0.4, fur: 0.12, jaw: 0.35, h: 0.95, hold: 1, cloth: 1, shirt: 0, hair: 0.3, glasses: 0 },
  { post: 0.98, arm: 0.66, leg: 1.00, head: 1.10, brow: 0.15, fur: 0.0, jaw: 0.15, h: 1.00, hold: 1, cloth: 1, shirt: 0, hair: 1, glasses: 0 },
  { post: 1.00, arm: 0.64, leg: 1.00, head: 1.12, brow: 0.0, fur: 0.0, jaw: 0.0, h: 1.00, hold: 1, cloth: 0, shirt: 1, hair: 0.6, glasses: 1 },
];
const TOOLS = [null, null, 'stone', 'torch', 'spear', 'cup'];

function stageAt(t) { let s = 0; for (const T of TT) if (t >= T) s++; return s; }
function paramsAt(t) {
  for (let i = 0; i < 5; i++) {
    const T = TT[i];
    if (t > T - 0.14 && t < T + 0.17) {
      const w = sstep(T - 0.14, T + 0.17, t), A = ST[i], B = ST[i + 1], R = {};
      for (const k in A) R[k] = lerp(A[k], B[k], w);
      return R;
    }
  }
  return ST[stageAt(t)];
}
// horizontal motion: walk from 2.0, decelerate 16.6→17.2
function hipXAt(t) {
  if (t < 2) return X0;
  if (t < 16.6) return X0 + V * (t - 2);
  const u = Math.min(t - 16.6, 0.6);
  return X0 + V * 14.6 + V * (u - u * u / 1.2);
}
function speedAt(t) { if (t < 2) return 0; if (t < 16.6) return 1; return clamp(1 - (t - 16.6) / 0.6, 0, 1); }
function phaseAt(t) { // walk cycles (one cycle = 2 footfalls = 0.625s)
  if (t < 2) return 0;
  return (hipXAt(t) - X0) / (V * BEAT);
}
function jumpAt(t) { // returns {i, s} if jumping
  for (let i = 0; i < 5; i++) { const ta = TT[i] - 0.3, tb = TT[i] + 0.2; if (t >= ta && t <= tb) return { i: i + 1, s: (t - ta) / (tb - ta) }; }
  return null;
}
function groundAt(t) {
  const j = jumpAt(t);
  if (j) { const y0 = stepTop(j.i - 1), y1 = stepTop(j.i); return lerp(y0, y1, j.s) - 4 * 120 * j.s * (1 - j.s); }
  return stepTop(stageAt(t));
}
function hunchAt(t) { return eio(clamp((t - 17.45) / 1.15, 0, 1)); }

// ---------- camera ----------
const CAMHZ = 600; let CAM = null;
function followRaw(t) {
  const x = hipXAt(t), st = stageAt(t);
  let gy = stepTop(st);
  const j = jumpAt(t); if (j) gy = lerp(stepTop(j.i - 1), stepTop(j.i), sstep(0, 1, j.s));
  let cx = x + 160, cy = gy - 112, z = 1.72, r = 0.012 * Math.sin(t * 0.85);
  for (const T of TT) { z += 0.12 * gauss(t, T + 0.05, 0.28); r += -0.022 * gauss(t, T + 0.1, 0.32); }
  // ending: open up to title + hero
  const e = eio(clamp((t - 16.7) / 1.6, 0, 1));
  cx = lerp(cx, 3672, e); cy = lerp(cy, -1125, e); z = lerp(z, 1.27 + 0.06 * clamp((t - 17) / 3, 0, 1), e);
  r = lerp(r, -0.008 + 0.006 * Math.sin(t * 0.7), e);
  return [cx, cy, z, r];
}
function camRaw(t) {
  const F = followRaw(Math.max(t, 2.0));
  if (t >= 2.0) return F;
  const tx = TITLE.x, ty = TITLE.y - 70;
  const A = [tx - 330 + 560 * sstep(0.1, 1.1, t), ty + 10 - 20 * t, 1.55 - 0.08 * t, -0.045 + 0.02 * t];
  if (t < 1.05) return A;
  const s = (t - 1.05) / 0.95, e = eio(s);
  const A1 = [tx + 230, ty - 10, 1.47, -0.024];
  return [lerp(A1[0], F[0], e), lerp(A1[1], F[1], e),
    Math.exp(lerp(Math.log(A1[2]), Math.log(F[2]), e)) * (1 - 0.62 * Math.sin(Math.PI * s) ** 1.3),
    lerp(A1[3], F[3], e) + 0.07 * Math.sin(Math.PI * s)];
}
function buildCam() {
  const N = Math.ceil((DUR + 0.2) * CAMHZ) + 2, dt = 1 / CAMHZ;
  CAM = new Float64Array(N * 4);
  let s = camRaw(0), v = [0, 0, 0, 0];
  for (let i = 0; i < N; i++) {
    const t = i * dt, tg = camRaw(t), w = t < 2.15 ? 22 : 6.5;
    for (let k = 0; k < 4; k++) {
      const a = w * w * (tg[k] - s[k]) - 2 * w * v[k];
      v[k] += a * dt; s[k] += v[k] * dt;
      CAM[i * 4 + k] = s[k];
    }
  }
}
function camAt(t) {
  const f = clamp(t, 0, DUR + 0.19) * CAMHZ, i = Math.floor(f), u = f - i, o = [];
  for (let k = 0; k < 4; k++) o.push(lerp(CAM[i * 4 + k], CAM[(i + 1) * 4 + k], u));
  return { x: o[0], y: o[1], z: o[2], r: o[3] };
}
let cam = { x: 0, y: 0, z: 1, r: 0 };
function layer(f) {
  C.setTransform(1, 0, 0, 1, 0, 0);
  C.translate(CW / 2, CH * 0.5);
  C.rotate(cam.r);
  const s = Math.pow(cam.z, f) * (f > 1 ? 1.0 : 1);
  C.scale(s, s);
  C.translate(-cam.x * f, -cam.y * f);
}

// ---------- paper ----------
let grainPat = null;
function makeGrain() {
  const n = 512, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), id = g.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const x = i % n, y = (i / n) | 0;
    const fib = Math.sin(x * 0.11 + Math.sin(y * 0.031) * 3) * 0.5 + 0.5;
    const v = 228 + rnd(i * 0.13, 1.7) * 27 - fib * 8;
    id.data[i * 4] = v; id.data[i * 4 + 1] = v - 3; id.data[i * 4 + 2] = v - 10; id.data[i * 4 + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  grainPat = mainCtx.createPattern(c, 'repeat');
}
function drawPaper() {
  C.setTransform(1, 0, 0, 1, 0, 0);
  C.fillStyle = '#f6f1e3'; C.fillRect(0, 0, CW, CH);
  layer(0.92);
  const s = Math.pow(cam.z, 0.92), R = Math.hypot(CW, CH) / 2 / s + 60;
  const cx = cam.x * 0.92, cy = cam.y * 0.92;
  C.save(); C.globalCompositeOperation = 'multiply'; C.fillStyle = grainPat; C.globalAlpha = 0.55;
  C.fillRect(cx - R, cy - R, 2 * R, 2 * R); C.restore();
  const G = 46;
  C.lineWidth = 1.7 / s; C.strokeStyle = 'rgba(92,140,200,0.36)';
  C.beginPath();
  for (let x = Math.floor((cx - R) / G) * G; x < cx + R; x += G) { C.moveTo(x, cy - R); C.lineTo(x, cy + R); }
  for (let y = Math.floor((cy - R) / G) * G; y < cy + R; y += G) { C.moveTo(cx - R, y); C.lineTo(cx + R, y); }
  C.stroke();
  // red margin line of the notebook
  C.strokeStyle = 'rgba(214,74,74,0.55)'; C.lineWidth = 3 / s;
  C.beginPath(); C.moveTo(-1150, cy - R); C.lineTo(-1150, cy + R); C.stroke();
  // faint eraser smudges
  C.fillStyle = 'rgba(120,110,100,0.05)';
  for (let k = 0; k < 6; k++) { C.beginPath(); C.ellipse(rnd(k, 1) * 4200 - 900, -rnd(k, 2) * 1100, 160, 50, 0.3, 0, 7); C.fill(); }
}

// ---------- background (parallax) ----------
const BGF = 0.55;
function stageAnchor(i, f) { // layer-space anchor such that object shows near camera at stage i
  const tm = 2 + 2.5 * i + 1.25, x = hipXAt(tm) + 160, y = stepTop(i) - 112;
  return [x * f, y * f];
}
function tree(x, y, s, sd) {
  pstroke([[x, y], [x - 6 * s, y - 70 * s], [x + 4 * s, y - 150 * s]], { c: '#7a4a2a', w: 6 * s, s: sd });
  pstroke([[x + 10 * s, y], [x + 4 * s, y - 70 * s], [x + 14 * s, y - 150 * s]], { c: '#7a4a2a', w: 4 * s, s: sd + 1 });
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k - 2) * 0.62;
    const ex = x + 8 * s + Math.cos(a) * 95 * s, ey = y - 150 * s + Math.sin(a) * 60 * s + 30 * s;
    pstroke([[x + 8 * s, y - 152 * s], [lerp(x, ex, .5), y - 180 * s], [ex, ey]], { c: '#3f8f3a', w: 7 * s, s: sd + k * 3 });
  }
}
function acacia(x, y, s, sd) {
  pstroke([[x, y], [x + 5, y - 90 * s], [x - 30 * s, y - 140 * s]], { c: '#7a4a2a', w: 6 * s, s: sd });
  pline(x + 5, y - 90 * s, x + 50 * s, y - 145 * s, { c: '#7a4a2a', w: 5 * s, s: sd + 1 });
  const top = [[x - 110 * s, y - 140 * s], [x - 60 * s, y - 185 * s], [x + 40 * s, y - 195 * s], [x + 120 * s, y - 150 * s], [x - 110 * s, y - 140 * s]];
  pfill(top, { c: '#6c9e3a', sp: 10, a: 0.55, s: sd });
  pstroke(top, { c: '#4c7f2a', w: 3, s: sd + 4 });
}
function rock(x, y, s, sd, col = '#8d8f99') {
  const p = [[x - 40 * s, y], [x - 30 * s, y - 30 * s], [x, y - 44 * s], [x + 34 * s, y - 26 * s], [x + 44 * s, y]];
  pfill([...p, [x - 40 * s, y]], { c: col, sp: 9, a: 0.5, s: sd, ang: 1 });
  pstroke(p, { c: '#55565f', w: 3, s: sd });
}
function grassTuft(x, y, s, sd, col = '#4f9a3c') {
  for (let k = 0; k < 5; k++) { const a = (k - 2) * 0.3 + rs(sd + k, 1) * 0.1; pstroke([[x + k * 4 * s, y], [x + k * 4 * s + Math.sin(a) * 30 * s, y - 25 * s], [x + k * 4 * s + Math.sin(a) * 55 * s, y - (45 + rnd(sd + k) * 25) * s]], { c: col, w: 3.5 * s, s: sd + k * 7 }); }
}
function drawBackground() {
  // sun (very far)
  layer(0.25);
  {
    const sx = cam.x * 0.25 + 790, sy = cam.y * 0.25 - 350;
    C.save(); C.translate(sx, sy); C.rotate(TIME * 0.25);
    pfill([[-55, 0], [-39, -39], [0, -55], [39, -39], [55, 0], [39, 39], [0, 55], [-39, 39]], { c: '#f2c230', sp: 9, a: .65, s: 31 });
    pcirc(0, 0, 58, { c: '#e3a51a', w: 4, s: 3 });
    for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; pline(Math.cos(a) * 75, Math.sin(a) * 75, Math.cos(a) * 112, Math.sin(a) * 112, { c: '#e3a51a', w: 4, s: 40 + k }); }
    C.restore();
  }
  // clouds
  layer(0.4);
  for (let k = 0; k < 9; k++) {
    const x = -700 + k * 520 * 0.85 + rnd(k, 3) * 200, y = -60 - k * 62 - rnd(k, 5) * 120 + 0 - 260;
    const r = 34 + rnd(k, 8) * 18;
    C.save(); C.globalAlpha = 0.85;
    pstroke([[x - r * 2.2, y], [x - r * 1.9, y - r * .9], [x - r, y - r * 1.4], [x, y - r * 1.8], [x + r, y - r * 1.3], [x + r * 2, y - r * .8], [x + r * 2.3, y], [x - r * 2.2, y]], { c: '#7aa6d6', w: 3.5, s: 70 + k });
    C.restore();
  }
  // landscape strip per stage
  layer(BGF);
  C.save(); C.globalAlpha = 0.62;
  // horizon line connecting stages
  const hz = [];
  for (let i = -1; i <= 6; i++) { const ii = clamp(i, 0, 5); const [ax, ay] = stageAnchor(ii, BGF); hz.push([ax + (i - ii) * 900 - 500, ay + 125 + (i % 2) * 14]); hz.push([ax + (i - ii) * 900 + 200, ay + 118]); }
  pstroke(hz, { c: '#9a8c6a', w: 3, s: 500, j: 3 });
  for (let i = 0; i < 6; i++) {
    const [ax, ay] = stageAnchor(i, BGF), gy = ay + 122;
    const sd = i * 100;
    const ax1 = hipXAt(2 + 2.5 * i + 1.25) + 160, fade = clamp(1.6 - Math.abs(cam.x - ax1) / (780 / Math.min(cam.z, 1.2)), 0, 1);
    if (fade <= 0) continue;
    C.save(); C.globalAlpha *= fade;
    if (i === 0) { tree(ax - 520, gy, 1.1, sd); tree(ax - 120, gy, 0.8, sd + 10); tree(ax + 380, gy, 1.25, sd + 20); grassTuft(ax + 120, gy, 1, sd + 5); }
    if (i === 1) { acacia(ax - 300, gy, 1.1, sd); acacia(ax + 420, gy, 0.8, sd + 10); for (let k = 0; k < 6; k++) grassTuft(ax - 600 + k * 220, gy, 0.8, sd + k, '#c9a640');
      for (let k = 0; k < 3; k++) { const bx = ax - 100 + k * 60 + Math.sin(TIME * 2 + k) * 10, by = gy - 330 - k * 20; pstroke([[bx - 14, by - 4], [bx, by + 4], [bx + 14, by - 4]], { c: GR, w: 2.5, s: sd + 30 + k }); } }
    if (i === 2) { // volcano
      const vx = ax + 300; poly([[vx - 260, gy], [vx - 60, gy - 230], [vx + 40, gy - 230], [vx + 250, gy]], { c: '#6b5a4a', w: 3.5, s: sd });
      pfill([[vx - 260, gy], [vx - 60, gy - 230], [vx + 40, gy - 230], [vx + 250, gy]], { c: '#a08a70', a: .45, sp: 12, s: sd });
      for (let k = 0; k < 3; k++) { const ph = (TIME * 0.6 + k / 3) % 1; pcirc(vx - 10 + Math.sin(ph * 6) * 20, gy - 260 - ph * 160, 18 + ph * 30, { c: '#8d8f99', w: 3, s: sd + k * 9, a: 1 - ph }); }
      pfill([[vx - 60, gy - 228], [vx - 10, gy - 200], [vx + 40, gy - 228]], { c: '#e0742f', a: .8, sp: 6, s: sd + 4 });
      rock(ax - 380, gy, 1.2, sd + 6); rock(ax - 250, gy, 0.7, sd + 7); }
    if (i === 3) { // cave + mammoth
      const cx = ax - 420; poly([[cx - 160, gy], [cx - 140, gy - 150], [cx - 40, gy - 210], [cx + 100, gy - 180], [cx + 170, gy]], { c: '#55565f', w: 4, s: sd });
      pfill([[cx - 50, gy], [cx - 40, gy - 90], [cx + 10, gy - 110], [cx + 60, gy - 80], [cx + 70, gy]], { c: '#2c2e3b', a: .7, sp: 6, s: sd + 1 });
      const mx = ax + 330 - (TIME - 10.75) * 30, my = gy; // mammoth slowly walks
      const bob = Math.sin(TIME * 6) * 3;
      poly([[mx - 110, my - 60 + bob], [mx - 90, my - 140 + bob], [mx + 20, my - 160 + bob], [mx + 90, my - 120 + bob], [mx + 100, my - 60 + bob]], { c: '#7a4a2a', w: 4, s: sd + 3 });
      pfill([[mx - 110, my - 60 + bob], [mx - 90, my - 140 + bob], [mx + 20, my - 160 + bob], [mx + 90, my - 120 + bob], [mx + 100, my - 60 + bob]], { c: '#9a5f36', a: .5, sp: 9, s: sd + 4 });
      for (let k = 0; k < 4; k++) { const lx = mx - 90 + k * 55, sw = Math.sin(TIME * 6 + k * 1.6) * 8; pline(lx, my - 62 + bob, lx + sw, my, { c: '#7a4a2a', w: 7, s: sd + 10 + k }); }
      pstroke([[mx - 100, my - 110 + bob], [mx - 140, my - 70 + bob], [mx - 130, my - 20 + bob], [mx - 112, my - 30 + bob]], { c: '#7a4a2a', w: 6, s: sd + 20 });
      pstroke([[mx - 95, my - 85 + bob], [mx - 150, my - 60 + bob], [mx - 165, my - 95 + bob]], { c: '#e8dcc0', w: 5, s: sd + 21 });
      pcirc(mx - 75, my - 118 + bob, 3, { c: GR, w: 4, s: sd + 22 }); }
    if (i === 4) { // huts + cave painting style hand
      for (let k = 0; k < 2; k++) { const hx = ax - 380 + k * 600, sc = k ? 0.8 : 1.05;
        poly([[hx - 90 * sc, gy], [hx, gy - 150 * sc], [hx + 90 * sc, gy]], { c: '#7a4a2a', w: 4, s: sd + k });
        pfill([[hx - 90 * sc, gy], [hx, gy - 150 * sc], [hx + 90 * sc, gy]], { c: '#c98d4a', a: .45, sp: 10, s: sd + k + 5, ang: 1.2 });
        pline(hx - 15 * sc, gy - 170 * sc, hx + 10 * sc, gy - 120 * sc, { c: '#7a4a2a', w: 4, s: sd + k + 9 });
        pline(hx + 15 * sc, gy - 170 * sc, hx - 10 * sc, gy - 120 * sc, { c: '#7a4a2a', w: 4, s: sd + k + 19 }); }
      // little campfire
      const fx = ax + 10, fl = 1 + 0.15 * Math.sin(TIME * 17);
      pstroke([[fx - 20, gy], [fx - 8, gy - 40 * fl], [fx, gy - 20], [fx + 8, gy - 48 * fl], [fx + 20, gy]], { c: '#e0742f', w: 4, s: sd + 40 });
      pline(fx - 30, gy + 2, fx + 30, gy - 6, { c: '#7a4a2a', w: 5, s: sd + 41 }); }
    if (i === 5) { // city skyline
      const bw = [110, 80, 140, 90, 120, 70, 130], bh = [260, 170, 330, 210, 290, 150, 240];
      let bx = ax - 650;
      for (let k = 0; k < bw.length; k++) {
        const x0 = bx, x1 = bx + bw[k], top = gy - bh[k];
        poly([[x0, gy], [x0, top], [x1, top], [x1, gy]], { c: '#4f5568', w: 3.5, s: sd + k });
        pfill([[x0, gy], [x0, top], [x1, top], [x1, gy]], { c: k % 2 ? '#9fb7d6' : '#b9c3d6', a: .4, sp: 12, s: sd + k + 30 });
        for (let wy = top + 20; wy < gy - 30; wy += 38) for (let wx = x0 + 16; wx < x1 - 20; wx += 30) {
          const lit = rnd(wx * 0.1 + wy, k) > 0.45;
          if (lit) pfill([[wx, wy], [wx + 14, wy], [wx + 14, wy + 18], [wx, wy + 18]], { c: '#f2c230', a: .8, sp: 5, s: wx + wy, step: 30 });
        }
        bx = x1 + 22;
      }
      // antenna & wifi on tallest
      const ax2 = ax - 650 + 110 + 22 + 80 + 22 + 70;
      pline(ax2, gy - 330, ax2, gy - 400, { c: '#4f5568', w: 3, s: sd + 70 });
      for (let k = 1; k <= 3; k++) { const rr = k * 16, pts = []; for (let a = -2.4; a <= -0.74; a += 0.2) pts.push([ax2 + Math.cos(a) * rr, gy - 400 + Math.sin(a) * rr]); C.save(); C.globalAlpha *= 0.5 + 0.5 * Math.sin(TIME * 5 - k); pstroke(pts, { c: '#3f7fc4', w: 3, s: sd + 80 + k }); C.restore(); }
    }
    C.restore();
  }
  C.restore();
}

// ---------- stairs + labels ----------
function drawStairs() {
  layer(1);
  for (let i = 0; i < 6; i++) {
    const x0 = stepX0(i), x1 = stepX1(i), top = stepTop(i), bot = top + 470 + (i % 2) * 40;
    const ragged = [];
    for (let x = x1; x >= x0; x -= 80) ragged.push([x, bot + rs(x * 0.01 + i, 2) * 22]);
    const face = [[x0, top], [x1, top], ...ragged];
    C.save(); C.beginPath(); C.moveTo(face[0][0], face[0][1]); for (const p of face) C.lineTo(p[0], p[1]); C.closePath();
    C.fillStyle = '#f6f1e3'; C.globalAlpha = 0.86; C.fill(); C.restore();
    pfill(face, { c: STCOL[i], a: 0.42, sp: 16, ang: 0.42, s: 900 + i * 13, w: 6 });
  }
  // outline as one staircase line
  const L = [[stepX0(0), 0]];
  for (let i = 0; i < 6; i++) { L.push([stepX1(i), stepTop(i)]); if (i < 5) L.push([stepX1(i), stepTop(i + 1)]); }
  pstroke(L, { c: GR, w: 4.5, s: 1234, step: 22, j: 1.8 });
  // top-of-step details
  for (let i = 0; i < 6; i++) {
    const x0 = stepX0(i), top = stepTop(i), sd = 2000 + i * 50;
    if (i <= 1) for (let k = 0; k < 7; k++) grassTuft(Math.max(x0, i * STW) + 30 + k * 85, top + 2, 0.55, sd + k, i ? '#c9a640' : '#4f9a3c');
    if (i === 2) for (let k = 0; k < 4; k++) rock(i * STW + 60 + k * 150, top + 2, 0.35, sd + k);
    if (i === 5) { for (let k = 0; k < 4; k++) pline(i * STW + 80 + k * 220, top + 12, i * STW + 160 + k * 220, top + 12, { c: '#f2c230', w: 5, s: sd + k }); }
  }
  // labels
  for (let i = 0; i < 6; i++) {
    const tl = LAND[i];
    if (TIME < tl - 0.02) continue;
    const lx = i === 0 ? -260 : i * STW + 70, ly = stepTop(i) + 100;
    const name = NAMES[i][0], N = name.length;
    const size = name.length > 16 ? 62 : 74;
    const res = htext(name, lx, ly, size, {
      s: i * 17,
      appear: (k) => clamp((TIME - tl - k * 0.028) / 0.12, 0, 1),
      dy: (k) => { const u = clamp((TIME - tl - k * 0.028) / 0.32, 0, 1); return -70 * (1 - eback(u)); },
      rot: (k) => { const u = clamp((TIME - tl - k * 0.028) / 0.32, 0, 1); return (1 - u) * rs(k + i, 9) * 0.6; },
    });
    const ur = clamp((TIME - tl - N * 0.028 - 0.05) / 0.25, 0, 1);
    if (ur > 0) { const pts = []; for (let k = 0; k <= 12 * ur; k++) pts.push([lx + k / 12 * res.w, ly + 16 + Math.sin(k * 1.7) * 4]); if (pts.length > 1) pstroke(pts, { c: STCOL[i] === '#8d8f99' ? '#55565f' : STCOL[i], w: 5, s: 3000 + i }); }
    const dr = clamp((TIME - tl - 0.35) / 0.35, 0, 1);
    if (dr > 0) htext(NAMES[i][1], lx + 4, ly + 64, 46, { wt: 400, rev: dr, c: '#4a4c58', s: i * 7 });
    // step number in a kid circle
    if (ur > 0.5) { const nx = lx - 42, ny = ly - 24; pcirc(nx, ny, 24 * eout((ur - 0.5) * 2), { c: '#d64a4a', w: 3, s: 4000 + i }); htext(String(i + 1), nx - 10, ny + 14, 42, { c: '#d64a4a', a: eout((ur - .5) * 2) }); }
  }
}

// ---------- title & pencil ----------
const QSTART = 18.55, QHIT = 18.75;
function drawTitle() {
  layer(1);
  const { x, y, size, str } = TITLE;
  const w = textW(str, size), lx = x - w / 2 - 50;
  const rev = clamp((TIME - 0.12) / 0.9, 0, 1);
  const res = htext(str, lx, y, size, {
    rev, cols: STCOL.concat(['#d64a4a', '#5fa548']), s: 77,
    dy: (k) => { const d = TIME - QHIT - k * 0.035; return d > 0 ? -34 * Math.exp(-d * 7) * Math.sin(d * 26) : 0; },
  });
  // underline after writing
  const ur = clamp((TIME - 1.0) / 0.22, 0, 1);
  if (ur > 0) { const pts = []; for (let k = 0; k <= 20 * ur; k++) pts.push([lx + k / 20 * w, y + 34 + Math.sin(k * 0.9) * 7]); if (pts.length > 1) pstroke(pts, { c: GR, w: 6, s: 5555 }); }
  // question mark drawn as a pencil stroke at the end
  let qtip = null;
  if (TIME > QSTART) {
    const qr = clamp((TIME - QSTART) / (QHIT - QSTART - 0.04), 0, 1);
    const qx = lx + w + 70, qy = y - 30, s = 1.25;
    const path = [];
    for (let k = 0; k <= 24; k++) { const a = -Math.PI * 0.95 + k / 24 * Math.PI * 1.45; path.push([qx + Math.cos(a) * 46 * s, qy - 92 * s + Math.sin(a) * 46 * s]); }
    path.push([qx + 6 * s, qy - 20 * s]); path.push([qx + 2 * s, qy + 2 * s]);
    const nP = Math.max(2, Math.floor(path.length * qr));
    const pop = 1 + 0.25 * gauss(TIME, QHIT + 0.05, 0.08);
    C.save(); C.translate(qx, qy - 40); C.scale(pop, pop); C.translate(-qx, -(qy - 40));
    pstroke(path.slice(0, nP), { c: '#d64a4a', w: 15, s: 6000, j: 1 });
    qtip = path[nP - 1];
    if (TIME > QHIT - 0.03) { pcirc(qx + 2 * s, qy + 40 * s, 9, { c: '#d64a4a', w: 12, s: 6001 }); }
    C.restore();
    // impact lines
    const e = clamp((TIME - QHIT) / 0.35, 0, 1);
    if (e > 0 && e < 1) for (let k = 0; k < 7; k++) { const a = -2.6 + k * 0.62, r0 = 120 + e * 70, r1 = r0 + 50 * (1 - e); C.save(); C.globalAlpha = 1 - e; pline(qx + Math.cos(a) * r0, qy - 40 + Math.sin(a) * r0, qx + Math.cos(a) * r1, qy - 40 + Math.sin(a) * r1, { c: '#d64a4a', w: 5, s: 6100 + k }); C.restore(); }
  }
  return { tip: res.tip, qtip, qx: lx + w + 70 };
}
function drawPencil(tip, ang, lift, alpha) {
  if (!tip || alpha <= 0) return;
  C.save(); C.globalAlpha *= alpha;
  C.translate(tip[0], tip[1] - lift * 120); C.rotate(ang); C.scale(1 + lift * 0.6, 1 + lift * 0.6);
  // shadow
  C.save(); C.globalAlpha *= 0.15; C.fillStyle = '#000'; C.translate(14, 22); C.beginPath(); C.moveTo(0, 0); C.lineTo(60, -17); C.lineTo(420, -17); C.lineTo(420, 17); C.lineTo(60, 17); C.closePath(); C.fill(); C.restore();
  C.fillStyle = '#f6f1e3';
  const body = [[60, -17], [400, -17], [400, 17], [60, 17]];
  C.beginPath(); C.moveTo(60, -17); C.lineTo(400, -17); C.lineTo(400, 17); C.lineTo(60, 17); C.closePath(); C.fill();
  pfill(body, { c: '#f2c230', a: .85, sp: 7, s: 7000, ang: 1.2 });
  pline(60, -6, 400, -6, { c: '#c99a1a', w: 2, s: 7001 });
  pline(60, 6, 400, 6, { c: '#c99a1a', w: 2, s: 7002 });
  const cone = [[0, 0], [60, -17], [60, 17]];
  C.beginPath(); C.moveTo(0, 0); C.lineTo(60, -17); C.lineTo(60, 17); C.closePath(); C.fillStyle = '#f0d9b5'; C.fill();
  poly(cone, { c: '#9a7a50', w: 3, s: 7003 });
  pfill([[0, 0], [20, -6], [20, 6]], { c: GR, a: 1, sp: 3, s: 7004, w: 4 });
  pfill([[400, -17], [440, -17], [440, 17], [400, 17]], { c: '#e48aa0', a: .9, sp: 6, s: 7005 });
  poly(body, { c: GR, w: 3, s: 7006 });
  poly([[400, -17], [440, -15], [442, 15], [400, 17]], { c: GR, w: 3, s: 7007 });
  C.restore();
}

// ---------- character ----------
function ik(a, b, l1, l2, bend) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1e-3, dm = Math.min(d, l1 + l2 - 0.5);
  const ang = Math.atan2(dy, dx);
  const c = clamp((l1 * l1 + dm * dm - l2 * l2) / (2 * l1 * dm), -1, 1), A = Math.acos(c) * bend;
  const j = [a[0] + Math.cos(ang - A) * l1, a[1] + Math.sin(ang - A) * l1];
  const e = [a[0] + Math.cos(ang) * dm, a[1] + Math.sin(ang) * dm];
  return [j, e];
}
function furZig(p, q, amt, sd, side = -1) {
  if (amt < 0.05) return;
  const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy), nx = -dy / L * side, ny = dx / L * side;
  const n = Math.max(2, Math.floor(L / 9)), pts = [];
  for (let k = 0; k <= n; k++) { const u = k / n, o = (k % 2 ? 9 : 2) * amt; pts.push([p[0] + dx * u + nx * o, p[1] + dy * u + ny * o]); }
  pstroke(pts, { c: '#6b4a32', w: 2.2, s: sd, j: 0.6, step: 30, a: 0.9 });
}
function knockAt(t) { // habilis strikes stones on beats 8.25 & 8.875
  let v = 0;
  for (const ts of [8.25, 8.875]) { if (t > ts - 0.28 && t < ts) v = Math.max(v, Math.sin(clamp((t - (ts - 0.28)) / 0.2, 0, 1) * Math.PI / 2)); if (t >= ts && t < ts + 0.08) v = Math.max(v, 0); }
  return v;
}
function charPose(t) {
  const P = paramsAt(t), h = P.h, hunch = hunchAt(t);
  const x = hipXAt(t), sp = speedAt(t), ph = phaseAt(t);
  const j = jumpAt(t), J = j ? Math.sin(Math.PI * j.s) : 0;
  const gy = groundAt(t), floor = j ? null : stepTop(stageAt(t));
  // anticipation & landing squash
  let crouch = 0;
  for (const T of TT) { crouch += 14 * gauss(t, T - 0.33, 0.05) + 16 * gauss(t, T + 0.24, 0.06); }
  crouch += 10 * hunch;
  const legL = 152 * P.leg * h, thigh = legL * 0.5, shin = legL * 0.5;
  const torso = 108 * h, armL = 145 * P.arm * h, headR = 25 * P.head * Math.sqrt(h);
  const bob = -3.5 * Math.abs(Math.cos(Math.PI * 2 * ph)) * sp;
  const idle = t < 2 ? Math.sin(t * 5) * 2 : 0;
  const hipH = legL * lerp(0.8, 0.92, P.post) - crouch + bob + idle - J * 18;
  const H = [x, gy - hipH];
  const lean = lerp(1.26, 0, P.post) + 0.05 * sp * P.post + hunch * 0.8;
  const Sh = [H[0] + Math.sin(lean) * torso, H[1] - Math.cos(lean) * torso];
  const headDir = lean * 0.5 - 0.15 * (1 - P.post) + hunch * 0.55;
  const Hc = [Sh[0] + Math.sin(headDir) * (headR + 12), Sh[1] - Math.cos(headDir) * (headR + 12)];
  const stride = 80 * sp;
  const legs = [], arms = [];
  for (let L = 0; L < 2; L++) {
    const u = ((ph + L * 0.5) % 1 + 1) % 1;
    let fx, fy;
    if (u < 0.5) { fx = H[0] + stride * (0.5 - 2 * u) + 6; fy = floor ?? gy; }
    else { const v = (u - 0.5) * 2; fx = H[0] - stride / 2 * Math.cos(Math.PI * v) + 6; fy = (floor ?? gy) - Math.sin(Math.PI * v) * 22 * h * sp; }
    if (t < 2) { fx = H[0] + (L ? 14 : -10); fy = gy; }
    if (j) { const tuck = [H[0] + (L ? 18 : -8), H[1] + legL * 0.55]; fx = lerp(fx, tuck[0], J); fy = lerp(fy, tuck[1], J); if (j.s > 0.85) fy = Math.min(fy, gy); }
    const [knee, foot] = ik(H, [fx, fy], thigh, shin, 1);
    legs.push({ knee, foot });
    // arms
    const ua = ((ph + L * 0.5 + 0.5) % 1 + 1) % 1;
    let qx, qy;
    if (ua < 0.5) { qx = Sh[0] + 18 + stride * (0.5 - 2 * ua); qy = floor ?? gy; }
    else { const v = (ua - 0.5) * 2; qx = Sh[0] + 18 - stride / 2 * Math.cos(Math.PI * v); qy = (floor ?? gy) - Math.sin(Math.PI * v) * 18 * sp; }
    if (t < 2) { qx = Sh[0] + (L ? 30 : 8); qy = gy; }
    const sw = (L ? 1 : -1) * 0.5 * Math.sin(Math.PI * 2 * ph) * sp + 0.12;
    const ux = Sh[0] + Math.sin(sw) * armL * 0.96, uy = Sh[1] + Math.cos(sw) * armL * 0.96;
    const qw = clamp(1 - P.post / 0.5, 0, 1);
    let hx = lerp(ux, qx, qw), hy = lerp(uy, qy, qw);
    // australopithecus: long dangling arms swing low
    if (L === 1 && P.hold > 0.01) { // front hand holds tool
      const tool = TOOLS[stageAt(t)];
      let tx = Sh[0] + armL * 0.55, ty = Sh[1] + armL * 0.5;
      if (tool === 'torch') { tx = Sh[0] + armL * 0.62; ty = Sh[1] + armL * 0.22; }
      if (tool === 'spear') { tx = Sh[0] + armL * 0.5; ty = Sh[1] + armL * 0.42; }
      if (tool === 'cup') { tx = Sh[0] + armL * 0.62; ty = Sh[1] + armL * 0.32; }
      if (tool === 'stone') { const k = knockAt(t); tx = Sh[0] + armL * lerp(0.6, 0.35, k); ty = Sh[1] + armL * lerp(0.55, -0.45, k); }
      hx = lerp(hx, tx, P.hold); hy = lerp(hy, ty, P.hold);
    }
    if (L === 0 && stageAt(t) === 2) { // other hand holds the anvil stone in front of chest
      hx = lerp(hx, Sh[0] + armL * 0.5, P.hold); hy = lerp(hy, Sh[1] + armL * 0.62, P.hold);
    }
    if (hunch > 0) { const pxp = Sh[0] + armL * 0.55, pyp = Sh[1] + armL * 0.2 + (L ? 0 : 8); hx = lerp(hx, pxp + (L ? 4 : -6), hunch); hy = lerp(hy, pyp, hunch); }
    if (t > 17.15 && L === 1) { const k = sstep(17.15, 17.45, t) * (1 - hunch); hx = lerp(hx, Sh[0] + armL * 0.6, k); hy = lerp(hy, Sh[1] + armL * 0.15, k); }
    if (j) { hx = lerp(hx, Sh[0] + (L ? 0.45 : -0.3) * armL, J * 0.9); hy = lerp(hy, Sh[1] - armL * 0.8, J * 0.9); }
    const [elb, hand] = ik(Sh, [hx, hy], armL / 2, armL / 2, -1);
    arms.push({ elb, hand });
  }
  return { P, H, Sh, Hc, headR, legs, arms, lean, headDir, gy, J, hunch, h, armL };
}
function drawTool(tool, hand, ps, t) {
  const [x, y] = hand;
  if (tool === 'stone') {
    poly([[x - 12, y + 2], [x - 6, y - 12], [x + 10, y - 10], [x + 14, y + 4], [x + 2, y + 12]], { c: '#55565f', w: 3, s: 8100 });
    pfill([[x - 12, y + 2], [x - 6, y - 12], [x + 10, y - 10], [x + 14, y + 4], [x + 2, y + 12]], { c: '#8d8f99', a: .6, sp: 6, s: 8101 });
  } else if (tool === 'torch') {
    const tx = x + 26, ty = y - 70;
    pline(x - 8, y + 18, tx, ty, { c: '#7a4a2a', w: 8, s: 8200 });
    const fl = (k) => 1 + 0.18 * Math.sin(t * 19 + k * 2.1) + 0.1 * rs(BOIL, k);
    // glow
    C.save(); const g = C.createRadialGradient(tx, ty - 30, 5, tx, ty - 30, 190); g.addColorStop(0, 'rgba(255,190,60,0.32)'); g.addColorStop(1, 'rgba(255,190,60,0)'); C.fillStyle = g; C.fillRect(tx - 200, ty - 230, 400, 400); C.restore();
    const flame = (s, c, sd) => { const f = fl(sd); const pts = [[tx - 22 * s, ty], [tx - 18 * s, ty - 30 * s * f], [tx - 4 * s, ty - 46 * s * f], [tx + 2 * s, ty - 78 * s * f], [tx + 12 * s, ty - 44 * s * f], [tx + 22 * s, ty - 28 * s * f], [tx + 20 * s, ty]]; pfill(pts, { c, a: .85, sp: 6, s: sd }); pstroke([...pts, pts[0]], { c, w: 3, s: sd + 1 }); };
    flame(1.0, '#d64a4a', 8210); flame(0.7, '#e0742f', 8220); flame(0.42, '#f2c230', 8230);
  } else if (tool === 'spear') {
    const a = -0.95, L = 250, bx = x - Math.cos(a) * 90, by = y - Math.sin(a) * 90;
    const ex = bx + Math.cos(a) * L, ey = by + Math.sin(a) * L;
    pline(bx, by, ex, ey, { c: '#7a4a2a', w: 6, s: 8300 });
    const nx = -Math.sin(a), ny = Math.cos(a);
    const tip = [[ex + nx * 12, ey + ny * 12], [ex + Math.cos(a) * 40, ey + Math.sin(a) * 40], [ex - nx * 12, ey - ny * 12]];
    pfill(tip, { c: '#8d8f99', a: .8, sp: 4, s: 8301 }); poly(tip, { c: '#55565f', w: 3, s: 8302 });
    for (let k = 0; k < 3; k++) pline(ex - Math.cos(a) * (6 + k * 6) + nx * 7, ey - Math.sin(a) * (6 + k * 6) + ny * 7, ex - Math.cos(a) * (6 + k * 6) - nx * 7, ey - Math.sin(a) * (6 + k * 6) - ny * 7, { c: '#c98d4a', w: 3, s: 8310 + k });
  } else if (tool === 'cup') {
    const c = [[x - 13, y - 30], [x + 15, y - 30], [x + 11, y + 6], [x - 9, y + 6]];
    pfill(c, { c: '#d64a4a', a: .7, sp: 5, s: 8400 }); poly(c, { c: '#8a2a2a', w: 3, s: 8401 });
    pline(x - 15, y - 33, x + 17, y - 33, { c: '#8a2a2a', w: 4, s: 8402 });
    pline(x - 10, y - 14, x + 12, y - 14, { c: '#f6f1e3', w: 4, s: 8403 });
    for (let k = 0; k < 2; k++) { const ph = (t * 0.9 + k * 0.5) % 1, pts = []; for (let m = 0; m < 6; m++) pts.push([x + k * 8 - 2 + Math.sin(m * 1.3 + t * 3) * 5, y - 40 - ph * 30 - m * 9]); C.save(); C.globalAlpha *= 0.6 * (1 - ph); pstroke(pts, { c: '#8d8f99', w: 2.5, s: 8410 + k }); C.restore(); }
  } else if (tool === 'phone') {
    C.save(); C.translate(x + 4, y - 8); C.rotate(-0.5 - ps.hunch * 0.5);
    const buzz = t < 17.65 ? Math.sin(t * 90) * 2.5 * sstep(17.2, 17.3, t) : 0;
    C.translate(buzz, 0);
    pfill([[-12, -22], [12, -22], [12, 22], [-12, 22]], { c: '#2c2e3b', a: .95, sp: 4, s: 8500 });
    pfill([[-8, -17], [8, -17], [8, 15], [-8, 15]], { c: '#5fb0ff', a: .9, sp: 4, s: 8501 });
    poly([[-12, -22], [12, -22], [12, 22], [-12, 22]], { c: GR, w: 3, s: 8502 });
    C.restore();
    // screen glow on face
    if (ps.hunch > 0.2) { C.save(); const g = C.createRadialGradient(x, y - 10, 2, x, y - 10, 120); g.addColorStop(0, `rgba(95,176,255,${0.28 * ps.hunch})`); g.addColorStop(1, 'rgba(95,176,255,0)'); C.fillStyle = g; C.fillRect(x - 130, y - 140, 260, 260); C.restore(); }
    // notification ping marks
    if (t > 17.2 && t < 17.75) { const e = (t - 17.2) / 0.55; C.save(); C.globalAlpha *= 1 - e; for (let k = 0; k < 3; k++) { const a = -1.9 + k * 0.5, r0 = 30 + e * 30; pline(x + Math.cos(a) * r0, y - 10 + Math.sin(a) * r0, x + Math.cos(a) * (r0 + 18), y - 10 + Math.sin(a) * (r0 + 18), { c: '#d64a4a', w: 4, s: 8510 + k }); } C.restore(); }
  }
}
function drawChar(t) {
  layer(1);
  const ps = charPose(t), P = ps.P, st = stageAt(t);
  const { H, Sh, Hc, headR, legs, arms } = ps;
  const lw = 5.5 * Math.sqrt(ps.h);
  // contact shadow (scribbled)
  const floor = stepTop(st), j = jumpAt(t);
  const sh = j ? 1 - ps.J * 0.6 : 1;
  C.save(); C.globalAlpha = 0.35;
  pstroke([[H[0] - 55 * sh, floor + 4], [H[0] + 75 * sh, floor + 6], [H[0] - 40 * sh, floor + 9], [H[0] + 60 * sh, floor + 11]], { c: '#55565f', w: 3, s: 9000, j: 1 });
  C.restore();
  const jeans = P.shirt > 0.5 ? '#2f4f8a' : GR;
  // back limbs (lighter)
  C.save(); C.globalAlpha = 0.6;
  pstroke([H, legs[0].knee, legs[0].foot], { c: jeans, w: lw * (1 + P.shirt * 0.5), s: 9100 });
  pline(legs[0].foot[0], legs[0].foot[1], legs[0].foot[0] + 16, legs[0].foot[1] + 1, { c: GR, w: lw, s: 9101 });
  pstroke([Sh, arms[0].elb, arms[0].hand], { c: GR, w: lw, s: 9102 });
  furZig(Sh, arms[0].elb, P.fur, 9103, 1);
  C.restore();
  if (st === 2) drawTool('stone', arms[0].hand, ps, t);
  // torso (curved spine)
  const bul = (1 - P.post) * 20 + ps.hunch * 22;
  const mx = (H[0] + Sh[0]) / 2 - Math.cos(ps.lean) * bul, my = (H[1] + Sh[1]) / 2 - Math.sin(ps.lean) * bul;
  const spine = []; for (let k = 0; k <= 6; k++) { const u = k / 6; spine.push([(1 - u) * (1 - u) * H[0] + 2 * u * (1 - u) * mx + u * u * Sh[0], (1 - u) * (1 - u) * H[1] + 2 * u * (1 - u) * my + u * u * Sh[1]]); }
  // shirt
  if (P.shirt > 0.02) {
    const nx = Math.cos(ps.lean), ny = Math.sin(ps.lean);
    const shirt = [[Sh[0] - nx * 24, Sh[1] - ny * 24], [Sh[0] + nx * 24, Sh[1] + ny * 24], [H[0] + nx * 26, H[1] + ny * 26], [H[0] - nx * 26, H[1] - ny * 26]];
    C.save(); C.globalAlpha = P.shirt;
    pfill(shirt, { c: '#e0742f', a: .75, sp: 7, s: 9200, ang: 0.3 }); poly(shirt, { c: '#a3471a', w: 3, s: 9201 });
    C.restore();
  }
  pstroke(spine, { c: GR, w: lw * 1.1, s: 9300 });
  furZig(spine[1], spine[5], P.fur * 1.2, 9301, -1);
  if (P.cloth > 0.02) {
    const c = [[H[0] - 24, H[1] - 6], [H[0] + 26, H[1] - 8], [H[0] + 20, H[1] + 30], [H[0] + 4, H[1] + 18], [H[0] - 14, H[1] + 32]];
    C.save(); C.globalAlpha = P.cloth; pfill(c, { c: '#9a5f36', a: .7, sp: 6, s: 9310 }); poly(c, { c: '#6b3f20', w: 3, s: 9311 });
    for (let k = 0; k < 3; k++) pcirc(H[0] - 10 + k * 13, H[1] + 6, 3, { c: '#6b3f20', w: 3, s: 9312 + k });
    C.restore();
  }
  // front leg
  pstroke([H, legs[1].knee, legs[1].foot], { c: jeans, w: lw * (1 + P.shirt * 0.5), s: 9400 });
  pline(legs[1].foot[0], legs[1].foot[1], legs[1].foot[0] + 17, legs[1].foot[1] + 1, { c: GR, w: lw, s: 9401 });
  furZig(H, legs[1].knee, P.fur * 0.8, 9402, 1);
  if (P.shirt > 0.5) { for (const L of legs) pline(L.foot[0] - 4, L.foot[1] - 2, L.foot[0] + 20, L.foot[1], { c: '#d64a4a', w: 7, s: 9403 }); }
  // head
  C.save(); C.translate(Hc[0], Hc[1]); C.rotate(ps.headDir * 0.6);
  const r = headR;
  pcirc(0, 0, r, { c: GR, w: lw, s: 9500 });
  if (P.jaw > 0.04) { const jw = P.jaw; pstroke([[r * 0.55, r * 0.05], [r * (0.95 + 0.35 * jw), r * 0.35], [r * (0.85 + 0.3 * jw), r * (0.75 + 0.15 * jw)], [r * 0.25, r * (0.9 + 0.12 * jw)]], { c: GR, w: lw * 0.8, s: 9501 }); pcirc(r * (0.9 + 0.3 * jw), r * 0.45, 2, { c: GR, w: 3, s: 9502 }); }
  const blink = (TIME % 2.7) > 2.6 ? 0.2 : 1;
  C.save(); C.translate(r * 0.42, -r * 0.08); C.scale(1, blink); pcirc(0, 0, 3.4, { c: GR, w: 5, s: 9503 }); C.restore();
  if (P.brow > 0.03) pstroke([[r * 0.05, -r * 0.38], [r * 0.5, -r * (0.42 + 0.08 * P.brow)], [r * (0.85 + 0.25 * P.brow), -r * 0.3]], { c: GR, w: 3 + 5 * P.brow, s: 9504 });
  else pstroke([[r * 0.25, -r * 0.42], [r * 0.6, -r * 0.48]], { c: GR, w: 3, s: 9505 });
  // mouth: smile, but a little flat while staring at the phone
  const smile = 1 - ps.hunch;
  if (P.jaw < 0.5) pstroke([[r * 0.35, r * 0.45], [r * 0.55, r * (0.45 + 0.15 * smile)], [r * 0.78, r * 0.38]], { c: GR, w: 3, s: 9506 });
  pstroke([[-r * 0.55, -r * 0.1], [-r * (0.85 + 0.25 * P.jaw), 0], [-r * 0.55, r * 0.22]], { c: GR, w: 3, s: 9507 }); // ear
  if (P.hair > 0.05) {
    C.save(); C.globalAlpha = Math.min(1, P.hair * 1.5);
    if (P.shirt < 0.5) { const pts = []; for (let k = 0; k < 14; k++) { const a = -Math.PI * 1.05 + k / 13 * Math.PI * 0.95; const rr = r * (1.05 + (k % 2) * 0.22); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } pstroke(pts, { c: '#5a3a22', w: 4, s: 9508 }); pstroke([[-r * 0.9, r * 0.1], [-r * 1.05, r * 0.9], [-r * 0.7, r * 1.3]], { c: '#5a3a22', w: 4, s: 9509 }); }
    else { pstroke([[-r * 0.85, -r * 0.45], [-r * 0.3, -r * 1.15], [r * 0.3, -r * 1.12], [r * 0.75, -r * 0.7], [r * 0.2, -r * 0.85], [-r * 0.4, -r * 0.7]], { c: '#5a3a22', w: 5, s: 9510 }); }
    C.restore();
  }
  if (P.glasses > 0.05) { C.save(); C.globalAlpha = P.glasses; pcirc(r * 0.42, -r * 0.08, r * 0.3, { c: '#2c2e3b', w: 3, s: 9511 }); pline(r * 0.12, -r * 0.12, -r * 0.5, -r * 0.15, { c: '#2c2e3b', w: 2.5, s: 9512 }); C.restore(); }
  C.restore();
  // front arm + tool
  const tool = t > 17.15 ? 'phone' : TOOLS[st];
  if (tool && tool !== 'stone' && tool !== 'phone' && P.hold > 0.5) drawTool(tool, arms[1].hand, ps, t);
  if (tool === 'stone') drawTool('stone', arms[1].hand, ps, t);
  if (P.shirt > 0.5) { const e = arms[1].elb, s0 = Sh; pline(s0[0], s0[1], lerp(s0[0], e[0], 0.55), lerp(s0[1], e[1], 0.55), { c: '#e0742f', w: lw * 2.6, s: 9600 }); C.save(); C.globalAlpha = 0.6; const e0 = arms[0].elb; pline(s0[0], s0[1], lerp(s0[0], e0[0], 0.55), lerp(s0[1], e0[1], 0.55), { c: '#e0742f', w: lw * 2.6, s: 9601 }); C.restore(); }
  pstroke([Sh, arms[1].elb, arms[1].hand], { c: GR, w: lw, s: 9602 });
  furZig(Sh, arms[1].elb, P.fur, 9603, 1);
  pcirc(arms[1].hand[0], arms[1].hand[1], 4, { c: GR, w: 4, s: 9604 });
  if (tool === 'phone') drawTool('phone', arms[1].hand, ps, t);
  // stone sparks on knocks
  if (st === 2) for (const ts of [8.25, 8.875]) {
    const e = (t - ts) / 0.25; if (e > 0 && e < 1) { const c = arms[0].hand; C.save(); C.globalAlpha = 1 - e; for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.45, r0 = 14 + e * 40; pline(c[0] + Math.cos(a) * r0, c[1] - 10 + Math.sin(a) * r0, c[0] + Math.cos(a) * (r0 + 16), c[1] - 10 + Math.sin(a) * (r0 + 16), { c: k % 2 ? '#f2c230' : '#e0742f', w: 4, s: 9700 + k }); } C.restore(); }
  }
  // transformation scribble burst
  for (let i = 0; i < 5; i++) {
    const T = TT[i], env = gauss(t, T, 0.14);
    if (env < 0.02) continue;
    const cx = H[0] + 20, cy = (H[1] + Hc[1]) / 2 - 10, R = 95 + 70 * clamp((t - T + 0.25) / 0.5, 0, 1.2);
    C.save(); C.globalAlpha = Math.min(1, env * 1.3);
    const pts = [];
    for (let k = 0; k < 34; k++) { const a = k * 2.4 + i, rr = R * (0.35 + 0.65 * rnd(k, i + BOIL)); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.9]); }
    pstroke(pts, { c: '#55565f', w: 4, s: 9800 + i, j: 3 });
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + i, r0 = R * 1.0, r1 = R * 1.35; pline(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, { c: STCOL[i + 1], w: 5, s: 9850 + k }); }
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + i * 0.7, sx = cx + Math.cos(a) * R * 1.1, sy = cy + Math.sin(a) * R * 0.9, s = 12; poly([[sx, sy - s], [sx + s * .3, sy - s * .3], [sx + s, sy], [sx + s * .3, sy + s * .3], [sx, sy + s], [sx - s * .3, sy + s * .3], [sx - s, sy], [sx - s * .3, sy - s * .3]], { c: '#f2c230', w: 3, s: 9870 + k }); }
    C.restore();
  }
  // landing dust puffs
  for (let i = 0; i < 5; i++) {
    const tl = TT[i] + 0.2, e = (t - tl) / 0.4; if (e < 0 || e > 1) continue;
    const fy = stepTop(i + 1); C.save(); C.globalAlpha = 1 - e;
    for (let s = -1; s <= 1; s += 2) pcirc(H[0] + s * (30 + e * 60), fy - 10 - e * 10, 10 + e * 14, { c: '#8d8f99', w: 3, s: 9900 + i + s });
    C.restore();
  }
  return ps;
}

// ---------- foreground (DOF) ----------
function drawForeground() {
  layer(1.35);
  const F = 1.35;
  for (let i = 0; i < 6; i++) {
    const [ax, ay] = stageAnchor(i, F), gy = ay + 440, sd = 11000 + i * 40;
    for (let k = 0; k < 3; k++) {
      const x = ax - 900 + k * 900 + rnd(i, k) * 160;
      if (i === 0) { for (let m = 0; m < 6; m++) { const a = -1.9 + m * 0.3; pstroke([[x, gy], [x + Math.cos(a) * 110, gy + 40 + Math.sin(a) * 130], [x + Math.cos(a) * 160, gy + 40 + Math.sin(a) * 150 + 40]], { c: '#3f8f3a', w: 10, s: sd + k * 10 + m }); } }
      else if (i === 1) grassTuft(x, gy + 30, 2.4, sd + k, '#c9a640');
      else if (i === 2) rock(x, gy + 20, 3, sd + k);
      else if (i === 3) { pline(x - 90, gy - 20, x + 90, gy - 40, { c: '#e8dcc0', w: 18, s: sd + k }); pcirc(x - 95, gy - 20, 16, { c: '#e8dcc0', w: 10, s: sd + k + 3 }); pcirc(x + 95, gy - 40, 16, { c: '#e8dcc0', w: 10, s: sd + k + 4 }); }
      else if (i === 4) { pline(x, gy + 60, x + 10, gy - 70, { c: '#3f8f3a', w: 8, s: sd + k }); for (let m = 0; m < 6; m++) { const a = m / 6 * 6.283; pcirc(x + 10 + Math.cos(a) * 30, gy - 80 + Math.sin(a) * 30, 18, { c: '#e48aa0', w: 7, s: sd + k * 10 + m }); } pcirc(x + 10, gy - 80, 16, { c: '#f2c230', w: 9, s: sd + k + 7 }); }
      else if (i === 5) { const c = [[x - 60, gy + 60], [x, gy - 90], [x + 60, gy + 60]]; pfill(c, { c: '#e0742f', a: .8, sp: 10, s: sd + k }); poly(c, { c: '#a3471a', w: 6, s: sd + k + 1 }); pline(x - 30, gy - 5, x + 30, gy - 5, { c: '#f6f1e3', w: 14, s: sd + k + 2 }); }
    }
  }
}

// ---------- frame ----------
function drawFrame(t, ctx) {
  C = ctx; TIME = t;
  cam = camAt(t);
  drawPaper();
  // background into its own canvas for slight softness
  C = bgCv.getContext('2d'); C.setTransform(1, 0, 0, 1, 0, 0); C.clearRect(0, 0, CW, CH);
  drawBackground();
  C = ctx; C.setTransform(1, 0, 0, 1, 0, 0);
  const bgBlur = 1.2 + 1.5 * clamp((cam.z - 1.1) / 0.4, 0, 1);
  C.filter = `blur(${bgBlur.toFixed(2)}px)`; C.drawImage(bgCv, 0, 0); C.filter = 'none';
  drawStairs();
  const tt = drawTitle();
  drawChar(t);
  // pencil writing the title, then lifting away
  layer(1);
  if (t < 1.5) {
    const lift = eio(clamp((t - 1.02) / 0.4, 0, 1));
    const tip = tt.tip || (t >= 1.02 ? [TITLE.x + textW(TITLE.str, TITLE.size) / 2 - 50, TITLE.y + 34] : [TITLE.x - textW(TITLE.str, TITLE.size) / 2 - 50, TITLE.y - 40]);
    drawPencil(tip, -0.75 + 0.1 * Math.sin(t * 9), lift * 2.5, 1 - lift);
  }
  if (t > QSTART - 0.25 && t < QHIT + 0.9) {
    const qt = tt.qtip || [tt.qx + 4, TITLE.y + 20];
    const a = clamp((t - (QSTART - 0.25)) / 0.25, 0, 1) * (1 - clamp((t - QHIT - 0.2) / 0.5, 0, 1));
    const lift = (1 - clamp((t - (QSTART - 0.25)) / 0.25, 0, 1)) + clamp((t - QHIT - 0.15) / 0.6, 0, 1);
    drawPencil(qt, -0.85, lift * 1.6, a);
  }
  // foreground, defocused
  C = fgCv.getContext('2d'); C.setTransform(1, 0, 0, 1, 0, 0); C.clearRect(0, 0, CW, CH);
  drawForeground();
  C = ctx; C.setTransform(1, 0, 0, 1, 0, 0);
  C.filter = 'blur(10px)'; C.globalAlpha = 0.92; C.drawImage(fgCv, 0, 0); C.globalAlpha = 1; C.filter = 'none';
  // soft vignette
  const g = C.createRadialGradient(CW / 2, CH / 2, CH * 0.45, CW / 2, CH / 2, CH * 1.05);
  g.addColorStop(0, 'rgba(60,40,20,0)'); g.addColorStop(1, 'rgba(60,40,20,0.22)');
  C.fillStyle = g; C.fillRect(0, 0, CW, CH);
}
function screenSpeed(t) {
  const a = camAt(t - 1 / 120), b = camAt(t + 1 / 120);
  let v = Math.hypot(b.x - a.x, b.y - a.y) * b.z + Math.abs(Math.log(b.z / a.z)) * 1100 + Math.abs(b.r - a.r) * 1100;
  const h0 = [hipXAt(t - 1 / 120), groundAt(t - 1 / 120)], h1 = [hipXAt(t + 1 / 120), groundAt(t + 1 / 120)];
  const vc = Math.hypot(h1[0] - h0[0] - (b.x - a.x), h1[1] - h0[1] - (b.y - a.y)) * b.z;
  return Math.max(v, vc); // px per frame (approx)
}
function renderAt(t) {
  BOIL = Math.floor(t * 12 + 1e-6);
  const smear = screenSpeed(t) * 0.5, n = smear < 4 ? 1 : clamp(Math.ceil(smear / 1.6) + 1, 3, 12);
  if (n === 1) { drawFrame(t, mainCtx); return n; }
  const tc = tmpCv.getContext('2d'), shutter = 0.5 / FPS;
  for (let k = 0; k < n; k++) {
    const ts = t + (k / (n - 1) - 0.5) * shutter;
    tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalAlpha = 1; tc.filter = 'none';
    drawFrame(ts, tc);
    mainCtx.setTransform(1, 0, 0, 1, 0, 0); mainCtx.globalAlpha = 1 / (k + 1); mainCtx.drawImage(tmpCv, 0, 0);
  }
  mainCtx.globalAlpha = 1;
  return n;
}

// ---------- boot ----------
makeGrain(); buildCam();
window.renderAt = renderAt;
window.EVO_READY = document.fonts.load('700 80px Hand', 'ЭВОЛЮЦИЯ Примат 0123').then(() => document.fonts.load('400 40px Hand', 'млн лет 0123~,')).then(() => true);
if (!window.RENDER_MODE) {
  const aud = document.getElementById('aud'), sc = document.getElementById('scrub'), btn = document.getElementById('play');
  let playing = false, t0 = 0, start = 0;
  const loop = () => {
    let t = playing ? (aud && !aud.error && aud.readyState > 1 ? aud.currentTime : (performance.now() - start) / 1000 + t0) : +sc.value;
    if (t >= DUR) { playing = false; t = DUR - 1 / FPS; aud.pause(); btn.textContent = '▶ Play'; }
    if (playing) sc.value = t;
    renderAt(t);
    requestAnimationFrame(loop);
  };
  btn.onclick = () => { playing = !playing; btn.textContent = playing ? '❚❚ Pause' : '▶ Play'; t0 = +sc.value; if (t0 >= DUR - 0.05) t0 = 0; start = performance.now(); if (playing) { aud.currentTime = t0; aud.play().catch(() => { }); } else aud.pause(); };
  window.EVO_READY.then(loop);
}
