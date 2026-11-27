// Screenshots a big-kicker jump at several moments to check Arlo and the landing stay on screen.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { __hs.startStage(3, 1, true); __hs.L.obs.length = 0; const k = __hs.L.kickers.find(k => k[2] && k[1] > 1200); window.__lip = k[1]; setInterval(() => { __hs.P.hearts = 9; }, 100); });
  await p.waitForFunction(() => __hs.P.x > window.__lip, null, { timeout: 90000 });
  for (const [n, ms] of [['a', 400], ['b', 500], ['c', 600]]) { await p.waitForTimeout(ms); await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-air-' + n + '.png') }); }
  await b.close();
})();
