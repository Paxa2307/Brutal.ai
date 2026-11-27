// node render.js <out.mp4|--stills t1,t2,...> [workers]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FPS = 30;
const caps = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/captions.json')));
const DURATION = +(process.env.DUR || 69.6);
const images = fs.readdirSync(path.join(ROOT, 'build/art')).filter(f => f.endsWith('.png')).map(f => f.slice(0, -4));

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto('file://' + path.join(ROOT, 'engine/index.html'));
  await page.evaluate(async ({ caps, images, DURATION }) => {
    await init({ duration: DURATION, captions: caps, shots: SHOTS_DEF, images, pulse: PULSE_DEF, title: typeof TITLE_DEF !== 'undefined' ? TITLE_DEF : null });
  }, { caps, images, DURATION });
  return page;
}

(async () => {
  const browser = await chromium.launch({ args: ['--disable-web-security', '--allow-file-access-from-files'] });
  const arg = process.argv[2];
  if (arg === '--stills') {
    const page = await openPage(browser);
    const ts = process.argv[3].split(',').map(Number);
    fs.mkdirSync(path.join(ROOT, 'build/stills'), { recursive: true });
    for (const t of ts) {
      const url = await page.evaluate(([t]) => { render(t, Math.round(t * 30)); return grab(0.9); }, [t]);
      fs.writeFileSync(path.join(ROOT, `build/stills/t${t.toFixed(2)}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
    }
    await browser.close(); return;
  }
  const workers = +(process.argv[3] || 4);
  const total = Math.ceil(DURATION * FPS);
  const per = Math.ceil(total / workers);
  const t0 = Date.now();
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const page = await openPage(browser);
    const f0 = w * per, f1 = Math.min(total, f0 + per);
    const out = path.join(ROOT, `build/part${w}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = f0; f < f1; f++) {
      const url = await page.evaluate(([t, f]) => { render(t, f); return grab(0.93); }, [f / FPS, f]);
      const buf = Buffer.from(url.split(',')[1], 'base64');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (w === 0 && f % 150 === 0) console.log(`w0 frame ${f - f0}/${f1 - f0}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }));
  fs.writeFileSync(path.join(ROOT, 'build/parts.txt'), Array.from({ length: workers }, (_, w) => `file 'part${w}.mp4'`).join('\n'));
  console.log('done in', ((Date.now() - t0) / 1000).toFixed(0), 's');
  await browser.close();
})();
