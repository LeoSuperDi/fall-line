// Screenshot of the finish line seen from high in the air.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { __hs.startStage(0, 0, true); const L = __hs.L, P = __hs.P, x = L.finish - 700; P.x = x; P.y = L.gy[Math.floor(x / 10)] - 520; P.ground = false; P.vx = 500; P.vy = -300; P.inv = 9; });
  await p.waitForTimeout(650); await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-finish-high.png') }); await b.close();
})();
