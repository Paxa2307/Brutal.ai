// Video 05 — «Вы родились недоношенным». Times are on the cut voice timeline;
// finalize() snaps every cut to the 8th-note grid of the 125 BPM score and
// auto-splits long image shots with a punch-in cut on the beat.
const BEAT_S = 0.48, GRID = BEAT_S / 2, END = 69.6;
const I = (src, o = {}) => ({ type: 'img', src, x: 540, y: 820, h: 900, enter: 'pop', ...o });
const ST = (str, o = {}) => ({ type: 'stamp', str, at: 0.15, size: 96, ...o });
const T = (str, o = {}) => ({ type: 'text', str, serif: true, size: 120, y: 760, enter: 'blur', ...o });
const BABY = (o = {}) => I('v5_01_baby_marble', { h: 1050, enter: 'none', ...o });
const FOAL = (o = {}) => I('v5_02_foal_standing', { h: 720, ...o });
const UNF = (o = {}) => I('v5_19_unfinished_statue', { h: 1100, ...o });

const RAW = [
  // ---------------- hook (title overlay 2.6 s)
  { s: 0.00, bg: 'black', els: [BABY()], z0: 1.0, z1: 1.05 },
  { s: 0.50, bg: 'green', fx: 'flash', els: [BABY(), ST('PRAEMATURUS', { at: 0.1, y: 1180, size: 84 })], shake: [0.1], nosplit: true },
  { s: 1.71, bg: 'black', fx: 'glitch', els: [I('v5_12_mother_baby', { h: 1050 })] },
  { s: 2.75, bg: 'paper', fx: 'flash', formulas: false, els: [I('v2_16_earth', { h: 760, drot: 8 })], nosplit: true },
  { s: 3.42, bg: 'green', fx: 'glitch', els: [T('?', { size: 520, y: 700, enter: 'slam', hlLine: 0 })], nosplit: true, z0: 1, z1: 1.15 },
  // ---------------- foal vs you
  { s: 4.13, bg: 'black', fx: 'whip', els: [FOAL({ enter: 'fly', from: 800 }), ST('EQUUS', { at: 0.4, y: 1150 })], shake: [0.4], nosplit: true },
  { s: 4.74, bg: 'green', fx: 'zoom', els: [FOAL({ h: 1500, x: 700, y: 520, enter: 'none' })], nosplit: true },
  { s: 5.62, bg: 'black', fx: 'glitch', els: [{ type: 'num', from: 1, to: 1, y: 760, size: 360, dur: 0.1, sub: 'ЧАС' }], nosplit: true },
  { s: 6.17, bg: 'paper', fx: 'flash', formulas: false, els: [FOAL({ enter: 'none' })], nosplit: true },
  { s: 6.93, bg: 'black', fx: 'cut', els: [I('v5_03_foal_herd', { h: 640, enter: 'focus', frame: true, rot: -2 })] },
  { s: 8.57, bg: 'green', fx: 'zoom', els: [I('v5_03_foal_herd', { h: 1600, x: 520, y: 700, enter: 'none' })], nosplit: true },
  { s: 9.42, bg: 'black', fx: 'whip', els: [I('v5_04_baby_helpless', { h: 900 })], nosplit: true },
  { s: 10.08, bg: 'green', fx: 'flash', els: [I('v5_04_baby_helpless', { h: 900, enter: 'none' }), ST('1 ГОД', { at: 0.1, y: 1170, size: 110 })], shake: [0.1], nosplit: true },
  // ---------------- Portmann
  { s: 10.62, bg: 'black', fx: 'blur', els: [I('v2_10_dna', { h: 1150, alpha: 0.2, enter: 'none' }), T('АДОЛЬФ\nПОРТМАН', { size: 130, bands: true, sub: 'ЗООЛОГ · 1897–1982', subSize: 40 })], nosplit: true },
  { s: 12.68, bg: 'paper', fx: 'flash', formulas: false, els: [I('v5_05_chimp_baby', { h: 760 })] },
  { s: 14.40, bg: 'green', fx: 'zoom', els: [I('v5_05_chimp_baby', { h: 1900, x: 420, y: 1140, enter: 'none' })], nosplit: true },
  { s: 15.64, bg: 'black', fx: 'glitch', els: [I('v5_07_hourglass', { h: 1150 })] },
  { s: 17.14, bg: 'black', fx: 'gflash', els: [I('v5_07_hourglass', { h: 1150, alpha: 0.25, enter: 'none' }), { type: 'num', from: 9, to: 21, y: 800, size: 380, dur: 1.0, sub: 'МЕСЯЦ' }], nosplit: true, shake: [1.0] },
  // ---------------- brains
  { s: 18.61, bg: 'black', fx: 'whip', els: [I('v5_08_brains_compare', { h: 600 })] },
  { s: 19.64, bg: 'black', fx: 'cut', els: [I('v5_08_brains_compare', { h: 600, enter: 'none', y: 560, alpha: 0.5 }), { type: 'bars', y: 1060, rows: [{ label: 'ЧЕЛОВЕК', v1: 28, at: 0.15, dur: 0.8, nonum: true }] }], nosplit: true },
  { s: 21.23, bg: 'paper', fx: 'flash', formulas: false, els: [I('v5_06_macaque_baby', { h: 950, enter: 'fly', from: -800 }), ST('MACACA', { at: 0.5, y: 1170 })], shake: [0.5], nosplit: true },
  { s: 22.33, bg: 'black', fx: 'glitch', els: [{ type: 'bars', y: 720, rows: [{ label: 'ЧЕЛОВЕК', v0: 28, v1: 28, at: 0, dim: true, nonum: true }, { label: 'МАКАКА', v1: 70, at: 0.2, dur: 0.8, nonum: true }] }], nosplit: true },
  { s: 23.60, bg: 'black', fx: 'glitch', els: [T('ПОЧЕМУ?', { size: 170, y: 760, enter: 'slam', hlLine: 0 })], nosplit: true, z0: 1, z1: 1.12 },
  // ---------------- mechanism
  { s: 24.46, bg: 'black', fx: 'whip', els: [I('v5_09_skeleton_walk', { h: 1150, enter: 'fly', from: -700, mx: 80 })] },
  { s: 26.12, bg: 'paper', fx: 'flash', formulas: false, els: [I('v5_10_pelvis', { h: 640 }), { type: 'circle', x: 540, y: 900, rx: 150, ry: 110, at: 0.4 }], nosplit: true },
  { s: 27.38, bg: 'black', fx: 'cut', els: [I('v5_11_newborn_skull', { h: 900, z0: 1.0, z1: 1.25 })], nosplit: true },
  { s: 28.76, bg: 'green', fx: 'glitch', els: [I('v5_07_hourglass', { h: 1150, enter: 'none' })], nosplit: true },
  { s: 30.12, bg: 'black', fx: 'cut', els: [I('v5_10_pelvis', { h: 640, enter: 'none' }), I('v5_11_newborn_skull', { h: 380, y: 520, enter: 'drop' }), ST('НЕТ', { at: 0.4, size: 150, y: 1180 })], shake: [0.4], nosplit: true },
  { s: 31.06, bg: 'paper', fx: 'flash', formulas: false, els: [I('v5_12_mother_baby', { h: 1050, enter: 'focus' })] },
  { s: 32.62, bg: 'black', fx: 'zoom', els: [I('v5_08_brains_compare', { h: 1000, x: 260, y: 800, enter: 'none' })], nosplit: true },
  { s: 33.84, bg: 'black', fx: 'glitch', els: [BABY(), { type: 'vf', x: 540, y: 820, w: 520, h: 1080, at: 0.05, glow: true }], nosplit: true },
  { s: 34.66, bg: 'green', fx: 'flash', els: [I('v5_07_hourglass', { h: 1150, enter: 'none', drot: -10 }), ST('PRAEMATURUS', { at: 0.15, y: 1180, size: 84 })], shake: [0.15], nosplit: true },
  { s: 35.60, bg: 'black', fx: 'whip', els: [I('v5_13_neurons', { h: 640, pulse: true })] },
  { s: 37.19, bg: 'black', fx: 'cut', els: [I('v5_08_brains_compare', { h: 600 })], nosplit: true },
  { s: 38.41, bg: 'black', fx: 'gflash', els: [T('×2', { size: 360, y: 760, enter: 'slam', hlLine: 0, serif: true })], shake: [0.05], nosplit: true },
  // ---------------- TENSE: on paper you are the most helpless
  { s: 38.93, bg: 'black', fx: 'cut', formulas: false, els: [I('v5_04_baby_helpless', { h: 900, enter: 'focus' })], z0: 1.0, z1: 1.08, nosplit: true },
  { s: 40.51, bg: 'black', fx: 'glitch', formulas: false, els: [I('v5_04_baby_helpless', { h: 1700, x: 620, y: 900, enter: 'none' }), ST('INFIRMUS', { at: 0.4, y: 1180 })], shake: [0.4], nosplit: true },
  // ---------------- STOP: total silence, voice only
  { s: 42.12, nosnap: true, bg: 'black', fx: 'cut', formulas: false, quiet: true, els: [BABY({ alpha: 0.9 })], z0: 1.0, z1: 1.14, nosplit: true },
  // ---------------- DROP
  { s: 43.92, bg: 'green', fx: 'flash', els: [{ type: 'rays', y: 820 }, I('v5_13_neurons', { h: 640 })], shake: [0.02], nosplit: true },
  { s: 44.92, bg: 'green', fx: 'flash', els: [{ type: 'rays', y: 820 }, I('v5_13_neurons', { h: 640, enter: 'none', pulse: true }), ST('ARMA', { at: 0.1, y: 1170, size: 120 })], shake: [0.1], nosplit: true },
  { s: 45.51, bg: 'black', fx: 'whip', els: [FOAL({ enter: 'fly', from: 800 })] },
  { s: 47.48, bg: 'paper', fx: 'flash', formulas: false, els: [I('v5_18_horse_adult', { h: 720 }), ST('1 ЖИЗНЬ', { at: 0.5, y: 1170 })], shake: [0.5], nosplit: true },
  { s: 48.76, bg: 'black', fx: 'cut', els: [UNF({ enter: 'focus' })] },
  { s: 50.27, bg: 'green', fx: 'glitch', els: [I('v5_13_neurons', { h: 1300, enter: 'none', pulse: true })], nosplit: true },
  { s: 51.66, bg: 'black', fx: 'cut', els: [I('v5_13_neurons', { h: 1300, enter: 'none', alpha: 0.25 }), { type: 'num', from: 0, to: 1000000, y: 780, size: 170, dur: 1.2, sub: 'СВЯЗЕЙ В СЕКУНДУ' }], nosplit: true, shake: [1.2] },
  { s: 54.04, bg: 'paper', fx: 'flash', formulas: false, els: [I('v5_14_baby_listening', { h: 950 })] },
  { s: 55.60, bg: 'black', fx: 'whip', els: [I('v2_16_earth', { h: 760, drot: 15, pulse: true })] },
  { s: 57.00, bg: 'green', fx: 'cut', els: [I('v5_12_mother_baby', { h: 1050 })] },
  { s: 59.23, bg: 'black', fx: 'glitch', els: [I('v5_13_neurons', { h: 640, pulse: true })], nosplit: true },
  { s: 60.43, bg: 'black', fx: 'cut', els: [I('v2_16_earth', { h: 760, drot: -12 })], nosplit: true },
  { s: 61.80, bg: 'paper', fx: 'flash', formulas: false, els: [I('v5_15_jungle', { h: 640, enter: 'pop', frame: true, rot: -2 })], nosplit: true },
  { s: 62.36, bg: 'paper', fx: 'flash', formulas: false, els: [I('v5_16_tundra', { h: 640, enter: 'pop', frame: true, rot: 2 })], nosplit: true },
  { s: 62.96, bg: 'paper', fx: 'flash', formulas: false, els: [I('v5_17_metropolis', { h: 640, enter: 'pop', frame: true, rot: -1 })], nosplit: true },
  // ---------------- finale
  { s: 63.70, bg: 'black', fx: 'glitch', els: [UNF({ enter: 'none' })], nosplit: true },
  { s: 65.00, bg: 'green', fx: 'flash', els: [{ type: 'rays', y: 820 }, UNF({ enter: 'none' }), ST('OPUS', { at: 0.6, y: 1180, size: 120 })], shake: [0.6], nosplit: true },
  { s: 66.23, bg: 'black', fx: 'whip', els: [I('v5_18_horse_adult', { h: 720 })] },
  { s: 67.37, bg: 'black', fx: 'cut', els: [I('v5_18_horse_adult', { h: 720, enter: 'none' }), ST('ТОЛЬКО', { at: 0.05, y: 1150 })], shake: [0.05], nosplit: true },
  { s: 68.08, bg: 'paper', fx: 'flash', formulas: false, els: [{ type: 'rays', y: 820 }, I('v5_20_statue_horizon', { h: 1150, enter: 'focus' })], nosplit: true },
  { s: 68.70, bg: 'green', fx: 'flash', els: [{ type: 'rays', y: 820 }, I('v5_20_statue_horizon', { h: 1150, enter: 'none' }), ST('QUIVIS', { at: 0.1, y: 1180 })], shake: [0.1], nosplit: true, z0: 1.0, z1: 1.06 },
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
    let s = sh.nosnap ? sh.s : snap(sh.s);
    if (s <= prev) s = prev + GRID;
    sh.s = +s.toFixed(3); prev = sh.s;
  }
  return out;
}
const SHOTS_DEF = finalize(RAW);
const PULSE_DEF = [[0, 38.88], [43.92, END]];
const TITLE_DEF = { until: 2.6, y: 300, lines: [['ВЫ РОДИЛИСЬ', false, 92], ['НЕДОНОШЕННЫМ', true, 150]] };
