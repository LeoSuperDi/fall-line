// Logs where Arlo is on the ground while moving mostly downward (riding a wall), with the slope there.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { __hs.startStage(5, 0, true); __hs.L.obs.length = 0; window.__w = []; setInterval(() => { const P = __hs.P, L = __hs.L; P.hearts = 99; if (P.ground && P.crash <= 0 && P.vy > Math.abs(P.vx) * 1.2) { const i = Math.floor(P.x / 10); window.__w.push([Math.round(P.x), Math.round(P.vx), Math.round(P.vy), L.gy.slice(i - 2, i + 3).map(v => Math.round(v)).join(','), L.gap.slice(i - 2, i + 3).map(Number).join('')]); } }, 8); });
  await p.waitForTimeout(20000);
  console.log(JSON.stringify(await p.evaluate(() => window.__w.slice(0, 12)))); await b.close();
})();
