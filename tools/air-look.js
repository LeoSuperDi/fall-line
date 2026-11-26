// Rides into a big kicker without pressing anything and screenshots the top of the forced launch.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { __hs.startStage(3, 1, true); __hs.L.obs.length = 0; const k = __hs.L.kickers.find(k => k[2] && k[1] > 1200); window.__lip = k[1]; setInterval(() => { __hs.P.hearts = 9; }, 100); });
  await p.waitForFunction(() => __hs.P.x > window.__lip, null, { timeout: 90000 });
  const y0 = await p.evaluate(() => __hs.P.y); let minY = y0, t0 = Date.now();
  while (true) { const st = await p.evaluate(() => [__hs.P.y, __hs.P.ground]); minY = Math.min(minY, st[0]); if (st[1] && Date.now() - t0 > 200) break; if (Date.now() - t0 > 4000) break; if (st[0] <= minY && Date.now() - t0 > 300 && Date.now() - t0 < 700) await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-big-air.png') }); await p.waitForTimeout(20); }
  console.log('height above lip:', Math.round(y0 - minY), 'px, air time', Date.now() - t0, 'ms'); await b.close();
})();
