// Quick look at the yeti in play and in its dialogue portrait.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(800);
  await p.evaluate(() => __hs.startStage(0, 2, true)); await p.waitForTimeout(1500);
  await p.evaluate(() => { __hs.L.yeti.x = __hs.P.x + 260; __hs.L.yeti.y = 0; });
  await p.waitForTimeout(120); await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-yeti.png'), clip: { x: 200, y: 150, width: 800, height: 420 } });
  await p.evaluate(() => __hs.dialog([['yeti', 'Hrrm.']], () => {})); await p.waitForTimeout(500); await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-yeti-face.png'), clip: { x: 0, y: 580, width: 400, height: 140 } });
  await b.close();
})();
