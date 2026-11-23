// Video 04 — «Ваша память — подделка». Times are on the cut voice timeline;
// finalize() snaps every cut to the 8th-note grid of the 125 BPM score and
// auto-splits long image shots with a punch-in cut on the beat.
const BEAT_S = 0.48, GRID = BEAT_S / 2, END = 75.4;
const I = (src, o = {}) => ({ type: 'img', src, x: 540, y: 820, h: 900, enter: 'pop', ...o });
const ST = (str, o = {}) => ({ type: 'stamp', str, at: 0.15, size: 96, ...o });
const T = (str, o = {}) => ({ type: 'text', str, serif: true, size: 120, y: 760, enter: 'blur', ...o });
const HEAD = (o = {}) => I('01_head', { h: 1000, enter: 'none', ...o });
const BUST = (o = {}) => I('v4_01_bust_photos', { h: 1000, enter: 'none', ...o });
const WOMAN = (o = {}) => I('v4_02_bust_eyes_closed', { h: 1000, enter: 'none', ...o });

const RAW = [
  // ---------------- hook (title overlay 2.6 s)
  { s: 0.00, bg: 'black', els: [BUST()], z0: 1.0, z1: 1.05 },
  { s: 0.50, bg: 'green', fx: 'gflash', els: [WOMAN()] },
  { s: 0.90, bg: 'black', fx: 'glitch', els: [I('v4_15_old_photos', { h: 560 })] },
  { s: 1.66, bg: 'green', fx: 'flash', els: [I('v4_19_broken_mirror', { h: 1050 }), ST('FALSUM', { at: 0.1, y: 1150 })], shake: [0.1], nosplit: true },
  { s: 2.62, bg: 'black', fx: 'whip', els: [BUST({ h: 1900, x: 760, y: 860 })], z0: 1.0, z1: 1.08 },
  { s: 3.48, bg: 'black', fx: 'cut', els: [HEAD(), { type: 'vf', x: 540, y: 820, w: 640, h: 1000, at: 0.05, glow: true }], nosplit: true },
  { s: 4.00, bg: 'green', fx: 'glitch', els: [T('?', { size: 520, y: 700, enter: 'slam', hlLine: 0 })], nosplit: true, z0: 1, z1: 1.15 },
  // ---------------- Challenger
  { s: 4.68, bg: 'black', fx: 'glitch', els: [{ type: 'year', val: '1986', roman: 'MCMLXXXVI', roll: 0.5 }], nosplit: true },
  { s: 6.02, bg: 'paper', fx: 'flash', formulas: false, els: [I('v4_03_shuttle', { h: 620, enter: 'focus', frame: true, rot: -2 })], glitchAt: [0.45], nosplit: true },
  { s: 6.60, bg: 'black', fx: 'cut', els: [I('v4_05_students', { h: 620, enter: 'focus', frame: true, rot: 2 })] },
  { s: 8.00, bg: 'green', fx: 'zoom', els: [I('v4_05_students', { h: 1500, x: 700, y: 640, enter: 'none' })], nosplit: true },
  { s: 9.02, bg: 'black', fx: 'glitch', els: [{ type: 'num', from: 0, to: 2.5, fmt: v => v.toFixed(1).replace('.', ','), y: 760, size: 300, dur: 0.8, sub: 'ГОДА СПУСТЯ' }], nosplit: true },
  { s: 10.40, bg: 'paper', fx: 'flash', formulas: false, els: [I('v4_24_photocopies', { h: 330 })], nosplit: true },
  { s: 11.64, bg: 'black', fx: 'cut', els: [I('v4_06_handwriting', { h: 980 })] },
  { s: 12.84, bg: 'green', fx: 'zoom', els: [I('v4_06_handwriting', { h: 2000, y: 1000, enter: 'none' })], nosplit: true },
  { s: 13.39, bg: 'black', fx: 'blur', els: [HEAD()], nosplit: true },
  { s: 14.11, bg: 'paper', fx: 'flash', formulas: false, els: [I('v4_06_handwriting', { h: 980, enter: 'none' }), { type: 'vf', x: 540, y: 820, w: 660, h: 1000, at: 0.1 }], nosplit: true },
  { s: 14.89, bg: 'black', fx: 'glitch', els: [I('v4_19_broken_mirror', { h: 1050, enter: 'none' }), ST('НЕ ТАК', { at: 0.55, size: 120 })], shake: [0.55], nosplit: true },
  // ---------------- mechanism
  { s: 15.90, bg: 'green', fx: 'whip', els: [I('v4_21_brain_fragments', { h: 640 })], nosplit: true },
  { s: 16.52, bg: 'black', fx: 'cut', els: [I('v4_20_film_reel', { h: 900 })], nosplit: true },
  { s: 17.42, bg: 'green', fx: 'flash', els: [I('v4_20_film_reel', { h: 900, enter: 'none' }), ST('НЕТ', { at: 0.1, size: 150 })], shake: [0.1], nosplit: true },
  { s: 17.98, bg: 'black', fx: 'glitch', els: [I('v4_21_brain_fragments', { h: 660, pulse: true })] },
  { s: 19.07, bg: 'black', fx: 'cut', els: [T('«ТОТ ДЕНЬ»', { size: 120, bands: true, sub: 'ФАЙЛ НЕ НАЙДЕН', subSize: 44 })], glitchAt: [0.3], nosplit: true },
  { s: 19.53, bg: 'green', fx: 'gflash', els: [I('v4_21_brain_fragments', { h: 660, enter: 'none' })], z0: 1.0, z1: 1.15 },
  { s: 20.42, bg: 'black', fx: 'whip', els: [I('v3_03_nose', { h: 880 })] },
  { s: 21.50, bg: 'paper', fx: 'flash', formulas: false, els: [I('v4_22_ear', { h: 880 })] },
  { s: 22.58, bg: 'black', fx: 'glitch', els: [I('14_eye', { h: 520 })], shake: [0.05] },
  { s: 23.55, bg: 'black', fx: 'blur', els: [WOMAN({ enter: 'focus' })] },
  { s: 24.58, bg: 'green', fx: 'cut', els: [I('v4_20_film_reel', { h: 900, enter: 'none' }), ST('НЕТ', { at: 0.6, size: 150 })], shake: [0.6], nosplit: true },
  { s: 25.94, bg: 'black', fx: 'whip', els: [I('v4_23_puzzle_hands', { h: 920 })] },
  { s: 27.45, bg: 'green', fx: 'cut', els: [I('v4_21_brain_fragments', { h: 660, enter: 'none' })], nosplit: true },
  { s: 28.03, bg: 'black', fx: 'zoom', els: [I('v4_23_puzzle_hands', { h: 1900, x: 380, y: 900, enter: 'none' }), { type: 'circle', x: 470, y: 760, rx: 120, ry: 110, at: 0.3 }] },
  { s: 29.31, bg: 'paper', fx: 'flash', formulas: false, els: [{ type: 'rays', y: 820 }, HEAD({ enter: 'focus' })] },
  { s: 30.25, bg: 'green', fx: 'cut', els: [WOMAN({ pulse: true })], nosplit: true },
  { s: 31.48, bg: 'black', fx: 'glitch', els: [I('v4_23_puzzle_hands', { h: 920, enter: 'none' })] },
  { s: 32.92, bg: 'paper', fx: 'flash', formulas: false, els: [I('v4_15_old_photos', { h: 560 })], nosplit: true },
  { s: 33.83, bg: 'black', fx: 'cut', els: [I('v4_24_photocopies', { h: 330 })] },
  { s: 34.91, bg: 'green', fx: 'zoom', els: [I('v4_24_photocopies', { h: 760, x: -230, y: 820, enter: 'none' }), ST('COPIA', { at: 0.2, y: 1150 })], shake: [0.2], nosplit: true },
  { s: 35.76, bg: 'black', fx: 'whip', els: [I('v4_19_broken_mirror', { h: 1050 })] },
  { s: 37.12, bg: 'black', fx: 'glitch', els: [{ type: 'bars', y: 760, rows: [{ label: 'ТОЧНОСТЬ', v0: 100, v1: 20, at: 0.1, dur: 0.9, nonum: true }] }], nosplit: true },
  // ---------------- why
  { s: 38.22, bg: 'green', fx: 'glitch', els: [T('ЗАЧЕМ?', { size: 190, y: 760, enter: 'slam', hlLine: 0 })], nosplit: true, z0: 1, z1: 1.12 },
  { s: 39.31, bg: 'paper', fx: 'flash', formulas: false, els: [I('v4_15_old_photos', { h: 560 })], nosplit: true },
  { s: 40.66, bg: 'green', fx: 'flash', els: [{ type: 'rays', y: 820 }, HEAD({ enter: 'focus' })], nosplit: true },
  { s: 41.33, bg: 'paper', fx: 'flash', formulas: false, els: [I('v4_25_river_lion', { h: 620, enter: 'focus', frame: true, rot: -2 })] },
  { s: 42.38, bg: 'black', fx: 'zoom', els: [I('v4_25_river_lion', { h: 1500, x: -110, y: 1100, enter: 'none' })], shake: [0.5], nosplit: true },
  { s: 43.47, bg: 'paper', fx: 'flash', formulas: false, els: [I('v4_26_river_empty', { h: 620, enter: 'focus', frame: true, rot: 2 })] },
  { s: 44.42, bg: 'green', fx: 'cut', els: [I('v4_26_river_empty', { h: 1400, x: 20, y: 640, enter: 'none' })], nosplit: true },
  { s: 45.40, bg: 'black', fx: 'glitch', els: [I('v4_27_stone_tablet', { h: 900 })] },
  { s: 47.53, bg: 'black', fx: 'cut', els: [I('14_eye', { h: 540, enter: 'none' })], glitchAt: [0.5], shake: [0.5], nosplit: true },
  { s: 48.58, bg: 'black', fx: 'whip', els: [BUST()], nosplit: true },
  { s: 49.44, bg: 'green', fx: 'cut', els: [BUST(), ST('MENDAX', { at: 0.25, y: 1150 })], shake: [0.25], nosplit: true },
  // ---------------- STOP: total silence, voice only
  { s: 50.40, bg: 'black', fx: 'cut', formulas: false, quiet: true, els: [HEAD({ alpha: 0.9 })], z0: 1.0, z1: 1.14, nosplit: true },
  // ---------------- DROP
  { s: 52.08, bg: 'green', fx: 'flash', els: [{ type: 'rays', y: 820 }, I('v4_28_pencil', { h: 560 })], shake: [0.02], nosplit: true },
  { s: 53.21, bg: 'green', fx: 'flash', els: [{ type: 'rays', y: 820 }, I('v4_17_statue_writer', { h: 900 }), ST('RESCRIBE', { at: 0.1, y: 1160 })], shake: [0.1], nosplit: true },
  { s: 53.97, bg: 'paper', fx: 'flash', formulas: false, els: [I('v4_29_safe_room', { h: 620, enter: 'focus', frame: true, rot: -2 })] },
  { s: 55.03, bg: 'black', fx: 'zoom', els: [I('v4_29_safe_room', { h: 1400, x: 820, y: 860, enter: 'none' })], nosplit: true },
  { s: 56.14, bg: 'black', fx: 'gflash', els: [{ type: 'bars', y: 760, rows: [{ label: 'СТРАХ', v0: 100, v1: 35, at: 0.2, dur: 1.0, nonum: true }] }], nosplit: true },
  { s: 57.74, bg: 'black', fx: 'whip', els: [I('v4_12_tarantula', { h: 560, enter: 'fly', from: 800 })] },
  { s: 58.94, bg: 'green', fx: 'glitch', els: [I('v4_12_tarantula', { h: 1300, enter: 'none' })], shake: [0.05], nosplit: true },
  { s: 60.13, bg: 'black', fx: 'cut', els: [I('14_eye', { h: 540 })], nosplit: true },
  { s: 61.21, bg: 'black', fx: 'glitch', els: [I('v4_20_film_reel', { h: 900, enter: 'none' }), ST('STOP', { at: 0.7, size: 140 })], shake: [0.7], nosplit: true },
  { s: 63.07, bg: 'black', fx: 'flash', els: [{ type: 'num', from: 1, to: 1, y: 760, size: 360, dur: 0.1, sub: 'СЕАНС' }], nosplit: true },
  { s: 63.89, bg: 'black', fx: 'whip', els: [I('v4_13_hand_spider', { h: 900, enter: 'focus' })], nosplit: true },
  { s: 65.02, bg: 'green', fx: 'flash', els: [I('v4_13_hand_spider', { h: 900, enter: 'none' }), ST('VICTOR', { at: 0.1, y: 1150 })], shake: [0.1], nosplit: true },
  // ---------------- finale
  { s: 66.08, bg: 'black', fx: 'cut', els: [I('v4_27_stone_tablet', { h: 900 })], nosplit: true },
  { s: 67.16, bg: 'black', fx: 'glitch', els: [I('v4_27_stone_tablet', { h: 900, enter: 'none' }), ST('НЕТ', { at: 0.05, size: 150 })], shake: [0.05], nosplit: true },
  { s: 67.70, bg: 'paper', fx: 'flash', formulas: false, els: [{ type: 'rays', y: 820 }, I('v4_28_pencil', { h: 560 })] },
  { s: 68.96, bg: 'black', fx: 'cut', els: [I('v4_15_old_photos', { h: 560 })] },
  { s: 70.06, bg: 'green', fx: 'zoom', els: [I('v4_15_old_photos', { h: 1200, y: 900, enter: 'none' })], nosplit: true },
  { s: 71.22, bg: 'black', fx: 'blur', els: [WOMAN({ enter: 'focus' })], nosplit: true },
  { s: 72.01, bg: 'black', fx: 'glitch', els: [BUST(), ST('LIBER', { at: 0.5, y: 1150 })], shake: [0.5], nosplit: true },
  { s: 73.22, bg: 'paper', fx: 'flash', formulas: false, els: [{ type: 'rays', y: 820 }, I('v4_17_statue_writer', { h: 900, enter: 'focus' })], nosplit: true },
  { s: 74.50, bg: 'green', fx: 'flash', els: [{ type: 'rays', y: 820 }, I('v4_17_statue_writer', { h: 900, enter: 'none' }), ST('AUCTOR', { at: 0.1, y: 1160 })], shake: [0.1], nosplit: true, z0: 1.0, z1: 1.06 },
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
const PULSE_DEF = [[0, 48.48], [52.08, END]];
const TITLE_DEF = { until: 2.6, y: 300, lines: [['ВАША ПАМЯТЬ', false, 92], ['ПОДДЕЛКА', true, 160]] };
