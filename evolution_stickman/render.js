// usage: node render.js stills t1,t2,...   |  node render.js video out.mp4 [start end]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
(async () => {
  const mode = process.argv[2];
  const browser = await chromium.launch({ args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1200 } });
  page.on('console', m => console.log('PAGE', m.text())); page.on('pageerror', e => console.log('ERR', e.message));
  await page.addInitScript(() => { window.RENDER_MODE = true; });
  await page.goto('file://' + path.resolve(__dirname, 'src/index.html'));
  await page.evaluate(() => window.EVO_READY);
  const grab = async (t) => page.evaluate((t) => { const n = window.renderAt(t); return [n, document.getElementById('c').toDataURL('image/jpeg', 0.95)]; }, t);
  if (mode === 'stills') {
    fs.mkdirSync('stills', { recursive: true });
    for (const t of process.argv[3].split(',').map(Number)) {
      const t0 = Date.now(); const [n, d] = await grab(t);
      fs.writeFileSync(`stills/t${t.toFixed(2)}.jpg`, Buffer.from(d.split(',')[1], 'base64'));
      console.log(t, 'samples', n, (Date.now() - t0) + 'ms');
    }
  } else {
    const out = process.argv[3], a = +(process.argv[4] || 0), b = +(process.argv[5] || 20);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '60', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '60', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const f0 = Math.round(a * 60), f1 = Math.round(b * 60); const T = Date.now();
    for (let f = f0; f < f1; f++) {
      const [n, d] = await grab(f / 60);
      if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 120 === 0) console.log('frame', f, 'n', n, ((Date.now() - T) / 1000).toFixed(1) + 's');
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await browser.close();
})();
