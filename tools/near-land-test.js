// Lands Arlo just in front of a rock or log and checks he hops it instead of crashing.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  for (const [c, s] of [[0, 0], [2, 0], [3, 1], [0, 1]]) {
    const r = await p.evaluate(([c, s]) => { __hs.startStage(c, s, true); const L = __hs.L, P = __hs.P, o = L.obs.find(o => ['log', 'rock', 'stump', 'crate', 'sled'].includes(o.k) && o.x > 2000);
      const x = o.x - o.w / 2 - 40, gy = L.gy[Math.floor(x / 10)]; P.x = x; P.y = gy - 25; P.ground = false; P.vx = 450; P.vy = 250; P.rot = 0.2; P.inv = 0; return o.k; }, [c, s]);
    await p.waitForTimeout(700);
    console.log(c, s, r, await p.evaluate(() => JSON.stringify({ crashes: __hs.L.crashes })));
  }
  console.log('errors', errs); await b.close();
})();
