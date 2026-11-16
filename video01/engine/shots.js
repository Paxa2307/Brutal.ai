// Shot list. s = start (sec, cut timeline). Each shot lasts until the next one.
// bg: black | green | paper | stars. fx: cut | glitch | flash | gflash | blur | whip | zoom
const HEAD = { type: 'img', src: '01_head', x: 540, y: 800, h: 1080 };
const FIG = (src, extra = {}) => ({ type: 'img', src, x: 540, y: 820, h: 1000, ...extra });
const YEAR = (s, val, roman) => [
  { s, bg: 'paper', formulas: false, els: [{ type: 'slot', seq: val.split(''), dur: 0.16, bgs: ['paper', 'black', 'green', 'black'] }], z0: 1, z1: 1 },
  { s: s + 0.64, bg: 'black', fx: 'glitch', els: [{ type: 'year', val, roman, roll: 0.5 }], z0: 1, z1: 1.08 },
];

const SHOTS_DEF = [
  // ---------------- hook
  { s: 0.00, bg: 'black', els: [{ ...HEAD, enter: 'none' }], z0: 1.0, z1: 1.05 },
  { s: 1.76, bg: 'green', fx: 'gflash', els: [{ ...HEAD, enter: 'none', z0: 1.05, z1: 1.12 }], z0: 1, z1: 1 },
  { s: 2.85, bg: 'green', fx: 'glitch', els: [{ type: 'crowd', rows: 3, cols: 7, y: 1130, h: 520, gap: 140 }], z0: 1.0, z1: 1.08 },
  { s: 3.69, bg: 'black', fx: 'whip', els: [{ type: 'img', src: '09_lever', y: 820, h: 820, enter: 'fly' }], z0: 1.0, z1: 1.12, glitchAt: [0.55] },
  // ---------------- on paper you are free
  { s: 4.35, bg: 'paper', fx: 'flash', formulas: false, els: [{ type: 'rays', y: 820 }, { type: 'img', src: '10_chain_broken', y: 820, h: 300, enter: 'pop' }], z0: 1, z1: 1.1 },
  { s: 5.77, bg: 'black', fx: 'glitch', els: [{ type: 'img', src: '11_brain', y: 800, h: 660, enter: 'pop', pulse: true }] },
  { s: 6.55, bg: 'green', fx: 'cut', els: [{ type: 'img', src: '12_scales', y: 820, h: 720, enter: 'drop' }] },
  { s: 7.45, bg: 'black', fx: 'cut', els: [{ type: 'img', src: '13_quill', y: 820, h: 620, enter: 'focus' }] },
  { s: 8.33, bg: 'black', fx: 'glitch', els: [{ type: 'text', str: '«НО»', serif: true, size: 300, y: 760, enter: 'blur', hlLine: 0 }], z0: 1, z1: 1.15, glitchAt: [0.75] },
  // ---------------- Asch 1951
  ...YEAR(9.61, '1951', 'MCMLI'),
  { s: 11.71, bg: 'green', fx: 'cut', els: [{ type: 'cameo', src: '01_head', name: 'СОЛОМОН АШ', dates: 'ПСИХОЛОГ · 1907–1996' }], z0: 1, z1: 1.05 },
  { s: 12.71, bg: 'black', fx: 'blur', els: [{ type: 'asch', draw: true }], z0: 1, z1: 1.05 },
  { s: 14.61, bg: 'black', fx: 'cut', els: [{ type: 'asch', scan: 0.0 }], z0: 1.05, z1: 1.12 },
  { s: 16.29, bg: 'green', fx: 'gflash', els: [{ type: 'asch', right: 0.15 }], z0: 1, z1: 1.04 },
  { s: 17.30, bg: 'black', fx: 'whip', els: [{ type: 'crowd', rows: 1, cols: 5, y: 1180, h: 660, gap: 205, hl: [{ idx: 2, at: 0.9 }] }, { type: 'vf', x: 540, y: 850, w: 240, h: 700, at: 0.8 }], z0: 1, z1: 1.06 },
  { s: 19.04, bg: 'green', fx: 'glitch', els: [{ type: 'crowd', rows: 1, cols: 5, y: 1180, h: 660, gap: 205, hl: [{ idx: 2, at: 0 }] }, { type: 'stamp', str: 'ПОДСТАВНЫЕ', y: 820, at: 0.25, size: 92 }], shake: [0.25], z0: 1.04, z1: 1.08 },
  { s: 20.08, bg: 'black', fx: 'glitch', els: [{ type: 'asch', wrong: 0.6 }], z0: 1, z1: 1.08, shake: [1.0] },
  { s: 21.96, bg: 'black', fx: 'zoom', els: [{ type: 'num', from: 3, to: 3, suffix: '/4', y: 560, size: 230, dur: 0.1 }, { type: 'people', n: 4, size: 200, y: 1030, hl: [0, 1, 2], hlAt: 0.6, hlStag: 0.25, stag: 0.08 }], z0: 1, z1: 1.04 },
  { s: 23.69, bg: 'green', fx: 'cut', els: [{ type: 'crowd', rows: 2, cols: 6, y: 1150, h: 560, gap: 150, wave: { at: 0.1, speed: 1.2 } }], z0: 1, z1: 1.07 },
  { s: 24.94, bg: 'black', fx: 'blur', els: [{ type: 'img', src: '14_eye', y: 820, h: 560, enter: 'none', z0: 1, z1: 1.6 }], z0: 1, z1: 1 },
  // ---------------- weak spot
  { s: 26.22, bg: 'black', fx: 'glitch', els: [{ type: 'crowd', rows: 2, cols: 6, y: 1150, h: 560, gap: 150 }, FIG('05_suit_man', { x: 960, y: 900, h: 620, enter: 'fly', from: 400, mx: -200 })], z0: 1, z1: 1.04 },
  { s: 28.14, bg: 'green', fx: 'cut', els: [{ type: 'crowd', rows: 2, cols: 6, y: 1150, h: 560, gap: 150, hl: [{ idx: 103, at: 0.3 }], move: { idx: 103, dx: 380, t0: 0, t1: 0.7 } }], z0: 1.04, z1: 1.1 },
  // ---------------- Milgram 1961
  ...YEAR(29.67, '1961', 'MCMLXI'),
  { s: 31.40, bg: 'paper', fx: 'flash', formulas: false, els: [{ type: 'img', src: '17_yale', y: 820, h: 560, enter: 'focus', frame: true, rot: -2 }], z0: 1, z1: 1.06 },
  { s: 32.71, bg: 'green', fx: 'cut', els: [{ type: 'cameo', src: '01_head', name: 'СТЭНЛИ МИЛГРЭМ', dates: 'ПСИХОЛОГ · 1933–1984', rot: 3 }], z0: 1, z1: 1.05 },
  { s: 33.82, bg: 'black', fx: 'whip', els: [{ type: 'gen', on0: 0, on1: 0, spark: 0.68 }], z0: 1, z1: 1.08, shake: [0.68], flashAt: [0.68] },
  { s: 34.82, bg: 'black', fx: 'glitch', els: [{ type: 'img', src: '07_seated_man', y: 960, h: 820, enter: 'focus' }, { type: 'img', src: '16_bolt', x: 540, y: 380, h: 280, at: 0.55, enter: 'pop', pulse: true }], z0: 1, z1: 1.06 },
  { s: 36.60, bg: 'black', fx: 'cut', els: [{ type: 'gen', on0: 0, on1: 1, onAt: 0.2, onDur: 0.1 }, { type: 'num', from: 15, to: 15, suffix: ' V', y: 470, size: 170, bands: false }], z0: 1.08, z1: 1.12 },
  { s: 37.70, bg: 'green', fx: 'gflash', els: [{ type: 'gen', on0: 1, on1: 10, onDur: 0.5 }, { type: 'num', from: 15, to: 150, suffix: ' V', y: 470, size: 170, bands: false, dur: 0.5 }], z0: 1.0, z1: 1.06, shake: [0.5] },
  { s: 38.62, bg: 'black', fx: 'cut', els: [{ type: 'img', src: '19_brick_wall', y: 820, h: 560, enter: 'focus', frame: true }, { type: 'wave', y: 820, a0: 10, a1: 60, dur: 0.8 }] },
  { s: 39.44, bg: 'black', fx: 'glitch', els: [{ type: 'img', src: '19_brick_wall', y: 820, h: 560, enter: 'none', frame: true, alpha: 0.6, z0: 1.15, z1: 1.3 }, { type: 'wave', y: 820, a0: 120, a1: 260, dur: 1 }], shake: [0, 0.6], glitchAt: [0.6] },
  { s: 41.29, bg: 'paper', fx: 'flash', formulas: false, els: [{ type: 'rays', y: 760 }, FIG('08_lab_coat', { h: 1080, enter: 'focus', y: 800 })], z0: 1, z1: 1.1 },
  { s: 43.16, bg: 'black', fx: 'blur', els: [{ type: 'text', str: '«ЭКСПЕРИМЕНТ\nТРЕБУЕТ\nПРОДОЛЖАТЬ»', serif: true, size: 104, y: 760, enter: 'blur', bands: true, hlLine: 2, sub: '— ФРАЗА ЭКСПЕРИМЕНТАТОРА' }], z0: 1, z1: 1.06 },
  { s: 45.10, bg: 'green', fx: 'cut', els: [{ type: 'crowd', rows: 1, cols: 3, y: 1220, h: 760, gap: 300, src: '08_lab_coat' }], z0: 1, z1: 1.06 },
  { s: 46.64, bg: 'black', fx: 'glitch', els: [{ type: 'dots', y: 700, hlAt: 0.9, hlIndex: 500 }, { type: 'text', str: '1 ИЗ 1000', serif: true, size: 120, y: 1150, at: 1.0, hlLine: 0 }], z0: 1, z1: 1.04 },
  { s: 48.56, bg: 'black', fx: 'whip', els: [{ type: 'dial', y: 960, v0: 0, v1: 450, at: 0.1, dur: 1.4 }], z0: 1, z1: 1.06, shake: [1.4] },
  { s: 50.22, bg: 'green', fx: 'gflash', els: [{ type: 'num', from: 0, to: 65, suffix: '%', y: 640, size: 300, dur: 0.7 }, { type: 'people', n: 40, cols: 8, size: 92, y: 1030, stag: 0.01, hl: Array.from({ length: 26 }, (_, i) => i), hlAt: 0.3, hlStag: 0.03 }], z0: 1, z1: 1.04, shake: [0.5] },
  { s: 52.11, bg: 'black', fx: 'cut', els: [{ type: 'img', src: '16_bolt', y: 800, h: 480, enter: 'pop' }, { type: 'strike', x0: 140, y0: 1010, x1: 940, y1: 590, at: 0.55 }], glitchAt: [0.5] },
  { s: 53.63, bg: 'black', fx: 'glitch', els: [{ type: 'img', src: '04_statue_chained', y: 820, h: 1040, enter: 'drop' }], z0: 1, z1: 1.04 },
  { s: 54.58, bg: 'green', fx: 'flash', els: [{ type: 'img', src: '02_head_bowed', y: 820, h: 980, enter: 'none' }], z0: 1.1, z1: 1.0, shake: [0] },
  // ---------------- bystander 1968
  ...YEAR(57.04, '1968', 'MCMLXVIII'),
  { s: 58.59, bg: 'paper', fx: 'flash', formulas: false, els: [{ type: 'img', src: '18_newyork', y: 820, h: 560, enter: 'focus', frame: true, rot: 2 }], z0: 1, z1: 1.06 },
  { s: 59.54, bg: 'black', fx: 'blur', els: [{ type: 'img', src: '20_smoke_room', y: 820, h: 560, enter: 'none', frame: true }, { type: 'smoke', k0: 0, k1: 0.35, dur: 1.4 }], z0: 1, z1: 1.08 },
  { s: 61.11, bg: 'black', fx: 'glitch', els: [{ type: 'img', src: '07_seated_man', x: 540, y: 590, h: 640, enter: 'pop' }, { type: 'bars', y: 1120, rows: [{ label: 'В ОДИНОЧКУ', v1: 75, at: 0.9 }] }, { type: 'smoke', k0: 0.2, k1: 0.28 }] },
  { s: 63.46, bg: 'black', fx: 'cut', els: [{ type: 'img', src: '07_seated_man', x: 290, y: 590, h: 540, enter: 'pop' }, { type: 'img', src: '07_seated_man', x: 540, y: 590, h: 540, enter: 'pop', at: 0.1 }, { type: 'img', src: '07_seated_man', x: 790, y: 590, h: 540, enter: 'pop', at: 0.2 }, { type: 'bars', y: 1060, rows: [{ label: 'В ОДИНОЧКУ', v0: 75, v1: 75, at: 0, dim: true }, { label: 'С ДВУМЯ СПОКОЙНЫМИ', v1: 10, at: 1.4 }] }, { type: 'smoke', k0: 0.28, k1: 0.36 }] },
  { s: 66.03, bg: 'black', fx: 'cut', els: [{ type: 'img', src: '21_smoke_three', y: 820, h: 560, enter: 'none', frame: true, z0: 1.0, z1: 1.15 }, { type: 'smoke', k0: 0.15, k1: 0.45 }], z0: 1.1, z1: 1.0 },
  // ---------------- 2 million years
  { s: 68.69, bg: 'black', fx: 'glitch', els: [{ type: 'year', val: '2 000 000', sub: 'ЛЕТ', size: 170, roll: 0.6 }], z0: 1, z1: 1.06 },
  { s: 69.69, bg: 'paper', fx: 'flash', formulas: false, els: [{ type: 'img', src: '22_savanna', y: 820, h: 560, enter: 'focus', frame: true, z0: 1, z1: 1.1 }], z0: 1, z1: 1 },
  { s: 70.87, bg: 'black', fx: 'glitch', els: [{ type: 'img', src: '22_savanna', x: 160, y: 830, h: 560, enter: 'none', z0: 1.8, z1: 2.05 }], z0: 1, z1: 1, shake: [0] },
  { s: 71.91, bg: 'green', fx: 'gflash', els: [{ type: 'img', src: '23_tribe', y: 820, h: 560, enter: 'pop', frame: true }], z0: 1, z1: 1.08 },
  // ---------------- your brain
  { s: 74.42, bg: 'black', fx: 'whip', els: [{ type: 'img', src: '11_brain', y: 800, h: 660, enter: 'focus', pulse: true }], z0: 1, z1: 1.1 },
  { s: 75.80, bg: 'black', fx: 'glitch', els: [{ type: 'crowd', rows: 2, cols: 6, y: 1150, h: 560, gap: 150 }, FIG('05_suit_man', { x: 950, y: 900, h: 620, enter: 'none' }), { type: 'vf', x: 950, y: 900, w: 170, h: 600, at: 0.2, glow: true }], z0: 1, z1: 1.06 },
  { s: 76.84, bg: 'black', fx: 'cut', els: [{ type: 'bars', y: 700, rows: [{ label: 'СТРАХ ВЫДЕЛИТЬСЯ', v1: 100, at: 0.1, suffix: '' }, { label: 'СТРАХ ОШИБИТЬСЯ', v1: 40, at: 0.6, dim: true, suffix: '' }] }], z0: 1, z1: 1.04 },
  { s: 78.37, bg: 'paper', fx: 'flash', formulas: false, els: [{ type: 'rays', y: 820 }, { type: 'img', src: '23_tribe', y: 820, h: 560, enter: 'focus', frame: true, rot: -2 }], z0: 1, z1: 1.08 },
  { s: 80.03, bg: 'green', fx: 'glitch', els: [{ ...HEAD, enter: 'none', pulse: true }], z0: 1, z1: 1.08 },
  // ---------------- the detail
  { s: 81.43, bg: 'black', fx: 'glitch', els: [{ type: 'img', src: '03_head_hush', y: 800, h: 1000, enter: 'none' }], z0: 1.1, z1: 1.18, glitchAt: [0.8] },
  { s: 83.36, bg: 'black', fx: 'cut', els: [{ type: 'crowd', rows: 1, cols: 5, y: 1180, h: 660, gap: 205 }], z0: 1, z1: 1.04 },
  { s: 84.56, bg: 'green', fx: 'gflash', els: [{ type: 'crowd', rows: 1, cols: 5, y: 1180, h: 660, gap: 205, odd: { idx: 3, src: '06_suit_man_crossed' }, hl: [{ idx: 3, at: 0 }] }, { type: 'vf', x: 745, y: 860, w: 240, h: 680, at: 0.1, glow: true }], z0: 1, z1: 1.06 },
  { s: 86.18, bg: 'black', fx: 'cut', els: [{ type: 'bars', y: 760, rows: [{ label: 'ПОДЧИНЕНИЕ', v0: 32, v1: 5, at: 0.5, dur: 1.0 }] }, { type: 'text', str: 'АШ · 1951', serif: true, size: 70, y: 520, hlLine: 0 }], z0: 1, z1: 1.04 },
  { s: 88.45, bg: 'black', fx: 'glitch', els: [{ type: 'img', src: '08_lab_coat', x: 540, y: 820, h: 920, enter: 'pop' }, { type: 'img', src: '06_suit_man_crossed', x: 220, y: 860, h: 800, enter: 'fly', from: -600, at: 0.8, tint: 0.8 }, { type: 'img', src: '06_suit_man_crossed', x: 860, y: 860, h: 800, enter: 'fly', from: 600, at: 0.9, tint: 0.9 }], z0: 1, z1: 1.05 },
  { s: 90.42, bg: 'green', fx: 'gflash', els: [{ type: 'num', from: 65, to: 10, suffix: '%', y: 820, size: 330, at: 0.8, dur: 0.6 }], z0: 1, z1: 1.06, shake: [1.4] },
  // ---------------- turn
  { s: 92.64, bg: 'paper', fx: 'flash', formulas: false, els: [{ type: 'img', src: '24_crowd_salute', y: 820, h: 560, enter: 'focus', frame: true }, { type: 'circle', x: 510, y: 850, rx: 95, ry: 235, at: 1.2 }], z0: 1, z1: 1.12 },
  { s: 94.96, bg: 'black', fx: 'zoom', els: [{ ...HEAD, enter: 'none' }], z0: 1.15, z1: 1.25 },
  { s: 95.82, bg: 'green', fx: 'glitch', els: [{ type: 'text', str: 'НЕТ', size: 330, y: 760, enter: 'slam', at: 0.32, color: '#ffffff' }], shake: [0.35], flashAt: [0.32] },
  { s: 96.96, bg: 'black', fx: 'cut', els: [{ type: 'crowd', rows: 3, cols: 7, y: 1160, h: 520, gap: 140, wave: { at: 0.6, speed: 1.0 } }], z0: 1, z1: 1.08 },
  { s: 98.98, bg: 'black', fx: 'glitch', els: [{ type: 'img', src: '15_demon', y: 800, h: 820, enter: 'focus' }], z0: 1, z1: 1.08, glitchAt: [0.9] },
  { s: 100.66, bg: 'green', fx: 'glitch', els: [FIG('05_suit_man', { h: 1080, y: 800, enter: 'none' }), { type: 'vf', x: 540, y: 800, w: 420, h: 1100, at: 0.35 }], z0: 1, z1: 1.06 },
  { s: 101.76, bg: 'black', fx: 'cut', els: [{ type: 'crowd', rows: 3, cols: 7, y: 1160, h: 520, gap: 140 }], z0: 1.0, z1: 1.1 },
  // ---------------- loop back to the first frame
  { s: 103.07, bg: 'black', fx: 'glitch', els: [{ ...HEAD, enter: 'none' }], z0: 0.97, z1: 1.0 },
];
