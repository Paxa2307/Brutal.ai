// Video 03 — «Вы влюбились в запах». Times are on the cut voice timeline;
// finalize() snaps every cut to the 8th-note grid of the 125 BPM score and
// auto-splits long image shots with a punch-in cut on the beat.
const BEAT_S = 0.48, GRID = BEAT_S / 2, END = 61.4;
const I = (src, o = {}) => ({ type: 'img', src, x: 540, y: 820, h: 900, enter: 'pop', ...o });
const ST = (str, o = {}) => ({ type: 'stamp', str, at: 0.15, size: 96, ...o });
const T = (str, o = {}) => ({ type: 'text', str, serif: true, size: 120, y: 760, enter: 'blur', ...o });
const LOVERS = (o = {}) => I('v3_01_lovers', { h: 980, y: 830, enter: 'none', ...o });
const SLOT = (s, v, roman) => [
  { s, bg: 'paper', formulas: false, els: [{ type: 'slot', seq: v.split(''), dur: 0.16, bgs: ['paper', 'black', 'green', 'black'] }], nosplit: true, z0: 1, z1: 1 },
  { s: s + 0.64, bg: 'black', fx: 'glitch', els: [{ type: 'year', val: v, roman, roll: 0.5 }], nosplit: true },
];

const RAW = [
  // ---------------- hook 0–6 (title overlay on top for 2.6 s)
  { s: 0.00, bg: 'black', els: [LOVERS()], z0: 1.0, z1: 1.05 },
  { s: 0.54, bg: 'green', fx: 'gflash', els: [I('11_brain', { h: 640, enter: 'none' }), ST('НЕТ', { at: 0.2, size: 130 })], shake: [0.2] },
  { s: 1.37, bg: 'black', fx: 'glitch', els: [I('v3_02_woman_scent', { h: 1000, enter: 'none' })] },
  { s: 2.09, bg: 'green', fx: 'flash', els: [I('v3_02_woman_scent', { h: 1000, enter: 'none' }), ST('ODOR', { at: 0.1, y: 1150 })], shake: [0.1], z0: 1.06, z1: 1.14, nosplit: true },
  { s: 2.91, bg: 'black', fx: 'whip', els: [I('v3_04_pill', { h: 560, enter: 'fly', from: 800 })] },
  { s: 4.47, bg: 'green', fx: 'zoom', els: [I('v3_04_pill', { h: 1100, x: 400, y: 900, enter: 'none' }), { type: 'circle', x: 640, y: 1110, rx: 120, ry: 90, at: 0.15 }], nosplit: true },
  { s: 5.29, bg: 'black', fx: 'glitch', els: [LOVERS({ alpha: 0.85 })], glitchAt: [0.4], nosplit: true },
  { s: 6.09, bg: 'black', fx: 'cut', els: [I('01_head', { h: 1000, enter: 'none' }), ST('БРЕД?', { at: 0.05, size: 130 })], shake: [0.05], nosplit: true },
  // ---------------- animals
  { s: 6.65, bg: 'green', fx: 'whip', els: [I('v3_05_mice', { h: 560, enter: 'fly', from: -800 }), ST('MUS', { at: 0.6, y: 1130 })], shake: [0.6] },
  ...SLOT(7.96, '1976', 'MCMLXXVI'),
  { s: 9.86, bg: 'black', fx: 'cut', els: [I('v3_05_mice', { h: 1300, x: 540, y: 860, enter: 'none' })], z0: 1.0, z1: 1.12 },
  { s: 11.04, bg: 'paper', fx: 'flash', formulas: false, els: [I('v3_17_molecules', { h: 560, drot: 10 })] },
  { s: 11.90, bg: 'black', fx: 'glitch', els: [I('v2_10_dna', { h: 1150, drot: 8, pulse: true })] },
  { s: 13.87, bg: 'green', fx: 'whip', els: [I('v3_06_stickleback', { h: 480, enter: 'fly', from: 900, mx: -80 })] },
  { s: 15.07, bg: 'black', fx: 'cut', els: [I('v3_06_stickleback', { h: 480, enter: 'none', x: 560, mx: -120 }), { type: 'smoke', k0: 0.1, k1: 0.25 }] },
  { s: 16.09, bg: 'paper', fx: 'flash', formulas: false, els: [I('v3_18_wolves', { h: 640 })] },
  { s: 16.95, bg: 'black', fx: 'glitch', els: [I('05_suit_man', { h: 1150, enter: 'none' }), ST('SAPIENS?', { at: 0.15, y: 1130 })], shake: [0.15], nosplit: true },
  // ---------------- Wedekind 1995
  ...SLOT(17.86, '1995', 'MCMXCV'),
  { s: 19.69, bg: 'paper', fx: 'flash', formulas: false, els: [I('v3_11_bern', { h: 620, enter: 'focus', frame: true, rot: -2 })], nosplit: true },
  { s: 20.54, bg: 'black', fx: 'blur', els: [I('v2_10_dna', { h: 1150, alpha: 0.2, enter: 'none' }), T('КЛАУС\nВЕДЕКИНД', { size: 130, bands: true, sub: 'БИОЛОГ · БЕРНСКИЙ УНИВЕРСИТЕТ', subSize: 38 })], nosplit: true },
  { s: 21.78, bg: 'black', fx: 'cut', els: [I('v3_07_man_sleeping', { h: 620, enter: 'focus', frame: true })] },
  { s: 23.10, bg: 'green', fx: 'gflash', els: [I('v3_08_tshirt', { h: 860 })] },
  { s: 23.92, bg: 'black', fx: 'glitch', els: [I('v3_09_perfume', { h: 860, enter: 'none' }), ST('НЕТ', { at: 0.2, size: 140 })], shake: [0.2], nosplit: true },
  { s: 24.93, bg: 'paper', fx: 'flash', formulas: false, els: [I('v3_10_lab_sniff', { h: 620, enter: 'focus', frame: true, rot: 2 })] },
  { s: 25.74, bg: 'black', fx: 'zoom', els: [I('v3_10_lab_sniff', { h: 1500, x: 160, y: 760, enter: 'none' })], nosplit: true },
  { s: 26.73, bg: 'green', fx: 'cut', els: [I('v3_02_woman_scent', { h: 1000, enter: 'none' })] },
  { s: 27.91, bg: 'black', fx: 'whip', els: [{ type: 'crowd', rows: 1, cols: 5, y: 1180, h: 660, gap: 205, hl: [{ idx: 2, at: 0.75 }] }, { type: 'vf', x: 540, y: 850, w: 240, h: 700, at: 0.7, glow: true }], nosplit: true },
  { s: 29.23, bg: 'black', fx: 'glitch', els: [I('v2_10_dna', { h: 1150, drot: -8, pulse: true })] },
  { s: 30.31, bg: 'paper', fx: 'flash', formulas: false, els: [{ type: 'rays', y: 820 }, LOVERS({ enter: 'focus' })] },
  { s: 31.45, bg: 'green', fx: 'cut', els: [LOVERS({ h: 1500, y: 1050 })], z0: 1.0, z1: 1.08 },
  // ---------------- tense -> drop on НОС
  { s: 33.29, bg: 'black', fx: 'blur', formulas: false, els: [I('01_head', { h: 1050, enter: 'none' })], z0: 1.0, z1: 1.18, nosplit: true },
  { s: 34.69, bg: 'green', fx: 'flash', els: [{ type: 'rays', y: 820 }, I('v3_03_nose', { h: 900 }), ST('NASUS', { at: 0.1, y: 1180 })], shake: [0.1] },
  { s: 35.35, bg: 'black', fx: 'whip', els: [I('v3_17_molecules', { h: 560, drot: -12, pulse: true })] },
  { s: 36.40, bg: 'black', fx: 'zoom', els: [I('v3_03_nose', { h: 2200, x: 980, y: 1260, enter: 'none' })], nosplit: true },
  { s: 37.62, bg: 'green', fx: 'glitch', els: [T('?', { size: 520, y: 700, enter: 'slam', hlLine: 0 })], nosplit: true, z0: 1, z1: 1.15 },
  { s: 38.33, bg: 'black', fx: 'cut', els: [I('v2_10_dna', { h: 1150, pulse: true })] },
  { s: 39.64, bg: 'paper', fx: 'flash', formulas: false, els: [{ type: 'rays', y: 820 }, I('v3_12_baby', { h: 880 })] },
  { s: 40.72, bg: 'black', fx: 'glitch', els: [I('v3_13_antibodies', { h: 820, drot: 8 }), ST('IMMUNITAS', { at: 0.4, y: 1180 })], shake: [0.4] },
  // ---------------- dark: similar genes
  { s: 41.91, bg: 'black', fx: 'blur', formulas: false, els: [I('05_suit_man', { h: 900, x: 330, y: 860, enter: 'none' }), I('05_suit_man', { h: 900, x: 750, y: 860, enter: 'pop', at: 0.3 }), T('=', { size: 260, y: 760, serif: false, hlLine: 0, at: 0.5 })], nosplit: true },
  { s: 43.08, bg: 'black', fx: 'cut', formulas: false, els: [I('v3_14_glance', { h: 1000, enter: 'focus' })] },
  { s: 45.46, bg: 'black', fx: 'glitch', els: [I('v3_14_glance', { h: 1900, x: 380, y: 1260, enter: 'none' }), { type: 'vf', x: 640, y: 560, w: 420, h: 420, at: 0.1, glow: true }], nosplit: true },
  { s: 46.79, bg: 'black', fx: 'cut', formulas: false, els: [I('v3_04_pill', { h: 560, enter: 'focus' })], z0: 1.0, z1: 1.12, nosplit: true },
  // ---------------- drop on ТАБЛЕТКА
  { s: 47.49, bg: 'green', fx: 'flash', els: [I('v3_04_pill', { h: 560, enter: 'none' }), ST('PILULA', { at: 0.1, y: 1150 })], shake: [0.1], nosplit: true },
  { s: 48.19, bg: 'paper', fx: 'flash', formulas: false, els: [I('v3_10_lab_sniff', { h: 620, enter: 'focus', frame: true, rot: -2 })] },
  { s: 49.65, bg: 'black', fx: 'whip', els: [I('v3_02_woman_scent', { h: 1000 })] },
  { s: 50.27, bg: 'green', fx: 'cut', els: [I('v3_04_pill', { h: 1100, x: 680, y: 760, enter: 'none' })], nosplit: true },
  { s: 51.07, bg: 'black', fx: 'glitch', els: [{ type: 'bars', y: 700, rows: [{ label: 'НЕПОХОЖИЕ ГЕНЫ', v0: 80, v1: 30, at: 0.1, dur: 0.9, nonum: true }, { label: 'ПОХОЖИЕ ГЕНЫ', v0: 30, v1: 80, at: 0.1, dur: 0.9, nonum: true, dim: true }] }, T('НАОБОРОТ', { size: 90, y: 1130, serif: false, hlLine: 0, at: 0.5 })], nosplit: true },
  { s: 52.72, bg: 'paper', fx: 'flash', formulas: false, els: [I('v3_09_perfume', { h: 820 })] },
  // ---------------- outro
  { s: 53.28, bg: 'green', fx: 'whip', els: [I('v3_16_flasks', { h: 880 })] },
  { s: 55.02, bg: 'green', fx: 'flash', els: [{ type: 'rays', y: 820 }, I('v3_16_flasks', { h: 880, enter: 'none', pulse: true }), ST('CHEMIA', { at: 0.1, y: 1150 })], shake: [0.1], nosplit: true },
  { s: 55.82, bg: 'black', fx: 'glitch', els: [I('v3_03_nose', { h: 900, enter: 'none' })], nosplit: true },
  { s: 56.74, bg: 'black', fx: 'cut', els: [LOVERS()], z0: 1.0, z1: 1.08, nosplit: true },
  { s: 57.55, bg: 'paper', fx: 'flash', formulas: false, els: [I('v3_02_woman_scent', { h: 1000, enter: 'focus' })], nosplit: true },
  { s: 58.55, bg: 'green', fx: 'cut', els: [I('v3_15_heart', { h: 900, pulse: true })], nosplit: true },
  { s: 59.93, bg: 'black', fx: 'glitch', els: [LOVERS({ alpha: 0.35 }), T('ОДНИМ\nСЛОВОМ', { size: 140, hlLine: 1, bands: true, y: 740, at: 0.1, sub: 'В КОММЕНТАРИЯХ ↓', subSize: 46 })], shake: [0.1], nosplit: true },
];

