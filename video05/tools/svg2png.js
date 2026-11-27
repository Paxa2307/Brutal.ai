// Render every assets/svg/*.svg to build/raw/*.png with transparent background.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const src = path.join(root, 'assets/svg');
  const dst = path.join(root, 'build/raw');
  fs.mkdirSync(dst, { recursive: true });
  const only = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const f of fs.readdirSync(src).filter(f => f.endsWith('.svg'))) {
    const name = f.replace('.svg', '');
    if (only.length && !only.includes(name)) continue;
    const svg = fs.readFileSync(path.join(src, f), 'utf8');
    const w = +(svg.match(/width="(\d+)"/) || [0, 800])[1];
    const h = +(svg.match(/height="(\d+)"/) || [0, 800])[1];
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await page.screenshot({ path: path.join(dst, name + '.png'), omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    console.log('rendered', name, w, h);
  }
  await browser.close();
})();
