// For every kicker in every stage, measures the gap from the kicker lip to the next ground obstacle.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); await routeFonts(p);
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(400);
  const out = await p.evaluate(() => { let min = 1e9, n = 0, under = 0; for (let c = 0; c < 6; c++) for (let s = 0; s < 3; s++) { __hs.startStage(c, s, true); const L = __hs.L;
    for (const [, lip] of L.kickers) { const o = L.obs.filter(o => !o.fly && o.x > lip).sort((a, b) => a.x - b.x)[0]; if (!o) continue; const d = o.x - lip; n++; min = Math.min(min, d); if (d < 1400) under++; } } return { kickers: n, nearestObstacleAfterLip: Math.round(min), within1400: under }; });
  console.log(JSON.stringify(out)); await b.close();
})();
