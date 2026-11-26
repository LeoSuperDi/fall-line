// Clears obstacles, then rides every kicker in a stage without jumping. Reports wall rides (on the ground but moving mostly downward) and falls into gaps.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  for (const [c, s] of [[0, 0], [1, 1], [2, 1], [3, 1], [4, 0], [5, 0]]) {
    await p.evaluate(([c, s]) => { __hs.startStage(c, s, true); __hs.L.obs.length = 0; window.__w = 0; window.__air = 0; setInterval(() => { const P = __hs.P; P.hearts = 99; if (P.ground && P.crash <= 0 && P.vy > Math.abs(P.vx) * 1.2) window.__w++; if (!P.ground) window.__air++; }, 8); }, [c, s]);
    await p.waitForTimeout(20000);
    console.log(c, s, await p.evaluate(() => ({ wallTicks: window.__w, airTicks: window.__air, falls: __hs.L.crashes, x: Math.round(__hs.P.x) })));
  }
  await b.close();
})();
