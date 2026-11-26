// Drops Arlo onto the first rock/log of a stage from above and checks he bounces instead of crashing.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  for (const [c, s] of [[0, 0], [2, 0], [3, 1]]) {
    const r = await p.evaluate(([c, s]) => { __hs.startStage(c, s, true); const L = __hs.L, P = __hs.P, o = L.obs.find(o => ['log', 'rock', 'stump', 'crate', 'sled'].includes(o.k) && o.x > 2000);
      const x = o.x - 6, gy = L.gy[Math.floor(x / 10)]; P.x = x; P.y = gy - o.h - 30; P.ground = false; P.vx = 60; P.vy = 300; P.rot = 0; P.inv = 0; return o.k; }, [c, s]);
    await p.waitForTimeout(400);
    console.log(c, s, r, await p.evaluate(() => JSON.stringify({ crashes: __hs.L.crashes, score: __hs.L.score })));
  }
  console.log('errors', errs); await b.close();
})();
