// Video 02 — «Вы — домашнее животное». Times are on the cut voice timeline;
// finalize() snaps every cut to the 8th-note grid of the 125 BPM score and
// auto-splits long image shots with a punch-in cut on the beat.
const BEAT_S = 0.48, GRID = BEAT_S / 2, END = 79.0;
const I = (src, o = {}) => ({ type: 'img', src, x: 540, y: 820, h: 900, enter: 'pop', ...o });
const ST = (str, o = {}) => ({ type: 'stamp', str, at: 0.15, size: 96, ...o });
const T = (str, o = {}) => ({ type: 'text', str, serif: true, size: 120, y: 760, enter: 'blur', ...o });
const COLLAR = (o = {}) => I('v2_01_man_collar', { h: 1050, y: 800, enter: 'none', ...o });

const RAW = [
  // ---------------- hook 0–6
  { s: 0.00, bg: 'black', els: [COLLAR()], z0: 1.0, z1: 1.04 },
  { s: 0.36, bg: 'green', fx: 'gflash', els: [I('05_suit_man', { h: 1100, enter: 'none' })] },
  { s: 0.66, bg: 'black', fx: 'glitch', els: [I('v2_03_dog', { h: 860 })] },
  { s: 1.18, bg: 'green', fx: 'flash', els: [COLLAR(), ST('DOMESTICUS', { at: 0.12, y: 1130 })], shake: [0.12], z0: 1.06, z1: 1.12 },
  { s: 2.16, bg: 'black', fx: 'glitch', els: [I('v2_02_wolf', { h: 560, enter: 'fly', from: -700 })] },
  { s: 2.82, bg: 'black', fx: 'cut', els: [I('v2_02_wolf', { h: 560, enter: 'none' }), { type: 'vf', x: 540, y: 820, w: 900, h: 600, at: 0.05, glow: true }], z0: 1.1, z1: 1.16 },
  { s: 3.47, bg: 'paper', fx: 'flash', formulas: false, els: [{ type: 'rays', y: 820 }, I('v2_17_handshake', { h: 560 })] },
  { s: 4.17, bg: 'green', fx: 'cut', els: [I('05_suit_man', { h: 1100, enter: 'none' }), { type: 'vf', x: 540, y: 820, w: 420, h: 1150, at: 0.05 }] },
  { s: 5.00, bg: 'black', fx: 'glitch', els: [COLLAR({ alpha: 0.6 }), ST('БРЕД?', { at: 0.4, size: 130 })], shake: [0.4] },
  { s: 5.99, bg: 'black', fx: 'whip', els: [I('v2_05_caveman', { h: 1150, enter: 'fly', from: 700 })] },
  // ---------------- ancestors
  { s: 7.75, bg: 'black', fx: 'glitch', els: [{ type: 'year', val: '40 000', sub: 'ЛЕТ НАЗАД', size: 190, roll: 0.55 }], nosplit: true },
  { s: 8.87, bg: 'green', fx: 'gflash', els: [I('v2_05_caveman', { h: 1150, enter: 'none' }), ST('FEROX', { at: 0.6, y: 1150 })], shake: [0.6] },
  { s: 10.09, bg: 'black', fx: 'cut', els: [I('05_suit_man', { h: 950, enter: 'none', alpha: 0.85 })], z0: 1, z1: 0.94 },
  { s: 10.61, bg: 'black', fx: 'glitch', els: [I('v2_08_bone', { h: 1050, pulse: true })] },
  { s: 11.57, bg: 'green', fx: 'cut', els: [I('v2_04_chimp', { h: 1050, enter: 'drop' })], shake: [0.3] },
  { s: 12.55, bg: 'black', fx: 'whip', els: [I('v2_06_skull_ancient', { h: 620, x: 470, z0: 1.2, z1: 1.35 })] },
  { s: 13.89, bg: 'paper', fx: 'flash', formulas: false, els: [I('v2_06_skull_ancient', { h: 620, enter: 'none' }), { type: 'circle', x: 750, y: 690, rx: 140, ry: 80, at: 0.3 }] },
  { s: 14.97, bg: 'black', fx: 'zoom', els: [I('v2_05_caveman', { h: 2700, y: 1950, enter: 'none' })], z0: 1, z1: 1.08 },
  { s: 15.89, bg: 'green', fx: 'glitch', els: [I('v2_06_skull_ancient', { h: 620, enter: 'none' })] },
  { s: 17.00, bg: 'black', fx: 'cut', els: [T('C19H28O2', { size: 150, serif: false, hlLine: 0, bands: true, sub: 'ТЕСТОСТЕРОН', subSize: 44 })], nosplit: true },
  { s: 17.87, bg: 'black', fx: 'glitch', els: [I('v2_02_wolf', { h: 1400, x: 820, y: 860, enter: 'none' })], shake: [0], flashAt: [0] },
  { s: 18.47, bg: 'black', fx: 'cut', els: [I('v2_06_skull_ancient', { h: 620, enter: 'focus', tint: 0.55 })], glitchAt: [0.55] },
  // ---------------- smarter?
  { s: 19.61, bg: 'black', fx: 'blur', els: [I('v2_09_thinker_caveman', { h: 1080, enter: 'focus' })] },
  { s: 20.47, bg: 'green', fx: 'cut', els: [I('v2_09_thinker_caveman', { h: 1080, enter: 'none' }), ST('GENIUS?', { at: 0.28, y: 1130 })], z0: 1.06, z1: 1.12 },
  { s: 21.53, bg: 'black', fx: 'glitch', els: [I('11_brain', { h: 720, pulse: true })] },
  { s: 22.43, bg: 'black', fx: 'cut', els: [I('11_brain', { h: 520, x: 300, y: 800, enter: 'none' }), I('11_brain', { h: 470, x: 800, y: 820, enter: 'pop', at: 0.1, alpha: 0.75 })], nosplit: true },
  { s: 23.09, bg: 'green', fx: 'gflash', els: [{ type: 'num', from: 0, to: 10, suffix: '%', fmt: v => '+' + Math.round(v), y: 800, size: 340, dur: 0.6 }], nosplit: true },
  { s: 24.68, bg: 'black', fx: 'whip', els: [I('v2_10_dna', { h: 1150, drot: 8, pulse: true })] },
  { s: 26.20, bg: 'black', fx: 'blur', els: [I('v2_10_dna', { h: 1150, alpha: 0.22, enter: 'none' }), T('ДЖЕРАЛЬД\nКРАБТРИ', { size: 130, bands: true, sub: 'ГЕНЕТИК · СТЭНФОРД · 2012', subSize: 40 })], nosplit: true },
  { s: 27.16, bg: 'black', fx: 'cut', els: [{ type: 'peak' }], nosplit: true },
  { s: 28.65, bg: 'green', fx: 'glitch', els: [{ type: 'peak', full: true, you: 0.15 }], nosplit: true, z0: 1.04, z1: 1.1 },
  { s: 29.48, bg: 'black', fx: 'cut', els: [T('?', { size: 520, y: 700, enter: 'slam', hlLine: 0 })], nosplit: true, z0: 1, z1: 1.15 },
  // ---------------- foxes
  { s: 30.77, bg: 'green', fx: 'flash', els: [I('v2_11_fox_wild', { h: 600, enter: 'fly', from: -700 }), ST('VULPES', { at: 0.5, y: 1130 })], shake: [0.5] },
  { s: 31.89, bg: 'paper', formulas: false, els: [{ type: 'slot', seq: '1959'.split(''), dur: 0.16, bgs: ['paper', 'black', 'green', 'black'] }], nosplit: true, z0: 1, z1: 1 },
  { s: 32.53, bg: 'black', fx: 'glitch', els: [{ type: 'year', val: '1959', roman: 'MCMLIX', roll: 0.5 }], nosplit: true },
  { s: 33.78, bg: 'paper', fx: 'flash', formulas: false, els: [I('v2_14_fox_farm', { h: 700, enter: 'focus', frame: true, rot: -2 })] },
  { s: 34.72, bg: 'black', fx: 'cut', els: [I('v2_14_fox_farm', { h: 700, enter: 'none', frame: true, y: 720 }), T('ДМИТРИЙ БЕЛЯЕВ', { size: 64, y: 1150, serif: false, sub: 'ГЕНЕТИК · 1917–1985', subSize: 36, enter: 'blur', at: 0.2 })], nosplit: true },
  { s: 35.92, bg: 'paper', fx: 'flash', formulas: false, els: [I('v2_13_fox_hand', { h: 620 })] },
  { s: 36.96, bg: 'green', fx: 'cut', els: [I('v2_13_fox_hand', { h: 900, x: 600, enter: 'none' })], z0: 1.05, z1: 1.15 },
  { s: 38.62, bg: 'black', fx: 'glitch', els: [{ type: 'num', from: 1, to: 10, y: 760, size: 300, dur: 1.1, sub: 'ПОКОЛЕНИЙ' }], nosplit: true },
  { s: 40.01, bg: 'green', fx: 'gflash', els: [I('v2_12_fox_tame', { h: 1000, enter: 'focus' })] },
  { s: 40.84, bg: 'black', fx: 'zoom', els: [I('v2_12_fox_tame', { h: 2000, x: 420, y: 1350, enter: 'none' })] },
  { s: 41.74, bg: 'paper', fx: 'flash', formulas: false, els: [I('v2_12_fox_tame', { h: 2300, x: 300, y: 1550, enter: 'none' })] },
  { s: 42.60, bg: 'black', fx: 'glitch', els: [I('v2_03_dog', { h: 950 }), ST('CANIS', { at: 0.25, y: 1150 })], shake: [0.25] },
  { s: 43.50, bg: 'green', fx: 'cut', els: [COLLAR()], z0: 1.0, z1: 1.1 },
  // ---------------- self-domestication
  { s: 45.14, bg: 'black', fx: 'blur', els: [I('v2_15_tribe_expel', { h: 700, enter: 'focus', frame: true })] },
  { s: 46.30, bg: 'black', fx: 'cut', els: [I('v2_15_tribe_expel', { h: 1750, x: 300, y: 860, enter: 'none' }), ST('EXSUL', { at: 0.9, y: 1150 })], z0: 1, z1: 1.08 },
  { s: 48.16, bg: 'paper', fx: 'flash', formulas: false, els: [{ type: 'rays', y: 820 }, I('23_tribe', { h: 520, enter: 'focus', frame: true, rot: 2 })] },
  { s: 49.15, bg: 'black', fx: 'glitch', els: [{ type: 'bars', y: 760, rows: [{ label: 'ТЕСТОСТЕРОН', v0: 100, v1: 55, at: 0.2, dur: 0.8, nonum: true }] }], nosplit: true },
  { s: 50.45, bg: 'green', fx: 'cut', els: [I('v2_06_skull_ancient', { h: 650, enter: 'none', out: 0.85 }), I('v2_07_skull_modern', { h: 650, enter: 'fade', at: 0.85 })], nosplit: true },
  { s: 52.10, bg: 'black', fx: 'flash', els: [COLLAR({ enter: 'focus' })] },
  { s: 53.43, bg: 'paper', fx: 'cut', formulas: false, els: [I('v2_08_bone', { h: 950, alpha: 0.55, drot: -6 })] },
  { s: 54.57, bg: 'black', fx: 'glitch', els: [I('11_brain', { h: 720, enter: 'none', z0: 1.1, z1: 0.72 })], nosplit: true },
  // ---------------- turn
  { s: 55.41, bg: 'black', fx: 'cut', els: [I('v2_05_caveman', { h: 1150, x: 330, y: 840, enter: 'none' }), I('05_suit_man', { h: 860, x: 790, y: 900, enter: 'pop', at: 0.15 })] },
  { s: 56.50, bg: 'paper', fx: 'glitch', formulas: false, els: [I('v2_09_thinker_caveman', { h: 1050, enter: 'none' })] },
  { s: 57.57, bg: 'black', fx: 'blur', els: [I('v2_16_earth', { h: 760, enter: 'focus', drot: 6 })], nosplit: true },
  { s: 58.19, bg: 'green', fx: 'flash', els: [{ type: 'rays', y: 820 }, I('v2_16_earth', { h: 760, enter: 'none' }), ST('VICTOR', { at: 0.1, y: 1150 })], shake: [0.1], nosplit: true },
  { s: 59.12, bg: 'black', fx: 'cut', formulas: false, els: [COLLAR({ alpha: 0.9 }), { type: 'vf', x: 540, y: 800, w: 760, h: 1080, at: 0.2, glow: true }], z0: 1.0, z1: 1.12, nosplit: true },
  { s: 60.40, bg: 'black', fx: 'glitch', els: [I('v2_05_caveman', { h: 1100, enter: 'none' }), ST('НЕТ', { at: 0.1, size: 150 })], shake: [0.1], nosplit: true },
  { s: 60.92, bg: 'black', fx: 'glitch', els: [I('11_brain', { h: 680, enter: 'none' }), ST('НЕТ', { at: 0.1, size: 150 })], shake: [0.1], nosplit: true },
  // ---------------- drop: friendliness
  { s: 61.81, bg: 'green', fx: 'flash', els: [{ type: 'rays', y: 820 }, I('v2_17_handshake', { h: 600 }), ST('AMICITIA', { at: 0.12, y: 1130 })], shake: [0.12] },
  { s: 63.08, bg: 'black', fx: 'whip', els: [I('v2_18_caveman_stone', { h: 1000 })] },
  { s: 64.74, bg: 'paper', fx: 'flash', formulas: false, els: [I('v2_19_airplane', { h: 360, enter: 'fly', from: -900 }), ST('НЕТ', { at: 0.6, size: 120, y: 1100 })] },
  { s: 65.93, bg: 'black', fx: 'cut', els: [I('v2_20_crowd_builders', { h: 760, enter: 'focus', frame: true })] },
  { s: 67.07, bg: 'green', fx: 'glitch', els: [I('v2_17_handshake', { h: 600, enter: 'none', pulse: true })] },
  { s: 68.56, bg: 'black', fx: 'whip', els: [I('v2_19_airplane', { h: 380, x: 640, mx: -240, enter: 'fly', from: 800 })], nosplit: true },
  // ---------------- outro
  { s: 69.25, bg: 'black', fx: 'cut', els: [COLLAR()] },
  { s: 70.61, bg: 'paper', fx: 'flash', formulas: false, els: [I('v2_13_fox_hand', { h: 620 })] },
  { s: 71.65, bg: 'black', fx: 'glitch', els: [I('v2_02_wolf', { h: 560, enter: 'none' })], shake: [0.1] },
  { s: 72.49, bg: 'black', fx: 'blur', els: [I('01_head', { h: 1050, enter: 'focus' })] },
  { s: 73.20, bg: 'black', fx: 'glitch', els: [I('v2_05_caveman', { h: 1100, enter: 'none' }), ST('НЕТ', { at: 0.5, size: 150 })], shake: [0.5] },
  { s: 74.34, bg: 'green', fx: 'flash', els: [I('v2_03_dog', { h: 950 })] },
  { s: 74.92, bg: 'green', fx: 'cut', els: [I('v2_12_fox_tame', { h: 760, x: 300, y: 860 }), I('v2_03_dog', { h: 760, x: 780, y: 860, at: 0.12 })], z0: 1, z1: 1.08 },
  { s: 76.20, bg: 'black', fx: 'cut', els: [COLLAR()], z0: 1.12, z1: 1.04, nosplit: true },
  { s: 77.24, bg: 'green', fx: 'glitch', els: [COLLAR(), ST('DOMESTICUS', { at: 0.52, y: 1130 })], shake: [0.52], z0: 1.04, z1: 1.0, nosplit: true },
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
const PULSE_DEF = [[0, 28.8], [30.72, 53.76], [61.92, END]];
