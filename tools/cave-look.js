// Screenshot of a cave stage just before its first ground obstacle after 3 km.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { __hs.startStage(1, 1, true); const o = __hs.L.obs.find(o => o.x > 3000 && !o.fly); window.__ox = o.x; setInterval(() => { __hs.P.hearts = 9; __hs.P.inv = 0.05; }, 40); });
  await p.waitForFunction(() => __hs.P.x > window.__ox - 420, null, { timeout: 30000 });
  await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-cave.png') }); await b.close();
})();