const SPLITTABLE = new Set(['img', 'stamp', 'vf', 'rays']);
function finalize(raw) {
  const snap = s => (s === 0 ? 0 : Math.round(s / GRID) * GRID);
  const out = [];
  raw.forEach((sh, i) => {
    const nx = i + 1 < raw.length ? raw[i + 1].s : END;
    out.push(sh);
    const d = nx - sh.s;
    if (d > 1.3 && !sh.nosplit && sh.els.every(e => SPLITTABLE.has(e.type))) {
      const z1 = sh.z1 ?? 1.06;
      const flip = { black: 'green', green: 'black', paper: 'black' }[sh.bg || 'black'];
      out.push({
        ...sh, s: sh.s + d * 0.55, fx: 'cut', bg: flip, formulas: true, z0: z1 * 1.12, z1: z1 * 1.18,
        shake: [], flashAt: [], glitchAt: [], split: true,
        els: sh.els.map(e => ({ ...e, enter: 'none', at: 0, static: true, tint: undefined, out: undefined })),
      });
    }
  });
  let prev = -1;
  for (const sh of out) {
    let s = snap(sh.s);
    if (s <= prev) s = prev + GRID;
    sh.s = +s.toFixed(3); prev = sh.s;
  }
  return out;
}
const SHOTS_DEF = finalize(RAW);
const PULSE_DEF = [[0, 16.32], [17.76, 33.12], [34.56, 41.76], [47.52, END]];
const TITLE_DEF = { until: 2.6, y: 300, lines: [['ВЫ ВЛЮБЛЯЕТЕСЬ', false, 86], ['НОСОМ', true, 160]] };
