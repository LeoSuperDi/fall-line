// Yeti animation frames: running, roaring when Arlo gets close, looking back, mid-jump, and the friendly wave.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => __hs.startStage(0, 2, true)); await p.waitForTimeout(1500);
  await p.evaluate(() => { __hs.L.yeti.x = __hs.P.x + 300; __hs.L.yeti.cool = 0; }); await p.waitForTimeout(150);
  await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-yeti-roar.png'), clip: { x: 250, y: 120, width: 800, height: 420 } });
  await p.evaluate(() => { __hs.L.yeti.x = __hs.P.x + 700; }); await p.waitForTimeout(120);
  await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-yeti-look.png'), clip: { x: 250, y: 120, width: 1000, height: 420 } });
  console.log('errors', errs); await b.close();
})();
