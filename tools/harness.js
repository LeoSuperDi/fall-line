// Opens the game in headless Chromium for checks and screenshots.
// The sandbox can't reach cdnjs or Google Fonts, so three.js and the two fonts are served from npm packages instead.
// It also exposes a few game internals as window.__fl, by adding one line to js/main.js as it is served.
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const NM = path.join(__dirname, 'node_modules');
const FACES = [['Barlow Condensed', 'barlow-condensed', [500, 600, 700, 800]], ['Literata', 'literata', [400, 500]]];
const FONT_CSS = FACES.flatMap(([fam, dir, ws]) => ws.map(w => `@font-face{font-family:'${fam}';font-weight:${w};src:url(https://fonts.local/${dir}/files/${dir}-latin-${w}-normal.woff2) format('woff2')}`)).join('\n');
const HOOK = "window.__fl = { get save() { return save; }, get state() { return state; }, P, CAM, travel, regionAt, RUNS, tiles, openOv, closeOv, openShop, talkTo, npcs, toggleSkis, startQuest, interact, LANTERNS, addItem, bannerShow, trailMesh: trail, get trail() { return { count: trCount, drawn: trGeo.drawRange.count, trackY: trCount ? trY[(trCount - 1) * 2] : null, meshY: meshH(P.x, P.z), playerY: P.y, visible: trail.visible }; } };\n";

async function openGame({ width = 1280, height = 720, mobile = false } = {}) {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } : { viewport: { width, height } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/three.min.js', r => r.fulfill({ path: path.join(NM, 'three/build/three.min.js'), contentType: 'text/javascript' }));
  await page.route(/fonts\.googleapis\.com/, r => r.fulfill({ body: FONT_CSS, contentType: 'text/css' }));
  await page.route(/fonts\.gstatic\.com/, r => r.abort());
  await page.route(/fonts\.local/, r => r.fulfill({ path: path.join(NM, '@fontsource', r.request().url().split('fonts.local/')[1]), contentType: 'font/woff2' }));
  await page.route('**/js/main.js', async r => {
    const src = require('fs').readFileSync(path.join(ROOT, 'js/main.js'), 'utf8');
    r.fulfill({ body: src.replace('function init() {', HOOK + 'function init() {'), contentType: 'text/javascript' });
  });
  const t0 = Date.now();
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForSelector('#loading.hidden', { state: 'attached', timeout: 240000 });
  return { browser, page, errors, loadSeconds: (Date.now() - t0) / 1000 };
}
async function travelTo(page, dest) {
  await page.evaluate(d => __fl.travel(d), dest); await page.waitForTimeout(800);
  await page.waitForFunction(() => document.getElementById('fade').style.opacity === '0', null, { timeout: 120000 });
}
module.exports = { openGame, travelTo, ROOT };
